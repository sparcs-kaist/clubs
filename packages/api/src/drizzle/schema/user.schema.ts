import {
  date,
  int,
  mysqlTable,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const User = mysqlTable("user", {
  id: int("id").autoincrement().primaryKey(),
  sid: varchar("sid", { length: 30 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
});

export const Student = mysqlTable("student", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => User.id),
  number: int("number").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const StudentT = mysqlTable(
  "student_t",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("student_id")
      .notNull()
      .references(() => Student.id),
    studentEnum: int("student_enum").notNull(),
    studentStatusEnum: int("student_status_enum").notNull(),
    department: int("department"),
    semesterId: int("semester_id").notNull(),
    startTerm: date("start_term").notNull(),
    endTerm: date("end_term"),
    createdAt: timestamp("created_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    StduentTStudentIdSemesterIdUniqueKey: uniqueIndex(
      "student_t_student_id_semester_id_unique_key",
    ).on(table.studentId, table.semesterId),
  }),
);

export const Executive = mysqlTable(
  "executive",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").references(() => User.id),
    studentId: int("student_id")
      .notNull()
      .references(() => Student.id),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    studentIdUnique: unique("student_id_unique").on(table.studentId),
  }),
);

export const ExecutiveStatusEnum = mysqlTable("executive_status_enum", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ExecutiveBureauEnum = mysqlTable("executive_bureau_enum", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 31 }),
});

export const ExecutiveT = mysqlTable("executive_t", {
  id: int("id").autoincrement().primaryKey(),
  executiveId: int("executive_id")
    .notNull()
    .references(() => Executive.id),
  executiveStatusEnum: int("executive_status_enum")
    .notNull()
    .references(() => ExecutiveStatusEnum.id),
  executiveBureauEnum: int("executive_bureau_enum")
    .notNull()
    .references(() => ExecutiveBureauEnum.id),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const Professor = mysqlTable("professor", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => User.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ProfessorT = mysqlTable("professor_t", {
  id: int("id").autoincrement().primaryKey(),
  professorId: int("professor_id")
    .notNull()
    .unique()
    .references(() => Professor.id),
  professorEnum: int("professor_enum"),
  department: int("department"),
  startTerm: date("start_term").notNull(),
  endTerm: date("end_term"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const Employee = mysqlTable("employee", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => User.id),

  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const EmployeeT = mysqlTable(
  "employee_t",
  {
    id: int("id").autoincrement().primaryKey(),
    employeeId: int("employee_id")
      .notNull()
      .unique()
      .references(() => Employee.id),
    startTerm: date("start_term").notNull(),
    endTerm: date("end_term"),
    createdAt: timestamp("created_at").defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  // t=>({
  //   unq1: unique('fk_start_term_unique').on(t.employeeId, t.startTerm)
  // })
);

// Enums are directly linked to their respective tables
export const StudentStatusEnum = mysqlTable("student_status_enum", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const StudentEnum = mysqlTable("student_enum", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ProfessorEnum = mysqlTable("professor_enum", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const Department = mysqlTable("department", {
  id: int("id").autoincrement().primaryKey(),
  departmentId: int("department_id").unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const UserPrivacyPolicyAgreement = mysqlTable(
  "user_privacy_policy_agreement",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => User.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
);
