# 46 — Docs theme as a shipped example (retire Sunset)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Depends on** the token engine
> (specs/29), theming (specs/30), the theme-examples arc (specs/32), and the
> palette split (specs/42). Lands in the 0.1.0 breaking window (greenfield; the
> docs site is the only dogfooder). Write scope:
> `src/lib/theme/examples/docs/**` (new shipped sheet),
> `src/lib/theme/examples/sunset/**` (deleted),
> `src/routes/+layout.svelte`, `src/docs/docs.css` (deleted),
> `src/routes/theming/examples/+page.svelte`, `scripts/gen-tokens.ts`,
> `src/lib/theme/examples/examples.spec.ts`, `src/lib/exports.spec.ts`,
> `src/lib/tokens/palette-namespace.spec.ts`, `src/docs/consumerSource.spec.ts`,
> `README.md`, the spec amendments listed here, and the listed test files.

### Goal

Retire the Sunset example theme and ship the docs site's own reading look — the
`docs.css` scaffold rhythm, the `.docs-table` flat-table override, the in-prose
code-chip treatment, and the content focus-visible ring — as a new, importable
example theme of a **different shape** from Ocean/Sunset/Terminal: a
hand-authored "content starter" that adds zero palette, rides the reference
theme, and is dogfooded by making the docs site import the shipped sheet rather
than keep a private copy. User-decided 2026-07-22, confirmed 2026-07-23.

### Context & Doctrine

- The existing arc (specs/32) grades **palette/hook freedom**: Ocean (tokens
  only, `:root`, runtime re-scoped on the docs page) → Sunset (layered class
  hooks over the reference theme, `.hz-theme-sunset`) → Terminal (standalone, no
  theme import, `.hz-theme-terminal`, adds `phosphor`/`amber` intents). All
  three are engine-generated token sheets from a checked-in `*.config.ts`, gated
  by drift + AA in `examples.spec.ts`.
- The docs look is a **different axis entirely**: it adds no palette (it uses the
  reference theme's roles as-is), so it is not a config→tokens example. It is a
  hand-authored sheet of named scaffold classes + one worked component-hook
  override (`.docs-table`) + prose chrome (`p code`/`li code` chips) + the
  content focus-visible ring. It belongs **beside** the arc, framed as a
  different kind of example, not as a fourth freedom tier on it.
- Post-palette-split doctrine (specs/42): everything here resolves through
  **role (`--hz-color-*`) and intent (`--hz-intent-*`) tokens only, never
  palette (`--hz-palette-*`)** — already true of the docs chrome, and grep-
  enforced here.
- Not to be confused with specs/44 utilities (opt-in generated single-property
  helpers). This example is prose/scaffold classes, hand-authored, no generator.
  Kept disjoint by construction.

### Requirements

**R1 — The shipped sheet.** New `src/lib/theme/examples/docs/docs.css`, a
hand-authored (not engine-generated) example theme, display name **"Docs — the
look this site runs on"**, id `docs`. It holds exactly the **content/reading**
half of today's docs chrome:

- the page-rhythm scaffold from `src/docs/docs.css` (`.doc-intro h1`,
  `.doc-description`, `.doc-section h2`, `.a11y-refs`);
- the demo scaffolding (`.tab-content`, `.inner-tab`, `.tab-note`, `.demo-col`);
- the `.docs-table` flat-table theme-override block (the worked cascade example —
  unlayered rules beating `@layer hz-theme` with no `!important`);
- the in-prose code-chip treatment (`p code`/`li code` + its
  `[data-theme='dark']` strengthening), lifted verbatim from `+layout.svelte`'s
  `<style>`;
- the **content focus-visible ring** —
  `*:focus-visible:not(:is(.hz-field input, .hz-field select, .hz-field textarea, .hz-button))`
  → `outline: 2px solid currentColor; outline-offset: 2px` — also lifted verbatim
  from `+layout.svelte`. Its exclusion list references library classes
  (`.hz-field` inputs, `.hz-button`) so field controls and buttons keep the
  reference theme's soft focus ring instead; **these exclusions are part of the
  shipped look** — a library example is the correct home for rules that know the
  library's own class names, and the header comment says so.

It ships **unscoped** (opt-in class names + the prose-context chip rule + the
`*:focus-visible` ring) — no `.hz-theme-docs` root — because it never restyles a
bare component hook (`.hz-button`), only adds named scaffold classes, an opt-in
`.docs-table` wrapper, and broad content-chrome rules the docs site wants applied
globally. The header comment states: what it is (the look this site runs on), the
import line, that it layers over the reference theme (import order: tokens →
theme → docs example), that the broad rules (`p code`/`li code`, `*:focus-visible`)
are intentional content chrome, and that `.sr-only` and app-level resets are NOT
part of this sheet (they live in `theme/base.css` and the app shell respectively).

**R2 — Role/intent tokens only.** Every declaration references `--hz-color-*`,
`--hz-intent-*`, `--hz-font-*`, `--hz-radius-*`, `--hz-line-height-*`,
`--hz-space-*`, or `currentColor` — never `--hz-palette-*`. Enforced by leaving
the sheet **in scope** for `palette-namespace.spec.ts` (do not add it to
`generatedSheets`).

**R3 — Fallbacks promise the base palette.** Because the docs example adds no
config and no palette override, every `var(--hz-*, <fallback>)` in the sheet must
match the **library base** resolved value (it rides the reference theme). It is
therefore covered by the base fallback-parity suite
(`tokens/fallback-parity.spec.ts`), not the per-config examples fallback suite in
`examples.spec.ts` (which grades against a config's own resolved values — the
docs example has none). This is the one example whose fallbacks are the
library's, and that is correct.

**R4 — The import inversion (kills drift by construction).** The docs site
becomes the literal dogfooder: `src/routes/+layout.svelte` imports the shipped
`$lib/theme/examples/docs/docs.css` instead of `../docs/docs.css`, and the
code-chip **and** content focus-visible rules move out of its `<style>` into the
shipped sheet. The private `src/docs/docs.css` is **deleted** — there is exactly
one copy, so there is nothing to drift from and no sync gate is needed. A guard
test asserts the layout imports the shipped example and that `src/docs/docs.css`
no longer exists.

**R5 — Sunset is deleted, ripple resolved.** Every reference below is removed or
repointed:

- `src/lib/theme/examples/sunset/**` — entire directory (config,
  `sunset.tokens.css`, `sunset.css`,
  `components/{base,button,badge,alert,card,field,toggle,tabs,accordion}.css`).
- `examples.spec.ts` — remove sunset from the `examples` array (drift / AA /
  roots-at-selector) and from the `components/`-dir fallback `describe.each`;
  drop the `sunsetConfig`/`sunsetIntro` imports.
- `scripts/gen-tokens.ts` — remove the `sunset.tokens.css` sheet entry and
  `sunsetConfig` import. The docs example adds **no** gen-tokens entry
  (hand-authored). `pnpm gen:tokens` then writes four sheets: `tokens.css`,
  `ocean.css`, `terminal/terminal.tokens.css`.
- `src/lib/tokens/palette-namespace.spec.ts` — remove the two sunset entries (the
  `generatedSheets` exclusion line and the config-source list line).
- `src/docs/consumerSource.spec.ts` — remove `sunset/sunset.config.ts` from the
  rewrite fixture list.
- `src/lib/exports.spec.ts` — remove the three `theme/examples/sunset/*`
  wildcard-reach pins; add a `theme/examples/docs/docs.css` reachability pin.
- `src/routes/theming/examples/+page.svelte` — see R6.
- `README.md` (lines ~46, 68–69) — drop the stale `sunset.css` row and the
  "ocean.css / sunset.css" prose (already pre-specs/32 stale); repoint to the
  docs example.
- Historical spec prose (`specs/29`, `specs/15`, `specs/16`, `specs/41`,
  `specs/42`) is **left as-is** (append-only history). The Lightbox "Hole 7 at
  sunset" strings are demo alt text, unrelated — left as-is.

**R6 — `/theming/examples` restructure.** The palette-freedom arc collapses to
its two poles, **Ocean (tokens only)** and **Terminal (standalone)**, and gains a
distinct third section for the docs starter framed as *a different kind of
example* — not a point on the freedom axis. In that section:

- The **layered-cascade lesson** that Sunset carried moves here intact, taught by
  the `.docs-table` override: the reference theme paints `.hz-table` from
  `@layer hz-theme`, these unlayered rules win on every property they set — no
  `!important`, no specificity games. A Demo / source view shows the shipped
  `docs.css` via `?raw`.
- The comparison table drops the Sunset column; the "Reference theme: layered
  over" idea survives as the docs section's own framing prose (not a table row of
  the two-pole arc).
- The **per-instance `.cta` lesson** survives on Ocean + Terminal; the
  `.hz-theme-sunset .hz-button.cta` block and its prose mention are removed.
- All prose referencing "three themes" / "Sunset" / "if you only read one, read
  Terminal's" is retuned (Terminal remains the standalone hero; the
  intents / `phosphor` / `amber` section is untouched).
- The existing `Example` model, `CodeBlock`, `?raw` import pattern, and
  `consumerSource` rewrite are reused; the `consumerSource` no-internal-specifier
  assertion still passes on the retuned page.

**R7 — No new AA engine gate.** The only new pairing is body text over the
code-chip tint (`color-mix(--hz-intent-neutral 14%/28%, transparent)` on surface)
— a bounded, subtle tint. Matching specs/44 R7's posture, no `contrastReport`
change is required; the shipped-sheet header notes the boundary (chip contrast
holds on the surface roles; other backgrounds are the consumer's responsibility).

**R8 — Spec + manifest housekeeping.** Append a short amendment to
`specs/32-theme-examples.md` recording Sunset's retirement and this replacement;
amend the `/theming/examples` mentions in `specs/30-theming.md` (lines 78, 120,
152) to read Ocean + Terminal + docs. The examples-page manifest label
(`Example Themes`, `/theming/examples`) is unchanged. Add a findings/amendment
note per the repo's convention.

### Responsive Behavior

The shipped sheet carries no media queries and introduces no breakpoint behavior
of its own; `.demo-col` (max-width 24rem) is a fixed cap, not responsive. All
responsive layout stays in the app shell (`+layout.svelte`), which is out of
scope. **Reviewer check:** after the inversion, the docs site renders
byte-identically at mobile (<640px), tablet (640–1024px), and desktop (>1024px)
— the move is a relocation, not a restyle.

### Accessibility

- The **content focus-visible ring ships in the example** (R1) with its exclusion
  list intact: `*:focus-visible` draws a `2px currentColor` outline at
  `outline-offset: 2px`, except on `.hz-field` inputs/selects/textareas and
  `.hz-button`, which keep the reference theme's own soft focus ring. Those
  exclusions are load-bearing — without them the broad ring would draw an offset
  box across field/button borders. Because the ring is now part of the shipped
  look, a consumer importing the docs example gets consistent keyboard focus
  visibility on content elements out of the box, and library controls keep their
  themed ring.
- The code-chip rules keep their `[data-theme='dark']` strengthening
  (14%→28% tint) so chips stay visible in dark mode — the reason the rule pair
  exists.
- The **app shell keeps only app-level concerns**: the global resets/guards
  (box-sizing, body margin, media `max-width`), the `prefers-reduced-motion`
  `*` collapse, and layout. `.sr-only` already ships in `theme/base.css`; neither
  the shipped docs example nor the shell should duplicate it (remove the shell's
  redundant copy if present, but do not add it to the example).
- No dynamic content, no new ARIA surface — this is a stylesheet relocation plus
  the focus-ring/ chip move.

### Edge Cases & Error States

- **Consumer importing the docs example without the reference theme.** The
  scaffold classes degrade to base structure; the `.docs-table` override has no
  `.hz-table` to override; the `*:focus-visible` ring still applies (it depends
  on no theme). Header comment states the example layers over the reference theme
  (import order: tokens → theme → docs example).
- **Broad `p code`/`li code` and `*:focus-visible` selectors in a shipped sheet.**
  Importing globally restyles every prose code element and every focus-visible
  content element — the intended "docs look," documented as the intentional broad
  rules. They do not hijack un-classed component internals (the ring excludes
  fields and buttons; chips are scoped to prose context).
- **Dark mode.** Chip tint strengthening travels with the sheet; the ring uses
  `currentColor`; no hardcoded colors — role/intent tokens only (R2).
- **Deletion completeness.** Any missed sunset import breaks the build; the
  ripple list (R5) is the Reviewer's checklist. `pnpm gen:tokens` must succeed
  writing only the four sheets — sunset gone.

### Existing Code to Reuse

- `src/docs/docs.css` — the source of the scaffold classes to relocate (then
  delete).
- `src/routes/+layout.svelte` `<style>` — the `p code`/`li code` + dark chip
  rules AND the `*:focus-visible:not(...)` ring to lift into the shipped sheet;
  leave the shell layout, global guards, reduced-motion collapse, and any
  `.sr-only` cleanup.
- `src/lib/theme/examples/terminal/terminal.css` — the header-comment shape
  (what / why / usage / coverage) to mirror for the docs sheet.
- `src/lib/theme/examples/examples.spec.ts`, `scripts/gen-tokens.ts`,
  `src/lib/exports.spec.ts`, `src/lib/tokens/palette-namespace.spec.ts`,
  `src/docs/consumerSource.spec.ts` — the files whose sunset entries are removed.
- `src/routes/theming/examples/+page.svelte` — restructured per R6; reuse its
  existing `Example` model, `CodeBlock`, `?raw` import pattern, and
  `consumerSource`.

### Test Plan

Runner: **Vitest** (unit/integration), **Playwright** (e2e) — both already in
the repo.

- **R2 (palette doctrine) — unit:** `palette-namespace.spec.ts` scans
  `docs/docs.css` and finds no `--hz-palette-*` reference (no exclusion added).
- **R3 (fallback parity) — unit:** base `tokens/fallback-parity.spec.ts` covers
  the docs sheet; every `var(--hz-*, fallback)` equals the base resolved value.
- **R4 (inversion guard) — unit:** a test asserts `+layout.svelte` imports
  `$lib/theme/examples/docs/docs.css` and that `src/docs/docs.css` does not
  exist.
- **R1/R4 (focus ring travels) — e2e (Playwright):** on a docs page after the
  inversion, tab to a **content link** and assert the `2px currentColor` outline
  at `outline-offset: 2px` is applied; tab to a **`.hz-button`** and a
  **`.hz-field` input** and assert they do **not** get the offset ring (they keep
  the themed ring). This is the load-bearing proof that lifting the ring out of
  the shell into the shipped example left keyboard focus visibility unchanged.
- **R5 (deletion) — unit/build:** `examples.spec.ts` iterates only ocean +
  terminal; `pnpm gen:tokens` writes four sheets; `consumerSource.spec.ts` /
  `palette-namespace.spec.ts` fixtures no longer list sunset; no source file
  imports a sunset path (build/grep).
- **R5/R8 (exports) — unit:** `exports.spec.ts` pins
  `theme/examples/docs/docs.css` reachable via the `./theme/*.css` wildcard;
  sunset pins removed.
- **R6 (docs page) — unit/component:** the page renders with two arc themes
  (ocean + terminal) plus the docs section; no `.hz-theme-sunset` selector
  remains; the `.cta` lesson renders for ocean + terminal; the `consumerSource`
  no-internal-specifier assertion still passes.
- **Whole suite:** full Vitest + `svelte-check` green; `publint` / `pnpm package`
  resolve the new packed path.

### Out of Scope

- The app shell in `+layout.svelte` (sidebar, topbar, backdrop, nav skinning,
  `.docs-main`, `.docs-toc-rail`, footer, mobile drawer, global guards,
  reduced-motion collapse) — app layout/reset, not a theme; stays put.
- `.sr-only` — ships in `theme/base.css`; not part of this example.
- Any palette/token change (the docs look adds none).
- The specs/44 utilities sheet (separate artifact).
- Restyling component hooks the way Sunset did (Button/Badge/Alert/etc.) — the
  docs example teaches the layered cascade via `.docs-table` only; the
  full-component layered demo is retired with Sunset (accepted decision).
- Renaming the `/theming/examples` route or manifest label.
- Static demo-media (`static/media/`) plan — unrelated.
