import { Injectable } from "@nestjs/common";
import { MySql2Database } from "drizzle-orm/mysql2";

import { PlainObject } from "../common/base/base.repository";
import { runSequentially } from "../common/util/util";
import { DrizzleTransaction } from "./drizzle.provider";

export const REPOSITORY_LOCK_ORDER_META_KEY = Symbol(
  "REPOSITORY_LOCK_ORDER_KEY",
);

export function getLockableKey(
  constructor: new (...args: unknown[]) => unknown,
): string {
  return (
    Reflect.getMetadata(REPOSITORY_LOCK_ORDER_META_KEY, constructor) ?? "zzz"
  ); // 기본값으로 밀림
}

export type DatabaseLockConfig = {
  service: {
    lock: (tx: DrizzleTransaction, query: PlainObject) => Promise<void>;
  };
  query: PlainObject;
};

export interface Lockable<Query = unknown> {
  getLockKey(): string;
  acquireLock(tx: DrizzleTransaction, query: Query): Promise<void>;
}

export type LockRequest<Query = unknown> = {
  lockTarget: Lockable<Query>;
  query: Query;
};

@Injectable()
export class TransactionManagerService {
  constructor(private readonly db: MySql2Database) {}

  async runInTransaction<Result>(
    callback: (tx: DrizzleTransaction) => Promise<Result>,
    lockOptions?: LockRequest[],
  ): Promise<Result> {
    return this.db.transaction(async tx => {
      if (lockOptions?.length) {
        const sorted = [...lockOptions].sort((a, b) =>
          a.lockTarget.getLockKey().localeCompare(b.lockTarget.getLockKey()),
        );

        await runSequentially(sorted, async ({ lockTarget, query }) => {
          await lockTarget.acquireLock(tx, query);
        });
      }

      return callback(tx);
    });
  }
}
