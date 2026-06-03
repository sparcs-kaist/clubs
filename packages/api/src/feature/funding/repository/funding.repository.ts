import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import {
  IFunding,
  IFundingExtra,
  IFundingRequest,
  IFundingSummary,
} from "@clubs/interface/api/funding/type/funding.type";

import { PrismaTransactionClient } from "@sparcs-clubs/api/common/base/base.repository";
import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { FundingDBResult, MFunding } from "../model/funding.model";
import { VFundingSummary } from "../model/funding.summary.model";
import { buildFundingTransportationPassengerFindManyArgs } from "./funding.repository.util";

const fundingSummarySelect = {
  id: true,
  name: true,
  expenditureAmount: true,
  approvedAmount: true,
  fundingStatusEnum: true,
  purposeActivityId: true,
  clubId: true,
  chargedExecutiveId: true,
  feedbacks: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      id: "desc",
    },
    take: 1,
    select: {
      executiveId: true,
    },
  },
} satisfies Prisma.FundingSelect;

@Injectable()
export default class FundingRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
    private readonly prisma: PrismaService,
  ) {}

  async withTransaction<Result>(
    callback: (tx: PrismaTransactionClient) => Promise<Result>,
  ): Promise<Result> {
    return this.prisma.$transaction(callback);
  }

  async fetch(id: number): Promise<MFunding> {
    const funding = await this.find(id);
    if (!funding) {
      throw new NotFoundException(`Funding: ${id} not found`);
    }
    return funding;
  }

  async find(id: number): Promise<MFunding | null> {
    const { tx } = this.txHost;

    const result = await tx.funding.findMany({
      where: { id, deletedAt: null },
    });

    if (result.length === 0) {
      return null;
    }

    const [
      tradeEvidenceFiles,
      tradeDetailFiles,
      clubSuppliesImageFiles,
      clubSuppliesSoftwareEvidenceFiles,
      fixtureImageFiles,
      fixtureSoftwareEvidenceFiles,
      nonCorporateTransactionFiles,
      foodExpenseFiles,
      laborContractFiles,
      externalEventParticipationFeeFiles,
      publicationFiles,
      profitMakingActivityFiles,
      jointExpenseFiles,
      etcExpenseFiles,
      transportationPassengers,
    ] = await Promise.all([
      tx.fundingTradeEvidenceFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingTradeDetailFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingClubSuppliesImageFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingClubSuppliesSoftwareEvidenceFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingFixtureImageFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingFixtureSoftwareEvidenceFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingNonCorporateTransactionFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingFoodExpenseFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingLaborContractFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingExternalEventParticipationFeeFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingPublicationFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingProfitMakingActivityFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingJointExpenseFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingEtcExpenseFile.findMany({
        where: { fundingId: id, deletedAt: null },
      }),
      tx.fundingTransportationPassenger.findMany(
        buildFundingTransportationPassengerFindManyArgs(id),
      ),
    ]);

    return MFunding.fromDBResult({
      funding: result[0],
      tradeEvidenceFiles: tradeEvidenceFiles.map(file => ({
        id: file.fileId,
      })),
      tradeDetailFiles: tradeDetailFiles.map(file => ({
        id: file.fileId,
      })),
      clubSuppliesImageFiles: clubSuppliesImageFiles.map(file => ({
        id: file.fileId,
      })),
      clubSuppliesSoftwareEvidenceFiles: clubSuppliesSoftwareEvidenceFiles.map(
        file => ({
          id: file.fileId,
        }),
      ),
      fixtureImageFiles: fixtureImageFiles.map(file => ({
        id: file.fileId,
      })),
      fixtureSoftwareEvidenceFiles: fixtureSoftwareEvidenceFiles.map(file => ({
        id: file.fileId,
      })),
      nonCorporateTransactionFiles: nonCorporateTransactionFiles.map(file => ({
        id: file.fileId,
      })),
      foodExpenseFiles: foodExpenseFiles.map(file => ({
        id: file.fileId,
      })),
      laborContractFiles: laborContractFiles.map(file => ({
        id: file.fileId,
      })),
      externalEventParticipationFeeFiles:
        externalEventParticipationFeeFiles.map(file => ({
          id: file.fileId,
        })),
      publicationFiles: publicationFiles.map(file => ({
        id: file.fileId,
      })),
      profitMakingActivityFiles: profitMakingActivityFiles.map(file => ({
        id: file.fileId,
      })),
      jointExpenseFiles: jointExpenseFiles.map(file => ({
        id: file.fileId,
      })),
      etcExpenseFiles: etcExpenseFiles.map(file => ({
        id: file.fileId,
      })),
      transportationPassengers: transportationPassengers.map(passenger => ({
        id: passenger.studentId,
      })),
    });
  }

  private async fetchSummariesByWhere(
    where: Prisma.FundingWhereInput,
  ): Promise<VFundingSummary[]> {
    const fundings = await this.prisma.funding.findMany({
      select: fundingSummarySelect,
      where: {
        AND: [{ deletedAt: null }, where],
      },
    });

    return fundings.map(funding => VFundingSummary.fromDBResult(funding));
  }

  async fetchSummaries(ids: number[]): Promise<VFundingSummary[]>;
  async fetchSummaries(activityDId: number): Promise<VFundingSummary[]>;
  async fetchSummaries(
    clubId: number,
    activityDId: number,
  ): Promise<VFundingSummary[]>;
  async fetchSummaries(
    clubIds: number[],
    activityDId: number,
  ): Promise<VFundingSummary[]>;
  async fetchSummaries(
    arg1: number | number[],
    arg2?: number,
  ): Promise<VFundingSummary[]> {
    if (Array.isArray(arg1)) {
      if (arg1.length === 0) {
        return [];
      }

      if (arg2 === undefined) {
        return this.fetchSummariesByWhere({ id: { in: arg1 } });
      }

      return this.fetchSummariesByWhere({
        clubId: { in: arg1 },
        activityDId: arg2,
      });
    }

    if (arg2 === undefined) {
      return this.fetchSummariesByWhere({ activityDId: arg1 });
    }

    return this.fetchSummariesByWhere({
      clubId: arg1,
      activityDId: arg2,
    });
  }

  async fetchCommentedSummaries(
    executiveId: number,
  ): Promise<VFundingSummary[]> {
    const fundings = await this.prisma.funding.findMany({
      select: fundingSummarySelect,
      where: {
        deletedAt: null,
        OR: [
          { chargedExecutiveId: executiveId },
          {
            feedbacks: {
              some: {
                executiveId,
                deletedAt: null,
              },
            },
          },
        ],
      },
    });

    return fundings.map(funding => VFundingSummary.fromDBResult(funding));
  }

  async insert(
    funding: IFundingRequest,
    extra: IFundingExtra,
  ): Promise<MFunding> {
    const { tx } = this.txHost;

    // 1. Insert funding order
    const fundingOrder = await tx.funding.create({
      data: {
        clubId: funding.club.id,
        purposeActivityId: funding.purposeActivity.id,
        activityDId: extra.activityD.id,
        fundingStatusEnum: extra.fundingStatusEnum,
        name: funding.name,
        expenditureDate: funding.expenditureDate,
        expenditureAmount: funding.expenditureAmount,
        approvedAmount: extra.approvedAmount,
        isFixture: funding.isFixture,
        isTransportation: funding.isTransportation,
        isFoodExpense: funding.isFoodExpense,
        isLaborContract: funding.isLaborContract,
        isExternalEventParticipationFee:
          funding.isExternalEventParticipationFee,
        isPublication: funding.isPublication,
        isProfitMakingActivity: funding.isProfitMakingActivity,
        isJointExpense: funding.isJointExpense,
        isEtcExpense: funding.isEtcExpense,
        isNonCorporateTransaction: funding.isNonCorporateTransaction,
        tradeDetailExplanation: funding.tradeDetailExplanation,
        // ClubOld supplies fields
        clubSuppliesName: funding.clubSupplies?.name,
        clubSuppliesEvidenceEnum: funding.clubSupplies?.evidenceEnum,
        clubSuppliesClassEnum: funding.clubSupplies?.classEnum,
        clubSuppliesPurpose: funding.clubSupplies?.purpose,
        clubSuppliesSoftwareEvidence: funding.clubSupplies?.softwareEvidence,
        numberOfClubSupplies: funding.clubSupplies?.number,
        priceOfClubSupplies: funding.clubSupplies?.price,
        // Fixture fields
        fixtureName: funding.fixture?.name,
        fixtureEvidenceEnum: funding.fixture?.evidenceEnum,
        fixtureClassEnum: funding.fixture?.classEnum,
        fixturePurpose: funding.fixture?.purpose,
        fixtureSoftwareEvidence: funding.fixture?.softwareEvidence,
        numberOfFixture: funding.fixture?.number,
        priceOfFixture: funding.fixture?.price,
        // Transportation fields
        transportationEnum: funding.transportation?.enum,
        origin: funding.transportation?.origin,
        destination: funding.transportation?.destination,
        purposeOfTransportation: funding.transportation?.purpose,
        // Trader fields
        traderName: funding.nonCorporateTransaction?.traderName,
        traderAccountNumber:
          funding.nonCorporateTransaction?.traderAccountNumber,
        wasteExplanation: funding.nonCorporateTransaction?.wasteExplanation,
        // Expense explanations
        foodExpenseExplanation: funding.foodExpense?.explanation,
        laborContractExplanation: funding.laborContract?.explanation,
        externalEventParticipationFeeExplanation:
          funding.externalEventParticipationFee?.explanation,
        publicationExplanation: funding.publication?.explanation,
        profitMakingActivityExplanation:
          funding.profitMakingActivity?.explanation,
        jointExpenseExplanation: funding.jointExpense?.explanation,
        etcExpenseExplanation: funding.etcExpense?.explanation,
      },
    });

    const fundingId = fundingOrder.id;

    // 3. Insert files and related data
    await Promise.all([
      // Trade files
      ...funding.tradeEvidenceFiles.map(file =>
        tx.fundingTradeEvidenceFile.create({
          data: {
            fundingId,
            fileId: file.id,
          },
        }),
      ),
      ...funding.tradeDetailFiles.map(file =>
        tx.fundingTradeDetailFile.create({
          data: {
            fundingId,
            fileId: file.id,
          },
        }),
      ),

      // ClubOld supplies files
      ...(funding.clubSupplies && funding.clubSupplies.imageFiles
        ? funding.clubSupplies.imageFiles.map(file =>
            tx.fundingClubSuppliesImageFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),
      ...(funding.clubSupplies && funding.clubSupplies.softwareEvidenceFiles
        ? funding.clubSupplies.softwareEvidenceFiles.map(file =>
            tx.fundingClubSuppliesSoftwareEvidenceFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Fixture files
      ...(funding.isFixture && funding.fixture.imageFiles
        ? funding.fixture.imageFiles.map(file =>
            tx.fundingFixtureImageFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),
      ...(funding.isFixture && funding.fixture.softwareEvidenceFiles
        ? funding.fixture.softwareEvidenceFiles.map(file =>
            tx.fundingFixtureSoftwareEvidenceFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // NonCorporateTransaction files
      ...(funding.isNonCorporateTransaction && funding.nonCorporateTransaction
        ? funding.nonCorporateTransaction.files.map(file =>
            tx.fundingNonCorporateTransactionFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Food expense files
      ...(funding.isFoodExpense && funding.foodExpense
        ? funding.foodExpense.files.map(file =>
            tx.fundingFoodExpenseFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Labor contract files
      ...(funding.isLaborContract && funding.laborContract
        ? funding.laborContract.files.map(file =>
            tx.fundingLaborContractFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // External event participation fee files
      ...(funding.isExternalEventParticipationFee &&
      funding.externalEventParticipationFee
        ? funding.externalEventParticipationFee.files.map(file =>
            tx.fundingExternalEventParticipationFeeFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Publication files
      ...(funding.isPublication && funding.publication
        ? funding.publication.files.map(file =>
            tx.fundingPublicationFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Profit making activity files
      ...(funding.isProfitMakingActivity && funding.profitMakingActivity
        ? funding.profitMakingActivity.files.map(file =>
            tx.fundingProfitMakingActivityFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Joint expense files
      ...(funding.isJointExpense && funding.jointExpense
        ? funding.jointExpense.files.map(file =>
            tx.fundingJointExpenseFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Etc expense files
      ...(funding.isEtcExpense && funding.etcExpense
        ? funding.etcExpense.files.map(file =>
            tx.fundingEtcExpenseFile.create({
              data: {
                fundingId,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Transportation passengers
      ...(funding.isTransportation && funding.transportation
        ? funding.transportation.passengers.map(passenger =>
            tx.fundingTransportationPassenger.create({
              data: {
                fundingId,
                studentId: passenger.id,
              },
            }),
          )
        : []),
    ]);

    // 4. Return the newly created funding
    return this.fetch(fundingId);
  }

  async delete(id: number): Promise<void> {
    const { tx } = this.txHost;
    const now = this.clock.now();

    // Soft delete funding order and all related records
    await Promise.all([
      tx.funding.updateMany({
        where: { id },
        data: { deletedAt: now, editedAt: now },
      }),
      tx.fundingFeedback.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingTradeEvidenceFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingTradeDetailFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingClubSuppliesImageFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingClubSuppliesSoftwareEvidenceFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingFixtureImageFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingFixtureSoftwareEvidenceFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingNonCorporateTransactionFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingFoodExpenseFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingLaborContractFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingExternalEventParticipationFeeFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingPublicationFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingProfitMakingActivityFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingJointExpenseFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingEtcExpenseFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingTransportationPassenger.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
    ]);
  }

  async put(
    id: number,
    funding: IFundingRequest,
    extra: IFundingExtra,
  ): Promise<MFunding> {
    const { tx } = this.txHost;
    const now = this.clock.now();

    // Update funding table
    await tx.funding.update({
      where: { id },
      data: {
        purposeActivityId: funding.purposeActivity.id,
        fundingStatusEnum: extra.fundingStatusEnum,
        name: funding.name,
        expenditureDate: funding.expenditureDate,
        expenditureAmount: funding.expenditureAmount,
        approvedAmount: extra.approvedAmount,
        isFixture: funding.isFixture,
        isTransportation: funding.isTransportation,
        isFoodExpense: funding.isFoodExpense,
        isLaborContract: funding.isLaborContract,
        isExternalEventParticipationFee:
          funding.isExternalEventParticipationFee,
        isPublication: funding.isPublication,
        isProfitMakingActivity: funding.isProfitMakingActivity,
        isJointExpense: funding.isJointExpense,
        isEtcExpense: funding.isEtcExpense,
        isNonCorporateTransaction: funding.isNonCorporateTransaction,
        tradeDetailExplanation: funding.tradeDetailExplanation,
        // ClubOld supplies fields
        clubSuppliesName: funding.clubSupplies?.name,
        clubSuppliesEvidenceEnum: funding.clubSupplies?.evidenceEnum,
        clubSuppliesClassEnum: funding.clubSupplies?.classEnum,
        clubSuppliesPurpose: funding.clubSupplies?.purpose,
        clubSuppliesSoftwareEvidence: funding.clubSupplies?.softwareEvidence,
        numberOfClubSupplies: funding.clubSupplies?.number,
        priceOfClubSupplies: funding.clubSupplies?.price,
        // Fixture fields
        fixtureName: funding.fixture?.name,
        fixtureEvidenceEnum: funding.fixture?.evidenceEnum,
        fixtureClassEnum: funding.fixture?.classEnum,
        fixturePurpose: funding.fixture?.purpose,
        fixtureSoftwareEvidence: funding.fixture?.softwareEvidence,
        numberOfFixture: funding.fixture?.number,
        priceOfFixture: funding.fixture?.price,
        // Transportation fields
        transportationEnum: funding.transportation?.enum,
        origin: funding.transportation?.origin,
        destination: funding.transportation?.destination,
        purposeOfTransportation: funding.transportation?.purpose,
        // Trader fields
        traderName: funding.nonCorporateTransaction?.traderName,
        traderAccountNumber:
          funding.nonCorporateTransaction?.traderAccountNumber,
        wasteExplanation: funding.nonCorporateTransaction?.wasteExplanation,
        // Expense explanations
        foodExpenseExplanation: funding.foodExpense?.explanation,
        laborContractExplanation: funding.laborContract?.explanation,
        externalEventParticipationFeeExplanation:
          funding.externalEventParticipationFee?.explanation,
        publicationExplanation: funding.publication?.explanation,
        profitMakingActivityExplanation:
          funding.profitMakingActivity?.explanation,
        jointExpenseExplanation: funding.jointExpense?.explanation,
        etcExpenseExplanation: funding.etcExpense?.explanation,
        editedAt: now,
      },
    });

    // Soft delete all related records
    await Promise.all([
      tx.fundingTradeEvidenceFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingTradeDetailFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingClubSuppliesImageFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingClubSuppliesSoftwareEvidenceFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingFixtureImageFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingFixtureSoftwareEvidenceFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingNonCorporateTransactionFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingFoodExpenseFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingLaborContractFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingExternalEventParticipationFeeFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingPublicationFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingProfitMakingActivityFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingJointExpenseFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingEtcExpenseFile.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
      tx.fundingTransportationPassenger.updateMany({
        where: { fundingId: id },
        data: { deletedAt: now },
      }),
    ]);

    // Insert new related records
    await Promise.all([
      // Trade files
      ...funding.tradeEvidenceFiles.map(file =>
        tx.fundingTradeEvidenceFile.create({
          data: {
            fundingId: id,
            fileId: file.id,
          },
        }),
      ),
      ...funding.tradeDetailFiles.map(file =>
        tx.fundingTradeDetailFile.create({
          data: {
            fundingId: id,
            fileId: file.id,
          },
        }),
      ),

      // ClubOld supplies files
      ...(funding.clubSupplies && funding.clubSupplies.imageFiles
        ? funding.clubSupplies.imageFiles.map(file =>
            tx.fundingClubSuppliesImageFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),
      ...(funding.clubSupplies && funding.clubSupplies.softwareEvidenceFiles
        ? funding.clubSupplies.softwareEvidenceFiles.map(file =>
            tx.fundingClubSuppliesSoftwareEvidenceFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Fixture files
      ...(funding.isFixture && funding.fixture.imageFiles
        ? funding.fixture.imageFiles.map(file =>
            tx.fundingFixtureImageFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),
      ...(funding.isFixture && funding.fixture.softwareEvidenceFiles
        ? funding.fixture.softwareEvidenceFiles.map(file =>
            tx.fundingFixtureSoftwareEvidenceFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // NonCorporateTransaction files
      ...(funding.isNonCorporateTransaction && funding.nonCorporateTransaction
        ? funding.nonCorporateTransaction.files.map(file =>
            tx.fundingNonCorporateTransactionFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Food expense files
      ...(funding.isFoodExpense && funding.foodExpense
        ? funding.foodExpense.files.map(file =>
            tx.fundingFoodExpenseFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Labor contract files
      ...(funding.isLaborContract && funding.laborContract
        ? funding.laborContract.files.map(file =>
            tx.fundingLaborContractFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // External event participation fee files
      ...(funding.isExternalEventParticipationFee &&
      funding.externalEventParticipationFee
        ? funding.externalEventParticipationFee.files.map(file =>
            tx.fundingExternalEventParticipationFeeFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Publication files
      ...(funding.isPublication && funding.publication
        ? funding.publication.files.map(file =>
            tx.fundingPublicationFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Profit making activity files
      ...(funding.isProfitMakingActivity && funding.profitMakingActivity
        ? funding.profitMakingActivity.files.map(file =>
            tx.fundingProfitMakingActivityFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Joint expense files
      ...(funding.isJointExpense && funding.jointExpense
        ? funding.jointExpense.files.map(file =>
            tx.fundingJointExpenseFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Etc expense files
      ...(funding.isEtcExpense && funding.etcExpense
        ? funding.etcExpense.files.map(file =>
            tx.fundingEtcExpenseFile.create({
              data: {
                fundingId: id,
                fileId: file.id,
              },
            }),
          )
        : []),

      // Transportation passengers
      ...(funding.isTransportation && funding.transportation
        ? funding.transportation.passengers.map(passenger =>
            tx.fundingTransportationPassenger.create({
              data: {
                fundingId: id,
                studentId: passenger.id,
              },
            }),
          )
        : []),
    ]);

    return this.fetch(id);
  }

  async patchSummaryTx(
    tx: PrismaTransactionClient,
    oldbie: IFundingSummary,
    consumer: (
      _oldbie: IFundingSummary,
    ) => Partial<FundingDBResult> & { id: number },
  ): Promise<IFundingSummary> {
    const param = consumer(oldbie);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (tx as any).funding.update({ where: { id: param.id }, data: param });

    return this.fetch(oldbie.id);
  }

  async patchSummary(
    oldbie: IFundingSummary,
    consumer: (_oldbie: IFundingSummary) => IFundingSummary,
  ): Promise<IFundingSummary> {
    return this.prisma.$transaction(async tx =>
      this.patchSummaryTx(tx, oldbie, consumer),
    );
  }

  async fetchSummary(id: number): Promise<VFundingSummary> {
    return this.prisma.$transaction(async tx => this.fetchSummaryTx(tx, id));
  }

  async fetchSummaryTx(
    tx: PrismaTransactionClient,
    id: number,
  ): Promise<VFundingSummary> {
    const result = await tx.funding.findFirst({
      select: fundingSummarySelect,
      where: { id, deletedAt: null },
    });

    if (!result) {
      throw new NotFoundException(`Funding: ${id} not found`);
    }

    return VFundingSummary.fromDBResult(result);
  }

  async patchStatus(param: {
    id: IFunding["id"];
    fundingStatusEnum: IFunding["fundingStatusEnum"];
    approvedAmount: IFunding["approvedAmount"];
    commentedAt: IFunding["commentedAt"];
  }): Promise<VFundingSummary> {
    return this.prisma.$transaction(async tx => this.patchStatusTx(tx, param));
  }

  async patchStatusTx(
    tx: PrismaTransactionClient,
    param: {
      id: IFunding["id"];
      fundingStatusEnum: IFunding["fundingStatusEnum"];
      approvedAmount: IFunding["approvedAmount"];
      commentedAt: IFunding["commentedAt"];
    },
  ): Promise<VFundingSummary> {
    const now = this.clock.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (tx as any).funding.update({
      where: { id: param.id },
      data: {
        fundingStatusEnum: param.fundingStatusEnum,
        approvedAmount: param.approvedAmount,
        commentedAt: param.commentedAt,
        editedAt: now,
      },
    });

    return this.fetchSummaryTx(tx, param.id);
  }
}
