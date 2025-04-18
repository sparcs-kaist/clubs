import { Injectable } from "@nestjs/common";
import { MySql2Database } from "drizzle-orm/mysql2";

import { runSequentially } from "../common/util/util";
import { DrizzleTransaction } from "./drizzle.provider";

export const REPOSITORY_LOCK_ORDER_META_KEY = Symbol(
  "REPOSITORY_LOCK_ORDER_KEY",
);

// 레포지토리에서 래핑해서 사용할, 레포지토리 락 우선순위 값 뽑아 주는 함수
export function getLockableKey(
  constructor: new (...args: unknown[]) => unknown,
): string {
  if (!Reflect.getMetadata(REPOSITORY_LOCK_ORDER_META_KEY, constructor)) {
    throw new Error(
      `REPOSITORY_LOCK_ORDER_META_KEY가 없습니다. ${constructor.name}`,
    );
  }
  return (
    Reflect.getMetadata(REPOSITORY_LOCK_ORDER_META_KEY, constructor) ?? "zzz"
  ); // 기본값 zzz로 설정 (맨 마지막)
}

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
