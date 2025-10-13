// dizzle.provider.ts

import { ExtractTablesWithRelations } from "drizzle-orm";
import { MySqlTransaction } from "drizzle-orm/mysql-core";
import {
  drizzle,
  MySql2PreparedQueryHKT,
  MySql2QueryResultHKT,
} from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import logger from "../common/util/logger";
import { env } from "../env";
import * as activitySchema from "./schema/activity.schema";
import * as commonSpaceSchema from "./schema/common-space.schema";
import * as divisionSchema from "./schema/division.schema";
import * as meetingSchema from "./schema/meeting.schema";
import * as noticeSchema from "./schema/notice.schema";
import * as promotionalPrintingSchema from "./schema/promotional-printing.schema";
import * as refreshTokenSchema from "./schema/refresh-token.schema";
import * as registrationSchema from "./schema/registration.schema";
import * as rentalSchema from "./schema/rental.schema";
import * as userSchema from "./schema/user.schema";

export const DrizzleAsyncProvider = "drizzleProvider";

let dbInstance = null;
let connectionInstance = null;

const createConnection = async () => {
  const connection = await mysql.createConnection({
    uri: env.DATABASE_URL,
  });

  connection.on("error", async err => {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      logger.error("Database connection was closed. Reconnecting...");
      connectionInstance = await createConnection();
    } else {
      throw err;
    }
  });

  return connection;
};

export const getConnection = async () => {
  if (!connectionInstance) {
    connectionInstance = await createConnection();
  } else {
    try {
      await connectionInstance.ping();
    } catch (error) {
      logger.error("Connection ping failed, reconnecting...", error);
      connectionInstance = await createConnection();
    }
  }
  return connectionInstance;
};

export const getDbInstance = async () => {
  if (!dbInstance) {
    const connection = await getConnection();
    dbInstance = drizzle(connection, {
      schema: {
        activitySchema,
        commonSpaceSchema,
        divisionSchema,
        noticeSchema,
        promotionalPrintingSchema,
        refreshTokenSchema,
        rentalSchema,
        userSchema,
        registrationSchema,
        meetingSchema,
      },
      mode: "default",
      logger: env.NODE_ENV !== "test",
    });
  }
  return dbInstance;
};

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    useFactory: getDbInstance,
    exports: [DrizzleAsyncProvider],
  },
];

// transaction의 type
export type DrizzleTransaction = MySqlTransaction<
  MySql2QueryResultHKT,
  MySql2PreparedQueryHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;
