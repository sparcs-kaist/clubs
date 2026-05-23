"use strict";

const fs = require("node:fs");
const path = require("node:path");

let installed = false;
const evidence = new Map();

function install() {
  if (installed) {
    return;
  }

  installed = true;

  globalThis.__MCDC_EVALUATE__ = evaluateDecision;

  const write = () => {
    writeEvidence();
  };

  if (typeof afterAll === "function") {
    afterAll(write);
  }

  process.once("exit", write);
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
  const filePath = path.join(evidenceDir, `evidence-${process.pid}.json`);

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
}

module.exports = {
  install,
};
