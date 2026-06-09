import assert from "node:assert/strict";
import test from "node:test";

import { ESLint } from "eslint";

import { baseConfig } from "./base.mjs";

test("base config explicitly requires dot notation for value property access", () => {
  assert.equal(readProjectDotNotationRule(), "error");
});

test("base config rejects string-literal bracket access without rejecting type indexed access", async () => {
  const badMessages = await lintApiSource(`
const repository = { create: () => 1 };
const value = repository["create"]();
export { value };
`);

  assert.ok(
    badMessages.some(message => message.ruleId === "dot-notation"),
    'expected dot-notation to report repository["create"]',
  );

  const goodMessages = await lintApiSource(`
interface IModel {
  name: string;
}

type Name = IModel["name"];
const value: Name = "name";
export { value };
`);

  assert.deepEqual(goodMessages, []);
});

function readProjectDotNotationRule() {
  const config = baseConfig.find(
    item => item.name === "global parameter settings for all packages",
  );
  const rule = config?.rules?.["dot-notation"];

  return Array.isArray(rule) ? rule[0] : rule;
}

async function lintApiSource(sourceText) {
  const eslint = new ESLint({
    overrideConfig: baseConfig,
    overrideConfigFile: true,
  });
  const [result] = await eslint.lintText(sourceText.trimStart(), {
    filePath: "packages/api/src/app.controller.ts",
  });

  return result.messages.map(({ ruleId, message }) => ({ ruleId, message }));
}
