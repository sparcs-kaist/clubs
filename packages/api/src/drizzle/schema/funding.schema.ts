import {
  boolean,
  datetime,
  foreignKey,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import { Activity } from "./activity.schema";
import { Club } from "./club.schema";
import { ActivityD } from "./semester.schema";
import { Executive, Student } from "./user.schema";

export const Funding = mysqlTable(
  "funding",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    clubId: int("club_id").notNull(),
    activityDId: int("activity_d_id")
      .notNull()
      .references(() => ActivityD.id),
    fundingStatusEnum: int("funding_status_enum")
      .notNull()
      .default(FundingStatusEnum.Applied),
    purposeActivityId: int("purpose_activity_id"),
    name: varchar("name", { length: 255 }).notNull(),
    expenditureDate: datetime("expenditure_date").notNull(),
    expenditureAmount: int("expenditure_amount").notNull(),
    approvedAmount: int("approved_amount"),
    tradeDetailExplanation: text("trade_detail_explanation"),
    clubSuppliesName: varchar("club_supplies_name", { length: 255 }),
    clubSuppliesEvidenceEnum: int("club_supplies_evidence_enum"),
    clubSuppliesClassEnum: int("club_supplies_class_enum"),
    clubSuppliesPurpose: text("club_supplies_purpose"),
    clubSuppliesSoftwareEvidence: text("club_supplies_software_evidence"),
    numberOfClubSupplies: int("number_of_club_supplies"),
    priceOfClubSupplies: int("price_of_club_supplies"),
    isFixture: boolean("is_fixture"),
    fixtureName: varchar("fixture_name", { length: 255 }),
    fixtureEvidenceEnum: int("fixture_evidence_enum"),
    fixtureClassEnum: int("fixture_class_enum"),
    fixturePurpose: text("fixture_purpose"),
    fixtureSoftwareEvidence: text("fixture_software_evidence"),
    numberOfFixture: int("number_of_fixture"),
    priceOfFixture: int("price_of_fixture"),
    isTransportation: boolean("is_transportation").notNull(),
    transportationEnum: int("transportation_enum"),
    origin: varchar("origin", { length: 255 }),
    destination: varchar("destination", { length: 255 }),
    purposeOfTransportation: text("purpose_of_transportation"),
    isNonCorporateTransaction: boolean(
      "is_non_corporate_transaction",
    ).notNull(),
    traderName: varchar("trader_name", { length: 255 }),
    traderAccountNumber: varchar("trader_account_number", { length: 255 }),
    wasteExplanation: text("waste_explanation"),
    isFoodExpense: boolean("is_food_expense").notNull(),
    foodExpenseExplanation: text("food_expense_explanation"),
    isLaborContract: boolean("is_labor_contract").notNull(),
    laborContractExplanation: text("labor_contract_explanation"),
    isExternalEventParticipationFee: boolean(
      "is_external_event_participation_fee",
    ).notNull(),
    externalEventParticipationFeeExplanation: text(
      "external_event_participation_fee_explanation",
    ),
    isPublication: boolean("is_publication").notNull(),
    publicationExplanation: text("publication_explanation"),
    isProfitMakingActivity: boolean("is_profit_making_activity").notNull(),
    profitMakingActivityExplanation: text("profit_making_activity_explanation"),
    isJointExpense: boolean("is_joint_expense").notNull(),
    jointExpenseExplanation: text("joint_expense_explanation"),
    isEtcExpense: boolean("is_etc_expense").notNull(),
    etcExpenseExplanation: text("etc_expense_explanation"),
    chargedExecutiveId: int("charged_executive_id"),
    editedAt: timestamp("edited_at").defaultNow().notNull(),
    commentedAt: timestamp("commented_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    clubForeignKey: foreignKey({
      name: "funding_club_id_fk",
      columns: [table.clubId],
      foreignColumns: [Club.id],
    }),
    purposeForeignKey: foreignKey({
      name: "funding_purpose_id_fk",
      columns: [table.purposeActivityId],
      foreignColumns: [Activity.id],
    }),
    executiveForeignKey: foreignKey({
      name: "funding_charged_executive_id_fk",
      columns: [table.chargedExecutiveId],
      foreignColumns: [Executive.id],
    }),
  }),
);

export const FundingTradeEvidenceFile = mysqlTable(
  "funding_trade_evidence_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "trade_evidence_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingTradeDetailFile = mysqlTable(
  "funding_trade_detail_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "trade_detail_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingNonCorporateTransactionFile = mysqlTable(
  "funding_non_corporate_transaction_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "non_corporate_transaction_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingFoodExpenseFile = mysqlTable(
  "funding_food_expense_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "food_expense_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingLaborContractFile = mysqlTable(
  "funding_labor_contract_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "labor_contract_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingExternalEventParticipationFeeFile = mysqlTable(
  "funding_external_event_participation_fee_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "external_event_participation_fee_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingPublicationFile = mysqlTable(
  "funding_publication_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "publication_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingProfitMakingActivityFile = mysqlTable(
  "funding_profit_making_activity_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "profit_making_activity_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingJointExpenseFile = mysqlTable(
  "funding_joint_expense_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "joint_expense_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingEtcExpenseFile = mysqlTable(
  "funding_etc_expense_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "etc_expense_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingClubSuppliesImageFile = mysqlTable(
  "funding_club_supplies_image_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "club_supplies_image_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingFixtureImageFile = mysqlTable(
  "funding_fixture_image_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "fixture_image_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingClubSuppliesSoftwareEvidenceFile = mysqlTable(
  "funding_club_supplies_software_evidence_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "club_supplies_software_evidence_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingFixtureSoftwareEvidenceFile = mysqlTable(
  "funding_fixture_software_evidence_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    fileId: varchar("file_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "fixture_software_evidence_file_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
  }),
);

export const FundingTransportationPassenger = mysqlTable(
  "funding_transportation_passenger",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    studentId: int("student_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "transportation_passenger_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
    studentForeignKey: foreignKey({
      name: "transportation_passenger_student_id_fk",
      columns: [table.studentId],
      foreignColumns: [Student.id],
    }),
  }),
);

export const FundingFeedback = mysqlTable(
  "funding_feedback",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    fundingId: int("funding_id").notNull(),
    executiveId: int("executive_id").notNull(),
    content: text("feedback").notNull(),
    fundingStatusEnum: int("funding_status_enum").notNull(), // Funding 에서 이관
    approvedAmount: int("approved_amount").notNull(), // Funding 에서 이관
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    fundingForeignKey: foreignKey({
      name: "funding_feedback_funding_id_fk",
      columns: [table.fundingId],
      foreignColumns: [Funding.id],
    }),
    executiveForeignKey: foreignKey({
      name: "funding_feedback_executive_id_fk",
      columns: [table.executiveId],
      foreignColumns: [Executive.id],
    }),
  }),
);
