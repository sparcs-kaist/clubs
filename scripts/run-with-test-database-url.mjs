#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { assertDatabaseUrlUsesTestDatabase } from "./database-url-safety.mjs";

const argv = process.argv.slice(2);
const commandArgs = argv[0] === "--" ? argv.slice(1) : argv;
const [command, ...args] = commandArgs;

if (!command) {
  console.error("Command is required.");
  process.exit(1);
}

try {
  assertDatabaseUrlUsesTestDatabase(process.env.DATABASE_URL, {
    commandName: "Database command",
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const result = spawnSync(command, args, {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
