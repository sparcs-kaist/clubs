import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { desc, eq, isNull, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { OperationCommittee } from "@sparcs-clubs/api/drizzle/schema/operation-committee.schema";

@Injectable()
export class OperationCommitteeRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    await this.db
      .update(OperationCommittee)
      .set({ deletedAt: sql`NOW()` })
      .where(isNull(OperationCommittee.deletedAt));

    await this.db.insert(OperationCommittee).values({ secretKey });

    const [inserted] = await this.db
      .select()
      .from(OperationCommittee)
      .where(eq(OperationCommittee.secretKey, secretKey))
      .orderBy(desc(OperationCommittee.id))
      .limit(1);

    if (!inserted) {
      throw new HttpException(
        "OperationCommittee creation failed.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return inserted;
  }

  async findOperationCommitteeSecretKey() {
    const activeKeys = await this.db
      .select()
      .from(OperationCommittee)
      .where(isNull(OperationCommittee.deletedAt));

    if (!activeKeys || activeKeys.length === 0) {
      throw new HttpException(
        "No active secret key found.",
        HttpStatus.NOT_FOUND,
      );
    }

    return activeKeys;
  }

  async deleteOperationCommitteeSecretKey() {
    const [recent] = await this.db
      .select()
      .from(OperationCommittee)
      .where(isNull(OperationCommittee.deletedAt))
      .orderBy(desc(OperationCommittee.createdAt))
      .limit(1);

    if (!recent) {
      throw new HttpException(
        "Current secretKey is missing.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.db
      .update(OperationCommittee)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(OperationCommittee.id, recent.id));
  }
}
