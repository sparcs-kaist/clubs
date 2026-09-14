import { createTranslator } from "next-intl";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { it } from "node:test";

// Use the ICU parser already installed by next-intl, including apostrophe rules.
const require = createRequire(import.meta.url);
const intlRequire = createRequire(require.resolve("next-intl"));
const { IntlMessageFormat } = createRequire(
  intlRequire.resolve("use-intl/core"),
)("intl-messageformat");

type MessageNode = {
  type: number;
  value?: string;
  children?: MessageNode[];
  options?: Record<string, { value: MessageNode[] }>;
};

const flatten = (
  messages: Record<string, unknown>,
  prefix = "",
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = `${prefix}${key}`;
      if (typeof value === "string") return [[path, value]];
      assert.ok(value && typeof value === "object" && !Array.isArray(value));
      return Object.entries(
        flatten(value as Record<string, unknown>, `${path}.`),
      );
    }),
  );

const inspectMessage = (message: string, locale: string) => {
  const signature = new Set<string>();
  const values: Record<
    string,
    string | number | Date | ((chunks: string) => string)
  > = {};
  const visit = (nodes: MessageNode[]) => {
    nodes.forEach(node => {
      // Literal text and plural '#' do not declare an argument.
      if (node.type !== 0 && node.type !== 7 && node.value) {
        signature.add(`${node.type === 8 ? "tag" : "argument"}:${node.value}`);
        if (node.type === 8) values[node.value] = chunks => chunks;
        else if (node.type === 2 || node.type === 6) values[node.value] = 2;
        else if (node.type === 3 || node.type === 4)
          values[node.value] = new Date("2026-09-15T00:00:00Z");
        else values[node.value] = "example";
      }
      if (node.children) visit(node.children);
      Object.values(node.options ?? {}).forEach(option => visit(option.value));
    });
  };
  visit(new IntlMessageFormat(message, locale).getAst());
  return { signature: [...signature].sort(), values };
};

it("keeps My Page translations complete, compatible, and renderable in both languages", () => {
  ["common", "my", "agree"].forEach(namespace => {
    const load = (locale: string) =>
      JSON.parse(
        readFileSync(
          new URL(`./messages/${locale}/${namespace}.json`, import.meta.url),
          "utf8",
        ),
      );
    const messages = { ko: load("ko"), en: load("en") };
    const flat = { ko: flatten(messages.ko), en: flatten(messages.en) };
    assert.deepEqual(Object.keys(flat.ko).sort(), Object.keys(flat.en).sort());

    Object.keys(flat.ko).forEach(key => {
      const label = `${namespace}.${key}`;
      assert.doesNotMatch(flat.en[key], /\p{Script=Hangul}/u, label);
      const ko = inspectMessage(flat.ko[key], "ko");
      const en = inspectMessage(flat.en[key], "en");
      assert.deepEqual(ko.signature, en.signature, `${label}: ICU arguments`);
      (["ko", "en"] as const).forEach(locale => {
        const t = createTranslator({
          locale,
          messages: messages[locale],
          timeZone: "Asia/Seoul",
          onError: error => {
            throw new Error(`${locale}.${label}: ${error.message}`);
          },
        });
        const rendered = t.markup(key, locale === "ko" ? ko.values : en.values);
        assert.doesNotMatch(
          rendered,
          /\{[a-zA-Z][\w]*\}/,
          `${locale}.${label}`,
        );
      });
    });
  });
});
