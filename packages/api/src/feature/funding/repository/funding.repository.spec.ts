import FundingRepository from "./funding.repository";
import { buildFundingTransportationPassengerFindManyArgs } from "./funding.repository.util";

const NOW = new Date("2026-06-03T12:00:00.000Z");

const injectTestClock = <T extends object>(target: T): T =>
  Object.assign(target, {
    clock: {
      now: () => NOW,
    },
  });

const createUpdateManyDelegate = () => ({
  updateMany: jest.fn().mockResolvedValue({ count: 1 }),
});

const createRelatedFundingDelegate = () => ({
  create: jest.fn().mockResolvedValue({}),
  updateMany: jest.fn().mockResolvedValue({ count: 1 }),
});

const createFundingTx = () => ({
  funding: {
    create: jest.fn().mockResolvedValue({ id: 401 }),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  fundingFeedback: createUpdateManyDelegate(),
  fundingTradeEvidenceFile: createRelatedFundingDelegate(),
  fundingTradeDetailFile: createRelatedFundingDelegate(),
  fundingClubSuppliesImageFile: createRelatedFundingDelegate(),
  fundingClubSuppliesSoftwareEvidenceFile: createRelatedFundingDelegate(),
  fundingFixtureImageFile: createRelatedFundingDelegate(),
  fundingFixtureSoftwareEvidenceFile: createRelatedFundingDelegate(),
  fundingNonCorporateTransactionFile: createRelatedFundingDelegate(),
  fundingFoodExpenseFile: createRelatedFundingDelegate(),
  fundingLaborContractFile: createRelatedFundingDelegate(),
  fundingExternalEventParticipationFeeFile: createRelatedFundingDelegate(),
  fundingPublicationFile: createRelatedFundingDelegate(),
  fundingProfitMakingActivityFile: createRelatedFundingDelegate(),
  fundingJointExpenseFile: createRelatedFundingDelegate(),
  fundingEtcExpenseFile: createRelatedFundingDelegate(),
  fundingTransportationPassenger: createRelatedFundingDelegate(),
});

const createFundingRequest = () =>
  ({
    club: { id: 101 },
    purposeActivity: { id: 201 },
    name: "funding",
    expenditureDate: NOW,
    expenditureAmount: 10000,
    isFixture: false,
    isTransportation: false,
    isFoodExpense: false,
    isLaborContract: false,
    isExternalEventParticipationFee: false,
    isPublication: false,
    isProfitMakingActivity: false,
    isJointExpense: false,
    isEtcExpense: false,
    isNonCorporateTransaction: false,
    tradeDetailExplanation: "detail",
    tradeEvidenceFiles: [],
    tradeDetailFiles: [],
  }) as never;

const createFundingExtra = () =>
  ({
    activityD: { id: 301 },
    fundingStatusEnum: 1,
    approvedAmount: 0,
  }) as never;

const createRepository = (tx = createFundingTx()) => {
  const txHost = { tx };
  const prisma = {
    $transaction: jest.fn(),
  };
  const repository = injectTestClock(
    new FundingRepository(txHost as never, prisma as never),
  );

  return { prisma, repository, tx, txHost };
};

describe("buildFundingTransportationPassengerFindManyArgs", () => {
  it("shows submitted distinct transportation passengers without student_t filtering", () => {
    expect(buildFundingTransportationPassengerFindManyArgs(4216)).toEqual({
      distinct: ["studentId"],
      where: {
        fundingId: 4216,
        deletedAt: null,
        funding: {
          deletedAt: null,
        },
        student: {
          deletedAt: null,
        },
      },
      select: {
        studentId: true,
      },
    });
  });
});

describe("FundingRepository transactions", () => {
  it("inserts a funding through TransactionHost tx", async () => {
    const { prisma, repository, tx } = createRepository();
    const fetchSpy = jest
      .spyOn(repository, "fetch")
      .mockResolvedValue({} as never);

    await repository.insert(createFundingRequest(), createFundingExtra());

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.funding.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clubId: 101,
        purposeActivityId: 201,
        activityDId: 301,
      }),
    });
    expect(fetchSpy).toHaveBeenCalledWith(401);
  });

  it("soft-deletes a funding through TransactionHost tx", async () => {
    const { prisma, repository, tx } = createRepository();

    await repository.delete(401);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.funding.updateMany).toHaveBeenCalledWith({
      where: { id: 401 },
      data: { deletedAt: NOW, editedAt: NOW },
    });
    expect(tx.fundingFeedback.updateMany).toHaveBeenCalledWith({
      where: { fundingId: 401 },
      data: { deletedAt: NOW },
    });
  });

  it("updates a funding through TransactionHost tx", async () => {
    const { prisma, repository, tx } = createRepository();
    const fetchSpy = jest
      .spyOn(repository, "fetch")
      .mockResolvedValue({} as never);

    await repository.put(402, createFundingRequest(), createFundingExtra());

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.funding.update).toHaveBeenCalledWith({
      where: { id: 402 },
      data: expect.objectContaining({
        purposeActivityId: 201,
        fundingStatusEnum: 1,
        editedAt: NOW,
      }),
    });
    expect(tx.fundingTradeEvidenceFile.updateMany).toHaveBeenCalledWith({
      where: { fundingId: 402 },
      data: { deletedAt: NOW },
    });
    expect(fetchSpy).toHaveBeenCalledWith(402);
  });
});
