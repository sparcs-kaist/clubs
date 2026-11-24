import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";
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
  name: funding.name,
  purposeActivity: { id: activity.id },
  isFoodExpense: false,
  expenditureDate: new Date("2026-01-15"),
};

const createFundingService = () => {
  const fundingRepository = {
    insert: jest.fn().mockResolvedValue({ id: funding.id }),
    put: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    fetch: jest.fn().mockResolvedValue(funding),
    fetchForUpdate: jest.fn().mockResolvedValue(funding),
    recordChangeHistory: jest.fn().mockResolvedValue(undefined),
    fetchSummaries: jest.fn(),
    fetchCommentedSummaries: jest.fn(),
    updateChargedExecutive: jest.fn().mockResolvedValue(1),
    patchStatus: jest.fn().mockResolvedValue(funding),
  };
  const fundingCommentRepository = {
    createExecutiveReviewComment: jest.fn().mockResolvedValue({
      funding: { id: funding.id },
      approvedAmount: funding.approvedAmount,
      fundingStatusEnum: funding.fundingStatusEnum,
      isFinalComment: jest.fn().mockReturnValue(true),
    }),
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
    fetchSummary: jest.fn().mockResolvedValue({
      ...activity,
      activityTypeEnum: ActivityTypeEnum.matchedInternalActivity,
    }),
    fetchSummaries: jest.fn().mockResolvedValue([activity]),
  };
  const semesterPublicService = {
    loadId: jest.fn().mockResolvedValue(activityDuration.semester.id),
  };
  const activityDurationPublicService = {
    load: jest.fn().mockResolvedValue(activityDuration),
    loadId: jest.fn().mockResolvedValue(activityDuration.id),
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
    userPublicService,
    clubPublicService,
    activityDurationPublicService,
    activityPublicService,
    fundingDeadlinePublicService,
    prisma,
  };
};

describe("FundingService charged executive updates", () => {
  it("updates selected fundings before returning success", async () => {
    const { service, fundingRepository, userPublicService } =
      createFundingService();
    const selectedFundings = [funding, { ...funding, id: 402 }];
    fundingRepository.fetchSummaries.mockResolvedValue(selectedFundings);

    await service.patchExecutiveFundingsChargedExecutive(chargedExecutive.id, {
      fundingIds: selectedFundings.map(item => item.id),
      executiveId: latestCommentedExecutive.id,
    });

    expect(userPublicService.checkCurrentExecutive).toHaveBeenNthCalledWith(
      1,
      chargedExecutive.id,
    );
    expect(userPublicService.checkCurrentExecutive).toHaveBeenNthCalledWith(
      2,
      latestCommentedExecutive.id,
    );
    expect(fundingRepository.updateChargedExecutive).toHaveBeenCalledWith(
      selectedFundings,
      latestCommentedExecutive.id,
    );
  });

  it("updates all current activity-duration fundings for selected clubs", async () => {
    const { service, fundingRepository, activityDurationPublicService } =
      createFundingService();
    const selectedClubIds = [club.id, 202];
    const selectedFundings = [funding, { ...funding, id: 402 }];
    fundingRepository.fetchSummaries.mockResolvedValue(selectedFundings);

    await service.patchExecutiveFundingsClubsChargedExecutive(
      chargedExecutive.id,
      {
        clubIds: selectedClubIds,
        executiveId: latestCommentedExecutive.id,
      },
    );

    expect(activityDurationPublicService.loadId).toHaveBeenCalledTimes(1);
    expect(fundingRepository.fetchSummaries).toHaveBeenCalledWith(
      selectedClubIds,
      activityDuration.id,
    );
    expect(fundingRepository.updateChargedExecutive).toHaveBeenCalledWith(
      selectedFundings,
      latestCommentedExecutive.id,
    );
  });

  it("propagates charged executive update failures", async () => {
    const { service, fundingRepository } = createFundingService();
    fundingRepository.fetchSummaries.mockResolvedValue([funding]);
    fundingRepository.updateChargedExecutive.mockRejectedValue(
      new Error("charged executive update failed"),
    );

    await expect(
      service.patchExecutiveFundingsChargedExecutive(chargedExecutive.id, {
        fundingIds: [funding.id],
        executiveId: latestCommentedExecutive.id,
      }),
    ).rejects.toThrow("charged executive update failed");
  });
});

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

describe("FundingService student funding restrictions", () => {
  it.each([
    [FundingDeadlineEnum.Modification, "새 항목명", false],
    [FundingDeadlineEnum.Modification, funding.name, true],
    [FundingDeadlineEnum.Writing, "새 항목명", true],
  ])(
    "validates the funding name during period %s for %s",
    async (deadlineEnum, name, canSave) => {
      const { service, fundingRepository, fundingDeadlinePublicService } =
        createFundingService();
      fundingDeadlinePublicService.search.mockResolvedValue([
        { id: 1, deadlineEnum },
      ]);

      const save = service.putStudentFunding(
        { ...fundingBody, name } as never,
        { id: funding.id },
        studentId,
      );

      if (canSave) {
        await save;
        expect(fundingRepository.put).toHaveBeenCalledWith(
          funding.id,
          expect.objectContaining({ name }),
          expect.anything(),
        );
      } else {
        await expect(save).rejects.toThrow(
          "수정 제출 기간에는 지원금 항목명을 변경할 수 없습니다.",
        );
        expect(fundingRepository.put).not.toHaveBeenCalled();
      }
    },
  );

  it.each([
    [true, undefined],
    [false, { explanation: "식사", files: [] }],
  ])(
    "rejects food evidence for a nonconforming purpose",
    async (isFoodExpense, foodExpense) => {
      const {
        service,
        activityPublicService,
        fundingRepository,
        fundingDeadlinePublicService,
      } = createFundingService();
      fundingDeadlinePublicService.search.mockResolvedValue([
        { id: 1, deadlineEnum: FundingDeadlineEnum.Writing },
      ]);
      activityPublicService.fetchSummary.mockResolvedValue({
        ...activity,
        activityTypeEnum: ActivityTypeEnum.notMatchedActivity,
      });

      const body = { ...fundingBody, isFoodExpense, foodExpense } as never;
      const message =
        "동아리 성격에 합치하지 않는 활동은 식비를 증빙할 수 없습니다.";
      await expect(service.postStudentFunding(body, studentId)).rejects.toThrow(
        message,
      );
      await expect(
        service.putStudentFunding(body, { id: funding.id }, studentId),
      ).rejects.toThrow(message);
      expect(fundingRepository.insert).not.toHaveBeenCalled();
      expect(fundingRepository.put).not.toHaveBeenCalled();
    },
  );

  it("permits food evidence for a conforming purpose", async () => {
    const { service, fundingRepository, fundingDeadlinePublicService } =
      createFundingService();
    fundingDeadlinePublicService.search.mockResolvedValue([
      { id: 1, deadlineEnum: FundingDeadlineEnum.Writing },
    ]);
    const body = {
      ...fundingBody,
      isFoodExpense: true,
      foodExpense: { explanation: "식사", files: [] },
    } as never;

    await expect(service.postStudentFunding(body, studentId)).resolves.toEqual({
      id: funding.id,
    });
    expect(fundingRepository.insert).toHaveBeenCalledWith(
      body,
      expect.anything(),
    );
  });

  it("returns the last objection deadline even before the objection period", async () => {
    const { service, fundingDeadlinePublicService } = createFundingService();
    const deadlines = [
      {
        id: 1,
        deadlineEnum: FundingDeadlineEnum.Writing,
        startTerm: new Date("2026-01-01"),
        endTerm: now,
      },
      {
        id: 2,
        deadlineEnum: FundingDeadlineEnum.Modification,
        startTerm: now,
        endTerm: new Date("2026-02-05"),
      },
      {
        id: 3,
        deadlineEnum: FundingDeadlineEnum.Exception,
        startTerm: new Date("2026-02-06"),
        endTerm: new Date("2026-02-07"),
      },
      {
        id: 4,
        deadlineEnum: FundingDeadlineEnum.Exception,
        startTerm: new Date("2026-02-08"),
        endTerm: new Date("2026-02-10"),
      },
    ];
    fundingDeadlinePublicService.search.mockResolvedValue(deadlines);

    await expect(service.getPublicFundingsDeadline()).resolves.toEqual({
      targetDuration: activityDuration,
      deadline: deadlines[1],
      objectionDeadline: deadlines[3].endTerm,
    });
    expect(fundingDeadlinePublicService.search).toHaveBeenCalledWith({
      semesterId: activityDuration.semester.id,
    });
  });
});

describe("FundingService funding edit authorization", () => {
  it("authorizes editing against the stored club instead of the submitted club", async () => {
    const { service, fundingRepository, clubPublicService } =
      createFundingService();

    await expect(
      service.putStudentFunding(
        { ...fundingBody, club: { id: club.id + 1 } } as never,
        { id: funding.id },
        studentId,
      ),
    ).rejects.toThrow("지원금 신청의 동아리를 변경할 수 없습니다.");

    expect(clubPublicService.checkStudentDelegate).toHaveBeenCalledWith(
      studentId,
      club.id,
    );
    expect(fundingRepository.put).not.toHaveBeenCalled();
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
  it("uses the denormalized final reviewer for club brief", async () => {
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

  it("uses the denormalized final reviewer for executive brief", async () => {
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
  it("stores the final reviewer on the funding with the comment", async () => {
    const { fundingRepository, service } = createFundingService();

    await service.postExecutiveFundingComment(
      latestCommentedExecutive.id,
      funding.id,
      FundingStatusEnum.Partial,
      funding.approvedAmount,
      "승인합니다",
    );

    expect(fundingRepository.patchStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        id: funding.id,
        commentedExecutiveId: latestCommentedExecutive.id,
        commentedAt: now,
      }),
    );
  });

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
    expect(
      fundingCommentRepository.createExecutiveReviewComment,
    ).not.toHaveBeenCalled();
    expect(fundingRepository.patchStatus).not.toHaveBeenCalled();
  });
});
