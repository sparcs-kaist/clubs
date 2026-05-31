import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import ts from "typescript";

import {
  analyzeSourceFile,
  buildReport,
  collectEvidence,
  evaluateDecisionCoverage,
} from "./analyzer.mjs";
import { filterChangedDecisions } from "./changed-decisions.mjs";

const require = createRequire(import.meta.url);

test("analyzeSourceFile extracts atomic conditions from decision expressions", () => {
  const workspace = makeTempWorkspace();
  const sourcePath = path.join(workspace, "feature.ts");

  fs.writeFileSync(
    sourcePath,
    `
export function canSubmit(user, featureEnabled) {
  if (user.active && (user.role === "admin" || featureEnabled)) {
    return true;
  }

  return false;
}
`,
  );

  const decisions = analyzeSourceFile(sourcePath, { rootDir: workspace });

  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].kind, "if");
  assert.equal(decisions[0].providerId, "typescript-control-flow");
  assert.equal(decisions[0].providerVersion, 1);
  assert.match(decisions[0].stableKey, /typescript-control-flow:if/u);
  assert.deepEqual(
    decisions[0].conditions.map(condition => condition.text),
    ["user.active", 'user.role === "admin"', "featureEnabled"],
  );
});

test("analyzeSourceFile treats boolean const initializers as decisions", () => {
  const workspace = makeTempWorkspace();
  const sourcePath = path.join(workspace, "feature.ts");

  fs.writeFileSync(
    sourcePath,
    `
export function canSubmit(user, featureEnabled) {
  const hasAccess = user.active && featureEnabled;

  if (hasAccess) {
    return true;
  }

  return false;
}
`,
  );

  const decisions = analyzeSourceFile(sourcePath, { rootDir: workspace });

  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].kind, "boolean-const");
  assert.equal(decisions[0].providerId, "typescript-boolean-const");
  assert.deepEqual(
    decisions[0].conditions.map(condition => condition.text),
    ["user.active", "featureEnabled"],
  );
});

test("analyzeSourceFile extracts array predicate decisions", () => {
  const workspace = makeTempWorkspace();
  const sourcePath = path.join(workspace, "feature.ts");

  fs.writeFileSync(
    sourcePath,
    `
export function hasInvalidRange(ranges, min, max) {
  return ranges.some(range => range.start < min || range.end > max);
}
`,
  );

  const decisions = analyzeSourceFile(sourcePath, { rootDir: workspace });

  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].kind, "some-predicate");
  assert.equal(decisions[0].providerId, "typescript-array-predicate");
  assert.deepEqual(
    decisions[0].conditions.map(condition => condition.text),
    ["range.start < min", "range.end > max"],
  );
});

test("analyzeSourceFile extracts ts-pattern P.when decisions", () => {
  const workspace = makeTempWorkspace();
  const sourcePath = path.join(workspace, "feature.ts");

  fs.writeFileSync(
    sourcePath,
    `
import { match, P } from "ts-pattern";

export function validate(input) {
  return match(input)
    .with(P.when(({ status, amount }) => status === "rejected" && amount !== 0), () => "invalid")
    .otherwise(() => null);
}
`,
  );

  const decisions = analyzeSourceFile(sourcePath, { rootDir: workspace });

  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].kind, "ts-pattern-when");
  assert.equal(decisions[0].providerId, "typescript-ts-pattern");
  assert.deepEqual(
    decisions[0].conditions.map(condition => condition.text),
    ['status === "rejected"', "amount !== 0"],
  );
});

test("jest transformer skips short-circuit property access decisions", () => {
  const unsafeOutput = transformWithMcdc(`
export function canRead(obj) {
  if (obj && obj.prop) {
    return true;
  }

  return false;
}
`);
  const safeOutput = transformWithMcdc(`
export function canRead(left, right) {
  if (left && right) {
    return true;
  }

  return false;
}
`);

  assert.doesNotMatch(unsafeOutput, /__MCDC_EVALUATE__/u);
  assert.match(safeOutput, /__MCDC_EVALUATE__/u);
});

test("runtime evidence files are unique across suites in the same process", () => {
  const workspace = makeTempWorkspace();
  const previousEvidenceDir = process.env.MCDC_EVIDENCE_DIR;
  const previousExpect = globalThis.expect;
  const runtime = require("./runtime.cjs");
  const metadata = {
    id: "src/foo.ts:1:1:abcd1234",
    stableKey: "src/foo.ts:typescript-control-flow:if:aaaa1111:bbbb2222:1",
  };

  process.env.MCDC_EVIDENCE_DIR = workspace;
  runtime.install();

  try {
    setJestState("feature-a.spec.ts", "suite A covers true", workspace);
    globalThis.__MCDC_EVALUATE__(
      metadata,
      [() => true, () => true],
      (C1, C2) => C1 && C2,
    );
    runtime.flush();

    setJestState("feature-b.spec.ts", "suite B covers false", workspace);
    globalThis.__MCDC_EVALUATE__(
      metadata,
      [() => false, () => true],
      (C1, C2) => C1 && C2,
    );
    runtime.flush();

    const files = fs
      .readdirSync(workspace)
      .filter(file => file.endsWith(".json"));
    const evidence = collectEvidence([workspace], { rootDir: workspace });
    const cases = evidence.get(metadata.stableKey);

    assert.equal(files.length, 2);
    assert.equal(cases.length, 2);
    assert.deepEqual(
      cases.map(testCase => testCase.name),
      ["suite A covers true", "suite B covers false"],
    );
  } finally {
    if (previousEvidenceDir === undefined) {
      delete process.env.MCDC_EVIDENCE_DIR;
    } else {
      process.env.MCDC_EVIDENCE_DIR = previousEvidenceDir;
    }

    globalThis.expect = previousExpect;
  }
});

test("evaluateDecisionCoverage finds unique-cause MC/DC pairs", () => {
  const decision = {
    conditions: [
      { name: "C1", text: "a" },
      { name: "C2", text: "b" },
      { name: "C3", text: "c" },
    ],
  };
  const cases = [
    namedCase("base", { C1: true, C2: true, C3: false }, true),
    namedCase("c1 false", { C1: false, C2: true, C3: false }, false),
    namedCase("c2 false", { C1: true, C2: false, C3: false }, false),
    namedCase("c3 true", { C1: true, C2: false, C3: true }, true),
  ];

  const coverage = evaluateDecisionCoverage(decision, cases);

  assert.equal(coverage.covered, true);
  assert.deepEqual(
    coverage.conditions.map(condition => condition.covered),
    [true, true, true],
  );
});

test("buildReport marks missing MC/DC evidence per condition", () => {
  const decision = {
    id: "src/foo.ts:1:5:abcd1234",
    sourcePath: "src/foo.ts",
    line: 1,
    column: 5,
    kind: "if",
    expression: "a && b",
    conditions: [
      { name: "C1", text: "a" },
      { name: "C2", text: "b" },
    ],
  };
  const evidence = new Map([
    [
      decision.id,
      [
        namedCase("both true", { C1: true, C2: true }, true),
        namedCase("a false", { C1: false, C2: true }, false),
      ],
    ],
  ]);

  const report = buildReport([decision], evidence);

  assert.equal(report.summary.coveredConditions, 1);
  assert.equal(report.summary.missingConditions, 1);
  assert.equal(report.decisions[0].covered, false);
});

test("collectEvidence reads @mcdc comments from test files", () => {
  const workspace = makeTempWorkspace();
  const testPath = path.join(workspace, "feature.spec.ts");

  fs.writeFileSync(
    testPath,
    `
/*
 * @mcdc
 * decision: src/foo.ts:1:5:abcd1234
 * case: C1=true, C2=true => true
 * case: C1=false, C2=true => false
 */
`,
  );

  const evidence = collectEvidence([testPath], { rootDir: workspace });
  const cases = evidence.get("src/foo.ts:1:5:abcd1234");

  assert.equal(cases.length, 2);
  assert.deepEqual(cases[0].conditions, { C1: true, C2: true });
  assert.equal(cases[1].outcome, false);
});

test("filterChangedDecisions compares stable decision keys", () => {
  const base = [
    {
      stableKey: "src/foo.ts:typescript-control-flow:if:aaaa1111:bbbb2222:1",
    },
  ];
  const current = [
    {
      stableKey: "src/foo.ts:typescript-control-flow:if:aaaa1111:bbbb2222:1",
    },
    {
      stableKey: "src/foo.ts:typescript-control-flow:if:cccc3333:dddd4444:1",
    },
  ];

  assert.deepEqual(filterChangedDecisions(current, base), [current[1]]);
});

function namedCase(name, conditions, outcome) {
  return {
    conditions,
    evidenceFile: "fixture.spec.ts",
    name,
    outcome,
  };
}

function makeTempWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "clubs-mcdc-"));
}

function transformWithMcdc(sourceText) {
  const workspace = makeTempWorkspace();
  const sourcePath = path.join(workspace, "feature.ts");
  const previousSourcePaths = process.env.MCDC_SOURCE_PATHS;
  const previousRepoRoot = process.env.MCDC_REPO_ROOT;
  const transformerModule = require("./jest-transformer.cjs");
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  process.env.MCDC_SOURCE_PATHS = JSON.stringify([workspace]);
  process.env.MCDC_REPO_ROOT = workspace;

  try {
    const result = ts.transform(sourceFile, [
      transformerModule.factory({ configSet: { compilerModule: ts } }),
    ]);

    try {
      return ts.createPrinter().printFile(result.transformed[0]);
    } finally {
      result.dispose();
    }
  } finally {
    if (previousSourcePaths === undefined) {
      delete process.env.MCDC_SOURCE_PATHS;
    } else {
      process.env.MCDC_SOURCE_PATHS = previousSourcePaths;
    }

    if (previousRepoRoot === undefined) {
      delete process.env.MCDC_REPO_ROOT;
    } else {
      process.env.MCDC_REPO_ROOT = previousRepoRoot;
    }
  }
}

function setJestState(testFileName, currentTestName, workspace) {
  globalThis.expect = {
    getState: () => ({
      currentTestName,
      testPath: path.join(workspace, testFileName),
    }),
  };
}
