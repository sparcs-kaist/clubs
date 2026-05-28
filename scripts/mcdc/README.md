# MC/DC Test Checker

This script inspects TypeScript or JavaScript source with the TypeScript AST,
lists decision expressions and their atomic conditions, then checks whether
test evidence satisfies unique-cause MC/DC.

## Usage

Run the static checker against explicit evidence:

```sh
pnpm mcdc --source packages/api/src --tests packages/api/src
```

Run Jest with runtime instrumentation:

```sh
pnpm mcdc:jest \
  --source packages/api/src/feature/activity/service/activity-duration.validator.ts \
  --test packages/api/src/feature/activity/service/activity-duration.validator.spec.ts \
  --fail-on-missing
```

Run only decisions added or changed since `origin/dev`:

```sh
pnpm mcdc:changed --fail-on-missing
```

Use runtime instrumentation for CI or pre-push gates. It records only decisions
that the Jest process actually executes.

## Changed-Only Policy

`mcdc:changed` compares decisions from the base ref and the current working tree.
The comparison key is stable across line moves:

- source path
- provider id and version
- decision kind
- normalized expression hash
- condition-list hash
- occurrence index for duplicate equivalent decisions

Only decisions missing from the base ref are enforced. This lets the detector
gain new capabilities without failing untouched legacy code. When a source
decision changes, the current active detector set applies to that decision.

## Runtime Evidence

`mcdc:jest` runs Jest with a `ts-jest` AST transformer. The transformer wraps
supported decision expressions and writes `.mcdc/runtime/*.json` during the test
run. The checker then compares the source decision list with the runtime
evidence.

Supported runtime decisions:

- `if`, `while`, `do while`, `for` conditions
- ternary conditions
- local boolean `const` initializers named like `is*`, `has*`, `can*`,
  `should*`, `needs*`, `requires*`, or `allows*`
- `.some`, `.every`, `.filter`, and `.find` predicate callbacks
- `ts-pattern` predicates written as `P.when(...)` or `Pattern.when(...)`

For now, runtime instrumentation only wraps decisions whose atomic conditions are
side-effect-safe property/identifier/literal/comparison expressions. Unsupported
decisions are left untouched instead of changing program behavior.

## Static Evidence

The static checker can also read `@mcdc` comments or JSON evidence. This mode is
useful for experiments and review notes, but it is not a strong CI gate because
it does not prove that Jest executed the documented cases.

```ts
/*
 * @mcdc
 * decision: packages/api/src/foo.ts:10:7:abcd1234
 * case: C1=true, C2=true => true
 * case: C1=false, C2=true => false
 */
```

JSON evidence can be supplied with `--evidence`.

```json
{
  "decisions": {
    "packages/api/src/foo.ts:10:7:abcd1234": [
      {
        "name": "happy path",
        "conditions": { "C1": true, "C2": true },
        "outcome": true
      }
    ]
  }
}
```

Each condition is covered when two cases differ only in that condition and the
decision outcome changes.
