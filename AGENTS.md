# Working on @hyzer-labs/ui

Conventions for developing **this library**. If you are looking for the rules
for _consuming_ it in another project, that is a different file — see
`/docs/agents` on the docs site, or `https://design.hyzer.sh/agents.md`.

## Layout

- `src/lib/` — the published package. Nothing here may import from SvelteKit
  (`$app/*`, `@sveltejs/kit`); the library works in plain Svelte, and the docs
  say so.
- `src/docs/` — docs-site machinery: the nav manifest, per-component data,
  shared page components. Not published.
- `src/routes/` — the docs site itself. `/` is a marketing landing page with no
  docs shell; everything else lives under `/docs`.
- `specs/` — numbered builder contracts. `specs/40-findings.md` is the running
  audit log.

## Generated files — never hand-edit

Regenerate these; a hand edit is silently overwritten and skips the checks the
generator runs.

| File                                     | Owner                                              |
| ---------------------------------------- | -------------------------------------------------- |
| `src/lib/tokens/tokens.css`              | `pnpm gen:tokens` (from `src/lib/tokens/index.ts`) |
| `src/lib/theme/examples/*/**.tokens.css` | `pnpm gen:tokens`                                  |
| `src/lib/theme/utilities.css`            | `pnpm gen:tokens`                                  |
| `src/lib/icons/generated/`               | `pnpm gen:icons`                                   |

Drift tests compare the committed bytes to the generator's output, so an edit
here fails CI rather than shipping.

## Single sources of truth

Several things are deliberately derived rather than repeated. Adding a second
copy is the most common way to break them.

- **`src/docs/manifest.ts`** drives the sidebar, the e2e route sweep, each
  page's heading and lead line, and `llms.txt`. A page's `description` is
  required and must be plain text.
- **`src/docs/agentRules.ts`** drives both the `/docs/agents` page and the
  `AGENTS.md` served at `/agents.md`.
- **`src/lib/tokens/index.ts`** drives `tokens.css`, the contrast report, and
  the docs' token tables.
- **`src/docs/data/*.ts`** drives the component prop tables; `src/docs/hooks.ts`
  drives the theme-hook tables. Both are coverage-tested against the manifest
  and against component source.

## Styling rules

- Component CSS resolves through `--hz-color-*` (structural roles) and
  `--hz-intent-*` (meaning). Never read `--hz-palette-*` outside the token
  source.
- Component `<style>` blocks are **unlayered**, so they beat every
  `@layer hz-theme` rule. Never put a reset in a component the theme has to
  override later; UA-default resets belong in the theme sheet beside the rule
  that redraws them.
- Themes are named entries under `themes` in the config. `dark` is one of them.
  `data-theme` works on any element, not just `<html>`.

## Before you claim it works

Run the full gate after any token or API change. It routinely catches
regressions that look unrelated.

```sh
pnpm exec svelte-check          # types
pnpm exec vitest run            # unit
pnpm exec eslint .              # lint
pnpm exec prettier --check .    # format
pnpm exec vite build            # build
pnpm exec playwright test       # e2e (see below)
```

E2e needs a preview server you start yourself, and it must be restarted after a
rebuild or it serves the previous build:

```sh
lsof -ti:4173 | xargs kill -9
pnpm exec vite preview --port 4173 &
```

## Hazards worth knowing

- **Demo links are fiction.** Pattern and component pages feed `Nav`, `Footer`
  and `Breadcrumbs` with invented hrefs (`/about`, `/rss.xml`, `#`). A blanket
  find-and-replace across route paths corrupts them, and no test catches it —
  the route sweep only visits real routes.
- **Code fences must match their live demo.** Where a page shows source beside
  a rendered result, they are a promise. If the demo needs a `<style>` block or
  a prop, the fence shows it.
- **Docs are consumer-facing.** No spec numbers, no `Rn` references, no
  internal process language in anything a reader sees.
- **`pnpm` is not on `PATH` here.** Use `corepack pnpm …`.

## Process

Non-trivial work is spec-first: a numbered spec in `specs/`, reviewed before
building. Commit only what was asked for, and do not push unless told.
