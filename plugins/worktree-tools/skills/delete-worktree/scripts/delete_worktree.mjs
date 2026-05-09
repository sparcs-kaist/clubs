#!/usr/bin/env node

import { existsSync, rmSync } from "node:fs";
import { basename, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

function parseArgs(argv) {
  const options = {
    branch: "",
    worktreePath: "",
    force: false,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") continue;
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--branch") {
      options.branch = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--worktree-path") {
      options.worktreePath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm delete-worktree -- [options]

Options:
  --branch <name>             Branch name for the worktree to delete
  --worktree-path <path>      Absolute or relative path of the worktree to delete
  --force                     Allow deletion even if git requires force
  --dry-run                   Print actions without changing files
  -h, --help                  Show this help message
`);
}

function runGit(args, cwd = process.cwd()) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function gitRoot() {
  return runGit(["rev-parse", "--show-toplevel"], process.cwd());
}

function parseWorktreeList(repoRoot) {
  const output = runGit(["worktree", "list", "--porcelain"], repoRoot);
  const blocks = output.split("\n\n").filter(Boolean);

  return blocks.map(block => {
    const entry = { worktree: "", branch: "", detached: false };
    for (const line of block.split("\n")) {
      if (line.startsWith("worktree ")) {
        entry.worktree = line.replace("worktree ", "").trim();
      } else if (line.startsWith("branch ")) {
        entry.branch = line.replace("branch refs/heads/", "").trim();
      } else if (line === "detached") {
        entry.detached = true;
      }
    }
    return entry;
  });
}

function normalizeBranch(input) {
  if (!input) return "";
  if (/^TU-\d+$/i.test(input)) {
    return input.toUpperCase();
  }
  if (/^\d+$/.test(input)) {
    return `TU-${input}`;
  }
  return input;
}

function runGitCommand(args, cwd, dryRun) {
  console.log(`$ git ${args.join(" ")}`);
  if (dryRun) return;
  const result = spawnSync("git", args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`git ${args[0]} failed`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.branch && !options.worktreePath) {
    throw new Error("Either --branch or --worktree-path is required");
  }

  const repoRoot = gitRoot();
  const worktrees = parseWorktreeList(repoRoot);
  const currentRoot = repoRoot;
  const primaryRoot = worktrees[0]?.worktree;
  const targetBranch = normalizeBranch(options.branch);
  const targetPath = options.worktreePath ? resolve(options.worktreePath) : "";

  const matched = worktrees.find(entry => {
    if (targetPath && resolve(entry.worktree) === targetPath) return true;
    if (targetBranch && entry.branch === targetBranch) return true;
    return false;
  });

  if (!matched) {
    throw new Error("Could not find the requested worktree");
  }

  const resolvedPath = resolve(matched.worktree);
  const resolvedBranch = matched.branch || targetBranch || basename(resolvedPath);

  if (resolvedPath === resolve(currentRoot)) {
    throw new Error("Refusing to delete the current worktree");
  }

  if (primaryRoot && resolvedPath === resolve(primaryRoot)) {
    throw new Error("Refusing to delete the primary repository worktree");
  }

  const status = runGit(["status", "--short"], resolvedPath);
  if (status && !options.force) {
    throw new Error("Target worktree has uncommitted changes. Re-run with --force if you really want to delete it.");
  }

  const removeArgs = ["worktree", "remove"];
  if (options.force) {
    removeArgs.push("--force");
  }
  removeArgs.push(resolvedPath);
  runGitCommand(removeArgs, repoRoot, options.dryRun);

  if (existsSync(resolvedPath)) {
    console.log(`$ rm -rf ${resolvedPath}`);
    if (!options.dryRun) {
      rmSync(resolvedPath, { recursive: true, force: true });
    }
  }

  if (resolvedBranch) {
    runGitCommand(["branch", "-D", resolvedBranch], repoRoot, options.dryRun);
  }

  console.log(`Deleted worktree: ${resolvedPath}`);
  if (resolvedBranch) {
    console.log(`Deleted local branch: ${resolvedBranch}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
