import {
  date,
  datetime,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { Division } from "./division.schema";
import { Professor, Student } from "./user.schema";

export const Club = mysqlTable("club", {
  id: int("id").autoincrement().primaryKey(),
  nameKr: varchar("name_kr", { length: 30 }).unique(),
  nameEn: varchar("name_en", { length: 100 }).unique(),
  divisionId: int("division_id") // 제일 최신의 분과
    .notNull()
    .references(() => Division.id),
  description: text("description"),
  foundingYear: int("founding_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ClubStatusEnum = mysqlTable("club_status_enum", {
  id: int("id").autoincrement().primaryKey(),
  statusName: varchar("status_name", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const SemesterD = mysqlTable("semester_d", {
  id: int("id").autoincrement().primaryKey(),
  year: int("year"),
  name: varchar("name", { length: 10 }),
  startTerm: date("start_term"),
  endTerm: date("end_term"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ClubT = mysqlTable("club_t", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("club_id")
    .notNull()
    .references(() => Club.id),
  clubStatusEnumId: int("club_status_enum_id")
    .notNull()
    .references(() => ClubStatusEnum.id),
  characteristicKr: varchar("characteristic_kr", { length: 255 }),
  characteristicEn: varchar("characteristic_en", { length: 255 }),
  professorId: int("professor_id").references(() => Professor.id),
  semesterId: int("semester_id")
    .notNull()
    .references(() => SemesterD.id),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// 동아리의 분과 변경 이력
export const ClubDivisionT = mysqlTable("club_division_t", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("club_id")
    .notNull()
    .references(() => Club.id),
  divisionId: int("division_id")
    .notNull()
    .references(() => Division.id),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ClubStudentT = mysqlTable("club_student_t", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("student_id")
    .notNull()
    .references(() => Student.id),
  clubId: int("club_id")
    .notNull()
    .references(() => Club.id),
  semesterId: int("semester_id")
    .notNull()
    .references(() => SemesterD.id),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ClubBuildingEnum = mysqlTable("club_building_enum", {
  id: int("id").autoincrement().primaryKey(),
  buildingName: varchar("building_name", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ClubRoomT = mysqlTable("club_room_t", {
  id: int("id").autoincrement().primaryKey(),
  clubId: int("club_id")
    .notNull()
    .references(() => Club.id),
  clubBuildingEnum: int("club_building_enum")
    .notNull()
    .references(() => ClubBuildingEnum.id),
  roomLocation: varchar("room_location", { length: 20 }),
  roomPassword: varchar("room_password", { length: 20 }),
  semesterId: int("semester_id")
    .notNull()
    .references(() => SemesterD.id),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ClubDelegateEnum = mysqlTable("club_delegate_enum", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("enum_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ClubDelegateD = mysqlTable(
  "club_delegate_d",
  {
    id: int("id").autoincrement().primaryKey(),
    clubId: int("club_id")
      .notNull()
      .references(() => Club.id),
    studentId: int("student_id")
      .notNull()
      .references(() => Student.id),
    ClubDelegateEnumId: int("club_delegate_enum_id").notNull(),
    startTerm: datetime("start_term").notNull(),
    endTerm: datetime("end_term"),
    createdAt: timestamp("created_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    ClubDelegateEnumIdFk: index("club_delegate_d_club_delegate_enum_id_fk").on(
      table.ClubDelegateEnumId,
    ),
  }),
);

export const ClubDelegateChangeRequestStatusEnum = mysqlTable(
  "club_delegate_change_request_status_enum",
  {
    id: int("enum_id").autoincrement().primaryKey().notNull(),
    enumName: varchar("enum_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
);

export const ClubDelegateChangeRequest = mysqlTable(
  "club_delegate_change_request",
  {
    id: int("id").autoincrement().primaryKey().notNull(),
    clubId: int("club_id").notNull(),
    prevStudentId: int("prev_student_id").notNull(),
    studentId: int("student_id").notNull(),
    clubDelegateChangeRequestStatusEnumId: int(
      "club_delegate_change_request_status_enum_id",
    ).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    clubForeignKey: foreignKey({
      columns: [table.clubId],
      foreignColumns: [Club.id],
    }),
    prevStudentForeignKey: foreignKey({
      columns: [table.prevStudentId],
      foreignColumns: [Student.id],
    }),
    studentForeignKey: foreignKey({
      columns: [table.studentId],
      foreignColumns: [Student.id],
    }),
    statusEnumForeignKey: foreignKey({
      name: "club_delegate_change_request_fk",
      columns: [table.clubDelegateChangeRequestStatusEnumId],
      foreignColumns: [ClubDelegateChangeRequestStatusEnum.id],
    }),
  }),
);
