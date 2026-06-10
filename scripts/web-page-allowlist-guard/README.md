# Web page allowlist guard

`web-page-allowlist:check` requires every
`packages/web/src/app/**/page.tsx` route to be classified in
`productionReadyPaths`.

The guard treats a route as classified when it is covered by one of:

- `exact`: the route itself is production-ready.
- `startsWith`: the route is production-ready because an owning prefix is open.
- `exclude`: the route intentionally remains unavailable in production.

When the guard fails:

1. Add production-ready routes to `exact`, or add an owning prefix to
   `startsWith`.
2. Add unfinished or intentionally hidden routes to `exclude`.
3. Re-run `pnpm web-page-allowlist:check`.

Route groups such as `(admin)` and parallel route slots such as `@modal` are
ignored when calculating the URL path. Dynamic segments such as `[id]` are kept
in the reported route path so the list matches the app directory structure.
