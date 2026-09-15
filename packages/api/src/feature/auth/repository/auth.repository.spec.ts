import { AuthRepository } from "./auth.repository";

describe("AuthRepository sessions", () => {
  const now = new Date("2026-09-15T08:00:00Z");
  const sessions = {
    count: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  };
  const repository = new AuthRepository(
    { tx: { authActivatedRefreshTokens: sessions } } as never,
    { now: () => now } as never,
  );
  beforeEach(() => jest.resetAllMocks());

  it.each([0, 1])(
    "checks the user, exact token and inclusive expiry (count=%i)",
    async count => {
      sessions.count.mockResolvedValue(count);
      await expect(repository.hasActiveRefreshToken(7, "token")).resolves.toBe(
        count > 0,
      );
      expect(sessions.count).toHaveBeenCalledWith({
        where: { userId: 7, refreshToken: "token", expiresAt: { gte: now } },
      });
    },
  );
  it("stores a session through the active transaction client", async () => {
    await expect(
      repository.createRefreshTokenRecord(7, "token", now),
    ).resolves.toBe(true);
    expect(sessions.create).toHaveBeenCalledWith({
      data: { userId: 7, refreshToken: "token", expiresAt: now },
    });
  });
  it.each([0, 2])(
    "rejects an unexpected number of revoked sessions (%i)",
    async count => {
      sessions.deleteMany.mockResolvedValue({ count });
      await expect(
        repository.deleteRefreshTokenRecord(7, "token"),
      ).rejects.toThrow("deleteRefreshTokenRecord failed");
    },
  );
  it("revokes exactly one unexpired session", async () => {
    sessions.deleteMany.mockResolvedValue({ count: 1 });
    await expect(repository.deleteRefreshTokenRecord(7, "token")).resolves.toBe(
      true,
    );
    expect(sessions.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, refreshToken: "token", expiresAt: { gte: now } },
    });
  });
});
