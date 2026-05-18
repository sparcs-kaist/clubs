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
  console.log(`Usage: pnpm clubs-task-cleanup -- [options]

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

function primaryWorktreeRoot(repoRoot) {
  const worktrees = parseWorktreeList(repoRoot);
  return worktrees[0]?.worktree ? resolve(worktrees[0].worktree) : repoRoot;
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

function localBranchExists(repoRoot, branch) {
  if (!branch) return false;
  const result = spawnSync(
    "git",
    ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`],
    { cwd: repoRoot },
  );
  return result.status === 0;
}

function currentBranch(repoRoot) {
  return runGit(["branch", "--show-current"], repoRoot);
}

function runGitCommand(args, cwd, dryRun, { allowFailure = false } = {}) {
  console.log(`$ git ${args.join(" ")}`);
  if (dryRun) return { ok: true, skipped: true };
  const result = spawnSync("git", args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    if (allowFailure) {
      return { ok: false, skipped: false };
    }
    throw new Error(`git ${args[0]} failed`);
  }
  return { ok: true, skipped: false };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const repoRoot = gitRoot();
  const worktrees = parseWorktreeList(repoRoot);
  const primaryRepoRoot = primaryWorktreeRoot(repoRoot);
  const worktreesRoot = resolve(primaryRepoRoot, "..", "clubs-worktrees");
  const currentRoot = repoRoot;
  const primaryRoot = worktrees[0]?.worktree;
  let targetBranch = normalizeBranch(options.branch);
  let targetPath = options.worktreePath ? resolve(options.worktreePath) : "";
  const currentBranchName = currentBranch(repoRoot);

  if (!targetBranch && !targetPath) {
    throw new Error(
      "No worktree target was provided. Re-run with --branch or --worktree-path for a non-current worktree.",
    );
  }

  const matched = worktrees.find(entry => {
    if (targetPath && resolve(entry.worktree) === targetPath) return true;
    if (targetBranch && entry.branch === targetBranch) return true;
    return false;
  });

  const resolvedPath = matched
    ? resolve(matched.worktree)
    : targetPath ||
      resolve(worktreesRoot, (targetBranch || "").replaceAll("/", "-"));
  const resolvedBranch =
    matched?.branch || targetBranch || basename(resolvedPath);

  if (resolvedPath === resolve(currentRoot)) {
    throw new Error("Refusing to delete the current worktree");
  }

  if (primaryRoot && resolvedPath === resolve(primaryRoot)) {
    throw new Error("Refusing to delete the primary repository worktree");
  }

  if (resolvedBranch && resolvedBranch === currentBranchName) {
    throw new Error(
      "Refusing to delete the branch checked out in the current worktree",
    );
  }

  if (matched && existsSync(resolvedPath)) {
    const status = runGit(["status", "--short"], resolvedPath);
    if (status && !options.force) {
      throw new Error(
        "Target worktree has uncommitted changes. Re-run with --force if you really want to delete it.",
      );
    }
  }

  let removedWorktree = false;
  if (matched) {
    const removeArgs = ["worktree", "remove"];
    if (options.force) {
      removeArgs.push("--force");
    }
    removeArgs.push(resolvedPath);
    const removeResult = runGitCommand(removeArgs, repoRoot, options.dryRun, {
      allowFailure: true,
    });

    if (options.dryRun) {
      removedWorktree = true;
    } else {
      const remaining = parseWorktreeList(repoRoot).some(
        entry =>
          resolve(entry.worktree) === resolvedPath ||
          entry.branch === resolvedBranch,
      );
      removedWorktree = removeResult.ok || !remaining;
      if (!removedWorktree) {
        throw new Error(`Worktree removal is incomplete for ${resolvedPath}`);
      }
    }
  }

  if (existsSync(resolvedPath)) {
    console.log(`$ rm -rf ${resolvedPath}`);
    if (!options.dryRun) {
      rmSync(resolvedPath, { recursive: true, force: true });
    }
    removedWorktree = true;
  }

  let removedBranch = false;
  if (resolvedBranch) {
    const deleteResult = runGitCommand(
      ["branch", "-D", resolvedBranch],
      repoRoot,
      options.dryRun,
      {
        allowFailure: true,
      },
    );
    removedBranch =
      options.dryRun ||
      deleteResult.ok ||
      !localBranchExists(repoRoot, resolvedBranch);
  }

  if (
    !matched &&
    !existsSync(resolvedPath) &&
    !localBranchExists(repoRoot, resolvedBranch)
  ) {
    console.log(`Worktree already absent: ${resolvedPath}`);
    if (resolvedBranch) {
      console.log(`Local branch already absent: ${resolvedBranch}`);
    }
    return;
  }

  console.log(`Deleted worktree: ${resolvedPath}`);
  if (resolvedBranch) {
    if (removedBranch) {
      console.log(`Deleted local branch: ${resolvedBranch}`);
    } else {
      console.log(`Local branch already absent: ${resolvedBranch}`);
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
