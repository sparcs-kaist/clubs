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

The file name must be `repository-boundary.ts`, and the v1 schema supports only
`ownedPrismaModels`.

Do not add exception fields such as `allowedExternalReads` or
`allowedExternalWrites`. If cross-boundary direct access becomes unavoidable,
expand this manifest through a separate architecture review instead of opening
an exception slot in advance.

## Guarded Rules

The guard fails when a changed production repository file:

- queries a Prisma delegate not listed in the nearest
  `repository-boundary.ts`;
- queries Prisma without a nearest `repository-boundary.ts`;
- traverses a Prisma relation through `include` or relation `select` when the
  relation target is outside `ownedPrismaModels`.

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
- owned Prisma models must not define Prisma relation fields whose target model
  is outside the same boundary;
- `ownedPrismaModels` must be a static string literal array;
- no v1 manifest fields other than `ownedPrismaModels` are allowed.

## Relation Policy

Use scalar foreign-key fields such as `clubId` for cross-boundary references.
Do not add Prisma relation fields that point outside the repository boundary. A
relation field creates an ORM navigation path, so the schema should not expose
that path when the target model is owned elsewhere.

This fails at manifest/schema validation time:

```prisma
model Activity {
  id     Int @id @default(autoincrement())
  clubId Int
  club   Club @relation(fields: [clubId], references: [id])
}
```

Keep only the scalar id when the target belongs to another boundary:

```prisma
model Activity {
  id     Int @id @default(autoincrement())
  clubId Int
}
```

Relation traversal is also guarded inside queries:

```ts
this.prisma.activity.findMany({
  include: {
    participants: true, // OK when activityParticipant is owned here
    club: true, // FAIL when club is owned by another repository
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
