#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const DEFAULT_FILE = "packages/web/src/constants/patchNote.ts";
const PATCH_NOTE_START = "<!-- clubs:patch-note:start -->";
const PATCH_NOTE_END = "<!-- clubs:patch-note:end -->";

const CATEGORY_SECTIONS = [
  ["feature", "신규 기능은 다음과 같습니다."],
  ["fix", "오류 수정은 다음과 같습니다."],
  ["design", "디자인 수정은 다음과 같습니다."],
  ["docs", "문서 변경은 다음과 같습니다."],
  ["etc", "기타 변경사항은 다음과 같습니다."],
];

function parseArgs(argv) {
  const options = {
    base: "origin/main",
    head: "HEAD",
    file: DEFAULT_FILE,
    bump: "patch",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

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

    if (arg === "--file") {
      options.file = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--bump") {
      options.bump = (argv[index + 1] ?? "").toLowerCase();
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function parseRepository() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (repository) {
    return repository;
  }

  const remoteUrl = runGit(["remote", "get-url", "origin"]);
  const match = remoteUrl.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
  if (!match) {
    throw new Error("Could not determine GitHub repository.");
  }
  return match[1];
}

async function githubApi(path) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    return undefined;
  }

  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}): ${path}`);
  }

  return response.json();
}

function commitsInRange(base, head) {
  const output = runGit([
    "log",
    "--reverse",
    "--format=%H%x1f%s",
    `${base}..${head}`,
  ]);

  if (!output) {
    return [];
  }

  return output.split("\n").map(line => {
    const [sha, subject] = line.split("\x1f");
    return { sha, subject };
  });
}

function extractPrNumbers(subject) {
  const numbers = [];
  const matcher = /\(#(\d+)\)/g;
  let match = matcher.exec(subject);
  while (match) {
    numbers.push(Number(match[1]));
    match = matcher.exec(subject);
  }
  return numbers;
}

async function collectPullRequests(commits, repository) {
  const byNumber = new Map();

  for (const commit of commits) {
    for (const number of extractPrNumbers(commit.subject)) {
      if (!byNumber.has(number)) {
        byNumber.set(number, { number });
      }
    }

    const pulls = await githubApi(
      `/repos/${repository}/commits/${commit.sha}/pulls`,
    );
    if (!pulls) {
      continue;
    }

    for (const pull of pulls) {
      if (!byNumber.has(pull.number)) {
        byNumber.set(pull.number, { number: pull.number });
      }
    }
  }

  const result = [];
  for (const { number } of byNumber.values()) {
    const pull = await githubApi(`/repos/${repository}/pulls/${number}`);
    if (pull) {
      if (pull.base?.ref && pull.base.ref !== "dev") {
        continue;
      }
      result.push(pull);
      continue;
    }

    const fallbackCommit = commits.find(commit =>
      extractPrNumbers(commit.subject).includes(number),
    );
    result.push({
      number,
      title: fallbackCommit?.subject.replace(/\s*\(#\d+\)\s*$/, "") ?? "",
      body: "",
      labels: [],
    });
  }

  return result;
}

function inferCategoryFromPullRequest(pull) {
  const labels = (pull.labels ?? []).map(label => label.name);

  for (const category of ["feature", "fix", "design", "docs", "etc"]) {
    if (labels.includes(`patch:${category}`)) {
      return category;
    }
  }

  const title = pull.title.toLowerCase();
  if (/^(feat|feature)(\(.+\))?:/.test(title)) return "feature";
  if (/^(fix|hotfix)(\(.+\))?:/.test(title)) return "fix";
  if (/^(style|design)(\(.+\))?:/.test(title)) return "design";
  if (/^docs(\(.+\))?:/.test(title)) return "docs";
  return "etc";
}

function stripBullet(line) {
  return line.replace(/^\s*[-*]\s+/, "").trim();
}

function sanitizeText(value) {
  return value
    .replace(/^\[[^\]]+]\s*/, "")
    .replace(
      /^(feat|feature|fix|hotfix|chore|docs|style|design|refactor|test)(\([^)]+\))?:\s*/i,
      "",
    )
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/@\w[\w-]*/g, " ")
    .replace(/\$\{/g, "")
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function parsePatchNoteBlock(body) {
  const startIndex = body.indexOf(PATCH_NOTE_START);
  const endIndex = body.indexOf(PATCH_NOTE_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return undefined;
  }

  const block = body
    .slice(startIndex + PATCH_NOTE_START.length, endIndex)
    .trim();

  if (/^none$/i.test(block)) {
    return { category: "none", texts: [] };
  }

  const lines = block.split(/\r?\n/);
  const categoryLine = lines.find(line => /^category\s*:/i.test(line));
  const rawCategory = categoryLine?.split(":").slice(1).join(":").trim();
  const category = rawCategory?.toLowerCase() || "etc";
  const textIndex = lines.findIndex(line => /^text\s*:/i.test(line));
  const texts = [];

  if (textIndex !== -1) {
    const afterText = lines[textIndex].split(":").slice(1).join(":").trim();
    if (afterText) {
      texts.push(afterText);
    }

    for (const line of lines.slice(textIndex + 1)) {
      if (/^[a-z-]+\s*:/i.test(line)) {
        break;
      }

      const text = stripBullet(line);
      if (text) {
        texts.push(text);
      }
    }
  }

  if (texts.length === 0) {
    for (const line of lines) {
      if (/^category\s*:/i.test(line)) {
        continue;
      }
      const text = stripBullet(line);
      if (text) {
        texts.push(text);
      }
    }
  }

  return { category, texts: texts.map(sanitizeText).filter(Boolean) };
}

function normalizePullRequestNote(pull) {
  const labels = (pull.labels ?? []).map(label => label.name);
  if (labels.includes("patch:skip")) {
    return [];
  }

  const explicit = parsePatchNoteBlock(pull.body ?? "");
  const note = explicit ?? {
    category: inferCategoryFromPullRequest(pull),
    texts: [sanitizeText(pull.title)],
  };

  if (note.category === "none" || note.category === "internal") {
    return [];
  }

  const allowed = new Set(CATEGORY_SECTIONS.map(([category]) => category));
  const category = allowed.has(note.category) ? note.category : "etc";

  return note.texts.map(text => ({
    category,
    text: `${text.replace(/[.。]\s*$/, "")}. (#${pull.number})`,
  }));
}

function parseVersions(source) {
  return [...source.matchAll(/version:\s*"v\.(\d+)\.(\d+)\.(\d+)"/g)].map(
    match => ({
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3]),
    }),
  );
}

function compareVersion(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

function bumpVersion(version, bump) {
  if (bump === "major") {
    return { major: version.major + 1, minor: 0, patch: 0 };
  }

  if (bump === "minor") {
    return { major: version.major, minor: version.minor + 1, patch: 0 };
  }

  if (bump === "patch") {
    return {
      major: version.major,
      minor: version.minor,
      patch: version.patch + 1,
    };
  }

  throw new Error(`Unsupported version bump: ${bump}`);
}

function formatVersion(version) {
  return `v.${version.major}.${version.minor}.${version.patch}`;
}

function nextVersionFromMain(base, file, bump) {
  const mainSource = runGit(["show", `${base}:${file}`]);
  const versions = parseVersions(mainSource);
  if (versions.length === 0) {
    throw new Error(`No patch note versions found in ${base}:${file}`);
  }

  const latest = versions.sort(compareVersion).at(-1);
  return formatVersion(bumpVersion(latest, bump));
}

function kstDateLiteral() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}.${values.month}.${values.day}`;
}

function escapeTemplateLiteral(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function buildPatchNoteContent(version, notes) {
  const contentVersion = version.replace(/^v\./, "v");
  const grouped = new Map(
    CATEGORY_SECTIONS.map(([category]) => [category, []]),
  );

  for (const note of notes) {
    grouped.get(note.category)?.push(note.text);
  }

  const lines = [`Clubs ${contentVersion}`];
  for (const [category, title] of CATEGORY_SECTIONS) {
    const items = grouped.get(category) ?? [];
    if (items.length === 0) {
      continue;
    }

    lines.push(title);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function buildEntry(version, notes, sourceHash) {
  const content = escapeTemplateLiteral(buildPatchNoteContent(version, notes));
  return `  // clubs:auto-patch-note version=${version} source=${sourceHash}
  {
    version: "${version}",
    date: new Date("${kstDateLiteral()}"),
    patchNoteContent: \`${content}\`,
  },
`;
}

function replaceOrInsertEntry(source, version, entry) {
  const versionPattern = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingEntry = new RegExp(
    `\\s*(?:// clubs:auto-patch-note[^\\n]*\\n)?\\s*\\{\\n\\s*version: "${versionPattern}",[\\s\\S]*?\\n\\s*\\},\\n`,
  );

  if (existingEntry.test(source)) {
    return source.replace(existingEntry, `\n${entry}`);
  }

  const listStart = "const patchNoteList: patchNote[] = [\n";
  if (!source.includes(listStart)) {
    throw new Error("Could not find patchNoteList declaration.");
  }

  return source.replace(listStart, `${listStart}${entry}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repository = parseRepository();
  const commits = commitsInRange(options.base, options.head);

  if (commits.length === 0) {
    console.log("No commits found in release range.");
    return;
  }

  const pullRequests = await collectPullRequests(commits, repository);
  const notes = pullRequests.flatMap(normalizePullRequestNote);

  if (notes.length === 0) {
    console.log("No user-facing patch note entries found.");
    return;
  }

  const version = nextVersionFromMain(options.base, options.file, options.bump);
  const sourceHash = createHash("sha256")
    .update(JSON.stringify({ version, notes }))
    .digest("hex")
    .slice(0, 12);
  const source = readFileSync(options.file, "utf8");
  const entry = buildEntry(version, notes, sourceHash);
  const updated = replaceOrInsertEntry(source, version, entry);

  if (options.dryRun) {
    console.log(entry);
    return;
  }

  if (updated === source) {
    console.log(`Patch note ${version} is already up to date.`);
    return;
  }

  writeFileSync(options.file, updated, "utf8");
  console.log(`Prepared ${version} with ${notes.length} patch note entries.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
