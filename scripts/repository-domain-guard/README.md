# Repository Domain Guard

`repository-domain-guard:changed` prevents newly touched API code from crossing
feature repository boundaries. Repository files cannot query Prisma models
outside their declared boundary.

## Boundary Manifest

Each repository folder that directly queries Prisma must declare a static
boundary file:

```ts
export const repositoryBoundary = {
  ownedPrismaModels: ["activity", "activityParticipant"],
} as const;
```

The file name must be `repository-boundary.ts`. `ownedPrismaModels` is required;
`exportedPrismaModels` and `importedPrismaModels` are optional.
Imports describe schema relationships only. They never grant permission to query
another domain's models. Cross-domain application work must call the owning
module's exported PublicService, rather than importing its repository provider.

## Guarded Rules

The guard fails when a changed production repository file:

- queries a Prisma delegate not listed in the nearest
  `repository-boundary.ts`;
- queries Prisma without a nearest `repository-boundary.ts`;
- traverses a Prisma relation whose target is outside `ownedPrismaModels`,
  including `include`, `select`, `where`, `orderBy`, `_count`, and nested writes
  in `data`, `create`, or `update` (including `upsert`).

Delegate access is checked through direct property access, bracket access,
simple Prisma client aliases, and destructured delegates:

```ts
this.prisma.club.findMany();
this.prisma["club"].findMany();

const client = this.prisma;
client.club.findMany();

const { club } = this.prisma;
club.findMany();
```

The guard also validates all boundary manifests:

- every `ownedPrismaModels` entry must exist as a Prisma model delegate;
- a Prisma model delegate can be owned by only one boundary;
- every exported model must be owned by the exporting boundary;
- imports must name an existing manifest that both owns and exports each model;
- an import cannot re-export another owner's model or import the same model twice;
- every schema relation target must be owned or explicitly imported;
- model lists and import paths must be static string literals;
- extra manifest fields, duplicate entries, and dynamic/spread definitions fail.

## Relation Policy

Keep existing Prisma relations and database foreign keys. An external relation
requires an explicit export from its owner and an import in its source boundary:

```ts
// packages/api/src/feature/club/repository/repository-boundary.ts
export const repositoryBoundary = {
  ownedPrismaModels: ["club"],
  exportedPrismaModels: ["club"],
} as const;

// packages/api/src/feature/activity/repository/repository-boundary.ts
export const repositoryBoundary = {
  ownedPrismaModels: ["activity"],
  importedPrismaModels: [{
    from: "packages/api/src/feature/club/repository/repository-boundary.ts",
    models: ["club"],
  }],
} as const;
```

`from` is a repository-root-relative path, not a runtime TypeScript import.
Metadata cycles are allowed because Prisma relations can be bidirectional.
Every imported owner's own relations are also validated; declaring a domain can
therefore require registering the related domain boundaries. Schema-only domains
need only this metadata, not new runtime modules or repository implementations.

Relation traversal is also guarded inside queries:

```ts
this.prisma.activity.findMany({
  include: {
    participants: true, // OK when activityParticipant is owned here
    club: true, // FAIL even when club is explicitly imported
  },
});
```

Scalar `select` remains allowed:

```ts
this.prisma.activity.findFirst({
  select: {
    id: true,
    clubId: true,
  },
});
```

Relation `select` follows the same boundary rule as `include`.
Relation filters and nested writes follow that rule too; for example,
`where: { club: { is: { id } } }` and `data: { club: { connect: { id } } }` fail
when `club` is external. Scalar foreign keys such as `clubId` remain allowed.

## Usage

```sh
pnpm repository-domain-guard:changed
```

By default, the script compares the current branch against `origin/dev`.

```sh
node scripts/repository-domain-guard/changed-repository-domain-guard.mjs \
  --changed-from origin/dev
```

The pre-push hook runs this guard with the other changed-line repository
validators.

## Scope

The guard checks production TypeScript files under `packages/api/src` only.
Prisma delegate checks apply to changed repository files:

- files inside `/repository/`;
- files inside `/repository-old/`;
- files ending in `.repository.ts`.

Excluded files:

- `*.spec.ts`;
- `*.test.ts`;
- files outside `packages/api/src`.

Untouched brownfield repository calls can remain. Once a line inside a Prisma
query is changed, the query must respect the nearest repository boundary.
