# Contributing

Development notes for working on `@hyzer-labs/ui` itself. For using the
library, see the [README](./README.md) and [design.hyzer.sh](https://design.hyzer.sh).

## Requirements

- Node.js ≥ 22 (see `.nvmrc`)
- pnpm ≥ 10 (`corepack enable` sets it up from `package.json`)

## Commands

```sh
pnpm install          # install dependencies — do this first

pnpm dev              # start docs site dev server
pnpm build            # build docs site (static)
pnpm package          # build library → dist/
pnpm check            # svelte-check
pnpm lint             # prettier + eslint
pnpm format           # auto-format
pnpm test:unit        # vitest unit tests
pnpm test:e2e         # playwright e2e tests
pnpm test             # all tests
```

## Workflow

- Work happens on feature branches; `main` only advances by merging a PR
  after CI passes.
- Component work follows the spec in `specs/` — one numbered document per
  feature, kept current when behavior changes.

## Releases

1. On a release branch off `main`: move the `[Unreleased]` section of
   `CHANGELOG.md` under the new version, and run
   `pnpm version <major|minor|patch> --no-git-tag-version`.
2. PR, CI, merge.
3. Tag the merged commit (`git tag vX.Y.Z && git push origin vX.Y.Z`).
   The Publish workflow releases it to npm via trusted publishing and CI
   re-validates the package (publint) on the way out.
4. Create the GitHub release with the changelog section as notes.
