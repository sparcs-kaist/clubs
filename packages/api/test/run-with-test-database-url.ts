import { spawnSync } from "node:child_process";

import { applyIntegrationTestDatabaseEnv } from "./integration/test-database-url";

const [command, ...rawArgs] = process.argv.slice(2);
const delimiterIndex = rawArgs.indexOf("--");
const args =
  delimiterIndex === -1
    ? rawArgs
    : [
        ...rawArgs.slice(0, delimiterIndex),
        ...rawArgs.slice(delimiterIndex + 1),
      ];

if (!command) {
  throw new Error("Command is required.");
}

applyIntegrationTestDatabaseEnv();

const result = spawnSync(command, args, {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

if (result.signal) {
  process.kill(process.pid, result.signal);
}

process.exit(result.status ?? 1);
