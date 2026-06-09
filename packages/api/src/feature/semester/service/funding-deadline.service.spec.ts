import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";
import { FundingDeadlineEnum } from "@clubs/domain/semester/deadline";

import { FundingDeadlineService } from "./funding-deadline.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

const EXECUTIVE_ID = 7;
const ACTIVITY_D_ID = 30;
const ACTIVITY_DURATION = {
  id: ACTIVITY_D_ID,
  semester: { id: 19 },
  activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
  year: 2026,
  name: "봄 정규",
  startTerm: new Date("2026-03-01T00:00:00.000Z"),
  endTerm: new Date("2026-06-30T14:59:00.000Z"),
};

function createService() {
  const activityDurationRepository = {
    find: jest.fn().mockResolvedValue([ACTIVITY_DURATION]),
  };
  const fundingDeadlineRepository = {};
  const fundingDeadlineSqlRepository = {
    checkExistingFundingDeadline: jest.fn().mockResolvedValue(false),
    createFundingDeadline: jest.fn().mockResolvedValue(true),
    getFundingDeadlines: jest.fn().mockResolvedValue([]),
  };
  const semesterRepository = {};
  const userPublicService = {
    checkCurrentExecutiveById: jest.fn().mockResolvedValue(undefined),
  };

  const service = new FundingDeadlineService(
    activityDurationRepository as never,
    fundingDeadlineRepository as never,
    fundingDeadlineSqlRepository as never,
    semesterRepository as never,
    userPublicService as never,
  );

  return {
    activityDurationRepository,
    fundingDeadlineSqlRepository,
    service,
    userPublicService,
  };
}

describe("FundingDeadlineService", () => {
  it("creates funding deadlines through regular activity durations only", async () => {
    const {
      activityDurationRepository,
      fundingDeadlineSqlRepository,
      service,
    } = createService();
    const startTerm = new Date("2026-03-10T00:00:00.000Z");
    const endTerm = new Date("2026-03-20T00:00:00.000Z");

    await expect(
      service.createFundingDeadline(EXECUTIVE_ID, {
        activityDId: ACTIVITY_D_ID,
        deadlineEnum: FundingDeadlineEnum.Writing,
        startTerm,
        endTerm,
      }),
    ).resolves.toEqual({});

    expect(activityDurationRepository.find).toHaveBeenCalledWith({
      id: ACTIVITY_D_ID,
      activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
    });
    expect(
      fundingDeadlineSqlRepository.checkExistingFundingDeadline,
    ).toHaveBeenCalledWith(ACTIVITY_DURATION.semester.id, startTerm, endTerm);
  });

  it("lists funding deadlines through regular activity durations only", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(service.getFundingDeadlines(EXECUTIVE_ID)).resolves.toEqual({
      deadlines: [],
    });

    expect(activityDurationRepository.find).toHaveBeenCalledWith({
      activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
    });
  });

  it("filters funding deadline lookup to a regular activity duration", async () => {
    const { activityDurationRepository, service } = createService();

    await expect(
      service.getFundingDeadlines(EXECUTIVE_ID, ACTIVITY_D_ID),
    ).resolves.toEqual({ deadlines: [] });

    expect(activityDurationRepository.find).toHaveBeenCalledWith({
      id: ACTIVITY_D_ID,
      activityDurationTypeEnum: ActivityDurationTypeEnum.Regular,
    });
  });
});
