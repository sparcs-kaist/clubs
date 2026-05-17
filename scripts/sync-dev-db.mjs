#!/usr/bin/env node

import {
  createReadStream,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { createInterface } from "node:readline";
import { join, resolve } from "node:path";
import { createGunzip } from "node:zlib";
import mysql from "mysql2/promise";

const DUMPS_DIR = "db_dumps";
const CONTINUE_PHRASE = "sync dev db";

const redactions = new Set();

function addRedaction(value) {
  if (value) {
    redactions.add(value);
  }
}

function redact(value) {
  let result = String(value);
  for (const secret of redactions) {
    result = result.split(secret).join("[redacted]");
  }
  return result;
}

function parseArgs(argv) {
  const options = {
    dumpFile: "",
    latest: false,
    yes: false,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "--latest") {
      options.latest = true;
      continue;
    }

    if (arg === "-y" || arg === "--yes") {
      options.yes = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (options.dumpFile) {
      throw new Error("Only one dump file can be provided.");
    }

    options.dumpFile = arg;
  }

  if (options.latest && options.dumpFile) {
    throw new Error("Use either a dump file path or --latest, not both.");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm db:sync-dev -- <dump.sql> [options]

Options:
  --latest        Use the newest .sql or .sql.gz file in db_dumps
  -y, --yes       Skip the destructive confirmation prompt
  --dry-run       Validate inputs without connecting to the database
  -h, --help      Show this help message

Examples:
  pnpm db:sync-dev -- db_dumps/prod.sql
  pnpm db:sync-dev -- --latest --yes
`);
}

function stripInlineComment(value) {
  const commentIndex = value.search(/\s#/);
  if (commentIndex === -1) {
    return value;
  }
  return value.slice(0, commentIndex).trimEnd();
}

function unquoteEnvValue(value) {
  const trimmed = stripInlineComment(value.trim());
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readEnvFile(envPath) {
  if (!existsSync(envPath)) {
    throw new Error(".env file was not found.");
  }

  const env = {};
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    env[key] = unquoteEnvValue(value);
  }

  return env;
}

function expandEnvValue(value, env) {
  return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(env, key)) {
      return env[key];
    }
    if (Object.prototype.hasOwnProperty.call(process.env, key)) {
      return process.env[key];
    }
    return "";
  });
}

function readDatabaseUrl() {
  const env = readEnvFile(resolve(".env"));
  const rawDatabaseUrl = env.DATABASE_URL ?? process.env.DATABASE_URL;

  if (!rawDatabaseUrl) {
    throw new Error("DATABASE_URL is not set in .env.");
  }

  const databaseUrl = expandEnvValue(rawDatabaseUrl, env);
  addRedaction(databaseUrl);

  return databaseUrl;
}

function createConnectionOptions(databaseUrl) {
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  addRedaction(url.hostname);
  addRedaction(`${url.hostname}:${url.port}`);
  addRedaction(decodeURIComponent(url.password));

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    charset: "utf8mb4",
    supportBigNumbers: true,
  };
}

function isSqlDump(filePath) {
  return filePath.endsWith(".sql") || filePath.endsWith(".sql.gz");
}

function resolveDumpFile(options) {
  if (options.latest) {
    const dumpsDir = resolve(DUMPS_DIR);
    if (!existsSync(dumpsDir)) {
      throw new Error(`${DUMPS_DIR} directory was not found.`);
    }

    const candidates = readdirSync(dumpsDir, { withFileTypes: true })
      .filter(entry => entry.isFile() && isSqlDump(entry.name))
      .map(entry => {
        const path = join(dumpsDir, entry.name);
        return { path, modifiedAt: statSync(path).mtimeMs };
      })
      .sort((left, right) => right.modifiedAt - left.modifiedAt);

    if (candidates.length === 0) {
      throw new Error(`No .sql or .sql.gz files were found in ${DUMPS_DIR}.`);
    }

    return candidates[0].path;
  }

  if (!options.dumpFile) {
    throw new Error("Provide a dump file path or use --latest.");
  }

  return resolve(options.dumpFile);
}

function createDumpStream(filePath) {
  const stream = filePath.endsWith(".gz")
    ? createReadStream(filePath).pipe(createGunzip())
    : createReadStream(filePath);
  stream.setEncoding("utf8");
  return stream;
}

function quoteIdentifier(identifier) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

async function confirmDestructiveAction(options, dumpFile) {
  if (options.yes || options.dryRun) {
    return;
  }

  console.log(
    "This will remove existing tables from the database configured in .env and import:",
  );
  console.log(`  ${dumpFile}`);
  console.log(`Type "${CONTINUE_PHRASE}" to continue.`);

  const input = await new Promise(resolveInput => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readline.question("> ", answer => {
      readline.close();
      resolveInput(answer.trim());
    });
  });

  if (input !== CONTINUE_PHRASE) {
    throw new Error("Confirmation did not match. Aborted.");
  }
}

async function collectDumpTableNames(filePath) {
  const tableNames = new Set();
  const readline = createInterface({
    input: createDumpStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of readline) {
    const match = line.match(/^CREATE TABLE `([^`]+)`/);
    if (match) {
      tableNames.add(match[1]);
    }
  }

  return tableNames;
}

async function dropExistingObjects(connection) {
  const [rows] = await connection.query(
    "SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
  );

  const views = rows.filter(row => row.TABLE_TYPE === "VIEW");
  const tables = rows.filter(row => row.TABLE_TYPE === "BASE TABLE");

  for (const view of views) {
    await connection.query(
      `DROP VIEW IF EXISTS ${quoteIdentifier(view.TABLE_NAME)}`,
    );
  }

  if (tables.length > 0) {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const table of tables) {
        await connection.query(
          `DROP TABLE IF EXISTS ${quoteIdentifier(table.TABLE_NAME)}`,
        );
      }
    } finally {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    }
  }

  return { tables: tables.length, views: views.length };
}

function shouldExecuteStatement(statement) {
  return statement.trim().length > 0;
}

async function importDump(connection, filePath) {
  const stream = createDumpStream(filePath);
  let statement = "";
  let statementCount = 0;

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;
  let previous = "";

  for await (const chunk of stream) {
    for (const char of chunk) {
      statement += char;

      if (inLineComment) {
        if (char === "\n") {
          inLineComment = false;
        }
        previous = char;
        continue;
      }

      if (inBlockComment) {
        if (previous === "*" && char === "/") {
          inBlockComment = false;
        }
        previous = char;
        continue;
      }

      if (inSingleQuote || inDoubleQuote) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (inSingleQuote && char === "'") {
          inSingleQuote = false;
        } else if (inDoubleQuote && char === '"') {
          inDoubleQuote = false;
        }
        previous = char;
        continue;
      }

      if (inBacktick) {
        if (char === "`") {
          inBacktick = false;
        }
        previous = char;
        continue;
      }

      if (previous === "-" && char === "-") {
        inLineComment = true;
        previous = char;
        continue;
      }

      if (char === "#") {
        inLineComment = true;
        previous = char;
        continue;
      }

      if (previous === "/" && char === "*") {
        inBlockComment = true;
        previous = char;
        continue;
      }

      if (char === "'") {
        inSingleQuote = true;
        previous = char;
        continue;
      }

      if (char === '"') {
        inDoubleQuote = true;
        previous = char;
        continue;
      }

      if (char === "`") {
        inBacktick = true;
        previous = char;
        continue;
      }

      if (char === ";") {
        if (shouldExecuteStatement(statement)) {
          await connection.query(statement);
          statementCount += 1;
          if (statementCount % 50 === 0) {
            console.log(`Imported ${statementCount} statements...`);
          }
        }
        statement = "";
      }

      previous = char;
    }
  }

  if (shouldExecuteStatement(statement)) {
    await connection.query(statement);
    statementCount += 1;
  }

  return statementCount;
}

async function countCurrentTables(connection) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS tableCount FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'",
  );
  return Number(rows[0]?.tableCount ?? 0);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const dumpFile = resolveDumpFile(options);
  if (!existsSync(dumpFile)) {
    throw new Error(`Dump file was not found: ${dumpFile}`);
  }

  if (!isSqlDump(dumpFile)) {
    throw new Error("Dump file must end with .sql or .sql.gz.");
  }

  const databaseUrl = readDatabaseUrl();
  const connectionOptions = createConnectionOptions(databaseUrl);
  const dumpTableNames = await collectDumpTableNames(dumpFile);

  console.log(`Selected dump: ${dumpFile}`);
  console.log(`Dump table count: ${dumpTableNames.size}`);
  console.log("Target database: DATABASE_URL from .env");

  await confirmDestructiveAction(options, dumpFile);

  if (options.dryRun) {
    console.log("Dry run complete. No database changes were made.");
    return;
  }

  const connection = await mysql.createConnection(connectionOptions);

  try {
    const dropped = await dropExistingObjects(connection);
    console.log(`Dropped ${dropped.tables} tables and ${dropped.views} views.`);

    const statementCount = await importDump(connection, dumpFile);
    const importedTableCount = await countCurrentTables(connection);

    console.log(`Imported ${statementCount} statements.`);
    console.log(`Current table count: ${importedTableCount}`);

    if (dumpTableNames.size > 0 && importedTableCount !== dumpTableNames.size) {
      throw new Error(
        `Imported table count mismatch: expected ${dumpTableNames.size}, got ${importedTableCount}.`,
      );
    }
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(redact(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
