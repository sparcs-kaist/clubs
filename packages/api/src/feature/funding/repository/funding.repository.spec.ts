import { FundingDBResult, MFunding } from "../model/funding.model";
import FundingRepository from "./funding.repository";
import {
  buildFundingTransportationPassengerFindManyArgs,
  getLegacyPurchaseAmounts,
} from "./funding.repository.util";

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
    funding: {
      findMany: jest.fn(),
    },
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

describe("funding receipt presentation", () => {
  const purchaseReceipt = {
    reference: "receipt",
    totalAmount: 200_000,
    itemNumber: 1,
    quantity: 2,
  };

  function buildFromReceiptColumns(
    columns: Pick<
      FundingDBResult["funding"],
      "receipt" | "receiptItemNumber" | "purchaseQuantity"
    >,
  ) {
    return MFunding.fromDBResult({
      funding: { purposeActivityId: 10, ...columns },
      tradeEvidenceFiles: [],
      tradeDetailFiles: [],
    } as FundingDBResult);
  }

  it("returns saved metadata alongside the existing funding fields", () => {
    expect(
      buildFromReceiptColumns({
        receipt: { reference: "receipt", totalAmount: 200_000 },
        receiptItemNumber: 1,
        purchaseQuantity: 2,
      }).purchaseReceipt,
    ).toEqual(purchaseReceipt);
  });

  it.each([
    { receipt: null },
    { receiptItemNumber: null },
    { purchaseQuantity: null },
  ])("does not infer metadata from incomplete columns: %j", missing => {
    expect(
      buildFromReceiptColumns({
        receipt: { reference: "receipt", totalAmount: 200_000 },
        receiptItemNumber: 1,
        purchaseQuantity: 2,
        ...missing,
      }).purchaseReceipt,
    ).toBeUndefined();
  });

  it.each([
    [100_000, 50_000],
    [100_001, null],
  ])(
    "stores a compatible legacy price for a %d won receipt item",
    (amount, price) => {
      const legacyEvidence = {
        number: 1,
        price: 1,
        imageFiles: [],
        softwareEvidenceFiles: [],
      };
      const request = {
        ...(createFundingRequest() as object),
        expenditureAmount: amount,
        fixture: legacyEvidence,
        clubSupplies: legacyEvidence,
        purchaseReceipt,
      } as Parameters<typeof getLegacyPurchaseAmounts>[0];
      expect(getLegacyPurchaseAmounts(request)).toEqual({
        numberOfClubSupplies: 2,
        priceOfClubSupplies: price,
        numberOfFixture: 2,
        priceOfFixture: price,
      });
    },
  );
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
      where: { id: 402, deletedAt: null },
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

  it("updates charged executives through TransactionHost tx", async () => {
    const { prisma, repository, tx } = createRepository();
    const fundings = [{ id: 401 }, { id: 402 }];
    const fetchSpy = jest
      .spyOn(repository, "fetch")
      .mockResolvedValue({} as never);

    await repository.updateChargedExecutive(fundings as never, 101);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.funding.update).toHaveBeenNthCalledWith(1, {
      where: { id: 401 },
      data: { id: 401, chargedExecutiveId: 101 },
    });
    expect(tx.funding.update).toHaveBeenNthCalledWith(2, {
      where: { id: 402 },
      data: { id: 402, chargedExecutiveId: 101 },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("stores the final reviewer through TransactionHost tx", async () => {
    const { prisma, repository, tx } = createRepository();
    jest.spyOn(repository, "fetchSummaryTx").mockResolvedValue({} as never);

    await repository.patchStatus({
      id: 401,
      fundingStatusEnum: 2,
      approvedAmount: 10000,
      commentedAt: NOW,
      commentedExecutiveId: 8,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.funding.update).toHaveBeenCalledWith({
      where: { id: 401 },
      data: {
        fundingStatusEnum: 2,
        approvedAmount: 10000,
        commentedAt: NOW,
        commentedExecutiveId: 8,
        editedAt: NOW,
      },
    });
  });
});

describe("FundingRepository summaries", () => {
  it("returns the denormalized final reviewer", async () => {
    const { prisma, repository } = createRepository();
    prisma.funding.findMany.mockResolvedValue([
      {
        id: 401,
        fundingStatusEnum: 2,
        name: "funding",
        expenditureAmount: 10000,
        approvedAmount: 10000,
        purposeActivityId: 201,
        clubId: 101,
        chargedExecutiveId: 7,
        commentedExecutiveId: 8,
      },
    ]);

    const [result] = await repository.fetchCommentedSummaries(7);

    expect(prisma.funding.findMany).toHaveBeenCalledWith({
      select: expect.objectContaining({ commentedExecutiveId: true }),
      where: {
        deletedAt: null,
        OR: [
          { chargedExecutiveId: 7 },
          {
            feedbacks: {
              some: { executiveId: 7, deletedAt: null },
            },
          },
        ],
      },
    });
    expect(result.commentedExecutive).toEqual({ id: 8 });
  });
});
