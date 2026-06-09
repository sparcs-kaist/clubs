# Soft Delete Guard

`soft-delete-guard` prevents newly touched API production code from querying
soft-delete models without an explicit deleted-row intent.

The guard reads `packages/api/prisma/schema.prisma` and treats every model with a
`deletedAt` field as a soft-delete model.

## Usage

```sh
pnpm soft-delete-guard:changed
```

By default, the script compares the current branch against `origin/dev`.

## Scope

The default source scope is `packages/api/src`.

The guard checks production TypeScript files only:

- included: `packages/api/src/**/*.ts`
- excluded: `*.spec.ts`, `*.test.ts`

## Policy

Reads and writes against soft-delete models must explicitly choose one of these
intents:

- active rows: `where: activeOnly({ id })`
- deleted rows: `where: onlyDeleted({ id })`
- active and deleted rows: `where: withDeleted({ id })`
- inline condition: `where: { id, deletedAt: null }`

The guard fails when changed lines touch:

- `findMany`, `findFirst`, `count`, `groupBy`, or `aggregate` without explicit
  soft-delete intent
- `update`, `updateMany`, or `upsert` without explicit soft-delete intent
- `findUnique` or `findUniqueOrThrow` without explicit include-deleted intent
- `delete` or `deleteMany` on a soft-delete model

Untouched legacy omissions are allowed so existing code can be migrated
incrementally.
