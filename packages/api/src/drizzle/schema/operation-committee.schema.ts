import { int, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";

// OperationCommittee table
export const OperationCommittee = mysqlTable("operation_committee", {
  id: int("id").autoincrement().primaryKey(),
  secretKey: text("secret_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});
