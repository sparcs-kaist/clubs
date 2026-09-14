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
});
