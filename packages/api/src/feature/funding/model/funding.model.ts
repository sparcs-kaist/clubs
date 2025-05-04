import { IActivitySummary } from "@clubs/interface/api/activity/type/activity.type";
import {
  IClubSupplies,
  IFixture,
  IFunding,
  IMinorExpense,
  INonCorporateTransaction,
  ITransportation,
} from "@clubs/interface/api/funding/type/funding.type";
import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

export type FundingDBResult = {
  funding: {
    id: number;
    clubId: number;
    purposeActivityId?: number;
    activityDId: number;
    fundingStatusEnum?: number;
    name: string;
    expenditureDate: Date;
    expenditureAmount: number;
    approvedAmount?: number;
    editedAt: Date;
    commentedAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    isFixture: boolean;
    isTransportation: boolean;
    isFoodExpense: boolean;
    isLaborContract: boolean;
    isExternalEventParticipationFee: boolean;
    isPublication: boolean;
    isProfitMakingActivity: boolean;
    isJointExpense: boolean;
    isEtcExpense: boolean;
    isNonCorporateTransaction: boolean;
    clubSuppliesName: string;
    clubSuppliesEvidenceEnum: number;
    clubSuppliesClassEnum: number;
    clubSuppliesPurpose: string;
    clubSuppliesSoftwareEvidence: string;
    numberOfClubSupplies: number;
    priceOfClubSupplies: number;
    fixtureName: string;
    fixtureEvidenceEnum: number;
    fixtureClassEnum: number;
    fixturePurpose: string;
    fixtureSoftwareEvidence: string;
    numberOfFixture: number;
    priceOfFixture: number;
    tradeDetailExplanation: string;
    traderName: string;
    traderAccountNumber: string;
    wasteExplanation: string;
    foodExpenseExplanation: string;
    laborContractExplanation: string;
    externalEventParticipationFeeExplanation: string;
    publicationExplanation: string;
    profitMakingActivityExplanation: string;
    jointExpenseExplanation: string;
    etcExpenseExplanation: string;
    transportationEnum: number;
    origin: string;
    destination: string;
    purposeOfTransportation: string;
  };
  fundingFeedback?: {
    feedback?: string;
  };
  tradeEvidenceFiles: { id: string }[];
  tradeDetailFiles: { id: string }[];
  clubSuppliesImageFiles?: Array<{
    id: string;
  }>;
  clubSuppliesSoftwareEvidenceFiles?: Array<{
    id: string;
  }>;
  fixtureImageFiles?: Array<{ id: string }>;
  fixtureSoftwareEvidenceFiles?: Array<{
    id: string;
  }>;
  nonCorporateTransactionFiles?: Array<{ id: string }>;
  foodExpenseFiles?: Array<{ id: string }>;
  laborContractFiles?: Array<{ id: string }>;
  externalEventParticipationFeeFiles?: Array<{
    id: string;
  }>;
  publicationFiles?: Array<{ id: string }>;
  profitMakingActivityFiles?: Array<{
    id: string;
  }>;
  jointExpenseFiles?: Array<{ id: string }>;
  etcExpenseFiles?: Array<{ id: string }>;
  transportationPassengers?: Array<{
    id: number;
  }>;
};

export class MFunding implements IFunding {
  id: number;

  club: { id: number };

  activityD: { id: number };

  fundingStatusEnum: FundingStatusEnum;

  purposeActivity: Pick<IActivitySummary, "id">;

  name: string;

  expenditureDate: Date;

  expenditureAmount: number;

  approvedAmount?: number;

  tradeEvidenceFiles: { id: string }[];

  tradeDetailFiles: { id: string }[];

  tradeDetailExplanation: string;

  clubSupplies?: IClubSupplies;

  isFixture: boolean;

  fixture?: IFixture;

  isTransportation: boolean;

  transportation?: ITransportation;

  isNonCorporateTransaction: boolean;

  nonCorporateTransaction?: INonCorporateTransaction;

  isFoodExpense: boolean;

  foodExpense?: IMinorExpense;

  isLaborContract: boolean;

  laborContract?: IMinorExpense;

  isExternalEventParticipationFee: boolean;

  externalEventParticipationFee?: IMinorExpense;

  isPublication: boolean;

  publication?: IMinorExpense;

  isProfitMakingActivity: boolean;

  profitMakingActivity?: IMinorExpense;

  isJointExpense: boolean;

  jointExpense?: IMinorExpense;

  isEtcExpense: boolean;

  etcExpense?: IMinorExpense;

  editedAt: Date;

  commentedAt?: Date;

  createdAt: Date;

  updatedAt?: Date;

  constructor(data: MFunding) {
    Object.assign(this, data);
  }

  static fromDBResult(result: FundingDBResult) {
    return new MFunding({
      id: result.funding.id,
      club: { id: result.funding.clubId },
      name: result.funding.name,
      activityD: { id: result.funding.activityDId },
      fundingStatusEnum: result.funding.fundingStatusEnum,
      purposeActivity: result.funding.purposeActivityId
        ? {
            id: result.funding.purposeActivityId,
          }
        : undefined,
      expenditureDate: result.funding.expenditureDate,
      expenditureAmount: result.funding.expenditureAmount,
      approvedAmount: result.funding.approvedAmount,
      tradeEvidenceFiles: result.tradeEvidenceFiles.map(file => ({
        id: file.id,
      })),
      tradeDetailFiles: result.tradeDetailFiles.map(file => ({
        id: file.id,
      })),
      tradeDetailExplanation: result.funding.tradeDetailExplanation,
      isFixture: result.funding.isFixture,
      isTransportation: result.funding.isTransportation,
      isNonCorporateTransaction: result.funding.isNonCorporateTransaction,
      isFoodExpense: result.funding.isFoodExpense,
      isLaborContract: result.funding.isLaborContract,
      isExternalEventParticipationFee:
        result.funding.isExternalEventParticipationFee,
      isPublication: result.funding.isPublication,
      isProfitMakingActivity: result.funding.isProfitMakingActivity,
      isJointExpense: result.funding.isJointExpense,
      isEtcExpense: result.funding.isEtcExpense,
      clubSupplies: result.funding.purposeActivityId
        ? undefined
        : {
            name: result.funding.clubSuppliesName,
            evidenceEnum: result.funding.clubSuppliesEvidenceEnum,
            classEnum: result.funding.clubSuppliesClassEnum,
            purpose: result.funding.clubSuppliesPurpose,
            softwareEvidence: result.funding.clubSuppliesSoftwareEvidence,
            number: result.funding.numberOfClubSupplies,
            price: result.funding.priceOfClubSupplies,
            imageFiles: result.clubSuppliesImageFiles.map(file => ({
              id: file.id,
            })),
            softwareEvidenceFiles: result.clubSuppliesSoftwareEvidenceFiles.map(
              file => ({
                id: file.id,
              }),
            ),
          },
      fixture: result.funding.isFixture
        ? {
            name: result.funding.fixtureName,
            purpose: result.funding.fixturePurpose,
            evidenceEnum: result.funding.fixtureEvidenceEnum,
            classEnum: result.funding.fixtureClassEnum,
            softwareEvidence: result.funding.fixtureSoftwareEvidence,
            number: result.funding.numberOfFixture,
            price: result.funding.priceOfFixture,
            imageFiles: result.fixtureImageFiles.map(file => ({
              id: file.id,
            })),
            softwareEvidenceFiles: result.fixtureSoftwareEvidenceFiles.map(
              file => ({
                id: file.id,
              }),
            ),
          }
        : undefined,
      transportation: result.funding.isTransportation
        ? {
            enum: result.funding.transportationEnum,
            origin: result.funding.origin,
            destination: result.funding.destination,
            purpose: result.funding.purposeOfTransportation,
            passengers: result.transportationPassengers.map(passenger => ({
              id: passenger.id,
            })),
          }
        : undefined,
      nonCorporateTransaction: result.funding.isNonCorporateTransaction
        ? {
            traderName: result.funding.traderName,
            traderAccountNumber: result.funding.traderAccountNumber,
            wasteExplanation: result.funding.wasteExplanation,
            files: result.nonCorporateTransactionFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      foodExpense: result.funding.isFoodExpense
        ? {
            explanation: result.funding.foodExpenseExplanation,
            files: result.foodExpenseFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      laborContract: result.funding.isLaborContract
        ? {
            explanation: result.funding.laborContractExplanation,
            files: result.laborContractFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      externalEventParticipationFee: result.funding
        .isExternalEventParticipationFee
        ? {
            explanation:
              result.funding.externalEventParticipationFeeExplanation,
            files: result.externalEventParticipationFeeFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      publication: result.funding.isPublication
        ? {
            explanation: result.funding.publicationExplanation,
            files: result.publicationFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      profitMakingActivity: result.funding.isProfitMakingActivity
        ? {
            explanation: result.funding.profitMakingActivityExplanation,
            files: result.profitMakingActivityFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      jointExpense: result.funding.isJointExpense
        ? {
            explanation: result.funding.jointExpenseExplanation,
            files: result.jointExpenseFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      etcExpense: result.funding.isEtcExpense
        ? {
            explanation: result.funding.etcExpenseExplanation,
            files: result.etcExpenseFiles.map(file => ({
              id: file.id,
            })),
          }
        : undefined,
      editedAt: result.funding.editedAt,
      commentedAt: result.funding.commentedAt,
      createdAt: result.funding.createdAt,
      updatedAt: result.funding.updatedAt,
    });
  }
}
