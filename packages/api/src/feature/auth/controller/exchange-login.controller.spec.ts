import { ForbiddenException, INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import { JwtAccessGuard } from "../guard/jwt-access.guard";
import { ExchangeLoginService } from "../service/exchange-login.service";
import { JwtAccessStrategy } from "../strategy/jwt-access.strategy";
import { ExchangeLoginController } from "./exchange-login.controller";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("executive exchange login HTTP authorization", () => {
  let app: INestApplication;
  const config = { accessTokenSecretKey: "test-access-secret", isLocal: false };
  const service = { searchUsers: jest.fn(), exchangeLogin: jest.fn() };
  const principal = { id: 1, email: "executive@example.com" };
  const url = "/executive/auth/exchange-login";
  const jwt = new JwtService();
  const accessToken = (type: string) =>
    jwt.sign(
      { ...principal, type },
      {
        secret: config.accessTokenSecretKey,
        expiresIn: "15m",
      },
    );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ExchangeLoginController],
      providers: [
        JwtAccessStrategy,
        { provide: AppConfigService, useValue: config },
        { provide: ExchangeLoginService, useValue: service },
        { provide: APP_GUARD, useClass: JwtAccessGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service.searchUsers.mockResolvedValue({ users: [] });
    service.exchangeLogin.mockResolvedValue({
      accessToken: { professor: "target-test-access" },
      refreshToken: "target-test-refresh",
      refreshTokenExpiresAt: new Date("2099-01-01T00:00:00Z"),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated search and exchange before calling the service", async () => {
    await request(app.getHttpServer())
      .get(`${url}/users`)
      .query({ type: "email", value: "target@example.com" })
      .expect(401);
    await request(app.getHttpServer())
      .post(url)
      .send({ userId: 2 })
      .expect(401);
    expect(service.searchUsers).not.toHaveBeenCalled();
    expect(service.exchangeLogin).not.toHaveBeenCalled();
  });

  it.each(["undergraduate", "master", "doctor", "professor", "employee"])(
    "rejects %s access to both endpoints",
    async type => {
      const authorization = `Bearer ${accessToken(type)}`;
      await request(app.getHttpServer())
        .get(`${url}/users`)
        .set("Authorization", authorization)
        .query({ type: "studentId", value: "3" })
        .expect(401);
      await request(app.getHttpServer())
        .post(url)
        .set("Authorization", authorization)
        .send({ userId: 2 })
        .expect(401);
      expect(service.searchUsers).not.toHaveBeenCalled();
      expect(service.exchangeLogin).not.toHaveBeenCalled();
    },
  );

  it("passes the authenticated executive and parsed query to search", async () => {
    await request(app.getHttpServer())
      .get(`${url}/users`)
      .set("Authorization", `Bearer ${accessToken("executive")}`)
      .query({ type: "studentId", value: " 3 " })
      .expect(200, { users: [] });
    expect(service.searchUsers).toHaveBeenCalledWith(
      expect.objectContaining(principal),
      { type: "studentId", value: "3" },
    );
  });

  it("replaces both HttpOnly refresh cookies and returns only access tokens", async () => {
    const response = await request(app.getHttpServer())
      .post(url)
      .set("Authorization", `Bearer ${accessToken("executive")}`)
      .send({ userId: 2 })
      .expect(201, { accessToken: { professor: "target-test-access" } });

    expect(service.exchangeLogin).toHaveBeenCalledWith(
      expect.objectContaining(principal),
      2,
    );
    expect(response.headers["cache-control"]).toBe("no-store");
    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies).toHaveLength(2);
    ["/auth/refresh", "/auth/sign-out"].forEach(path => {
      expect(cookies.some(cookie => cookie.includes(`Path=${path};`))).toBe(
        true,
      );
    });
    cookies.forEach(cookie => {
      expect(cookie).toContain("refreshToken=target-test-refresh;");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Expires=Thu, 01 Jan 2099 00:00:00 GMT");
    });
    expect(response.body).not.toHaveProperty("refreshToken");
  });

  it("leaves cookies unchanged when the service rejects the exchange", async () => {
    service.exchangeLogin.mockRejectedValue(new ForbiddenException());
    const response = await request(app.getHttpServer())
      .post(url)
      .set("Authorization", `Bearer ${accessToken("executive")}`)
      .send({ userId: 2 })
      .expect(403);

    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(response.body).not.toHaveProperty("accessToken");
  });
});
