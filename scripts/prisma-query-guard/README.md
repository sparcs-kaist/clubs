# Prisma Query Guard

`prisma-query-guard` prevents newly touched API production code from adding or editing Prisma raw SQL. It is intentionally line-based because this repo still has brownfield raw SQL debt: unchanged legacy raw SQL can remain while newly changed lines must move toward Prisma Client Query API.

## Usage

```sh
pnpm prisma-query:changed
```

By default, the script compares the current branch against `origin/dev`.

```sh
node scripts/prisma-query-guard/changed-raw-sql.mjs --changed-from origin/dev
```

The pre-push hook runs this guard before MC/DC validation.

## Scope

The default source scope is `packages/api/src`.

The guard checks production TypeScript files only:

- included: `packages/api/src/**/*.ts`
- excluded: `*.spec.ts`, `*.test.ts`
- excluded by omission: `packages/api/test/**`, `packages/api/legacy_source/**`

## Detected Raw SQL APIs

The detector uses the TypeScript AST and reports these APIs:

- `$queryRaw`
- `$queryRawUnsafe`
- `$executeRaw`
- `$executeRawUnsafe`
- `Prisma.sql`
- `Prisma.raw`
- `Prisma.join`
- `Prisma.empty`

## Change Detection

The script:

1. Resolves `git merge-base <changed-from> HEAD`.
2. Reads `git diff --unified=0 --no-color --diff-filter=ACMR <base> -- packages/api/src`.
3. Parses hunk headers and changed lines.
4. Parses the current file AST and records raw SQL node line ranges.
5. Fails when a raw SQL node overlaps an added or modified line.
6. For deletion-only hunks, parses the base file AST too. If the deleted old line was inside raw SQL and the current raw SQL node still surrounds the deletion touch point, it fails.

This means deleting a whole raw SQL block in favor of Prisma Query API passes, but editing a raw SQL block while leaving it in place fails.

## Pass And Fail Examples

Pass: a file has existing raw SQL, but only a different non-raw line changed.

Pass: raw SQL is fully removed and replaced with `prisma.club.findMany(...)`.

Fail: new `$queryRaw(...)` or `Prisma.sql` is added.

Fail: a SQL line is deleted from inside an existing `Prisma.sql` template, but the template still remains.

## Policy

There is no allowlist or inline disable comment on purpose. If raw SQL becomes necessary later, add the policy first with a clear reason and tests.
