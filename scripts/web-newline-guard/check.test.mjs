import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findCollapsingDeclarations,
  findNewCollapsingDeclarations,
  hasNewlineDefault,
} from "./check.mjs";

const globalCss = "body { white-space: pre-line; }";
const layout = 'import "@sparcs-clubs/web/styles/globals.css";';

test("requires an active whitespace default and layout import", () => {
  assert.equal(hasNewlineDefault(globalCss, layout), true);
  assert.equal(hasNewlineDefault(`/* ${globalCss} */`, layout), false);
  assert.equal(hasNewlineDefault(globalCss, ""), false);
});

test("finds collapsing CSS and JSX styles but ignores comments", () => {
  assert.deepEqual(
    findCollapsingDeclarations(
      "card.css",
      "/* white-space: normal; */\np { white-space: nowrap; }\na { white-space-collapse: collapse; }\nli { white-space: pre-wrap; }",
    ).map(({ line, property }) => [line, property]),
    [
      [2, "white-space"],
      [3, "white-space-collapse"],
    ],
  );
  assert.deepEqual(
    findCollapsingDeclarations(
      "card.tsx",
      `<div style={{ whiteSpace: "normal", whiteSpaceCollapse: "preserve" }} />;
       <p style={{ whiteSpace: mode }} />;
       <p style={{ whiteSpace: "pre-line" }} />;`,
    ).map(({ value }) => value),
    ["normal", "mode"],
  );
});

test("detects a changed interpolation and permits documented single-line layouts", () => {
  const before =
    'const Cell = styled.div`white-space: ${({ wrap }) => wrap ? "pre-line" : "nowrap"};`;';
  const after = before.replace("pre-line", "normal");
  assert.equal(
    findNewCollapsingDeclarations("cell.tsx", before, after).length,
    1,
  );
  assert.equal(
    findNewCollapsingDeclarations("cell.tsx", before, before).length,
    0,
  );
  assert.equal(
    findCollapsingDeclarations(
      "cell.tsx",
      "const Cell = styled.div`\n/* web-newline: single-line -- This is a fixed-width label. */\nwhite-space: nowrap;\n`;",
    ).length,
    0,
  );
  assert.equal(
    findCollapsingDeclarations(
      "cell.tsx",
      "const Cell = styled.div`\n/* web-newline: single-line -- */\nwhite-space: nowrap;\n`;",
    ).length,
    1,
  );
});

test("checks the committed revision even when a working-tree edit fixes it", t => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "clubs-newline-guard-"));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));

  function git(...args) {
    const result = spawnSync("git", args, { cwd, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }

  function commit(message) {
    git("add", ".");
    git(
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "-qm",
      message,
    );
  }

  git("init", "-q");
  fs.mkdirSync(path.join(cwd, "packages/web/src/styles"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "packages/web/src/app"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "packages/web/src/styles/globals.css"),
    globalCss,
  );
  fs.writeFileSync(path.join(cwd, "packages/web/src/app/layout.tsx"), layout);
  commit("base");
  git("update-ref", "refs/remotes/origin/dev", "HEAD");

  const guard = fileURLToPath(new URL("./check.mjs", import.meta.url));
  const check = () =>
    spawnSync(process.execPath, [guard], { cwd, encoding: "utf8" });
  const page = path.join(cwd, "packages/web/src/app/page.tsx");

  fs.writeFileSync(page, "<p>{body}</p>;");
  commit("inherit the multiline default");
  assert.equal(check().status, 0);

  fs.writeFileSync(page, '<p style={{ whiteSpace: "normal" }}>{body}</p>;');
  commit("collapse line breaks");
  fs.writeFileSync(page, '<p style={{ whiteSpace: "pre-wrap" }}>{body}</p>;');

  const result = check();
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /packages\/web\/src\/app\/page\.tsx:1 whiteSpace: normal/,
  );
  commit("preserve line breaks");
  assert.equal(check().status, 0);
});
