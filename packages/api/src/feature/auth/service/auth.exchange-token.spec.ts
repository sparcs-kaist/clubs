import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

import { SystemRandomGenerator } from "@sparcs-clubs/api/common/random/system-random-generator";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import { AuthRepository } from "../repository/auth.repository";
import { JwtAccessStrategy } from "../strategy/jwt-access.strategy";
import { JwtRefreshStrategy } from "../strategy/jwt-refresh.strategy";
import { AuthService } from "./auth.service";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("exchanged login token provenance", () => {
  const config = {
    accessTokenSecretKey: "test-access-secret",
    refreshTokenSecretKey: "test-refresh-secret",
    accessTokenExpiresIn: "15m",
    refreshTokenExpiresIn: "7d",
  } as AppConfigService;
  const actor = { id: 1, email: "executive@example.com" };
  const user = {
    id: 2,
    sid: "target-sid",
    name: "대상 사용자",
    email: "target@example.com",
    undergraduate: { id: 3, number: 20260001 },
    master: { id: 4, number: 20262001 },
    doctor: { id: 5, number: 20265001 },
    masterDoctor: { id: 9, number: 20268083 },
    executive: { id: 6, studentId: 3 },
    professor: { id: 7 },
    employee: { id: 8 },
  };
  const jwt = new JwtService();
  const repository = {
    hasActiveRefreshToken: jest.fn(),
  };
  const users = { findLoginIdentity: jest.fn(), isActiveUser: jest.fn() };
  const auth = new AuthService(
    repository as unknown as AuthRepository,
    jwt,
    {} as never,
    config,
    {} as never,
    new SystemRandomGenerator(),
    users as never,
    {} as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    users.findLoginIdentity.mockResolvedValue(user);
    users.isActiveUser.mockResolvedValue(true);
    repository.hasActiveRefreshToken.mockResolvedValue(true);
  });

  it.each([
    ["undergraduate", { studentId: 3, studentNumber: 20260001 }],
    ["master", { studentId: 4, studentNumber: 20262001 }],
    ["doctor", { studentId: 5, studentNumber: 20265001 }],
    ["masterDoctor", { studentId: 9, studentNumber: 20268083 }],
    ["executive", { executiveId: 6, studentId: 3 }],
    ["professor", { professorId: 7 }],
    ["employee", { employeeId: 8 }],
  ] as const)(
    "keeps the target role and original actor in %s access",
    (role, fields) => {
      const token = auth.getAccessToken(user, actor)[role];
      const payload = jwt.verify(token, {
        secret: config.accessTokenSecretKey,
      });

      expect(payload).toMatchObject({
        id: user.id,
        type: role,
        exchangeActor: actor,
        ...fields,
      });
      expect(new JwtAccessStrategy(config).validate(payload)).toMatchObject({
        id: user.id,
        exchangeActor: actor,
        ...fields,
      });
    },
  );

  it("keeps the original actor when refreshing the target's access", async () => {
    const token = auth.getRefreshToken(user, actor);
    const payload = jwt.verify(token, {
      secret: config.refreshTokenSecretKey,
    });
    const strategy = new JwtRefreshStrategy(auth, config);
    const principal = await strategy.validate(
      { cookies: { refreshToken: token } } as unknown as Request,
      payload,
    );
    const result = await auth.postAuthRefresh(principal);

    expect(repository.hasActiveRefreshToken).toHaveBeenCalledWith(
      user.id,
      token,
    );
    expect(users.findLoginIdentity).toHaveBeenCalledWith(user.id);
    expect(principal).toMatchObject({ id: user.id, exchangeActor: actor });
    Object.values(result.accessToken).forEach(accessToken => {
      expect(
        jwt.verify(accessToken, { secret: config.accessTokenSecretKey }),
      ).toMatchObject({ id: user.id, exchangeActor: actor });
    });
  });

  it("does not add an actor to ordinary login or refreshed access", async () => {
    const tokens = auth.getAccessToken(user);
    const refreshed = await auth.postAuthRefresh(user);
    [...Object.values(tokens), ...Object.values(refreshed.accessToken)].forEach(
      token => {
        expect(
          jwt.verify(token, { secret: config.accessTokenSecretKey }),
        ).not.toHaveProperty("exchangeActor");
      },
    );
    expect(
      jwt.verify(auth.getRefreshToken(user), {
        secret: config.refreshTokenSecretKey,
      }),
    ).not.toHaveProperty("exchangeActor");
  });

  it("gives separate exchanges within the same second distinct refresh tokens", () => {
    jest.spyOn(Date, "now").mockReturnValue(1789290000000);
    try {
      const first = jwt.decode(auth.getRefreshToken(user, actor));
      const second = jwt.decode(auth.getRefreshToken(user, actor));

      expect(first.iat).toBe(second.iat);
      expect(typeof first.jti).toBe("string");
      expect(first.jti).not.toBe(second.jti);
    } finally {
      jest.restoreAllMocks();
    }
  });

  it("rejects a deleted account even when a refresh token remains", async () => {
    users.isActiveUser.mockResolvedValue(false);
    const strategy = new JwtRefreshStrategy(auth, config);
    await expect(
      strategy.validate(
        { cookies: { refreshToken: "active-token" } } as unknown as Request,
        user,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.hasActiveRefreshToken).not.toHaveBeenCalled();
  });

  it("still rejects revoked exchanged refresh tokens", async () => {
    repository.hasActiveRefreshToken.mockResolvedValue(false);
    const strategy = new JwtRefreshStrategy(auth, config);

    await expect(
      strategy.validate(
        {
          cookies: { refreshToken: "revoked-test-token" },
        } as unknown as Request,
        { ...user, exchangeActor: actor },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
