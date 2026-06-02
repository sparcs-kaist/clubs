import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import FundingService from "./funding.service";

type FundingServiceDependencies = ConstructorParameters<typeof FundingService>;

const activityDuration = { id: 301, semester: { id: 1 } };
const division = { id: 601, name: "분과" };
const club = { id: 201, name: "동아리", division };
const chargedExecutive = {
  id: 101,
  name: "담당자",
  studentNumber: "20241001",
};
const latestCommentedExecutive = {
  id: 102,
  name: "최종 검토자",
  studentNumber: "20241002",
};
const funding = {
  id: 401,
  name: "지원금 항목",
  expenditureAmount: 10000,
  approvedAmount: 8000,
  fundingStatusEnum: FundingStatusEnum.Approved,
  purposeActivity: { id: 501 },
  club: { id: club.id },
  chargedExecutive: { id: chargedExecutive.id },
  commentedExecutive: { id: latestCommentedExecutive.id },
};
const activity = { id: 501, name: "활동" };

const createFundingService = () => {
  const fundingRepository = {
    fetchSummaries: jest.fn(),
    fetchCommentedSummaries: jest.fn(),
  };
  const fundingCommentRepository = {
    find: jest.fn(),
  };
  const userPublicService = {
    checkCurrentExecutive: jest.fn().mockResolvedValue(undefined),
    fetchExecutiveSummaries: jest
      .fn()
      .mockResolvedValue([chargedExecutive, latestCommentedExecutive]),
    findExecutiveSummary: jest.fn().mockResolvedValue(chargedExecutive),
  };
  const clubPublicService = {
    fetchSummary: jest.fn().mockResolvedValue(club),
    fetchSummaries: jest.fn().mockResolvedValue([club]),
    fetchDivisionSummaries: jest.fn().mockResolvedValue([division]),
  };
  const activityPublicService = {
    fetchSummaries: jest.fn().mockResolvedValue([activity]),
  };
  const semesterPublicService = {
    loadId: jest.fn(),
  };
  const activityDurationPublicService = {
    load: jest.fn().mockResolvedValue(activityDuration),
  };

  const service = new FundingService(
    fundingRepository as FundingServiceDependencies[0],
    fundingCommentRepository as FundingServiceDependencies[1],
    {} as FundingServiceDependencies[2],
    userPublicService as FundingServiceDependencies[3],
    clubPublicService as FundingServiceDependencies[4],
    activityPublicService as FundingServiceDependencies[5],
    semesterPublicService as FundingServiceDependencies[6],
    activityDurationPublicService as FundingServiceDependencies[7],
    {} as FundingServiceDependencies[8],
    {} as FundingServiceDependencies[9],
    {} as FundingServiceDependencies[10],
  );

  return {
    service,
    fundingRepository,
    fundingCommentRepository,
    clubPublicService,
    activityDurationPublicService,
  };
};

describe("FundingService historical semester club summaries", () => {
  it("loads executive dashboard club summaries for the requested semester", async () => {
    const {
      service,
      fundingRepository,
      clubPublicService,
      activityDurationPublicService,
    } = createFundingService();
    const semesterId = 7;
    activityDurationPublicService.load.mockResolvedValue({
      ...activityDuration,
      semester: { id: semesterId },
    });
    fundingRepository.fetchSummaries.mockResolvedValue([funding]);

    await service.getExecutiveFundings(chargedExecutive.id, { semesterId });

    expect(clubPublicService.fetchSummaries).toHaveBeenCalledWith(
      [club.id],
      [semesterId],
    );
  });

  it("returns the requested semester club summary for club brief", async () => {
    const { service, fundingRepository, clubPublicService } =
      createFundingService();
    const semesterId = 7;
    const currentClub = { ...club, name: "현재 동아리" };
    const historicalClub = { ...club, name: "과거 동아리" };
    fundingRepository.fetchSummaries.mockResolvedValue([funding]);
    clubPublicService.fetchSummary.mockResolvedValue(currentClub);
    clubPublicService.fetchSummaries.mockResolvedValue([historicalClub]);

    const result = await service.getExecutiveFundingsClubBrief(
      chargedExecutive.id,
      { clubId: club.id },
      { semesterId },
    );

    expect(result.club).toEqual(historicalClub);
    expect(clubPublicService.fetchSummaries).toHaveBeenCalledWith(
      [club.id],
      [semesterId],
    );
  });
});

describe("FundingService final commented executive", () => {
  it("uses the latest funding feedback by descending id for club brief", async () => {
    const { service, fundingRepository, fundingCommentRepository } =
      createFundingService();
    fundingRepository.fetchSummaries.mockResolvedValue([funding]);

    const result = await service.getExecutiveFundingsClubBrief(
      chargedExecutive.id,
      { clubId: club.id },
      { semesterId: 1 },
    );

    expect(fundingCommentRepository.find).not.toHaveBeenCalled();
    expect(result.fundings[0].commentedExecutive).toEqual(
      latestCommentedExecutive,
    );
  });

  it("uses the latest funding feedback by descending id for executive brief", async () => {
    const { service, fundingRepository, fundingCommentRepository } =
      createFundingService();
    fundingRepository.fetchCommentedSummaries.mockResolvedValue([funding]);

    const result = await service.getExecutiveFundingsExecutiveBrief(
      chargedExecutive.id,
      { executiveId: chargedExecutive.id },
    );

    expect(fundingCommentRepository.find).not.toHaveBeenCalled();
    expect(result.fundings[0].commentedExecutive).toEqual(
      latestCommentedExecutive,
    );
  });
});
