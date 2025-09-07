import {
  date,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const SemesterD = mysqlTable("semester_d", {
  id: int("id").autoincrement().primaryKey(),
  year: int("year").notNull(),
  name: varchar("name", { length: 10 }).notNull(),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ActivityD = mysqlTable("activity_d", {
  id: int("id").autoincrement().primaryKey().notNull(),
  semesterId: int("semester_id").notNull(),
  year: int("year").notNull(),
  name: varchar("name", { length: 10 }).notNull(),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term").notNull(),
  activityDurationTypeEnum: int("activity_duration_type_enum").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const ActivityDeadlineD = mysqlTable("activity_deadline_d", {
  id: int("id").autoincrement().primaryKey().notNull(),
  semesterId: int("semester_id").notNull(),
  deadlineEnum: int("deadline_enum_id").notNull(),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const FundingDeadlineD = mysqlTable("funding_deadline_d", {
  id: int("id").autoincrement().primaryKey().notNull(),
  semesterId: int("semester_id").notNull(),
  deadlineEnum: int("deadline_enum").notNull(),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const RegistrationDeadlineD = mysqlTable("registration_deadline_d", {
  id: int("id").autoincrement().primaryKey(),
  semesterId: int("semester_d_id").references(() => SemesterD.id),
  deadlineEnum: int("registration_deadline_enum_id").notNull(),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// export const ActivityDeadlineEnum = mysqlTable("activity_deadline_enum", {
//   id: int("id").autoincrement().primaryKey().notNull(),
//   statusName: varchar("status_name", { length: 255 }).notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   deletedAt: timestamp("deleted_at"),
// });

// export const RegistrationDeadlineEnum = mysqlTable(
//   "registration_deadline_enum",
//   {
//     enumId: int("enum_id").autoincrement().primaryKey(),
//     enumName: varchar("enum_name", { length: 255 }),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     deletedAt: timestamp("deleted_at"),
//   },
// );
