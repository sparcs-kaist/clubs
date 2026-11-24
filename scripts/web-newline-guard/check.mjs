import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const cssProperty = /^white-space(-collapse)?$/;
const jsProperty = /^whiteSpace(Collapse)?$/;
const preservedShorthands = new Set([
  "break-spaces",
  "inherit",
  "pre",
  "pre-line",
  "pre-wrap",
  "unset",
]);
const preservedCollapseValues = new Set([
  "break-spaces",
  "inherit",
  "preserve",
  "preserve-breaks",
  "unset",
]);

function withoutCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, comment =>
    comment.replace(/[^\n]/g, " "),
  );
}

export function hasNewlineDefault(css, layout) {
  return (
    /^\s*body\s*\{(?:[^{}]*;)?\s*white-space\s*:\s*pre-line\s*[;}]/m.test(
      withoutCssComments(css),
    ) &&
    /^import ["']@sparcs-clubs\/web\/styles\/globals\.css["'];?\s*$/m.test(
      layout,
    )
  );
}

export function findCollapsingDeclarations(file, source) {
  const declarations = [];
  const lines = source.split("\n");

  function record(property, rawValue, offset) {
    const value = rawValue
      .trim()
      .replace(/\s*!important$/i, "")
      .toLowerCase();
    const preservesNewlines = /collapse/i.test(property)
      ? preservedCollapseValues.has(value)
      : preservedShorthands.has(value) ||
        /^(?:(?:preserve(?:-breaks)?) (?:wrap|nowrap)|(?:wrap|nowrap) (?:preserve(?:-breaks)?))$/.test(
          value,
        );
    if (preservesNewlines) return;

    const line = source.slice(0, offset).split("\n").length;
    const previousLine = lines[line - 2] ?? "";
    const intentionalSingleLine =
      /^\s*(?:\/\/|\/\*)\s*web-newline: single-line --\s*(?!\*\/)\S/.test(
        previousLine,
      );
    if (!intentionalSingleLine) {
      declarations.push({
        line,
        property,
        value: rawValue.trim().replace(/\s+/g, " "),
      });
    }
  }

  function scanCss(css, offset = 0, interpolations = []) {
    let uncommented = withoutCssComments(css);
    for (const [start, end] of interpolations) {
      uncommented =
        uncommented.slice(0, start) +
        "x".repeat(end - start) +
        uncommented.slice(end);
    }
    const pattern =
      /(?:^|[;{}])\s*(white-space(?:-collapse)?)\s*:\s*([^;}]+)/dgim;
    for (const match of uncommented.matchAll(pattern)) {
      const [valueStart, valueEnd] = match.indices[2];
      record(
        match[1],
        withoutCssComments(css.slice(valueStart, valueEnd)),
        offset + match.indices[1][0],
      );
    }
  }

  if (/\.(css|scss)$/.test(file)) {
    scanCss(source);
    return declarations;
  }

  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const name = ts.isComputedPropertyName(node.name)
        ? node.name.expression
        : node.name;
      if (
        (ts.isIdentifier(name) || ts.isStringLiteral(name)) &&
        (cssProperty.test(name.text) || jsProperty.test(name.text))
      ) {
        const initializer = node.initializer;
        record(
          name.text,
          ts.isStringLiteralLike(initializer)
            ? initializer.text
            : initializer.getText(tree),
          name.getStart(tree),
        );
      }
    }
    if (
      ts.isShorthandPropertyAssignment(node) &&
      jsProperty.test(node.name.text)
    ) {
      record(node.name.text, node.name.text, node.getStart(tree));
    }
    if (ts.isTemplateExpression(node)) {
      const offset = node.getStart(tree) + 1;
      let literal = node.head;
      const interpolations = node.templateSpans.map(span => {
        const start = literal.end - 2 - offset;
        literal = span.literal;
        return [start, literal.getStart(tree) + 1 - offset];
      });
      scanCss(node.getText(tree).slice(1, -1), offset, interpolations);
    } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
      scanCss(node.getText(tree).slice(1, -1), node.getStart(tree) + 1);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return declarations;
}

export function findNewCollapsingDeclarations(file, before, after) {
  const existing = new Map();
  const key = ({ property, value }) => JSON.stringify([property, value]);
  for (const declaration of findCollapsingDeclarations(file, before)) {
    const fingerprint = key(declaration);
    existing.set(fingerprint, (existing.get(fingerprint) ?? 0) + 1);
  }
  return findCollapsingDeclarations(file, after).filter(declaration => {
    const fingerprint = key(declaration);
    const occurrences = existing.get(fingerprint) ?? 0;
    if (!occurrences) return true;
    existing.set(fingerprint, occurrences - 1);
    return false;
  });
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function check() {
  const base = git("merge-base", "origin/dev", "HEAD").trim();
  if (
    !hasNewlineDefault(
      git("show", "HEAD:packages/web/src/styles/globals.css"),
      git("show", "HEAD:packages/web/src/app/layout.tsx"),
    )
  ) {
    throw new Error(
      "Keep the body white-space: pre-line default in the imported globals.css.",
    );
  }

  const entries = git(
    "diff",
    "--name-status",
    "-z",
    "--no-renames",
    "--diff-filter=AMT",
    base,
    "HEAD",
    "--",
    "packages/web/src",
  ).split("\0");
  const violations = [];
  for (let index = 0; index + 1 < entries.length; index += 2) {
    const [status, file] = entries.slice(index, index + 2);
    if (
      !/\.(css|scss|[jt]sx?)$/.test(file) ||
      /\.(test|spec|stories)\./.test(file)
    ) {
      continue;
    }
    const before = status === "A" ? "" : git("show", `${base}:${file}`);
    const after = git("show", `HEAD:${file}`);
    for (const { line, property, value } of findNewCollapsingDeclarations(
      file,
      before,
      after,
    )) {
      violations.push(`${file}:${line} ${property}: ${value}`);
    }
  }
  if (violations.length) {
    console.error(violations.join("\n"));
    throw new Error(
      "Preserve line breaks with pre-line or pre-wrap. For intentionally single-line content, explain why using a web-newline: single-line comment.",
    );
  }
  console.log("Web newline guard passed against origin/dev.");
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    check();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
