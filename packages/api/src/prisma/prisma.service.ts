import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

import { env } from "@sparcs-clubs/api/env";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * @description Date 객체의 시간을 offset만큼 이동시키는 재귀 헬퍼
 * @description 객체, 배열, 중첩 구조 모두 처리
 */
function shiftDateFields(obj: unknown, offsetMs: number): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) {
    return new Date(obj.getTime() + offsetMs);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => shiftDateFields(item, offsetMs));
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        key,
        shiftDateFields(value, offsetMs),
      ]),
    );
  }
  return obj;
}

// Actions that write data to the DB (need UTC → KST shift on args)
const WRITE_ACTIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "upsert",
]);

// Actions that read data from the DB (need KST → UTC shift on result)
const READ_ACTIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "create",
  "createManyAndReturn",
  "update",
  "upsert",
  "delete",
  "deleteMany",
  "aggregate",
  "groupBy",
]);

// Actions that have a 'where' clause (need UTC → KST shift on where)
const WHERE_ACTIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

/**
 * @description Prisma model delegate인지 확인하는 헬퍼
 * model delegate는 findMany, create, update, delete 등의 메서드를 가진 객체
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPrismaModelDelegate(value: any): boolean {
  return (
    value &&
    typeof value === "object" &&
    typeof value.findMany === "function" &&
    typeof value.create === "function"
  );
}

/**
 * @description 주어진 Prisma model delegate의 각 action을 timezone 보정으로 감싸는 Proxy
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTimezoneProxy(delegate: any): any {
  return new Proxy(delegate, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== "function" || typeof prop !== "string") {
        return original;
      }

      const action = prop;

      // Only wrap known Prisma actions
      if (
        !WRITE_ACTIONS.has(action) &&
        !READ_ACTIONS.has(action) &&
        !WHERE_ACTIONS.has(action)
      ) {
        // Bind to target to preserve 'this' context
        return typeof original === "function"
          ? original.bind(target)
          : original;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...fnArgs: any[]) => {
        const args = fnArgs[0] || {};

        // Shift write data: UTC → KST (+9h)
        if (WRITE_ACTIONS.has(action)) {
          if (args.data) {
            args.data = shiftDateFields(args.data, KST_OFFSET_MS);
          }
          if (args.create) {
            args.create = shiftDateFields(args.create, KST_OFFSET_MS);
          }
          if (args.update) {
            args.update = shiftDateFields(args.update, KST_OFFSET_MS);
          }
        }

        // Shift where clause: UTC → KST (+9h)
        if (WHERE_ACTIONS.has(action) && args.where) {
          args.where = shiftDateFields(args.where, KST_OFFSET_MS);
        }

        const result = await original.call(target, args);

        // Shift read results: KST → UTC (-9h)
        if (READ_ACTIONS.has(action) && result) {
          return shiftDateFields(result, -KST_OFFSET_MS);
        }

        return result;
      };
    },
  });
}

/**
 * @description Prisma client (또는 transaction client)를 timezone Proxy로 감싸는 헬퍼
 * model delegate 접근 시 자동으로 timezone 보정이 적용됩니다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapWithTimezoneProxy(client: any): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegateCache = new Map<string, any>();

  return new Proxy(client, {
    get(target, prop) {
      // $로 시작하는 메서드 ($queryRaw, $executeRaw, $transaction 등)는 그대로 전달
      if (typeof prop === "symbol") {
        return target[prop];
      }

      // Model delegate 접근을 감지하고 timezone proxy로 감싸기
      if (
        typeof prop === "string" &&
        prop.length > 0 &&
        !prop.startsWith("$") &&
        !prop.startsWith("_") &&
        prop[0] === prop[0].toLowerCase()
      ) {
        // 캐시에서 먼저 확인
        if (delegateCache.has(prop)) {
          return delegateCache.get(prop);
        }

        const value = target[prop];
        if (isPrismaModelDelegate(value)) {
          const proxied = createTimezoneProxy(value);
          delegateCache.set(prop, proxied);
          return proxied;
        }
      }

      // 나머지는 원본 그대로 전달 (bind 필요한 함수 포함)
      const value = target[prop];
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    },
  });
}

/**
 * @description PrismaService - Prisma Client를 NestJS에 통합
 * @description 시간대 보정을 Proxy를 통해 모든 DateTime 필드에 대해
 *              자동으로 UTC <-> KST(+9h) 변환을 수행합니다.
 *
 * 원리:
 * - DB에는 KST 기준으로 datetime이 저장되어 있음
 * - 서버(TZ=UTC)에서 읽을 때: DB값(KST) → -9시간 → UTC Date 객체로 반환
 * - 서버에서 쓸 때: UTC Date 객체 → +9시간 → KST로 DB에 저장
 *
 * Prisma 6.x에서는 $use 미들웨어가 제거되었으므로,
 * JavaScript Proxy를 사용하여 모든 model delegate 접근을 감싸고
 * 자동으로 timezone 보정을 적용합니다.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        env.NODE_ENV === "development"
          ? [
              { emit: "event", level: "query" },
              { emit: "stdout", level: "warn" },
              { emit: "stdout", level: "error" },
            ]
          : [
              { emit: "stdout", level: "warn" },
              { emit: "stdout", level: "error" },
            ],
    });

    // PrismaService 자체를 timezone proxy로 감싸서 반환
    // this[modelName]으로 접근할 때 자동으로 timezone 보정이 적용됨
    // eslint-disable-next-line no-constructor-return
    return wrapWithTimezoneProxy(this);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Prisma Client connected to database");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Prisma Client disconnected from database");
  }

  /**
   * @description $transaction을 override하여 interactive transaction에서도
   *              timezone 보정이 적용되도록 합니다.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async $transaction<T>(arg: any, options?: any): Promise<T> {
    if (typeof arg === "function") {
      // Interactive transaction: callback receives a transaction client
      // Wrap the tx client with timezone proxy
      return super.$transaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tx: any) => arg(wrapWithTimezoneProxy(tx)),
        options,
      ) as T;
    }
    // Sequential transactions (array of promises) - pass through
    return super.$transaction(arg, options) as T;
  }
}
