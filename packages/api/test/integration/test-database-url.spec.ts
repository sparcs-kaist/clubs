import {
  assertIntegrationDatabaseEnvIsSafe,
  assertSafeTestDatabaseUrl,
} from "./test-database-url";

describe("integration test database URL safety", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("allows the local test database URL", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "mysql://root:test_password_123@127.0.0.1:3307/clubs_test",
      ),
    ).not.toThrow();
  });

  it("allows test database names without relying on host classification", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "mysql://user:password@example.com:3306/clubs_test",
      ),
    ).not.toThrow();
  });

  it("rejects non-test database names", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "mysql://root:test_password_123@127.0.0.1:3307/clubs",
      ),
    ).toThrow("test database name");
  });

  it("rejects database names that only contain test as part of another word", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "mysql://root:test_password_123@127.0.0.1:3307/contest",
      ),
    ).toThrow("test database name");
  });

  it("does not expose the database target in safety errors", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "mysql://user:password@clubs.stage.inet.sparcs.net:32715/db",
      ),
    ).toThrow("test database name");

    try {
      assertSafeTestDatabaseUrl(
        "mysql://user:password@clubs.stage.inet.sparcs.net:32715/db",
      );
    } catch (error) {
      expect((error as Error).message).not.toContain(
        "clubs.stage.inet.sparcs.net",
      );
      expect((error as Error).message).not.toContain("32715");
    }
  });

  it("requires Prisma DATABASE_URL to match TEST_DATABASE_URL", () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL =
      "mysql://root:test_password_123@127.0.0.1:3307/clubs";
    process.env.TEST_DATABASE_URL =
      "mysql://root:test_password_123@127.0.0.1:3307/clubs_test";

    expect(() => assertIntegrationDatabaseEnvIsSafe()).toThrow(
      "DATABASE_URL must match TEST_DATABASE_URL",
    );
  });
});
