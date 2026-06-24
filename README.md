# @hyzer-labs/ui

A headless, accessible Svelte 5 component library. Ships behavior, structure,
and accessibility — not visual opinions.

## Requirements

- Node.js ≥ 22 (see `.nvmrc`)
- pnpm ≥ 10

## Installation

```sh
# Run pnpm install before any other command
pnpm install

pnpm add @hyzer-labs/ui
```

## Usage

```svelte
<script>
	import { Button } from '@hyzer-labs/ui';
	import '@hyzer-labs/ui/tokens.css'; // optional design tokens
	import '@hyzer-labs/ui/theme'; // optional reference theme
</script>

<Button>Click me</Button>
```

### Subpath imports

| Import                            | Description                   |
| --------------------------------- | ----------------------------- |
| `@hyzer-labs/ui`                  | All components                |
| `@hyzer-labs/ui/tokens`           | Token names & metadata (JS)   |
| `@hyzer-labs/ui/tokens.css`       | CSS custom property tokens    |
| `@hyzer-labs/ui/icons`            | SVG icon components           |
| `@hyzer-labs/ui/utils`            | Utility functions             |
| `@hyzer-labs/ui/types`            | Shared TypeScript types       |
| `@hyzer-labs/ui/theme`            | Reference theme (full CSS)    |
| `@hyzer-labs/ui/theme/button.css` | Per-component theme overrides |

## Development

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

## Docs

Live at [design.hyzer.sh](https://design.hyzer.sh)

## License

MIT — see [LICENSE](./LICENSE)
