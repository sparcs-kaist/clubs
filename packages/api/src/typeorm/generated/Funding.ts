import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Activity } from "./Activity";
import { ActivityD } from "./ActivityD";
import { Club } from "./Club";
import { Executive } from "./Executive";
import { FundingClubSuppliesImageFile } from "./FundingClubSuppliesImageFile";
import { FundingClubSuppliesSoftwareEvidenceFile } from "./FundingClubSuppliesSoftwareEvidenceFile";
import { FundingEtcExpenseFile } from "./FundingEtcExpenseFile";
import { FundingExternalEventParticipationFeeFile } from "./FundingExternalEventParticipationFeeFile";
import { FundingFeedback } from "./FundingFeedback";
import { FundingFixtureImageFile } from "./FundingFixtureImageFile";
import { FundingFixtureSoftwareEvidenceFile } from "./FundingFixtureSoftwareEvidenceFile";
import { FundingFoodExpenseFile } from "./FundingFoodExpenseFile";
import { FundingJointExpenseFile } from "./FundingJointExpenseFile";
import { FundingLaborContractFile } from "./FundingLaborContractFile";
import { FundingNonCorporateTransactionFile } from "./FundingNonCorporateTransactionFile";
import { FundingProfitMakingActivityFile } from "./FundingProfitMakingActivityFile";
import { FundingPublicationFile } from "./FundingPublicationFile";
import { FundingTradeDetailFile } from "./FundingTradeDetailFile";
import { FundingTradeEvidenceFile } from "./FundingTradeEvidenceFile";
import { FundingTransportationPassenger } from "./FundingTransportationPassenger";

@Index("funding_activity_d_id_activity_d_id_fk", ["activityDId"], {})
@Index("funding_club_id_fk", ["clubId"], {})
@Index("funding_purpose_id_fk", ["purposeActivityId"], {})
@Index("funding_charged_executive_id_fk", ["chargedExecutiveId"], {})
@Entity("funding", { schema: "sparcs-clubs" })
export class Funding {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "activity_d_id" })
  activityDId: number;

  @Column("int", { name: "funding_status_enum", default: () => "'1'" })
  fundingStatusEnum: number;

  @Column("int", { name: "purpose_activity_id", nullable: true })
  purposeActivityId: number | null;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("datetime", { name: "expenditure_date" })
  expenditureDate: Date;

  @Column("int", { name: "expenditure_amount" })
  expenditureAmount: number;

  @Column("int", { name: "approved_amount", nullable: true })
  approvedAmount: number | null;

  @Column("text", { name: "trade_detail_explanation", nullable: true })
  tradeDetailExplanation: string | null;

  @Column("varchar", {
    name: "club_supplies_name",
    nullable: true,
    length: 255,
  })
  clubSuppliesName: string | null;

  @Column("int", { name: "club_supplies_evidence_enum", nullable: true })
  clubSuppliesEvidenceEnum: number | null;

  @Column("int", { name: "club_supplies_class_enum", nullable: true })
  clubSuppliesClassEnum: number | null;

  @Column("text", { name: "club_supplies_purpose", nullable: true })
  clubSuppliesPurpose: string | null;

  @Column("text", { name: "club_supplies_software_evidence", nullable: true })
  clubSuppliesSoftwareEvidence: string | null;

  @Column("int", { name: "number_of_club_supplies", nullable: true })
  numberOfClubSupplies: number | null;

  @Column("int", { name: "price_of_club_supplies", nullable: true })
  priceOfClubSupplies: number | null;

  @Column("tinyint", { name: "is_fixture", nullable: true, width: 1 })
  isFixture: boolean | null;

  @Column("varchar", { name: "fixture_name", nullable: true, length: 255 })
  fixtureName: string | null;

  @Column("int", { name: "fixture_evidence_enum", nullable: true })
  fixtureEvidenceEnum: number | null;

  @Column("int", { name: "fixture_class_enum", nullable: true })
  fixtureClassEnum: number | null;

  @Column("text", { name: "fixture_purpose", nullable: true })
  fixturePurpose: string | null;

  @Column("text", { name: "fixture_software_evidence", nullable: true })
  fixtureSoftwareEvidence: string | null;

  @Column("int", { name: "number_of_fixture", nullable: true })
  numberOfFixture: number | null;

  @Column("int", { name: "price_of_fixture", nullable: true })
  priceOfFixture: number | null;

  @Column("tinyint", { name: "is_transportation", width: 1 })
  isTransportation: boolean;

  @Column("int", { name: "transportation_enum", nullable: true })
  transportationEnum: number | null;

  @Column("varchar", { name: "origin", nullable: true, length: 255 })
  origin: string | null;

  @Column("varchar", { name: "destination", nullable: true, length: 255 })
  destination: string | null;

  @Column("text", { name: "purpose_of_transportation", nullable: true })
  purposeOfTransportation: string | null;

  @Column("tinyint", { name: "is_non_corporate_transaction", width: 1 })
  isNonCorporateTransaction: boolean;

  @Column("varchar", { name: "trader_name", nullable: true, length: 255 })
  traderName: string | null;

  @Column("varchar", {
    name: "trader_account_number",
    nullable: true,
    length: 255,
  })
  traderAccountNumber: string | null;

  @Column("text", { name: "waste_explanation", nullable: true })
  wasteExplanation: string | null;

  @Column("tinyint", { name: "is_food_expense", width: 1 })
  isFoodExpense: boolean;

  @Column("text", { name: "food_expense_explanation", nullable: true })
  foodExpenseExplanation: string | null;

  @Column("tinyint", { name: "is_labor_contract", width: 1 })
  isLaborContract: boolean;

  @Column("text", { name: "labor_contract_explanation", nullable: true })
  laborContractExplanation: string | null;

  @Column("tinyint", { name: "is_external_event_participation_fee", width: 1 })
  isExternalEventParticipationFee: boolean;

  @Column("text", {
    name: "external_event_participation_fee_explanation",
    nullable: true,
  })
  externalEventParticipationFeeExplanation: string | null;

  @Column("tinyint", { name: "is_publication", width: 1 })
  isPublication: boolean;

  @Column("text", { name: "publication_explanation", nullable: true })
  publicationExplanation: string | null;

  @Column("tinyint", { name: "is_profit_making_activity", width: 1 })
  isProfitMakingActivity: boolean;

  @Column("text", {
    name: "profit_making_activity_explanation",
    nullable: true,
  })
  profitMakingActivityExplanation: string | null;

  @Column("tinyint", { name: "is_joint_expense", width: 1 })
  isJointExpense: boolean;

  @Column("text", { name: "joint_expense_explanation", nullable: true })
  jointExpenseExplanation: string | null;

  @Column("tinyint", { name: "is_etc_expense", width: 1 })
  isEtcExpense: boolean;

  @Column("text", { name: "etc_expense_explanation", nullable: true })
  etcExpenseExplanation: string | null;

  @Column("int", { name: "charged_executive_id", nullable: true })
  chargedExecutiveId: number | null;

  @Column("timestamp", { name: "edited_at", default: () => "'now()'" })
  editedAt: Date;

  @Column("timestamp", { name: "commented_at", nullable: true })
  commentedAt: Date | null;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at", default: () => "'now()'" })
  updatedAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => ActivityD, activityD => activityD.fundings, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "activity_d_id", referencedColumnName: "id" }])
  activityD: Promise<ActivityD>;

  @ManyToOne(() => Executive, executive => executive.fundings, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "charged_executive_id", referencedColumnName: "id" }])
  chargedExecutive: Promise<Executive>;

  @ManyToOne(() => Club, club => club.fundings, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => Activity, activity => activity.fundings, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "purpose_activity_id", referencedColumnName: "id" }])
  purposeActivity: Promise<Activity>;

  @OneToMany(
    () => FundingClubSuppliesImageFile,
    fundingClubSuppliesImageFile => fundingClubSuppliesImageFile.funding,
    { lazy: true },
  )
  fundingClubSuppliesImageFiles: Promise<FundingClubSuppliesImageFile[]>;

  @OneToMany(
    () => FundingClubSuppliesSoftwareEvidenceFile,
    fundingClubSuppliesSoftwareEvidenceFile =>
      fundingClubSuppliesSoftwareEvidenceFile.funding,
    { lazy: true },
  )
  fundingClubSuppliesSoftwareEvidenceFiles: Promise<
    FundingClubSuppliesSoftwareEvidenceFile[]
  >;

  @OneToMany(
    () => FundingEtcExpenseFile,
    fundingEtcExpenseFile => fundingEtcExpenseFile.funding,
    { lazy: true },
  )
  fundingEtcExpenseFiles: Promise<FundingEtcExpenseFile[]>;

  @OneToMany(
    () => FundingExternalEventParticipationFeeFile,
    fundingExternalEventParticipationFeeFile =>
      fundingExternalEventParticipationFeeFile.funding,
    { lazy: true },
  )
  fundingExternalEventParticipationFeeFiles: Promise<
    FundingExternalEventParticipationFeeFile[]
  >;

  @OneToMany(
    () => FundingFeedback,
    fundingFeedback => fundingFeedback.funding,
    { lazy: true },
  )
  fundingFeedbacks: Promise<FundingFeedback[]>;

  @OneToMany(
    () => FundingFixtureImageFile,
    fundingFixtureImageFile => fundingFixtureImageFile.funding,
    { lazy: true },
  )
  fundingFixtureImageFiles: Promise<FundingFixtureImageFile[]>;

  @OneToMany(
    () => FundingFixtureSoftwareEvidenceFile,
    fundingFixtureSoftwareEvidenceFile =>
      fundingFixtureSoftwareEvidenceFile.funding,
    { lazy: true },
  )
  fundingFixtureSoftwareEvidenceFiles: Promise<
    FundingFixtureSoftwareEvidenceFile[]
  >;

  @OneToMany(
    () => FundingFoodExpenseFile,
    fundingFoodExpenseFile => fundingFoodExpenseFile.funding,
    { lazy: true },
  )
  fundingFoodExpenseFiles: Promise<FundingFoodExpenseFile[]>;

  @OneToMany(
    () => FundingJointExpenseFile,
    fundingJointExpenseFile => fundingJointExpenseFile.funding,
    { lazy: true },
  )
  fundingJointExpenseFiles: Promise<FundingJointExpenseFile[]>;

  @OneToMany(
    () => FundingLaborContractFile,
    fundingLaborContractFile => fundingLaborContractFile.funding,
    { lazy: true },
  )
  fundingLaborContractFiles: Promise<FundingLaborContractFile[]>;

  @OneToMany(
    () => FundingNonCorporateTransactionFile,
    fundingNonCorporateTransactionFile =>
      fundingNonCorporateTransactionFile.funding,
    { lazy: true },
  )
  fundingNonCorporateTransactionFiles: Promise<
    FundingNonCorporateTransactionFile[]
  >;

  @OneToMany(
    () => FundingProfitMakingActivityFile,
    fundingProfitMakingActivityFile => fundingProfitMakingActivityFile.funding,
    { lazy: true },
  )
  fundingProfitMakingActivityFiles: Promise<FundingProfitMakingActivityFile[]>;

  @OneToMany(
    () => FundingPublicationFile,
    fundingPublicationFile => fundingPublicationFile.funding,
    { lazy: true },
  )
  fundingPublicationFiles: Promise<FundingPublicationFile[]>;

  @OneToMany(
    () => FundingTradeDetailFile,
    fundingTradeDetailFile => fundingTradeDetailFile.funding,
    { lazy: true },
  )
  fundingTradeDetailFiles: Promise<FundingTradeDetailFile[]>;

  @OneToMany(
    () => FundingTradeEvidenceFile,
    fundingTradeEvidenceFile => fundingTradeEvidenceFile.funding,
    { lazy: true },
  )
  fundingTradeEvidenceFiles: Promise<FundingTradeEvidenceFile[]>;

  @OneToMany(
    () => FundingTransportationPassenger,
    fundingTransportationPassenger => fundingTransportationPassenger.funding,
    { lazy: true },
  )
  fundingTransportationPassengers: Promise<FundingTransportationPassenger[]>;
}
