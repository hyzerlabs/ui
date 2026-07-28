# Theming Spec — theme folder restructure, Theming docs section, quickstart

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Depends on specs/29** (the
> token engine — example sheets and docs pages consume it). Write scope:
> `src/lib/theme/**`, `src/docs/**`, `src/routes/**`, `package.json` only if
> a test proves an exports gap, plus spec amendments listed here.

### Goal

Restructure `src/lib/theme/` so the tiers read from the folder itself —
structural sheets vs. optional example overrides — and add the long-deferred
**Theming** docs section teaching the override story end to end (tokens →
config/CLI → component styling), capped by a Getting Started quickstart
reflecting the three-tier consumer contract. User-approved 2026-07-15.

### Context & Conventions

- Folder layout (user-approved; `components/` chosen over `base/` to avoid
  colliding with `base.css`):

  ```
  src/lib/theme/
    reset.css        structural reset (@layer hz-reset) — optional
    base.css         document defaults, focus ring, .sr-only
    theme.css        aggregator: base.css + components/*
    components/      the ~25 structural per-component sheets
    examples/        ocean.css, sunset.css — generated example override sheets
  ```

- Node exports-map `*` patterns match across `/`, so the existing
  `"./theme/*.css"` already resolves nested paths — **no package.json
  change expected**; R6 proves it. Cherry-pick paths change
  (`theme/button.css` → `theme/components/button.css`): a breaking change,
  acceptable — the library is greenfield with no external consumers yet.
- Docs conventions per the established per-page pattern (Example blocks,
  `$derived` code strings, tab-notes, shared docs.css classes). Clarity is
  accessibility: pages stay short, recipe-first.
- The docs e2e invariant — `--hz-color-primary` unchanged on dark toggle —
  must hold: **example sheets are never imported globally by the docs
  app**. Demos use selector-scoped generation (specs/29 R4).

### Requirements

1. **R1 — Move structural sheets.** The per-component css files move to
   `theme/components/`; `reset.css`, `base.css`, `theme.css` stay at the
   top level. `theme.css` `@import` paths update; its header comment's
   cherry-pick example becomes `@hyzer-labs/ui/theme/components/button.css`.
   All internal imports (docs layout, any tests) update. No rule content
   changes in this move.
2. **R2 — Examples are engine output.** `ocean.css` and `sunset.css` move
   to `theme/examples/` and become **generated** (specs/29 overrides mode,
   `:root` selector) from checked-in configs `theme/examples/ocean.config.ts`
   / `sunset.config.ts` (`defineConfig`, including their `dark` blocks —
   ocean's dark brand-accent brightening is a consumer-prerogative example
   and stays). `pnpm gen:tokens` regenerates them alongside `tokens.css`;
   the drift test covers all three. Visual parity: the generated sheets
   must define the same custom properties with the same values as today's
   hand-authored ones (comment prose may change).
3. **R3 — Theming docs section.** New manifest section **Theming** after
   Components, four pages:
   - `/theming/overview` — the opt-in tiers (headless → tokens → reference
     theme → your overrides); the `@layer hz-reset, hz-theme` story and why
     unlayered consumer CSS always wins; when to reach for which tier.
   - `/theming/tokens` — the two-layer color model recap and override
     recipes: plain-CSS custom-property overrides (palette, roles, intents,
     dark block, density unit), then the config/CLI tier (`hyzer.config.ts`,
     `hyzer generate`, full vs. overrides mode, the contrast report and
     `--strict`); "verify your palette" cross-links to
     `/foundation/contrast#api-heading`. Code samples in Example/CodeBlock
     style with real config snippets.
   - `/theming/components` — styling the components themselves: stable
     `hz-*` classes, `data-*` hooks, the `class` prop (merged after the
     root class), `:where()` single-specificity guarantee, and the
     unlayered-component-styles gotcha. **Absorbs the deferred theme-docs
     backlog**: the Card treatment classes and `.hz-card-title` convention
     land here; the backlog note is then retired.
   - `/theming/examples` — **amended by specs/46 (2026-07-23):** now Ocean
     and Terminal (Sunset retired), demonstrated **scoped** (each sheet
     regenerated at build/demo time with `selector: '.theme-ocean'` etc., or
     the committed sheet shown as code while a scoped twin drives the live
     demo); each demo shows its `*.config.ts` source alongside the generated
     CSS — the configs are the teaching material for tier 3. A third,
     differently-shaped section, docs (specs/46), shows the docs site's own
     hand-authored, unscoped example sheet instead.
4. **R4 — Getting Started quickstart.** New top-level page
   `/getting-started`, listed in the manifest directly after Introduction.
   Content: install; tier 1 (import `tokens.css` + `theme`, use
   components — "everything just works"); tier 2 (override `--hz-*` in your
   own CSS); tier 3 (optional: `hyzer.config.ts` + a package.json
   `"generate": "hyzer generate"` script, import your generated sheet
   instead of ours). The Introduction page links to it; philosophy content
   stays on Introduction (per the established split).
5. **R5 — Cross-link pass.** `/foundation/contrast`'s "Check your own
   palette" section links to `/theming/tokens` for the config/CLI workflow;
   `/foundation/colors` dark-overrides prose links to `/theming/tokens`.
6. **R6 — Exports still resolve.** A test asserts
   `@hyzer-labs/ui/theme/components/button.css` and
   `@hyzer-labs/ui/theme/examples/ocean.css` resolve through the existing
   exports map from the packed output (`pnpm package` + resolution check);
   `./theme` (theme.css) and `./reset.css` unchanged.
7. **R7 — Spec bookkeeping.** Dated amendment notes in specs/15 (variant
   sheets now engine-generated examples) and specs/16 (new Theming section +
   Getting Started in the IA; manifest table updated). Historical specs
   naming old `theme/x.css` paths are **not** rewritten.

### Accessibility

- New docs pages follow the shell's landmark/heading structure; all code
  samples in CodeBlock (copy button, `aria-live` feedback).
- The examples page states that example palettes were AA-checked with the
  same gate (`contrastReport`), and demonstrates the report output — the
  teaching moment for tier-3 accessibility.
- The dark-toggle e2e invariant (structural: no global example imports)
  is itself an accessibility guarantee — the site's own contrast posture
  can't be silently altered by a demo.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| Consumer still imports `@hyzer-labs/ui/theme/button.css` (old path) | Resolution fails loudly at build (path gone). Breaking change, greenfield; the Theming overview documents current paths. |
| Docs client-side nav after visiting the examples page | No `:root`-level example styles leak to other pages (scoped selectors only for Ocean + Terminal; the docs example, specs/46, is the sole deliberate exception — it ships unscoped and globally, by design). |
| Example config drifts from committed example css | Drift test fails CI (R2). |
| `theme.css` import order after move | Layer pin (`@layer hz-reset, hz-theme;`) stays first; alphabetical component imports preserved. |
| Prerender crawl of the four new routes + `/getting-started` | All statically prerendered, reachable from the sidebar by keyboard (specs/16 R4). |

### Existing Code to Reuse

- specs/29 engine (`resolveConfig`, `generateCss` overrides mode +
  `selector`) — examples and demos must not hand-roll CSS generation.
- `src/docs/manifest.ts` — one entry per new page; nav/prerender/parity
  derive from it (specs/16 R1).
- Docs scaffolding: DocPage is for components — these are foundation-style
  prose pages (Stack + sections) with Example/CodeBlock where live demos
  fit; shared `docs.css` classes, no re-declaration.
- `src/lib/theme/theme.css` header comment — keep its usage narrative, only
  paths change.

### Test Plan

**Unit (server):** manifest contains the five new routes; example-config
drift test (R2); import-resolution test for moved paths (R6).

**e2e (Playwright):** each new page renders its `h1` and is reachable from
the sidebar; dark-toggle invariant stays green on `/theming/examples`;
prerender crawl passes (build).

**Visual sanity:** ocean/sunset demos render scoped (assert a token value
inside the scoped wrapper differs from the page root).

### Out of Scope

- The per-component "extend with your own styles" example gallery (user:
  discuss-only for now) — `/theming/examples` v1 is ocean + sunset (Sunset
  retired by specs/46, 2026-07-23; the page is now Ocean + Terminal + docs).
- An interactive theme-builder page (future; engine makes it possible).
- Search bar, MCP server (separate roadmap items).
- Any component or reference-theme rule changes.

### Amendments

- **2026-07-23 (specs/42 — palette namespace split):** the ocean/sunset/
  terminal example configs move their raw hues (`primary, secondary, …`)
  from `tokens.color` into **`tokens.palette`**, keeping `surface, text,
  textMuted, border` in `tokens.color`; their `dark:` blocks split the same
  way into `dark.palette` (hue brightening) and `dark.color` (role flips).
  `terminal.config.ts`'s `phosphor` intent extension re-points at
  `var(--hz-palette-primary)` (was `var(--hz-color-primary)`); the
  `/theming/tokens` override recipes (plain-CSS and the config sample) use
  `--hz-palette-*` / `tokens.palette` / `dark.palette` for hue overrides and
  gain a doctrine callout on overriding any tier in
  `[data-theme='dark']`, including the palette. This spec's `tokens.color`
  hue examples describe the pre-split shape and are superseded — specs/42 is
  the authority.

### Amendment — `dark` moved under `themes` (specs/52, 2026-07-28)

The top-level `dark:` config key is **gone**. Dark is now one entry in a
`themes: { … }` map, selected the way every named theme is —
`data-theme="<name>"` — so `config.dark.palette` is written
`config.themes.dark.palette`. `ResolvedConfig.dark` survives as a distinguished
field (the `prefers-color-scheme` default block and the mode-aware soft tints
are keyed to dark specifically), and `ResolvedConfig.themes` carries the rest.

Two emission changes came with it, both required for a theme to work on a
`<section>` rather than only on `<html>`: every theme block re-declares the
derived var() chain (the `scopedClosure()` problem, applied to blocks instead
of sheets), and the generator emits a `[data-theme='light']` block so a light
region inside a dark page has something to switch back to. specs/52 is the
authority for the current theme shape.
