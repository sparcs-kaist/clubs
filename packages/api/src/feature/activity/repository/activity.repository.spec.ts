import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

import ActivityRepository from "./activity.repository";

jest.mock("@sparcs-clubs/api/env", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

describe("ActivityRepository", () => {
  describe("fetchCommentedSummaries", () => {
    it("returns the latest reviewer even when filtering by the first reviewer", async () => {
      const firstReviewerId = 7;
      const finalReviewerId = 8;
      const now = new Date("2026-08-28T00:00:00.000Z");
      const findMany = jest.fn().mockResolvedValue([
        {
          id: 42,
          activityStatusEnumId: ActivityStatusEnum.Approved,
          activityTypeEnumId: ActivityTypeEnum.matchedInternalActivity,
          clubId: 3,
          name: "weekly seminar",
          commentedAt: now,
          editedAt: now,
          updatedAt: now,
          chargedExecutiveId: firstReviewerId,
          activityFeedbacks: [{ executiveId: finalReviewerId }],
        },
      ]);
      const repository = new ActivityRepository({
        activity: { findMany },
      } as unknown as ConstructorParameters<typeof ActivityRepository>[0]);

      const [result] =
        await repository.fetchCommentedSummaries(firstReviewerId);

      expect(findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          activityFeedbacks: {
            where: { deletedAt: null },
            orderBy: { id: "desc" },
            take: 1,
            select: { executiveId: true },
          },
        }),
        where: {
          deletedAt: null,
          OR: [
            { chargedExecutiveId: firstReviewerId },
            {
              activityFeedbacks: {
                some: { executiveId: firstReviewerId, deletedAt: null },
              },
            },
          ],
        },
      });
      expect(result.commentedExecutive).toEqual({ id: finalReviewerId });
    });
  });

  describe("insertActivity", () => {
    it("creates an activity report without a professor sign status dependency", async () => {
      const tx = {
        activity: {
          create: jest.fn().mockResolvedValue({ id: 42 }),
        },
        activityParticipant: {
          create: jest.fn().mockResolvedValue({}),
        },
        activityT: {
          create: jest.fn().mockResolvedValue({}),
        },
        activityEvidenceFile: {
          create: jest.fn().mockResolvedValue({}),
        },
      };
      const prisma = {
        $transaction: jest.fn(async callback => callback(tx)),
      };
      const repository = new ActivityRepository(
        prisma as unknown as ConstructorParameters<
          typeof ActivityRepository
        >[0],
      );
      const startTerm = new Date("2026-03-01T00:00:00.000Z");
      const endTerm = new Date("2026-03-31T00:00:00.000Z");

      const result = await repository.insertActivity({
        clubId: 7,
        name: "weekly seminar",
        activityTypeEnumId: ActivityTypeEnum.notMatchedActivity,
        duration: [{ startTerm, endTerm }],
        location: "N1",
        purpose: "study",
        detail: "weekly seminar detail",
        evidence: "evidence",
        evidenceFileIds: ["file-1"],
        participantIds: [1001],
        activityDId: 3,
      });

      expect(result).toBe(true);
      expect(tx.activity.create).toHaveBeenCalledTimes(1);
      expect(tx.activityParticipant.create).toHaveBeenCalledTimes(1);
      expect(tx.activityT.create).toHaveBeenCalledTimes(1);
      expect(tx.activityEvidenceFile.create).toHaveBeenCalledTimes(1);
    });
  });
});
