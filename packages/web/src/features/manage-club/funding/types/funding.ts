import { IActivitySummary } from "@clubs/interface/api/activity/type/activity.type";
import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";
import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
  FundingStatusEnum,
  TransportationEnum,
} from "@clubs/interface/common/enum/funding.enum";

import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";

export interface PastFundingData {
  id: number;
  activityName: string;
  name: string;
  expenditureAmount: number;
  approvedAmount?: number;
}

export interface NewFundingData extends PastFundingData {
  fundingStatusEnum: FundingStatusEnum;
}

export interface FundingInfo {
  purposeActivity?: IActivitySummary;
  name: string;
  expenditureDate: Date;
  expenditureAmount: number;
}

export interface BasicEvidence {
  tradeEvidenceFiles: FileDetail[];
  tradeDetailFiles: FileDetail[];
  tradeDetailExplanation: string;
}

export interface AddEvidence {
  // 동아리 용품 증빙
  clubSuppliesName?: string;
  clubSuppliesEvidenceEnum?: FixtureEvidenceEnum;
  clubSuppliesClassEnum?: FixtureClassEnum;
  clubSuppliesPurpose?: string;
  clubSuppliesImageFiles: FileDetail[];
  clubSuppliesSoftwareEvidence?: string;
  clubSuppliesSoftwareEvidenceFiles: FileDetail[];
  numberOfClubSupplies?: number;
  priceOfClubSupplies?: number;
  // 비품 증빙
  isFixture: boolean;
  fixtureName?: string;
  fixtureEvidenceEnum?: FixtureEvidenceEnum;
  fixtureClassEnum?: FixtureClassEnum;
  fixturePurpose?: string;
  fixtureImageFiles: FileDetail[];
  fixtureSoftwareEvidence?: string;
  fixtureSoftwareEvidenceFiles: FileDetail[];
  numberOfFixture?: number;
  priceOfFixture?: number;
  // 교통비 증빙
  isTransportation: boolean;
  transportationEnum?: TransportationEnum;
  origin?: string;
  destination?: string;
  purposeOfTransportation?: string;
  transportationPassengers: IStudentSummary[];
  // 비법인 거래 증빙
  isNonCorporateTransaction: boolean;
  traderName?: string;
  traderAccountNumber?: string;
  wasteExplanation?: string;
  // 식비, 근로 계약, 외부 행사 참가비, 발간물, 수익 사업, 공동 경비, 기타 증빙
  isFoodExpense: boolean;
  isLaborContract: boolean;
  isExternalEventParticipationFee: boolean;
  isPublication: boolean;
  isProfitMakingActivity: boolean;
  isJointExpense: boolean;
  isEtcExpense: boolean;

  foodExpenseExplanation?: string;
  laborContractExplanation?: string;
  externalEventParticipationFeeExplanation?: string;
  publicationExplanation?: string;
  profitMakingActivityExplanation?: string;
  jointExpenseExplanation?: string;
  etcExpenseExplanation?: string;

  foodExpenseFiles: FileDetail[];
  laborContractFiles: FileDetail[];
  externalEventParticipationFeeFiles: FileDetail[];
  publicationFiles: FileDetail[];
  profitMakingActivityFiles: FileDetail[];
  jointExpenseFiles: FileDetail[];
  etcExpenseFiles: FileDetail[];
  nonCorporateTransactionFiles: FileDetail[];
}

export type FundingFormData = FundingInfo & BasicEvidence & AddEvidence;

export const isActivityReportUnverifiable = (purposeId?: number) =>
  purposeId === Infinity;
