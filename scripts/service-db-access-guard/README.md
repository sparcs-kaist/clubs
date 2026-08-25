# Service DB Access Guard

`service-db-access-guard:changed` prevents changed API service code from
accessing Prisma directly. Services must coordinate concrete repository command
methods instead.

The guard detects model operations and raw transaction/query calls through:

- injected `PrismaService` or `PrismaClient` properties;
- injected `TransactionHost.tx` properties;
- aliases, object destructuring, and static bracket access.

Only added or modified service call lines relative to `origin/dev` are checked,
so untouched brownfield access can be migrated separately.

```sh
pnpm service-db-access-guard:changed
pnpm test:service-db-access-guard
```
