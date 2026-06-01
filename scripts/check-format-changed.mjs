#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";

const baseRef = process.env.FORMAT_CHECK_BASE ?? "origin/dev";

const diff = spawnSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMRT", baseRef, "--"],
  {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  },
);

if (diff.status !== 0) {
  process.exitCode = diff.status ?? 1;
  process.exit();
}

const files = diff.stdout
  .split("\n")
  .map(file => file.trim())
  .filter(Boolean)
  .filter(file => fs.existsSync(file));

if (files.length === 0) {
  console.log(`No changed files to format-check against ${baseRef}.`);
  process.exit();
}

const result = spawnSync(
  "pnpm",
  ["exec", "prettier", "--check", "--ignore-unknown", ...files],
  {
    stdio: "inherit",
  },
);

process.exitCode = result.status ?? 1;
