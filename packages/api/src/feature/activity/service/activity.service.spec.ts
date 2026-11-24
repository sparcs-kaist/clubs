import { ForbiddenException, HttpStatus } from "@nestjs/common";

import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";
import { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

import ActivityOldService from "./activity.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

const firstActivity = { id: 1, clubId: 10, activityDId: 20 };
const secondActivity = { ...firstActivity, id: 2 };
const earlierWritingEnd = new Date("2026-04-01T15:00:00.000Z");
const latestWritingEnd = new Date("2026-04-02T15:00:00.000Z");
const justBeforeDeadline = new Date(latestWritingEnd.getTime() - 1);
const afterDeadline = new Date(latestWritingEnd.getTime() + 1);

function createService(now = afterDeadline) {
  const activityRepository = {
    selectActivityByIds: jest.fn().mockResolvedValue([firstActivity]),
    recordProfessorActivityApprovals: jest.fn().mockResolvedValue(undefined),
  };
  const clubPublicService = {
    checkIsProfessor: jest.fn().mockResolvedValue(undefined),
  };
  const activityDeadlinePublicService = {
    search: jest
      .fn()
      .mockResolvedValue([
        { endTerm: latestWritingEnd },
        { endTerm: earlierWritingEnd },
      ]),
  };
  const activityDurationPublicService = {
    load: jest.fn().mockResolvedValue({ id: 20, semester: { id: 30 } }),
  };
  const unusedDependency = {} as never;
  const service = new ActivityOldService(
    unusedDependency,
    clubPublicService as never,
    unusedDependency,
    unusedDependency,
    unusedDependency,
    activityDeadlinePublicService as never,
    activityDurationPublicService as never,
    activityRepository as never,
    unusedDependency,
    unusedDependency,
  );
  Object.assign(service, { clock: { now: () => now } });
  return {
    activityRepository,
    activityDeadlinePublicService,
    clubPublicService,
    service,
  };
}

describe("professor activity approval", () => {
  it.each([
    { now: justBeforeDeadline, status: ProfessorApprovalStatus.Approved },
    { now: latestWritingEnd, status: ProfessorApprovalStatus.LateApproved },
    { now: afterDeadline, status: ProfessorApprovalStatus.LateApproved },
  ])("stores $status for an approval at $now", async ({ now, status }) => {
    const { activityRepository, activityDeadlinePublicService, service } =
      createService(now);

    await service.postProfessorActivityApprove([firstActivity.id], 7);

    expect(activityDeadlinePublicService.search).toHaveBeenCalledWith({
      semesterId: 30,
      deadlineEnum: ActivityDeadlineEnum.Writing,
    });
    expect(
      activityRepository.recordProfessorActivityApprovals,
    ).toHaveBeenCalledWith({
      activityIds: [firstActivity.id],
      clubId: firstActivity.clubId,
      activityDId: firstActivity.activityDId,
      professorId: 7,
      approvalStatus: status,
      approvedAt: now,
    });
  });

  it("uses the same late policy for a batch and deduplicates activity IDs", async () => {
    const { activityRepository, service } = createService();
    activityRepository.selectActivityByIds.mockResolvedValue([
      secondActivity,
      firstActivity,
    ]);

    await service.postProfessorActivityApprove([2, 1, 2], 7);

    expect(activityRepository.selectActivityByIds).toHaveBeenCalledWith([1, 2]);
    expect(
      activityRepository.recordProfessorActivityApprovals,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        activityIds: [1, 2],
        approvalStatus: ProfessorApprovalStatus.LateApproved,
        approvedAt: afterDeadline,
      }),
    );
  });

  it("classifies approvals as on time when the writing schedule is missing", async () => {
    const { activityRepository, activityDeadlinePublicService, service } =
      createService();
    activityDeadlinePublicService.search.mockResolvedValue([]);

    await service.postProfessorActivityApprove([firstActivity.id], 7);

    expect(
      activityRepository.recordProfessorActivityApprovals,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalStatus: ProfessorApprovalStatus.Approved,
      }),
    );
  });

  it.each([
    { rows: [], status: HttpStatus.NOT_FOUND },
    {
      rows: [firstActivity, { ...secondActivity, clubId: 11 }],
      status: HttpStatus.BAD_REQUEST,
    },
    {
      rows: [firstActivity, { ...secondActivity, activityDId: 19 }],
      status: HttpStatus.BAD_REQUEST,
    },
  ])(
    "rejects invalid batches before writing with status $status",
    async ({ rows, status }) => {
      const { activityRepository, service } = createService();
      activityRepository.selectActivityByIds.mockResolvedValue(rows);

      await expect(
        service.postProfessorActivityApprove([1, 2], 7),
      ).rejects.toMatchObject({
        status,
      });
      expect(
        activityRepository.recordProfessorActivityApprovals,
      ).not.toHaveBeenCalled();
    },
  );

  it("rejects an empty batch before looking up any activities", async () => {
    const { activityRepository, service } = createService();

    await expect(
      service.postProfessorActivityApprove([], 7),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
    expect(activityRepository.selectActivityByIds).not.toHaveBeenCalled();
  });

  it("checks the current advisor before writing approvals", async () => {
    const { activityRepository, clubPublicService, service } = createService();
    clubPublicService.checkIsProfessor.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      service.postProfessorActivityApprove([firstActivity.id], 7),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
    expect(clubPublicService.checkIsProfessor).toHaveBeenCalledWith({
      professorId: 7,
      clubId: firstActivity.clubId,
      date: afterDeadline,
    });
    expect(
      activityRepository.recordProfessorActivityApprovals,
    ).not.toHaveBeenCalled();
  });
});
