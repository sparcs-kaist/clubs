import { DataSource } from "typeorm";

import { env } from "@sparcs-clubs/api/env";

/**
 * TypeORM DataSource
 * - Migration 생성 및 실행을 위한 DataSource 설정
 * - CLI에서 사용됨
 */
export const AppDataSource = new DataSource({
  type: "mysql",
  url: env.DATABASE_URL,
  entities: ["src/feature/**/model/*.entity.ts"],
  migrations: ["src/typeorm/migration/*.ts"],
  synchronize: false,
});
