# Blockquote Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Blockquote-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`) plus the two docs routes named in
> Blockquote-R8.

### Goal

Ship one headless Svelte 5 `Blockquote` component: a semantic `<blockquote>` for
quoted content with an optional visible attribution and an optional source URL.
It exists to make _correct quotation markup the default_ — the library's
accessible-semantics-by-default philosophy (landing page) — so consumers stop
hand-rolling `<blockquote>` / `<cite>` pairs (the Carousel docs demo does exactly
that today; Blockquote-R8 replaces it). Presentational chrome (accent bar,
padding, attribution typography) is the reference theme's job.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Blockquote.svelte`, exported from the barrel; assertion in
  `exports.spec.ts`.
- **Not a form field** — extends nothing (`FieldBase`/`FormOption` are
  irrelevant). No intent/variant/size scale: a quote is one thing (pull-quote
  styling variants are Out of Scope).
- **Markup decision (HTML spec).** Attribution is _not part of the quote_, so it
  must live **outside** the `<blockquote>`. The spec-blessed pattern is
  `<figure><blockquote>…</blockquote><figcaption>…<cite>…</cite></figcaption></figure>`.
  Therefore the root is **always** a single `<figure class="hz-blockquote">`
  (one stable root for `class`/`...rest`, mirroring Badge's `<span>` and Alert's
  `<div>`), the quoted content lives in an inner `<blockquote>`, and the
  attribution — when present — lives in a `<figcaption>` outside it. A lone
  `<figure>` wrapping only a `<blockquote>` (no attribution) is valid,
  self-contained referenced content and keeps the root invariant.
- **`cite` is overloaded in HTML** — two distinct things, both supported:
  1. The **`cite` _attribute_** on `<blockquote>` is a machine-readable **URL**
     of the source (not rendered by browsers). Driven by the `citeUrl` prop.
  2. The **`<cite>` _element_** holds the visible attribution. Driven by the
     `cite` prop. Per the spec `<cite>` names a _work_; naming a person in it is
     a widely-accepted convention (and is what the existing Carousel demo and
     every peer design system do), so we keep it — the decorative em-dash is a
     theme pseudo-element and never enters the accessible name.
- `cite` (visible attribution) is `string | Snippet` — the house text-slot
  convention (Hero/Accordion/Tabs/Alert `title`).
- Mirror existing patterns: `$props()` destructuring, `class: className` via
  `cx`, `...rest`-first spread on the root (managed attributes win). No `uid`
  needed — nothing here is cross-referenced by id.

### Props

| Prop       | Type                            | Default    |
| ---------- | ------------------------------- | ---------- |
| `children` | `Snippet`                       | _required_ |
| `cite`     | `string \| Snippet`             | —          |
| `citeUrl`  | `string`                        | —          |
| `align`    | `'start' \| 'center' \| 'end'`  | `'start'`  |
| `class`    | `string` (→ `cx`)               | —          |

Plus arbitrary `...rest` forwarded onto the root `<figure>` (managed attributes
win). Blockquote sets no `role`, no `aria-*`, and no `data-*` hooks — the native
`figure`/`blockquote`/`figcaption`/`cite` elements carry all the semantics.

### Requirements

1. **Blockquote-R1 — Structure.** Renders, always:
   `<figure class="hz-blockquote">` (root) containing
   `<blockquote class="hz-blockquote-quote">{@render children()}</blockquote>`,
   followed — only when `cite` is provided — by
   `<figcaption class="hz-blockquote-attribution">` wrapping
   `<cite class="hz-blockquote-cite">` that renders the string or snippet. The
   `<figure>` is always the single root even with no attribution.
2. **Blockquote-R2 — Source URL.** When `citeUrl` is provided, the inner
   `<blockquote>` carries `cite={citeUrl}` (the HTML `cite` _attribute_, a URL);
   when absent, the `<blockquote>` has no `cite` attribute. `citeUrl` never
   renders as visible text.
3. **Blockquote-R3 — Attribution is optional.** With no `cite` prop, no
   `<figcaption>` and no `<cite>` element render — just the `<figure>` +
   `<blockquote>`. With `cite`, exactly one `<figcaption>` containing one
   `<cite>` renders after the quote.
4. **Blockquote-R4 — Text-slot convention.** `cite` accepts a plain string or a
   `Snippet`; both render inside the `<cite>` element (per Alert `title`).
4b. **Blockquote-R4b — Attribution alignment (added 2026-07-14).** `align`
   (`'start' | 'center' | 'end'`, default `'start'` — logical values per the
   house convention, mirroring Hero's `align`/`data-align`) reflects onto the
   root as `data-align={align}` (always present). The **theme** aligns the
   attribution row (`text-align` on `.hz-blockquote-attribution` keyed on
   `[data-align]`); the quote body's alignment is deliberately untouched — the
   prop exists so the citation can sit start/center/end under the quote
   (user decision 2026-07-14). No CSS ships in the component for it
   (structural-only rule, Blockquote-R7).
5. **Blockquote-R5 — class & rest.** Root class is
   `cx('hz-blockquote', className)`; `...rest` spreads first on the `<figure>` so
   managed attributes (`class`) win. `...rest` does **not** reach the inner
   `<blockquote>` (the `cite` attribute there is component-managed).
6. **Blockquote-R6 — Barrel export.** `Blockquote` exported from
   `src/lib/components/index.ts`; `import { Blockquote } from '$lib'` resolves;
   assertion + smoke render added to `exports.spec.ts` (comment
   `// Blockquote-R6:`).
7. **Blockquote-R7 — Structural CSS only.** Scoped styles reset the browser
   defaults that fight the theme: `.hz-blockquote { margin: 0; }` and
   `.hz-blockquote-quote { margin: 0; }` (browsers give both large default
   margins), and `.hz-blockquote-cite { font-style: normal; }` only if needed as
   a structural reset — otherwise leave italics to the theme. **No** colors,
   padding, borders, radius, or font sizing. All chrome is the theme
   (`theme/blockquote.css`, in `@layer hz-theme`, imported by `theme.css`
   alphabetically among the `@import` block): inline-start accent bar on the
   `<blockquote>` (via `border-inline-start` using `--hz-color-border` /
   `--hz-color-primary`), block padding from the space tokens, quote typography
   (`--hz-font-size-xl`; amendment 2026-07-14 — bumped from `lg` for editorial
   presence, override in a consumer theme if quieter quotes are wanted), and
   attribution styling — muted, smaller
   (`--hz-color-text-muted`, `--hz-font-size-sm`) with a decorative em-dash via
   `.hz-blockquote-attribution::before { content: '— '; }` (pseudo-element, so it
   stays out of the accessible name).

### Responsive Behavior

Blockquote is fluid: it fills its container's inline size at every breakpoint and
introduces no fixed widths, no reflow, and no breakpoint-specific behavior. Long
quotes wrap normally; the accent bar and padding are logical properties
(`border-inline-start`, `padding-block`) so RTL and vertical writing modes hold.
Nothing hides or changes interaction at mobile (<640px), tablet (640–1024px), or
desktop (>1024px).

### Accessibility (WCAG 2.1 AA)

- Native `<figure>` / `<blockquote>` / `<figcaption>` / `<cite>` carry the
  semantics; the component adds **no** ARIA — the correct elements are the point
  (1.3.1). Screen readers expose the quote and, via the `<figcaption>`, its
  attribution as associated caption text.
- Attribution lives **outside** the `<blockquote>` (Blockquote-R1) so it is not
  announced as part of the quotation itself.
- The em-dash is a decorative `::before` pseudo-element and never enters the
  accessible name (the attribution reads as the source text alone).
- No motion, no dynamic content, no focusable elements — nothing to manage for
  keyboard, focus order, or reduced-motion. Theme contrast: the muted
  attribution color must still meet AA against the surface (the theme's
  `--hz-color-text-muted` already satisfies this on light; dark caveat per
  `specs/15-tokens.md` is a theme concern).

### Edge Cases & Error States

| Case                                | Expected behavior                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| No `cite`, no `citeUrl`             | `<figure>` + bare `<blockquote>` only; no `<figcaption>`, no `cite` attribute.     |
| `cite` string vs Snippet           | Both render inside one `<cite>` (Blockquote-R4).                                   |
| `citeUrl` without `cite`           | `<blockquote cite="…">` present, but no visible attribution renders (R2/R3).      |
| `cite` without `citeUrl`           | `<figcaption><cite>` renders; `<blockquote>` has no `cite` attribute (R2/R3).     |
| `...rest` attempts `class`         | Component-managed `hz-blockquote` class wins; extra classes still merge (R5).     |
| `align` default vs explicit        | `data-align="start"` present by default; `center`/`end` reflect verbatim; theme moves only the attribution row (R4b). |
| Multi-paragraph quote in children  | Renders inside the single `<blockquote>`; author supplies `<p>`s (consumer job).  |

### Existing Code to Reuse

- **`cx`** from `$lib/utils` for the root class (per Badge/Alert). No `uid`.
- **Text-slot pattern** for `cite`: copy Alert's
  `{#if typeof cite === 'string'}{cite}{:else}{@render cite()}{/if}` idiom
  (`src/lib/components/Alert.svelte`).
- **Theme conventions:** `src/lib/theme/badge.css` / `alert.css` as the template
  — `@layer hz-theme`, literal `var(--hz-…, <fallback>)` on every token.
- **Carousel docs demo** (`src/routes/components/carousel/+page.svelte`, the
  `slide` snippet plus the `.quote` / `.who` scoped styles at the bottom) is the
  hand-rolled `<blockquote class="quote">` / `<cite class="who">` this component
  replaces (Blockquote-R8).

### Test Plan

`src/lib/components/Blockquote.svelte.spec.ts` (browser project,
`vitest-browser-svelte`, mirroring `Badge.svelte.spec.ts`):

- **Structure/R1:** root is a `<figure class="hz-blockquote">`; it contains a
  `<blockquote class="hz-blockquote-quote">` rendering the children; with `cite`,
  a `<figcaption class="hz-blockquote-attribution">` containing a
  `<cite class="hz-blockquote-cite">` renders _after_ the blockquote.
- **R2:** `citeUrl` sets the `cite` attribute on the `<blockquote>` to that URL;
  absent by default; `citeUrl` never appears as text.
- **R3:** no `cite` prop → no `<figcaption>`/`<cite>`; the `<figure>` still
  renders as the sole root.
- **R4:** `cite` as string and as `createRawSnippet` both render inside `<cite>`.
- **R5:** `class` merges after `hz-blockquote`; a rest attr (`data-testid`)
  forwards to the `<figure>`; managed `hz-blockquote` class survives.
- **R6:** `Blockquote` resolves from `$lib` and smoke-renders (`.hz-blockquote`
  present).

Add `expect(mod.Blockquote).toBeDefined();` (with a `// Blockquote-R6:` comment)
to the `$lib` export assertion in `src/lib/exports.spec.ts`.

### Docs (Blockquote-R8)

Not a numbered library requirement but part of this contract's write scope:

- **New page** `src/routes/components/blockquote/+page.svelte` using the docs
  scaffold (`DocPage`, `Example`, `PropsTable` — copy the structure of
  `src/routes/components/badge/+page.svelte`): one `<h1>`, one-line description,
  an `import { Blockquote } from '@hyzer-labs/ui'` snippet, live demos for
  (a) quote only, (b) quote + `cite`, (c) quote + `cite` + `citeUrl`, and
  (d) an **attribution-alignment tab with `start`/`center`/`end` sub-tabs**
  (the nested-`Tabs` + `.inner-tab` idiom, per the Split page) so the full
  `align` range is browsable, using a **multi-line quote** so `end` alignment
  reads against a full-width quote body rather than dangling (user direction
  2026-07-14); code samples emit `align` only when non-default. Plus a props
  table sourced from the Props section above, and a short accessibility note
  (figure/blockquote/figcaption semantics; attribution outside the quote).
- **Manifest:** add `{ label: 'Blockquote', href: '/components/blockquote' }` to
  the **Components** section of `src/docs/manifest.ts`, positioned after `Badge`
  and before `Button`.
- **Dogfood the Carousel demo:** refactor
  `src/routes/components/carousel/+page.svelte` so each slide renders
  `<Blockquote cite={quote.who}>{quote.text}</Blockquote>` instead of the
  hand-rolled `<blockquote class="quote">` / `<cite class="who">`, and delete the
  now-dead `.quote` / `.who` scoped styles. Update the three `*Code` display
  strings (`basicCode`, `dotsCode`, `loopCode`) to match the new markup so the
  shown code equals the rendered demo (docs convention, `specs/16-docs.md`).

### Amendments

**2026-07-23 — Blockquote-R9: intent (accent line only).** Blockquote gains an
optional `intent?: Intent` prop (the shared `Intent` type from `$lib/types`,
no default — `undefined` by default, not `'neutral'`). It colors **only**
the accent line (`border-inline-start` on `.hz-blockquote-quote`); quote
typography, block padding, and the attribution row are untouched. Reflects
onto the root as `data-intent`, present only when `intent` is set — absent
by default, which renders the exact pre-amendment look
(`--hz-color-border`). Implemented with the `--_c` intent-switch pattern
(theme hook, per `banner.css`/`badge.css`): `.hz-blockquote` sets
`--_c: var(--hz-color-border)`, and each `[data-intent='…']` selector
re-points `--_c` at the matching `--hz-intent-*` token; the border-color
declaration reads `--_c` unconditionally. `src/docs/data/blockquote.ts`
gains an `intent` prop row (type `Intent`, note "See Foundation → Colors &
Intent." linking `/foundation/colors#intent`, the Banner/Alert/Button/Badge
precedent); `hooks.ts`'s Blockquote entry documents `data-intent`; the docs
page gains an Intent demo tab (all seven intent values, each on its own
`Example`). Tests added to `Blockquote.svelte.spec.ts` (Blockquote-R9): no
`data-intent` and default border color with no `intent`; `data-intent`
reflects verbatim when set; each of the seven intents resolves the accent
line to its `--hz-intent-*` token; intent leaves typography/attribution
color unchanged.

**2026-07-23 — Blockquote-R10: intentScope opt-in (full-intent coloring).**
Blockquote gains `intentScope?: 'line' | 'full'` (default `'line'`, the
R9 behavior — accent line only). `'full'` additionally colors the quote
text (`.hz-blockquote-quote`'s `color`) with the same intent; the
attribution row is never affected by either value, staying muted per R9.
`intentScope` is only meaningful when `intent` is also set — it reflects
onto the root as `data-intent-scope`, present **only when `intent` is
set** (mirrors `data-intent`'s own presence rule, since the scope
attribute has no meaning without an intent to scope; the
always-present-with-a-default shape used by `data-align` was considered
and rejected for this reason). Its value, when present, is always the
resolved `intentScope` (`'line'` or `'full'`), giving the theme a stable
`[data-intent-scope='full']` selector. Implemented as a second
intent-switch hook in `blockquote.css`: `--_tc` (text color) is unset by
default, so `.hz-blockquote-quote`'s `color: var(--_tc, inherit)` falls
through to `inherit` unless `[data-intent-scope='full']` sets
`--_tc: var(--_c)` (reading whatever the active intent already resolved
`--_c` to). `src/docs/data/blockquote.ts` gains an `intentScope` prop row;
`hooks.ts`'s Blockquote entry gains a `data-intent-scope` attr row;
`Blockquote.svelte.spec.ts` gains a Blockquote-R10 suite (no attribute
without intent even if `intentScope` is explicitly set;
`data-intent-scope="line"` default with intent set and untouched
quote-text color; `data-intent-scope="full"` colors the quote text to the
intent; attribution stays muted under `'full'`). The docs page's Intent
demo tab collapses into one interactive `Example`: a dogfooded `Select`
(7 intents) and `RadioGroup` (`line`/`full`) drive both the live
`Blockquote` and its derived code fence (non-default attrs only —
`intentScope` omitted from the fence when `'line'`), the icons page's
slider-driven-fence pattern applied to selects/radios instead of sliders.

### Out of Scope

- **Pull-quote / decorative variants** (oversized, floated, colored-quote-mark
  styling) — one semantic treatment ships; visual variants can come later.
- Inline `<q>` quotations, and quote-mark auto-insertion (`::before` open/close
  glyphs) — the theme may add subtle marks but no prop controls them.
- Intent/variant/size scales, `data-*` hooks — Blockquote has no appearance
  props (unlike Badge/Alert).
- Multi-source or nested-attribution structures (e.g. author + publication +
  date as separate fields) — a single `cite` slot; consumers compose richer
  attribution inside the snippet.
