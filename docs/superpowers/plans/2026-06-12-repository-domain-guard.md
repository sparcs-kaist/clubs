# Repository Domain Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a changed-line guard that prevents repositories from querying Prisma models outside their declared repository boundary.

**Architecture:** Each feature repository folder owns a static `repository-boundary.ts` manifest with only `ownedPrismaModels`. The guard parses Prisma schema models and relation fields, parses manifests, validates manifest uniqueness, model existence, and schema relation boundaries, then scans changed API production repository files for Prisma delegate calls and relation traversal.

**Tech Stack:** Node.js `node:test`, TypeScript Compiler API, Prisma schema text parser, existing git diff guard pattern.

---

### Task 1: RED Tests For Boundary Manifests And Delegate Access

**Files:**
- Create: `scripts/repository-domain-guard/changed-repository-domain-guard.test.mjs`
- Create: `scripts/repository-domain-guard/changed-repository-domain-guard.mjs`

- [ ] Write tests that fail because the guard module does not exist yet:
  - own delegate access passes
  - undeclared delegate access fails
  - missing boundary fails when a changed repository uses Prisma
  - declared model not in Prisma schema fails
  - duplicate `ownedPrismaModels` fails

- [ ] Run `node --test scripts/repository-domain-guard/*.test.mjs` and verify it fails with module-not-found.

### Task 2: GREEN Implementation For Manifest And Delegate Access

**Files:**
- Implement: `scripts/repository-domain-guard/changed-repository-domain-guard.mjs`

- [ ] Parse changed files using the existing `git diff --unified=0` pattern.
- [ ] Parse `repository-boundary.ts` files with TypeScript AST and accept only:

```ts
export const repositoryBoundary = {
  ownedPrismaModels: ["modelDelegateName"],
} as const;
```

- [ ] Validate `ownedPrismaModels` values exist in `schema.prisma`.
- [ ] Validate every owned model delegate is declared by only one boundary.
- [ ] Detect Prisma delegate calls through `this.prisma`, `this.txHost.tx`, `prisma`, and `tx`.
- [ ] Fail when the model delegate is not in the nearest repository boundary.
- [ ] Run the tests and verify they pass.

### Task 3: RED/GREEN Tests For Relation Boundary Traversal

**Files:**
- Modify: `scripts/repository-domain-guard/changed-repository-domain-guard.test.mjs`
- Modify: `scripts/repository-domain-guard/changed-repository-domain-guard.mjs`

- [ ] Add failing tests for:
  - boundary-internal `include` passes
  - owned model schema relation to a boundary-external model fails
  - scalar `select` passes
  - boundary-external relation `select` fails via schema relation validation
  - nested owned model schema relation to a boundary-external model fails

- [ ] Parse Prisma schema relation fields into `modelDelegate -> field -> targetDelegate`.
- [ ] Validate every relation field on an owned model targets a model in the same boundary; use scalar ids such as `clubId` instead of cross-boundary Prisma relation fields.
- [ ] Recursively inspect `include` and relation `select` object literals on Prisma calls.
- [ ] Fail only when the relation target delegate is outside the current boundary.

### Task 4: CLI, README, Package Scripts, Pre-Push

**Files:**
- Create: `scripts/repository-domain-guard/README.md`
- Modify: `package.json`
- Modify: `.husky/pre-push`

- [ ] Add `repository-domain-guard:changed` and `test:repository-domain-guard` scripts.
- [ ] Add the guard to `.husky/pre-push` near the other API repository guards.
- [ ] Document manifest shape, uniqueness, schema existence, changed-line behavior, and the no-exception-field policy.
- [ ] Document that cross-boundary relation fields must be omitted from Prisma schema when scalar IDs are enough, and that the guard also blocks query traversal across boundary relations.

### Task 5: Verification

**Files:**
- All changed files

- [ ] Run `pnpm test:repository-domain-guard`.
- [ ] Run `pnpm repository-domain-guard:changed`.
- [ ] Run related existing guard tests that may share assumptions: `pnpm test:soft-delete-guard`, `pnpm test:prisma-query-guard`, `pnpm test:transaction-guard`.
- [ ] Run `git status --short --branch` and summarize changes.
