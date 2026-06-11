import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const TEST_DATABASE_NAME_PATTERN = /(^|[_-])test($|[_-])/;

function loadRootDotEnv(): void {
  const envPaths = [
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), ".env"),
  ];

  const envPath = envPaths.find(path => existsSync(path));

  if (envPath) {
    config({ path: envPath, quiet: true });
  }
}

export function assertSafeTestDatabaseUrl(
  rawDatabaseUrl: string | undefined,
): asserts rawDatabaseUrl is string {
  if (!rawDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  }

  let databaseUrl: URL;

  try {
    databaseUrl = new URL(rawDatabaseUrl);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid database URL.");
  }

  if (databaseUrl.protocol !== "mysql:") {
    throw new Error("Integration tests must use a mysql:// database URL.");
  }

  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\/+/, ""),
  ).toLowerCase();

  if (!TEST_DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new Error("Integration tests must use a test database name.");
  }
}

export function assertIntegrationDatabaseEnvIsSafe(): string {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Integration database cleanup can only run in NODE_ENV=test.",
    );
  }

  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  }

  if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must match TEST_DATABASE_URL before integration tests can touch the database.",
    );
  }

  assertSafeTestDatabaseUrl(process.env.DATABASE_URL);

  return process.env.DATABASE_URL;
}

export function applyIntegrationTestDatabaseEnv(): string {
  process.env.NODE_ENV = "test";
  loadRootDotEnv();
  assertSafeTestDatabaseUrl(process.env.TEST_DATABASE_URL);
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

  return assertIntegrationDatabaseEnvIsSafe();
}
