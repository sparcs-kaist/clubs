import { ForbiddenException, NotFoundException } from "@nestjs/common";

import { ExchangeLoginService } from "./exchange-login.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type Dependencies = ConstructorParameters<typeof ExchangeLoginService>;
const actor = { id: 1, email: "executive@kaist.ac.kr" };
const target = {
  id: 2,
  sid: "professor-sid",
  email: "prof@kaist.ac.kr",
  name: "교수",
};

const setup = () => {
  const users = {
    findLoginIdentity: jest.fn().mockResolvedValue(target),
    checkCurrentExecutiveById: jest.fn().mockResolvedValue(undefined),
    searchExchangeLoginUsers: jest.fn().mockResolvedValue([]),
    getExchangeLoginUserById: jest.fn(async (id: number) =>
      id === 2 ? target : { ...actor, sid: "actor-sid", name: "집행부" },
    ),
  };
  const exchange = {
    createExchangeLog: jest.fn().mockResolvedValue(undefined),
    storeRefreshToken: jest.fn().mockResolvedValue(undefined),
  };
  const auth = {
    getAccessToken: jest.fn().mockReturnValue({ professor: "target-access" }),
    getRefreshToken: jest.fn().mockReturnValue("target-refresh"),
  };
  const service = new ExchangeLoginService(
    users as unknown as Dependencies[0],
    exchange as unknown as Dependencies[1],
    auth as unknown as Dependencies[2],
    { refreshTokenExpiresInMs: 60000 } as Dependencies[3],
    { now: () => new Date("2026-09-13T00:00:00Z") } as Dependencies[4],
  );
  return { service, users, exchange, auth };
};

describe("ExchangeLoginService", () => {
  it("checks current executive membership before searching", async () => {
    const { service, users } = setup();
    const query = { type: "professorId" as const, value: "10" };
    await expect(service.searchUsers(actor, query)).resolves.toEqual({
      users: [],
    });
    expect(users.checkCurrentExecutiveById).toHaveBeenCalledWith(1);
    expect(users.searchExchangeLoginUsers).toHaveBeenCalledWith(query);
  });

  it("issues the target session and records who selected that user", async () => {
    const { service, auth, exchange } = setup();
    await expect(service.exchangeLogin(actor, 2)).resolves.toEqual({
      accessToken: { professor: "target-access" },
      refreshToken: "target-refresh",
      refreshTokenExpiresAt: new Date("2026-09-13T00:01:00Z"),
    });
    expect(auth.getAccessToken).toHaveBeenCalledWith(target, actor);
    expect(auth.getRefreshToken).toHaveBeenCalledWith(target, actor);
    expect(exchange.createExchangeLog).toHaveBeenCalledWith({
      actorUserId: 1,
      actorEmail: actor.email,
      targetUserId: 2,
      targetEmail: target.email,
      originalActorUserId: 1,
      originalActorEmail: actor.email,
    });
    expect(exchange.storeRefreshToken).toHaveBeenCalledWith({
      userId: 2,
      refreshToken: "target-refresh",
      expiresAt: new Date("2026-09-13T00:01:00Z"),
    });
  });

  it("preserves the original executive through another exchange", async () => {
    const { service, users, auth, exchange } = setup();
    const original = { id: 3, email: "original@kaist.ac.kr" };
    await service.exchangeLogin({ ...actor, exchangeActor: original }, 2);
    expect(users.checkCurrentExecutiveById).toHaveBeenCalledWith(3);
    expect(auth.getRefreshToken).toHaveBeenCalledWith(target, original);
    expect(exchange.createExchangeLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 1,
        originalActorUserId: 3,
        originalActorEmail: original.email,
      }),
    );
  });

  it("rejects an expired executive before resolving or issuing accounts", async () => {
    const { service, users, auth } = setup();
    users.checkCurrentExecutiveById.mockRejectedValue(new ForbiddenException());
    await expect(service.exchangeLogin(actor, 2)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      service.searchUsers(actor, { type: "email", value: target.email }),
    ).rejects.toThrow(ForbiddenException);
    expect(users.getExchangeLoginUserById).not.toHaveBeenCalled();
    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(users.searchExchangeLoginUsers).not.toHaveBeenCalled();
  });

  it.each([null, { ...target, sid: null }])(
    "rejects missing or disconnected target %p",
    async invalidTarget => {
      const { service, users, exchange } = setup();
      users.getExchangeLoginUserById.mockResolvedValueOnce(
        invalidTarget as typeof target,
      );
      await expect(service.exchangeLogin(actor, 2)).rejects.toThrow(
        NotFoundException,
      );
      expect(exchange.createExchangeLog).not.toHaveBeenCalled();
      expect(exchange.storeRefreshToken).not.toHaveBeenCalled();
    },
  );

  it("rejects targets without login profiles", async () => {
    const { service, auth, exchange } = setup();
    auth.getAccessToken.mockImplementation(() => {
      throw new NotFoundException("로그인할 수 있는 프로필이 없는 계정입니다.");
    });
    await expect(service.exchangeLogin(actor, 2)).rejects.toThrow(
      NotFoundException,
    );
    expect(auth.getRefreshToken).not.toHaveBeenCalled();
    expect(exchange.storeRefreshToken).not.toHaveBeenCalled();
  });

  it("does not persist a target session when audit recording fails", async () => {
    const { service, exchange } = setup();
    exchange.createExchangeLog.mockRejectedValue(
      new Error("audit unavailable"),
    );
    await expect(service.exchangeLogin(actor, 2)).rejects.toThrow(
      "audit unavailable",
    );
    expect(exchange.storeRefreshToken).not.toHaveBeenCalled();
  });
});
