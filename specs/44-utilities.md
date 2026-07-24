# 44 — Utilities (`/foundation/utilities` + opt-in generated utility sheet)

> Builder contract. Reviewer verifies each `Rn` and edge case as pass/fail. Depends on the token engine (specs/29), theming (specs/30), and the palette split (specs/42). Lands in the 0.1.0 breaking window (greenfield; the docs site is the only dogfooder). Write scope: `src/lib/config/**` (new emit function), `src/lib/theme/utilities.css` (generated), `scripts/gen-tokens.ts`, `package.json` (`./utilities.css` export + the CLI `--utilities` flag / `config.utilities` key), `src/routes/foundation/utilities/**`, `src/docs/manifest.ts`, cross-link edits in `src/routes/theming/**`, the docs dogfood import in `src/routes/+layout.svelte`, and the listed test files.

### Goal

Ship an opt-in, engine-generated `utilities.css` — a tightly-scoped set of token-derived utility classes (text-color roles/intents + logical-property margin helpers), imported explicitly like a theme sheet, zero runtime cost to non-importers — plus a `/foundation/utilities` docs page that documents that sheet, the always-shipping `.sr-only` utility, and the opt-in component convention classes (`.hz-card-title`, `.hz-banner-title`).

### Context & Doctrine

- **Definition (state verbatim on the page and in the sheet header).** A utility class is a **token-derived, single-property helper** — one class, one declaration, resolved from a design token. That is the whole definition; it does not depend on where the class is or is not used. This framing is deliberate: the docs site's own chrome is being promoted to a shipped example theme (specs/46), so utilities are defined by what they *are*, never by contrast against "the docs site's private classes."
- **Anti-goal (state verbatim too).** Utilities are for **ad-hoc spots** — nudging one element, tinting one line of text — **not an alternative layout system.** Components already own their spacing (gap/padding props, the `data-padding`/`data-gap` scales) and the density system (`--hz-space-near`/`--hz-space-away`). The utility sheet deliberately does **not** reproduce that surface: it exposes the **fixed** `--hz-space-*` scale for margins only, never the density near/away distances, and no padding helpers at all (padding is owned by components).
- **Palette doctrine (specs/42 point 6).** Utility classes resolve through **role (`--hz-color-*`) and intent (`--hz-intent-*`) tokens and the fixed space scale (`--hz-space-*`) only — never palette (`--hz-palette-*`).** This is grep-enforced (R6 below).
- **Three families of "utility-ish" class, kept distinct on the page:**
  1. **Generated token utilities** — the opt-in `utilities.css` sheet (this spec's new artifact).
  2. **The always-on `.sr-only`** — ships in `theme/base.css`, unlayered; components already emit `class="sr-only"`. Currently documented nowhere; this page fixes that.
  3. **Opt-in component convention classes** — `.hz-card-title`, `.hz-banner-title` (and the treatment classes `.hz-card--outlined`/`--elevated`, `.hz-table--striped`) that ship inside their component theme sheets and are catalogued in `src/docs/hooks.ts`.

### Requirements

**R1 — The generated sheet (`src/lib/theme/utilities.css`).** A new engine emit function `generateUtilitiesCss(resolved: ResolvedConfig, options?: { intro?: string[] })`, exported from `./config`, renders a deterministic utility sheet from the resolved token model. All classes are **unlayered, single-class specificity (0,1,0), no `!important`** — mirroring `.sr-only`, so a deliberately-applied utility beats the layered reference theme, while a consumer's own unlayered class of equal specificity still wins by source order. The header comment carries the generated-file banner, the utility definition, and the anti-goal paragraph. Output is deterministic (same resolved config → same bytes), in the fixed order: text role helpers, intent text helpers, margin families.

**R2 — Text-color utilities (derived from the `color` and `intent` exports).**
- `.hz-text` → `color: var(--hz-color-text)` — resets inherited color back to the base text role (e.g. inside a tinted region).
- `.hz-text-muted` → `color: var(--hz-color-text-muted)`.
- `.hz-text-<intent>` for every entry in `intent` (base: `neutral, primary, secondary, danger, warning, success, info`) → `color: var(--hz-intent-<intent>)`. A consumer config that **adds** an intent gets its `.hz-text-*` class generated automatically.
- No background, border, or fill utilities — explicitly out of scope (see Out of Scope). The two role helpers are fixed; the intent helpers derive from the intent group.

**R3 — Margin utilities (logical properties, derived 1:1 from the fixed `space` export).** For every rung of `--hz-space-*` (base: `none, xs, sm, md, lg, xl`), referencing the token var so consumer space overrides flow through (`margin: var(--hz-space-md)`), the **full logical edge set — seven families per rung** so any single direction can be targeted:
- `.hz-m-<rung>` → `margin`
- `.hz-m-block-<rung>` → `margin-block`
- `.hz-m-block-start-<rung>` → `margin-block-start`
- `.hz-m-block-end-<rung>` → `margin-block-end`
- `.hz-m-inline-<rung>` → `margin-inline`
- `.hz-m-inline-start-<rung>` → `margin-inline-start`
- `.hz-m-inline-end-<rung>` → `margin-inline-end`

Names are **logical, not physical** (no `mt`/`mb`/`ml`/`mr`), keeping faith with the library's logical-property doctrine and staying RTL-correct — the single-direction edges (`block-start`, `block-end`, `inline-start`, `inline-end`) are how a consumer nudges one side without a physical, RTL-breaking name. A consumer config that **adds** a space rung gets all seven margin families generated automatically. No padding utilities (the anti-goal holds — padding is owned by components).

**R4 — Generation wiring.** `scripts/gen-tokens.ts` adds `src/lib/theme/utilities.css` to its `sheets` array (`generateUtilitiesCss(resolveConfig())`), so `pnpm gen:tokens` regenerates it alongside `tokens.css` and the example sheets. A drift test asserts the committed file equals fresh engine output byte-for-byte. For **consumers**, `hyzer generate` emits a utilities sheet **only when opted in** — via a `--utilities` CLI flag or a `config.utilities` key (both accepted; the flag overrides the config key when present). Absent the opt-in, no utilities file is written: the sheet's whole value proposition is that non-users pay nothing, so a consumer must never get a surprise second file. When opted in, the consumer utilities sheet is written next to their tokens sheet (default filename `hyzer-utilities.css`, or the `config.utilities.output` / equivalent path).

**R5 — Packaging.** `package.json` gains `"./utilities.css": "./dist/theme/utilities.css"`, mirroring `./tokens.css` and `./reset.css`. `pnpm package` + `publint` stay green; the packed path resolves.

**R6 — Palette-doctrine enforcement.** `utilities.css` lives under `src/lib/theme/`, so the specs/42 R3.1 acceptance grep (`palette-namespace.spec.ts`) scans it by default. It is **deliberately NOT added** to that test's `generatedSheets` exclusion set: unlike `tokens.css`/example sheets (which are the palette *source* layer), `utilities.css` references only roles, intents, and the space scale, so leaving it in scope actively enforces "utilities never touch palette." The specs/42 R6 stale-name grep also stays green (no `--hz-color-<hue>` names).

**R7 — AA posture: no new gate.** Every `.hz-text-<intent>` maps to a pairing the existing `contrastReport` already grades — `text:intent-<x>/surface` and `text:intent-<x>/surface-muted`, both modes (`report.ts`, textTokens loop). The sheet introduces **no new pairings**, so no `contrastReport` change is required. The page must state the boundary explicitly: intent text colors are AA-verified **on the two surface roles only** — on any other background, contrast is the consumer's responsibility.

**R8 — The docs page (`/foundation/utilities`).** New manifest leaf appended to Foundation **after CSS Reset** (last position). Foundation-style prose page (Stack + `.doc-section` sections, `data-density-shift`, `gap="away"`), tables derived from token metadata exactly as the Typography/Colors pages derive from their exports (`?raw` import of `utilities.css` for the source display; `intent`/`color`/`space` exports for the class tables). Sections:
1. **The opt-in sheet** — the import line (`import '@hyzer-labs/ui/utilities.css';`), what it is (engine output, zero cost to non-importers, regenerated for consumer configs with extended intents/space), and generated class tables for the text and margin families.
2. **Always available: `.sr-only`** — documents the visually-hidden utility that ships in the reference theme's `base.css` (not the opt-in sheet); notes that Button/Link/Checkbox/RadioGroup/Toggle/Field already emit `class="sr-only"`.
3. **Opt-in component classes** — `.hz-card-title` and `.hz-banner-title`, with cross-links to `/components/card`, `/components/banner`, and `/theming/components`; distinguishes them (they ship inside component theme sheets, catalogued in the hooks tables) from the generated utility sheet.

**R9 — Cross-references.** `/theming/components` gains one sentence at its opt-in-classes section: _"The generated utility sheet and the full catalog of opt-in classes — including `.hz-card-title` and `.hz-banner-title` — are documented on [Foundation → Utilities](/foundation/utilities)."_ `/theming/overview` gains one sentence in its tiers rundown: _"An optional [utilities sheet](/foundation/utilities) adds token-derived text-color and margin helpers for ad-hoc spots — imported like the theme, and free if you don't."_

**R10 — Docs dogfood (content only).** The docs app imports `utilities.css` globally in `src/routes/+layout.svelte` (after `theme.css`, before `docs.css`), so the sheet ships as a real consumer would import it. Usage is **content only**: page and demo content may apply utility classes; the docs **shell** (sidebar/header/footer) stays on `docs.css` and does not depend on the opt-in sheet. The dark-toggle e2e invariant and no-overflow suites stay green.

### Responsive Behavior

The page is a static prose/table page. Mobile (<640px): token/class tables scroll horizontally inside `.token-table-wrapper` (existing pattern); no column hides. Tablet/desktop: tables render full-width. The utility classes themselves are viewport-agnostic (single-property declarations); nothing reflows or changes interaction by breakpoint.

### Accessibility

- Page follows the shell landmark/heading structure: one `<h1>`, section `<h2>`s with `aria-labelledby`, skip-link first (covered by the manifest-driven e2e suite).
- Source displayed in `CodeBlock` (copy button, `aria-live` feedback).
- The `.sr-only` section explains the utility's a11y purpose (visually-hidden but screen-reader-available).
- The intent-text section states the AA boundary from R7 verbatim, so a reader never assumes intent colors are safe on arbitrary backgrounds.
- Reduced motion: page has no animation; nothing to guard.

### Edge Cases & Error States

| Case | Expected |
|---|---|
| Consumer adds an intent (`intent: { brand: … }`) | `.hz-text-brand` generated automatically from the resolved intent section. |
| Consumer adds a space rung (`space: { xxl: … }`) | All seven `.hz-m*-xxl` families generated automatically. |
| Consumer intent literally named `muted` | Kebab-collision with the fixed `.hz-text-muted` role helper: hard error at generation (mirrors the engine's existing kebab-collision rule), naming both. |
| Consumer overrides `--hz-space-md` | Margin utilities reference the token var, so the override flows through with no regeneration needed. |
| `utilities.css` hand-edited | Drift test fails CI (R4). |
| `--hz-palette-*` appears in `utilities.css` | R6 grep fails CI. |
| Utility applied over a non-surface background | No engine guard possible; the page documents the AA boundary (R7). |
| `hyzer generate` without the utilities opt-in | No utilities file written (R4). |
| Consumer never imports the sheet | Zero bytes shipped, zero runtime cost — the design guarantee. |

### Existing Code to Reuse

- `src/lib/config/generate.ts` — add `generateUtilitiesCss` beside `generateCss`; reuse `ResolvedConfig.sections` (roles/intent/space), the `banner`/`note` helpers, and the `withIntro` header weaving. Do **not** re-resolve tokens.
- `src/lib/config/index.ts` — export the new function from the `./config` barrel.
- `scripts/gen-tokens.ts` — extend the `sheets` array; no structural change.
- `src/lib/theme/base.css` — the `.sr-only` source the page documents (`?raw`), unchanged.
- `src/lib/theme/components/card.css` / `banner.css` — the `.hz-card-title` / `.hz-banner-title` conventions the page cross-links; `src/docs/hooks.ts` Card/Banner entries already describe them (no hooks change).
- `src/routes/foundation/typography/+page.svelte` — the page scaffold to mirror (metadata-derived tables, `.doc-section` density pattern, `?raw` source display).
- `src/docs/manifest.ts` — one Foundation leaf; nav/prerender/e2e derive from it.
- `src/routes/docs.e2e.ts` — manifest-driven; picks up the new route with no edit.

### Test Plan

**Engine (server, `src/lib/config/config.spec.ts`, Vitest):**
- `generateUtilitiesCss` emits `.hz-text`, `.hz-text-muted`, one `.hz-text-<intent>` per base intent, and the **seven** margin families per space rung; declarations reference role/intent/space vars (assert no `--hz-palette-`, no `!important`, unlayered).
- Class-count math: base output is `2` role text helpers + `7` intent text helpers + `7 families × 6 space rungs = 42` margin classes.
- Consumer-added intent → new `.hz-text-*`; consumer-added space rung → seven new margin families.
- Kebab-collision (`intent: { muted }`) throws naming both.
- **Drift:** committed `src/lib/theme/utilities.css` equals `generateUtilitiesCss(resolveConfig())` byte-for-byte.

**CLI (server, tmp-dir fixtures, `src/lib/cli/main.spec.ts`):** `hyzer generate` writes no utilities file by default; with `--utilities` (and with `config.utilities`) it writes the consumer utilities sheet next to the tokens sheet, equal to `generateUtilitiesCss(resolveConfig(config))`; the flag overrides the config key.

**Packaging (`src/lib/exports.spec.ts`):** `./utilities.css` present in the exports map and in the "required subpath keys" assertion; the dist file resolves/exists.

**Palette doctrine (`src/lib/tokens/palette-namespace.spec.ts`):** confirm `utilities.css` is scanned (not excluded) and yields zero `--hz-palette-*`; R6 stale-name grep stays green.

**AA (`src/lib/config/report.spec.ts` or the examples AA rig):** assert every `.hz-text-<intent>` corresponds to a passing `contrastReport` pairing id on both surfaces — a cross-check tying the utility to the existing gate; no new pairings added.

**e2e (Playwright, manifest-driven `docs.e2e.ts`):** `/foundation/utilities` loads with one `<h1>`, skip-link first, no horizontal overflow at all three viewports; prerender crawl green. Kill port 4173 before serving.

**Hooks/data specs:** no change expected — utilities is not a component and adds no `hooks.ts`/data entry; `hooks.spec.ts`/`data.spec.ts` stay green unmodified. (Reviewer confirms no new hook rows.)

### Out of Scope

- Background, border, fill, display, flex, padding, or width/height utilities — text color + margin only. Tinted surfaces belong to Badge/Alert/Banner; layout belongs to the layout components and density system.
- Density near/away distances as utilities (the density system owns them).
- A Vite plugin, watch mode, or a JS/TS mirror of the utility class list.
- Changes to `.sr-only`, `.hz-card-title`, `.hz-banner-title`, or any component/theme rule values.
- The docs-site-theme example promotion (specs/46) — referenced here only as context for the utility definition.
- hyzer.sh / external consumer migration.
