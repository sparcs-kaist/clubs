import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  raw: string;
};

const repoRoot = resolve(process.cwd(), "../..");

const readRepoFile = (path: string) =>
  readFileSync(resolve(repoRoot, path), "utf8");

const parseVersion = (raw: string): ParsedVersion => {
  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semantic version: ${raw}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw,
  };
};

const compareVersion = (a: ParsedVersion, b: ParsedVersion) =>
  a.major - b.major || a.minor - b.minor || a.patch - b.patch;

const readPackageVersion = () => {
  const packageJson = JSON.parse(readRepoFile("packages/web/package.json")) as {
    version?: string;
  };
  if (!packageJson.version) {
    throw new Error("packages/web/package.json does not have a version.");
  }
  return packageJson.version;
};

const readAppInfoVersion = () => {
  const source = readRepoFile("packages/web/src/constants/appVersion.mjs");
  const match = source.match(/export const CLUBS_VERSION = "([^"]+)";/);
  if (!match) {
    throw new Error(
      "packages/web/src/constants/appVersion.mjs does not export CLUBS_VERSION.",
    );
  }
  return match[1];
};

const readLatestPatchNoteVersion = () => {
  const source = readRepoFile("packages/web/src/constants/patchNote.ts");
  const versions = [...source.matchAll(/version:\s*"v\.(\d+\.\d+\.\d+)"/g)]
    .map(match => parseVersion(match[1]))
    .sort(compareVersion);

  const latest = versions.at(-1);
  if (!latest) {
    throw new Error("patchNote.ts does not contain any patch note versions.");
  }

  return latest.raw;
};

describe("Clubs version metadata", () => {
  it("keeps appInfo, package.json, and the latest patch note version in sync", () => {
    const packageVersion = readPackageVersion();
    const appInfoVersion = readAppInfoVersion();
    const latestPatchNoteVersion = readLatestPatchNoteVersion();

    const message = [
      "Clubs version mismatch:",
      `- packages/web/package.json: ${packageVersion}`,
      `- packages/web/src/constants/appVersion.mjs: ${appInfoVersion}`,
      `- packages/web/src/constants/patchNote.ts: ${latestPatchNoteVersion}`,
    ].join("\n");

    if (
      packageVersion !== appInfoVersion ||
      latestPatchNoteVersion !== appInfoVersion
    ) {
      throw new Error(message);
    }

    expect(packageVersion).toBe(appInfoVersion);
    expect(latestPatchNoteVersion).toBe(appInfoVersion);
  });

  it("derives the display version from CLUBS_VERSION", () => {
    const source = readRepoFile("packages/web/src/constants/appVersion.mjs");

    expect(source).toMatch(
      /export const CLUBS_DISPLAY_VERSION = `v\$\{CLUBS_VERSION\}`;/,
    );
  });
});
