import {
  date,
  foreignKey,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { Club } from "./club.schema";
import { Division } from "./division.schema";
import { File } from "./file.schema";
import { SemesterD } from "./semester.schema";
import { Executive, Professor, Student } from "./user.schema";

export const RegistrationTypeEnum = mysqlTable("registration_type_enum", {
  enumId: int("enum_id").autoincrement().primaryKey(),
  enumName: varchar("enum_name", { length: 30 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const RegistrationStatusEnum = mysqlTable("registration_status_enum", {
  enumId: int("enum_id").autoincrement().primaryKey(),
  enumName: varchar("enum_name", { length: 30 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Registration 테이블 정의
export const Registration = mysqlTable(
  "registration",
  {
    id: int("id").autoincrement().primaryKey(),
    clubId: int("club_id").references(() => Club.id),
    semesterId: int("semester_d_id").references(() => SemesterD.id),
    registrationApplicationTypeEnumId: int(
      "registration_application_type_enum_id",
    ).notNull(),
    // .references(() => RegistrationTypeEnum.enumId),
    registrationApplicationStatusEnumId: int(
      "registration_application_status_enum_id",
    ).notNull(),
    // .references(() => RegistrationStatusEnum.enumId),
    clubNameKr: varchar("club_name_kr", { length: 30 }),
    clubNameEn: varchar("club_name_en", { length: 100 }),
    studentId: int("student_id")
      .notNull()
      .references(() => Student.id),
    phoneNumber: varchar("phone_number", { length: 30 }),
    foundedAt: date("founded_at").notNull(),
    divisionId: int("division_id")
      .notNull()
      .references(() => Division.id),
    activityFieldKr: varchar("activity_field_kr", { length: 255 }),
    activityFieldEn: varchar("activity_field_en", { length: 255 }),
    professorId: int("professor_id").references(() => Professor.id),
    divisionConsistency: text("division_consistency"),
    foundationPurpose: text("foundation_purpose"),
    activityPlan: text("activity_plan"),
    registrationActivityPlanFileId: varchar(
      "registration_activity_plan_file_id",
      { length: 128 },
    ),
    registrationClubRuleFileId: varchar("registration_club_rule_file_id", {
      length: 128,
    }),
    registrationExternalInstructionFileId: varchar(
      "registration_external_instruction_file_id",
      { length: 128 },
    ),
    professorApprovedAt: timestamp("professor_approved_at"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    semesterIdFk: foreignKey({
      name: "registration_semester_d_id_fk",
      columns: [table.semesterId],
      foreignColumns: [SemesterD.id],
    }),
    registrationApplicationTypeEnumIdFk: foreignKey({
      name: "registration_registration_type_enum_id_fk",
      columns: [table.registrationApplicationTypeEnumId],
      foreignColumns: [RegistrationTypeEnum.enumId],
    }),
    registrationApplicationStatusEnumIdFk: foreignKey({
      name: "registration_registration_status_enum_id_fk",
      columns: [table.registrationApplicationStatusEnumId],
      foreignColumns: [RegistrationStatusEnum.enumId],
    }),
    registrationActivityPlanFileIdFk: foreignKey({
      name: "registration_activity_plan_file_id_file_id_fk",
      columns: [table.registrationActivityPlanFileId],
      foreignColumns: [File.id],
    }),
    registrationClubRuleFileIdFk: foreignKey({
      name: "registration_club_rule_file_id_file_id_fk",
      columns: [table.registrationClubRuleFileId],
      foreignColumns: [File.id],
    }),
    registrationExternalInstructionFileIdFk: foreignKey({
      name: "registration_external_instruction_file_id_file_id_fk",
      columns: [table.registrationExternalInstructionFileId],
      foreignColumns: [File.id],
    }),
  }),
);

export const RegistrationExecutiveComment = mysqlTable(
  "registration_executive_comment",
  {
    id: int("id").autoincrement().primaryKey(),
    registrationId: int("registration_id").notNull(),
    executiveId: int("executive_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    registrationExecutiveCommentRegistrationIdFk: foreignKey({
      name: "registration_executive_comment_registration_id_fk",
      columns: [table.registrationId],
      foreignColumns: [Registration.id],
    }),
    registrationExecutiveCommentExecutiveIdFk: foreignKey({
      name: "registration_executive_comment_executive_id_fk",
      columns: [table.executiveId],
      foreignColumns: [Executive.id],
    }),
  }),
);

export const RegistrationApplicationStudentStatusEnum = mysqlTable(
  "registration_application_student_status_enum",
  {
    enumId: int("enum_id").autoincrement().primaryKey(),
    enumName: varchar("enum_name", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
);

export const RegistrationApplicationStudent = mysqlTable(
  "registration_application_student",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("student_id")
      .notNull()
      .references(() => Student.id),
    clubId: int("club_id")
      .notNull()
      .references(() => Club.id),
    semesterId: int("semester_d_id").references(() => SemesterD.id),
    registrationApplicationStudentEnumId: int(
      "registration_application_student_status_enum",
    ).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    registrationStudentStatusEnumFk: foreignKey({
      columns: [table.registrationApplicationStudentEnumId],
      foreignColumns: [RegistrationApplicationStudentStatusEnum.enumId],
      name: "registration_application_student_status_enum_id_fk",
    }),
  }),
);
