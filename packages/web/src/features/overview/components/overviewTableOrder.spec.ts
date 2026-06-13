import * as assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const overviewTableFiles = [
  "DelegatesOverviewTable.tsx",
  "ClubIntoKROverviewTable.tsx",
];

describe("overview table order", () => {
  it("preserves API row order instead of sorting by club id", () => {
    overviewTableFiles.forEach(fileName => {
      const source = readFileSync(new URL(fileName, import.meta.url), "utf8");

      assert.doesNotMatch(
        source,
        /sort\(\s*\(a,\s*b\)\s*=>\s*\(a\.clubId\s*<\s*b\.clubId\s*\?\s*-1\s*:\s*1\)\s*\)/u,
        `${fileName} should not override overview API ordering`,
      );
    });
  });
});
