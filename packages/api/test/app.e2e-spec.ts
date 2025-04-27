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

  it("/ (GET)", () =>
    request(app.getHttpServer()).get("/").expect(200).expect("Hello World!"));

  afterAll(async () => {
    // Close database connection
    const connection = await getConnection();
    await connection.end();

    // Close the application
    await app.close();
  });
});
