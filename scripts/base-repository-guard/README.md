# BaseRepository guard

`base-repository-guard:changed` blocks new or touched usages of inherited
`BaseRepository` write APIs in `packages/api/src` production TypeScript files.

The guard blocks:

- service methods that call `create`, `put`, `patch`, or `delete` on an
  injected repository whose class extends `BaseRepository`,
  `BaseSingleTableRepository`, or `BaseMultiTableRepository`, unless that
  repository class implements the same-named method itself.
- service methods that call repository methods such as `createTx` when those
  methods wrap `this.create`, `this.put`, `this.patch`, `this.delete`, or the
  same methods through `super`.
- service methods that call the same forbidden APIs through simple const
  aliases, such as `const repository = this.noticeRepository`.
- service methods that call or extract forbidden APIs through bracket access,
  such as `this.noticeRepository["create"]` or
  `const create = this.noticeRepository.create`.
- service methods that destructure forbidden APIs from repositories, such as
  `const { create } = this.noticeRepository`.
- wrapper methods inherited from parent repository classes.
- repository methods in `BaseRepository` subclasses that call
  `this.create`, `this.put`, `this.patch`, `this.delete`, bracket-access
  variants such as `this["patch"]`, or the same methods through `super`.

The guard allows:

- untouched brownfield BaseRepository calls.
- domain-specific repository command methods such as `createNotice`.
- same-named methods on repositories that do not extend BaseRepository.
- same-named methods explicitly implemented by the repository class, as long as
  they do not wrap the inherited BaseRepository write API.

Use an explicit Prisma command method backed by `TransactionHost.tx` instead of
calling the inherited BaseRepository write API.
