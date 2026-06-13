const TEST_DATABASE_NAME_PATTERN = /(^|[_-])test($|[_-])/i;

export function isTestDatabaseName(databaseName) {
  return TEST_DATABASE_NAME_PATTERN.test(databaseName);
}

export function assertDatabaseUrlUsesTestDatabase(
  rawDatabaseUrl,
  { commandName = "This command", variableName = "DATABASE_URL" } = {},
) {
  if (!rawDatabaseUrl) {
    throw new Error(`${commandName} requires ${variableName} to be set.`);
  }

  let databaseUrl;

  try {
    databaseUrl = new URL(rawDatabaseUrl);
  } catch {
    throw new Error(
      `${commandName} requires ${variableName} to be a valid URL.`,
    );
  }

  if (databaseUrl.protocol !== "mysql:") {
    throw new Error(
      `${commandName} requires ${variableName} to point to a mysql test database.`,
    );
  }

  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\/+/, ""),
  ).toLowerCase();

  if (!isTestDatabaseName(databaseName)) {
    throw new Error(
      `${commandName} requires ${variableName} to point to a test database name.`,
    );
  }
}
