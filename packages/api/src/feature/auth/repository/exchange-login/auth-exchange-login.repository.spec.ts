import { AuthExchangeLoginRepository } from "./auth-exchange-login.repository";

describe("AuthExchangeLoginRepository", () => {
  const token = {
    userId: 20,
    refreshToken: "test-token",
    expiresAt: new Date("2026-10-01T00:00:00Z"),
  };
  const log = {
    actorUserId: 10,
    actorEmail: "actor@test.kr",
    targetUserId: 20,
    targetEmail: "target@test.kr",
    originalActorUserId: 5,
    originalActorEmail: "original@test.kr",
  };

  const setup = () => {
    const transaction = {
      authActivatedRefreshTokens: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      authExchangeLoginLog: { create: jest.fn().mockResolvedValue({ id: 2 }) },
    };
    const repository = new AuthExchangeLoginRepository({
      tx: transaction,
    } as never);
    return { repository, transaction };
  };

  it("writes tokens and original/immediate actor snapshots through the active transaction", async () => {
    const { repository, transaction } = setup();
    await repository.storeRefreshToken(token);
    await repository.createExchangeLog(log);
    expect(transaction.authActivatedRefreshTokens.create).toHaveBeenCalledWith({
      data: token,
    });
    expect(transaction.authExchangeLoginLog.create).toHaveBeenCalledWith({
      data: log,
    });
    expect(
      transaction.authExchangeLoginLog.create.mock.calls[0][0].data,
    ).not.toHaveProperty("refreshToken");
  });

  it("propagates log failure so the service transaction can roll back token issuance", async () => {
    const { repository, transaction } = setup();
    const failure = new Error("audit write failed");
    transaction.authExchangeLoginLog.create.mockRejectedValue(failure);
    await expect(repository.createExchangeLog(log)).rejects.toBe(failure);
  });
  it("deletes exactly one unexpired token with the caller's lookup time", async () => {
    const { repository, transaction } = setup();
    const queriedAt = new Date("2026-09-15T10:00:00.000Z");
    await expect(
      repository.deleteRefreshToken(
        token.userId,
        token.refreshToken,
        queriedAt,
      ),
    ).resolves.toBeUndefined();
    expect(
      transaction.authActivatedRefreshTokens.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        userId: token.userId,
        refreshToken: token.refreshToken,
        expiresAt: { gte: queriedAt },
      },
    });
  });

  it.each([0, 2])(
    "rejects a deletion count of %s so the enclosing sign-out transaction rolls back",
    async count => {
      const { repository, transaction } = setup();
      transaction.authActivatedRefreshTokens.deleteMany.mockResolvedValue({
        count,
      });
      await expect(
        repository.deleteRefreshToken(
          token.userId,
          token.refreshToken,
          token.expiresAt,
        ),
      ).rejects.toThrow("deleteRefreshTokenRecord failed");
    },
  );

  it("preserves a token deletion error for the enclosing transaction", async () => {
    const { repository, transaction } = setup();
    const error = new Error("token deletion unavailable");
    transaction.authActivatedRefreshTokens.deleteMany.mockRejectedValue(error);
    await expect(
      repository.deleteRefreshToken(
        token.userId,
        token.refreshToken,
        token.expiresAt,
      ),
    ).rejects.toBe(error);
  });
});
