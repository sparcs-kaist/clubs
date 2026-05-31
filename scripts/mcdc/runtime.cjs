"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

let exitHandlerInstalled = false;
let flushCount = 0;
const evidence = new Map();

function install() {
  globalThis.__MCDC_EVALUATE__ = evaluateDecision;

  const write = () => {
    writeEvidence();
  };

  if (typeof afterAll === "function") {
    afterAll(write);
  }

  if (!exitHandlerInstalled) {
    exitHandlerInstalled = true;
    process.once("exit", write);
  }
}

function evaluateDecision(metadata, conditionThunks, combine) {
  const values = conditionThunks.map(thunk => Boolean(thunk()));
  const outcome = Boolean(combine(...values));
  const conditions = Object.fromEntries(
    values.map((value, index) => [`C${index + 1}`, value]),
  );
  const decisionKey = metadata.stableKey ?? metadata.id;
  const cases = evidence.get(decisionKey) ?? [];

  cases.push({
    name: currentTestName(),
    testPath: currentTestPath(),
    conditions,
    outcome,
    metadata,
  });
  evidence.set(decisionKey, cases);

  return outcome;
}

function currentTestName() {
  const state = globalThis.expect?.getState?.();

  return state?.currentTestName || "unknown test";
}

function currentTestPath() {
  const state = globalThis.expect?.getState?.();

  return state?.testPath || null;
}

function writeEvidence() {
  const evidenceDir = process.env.MCDC_EVIDENCE_DIR;

  if (!evidenceDir || evidence.size === 0) {
    return;
  }

  fs.mkdirSync(evidenceDir, { recursive: true });

  const decisions = Object.fromEntries(
    Array.from(evidence.entries()).map(([decisionId, cases]) => [
      decisionId,
      cases.map(testCase => ({
        name: testCase.name,
        testPath: testCase.testPath,
        conditions: testCase.conditions,
        outcome: testCase.outcome,
      })),
    ]),
  );
  const metadata = Object.fromEntries(
    Array.from(evidence.entries()).map(([decisionId, cases]) => [
      decisionId,
      cases[0]?.metadata,
    ]),
  );
  const filePath = path.join(evidenceDir, createEvidenceFileName());

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        decisions,
        metadata,
      },
      null,
      2,
    ),
  );

  evidence.clear();
}

function createEvidenceFileName() {
  const testPath = firstEvidenceTestPath() ?? currentTestPath() ?? "process";
  const hash = crypto
    .createHash("sha1")
    .update(testPath)
    .digest("hex")
    .slice(0, 8);
  const workerId = process.env.JEST_WORKER_ID ?? "main";
  const suiteName = path
    .basename(testPath)
    .replace(/[^A-Za-z0-9_.-]+/gu, "_")
    .slice(0, 80);
  const sequence = flushCount;

  flushCount += 1;

  return `evidence-${process.pid}-${workerId}-${suiteName || "unknown"}-${hash}-${sequence}.json`;
}

function firstEvidenceTestPath() {
  for (const cases of evidence.values()) {
    const testPath = cases[0]?.testPath;

    if (testPath) {
      return testPath;
    }
  }

  return null;
}

module.exports = {
  flush: writeEvidence,
  install,
};
