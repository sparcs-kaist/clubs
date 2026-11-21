import { ConflictException, NotFoundException } from "@nestjs/common";

import {
  ActivityStatusEnum,
  ProfessorApprovalStatus,
} from "@clubs/domain/activity/activity";

import { ActivityNewRepository } from "./activity.new.repository";

describe("ActivityNewRepository", () => {
  describe("recordProfessorActivityApprovals", () => {
    const approval = {
      activityIds: [1, 2],
      activityDId: 3,
      clubId: 4,
      professorId: 5,
      approvalStatus: ProfessorApprovalStatus.LateApproved,
      approvedAt: new Date("2026-04-02T15:00:00.000Z"),
    } as const;

    function createApprovalRepository() {
      const tx = {
        activity: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findFirst: jest.fn().mockResolvedValue({
            professorApprovalStatus: ProfessorApprovalStatus.Approved,
          }),
        },
        activityProfessorApprovalLog: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      const repository = new ActivityNewRepository({ tx } as never);
      return { repository, tx };
    }

    it("logs only changed reports and preserves an earlier approval", async () => {
      const { repository, tx } = createApprovalRepository();
      tx.activity.updateMany.mockResolvedValueOnce({ count: 0 });

      await repository.recordProfessorActivityApprovals({
        ...approval,
        activityIds: [1, 2],
      });

      const scope = { id: 1, activityDId: 3, clubId: 4, deletedAt: null };
      expect(tx.activity.updateMany).toHaveBeenNthCalledWith(1, {
        where: {
          ...scope,
          professorApprovalStatus: ProfessorApprovalStatus.Pending,
        },
        data: {
          professorApprovalStatus: approval.approvalStatus,
          professorApprovedAt: approval.approvedAt,
        },
      });
      expect(tx.activity.findFirst).toHaveBeenCalledWith({
        where: scope,
        select: { professorApprovalStatus: true },
      });
      expect(tx.activityProfessorApprovalLog.createMany).toHaveBeenCalledWith({
        data: [
          {
            activityId: 2,
            professorId: approval.professorId,
            approvalStatus: approval.approvalStatus,
            approvedAt: approval.approvedAt,
          },
        ],
      });
    });

    it("leaves the audit table untouched when every report is already approved", async () => {
      const { repository, tx } = createApprovalRepository();
      tx.activity.updateMany.mockResolvedValue({ count: 0 });

      await repository.recordProfessorActivityApprovals({
        ...approval,
        activityIds: [1, 2],
      });

      expect(tx.activityProfessorApprovalLog.createMany).not.toHaveBeenCalled();
    });

    it.each([
      { state: null, error: NotFoundException },
      {
        state: { professorApprovalStatus: ProfessorApprovalStatus.Pending },
        error: ConflictException,
      },
    ])(
      "aborts the transaction when a target is no longer approvable",
      async ({ state, error }) => {
        const { repository, tx } = createApprovalRepository();
        tx.activity.updateMany
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 });
        tx.activity.findFirst.mockResolvedValueOnce(state);

        await expect(
          repository.recordProfessorActivityApprovals({
            ...approval,
            activityIds: [1, 2],
          }),
        ).rejects.toThrow(error);

        expect(
          tx.activityProfessorApprovalLog.createMany,
        ).not.toHaveBeenCalled();
      },
    );

    it("propagates a log insert error from to the transaction boundary", async () => {
      const { repository, tx } = createApprovalRepository();
      tx.activityProfessorApprovalLog.createMany.mockRejectedValue(
        new Error("log unavailable"),
      );

      await expect(
        repository.recordProfessorActivityApprovals({
          ...approval,
          activityIds: [1],
        }),
      ).rejects.toThrow("log unavailable");
    });
  });

  describe("approveExecutiveActivity", () => {
    it("updates approval metadata without excluding already approved activities", async () => {
      const commentedAt = new Date("2026-05-03T12:00:00.000Z");
      const updatedAt = new Date("2026-05-03T12:00:01.000Z");
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const repository = Object.assign(
        new ActivityNewRepository({
          tx: {
            activity: {
              updateMany,
            },
          },
        } as never),
        {
          clock: {
            now: () => updatedAt,
          },
        },
      );

      const result = await repository.approveExecutiveActivity({
        activityId: 42,
        commentedAt,
        commentedExecutiveId: 7,
      });

      expect(result).toBe(true);
      expect(updateMany).toHaveBeenCalledWith({
        where: {
          id: 42,
          deletedAt: null,
        },
        data: {
          activityStatusEnumId: ActivityStatusEnum.Approved,
          commentedAt,
          commentedExecutiveId: 7,
          updatedAt,
        },
      });
    });
  });
});
