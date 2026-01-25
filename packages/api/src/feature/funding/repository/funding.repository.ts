import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, exists, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import {
  IFunding,
  IFundingExtra,
  IFundingRequest,
  IFundingSummary,
} from "@clubs/interface/api/funding/type/funding.type";

import { makeObjectPropsFromDBTimezone } from "@sparcs-clubs/api/common/util/util";
import {
  DrizzleAsyncProvider,
  DrizzleTransaction,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Funding,
  FundingClubSuppliesImageFile,
  FundingClubSuppliesSoftwareEvidenceFile,
  FundingEtcExpenseFile,
  FundingExternalEventParticipationFeeFile,
  FundingFeedback,
  FundingFixtureImageFile,
  FundingFixtureSoftwareEvidenceFile,
  FundingFoodExpenseFile,
  FundingJointExpenseFile,
  FundingLaborContractFile,
  FundingNonCorporateTransactionFile,
  FundingProfitMakingActivityFile,
  FundingPublicationFile,
  FundingTradeDetailFile,
  FundingTradeEvidenceFile,
  FundingTransportationPassenger,
} from "@sparcs-clubs/api/drizzle/schema/funding.schema";
import {
  Student,
  StudentT,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

import { FundingDBResult, MFunding } from "../model/funding.model";
import {
  FundingSummaryDBResult,
  VFundingSummary,
} from "../model/funding.summary.model";

@Injectable()
export default class FundingRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async withTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
  ): Promise<Result> {
    return this.db.transaction(callback);
  }

  async fetch(id: number): Promise<MFunding> {
    const funding = await this.find(id);
    if (!funding) {
      throw new NotFoundException(`Funding: ${id} not found`);
    }
    return funding;
  }

  async find(id: number): Promise<MFunding | null> {
    const result = await this.db
      .select({
        funding: Funding,
      })
      .from(Funding)
      .where(and(eq(Funding.id, id), isNull(Funding.deletedAt)));

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
      this.db
        .select()
        .from(FundingTradeEvidenceFile)
        .where(
          and(
            eq(FundingTradeEvidenceFile.fundingId, id),
            isNull(FundingTradeEvidenceFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingTradeDetailFile)
        .where(
          and(
            eq(FundingTradeDetailFile.fundingId, id),
            isNull(FundingTradeDetailFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingClubSuppliesImageFile)
        .where(
          and(
            eq(FundingClubSuppliesImageFile.fundingId, id),
            isNull(FundingClubSuppliesImageFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingClubSuppliesSoftwareEvidenceFile)
        .where(
          and(
            eq(FundingClubSuppliesSoftwareEvidenceFile.fundingId, id),
            isNull(FundingClubSuppliesSoftwareEvidenceFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingFixtureImageFile)
        .where(
          and(
            eq(FundingFixtureImageFile.fundingId, id),
            isNull(FundingFixtureImageFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingFixtureSoftwareEvidenceFile)
        .where(
          and(
            eq(FundingFixtureSoftwareEvidenceFile.fundingId, id),
            isNull(FundingFixtureSoftwareEvidenceFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingNonCorporateTransactionFile)
        .where(
          and(
            eq(FundingNonCorporateTransactionFile.fundingId, id),
            isNull(FundingNonCorporateTransactionFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingFoodExpenseFile)
        .where(
          and(
            eq(FundingFoodExpenseFile.fundingId, id),
            isNull(FundingFoodExpenseFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingLaborContractFile)
        .where(
          and(
            eq(FundingLaborContractFile.fundingId, id),
            isNull(FundingLaborContractFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingExternalEventParticipationFeeFile)
        .where(
          and(
            eq(FundingExternalEventParticipationFeeFile.fundingId, id),
            isNull(FundingExternalEventParticipationFeeFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingPublicationFile)
        .where(
          and(
            eq(FundingPublicationFile.fundingId, id),
            isNull(FundingPublicationFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingProfitMakingActivityFile)
        .where(
          and(
            eq(FundingProfitMakingActivityFile.fundingId, id),
            isNull(FundingProfitMakingActivityFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingJointExpenseFile)
        .where(
          and(
            eq(FundingJointExpenseFile.fundingId, id),
            isNull(FundingJointExpenseFile.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(FundingEtcExpenseFile)
        .where(
          and(
            eq(FundingEtcExpenseFile.fundingId, id),
            isNull(FundingEtcExpenseFile.deletedAt),
          ),
        ),
      this.db
        .select({
          fundingId: FundingTransportationPassenger.fundingId,
          studentId: FundingTransportationPassenger.studentId,
          studentNumber: Student.number,
          name: Student.name,
        })
        .from(FundingTransportationPassenger)
        .where(
          and(
            eq(FundingTransportationPassenger.fundingId, id),
            isNull(FundingTransportationPassenger.deletedAt),
          ),
        )
        .innerJoin(
          Student,
          and(
            eq(Student.id, FundingTransportationPassenger.studentId),
            isNull(Student.deletedAt),
          ),
        )
        .innerJoin(
          StudentT,
          and(
            eq(StudentT.studentId, Student.id),
            lte(StudentT.startTerm, new Date()),
            or(gte(StudentT.endTerm, new Date()), isNull(StudentT.endTerm)),
            isNull(StudentT.deletedAt),
          ),
        ),
    ]);

    return MFunding.fromDBResult({
      funding: makeObjectPropsFromDBTimezone(result[0].funding),
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

  async fetchSummaries(ids: number[]): Promise<IFundingSummary[]>;
  async fetchSummaries(activityDId: number): Promise<IFundingSummary[]>;
  async fetchSummaries(
    clubId: number,
    activityDId: number,
  ): Promise<IFundingSummary[]>;
  async fetchSummaries(
    clubIds: number[],
    activityDId: number,
  ): Promise<IFundingSummary[]>;
  async fetchSummaries(
    arg1: number | number[],
    arg2?: number,
  ): Promise<IFundingSummary[]> {
    if (Array.isArray(arg1)) {
      if (arg1.length === 0) {
        return [];
      }

      if (arg2 === undefined) {
        const fundings = await this.db
          .select({
            id: Funding.id,
            name: Funding.name,
            expenditureAmount: Funding.expenditureAmount,
            approvedAmount: Funding.approvedAmount,
            fundingStatusEnum: Funding.fundingStatusEnum,
            purposeActivityId: Funding.purposeActivityId,
            clubId: Funding.clubId,
            chargedExecutiveId: Funding.chargedExecutiveId,
          })
          .from(Funding)
          .where(and(inArray(Funding.id, arg1), isNull(Funding.deletedAt)));

        return fundings.map(funding => ({
          ...funding,
          purposeActivity: {
            id: funding.purposeActivityId,
          },
          club: {
            id: funding.clubId,
          },
          chargedExecutive: {
            id: funding.chargedExecutiveId,
          },
        }));
      }

      const fundings = await this.db
        .select({
          id: Funding.id,
          name: Funding.name,
          expenditureAmount: Funding.expenditureAmount,
          approvedAmount: Funding.approvedAmount,
          fundingStatusEnum: Funding.fundingStatusEnum,
          purposeActivityId: Funding.purposeActivityId,
          clubId: Funding.clubId,
          chargedExecutiveId: Funding.chargedExecutiveId,
        })
        .from(Funding)
        .where(
          and(
            inArray(Funding.clubId, arg1),
            eq(Funding.activityDId, arg2),
            isNull(Funding.deletedAt),
          ),
        );

      return fundings.map(funding => ({
        ...funding,
        purposeActivity: {
          id: funding.purposeActivityId,
        },
        club: {
          id: funding.clubId,
        },
        chargedExecutive: {
          id: funding.chargedExecutiveId,
        },
      }));
    }

    if (arg2 === undefined) {
      const fundings = await this.db
        .select({
          id: Funding.id,
          name: Funding.name,
          expenditureAmount: Funding.expenditureAmount,
          approvedAmount: Funding.approvedAmount,
          fundingStatusEnum: Funding.fundingStatusEnum,
          purposeActivityId: Funding.purposeActivityId,
          clubId: Funding.clubId,
          chargedExecutiveId: Funding.chargedExecutiveId,
        })
        .from(Funding)
        .where(and(eq(Funding.activityDId, arg1), isNull(Funding.deletedAt)));

      if (fundings.length === 0) {
        return [];
      }

      return fundings.map(funding => ({
        ...funding,
        purposeActivity: {
          id: funding.purposeActivityId,
        },
        club: {
          id: funding.clubId,
        },
        chargedExecutive: {
          id: funding.chargedExecutiveId,
        },
      }));
    }

    const fundings = await this.db
      .select({
        id: Funding.id,
        name: Funding.name,
        expenditureAmount: Funding.expenditureAmount,
        approvedAmount: Funding.approvedAmount,
        fundingStatusEnum: Funding.fundingStatusEnum,
        purposeActivityId: Funding.purposeActivityId,
        clubId: Funding.clubId,
        chargedExecutiveId: Funding.chargedExecutiveId,
      })
      .from(Funding)
      .where(
        and(
          eq(Funding.clubId, arg1),
          eq(Funding.activityDId, arg2),
          isNull(Funding.deletedAt),
        ),
      );

    if (fundings.length === 0) {
      return [];
    }

    return fundings.map(funding => ({
      ...funding,
      purposeActivity: {
        id: funding.purposeActivityId,
      },
      club: {
        id: funding.clubId,
      },
      chargedExecutive: {
        id: funding.chargedExecutiveId,
      },
    }));
  }

  async fetchCommentedSummaries(
    executiveId: number,
  ): Promise<IFundingSummary[]> {
    const fundings = await this.db
      .select({
        id: Funding.id,
        fundingStatusEnum: Funding.fundingStatusEnum,
        name: Funding.name,
        expenditureAmount: Funding.expenditureAmount,
        approvedAmount: Funding.approvedAmount,
        purposeActivityId: Funding.purposeActivityId,
        clubId: Funding.clubId,
        chargedExecutiveId: Funding.chargedExecutiveId,
      })
      .from(Funding)
      .where(
        and(
          isNull(Funding.deletedAt),
          or(
            eq(Funding.chargedExecutiveId, executiveId),
            exists(
              this.db
                .select()
                .from(FundingFeedback)
                .where(
                  and(
                    eq(FundingFeedback.fundingId, Funding.id),
                    eq(FundingFeedback.executiveId, executiveId),
                    isNull(FundingFeedback.deletedAt),
                  ),
                ),
            ),
          ),
        ),
      );

    return fundings.map(funding => ({
      ...funding,
      purposeActivity: {
        id: funding.purposeActivityId,
      },
      club: {
        id: funding.clubId,
      },
      chargedExecutive: {
        id: funding.chargedExecutiveId,
      },
    }));
  }

  async insert(
    funding: IFundingRequest,
    extra: IFundingExtra,
  ): Promise<MFunding> {
    const result = await this.db.transaction(async tx => {
      // 1. Insert funding order
      const [fundingOrder] = await tx.insert(Funding).values({
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
      });

      const fundingId = Number(fundingOrder.insertId);

      // 3. Insert files and related data
      await Promise.all([
        // Trade files
        ...funding.tradeEvidenceFiles.map(file =>
          tx.insert(FundingTradeEvidenceFile).values({
            fundingId,
            fileId: file.id,
          }),
        ),
        ...funding.tradeDetailFiles.map(file =>
          tx.insert(FundingTradeDetailFile).values({
            fundingId,
            fileId: file.id,
          }),
        ),

        // ClubOld supplies files
        ...(funding.clubSupplies && funding.clubSupplies.imageFiles
          ? funding.clubSupplies.imageFiles.map(file =>
              tx.insert(FundingClubSuppliesImageFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),
        ...(funding.clubSupplies && funding.clubSupplies.softwareEvidenceFiles
          ? funding.clubSupplies.softwareEvidenceFiles.map(file =>
              tx.insert(FundingClubSuppliesSoftwareEvidenceFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Fixture files
        ...(funding.isFixture && funding.fixture.imageFiles
          ? funding.fixture.imageFiles.map(file =>
              tx.insert(FundingFixtureImageFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),
        ...(funding.isFixture && funding.fixture.softwareEvidenceFiles
          ? funding.fixture.softwareEvidenceFiles.map(file =>
              tx.insert(FundingFixtureSoftwareEvidenceFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // NonCorporateTransaction files
        ...(funding.isNonCorporateTransaction && funding.nonCorporateTransaction
          ? funding.nonCorporateTransaction.files.map(file =>
              tx.insert(FundingNonCorporateTransactionFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Food expense files
        ...(funding.isFoodExpense && funding.foodExpense
          ? funding.foodExpense.files.map(file =>
              tx.insert(FundingFoodExpenseFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Labor contract files
        ...(funding.isLaborContract && funding.laborContract
          ? funding.laborContract.files.map(file =>
              tx.insert(FundingLaborContractFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // External event participation fee files
        ...(funding.isExternalEventParticipationFee &&
        funding.externalEventParticipationFee
          ? funding.externalEventParticipationFee.files.map(file =>
              tx.insert(FundingExternalEventParticipationFeeFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Publication files
        ...(funding.isPublication && funding.publication
          ? funding.publication.files.map(file =>
              tx.insert(FundingPublicationFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Profit making activity files
        ...(funding.isProfitMakingActivity && funding.profitMakingActivity
          ? funding.profitMakingActivity.files.map(file =>
              tx.insert(FundingProfitMakingActivityFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Joint expense files
        ...(funding.isJointExpense && funding.jointExpense
          ? funding.jointExpense.files.map(file =>
              tx.insert(FundingJointExpenseFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Etc expense files
        ...(funding.isEtcExpense && funding.etcExpense
          ? funding.etcExpense.files.map(file =>
              tx.insert(FundingEtcExpenseFile).values({
                fundingId,
                fileId: file.id,
              }),
            )
          : []),

        // Transportation passengers
        ...(funding.isTransportation && funding.transportation
          ? funding.transportation.passengers.map(passenger =>
              tx.insert(FundingTransportationPassenger).values({
                fundingId,
                studentId: passenger.id,
              }),
            )
          : []),
      ]);

      return fundingId;
    });

    // 4. Return the newly created funding
    return this.fetch(result);
  }

  async delete(id: number): Promise<void> {
    await this.db.transaction(async tx => {
      const now = new Date();

      // Soft delete funding order and all related records
      await Promise.all([
        tx
          .update(Funding)
          .set({ deletedAt: now, editedAt: now })
          .where(eq(Funding.id, id)),
        tx
          .update(FundingFeedback)
          .set({ deletedAt: now })
          .where(eq(FundingFeedback.fundingId, id)),
        tx
          .update(FundingTradeEvidenceFile)
          .set({ deletedAt: now })
          .where(eq(FundingTradeEvidenceFile.fundingId, id)),
        tx
          .update(FundingTradeDetailFile)
          .set({ deletedAt: now })
          .where(eq(FundingTradeDetailFile.fundingId, id)),
        tx
          .update(FundingClubSuppliesImageFile)
          .set({ deletedAt: now })
          .where(eq(FundingClubSuppliesImageFile.fundingId, id)),
        tx
          .update(FundingClubSuppliesSoftwareEvidenceFile)
          .set({ deletedAt: now })
          .where(eq(FundingClubSuppliesSoftwareEvidenceFile.fundingId, id)),
        tx
          .update(FundingFixtureImageFile)
          .set({ deletedAt: now })
          .where(eq(FundingFixtureImageFile.fundingId, id)),
        tx
          .update(FundingFixtureSoftwareEvidenceFile)
          .set({ deletedAt: now })
          .where(eq(FundingFixtureSoftwareEvidenceFile.fundingId, id)),
        tx
          .update(FundingNonCorporateTransactionFile)
          .set({ deletedAt: now })
          .where(eq(FundingNonCorporateTransactionFile.fundingId, id)),

        tx
          .update(FundingFoodExpenseFile)
          .set({ deletedAt: now })
          .where(eq(FundingFoodExpenseFile.fundingId, id)),
        tx
          .update(FundingLaborContractFile)
          .set({ deletedAt: now })
          .where(eq(FundingLaborContractFile.fundingId, id)),
        tx
          .update(FundingExternalEventParticipationFeeFile)
          .set({ deletedAt: now })
          .where(eq(FundingExternalEventParticipationFeeFile.fundingId, id)),
        tx
          .update(FundingPublicationFile)
          .set({ deletedAt: now })
          .where(eq(FundingPublicationFile.fundingId, id)),
        tx
          .update(FundingProfitMakingActivityFile)
          .set({ deletedAt: now })
          .where(eq(FundingProfitMakingActivityFile.fundingId, id)),
        tx
          .update(FundingJointExpenseFile)
          .set({ deletedAt: now })
          .where(eq(FundingJointExpenseFile.fundingId, id)),
        tx
          .update(FundingEtcExpenseFile)
          .set({ deletedAt: now })
          .where(eq(FundingEtcExpenseFile.fundingId, id)),
        tx
          .update(FundingTransportationPassenger)
          .set({ deletedAt: now })
          .where(eq(FundingTransportationPassenger.fundingId, id)),
      ]);
    });
  }

  async put(
    id: number,
    funding: IFundingRequest,
    extra: IFundingExtra,
  ): Promise<MFunding> {
    return this.db.transaction(async tx => {
      const now = new Date();

      // Update funding table
      await tx
        .update(Funding)
        .set({
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
        })
        .where(eq(Funding.id, id));

      // Soft delete all related records
      await Promise.all([
        tx
          .update(FundingTradeEvidenceFile)
          .set({ deletedAt: now })
          .where(eq(FundingTradeEvidenceFile.fundingId, id)),
        tx
          .update(FundingTradeDetailFile)
          .set({ deletedAt: now })
          .where(eq(FundingTradeDetailFile.fundingId, id)),
        tx
          .update(FundingClubSuppliesImageFile)
          .set({ deletedAt: now })
          .where(eq(FundingClubSuppliesImageFile.fundingId, id)),
        tx
          .update(FundingClubSuppliesSoftwareEvidenceFile)
          .set({ deletedAt: now })
          .where(eq(FundingClubSuppliesSoftwareEvidenceFile.fundingId, id)),
        tx
          .update(FundingFixtureImageFile)
          .set({ deletedAt: now })
          .where(eq(FundingFixtureImageFile.fundingId, id)),
        tx
          .update(FundingFixtureSoftwareEvidenceFile)
          .set({ deletedAt: now })
          .where(eq(FundingFixtureSoftwareEvidenceFile.fundingId, id)),
        tx
          .update(FundingNonCorporateTransactionFile)
          .set({ deletedAt: now })
          .where(eq(FundingNonCorporateTransactionFile.fundingId, id)),
        tx
          .update(FundingFoodExpenseFile)
          .set({ deletedAt: now })
          .where(eq(FundingFoodExpenseFile.fundingId, id)),
        tx
          .update(FundingLaborContractFile)
          .set({ deletedAt: now })
          .where(eq(FundingLaborContractFile.fundingId, id)),
        tx
          .update(FundingExternalEventParticipationFeeFile)
          .set({ deletedAt: now })
          .where(eq(FundingExternalEventParticipationFeeFile.fundingId, id)),
        tx
          .update(FundingPublicationFile)
          .set({ deletedAt: now })
          .where(eq(FundingPublicationFile.fundingId, id)),
        tx
          .update(FundingProfitMakingActivityFile)
          .set({ deletedAt: now })
          .where(eq(FundingProfitMakingActivityFile.fundingId, id)),
        tx
          .update(FundingJointExpenseFile)
          .set({ deletedAt: now })
          .where(eq(FundingJointExpenseFile.fundingId, id)),
        tx
          .update(FundingEtcExpenseFile)
          .set({ deletedAt: now })
          .where(eq(FundingEtcExpenseFile.fundingId, id)),
        tx
          .update(FundingTransportationPassenger)
          .set({ deletedAt: now })
          .where(eq(FundingTransportationPassenger.fundingId, id)),
      ]);

      // Insert new related records
      await Promise.all([
        // Trade files
        ...funding.tradeEvidenceFiles.map(file =>
          tx.insert(FundingTradeEvidenceFile).values({
            fundingId: id,
            fileId: file.id,
          }),
        ),
        ...funding.tradeDetailFiles.map(file =>
          tx.insert(FundingTradeDetailFile).values({
            fundingId: id,
            fileId: file.id,
          }),
        ),

        // ClubOld supplies files
        ...(funding.clubSupplies && funding.clubSupplies.imageFiles
          ? funding.clubSupplies.imageFiles.map(file =>
              tx.insert(FundingClubSuppliesImageFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),
        ...(funding.clubSupplies && funding.clubSupplies.softwareEvidenceFiles
          ? funding.clubSupplies.softwareEvidenceFiles.map(file =>
              tx.insert(FundingClubSuppliesSoftwareEvidenceFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Fixture files
        ...(funding.isFixture && funding.fixture.imageFiles
          ? funding.fixture.imageFiles.map(file =>
              tx.insert(FundingFixtureImageFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),
        ...(funding.isFixture && funding.fixture.softwareEvidenceFiles
          ? funding.fixture.softwareEvidenceFiles.map(file =>
              tx.insert(FundingFixtureSoftwareEvidenceFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // NonCorporateTransaction files
        ...(funding.isNonCorporateTransaction && funding.nonCorporateTransaction
          ? funding.nonCorporateTransaction.files.map(file =>
              tx.insert(FundingNonCorporateTransactionFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Food expense files
        ...(funding.isFoodExpense && funding.foodExpense
          ? funding.foodExpense.files.map(file =>
              tx.insert(FundingFoodExpenseFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Labor contract files
        ...(funding.isLaborContract && funding.laborContract
          ? funding.laborContract.files.map(file =>
              tx.insert(FundingLaborContractFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // External event participation fee files
        ...(funding.isExternalEventParticipationFee &&
        funding.externalEventParticipationFee
          ? funding.externalEventParticipationFee.files.map(file =>
              tx.insert(FundingExternalEventParticipationFeeFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Publication files
        ...(funding.isPublication && funding.publication
          ? funding.publication.files.map(file =>
              tx.insert(FundingPublicationFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Profit making activity files
        ...(funding.isProfitMakingActivity && funding.profitMakingActivity
          ? funding.profitMakingActivity.files.map(file =>
              tx.insert(FundingProfitMakingActivityFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Joint expense files
        ...(funding.isJointExpense && funding.jointExpense
          ? funding.jointExpense.files.map(file =>
              tx.insert(FundingJointExpenseFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Etc expense files
        ...(funding.isEtcExpense && funding.etcExpense
          ? funding.etcExpense.files.map(file =>
              tx.insert(FundingEtcExpenseFile).values({
                fundingId: id,
                fileId: file.id,
              }),
            )
          : []),

        // Transportation passengers
        ...(funding.isTransportation && funding.transportation
          ? funding.transportation.passengers.map(passenger =>
              tx.insert(FundingTransportationPassenger).values({
                fundingId: id,
                studentId: passenger.id,
              }),
            )
          : []),
      ]);

      return this.fetch(id);
    });
  }

  async patchSummaryTx(
    tx: DrizzleTransaction,
    oldbie: IFundingSummary,
    consumer: (
      _oldbie: IFundingSummary,
    ) => Partial<FundingDBResult> & { id: number },
  ): Promise<IFundingSummary> {
    const param = consumer(oldbie);
    await tx
      .update(Funding)
      .set(param)
      .where(eq(Funding.id, param.id))
      .execute();

    return this.fetch(oldbie.id);
  }

  async patchSummary(
    oldbie: IFundingSummary,
    consumer: (_oldbie: IFundingSummary) => IFundingSummary,
  ): Promise<IFundingSummary> {
    return this.db.transaction(async tx =>
      this.patchSummaryTx(tx, oldbie, consumer),
    );
  }

  async fetchSummary(id: number): Promise<VFundingSummary> {
    return this.db.transaction(async tx => this.fetchSummaryTx(tx, id));
  }

  async fetchSummaryTx(
    tx: DrizzleTransaction,
    id: number,
  ): Promise<VFundingSummary> {
    const result = (await tx
      .select()
      .from(Funding)
      .where(eq(Funding.id, id))) as FundingSummaryDBResult[];

    if (result.length === 0) {
      throw new NotFoundException(`Funding: ${id} not found`);
    }

    return VFundingSummary.fromDBResult(result[0]);
  }

  async patchStatus(param: {
    id: IFunding["id"];
    fundingStatusEnum: IFunding["fundingStatusEnum"];
    approvedAmount: IFunding["approvedAmount"];
    commentedAt: IFunding["commentedAt"];
  }): Promise<VFundingSummary> {
    return this.db.transaction(async tx => this.patchStatusTx(tx, param));
  }

  async patchStatusTx(
    tx: DrizzleTransaction,
    param: {
      id: IFunding["id"];
      fundingStatusEnum: IFunding["fundingStatusEnum"];
      approvedAmount: IFunding["approvedAmount"];
      commentedAt: IFunding["commentedAt"];
    },
  ): Promise<VFundingSummary> {
    const now = new Date();

    await tx
      .update(Funding)
      .set({
        fundingStatusEnum: param.fundingStatusEnum,
        approvedAmount: param.approvedAmount,
        commentedAt: param.commentedAt,
        editedAt: now,
      })
      .where(eq(Funding.id, param.id));

    return this.fetchSummaryTx(tx, param.id);
  }
}
