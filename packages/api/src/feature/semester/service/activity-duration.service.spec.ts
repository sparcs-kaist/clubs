import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";
import { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

import { ActivityDurationService } from "./activity-duration.service";

const ACTIVITY_DURATION_ID = 30;
type ActivityDurationStub = {
  id: number;
  semester: { id: number };
  activityDurationTypeEnum: ActivityDurationTypeEnum;
};

const ACTIVITY_DURATION: ActivityDurationStub = {
  id: ACTIVITY_DURATION_ID,
  semester: { id: 19 },
  activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
};

function createService({
  activityDuration = ACTIVITY_DURATION,
  activityCount = 0,
  fundingCount = 0,
  deadlines = [],
}: {
  activityDuration?: ActivityDurationStub;
  activityCount?: number;
  fundingCount?: number;
  deadlines?: unknown[];
} = {}) {
  const activityDurationRepository = {
    find: jest.fn().mockResolvedValue([activityDuration]),
    delete: jest.fn().mockResolvedValue(undefined),
    countActivitiesByDurationId: jest.fn().mockResolvedValue(activityCount),
    countFundingsByDurationId: jest.fn().mockResolvedValue(fundingCount),
  };
  const activityDeadlineRepository = {
    find: jest.fn().mockResolvedValue(deadlines),
    create: jest.fn().mockResolvedValue([]),
  };
  const semesterRepository = {};

  const service = new ActivityDurationService(
    activityDurationRepository as never,
    activityDeadlineRepository as never,
    semesterRepository as never,
  );

  return {
    activityDeadlineRepository,
    activityDurationRepository,
    service,
  };
}

describe("ActivityDurationService deadline and deletion handling", () => {
  it("creates activity deadlines through regular activity durations only", async () => {
    const { activityDeadlineRepository, activityDurationRepository, service } =
      createService();
    const startTerm = new Date("2026-03-10T00:00:00.000Z");
    const endTerm = new Date("2026-03-20T00:00:00.000Z");

    await expect(
      service.createActivityDeadline({
        body: {
          activityDId: ACTIVITY_DURATION_ID,
          deadlineEnum: ActivityDeadlineEnum.Writing,
          startTerm,
          endTerm,
        },
      }),
    ).resolves.toEqual({});

    expect(activityDurationRepository.find).toHaveBeenCalledWith({
      id: ACTIVITY_DURATION_ID,
      activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
    });
    expect(activityDeadlineRepository.create).toHaveBeenCalledWith({
      semester: { id: ACTIVITY_DURATION.semester.id },
      deadlineEnum: ActivityDeadlineEnum.Writing,
      startTerm,
      endTerm,
    });
  });

  it("lists activity deadlines through regular activity durations only", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(service.getActivityDeadlines({ query: {} })).resolves.toEqual({
      deadlines: [],
    });

    expect(activityDurationRepository.find).toHaveBeenCalledWith({
      activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
    });
  });

  it("filters an activity deadline lookup to a regular activity duration", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(
      service.getActivityDeadlines({
        query: { activityDId: ACTIVITY_DURATION_ID },
      }),
    ).resolves.toEqual({ deadlines: [] });

    expect(activityDurationRepository.find).toHaveBeenCalledWith({
      id: ACTIVITY_DURATION_ID,
      activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
    });
  });

  it("deletes an activity duration when there are no active references", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(
      service.deleteActivityDuration(ACTIVITY_DURATION_ID),
    ).resolves.toEqual({});

    expect(
      activityDurationRepository.countActivitiesByDurationId,
    ).toHaveBeenCalledWith(ACTIVITY_DURATION_ID);
    expect(
      activityDurationRepository.countFundingsByDurationId,
    ).toHaveBeenCalledWith(ACTIVITY_DURATION_ID);
    expect(activityDurationRepository.delete).toHaveBeenCalledWith({
      id: ACTIVITY_DURATION_ID,
    });
  });

  it("does not delete an activity duration with active activities", async () => {
    const { activityDurationRepository, service } = createService({
      activityCount: 1,
    });

    await expect(
      service.deleteActivityDuration(ACTIVITY_DURATION_ID),
    ).rejects.toThrow(
      "활동반기에 연결된 활동보고서가 있어 삭제할 수 없습니다.",
    );

    expect(activityDurationRepository.delete).not.toHaveBeenCalled();
  });

  it("does not delete an activity duration with active fundings", async () => {
    const { activityDurationRepository, service } = createService({
      fundingCount: 1,
    });

    await expect(
      service.deleteActivityDuration(ACTIVITY_DURATION_ID),
    ).rejects.toThrow(
      "활동반기에 연결된 지원금 신청이 있어 삭제할 수 없습니다.",
    );

    expect(activityDurationRepository.delete).not.toHaveBeenCalled();
  });

  it("does not check activities or fundings when deadlines exist", async () => {
    const { activityDurationRepository, service } = createService({
      deadlines: [{ id: 1 }],
    });

    await expect(
      service.deleteActivityDuration(ACTIVITY_DURATION_ID),
    ).rejects.toThrow(
      "활동반기에 연결된 활동보고서 기한이 있어 삭제할 수 없습니다.",
    );

    expect(
      activityDurationRepository.countActivitiesByDurationId,
    ).not.toHaveBeenCalled();
    expect(
      activityDurationRepository.countFundingsByDurationId,
    ).not.toHaveBeenCalled();
    expect(activityDurationRepository.delete).not.toHaveBeenCalled();
  });

  it("does not block registration activity duration deletion with regular activity deadlines", async () => {
    const { activityDeadlineRepository, activityDurationRepository, service } =
      createService({
        activityDuration: {
          ...ACTIVITY_DURATION,
          activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
        },
        deadlines: [{ id: 1 }],
      });

    await expect(
      service.deleteActivityDuration(ACTIVITY_DURATION_ID),
    ).resolves.toEqual({});

    expect(activityDeadlineRepository.find).not.toHaveBeenCalled();
    expect(activityDurationRepository.delete).toHaveBeenCalledWith({
      id: ACTIVITY_DURATION_ID,
    });
  });
});
