# Design Tokens Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope for the Builder is
> `src/lib/tokens/**` plus a one-line default change in
> `src/lib/components/Image.svelte` (R2).

### Goal

Replace the placeholder token files with a real, intentionally small token
system — color, a six-step type scale, spacing, sizing, radius, border, elevation,
z-index, and motion — that backs every `--hz-*` custom property the components
already reference, and is structured as a two-layer color model so a
`[data-theme="dark"]` override is trivial.

### Context & Conventions

- **Write scope:** `src/lib/tokens/tokens.css`, `src/lib/tokens/index.ts`, and a
  single default-value change in `src/lib/components/Image.svelte` (R2). No other
  component, theme, or route changes.
- Tokens ship as CSS custom properties under the `--hz` prefix on `:root` in
  `tokens.css`; `index.ts` exposes the same values as typed, readonly JS metadata
  and keeps the existing `prefix` export.
- `tokens.css` is already exported as `./tokens.css` and `index.ts` as `./tokens`
  in `package.json` — **no manifest change**. `pnpm package` + `publint` stay green.
- Values that back existing component fallbacks **must equal those fallbacks** so
  importing `tokens.css` causes zero visual change (R1). The spacing/width scales
  are authoritative in `specs/03-layout.md` "Shared Scales" and the fallbacks
  already encoded in `Stack`/`Container`/`Grid`/`Split`.
- The palette values below are a deliberate first pass — the team will iterate on
  exact hues. Implement them verbatim; do not tune.

### Token System

**Two-layer color model.** Layer 1 is a fixed **palette** of single-value colors
(no per-color ramps). Layer 2 is a small set of **semantic role** tokens that
reference the palette via `var()`. A single `[data-theme="dark"]` block overrides
**only the role layer** — the one documented place a future dark theme plugs in.

**Layer 1 — Palette (single value each, no ramps):**

| Token | Value |
| --- | --- |
| `--hz-color-primary` | `#2563eb` |
| `--hz-color-secondary` | `#7c3aed` |
| `--hz-color-success` | `#16a34a` |
| `--hz-color-warning` | `#d97706` |
| `--hz-color-danger` | `#dc2626` |
| `--hz-color-info` | `#0891b2` |
| `--hz-color-black` | `#000000` |
| `--hz-color-white` | `#ffffff` |
| `--hz-color-gray` | `#6b7280` |

`--hz-color-gray` is a single mid-gray (no `gray-100/200/...` ramp).
`--hz-color-danger` matches the `Intent` union's `danger` name (renamed from
`--hz-color-error` 2026-07-13 — the earlier `danger`→`error` discrepancy is
retired); `--hz-color-info` is included to cover the full `Intent` union from
`src/lib/types/index.ts`.

**Layer 2 — Intent roles** (amendment 2026-07-13; reference the palette via
`var()`, same indirection pattern as the semantic roles — the
component-facing intent vocabulary consumed by Button/Badge/Alert intents and
field error states, so a theme can retarget status colors specifically
without touching the palette):

| Token | Default |
| --- | --- |
| `--hz-intent-neutral` | `var(--hz-color-gray)` |
| `--hz-intent-primary` | `var(--hz-color-primary)` |
| `--hz-intent-secondary` | `var(--hz-color-secondary)` |
| `--hz-intent-danger` | `var(--hz-color-danger)` |
| `--hz-intent-warning` | `var(--hz-color-warning)` |
| `--hz-intent-success` | `var(--hz-color-success)` |
| `--hz-intent-info` | `var(--hz-color-info)` |

Mirrored by the `intent` metadata export in `src/lib/tokens/index.ts`. The
dark block does **not** touch them — they chain through the palette.

**Layer 2 — Semantic roles** (reference the palette via `var()` — `surface-muted`
through a `color-mix()` of it; the only tokens the dark block overrides):

| Role token | Light (`:root`) | Dark (`[data-theme="dark"]`) |
| --- | --- | --- |
| `--hz-color-surface` | `var(--hz-color-white)` | `var(--hz-color-black)` |
| `--hz-color-surface-muted` | `color-mix(in srgb, var(--hz-color-gray) 6%, var(--hz-color-surface))` | `color-mix(in srgb, var(--hz-color-gray) 25%, var(--hz-color-surface))` |
| `--hz-color-text` | `var(--hz-color-black)` | `var(--hz-color-white)` |
| `--hz-color-text-muted` | `var(--hz-color-gray)` | `var(--hz-color-gray)` |
| `--hz-color-border` | `var(--hz-color-gray)` | `var(--hz-color-gray)` |

`--hz-color-surface` and `--hz-color-text` flip between modes, and
`--hz-color-surface-muted` (amendment 2026-07-13) strengthens its gray tint —
6% is invisible over black; `text-muted` and `border` stay gray in both.
`surface-muted` is an **opaque** subdued surface (docs code blocks, the reference
Footer): gray mixed over `surface`, so it tracks surface overrides and covers
whatever sits behind it — not a raised surface. There is intentionally **no**
`surface-raised` role (a single gray cannot serve both a raised surface and a
readable muted text); the reference theme will derive raised surfaces later.

**Type scale — six steps:**

| Token | Value |
| --- | --- |
| `--hz-font-size-xs` | `0.75rem` |
| `--hz-font-size-sm` | `0.875rem` |
| `--hz-font-size-base` | `1rem` |
| `--hz-font-size-lg` | `1.25rem` |
| `--hz-font-size-xl` | `1.5rem` |
| `--hz-font-size-2xl` | `2rem` |

Supporting type tokens:

- `--hz-font-family-sans`: `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- `--hz-font-family-mono`: `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace`
- `--hz-font-weight-normal: 400; -medium: 500; -semibold: 600; -bold: 700`
- `--hz-line-height-tight: 1.2; -base: 1.5; -loose: 1.75`

**Spacing (backs existing fallbacks — values fixed):**

`--hz-space-none: 0; --hz-space-xs: 0.25rem; --hz-space-sm: 0.5rem;
--hz-space-md: 1rem; --hz-space-lg: 1.5rem; --hz-space-xl: 2rem;`

**Sizing / breakpoints (backs existing fallbacks — values fixed):**

`--hz-width-sm: 640px; --hz-width-md: 968px; --hz-width-lg: 1200px;
--hz-width-xl: 1440px; --hz-width-full: 100%;`

Documented as tokens for reference; component `@media` thresholds stay literal —
CSS cannot read custom properties inside media queries.

**Radius:** `--hz-radius-none: 0; -sm: 0.25rem; -md: 0.5rem; -lg: 1rem; -full: 9999px`

**Border width:** `--hz-border-width-thin: 1px; --hz-border-width-thick: 2px`

**Elevation:** layered `box-shadow` strings —
`--hz-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);`
`--hz-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);`
`--hz-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);`

**Z-index:** `--hz-z-base: 0; --hz-z-dropdown: 10; --hz-z-overlay: 1000;
--hz-z-modal: 1100; --hz-z-toast: 1200`

**Motion:** `--hz-duration-fast: 150ms; -base: 250ms; -slow: 400ms`;
`--hz-ease-standard: cubic-bezier(0.2, 0, 0, 1); -in: cubic-bezier(0.4, 0, 1, 1);
-out: cubic-bezier(0, 0, 0.2, 1)`

### Requirements

1. **R1 — Back existing fallbacks, zero regression.** `tokens.css` defines every
   `--hz-space-*` and `--hz-width-*` on `:root` with the exact values above.
   Importing `tokens.css` must not change any component's current computed layout.
2. **R2 — Single gray; update Image.** Define `--hz-color-gray` as the single gray
   value (no `gray-NNN` ramp). Update `src/lib/components/Image.svelte` line 39 so
   the `placeholderColor` default is `'var(--hz-color-gray)'` (was
   `'var(--hz-color-gray-200)'`). After this change no shipped component references
   an undefined token. The existing `Image.svelte.spec.ts` passes an explicit
   `placeholderColor`, so it is unaffected; do not change that test.
3. **R3 — Palette.** The nine palette colors (`primary, secondary, success,
   warning, danger, info, black, white, gray`) are defined on `:root` exactly as the
   table, each a single value.
4. **R4 — Semantic role layer.** The five role tokens (`surface, surface-muted,
   text, text-muted, border`) are defined on `:root` as references into the
   palette — `var()` indirection, or `color-mix()` over a palette `var()` for
   `surface-muted` — never raw literals — so the indirection a theme overrides
   stays intact.
5. **R5 — Dark override hook.** A single `[data-theme="dark"]` selector overrides
   **only** `--hz-color-surface`, `--hz-color-surface-muted`, and
   `--hz-color-text` to their Dark-column values. No palette token, no non-color
   token, and no other role token is redefined in that block. Setting
   `data-theme="dark"` on any ancestor flips those roles for that subtree and
   changes nothing else.
6. **R6 — Type, radius, border, elevation, z-index, motion.** All remaining token
   groups above are defined on `:root` under the `--hz` prefix with the values
   given. The type scale has exactly six `--hz-font-size-*` steps.
7. **R7 — JS metadata parity.** `index.ts` exports typed, readonly objects —
   `color`, `space`, `width`, `typography`, `radius`, `border`, `shadow`, `zIndex`,
   `motion` — plus the existing `prefix`. Every key/value mirrors a `tokens.css`
   custom property with no drift. The dark role mapping is exported as a
   documented sub-map (e.g. `color.theme.dark` or equivalent) carrying the three
   overridden role values.
8. **R8 — Single source, no duplication.** Each token value is authored once per
   mode; `index.ts` reflects `tokens.css` with no contradictory hardcoding. The
   `prefix` export and existing `utils` (`cx`/`uid`) are unaffected.
9. **R9 — Packaging.** `pnpm package` and `publint` succeed; `./tokens` and
   `./tokens.css` resolve from `dist/` with no `package.json` edit.

### Responsive Behavior

N/A — tokens define no layout. `--hz-width-*` are values consumed by components;
breakpoint thresholds remain literal in component `@media` queries. No media
queries are added to `tokens.css`.

### Accessibility (WCAG 2.1 AA)

- In light mode, `--hz-color-text` (black) on `--hz-color-surface` (white) is
  21:1; in dark mode white on black is 21:1 — both pass AAA.
- `--hz-color-text-muted` (gray `#6b7280`) on white is ≈ 4.8:1 (passes AA for
  normal text). On dark surface (black) it is ≈ 4.4:1 — borderline for normal
  text; this is an accepted first-pass tradeoff of the single-gray palette and is
  flagged for iteration. `--hz-color-border` is a non-text UI color (3:1 target)
  and passes in both modes.
- Intent colors are first-pass values to be iterated; the Reviewer records, but
  does not block on, their text-contrast ratios on white/surface.
- Motion tokens are values only; honoring `prefers-reduced-motion` is the
  consumer's responsibility. Tokens introduce no DOM, focus, or ARIA surface.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| Consumer imports `tokens.css` over existing components | Identical computed spacing/width (R1); `Image` placeholder now resolves via `--hz-color-gray` (R2). |
| `data-theme="dark"` on `<html>` or any wrapper | `--hz-color-surface`/`--hz-color-surface-muted`/`--hz-color-text` cascade to dark for that subtree; palette, text-muted, border, and all non-color tokens unchanged (R5). |
| No `data-theme` attribute present | Light role values apply from `:root`; nothing depends on the attribute existing. |
| Consumer overrides a palette token (e.g. `--hz-color-gray`) | Role tokens referencing it update automatically (indirection holds, R4). |
| `index.ts` consumed without `tokens.css` (JS-only tooling) | Metadata returns correct string values (R7); no runtime dependency on the CSS being loaded. |
| SSR / prerender | `tokens.css` is static; `index.ts` performs no `window`/DOM access. |
| Nested `data-theme` (dark inside light or vice-versa) | Innermost `data-theme` wins for its subtree via normal cascade; no token leaks across the boundary. |

### Existing Code to Reuse

- Extend the existing `src/lib/tokens/tokens.css` and `src/lib/tokens/index.ts`;
  keep the `--hz` prefix and the existing `prefix` export. Do not create parallel
  token files.
- Match the spacing/width values already encoded as fallbacks in
  `Stack`/`Container`/`Grid`/`Split` and in `specs/03-layout.md` "Shared Scales"
  (authoritative for R1).
- Key palette intent names to the `Intent` union in `src/lib/types/index.ts`
  (`primary, secondary, danger, warning, success, info`) — 1:1 since the
  2026-07-13 `error`→`danger` rename.
- `src/lib/components/Image.svelte` line 39 — the only component edit (R2). Note:
  `specs/06-media.md` and `original-specs/07-image.md` still document the old
  `var(--hz-color-gray-200)` default; updating those prose tables for consistency
  is optional housekeeping and not required by this spec.
- Test patterns: server specs follow `src/lib/exports.spec.ts`; browser
  `getComputedStyle` checks follow the `*.svelte.spec.ts` browser project in
  `vite.config.ts` (`expect.requireAssertions` is on — every test must assert).

### Test Plan

Runner: **Vitest** — server project for metadata, browser project (chromium,
Playwright provider) for computed-style checks. No Playwright e2e (no routes in
scope).

**Metadata (server, e.g. `src/lib/tokens/index.spec.ts`):**

- Assert `index.ts` exports each group (`color, space, width, typography, radius,
  border, shadow, zIndex, motion`) plus `prefix`.
- Assert `space` and `width` values equal the R1 fixed values exactly.
- Assert `color.gray` is defined and there is **no** `gray-100/200/...` ramp key (R2/R3).
- Assert all nine palette keys exist incl. `danger` and `info` (R3).
- Assert the type scale exposes exactly six font-size steps (R6).
- Assert the dark sub-map exists with exactly `surface`, `surfaceMuted`, and `text` keys (R5/R7).

**Computed values (browser, e.g. `src/lib/tokens/tokens.svelte.spec.ts`):**

- Mount a probe; assert `getComputedStyle(document.documentElement)` resolves
  `--hz-space-md` → `1rem` (16px), `--hz-width-lg` → `1200px`,
  `--hz-color-gray` non-empty, `--hz-color-primary` non-empty,
  `--hz-color-info` non-empty, `--hz-font-size-base` → `1rem` (R1/R2/R3/R6).
- **Role indirection:** assert computed `--hz-color-surface` equals computed
  `--hz-color-white`, and `--hz-color-text` equals `--hz-color-black` in light
  mode (R4).
- **Dark hook:** set `data-theme="dark"` on the root element; assert
  `--hz-color-surface` now equals `--hz-color-black` and `--hz-color-text` equals
  `--hz-color-white`, while `--hz-color-primary`, `--hz-color-gray`,
  `--hz-color-text-muted`, `--hz-color-border`, and `--hz-space-md` are unchanged
  (R5).

**Parity (server):** for the dark map, assert each value maps to a declared
palette entry and differs from its light counterpart (R7).

### Out of Scope

- The reference theme (`src/lib/theme/theme.css`, `button.css`) and component-level
  styling — Sprint 4.
- Documentation pages for tokens — the separate docs spec (`specs/16-docs.md`).
- A fully populated dark theme beyond the two core role overrides (`surface`,
  `text`); per-component dark tuning, high-contrast, or additional themes.
- Per-color ramps, on-color pairs, or state (hover/active) color tokens — the
  reference theme will derive these (e.g. via `color-mix`).
- Re-tuning the first-pass palette hues or muted-on-dark contrast — deliberate
  follow-up iteration.
- Tokenizing `@media` breakpoint thresholds (CSS limitation).
- Editing the `specs/06-media.md` / `original-specs/07-image.md` prose tables.
