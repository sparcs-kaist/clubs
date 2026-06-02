import { ActivityDurationService } from "./activity-duration.service";

const ACTIVITY_DURATION_ID = 30;
const ACTIVITY_DURATION = {
  id: ACTIVITY_DURATION_ID,
  semester: { id: 19 },
};

function createService({
  activityCount = 0,
  fundingCount = 0,
  deadlines = [],
}: {
  activityCount?: number;
  fundingCount?: number;
  deadlines?: unknown[];
} = {}) {
  const activityDurationRepository = {
    find: jest.fn().mockResolvedValue([ACTIVITY_DURATION]),
    delete: jest.fn().mockResolvedValue(undefined),
    countActivitiesByDurationId: jest.fn().mockResolvedValue(activityCount),
    countFundingsByDurationId: jest.fn().mockResolvedValue(fundingCount),
  };
  const activityDeadlineRepository = {
    find: jest.fn().mockResolvedValue(deadlines),
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

describe("ActivityDurationService.deleteActivityDuration", () => {
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
});
