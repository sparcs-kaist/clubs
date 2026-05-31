#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const IGNORED_COPY_CANDIDATES = [".env", ".clubs-secrets", ".claude"];
const BOOTSTRAP_COMMANDS = [
  "pnpm install",
  "pnpm rebuild @prisma/client prisma",
  "pnpm --filter api prisma:generate",
];

function parseArgs(argv) {
  const options = {
    branch: "",
    startPoint: "origin/dev",
    reuseRemoteBranch: false,
    worktreeName: "",
    skipBootstrap: false,
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

    if (arg === "--reuse-remote-branch") {
      options.reuseRemoteBranch = true;
      continue;
    }

    if (arg === "--skip-bootstrap") {
      options.skipBootstrap = true;
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

    if (arg === "--start-point") {
      options.startPoint = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--worktree-name") {
      options.worktreeName = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: pnpm clubs-task-start -- --branch <name> [options]

Options:
  --branch <name>             Branch name to use in the worktree
  --start-point <ref>         Base ref for a fresh branch (default: origin/dev)
  --reuse-remote-branch       Reuse origin/<branch> when it already exists
  --worktree-name <name>      Override the target directory name
  --skip-bootstrap            Skip install/rebuild/generate commands
  --dry-run                   Print actions without changing files
  -h, --help                  Show this help message
`);
}

function runGit(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
  }).trim();
}

function gitRoot() {
  return runGit(["rev-parse", "--show-toplevel"], process.cwd());
}

function primaryWorktreeRoot(repoRoot) {
  const output = runGit(["worktree", "list", "--porcelain"], repoRoot);
  const line = output.split("\n").find(entry => entry.startsWith("worktree "));

  if (!line) {
    throw new Error("Could not determine the primary worktree root.");
  }

  return line.replace("worktree ", "").trim();
}

function remoteBranchExists(repoRoot, branch) {
  const result = spawnSync(
    "git",
    ["show-ref", "--verify", "--quiet", `refs/remotes/origin/${branch}`],
    { cwd: repoRoot },
  );
  return result.status === 0;
}

function localBranchExists(repoRoot, branch) {
  const result = spawnSync(
    "git",
    ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`],
    { cwd: repoRoot },
  );
  return result.status === 0;
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

function currentBranch(repoRoot) {
  return runGit(["branch", "--show-current"], repoRoot);
}

function isWorktreeClean(repoRoot) {
  return runGit(["status", "--short"], repoRoot) === "";
}

function runGitCommand(args, cwd, dryRun) {
  console.log(`$ git ${args.join(" ")}`);
  if (dryRun) {
    return;
  }
  const result = spawnSync("git", args, {
    cwd,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`git ${args[0]} failed`);
  }
}

function readNodeVersion(repoRoot) {
  const nvmrcPath = join(repoRoot, ".nvmrc");
  if (!existsSync(nvmrcPath)) {
    return "";
  }

  return readFileSync(nvmrcPath, "utf8").trim();
}

function withNodeVersion(command, nodeVersion) {
  if (process.platform === "win32" || !nodeVersion) {
    return command;
  }

  return [
    'export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"',
    '[ -s "$NVM_DIR/nvm.sh" ]',
    '. "$NVM_DIR/nvm.sh"',
    `nvm use ${nodeVersion} >/dev/null || nvm install ${nodeVersion} >/dev/null`,
    command,
  ].join(" && ");
}

function runShell(command, cwd, dryRun, nodeVersion = "") {
  console.log(`$ (cd ${cwd} && ${command})`);
  if (dryRun) return;
  const shellCommand =
    process.platform === "win32"
      ? { file: "cmd.exe", args: ["/c", withNodeVersion(command, nodeVersion)] }
      : {
          file: process.env.SHELL || "/bin/bash",
          args: ["-lc", withNodeVersion(command, nodeVersion)],
        };
  const result = spawnSync(shellCommand.file, shellCommand.args, {
    cwd,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

function copyCandidate(sourceRoot, targetRoot, relativePath, dryRun) {
  const source = join(sourceRoot, relativePath);
  const target = join(targetRoot, relativePath);

  if (!existsSync(source)) {
    return false;
  }

  console.log(`$ copy ${source} -> ${target}`);
  if (dryRun) {
    return true;
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
  return true;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.branch) {
    throw new Error("--branch is required");
  }

  options.branch = normalizeBranch(options.branch);

  const repoRoot = gitRoot();
  const sourceRoot = primaryWorktreeRoot(repoRoot);
  const nodeVersion = readNodeVersion(sourceRoot);
  const worktreesRoot = resolve(sourceRoot, "..", "clubs-worktrees");
  const worktreeName =
    options.worktreeName || options.branch.replaceAll("/", "-");
  const target = join(worktreesRoot, worktreeName);

  console.log(`Current repo root: ${repoRoot}`);
  console.log(`Source repo root: ${sourceRoot}`);
  console.log(`Worktrees root: ${worktreesRoot}`);
  console.log(`Target branch: ${options.branch}`);
  console.log(`Target worktree: ${target}`);

  if (existsSync(target)) {
    throw new Error(`Target worktree already exists: ${target}`);
  }

  if (options.dryRun) {
    console.log(`$ mkdir -p ${worktreesRoot}`);
  } else {
    mkdirSync(worktreesRoot, { recursive: true });
  }

  const shouldCreateFreshBranch =
    !options.reuseRemoteBranch ||
    !remoteBranchExists(sourceRoot, options.branch);

  if (shouldCreateFreshBranch) {
    const sourceBranch = currentBranch(sourceRoot);

    if (sourceBranch === "dev") {
      runGitCommand(["pull", "origin", "dev"], sourceRoot, options.dryRun);
    } else {
      if (!isWorktreeClean(sourceRoot)) {
        throw new Error(
          "Primary repo worktree must be clean before syncing dev for a fresh branch. Switch or clean the primary repo first.",
        );
      }

      runGitCommand(["switch", "dev"], sourceRoot, options.dryRun);
      runGitCommand(["pull", "origin", "dev"], sourceRoot, options.dryRun);
      runGitCommand(["switch", sourceBranch], sourceRoot, options.dryRun);
    }
  }

  let worktreeArgs;
  if (
    options.reuseRemoteBranch &&
    remoteBranchExists(sourceRoot, options.branch)
  ) {
    if (localBranchExists(sourceRoot, options.branch)) {
      worktreeArgs = ["worktree", "add", target, options.branch];
    } else {
      worktreeArgs = [
        "worktree",
        "add",
        "-b",
        options.branch,
        target,
        `origin/${options.branch}`,
      ];
    }
  } else {
    worktreeArgs = [
      "worktree",
      "add",
      "-b",
      options.branch,
      target,
      options.startPoint,
    ];
  }

  console.log(`$ git ${worktreeArgs.join(" ")}`);
  if (!options.dryRun) {
    const result = spawnSync("git", worktreeArgs, {
      cwd: sourceRoot,
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error("git worktree add failed");
    }
  }

  const copied = [];
  for (const candidate of IGNORED_COPY_CANDIDATES) {
    if (copyCandidate(sourceRoot, target, candidate, options.dryRun)) {
      copied.push(candidate);
    }
  }

  if (copied.length > 0) {
    console.log("Copied ignored files:");
    for (const item of copied) {
      console.log(` - ${item}`);
    }
  } else {
    console.log("No ignored files were copied.");
  }

  if (!options.skipBootstrap) {
    for (const command of BOOTSTRAP_COMMANDS) {
      runShell(command, target, options.dryRun, nodeVersion);
    }
  }

  console.log("Done.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
