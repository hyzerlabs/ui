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

| Import                                        | Description                                |
| --------------------------------------------- | ------------------------------------------ |
| `@hyzer-labs/ui`                              | All components                             |
| `@hyzer-labs/ui/tokens`                       | Token names & metadata (JS)                |
| `@hyzer-labs/ui/tokens.css`                   | CSS custom property tokens                 |
| `@hyzer-labs/ui/reset.css`                    | Structural CSS reset (optional)            |
| `@hyzer-labs/ui/icons`                        | SVG icon components                        |
| `@hyzer-labs/ui/utils`                        | Utility functions                          |
| `@hyzer-labs/ui/types`                        | Shared TypeScript types                    |
| `@hyzer-labs/ui/theme`                        | Reference theme (full CSS)                 |
| `@hyzer-labs/ui/theme/button.css`             | Individual per-component styles            |
| `@hyzer-labs/ui/theme/examples/ocean.css`     | Theme variant (token overrides)            |
| `@hyzer-labs/ui/theme/examples/docs/docs.css` | The docs site's own look (content starter) |

## Styling

The library ships in opt-in tiers — take as much or as little as you want:

1. **Headless (default).** Components ship structure, behavior, and a11y only.
   Style them yourself via the stable `hz-*` classes and `data-*` attributes
   (`data-variant`, `data-intent`, `data-size`, `data-state`).
2. **Reset.** `@hyzer-labs/ui/reset.css` is a structural adaptation of
   [Josh Comeau's reset](https://www.joshwcomeau.com/css/custom-css-reset/) —
   no colors or typefaces. Lives in the `hz-reset` cascade layer, below
   `hz-theme`, so everything else wins ties. Import it first.
3. **Tokens.** `@hyzer-labs/ui/tokens.css` defines the `--hz-*` custom
   properties (palette, semantic roles, type, spacing, radius, elevation,
   motion). Includes the `[data-theme="dark"]` role hook and the density
   spacing model (`--hz-density` grid unit → `--hz-space-near` /
   `--hz-space-away`, tightened per `data-density-shift` ancestor — adapted
   from [Complementary Space](https://blog.damato.design/posts/complementary-space/)).
4. **Reference theme.** `@hyzer-labs/ui/theme` is a complete, token-driven
   visual layer — or cherry-pick per-component files
   (`@hyzer-labs/ui/theme/button.css`).
5. **Example themes.** `theme/examples/ocean.css` restyles purely by
   overriding tokens; `theme/examples/terminal/terminal.css` is a standalone
   look that skips the reference theme entirely;
   `theme/examples/docs/docs.css` is a different kind of example — the docs
   site's own reading chrome, layered over the reference theme, adding no
   palette of its own. See `/theming/examples` for the full arc.

```svelte
<script>
	import '@hyzer-labs/ui/reset.css'; // 1. reset (optional)
	import '@hyzer-labs/ui/tokens.css'; // 2. tokens
	import '@hyzer-labs/ui/theme'; // 3. reference theme (optional)
	import '@hyzer-labs/ui/theme/examples/ocean.css'; // 4. example (optional)
</script>
```

### Overriding styles

Every component accepts a `class` prop, merged after its `hz-*` class. The
reference theme lives in the `hz-theme` cascade layer, so **any unlayered
consumer CSS wins** — a plain single-class selector is enough, no specificity
fights or `!important`:

```svelte
<Button class="cta">Ship it</Button>

<style>
	:global(.cta) {
		border-radius: 9999px; /* beats the theme */
	}
</style>
```

For theme-wide tweaks, override tokens instead — set `--hz-color-primary` on
`:root` (or any subtree) and every component follows. Dark mode: set
`data-theme="dark"` on any ancestor element.

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
