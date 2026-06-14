# Web page allowlist guard

`web-page-allowlist:check` requires every
`packages/web/src/app/**/page.tsx` route to be classified in
`productionReadyPaths`.

The guard treats a route as classified when it is covered by one of:

- `exact`: the route itself is production-ready.
- `startsWith`: the route is production-ready because an owning prefix is open.
- `exclude`: the route intentionally remains unavailable in production.

`exclude` takes precedence in the runtime `isProductionReadyPath` helper in
`packages/web/src/common/components/PageContent.utils.ts`. A route in `exclude`
is not production-ready even when it also matches `exact` or `startsWith`.

When the guard fails:

1. Add production-ready routes to `exact`, or add an owning prefix to
   `startsWith` in `packages/web/src/constants/paths.ts`.
2. Add unfinished or intentionally hidden routes to `exclude` in
   `packages/web/src/constants/paths.ts`.
3. Re-run `pnpm web-page-allowlist:check`.

The `productionReadyPaths` constant is defined in
`packages/web/src/constants/paths.ts`.

Route groups such as `(admin)` and parallel route slots such as `@modal` are
ignored when calculating the URL path. Dynamic segments such as `[id]` are kept
in the reported route path so the list matches the app directory structure.
