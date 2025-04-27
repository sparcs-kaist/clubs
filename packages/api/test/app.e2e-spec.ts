import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";

import { AppModule } from "@sparcs-clubs/api/app.module";
import { getConnection } from "@sparcs-clubs/api/drizzle/drizzle.provider";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 60000);

  it("/notices (GET)", () =>
    request(app.getHttpServer())
      .get("/notices?pageOffset=1&itemCount=6")
      .expect(200));

  afterAll(async () => {
    // Close database connection
    const connection = await getConnection();
    await connection.end();

    // Close the application
    await app.close();
  });
});
