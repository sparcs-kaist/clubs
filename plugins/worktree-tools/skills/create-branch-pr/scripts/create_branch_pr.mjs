#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";

function parseArgs(argv) {
  const options = {
    command: "",
    taskId: "",
    branch: "",
    startPoint: "origin/dev",
    reuseRemoteBranch: false,
    title: "",
    notionUrl: "",
    base: "dev",
    head: "",
    bodyFile: "",
    summary: [],
    patchNoteCategory: "",
    patchNoteText: [],
    draft: false,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") continue;

    if (!options.command && !arg.startsWith("-")) {
      options.command = arg;
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

    if (arg === "--draft") {
      options.draft = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--task-id") {
      options.taskId = argv[index + 1] ?? "";
      index += 1;
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

    if (arg === "--title") {
      options.title = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--notion-url") {
      options.notionUrl = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--base") {
      options.base = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--head") {
      options.head = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--body-file") {
      options.bodyFile = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--summary") {
      options.summary.push(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--patch-note-category") {
      options.patchNoteCategory = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--patch-note-text") {
      options.patchNoteText.push(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  pnpm create-branch-pr -- branch --task-id TU-405 [options]
  pnpm create-branch-pr -- pr --task-id TU-405 --title "..." [options]

Subcommands:
  branch   Create or reuse a task branch
  pr       Create a pull request from the current or specified branch

Common options:
  --task-id <id>              Task id, usually TU-405
  --dry-run                   Print actions without changing git or GitHub state
  -h, --help                  Show this help message

Branch options:
  --branch <name>             Override branch name (default: task id)
  --start-point <ref>         Base ref for new branches (default: origin/dev)
  --reuse-remote-branch       Reuse origin/<branch> when it already exists

PR options:
  --title <text>              PR title body without or with TU prefix
  --notion-url <url>          Optional Notion task/spec URL for PR body context
  --base <branch>             Base branch (default: dev)
  --head <branch>             Head branch (default: current branch)
  --body-file <path>          Use an explicit PR body file
  --summary <text>            Repeatable summary bullet for generated PR body
                              Required when --body-file is omitted
  --patch-note-category <cat> Patch note category: feature, fix, design, docs,
                              internal, or none
                              Required when --body-file is omitted
  --patch-note-text <text>    Repeatable patch note text
                              Required for non-none categories
  --draft                     Create a draft PR
`);
}

function runGit(args, cwd = process.cwd()) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function currentBranch() {
  return runGit(["branch", "--show-current"]);
}

function localBranchExists(branch) {
  const result = spawnSync("git", [
    "show-ref",
    "--verify",
    "--quiet",
    `refs/heads/${branch}`,
  ]);
  return result.status === 0;
}

function remoteBranchExists(branch) {
  const result = spawnSync("git", [
    "show-ref",
    "--verify",
    "--quiet",
    `refs/remotes/origin/${branch}`,
  ]);
  return result.status === 0;
}

function normalizeTaskId(taskId) {
  if (!taskId) {
    throw new Error("--task-id is required");
  }

  if (/^TU-\d+$/i.test(taskId)) {
    return taskId.toUpperCase();
  }

  if (/^\d+$/.test(taskId)) {
    return `TU-${taskId}`;
  }

  return taskId;
}

function formatPrTitle(taskId, title) {
  if (!title) {
    throw new Error("--title is required for PR creation");
  }

  const normalizedTaskId = normalizeTaskId(taskId);
  if (title.startsWith(`[${normalizedTaskId}]`)) {
    return title;
  }

  return `[${normalizedTaskId}] ${title}`;
}

const patchNoteCategories = new Set([
  "feature",
  "fix",
  "design",
  "docs",
  "internal",
  "none",
]);
const patchNoteStartMarker = "<!-- clubs:patch-note:start -->";
const patchNoteEndMarker = "<!-- clubs:patch-note:end -->";

function normalizePatchNoteCategory(category) {
  const normalized = category.toLowerCase();

  if (!patchNoteCategories.has(normalized)) {
    throw new Error(
      "--patch-note-category must be one of feature, fix, design, docs, internal, or none",
    );
  }

  return normalized;
}

function formatPatchNoteText(textItems) {
  const filteredItems = textItems.map(item => item.trim()).filter(Boolean);

  if (filteredItems.length === 0) {
    return ["text:"];
  }

  if (filteredItems.length === 1) {
    return [`text: ${filteredItems[0]}`];
  }

  return ["text:", ...filteredItems.map(item => `- ${item}`)];
}

function validatePatchNoteInput(category, textItems) {
  if (!category) {
    throw new Error(
      "--patch-note-category is required when generating a PR body",
    );
  }

  const normalizedCategory = normalizePatchNoteCategory(category);
  const hasText = textItems.some(item => item.trim());

  if (normalizedCategory !== "none" && !hasText) {
    throw new Error(
      "--patch-note-text is required when --patch-note-category is not none",
    );
  }

  return normalizedCategory;
}

function validatePatchNoteBlock(body) {
  const startIndex = body.indexOf(patchNoteStartMarker);
  const endIndex = body.indexOf(patchNoteEndMarker);

  if (!body.includes("## Patch Note") || startIndex === -1 || endIndex === -1) {
    throw new Error(
      "PR body must include a ## Patch Note section with a clubs:patch-note block",
    );
  }

  if (endIndex < startIndex) {
    throw new Error(
      "clubs:patch-note end marker must appear after the start marker",
    );
  }

  const block = body.slice(startIndex + patchNoteStartMarker.length, endIndex);
  const categoryMatch = block.match(/^category:\s*(\S+)\s*$/m);
  const textMatch = block.match(/^text:\s*(.*)$/m);

  if (!categoryMatch) {
    throw new Error("clubs:patch-note block must include a category line");
  }

  const category = normalizePatchNoteCategory(categoryMatch[1]);

  if (!textMatch) {
    throw new Error("clubs:patch-note block must include a text line");
  }

  const textStartIndex = block.indexOf(textMatch[0]) + textMatch[0].length;
  const text = `${textMatch[1]}\n${block.slice(textStartIndex)}`.trim();

  if (category !== "none" && !text) {
    throw new Error(
      "clubs:patch-note text must not be empty unless category is none",
    );
  }
}

function switchOrCreateBranch(branch, startPoint, reuseRemoteBranch, dryRun) {
  let cmd;

  if (localBranchExists(branch)) {
    cmd = ["git", "switch", branch];
  } else if (reuseRemoteBranch && remoteBranchExists(branch)) {
    cmd = ["git", "switch", "-c", branch, "--track", `origin/${branch}`];
  } else {
    cmd = ["git", "switch", "-c", branch, startPoint];
  }

  console.log(`$ ${cmd.join(" ")}`);
  if (dryRun) return branch;

  const result = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("git switch failed");
  }

  return currentBranch();
}

function generatedPrBody({
  notionUrl,
  summary,
  taskId,
  patchNoteCategory,
  patchNoteText,
}) {
  const category = validatePatchNoteInput(patchNoteCategory, patchNoteText);
  const lines = [
    "## Summary",
    ...summary.map(item => `- ${item}`),
    "",
    "## Task Context",
    `- Task ID: ${normalizeTaskId(taskId)}`,
  ];

  if (notionUrl) {
    lines.push(`- Notion: ${notionUrl}`);
  }

  lines.push(
    "",
    "## Patch Note",
    "",
    patchNoteStartMarker,
    `category: ${category}`,
    ...formatPatchNoteText(patchNoteText),
    patchNoteEndMarker,
  );

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function createPullRequest(options) {
  const head = options.head || currentBranch();
  const taskId = normalizeTaskId(options.taskId);
  const title = formatPrTitle(options.taskId, options.title);

  let bodyFile = options.bodyFile;
  let tempDir = "";
  let generatedBody = "";

  if (!bodyFile && options.summary.length === 0) {
    throw new Error(
      "PR creation requires either --body-file or at least one --summary. Use --notion-url when you have the task page URL.",
    );
  }

  if (!bodyFile) {
    generatedBody = generatedPrBody({
      notionUrl: options.notionUrl,
      summary: options.summary,
      taskId,
      patchNoteCategory: options.patchNoteCategory,
      patchNoteText: options.patchNoteText,
    });
    tempDir = mkdtempSync(join(tmpdir(), "create-branch-pr-"));
    bodyFile = join(tempDir, "pr-body.md");
    writeFileSync(bodyFile, generatedBody, "utf8");
  } else {
    validatePatchNoteBlock(readFileSync(bodyFile, "utf8"));
  }

  const cmd = [
    "gh",
    "pr",
    "create",
    "--base",
    options.base,
    "--head",
    head,
    "--title",
    title,
    "--body-file",
    bodyFile,
  ];

  if (options.draft) {
    cmd.push("--draft");
  }

  console.log(`$ ${cmd.join(" ")}`);
  if (options.dryRun) {
    if (tempDir) {
      console.log("--- generated body ---");
      console.log(generatedBody.trimEnd());
      console.log("--- end body ---");
      rmSync(tempDir, { recursive: true, force: true });
    }
    return;
  }

  const result = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
  if (result.status !== 0) {
    throw new Error("gh pr create failed");
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help || !options.command) {
    printHelp();
    return;
  }

  if (options.command === "branch") {
    const taskId = normalizeTaskId(options.taskId);
    const branch = options.branch || taskId;
    const finalBranch = switchOrCreateBranch(
      branch,
      options.startPoint,
      options.reuseRemoteBranch,
      options.dryRun,
    );
    console.log(`Branch ready: ${finalBranch}`);
    return;
  }

  if (options.command === "pr") {
    createPullRequest(options);
    return;
  }

  throw new Error(`Unknown subcommand: ${options.command}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
