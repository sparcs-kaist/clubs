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

import { Club } from "./club.schema";
import { ActivityD, SemesterD } from "./semester.schema";
import { Executive, Student } from "./user.schema";

export const ActivityTypeEnum = mysqlTable("activity_type_enum", {
  id: int("id").autoincrement().primaryKey().notNull(),
  typeName: varchar("type_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const ActivityStatusEnum = mysqlTable("activity_status_enum", {
  id: int("id").autoincrement().primaryKey().notNull(),
  statusName: varchar("status_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const Activity = mysqlTable(
  "activity",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    clubId: int("club_id").notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    activityTypeEnumId: int("activity_type_enum_id").notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    purpose: text("purpose").notNull(),
    detail: text("detail").notNull(),
    evidence: text("evidence").notNull(),
    activityDId: int("activity_d_id")
      .notNull()
      .references(() => ActivityD.id),
    activityStatusEnumId: int("activity_status_enum_id")
      .notNull()
      .references(() => ActivityStatusEnum.id),
    // 비정규화 메모 칼럼들
    chargedExecutiveId: int("charged_executive_id").references(
      () => Executive.id,
    ),
    professorApprovedAt: timestamp("professor_approved_at"),
    commentedAt: timestamp("commented_at"),
    commentedExecutiveId: int("commented_executive_id").references(
      () => Executive.id,
    ),
    // DB레벨 시간 칼럼들
    editedAt: timestamp("edited_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    executiveForeignKey: foreignKey({
      name: "activity_charged_executive_id_fk",
      columns: [table.chargedExecutiveId],
      foreignColumns: [Executive.id],
    }),
  }),
);

export const ActivityParticipant = mysqlTable(
  "activity_participant",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    activityId: int("activity_id").notNull(),
    studentId: int("student_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    activityForeignKey: foreignKey({
      name: "activity_participant_activity_id_fk",
      columns: [table.activityId],
      foreignColumns: [Activity.id],
    }),
    studentForeignKey: foreignKey({
      name: "activity_participant_student_id_fk",
      columns: [table.studentId],
      foreignColumns: [Student.id],
    }),
  }),
);

export const ActivityT = mysqlTable(
  "activity_t",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    activityId: int("activity_id").notNull(),
    startTerm: datetime("start_term").notNull(),
    endTerm: datetime("end_term").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    activityForeignKey: foreignKey({
      columns: [table.activityId],
      foreignColumns: [Activity.id],
    }),
  }),
);

export const ActivityFeedback = mysqlTable(
  "activity_feedback",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    activityId: int("activity_id").notNull(),
    executiveId: int("executive_id").notNull(),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    activityForeignKey: foreignKey({
      columns: [table.activityId],
      foreignColumns: [Activity.id],
    }),
    executiveForeignKey: foreignKey({
      columns: [table.executiveId],
      foreignColumns: [Executive.id],
    }),
  }),
);

export const ActivityEvidenceFile = mysqlTable(
  "activity_evidence_file",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    activityId: int("activity_id").notNull(),
    // TODO: 파일 업로드 완성되면 연결하기
    fileId: text("file_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    activityForeignKey: foreignKey({
      name: "activity_evidence_file_activity_id_fk",
      columns: [table.activityId],
      foreignColumns: [Activity.id],
    }),
  }),
);

export const ProfessorSignStatus = mysqlTable(
  "professor_sign_status",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    clubId: int("club_id").notNull(),
    semesterId: int("semester_id").notNull(),
    signed: boolean("signed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    clubForeignKey: foreignKey({
      name: "professor_sign_status_club_id_fk",
      columns: [table.clubId],
      foreignColumns: [Club.id],
    }),
    semesterForeignKey: foreignKey({
      name: "professor_sign_status_semester_id_fk",
      columns: [table.semesterId],
      foreignColumns: [SemesterD.id],
    }),
  }),
);

export const ActivityClubChargedExecutive = mysqlTable(
  "activity_club_charged_executive",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    activityDId: int("activity_d_id").notNull(),
    clubId: int("club_id").notNull(),
    executiveId: int("executive_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    activityForeignKey: foreignKey({
      name: "activity_club_charged_executive_activity_d_id_fk",
      columns: [table.activityDId],
      foreignColumns: [ActivityD.id],
    }),
    clubForeignKey: foreignKey({
      name: "activity_club_charged_executive_club_id_fk",
      columns: [table.clubId],
      foreignColumns: [Club.id],
    }),
    executiveForeignKey: foreignKey({
      name: "activity_club_charged_executive_executive_id_fk",
      columns: [table.executiveId],
      foreignColumns: [Executive.id],
    }),
  }),
);
