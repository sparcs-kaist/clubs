import { TypeOrmModuleOptions } from "@nestjs/typeorm";

import { env } from "@sparcs-clubs/api/env";

import { TimezoneSubscriber } from "./timezone.subscriber";

/**
 * TypeORM 설정
 * - Drizzle과 병렬 운영을 위한 TypeORM 설정
 * - Entity 자동 로드: feature의 model 폴더에서 *.entity.ts 파일들
 * - Timezone 자동 변환: TimezoneSubscriber를 통한 UTC↔KST 변환
 */
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "mysql",
  url: env.DATABASE_URL,
  entities: [`${__dirname}/../feature/**/model/*.entity{.ts,.js}`],
  subscribers: [TimezoneSubscriber],
  // 운영 환경에서는 반드시 false!
  synchronize: false,
  // 개발 환경에서만 쿼리 로깅
  logging: env.NODE_ENV === "development",
};
