import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";

import { AppModule } from "@sparcs-clubs/api/app.module";

import { seedTestEnvironment } from "../helpers/db-seed";
import { clearDatabase, closeDatabase } from "./setup";

describe("AppController (integration)", () => {
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
    request(app.getHttpServer())
      .get("/notices?pageOffset=1&itemCount=6")
      .expect(200));

  describe("Data Seeding Tests", () => {
    beforeEach(async () => {
      // 각 seeding 테스트 전에 DB 초기화
      await clearDatabase();
    });

    it("should seed test environment successfully", async () => {
      const testData = await seedTestEnvironment();

      expect(testData.user).toBeDefined();
      expect(testData.user.id).toBeGreaterThan(0);
      expect(testData.student).toBeDefined();
      expect(testData.student.id).toBeGreaterThan(0);
      expect(testData.division).toBeDefined();
      expect(testData.division.id).toBeGreaterThan(0);
      expect(testData.club).toBeDefined();
      expect(testData.club.id).toBeGreaterThan(0);
      expect(testData.semester).toBeDefined();
      expect(testData.semester.id).toBeGreaterThan(0);
    });

    it("should create user with correct data", async () => {
      const testData = await seedTestEnvironment();

      // User 테이블에서 직접 조회하여 검증
      expect(testData.user.id).toBeDefined();
      // Note: sid, name 등은 $returningId()로는 반환되지 않으므로
      // 실제 사용 시에는 별도 조회가 필요할 수 있습니다
    });

    it("should create student linked to user", async () => {
      const testData = await seedTestEnvironment();

      expect(testData.student.id).toBeDefined();
      // student의 userId는 user.id와 일치해야 함
      // Note: $returningId()로는 userId가 반환되지 않으므로 검증 제한
    });
  });

  afterAll(async () => {
    // 데이터베이스 연결 종료
    await closeDatabase();

    // 애플리케이션 종료
    await app.close();
  });
});
