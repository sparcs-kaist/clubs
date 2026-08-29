import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";
import { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

import { ActivityDurationService } from "./activity-duration.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

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
    createActivityDuration: jest.fn().mockResolvedValue(undefined),
    findActivitiesByDurationId: jest.fn().mockResolvedValue([]),
    updateActivityDuration: jest.fn().mockResolvedValue(undefined),
    countActivitiesByDurationId: jest.fn().mockResolvedValue(activityCount),
    countFundingsByDurationId: jest.fn().mockResolvedValue(fundingCount),
    deleteActivityDuration: jest.fn().mockResolvedValue(true),
  };
  const activityDeadlineRepository = {
    find: jest.fn().mockResolvedValue(deadlines),
    createActivityDeadline: jest.fn().mockResolvedValue({}),
  };
  const semesterRepository = {
    find: jest.fn().mockResolvedValue([{ id: ACTIVITY_DURATION.semester.id }]),
  };

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
    expect(
      activityDeadlineRepository.createActivityDeadline,
    ).toHaveBeenCalledWith({
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
    expect(
      activityDurationRepository.deleteActivityDuration,
    ).toHaveBeenCalledWith(ACTIVITY_DURATION_ID);
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

    expect(
      activityDurationRepository.deleteActivityDuration,
    ).not.toHaveBeenCalled();
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

    expect(
      activityDurationRepository.deleteActivityDuration,
    ).not.toHaveBeenCalled();
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
    expect(
      activityDurationRepository.deleteActivityDuration,
    ).not.toHaveBeenCalled();
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
    expect(
      activityDurationRepository.deleteActivityDuration,
    ).toHaveBeenCalledWith(ACTIVITY_DURATION_ID);
  });
});

describe("ActivityDurationService regular term weekday validation", () => {
  const validStartTerm = new Date("2026-06-19T15:00:00.000Z");
  const validEndTerm = new Date("2026-12-18T14:59:59.000Z");

  const regularBody = {
    semesterId: ACTIVITY_DURATION.semester.id,
    activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
    year: 2026,
    name: "여름-가을",
    startTerm: validStartTerm,
    endTerm: validEndTerm,
  };

  it("creates a regular activity duration from Saturday through Friday", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(service.createActivityDuration(regularBody)).resolves.toEqual(
      {},
    );
    expect(
      activityDurationRepository.createActivityDuration,
    ).toHaveBeenCalled();
  });

  it.each([
    ["start", new Date("2026-06-20T15:00:00.000Z"), validEndTerm],
    ["end", validStartTerm, new Date("2026-12-19T14:59:59.000Z")],
  ])(
    "rejects a regular activity duration with an invalid %s weekday",
    async (_, startTerm, endTerm) => {
      const { activityDurationRepository, service } = createService();

      await expect(
        service.createActivityDuration({
          ...regularBody,
          startTerm,
          endTerm,
        }),
      ).rejects.toThrow(
        "정규 활동반기 시작일은 토요일, 종료일은 금요일이어야 합니다.",
      );
      expect(
        activityDurationRepository.createActivityDuration,
      ).not.toHaveBeenCalled();
    },
  );

  it("does not apply the weekday rule to registration activity durations", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(
      service.createActivityDuration({
        ...regularBody,
        activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
        startTerm: new Date("2026-06-21T15:00:00.000Z"),
      }),
    ).resolves.toEqual({});
    expect(
      activityDurationRepository.createActivityDuration,
    ).toHaveBeenCalled();
  });

  it("validates weekdays when updating a regular activity duration", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(
      service.updateActivityDuration(ACTIVITY_DURATION_ID, {
        startTerm: new Date("2026-06-20T15:00:00.000Z"),
        endTerm: validEndTerm,
      }),
    ).rejects.toThrow(
      "정규 활동반기 시작일은 토요일, 종료일은 금요일이어야 합니다.",
    );
    expect(
      activityDurationRepository.updateActivityDuration,
    ).not.toHaveBeenCalled();
  });
});
