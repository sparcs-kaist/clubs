import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";

import { AppModule } from "@sparcs-clubs/api/app.module";

import { clearDatabase, closeDatabase } from "./setup";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 애플리케이션 초기화 후 DB 초기화
    await clearDatabase();
  }, 60000);

  it("/notices (GET)", () =>
    // 필요한 경우 테스트 데이터 시딩
    // const testData = await seedTestEnvironment();
    request(app.getHttpServer())
      .get("/notices?pageOffset=1&itemCount=6")
      .expect(200));

  afterAll(async () => {
    // 데이터베이스 연결 종료
    await closeDatabase();

    // 애플리케이션 종료
    await app.close();
  });
});
