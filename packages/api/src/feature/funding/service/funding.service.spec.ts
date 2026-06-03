import {
  FundingDeadlineEnum,
  FundingStatusEnum,
} from "@clubs/interface/common/enum/funding.enum";

import FundingService from "./funding.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

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
  activityD: { id: activityDuration.id },
  expenditureAmount: 10000,
  approvedAmount: 8000,
  fundingStatusEnum: FundingStatusEnum.Approved,
  purposeActivity: { id: 501 },
  club: { id: club.id },
  chargedExecutive: { id: chargedExecutive.id },
  commentedExecutive: { id: latestCommentedExecutive.id },
};
const activity = { id: 501, name: "활동" };
const studentId = 701;
const now = new Date("2026-02-01");
const fundingBody = {
  club: { id: club.id },
  expenditureDate: new Date("2026-01-15"),
};

const createFundingService = () => {
  const fundingRepository = {
    insert: jest.fn().mockResolvedValue({ id: funding.id }),
    put: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    fetch: jest.fn().mockResolvedValue(funding),
    fetchSummaries: jest.fn(),
    fetchCommentedSummaries: jest.fn(),
    patchStatusTx: jest.fn().mockResolvedValue(funding),
  };
  const fundingCommentRepository = {
    create: jest.fn().mockResolvedValue([
      {
        funding: { id: funding.id },
        approvedAmount: funding.approvedAmount,
        fundingStatusEnum: funding.fundingStatusEnum,
        isFinalComment: jest.fn().mockReturnValue(true),
      },
    ]),
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
    checkStudentDelegate: jest.fn().mockResolvedValue(undefined),
    fetchSummary: jest.fn().mockResolvedValue(club),
    fetchSummaries: jest.fn().mockResolvedValue([club]),
    fetchDivisionSummaries: jest.fn().mockResolvedValue([division]),
  };
  const activityPublicService = {
    fetchSummaries: jest.fn().mockResolvedValue([activity]),
  };
  const semesterPublicService = {
    loadId: jest.fn().mockResolvedValue(activityDuration.semester.id),
  };
  const activityDurationPublicService = {
    load: jest.fn().mockResolvedValue(activityDuration),
    getById: jest.fn().mockResolvedValue(activityDuration),
  };
  const prisma = {
    $transaction: jest.fn(async callback => callback({})),
  };
  const fundingDeadlinePublicService = {
    search: jest.fn(({ deadlineEnum }) => {
      const deadlineEnums = Array.isArray(deadlineEnum)
        ? deadlineEnum
        : [deadlineEnum];

      if (deadlineEnums.includes(FundingDeadlineEnum.Exception)) {
        return Promise.resolve([
          {
            id: 1,
            deadlineEnum: FundingDeadlineEnum.Exception,
          },
        ]);
      }

      return Promise.resolve([]);
    }),
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
    fundingDeadlinePublicService as FundingServiceDependencies[8],
    prisma as FundingServiceDependencies[9],
    {} as FundingServiceDependencies[10],
  );

  (service as unknown as { clock: { now: () => Date } }).clock = {
    now: jest.fn(() => now),
  };

  return {
    service,
    fundingRepository,
    fundingCommentRepository,
    clubPublicService,
    activityDurationPublicService,
    fundingDeadlinePublicService,
    prisma,
  };
};

describe("FundingService funding deadline validation", () => {
  it("rejects creating a funding during the exception period", async () => {
    const { service, fundingRepository, fundingDeadlinePublicService } =
      createFundingService();

    await expect(
      service.postStudentFunding(fundingBody as never, studentId),
    ).rejects.toThrow();

    expect(fundingDeadlinePublicService.search).toHaveBeenCalledWith({
      date: now,
      deadlineEnum: [FundingDeadlineEnum.Writing],
    });
    expect(fundingRepository.insert).not.toHaveBeenCalled();
  });

  it("rejects editing a funding during the exception period", async () => {
    const { service, fundingRepository, fundingDeadlinePublicService } =
      createFundingService();

    await expect(
      service.putStudentFunding(
        fundingBody as never,
        { id: funding.id },
        studentId,
      ),
    ).rejects.toThrow();

    expect(fundingDeadlinePublicService.search).toHaveBeenCalledWith({
      date: now,
      deadlineEnum: [
        FundingDeadlineEnum.Writing,
        FundingDeadlineEnum.Modification,
      ],
    });
    expect(fundingRepository.put).not.toHaveBeenCalled();
  });

  it("rejects deleting a funding during the exception period", async () => {
    const { service, fundingRepository, fundingDeadlinePublicService } =
      createFundingService();

    await expect(
      service.deleteStudentFunding(studentId, { id: funding.id }),
    ).rejects.toThrow();

    expect(fundingDeadlinePublicService.search).toHaveBeenCalledWith({
      date: now,
      deadlineEnum: [
        FundingDeadlineEnum.Writing,
        FundingDeadlineEnum.Modification,
      ],
    });
    expect(fundingRepository.delete).not.toHaveBeenCalled();
  });
});

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

  it("falls back to current club summary when requested semester summary is missing", async () => {
    const { service, fundingRepository, clubPublicService } =
      createFundingService();
    const semesterId = 7;
    const currentClub = { ...club, name: "현재 동아리" };
    fundingRepository.fetchSummaries.mockResolvedValue([funding]);
    clubPublicService.fetchSummaries.mockResolvedValue([]);
    clubPublicService.fetchSummary.mockResolvedValue(currentClub);

    const result = await service.getExecutiveFundingsClubBrief(
      chargedExecutive.id,
      { clubId: club.id },
      { semesterId },
    );

    expect(result.club).toEqual(currentClub);
    expect(clubPublicService.fetchSummary).toHaveBeenCalledWith(club.id);
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

describe("FundingService executive review semester guard", () => {
  it("rejects funding comments for fundings from another semester before feedback mutation", async () => {
    const {
      activityDurationPublicService,
      fundingCommentRepository,
      fundingRepository,
      prisma,
      service,
    } = createFundingService();
    fundingRepository.fetch.mockResolvedValueOnce({
      ...funding,
      activityD: { id: 999 },
      fundingStatusEnum: FundingStatusEnum.Applied,
    });
    activityDurationPublicService.getById.mockResolvedValueOnce({
      ...activityDuration,
      id: 999,
      semester: { id: 2 },
    });

    await expect(
      service.postExecutiveFundingComment(
        chargedExecutive.id,
        funding.id,
        FundingStatusEnum.Approved,
        funding.expenditureAmount,
        "승인합니다",
      ),
    ).rejects.toThrow("current semester");

    expect(activityDurationPublicService.getById).toHaveBeenCalledWith(999);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(fundingCommentRepository.create).not.toHaveBeenCalled();
    expect(fundingRepository.patchStatusTx).not.toHaveBeenCalled();
  });
});
