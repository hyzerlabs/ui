# Hero Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Hero-Rn`) and edge case as pass/fail. Write scope for the Builder
> is the library source (`src/lib/**`).

### Goal

Ship one headless Svelte 5 `Hero` component — a full-width landing `<section>` with
`eyebrow` / `title` / `subtitle` / `actions` / `media` regions, three
layout modes (`center`, `split`, `overlay`), height and alignment options, and
responsive stacking — that exposes its state through stable `hz-*` classes and
`data-*` hooks, ships only the **structural** CSS needed to lay out the regions and
make the overlay/split patterns work, and ships **no** visual opinions (no colors,
gradients, scrims, borders, shadows, radius, fonts).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file: `src/lib/components/Hero.svelte`.
- Exported from the barrel `src/lib/components/index.ts`, resolvable via
  `import { Hero } from '$lib'`; assertion added to `src/lib/exports.spec.ts`.
- **Structural-CSS exception** (same justification as Card / Nav / layout primitives
  in `original-specs/00-architecture.md`): Hero owns region layout, the three
  layout-mode switches, vertical centering under fixed heights, overlay positioning,
  and height sizing, so it ships **structural** CSS in a scoped `<style>` —
  display/flex/grid/position/order/min-height, media queries, gap, align-items,
  text-align. It ships **no** colors, gradients, scrims, borders, shadows,
  border-radius, fonts, or animation.
- Shipped spacing references `--hz-space-*` tokens **with literal fallbacks**
  (Shared Scale in `specs/03-layout.md`), e.g. `gap: var(--hz-space-lg, 1.5rem)`.
- Mirror `Link.svelte` / `Card.svelte` for `$props()` destructuring, `class: className`
  via `cx`, and `...rest`-first spread order (managed attributes win).
- "Slots": `actions` and `media` are Svelte 5 **snippet props**. The text slots
  `eyebrow` / `title` / `subtitle` accept `string | Snippet` (changed 2026-07) —
  a plain string for the common case, a snippet when inner markup is needed
  (e.g. a highlighted span in the title). There is **no** `background` prop
  (removed 2026-07): in the `overlay` layout the `media` snippet renders into
  the background region. Prop unions are declared **locally** (no new shared
  types).
- **Hero composes the existing `Split` component** (`import Split from './Split.svelte'`)
  for the `split` layout only (Hero-R9). It does **not** import `Button` / `Image` /
  `Container` / `Cluster` — those regions are consumer snippet content.
- `uid` from `src/lib/utils` generates the title id for `aria-labelledby`
  (counter-based, SSR-safe; mirrors `Nav.svelte`).

### Props

| Prop              | Type                                  | Default    |
| ----------------- | ------------------------------------- | ---------- |
| `layout`          | `'center' \| 'split' \| 'overlay'`    | `'center'` |
| `height`          | `'auto' \| 'screen' \| 'half'`        | `'auto'`   |
| `align`           | `'start' \| 'center' \| 'end'`        | `'center'` |
| `reverseOnMobile` | `boolean`                             | `false`    |
| `headingLevel`    | `1 \| 2 \| 3 \| 4 \| 5 \| 6`          | `1`        |
| `ariaLabel`       | `string \| undefined`                 | —          |
| `eyebrow`         | `string \| Snippet` (optional)        | —          |
| `title`           | `string \| Snippet` (optional)        | —          |
| `subtitle`        | `string \| Snippet` (optional)        | —          |
| `actions`         | `Snippet` (optional)                  | —          |
| `media`           | `Snippet` (optional)                  | —          |
| `class`           | `string` (optional, → `cx`)           | —          |

Plus arbitrary `...rest` HTML attributes forwarded to the root `<section>`.

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not rendered.

**Structure & regions**

1. **Hero-R1 — Root.** Renders `<section class="hz-hero">`. Reflects `data-layout`,
   `data-height`, `data-align` verbatim for every enum value (defaults
   `center`/`auto`/`center`). `data-reverse-on-mobile` is present when
   `reverseOnMobile`, absent otherwise. Root carries no injected `role` (native
   `<section>` semantics only).
2. **Hero-R2 — Content region.** Eyebrow/title/subtitle/actions are grouped in
   `<div class="hz-hero-content">`. Inside, in DOM order: `eyebrow` →
   `<div class="hz-hero-eyebrow">`, `title` → the heading element (Hero-R6),
   `subtitle` → `<div class="hz-hero-subtitle">`, `actions` →
   `<div class="hz-hero-actions">`. Each region wrapper renders **only** when its
   snippet is provided. The `hz-hero-content` wrapper renders whenever any of
   eyebrow/title/subtitle/actions is present; if none are present it is omitted.
3. **Hero-R3 — Media region.** In `center`/`split` layouts, when `media` is
   provided, renders `<div class="hz-hero-media">` around it; when absent, no
   `hz-hero-media` element and no error. In `overlay` layout the media renders
   into the background region instead (Hero-R4) and no `hz-hero-media` element
   exists.
4. **Hero-R4 — Background region (overlay).** In `layout="overlay"`, when `media`
   is provided it renders inside `<div class="hz-hero-background">` as the
   **first** child of the root, behind the content (Hero-R12 positioning). When
   media is absent — or in any other layout — no `hz-hero-background` element.
   The background is a decorative host only: Hero adds no `alt` / `aria-hidden`
   (the consumer owns the contents).
5. **Hero-R5 — DOM order (reading order == visual order).** Region order in the DOM
   is fixed: the background (overlay media, if any) first, then the content/media flow. `split`
   desktop side-by-side (Hero-R9) and `reverseOnMobile` stacking (Hero-R10) are
   achieved with CSS only; the DOM / reading / focus order never changes across
   breakpoints — **except** the single mobile-only CSS-`order` reverse of Hero-R10,
   which is explicitly an opt-in visual-only swap with the documented caveat below.

**Heading & labelling**

6. **Hero-R6 — Title heading.** When `title` is provided, Hero renders the heading
   element `<h{headingLevel} class="hz-hero-title" id="hz-hero-title-{uid}">`
   containing the title — the string verbatim, or the snippet's markup (inline
   content only — a snippet must not nest its own heading). `headingLevel` defaults to `1` and accepts `1`–`6`,
   rendered via `<svelte:element this={`h${headingLevel}`}>` (mirrors `Split.svelte`'s
   `<svelte:element>` use). Default `1` covers the typical top-of-page hero; lower
   levels are available for a hero placed further down a page.
7. **Hero-R7 — Accessible name.** When `title` is provided, the root `<section>` gets
   `aria-labelledby` pointing at the title heading's generated `id`, making it a
   labelled region landmark (the `id` is stable per instance via `uid`). When `title`
   is absent but `ariaLabel` is set, the root gets `aria-label={ariaLabel}` instead.
   When both are absent, neither attribute is rendered (a nameless `<section>` is a
   valid generic, non-landmark region). When both `title` and `ariaLabel` are
   supplied, `aria-labelledby` (the visible heading) wins and `aria-label` is **not**
   rendered.

**Layout CSS (shipped, structural)**

8. **Hero-R8 — `center` layout.** The root is a flex column; `media` (if any) renders
   as a sibling **after** `hz-hero-content` (below the actions). `align` controls the
   horizontal alignment of the content block and its text: `start`→`flex-start` /
   `text-align: start`, `center`→`center` / `center`, `end`→`flex-end` /
   `text-align: end`, applied as `align-items` on the root **and** on
   `hz-hero-content`, plus `text-align` on `hz-hero-content`. Gap between regions uses
   `var(--hz-space-*, …)`.
9. **Hero-R9 — `split` layout (composes `Split`).** Hero renders the existing `Split`
   component — `<Split fraction="1/2" gap="lg" stackBelow="md">` — as the grid
   container, with `hz-hero-content` and `hz-hero-media` (when present) as its two
   children. This yields a single column below 968px and an **equal** two-column split
   at ≥968px (the `md` breakpoint, via `Split`'s `stackBelow="md"`); the rendered
   `.hz-split` reflects `data-fraction="1/2"` / `data-gap="lg"` / `data-stack-below="md"`.
   `align` maps to vertical alignment of content vs media via a scoped rule setting
   `align-items` on the internal `.hz-split`
   (`.hz-hero[data-layout='split'] :global(.hz-split) { align-items: … }`:
   `start`→`flex-start`, `center`→`center`, `end`→`flex-end`); `hz-hero-content`
   internal alignment stays start-aligned. Consumers wanting a non-equal ratio target
   the internal `.hz-split` (the `1/2` ratio is fixed by Hero).
10. **Hero-R10 — `reverseOnMobile` (split only).** When `reverseOnMobile` and **below**
    the 968px split breakpoint (where the Split is a single column), the stacked order
    is **visually** swapped so `media` appears above `content`, via a scoped CSS
    `order` rule on the Split's children (DOM order unchanged, Hero-R5). At/above 968px
    and in non-split layouts it has no visual effect (`data-reverse-on-mobile` still
    reflects). Hero does **not** use `Split`'s `reverse` prop (that swaps at all
    widths). This is the one place visual order diverges from DOM order — mobile-only
    and opt-in (default off keeps order intact).
11. **Hero-R11 — `height` + vertical centering.** `height` maps to root `min-height`:
    `auto` → no min-height (content height); `half` → `50vh` with a `50dvh` progressive
    override; `screen` → `100vh` with a `100dvh` progressive override (the `dvh`
    override avoids mobile browser-chrome clipping per `original-specs/10-hero.md`).
    `data-height` reflects. To use the extra height, the root vertically centers its
    content with `justify-content: center` in all three layouts (the root is a flex
    column for `center`/`overlay`, and centers its single `Split` child for `split`);
    with `height="auto"` there is no extra space so centering is a no-op.
12. **Hero-R12 — `overlay` layout.** The root `hz-hero` is `position: relative`;
    `hz-hero-background` is absolutely positioned to cover the section (`inset: 0`,
    `z-index: 0`) and `hz-hero-content` sits above it (`position: relative`,
    `z-index: 1`). Hero ships **no** overlay color, gradient, scrim, or contrast
    treatment — the consumer owns contrast (per `original-specs/10-hero.md`).
    The background region exists only in `overlay` (fed by `media`, Hero-R4);
    `center`/`split` have no background element.

**Hooks-only (no shipped visual CSS)**

13. **Hero-R13 — no visual opinions.** Hero ships no colors, gradients, scrims,
    borders, shadows, border-radius, fonts, or animation for any region or layout mode
    — identical precedent to Card-R12 / Footer `variant`. Overlay contrast, type
    scale, and background treatment are entirely theme/consumer concerns off the
    `data-*` / `hz-*` hooks.

**Cross-cutting**

14. **Hero-R14 — class composition.** Root `class` is `cx('hz-hero', className)`:
    `hz-hero` first, never removable. No `class` → exactly `hz-hero`;
    `class="foo bar"` → `hz-hero foo bar`.
15. **Hero-R15 — rest forwarding.** `...rest` forwards onto the root `<section>`,
    spread first so managed attributes (`class`, all `data-*`,
    `aria-labelledby` / `aria-label`) win.
16. **Hero-R16 — barrel export.** `Hero` exported from `src/lib/components/index.ts`;
    `import { Hero } from '$lib'` resolves; assertion added to `exports.spec.ts`.

### Responsive Behavior

- **Mobile (<640px):** `center` is a stacked, centered column. `split` is a single
  column; `reverseOnMobile` governs whether media or content is on top (Hero-R10).
  `overlay` content sits over the full-bleed background. Single-column reflow at 320px
  supported (no fixed widths; `Split` collapses to one column).
- **Tablet (640–1024px):** `center` / `overlay` unchanged. `split` remains stacked
  from 640–967px, then un-stacks to an **equal** two-column split at **≥968px** (the
  `md` breakpoint, via `Split`'s `stackBelow="md"`).
- **Desktop (>1024px):** `split` is side-by-side (equal `1/2` columns); `center` /
  `overlay` unchanged. No further reflow.
- No region hides at any breakpoint; only `split` flips column↔row at 968px, and
  `reverseOnMobile` reorders the stacked split below 968px.

### Accessibility (WCAG 2.1 AA)

- Root is a semantic `<section>` (no injected `role`). When titled it is a **labelled
  region** via `aria-labelledby` → the visible `hz-hero-title` heading (1.3.1, 2.4.6,
  4.1.2); when untitled but `ariaLabel` is set it is labelled via `aria-label`;
  otherwise it is a valid generic region.
- The title is a real heading element at the consumer-chosen `headingLevel` (default
  `<h1>`), so the document outline is correct; the consumer must not nest a second
  heading inside the `title` snippet (1.3.1).
- **DOM order == reading order == visual order** at every breakpoint and in every
  layout, because layout is grid/flex-driven, not DOM-reordering — **except**
  `reverseOnMobile`, which is an opt-in, mobile-only, CSS-`order` visual swap
  (documented; default off keeps order intact) (1.3.2, 2.4.3).
- Background/media are consumer snippets; decorative `alt=""` / `aria-hidden` is the
  consumer's responsibility (Hero injects none) (1.1.1). Overlay text-over-background
  contrast is consumer-owned (1.4.3) — Hero ships no scrim, so the docs/theme
  demonstrate contrast.
- Hero introduces no interactive elements of its own (CTAs live in the `actions`
  snippet); it sets no `tabindex` and no `outline: none` / focus suppression.
- `height="screen"` uses `100dvh` (progressive override over `100vh`) to avoid mobile
  browser-chrome clipping (per `original-specs/10-hero.md`).
- Color contrast / reduced motion: N/A for Hero's own output — it ships no colors and
  no animation.

### Edge Cases & Error States

| Case                                                    | Expected behavior                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| No snippets at all                                      | Renders an empty `<section class="hz-hero">`; no `hz-hero-content`/`media`/`background`; no error.  |
| `title` absent, `ariaLabel` absent                      | No `aria-labelledby` / `aria-label`; valid nameless (generic) region (Hero-R7).                     |
| `title` absent, `ariaLabel` set                         | `aria-label={ariaLabel}` on root; no heading element (Hero-R7).                                     |
| `title` set + `ariaLabel` set                           | `aria-labelledby` wins; `aria-label` not rendered (Hero-R7).                                        |
| `eyebrow`/`subtitle`/`actions` without `title`          | Their wrappers render inside `hz-hero-content`; no heading; labelling falls to `ariaLabel` / none.  |
| `media` absent in `split`                               | The internal `Split` has a single child (`hz-hero-content`); fills available space; no empty track. |
| `media` absent in `overlay`                             | Content renders normally over nothing; no `hz-hero-background`; consumer-owned contrast moot.       |
| `reverseOnMobile` in `center` / `overlay`               | `data-reverse-on-mobile` reflects; no visual effect (split-only) (Hero-R10).                        |
| `height="screen"` on mobile                             | `min-height: 100dvh` override prevents 100vh chrome clipping; content vertically centered (Hero-R11).|
| `headingLevel` = 2–6                                    | Heading renders as `<h2>`…`<h6>` with same `id`/class; `aria-labelledby` still resolves (Hero-R6).  |
| Very long title / many actions                          | No truncation; content wraps/overflows per normal flow (consumer concern).                          |
| `...rest` attempts `class` / a managed `data-*` / `aria-*` | Component-managed value wins (Hero-R15).                                                          |

### Existing Code to Reuse

- **`Split` component:** `src/lib/components/Split.svelte` — composed for the `split`
  layout (Hero-R9) as `<Split fraction="1/2" gap="lg" stackBelow="md">`. Do **not**
  re-implement a two-column grid; `Split` already ships the un-stack-at-968px behavior.
  `reverseOnMobile` is handled by Hero's own scoped `order` rule, **not** `Split`'s
  `reverse` prop (Hero-R10).
- **Utils:** `cx` (Hero-R14) and `uid` (Hero-R6/R7 title id) from `src/lib/utils` — do
  **not** inline duplicates. `uid` usage mirrors `src/lib/components/Nav.svelte`.
- **Component pattern:** mirror `src/lib/components/Card.svelte` and `Link.svelte`
  (`$props()` destructuring, `class: className`, `...rest`-first spread, scoped
  structural `<style>` with `data-*`-driven selectors + token-with-fallback spacing).
  The `<svelte:element this={…}>` heading pattern (Hero-R6) mirrors `Split.svelte`.
- **Overlay positioning precedent:** the absolute-cover + `z-index` layering in
  `Card.svelte`'s clickable-overlay CSS — Hero-R12 reuses the same `position: relative`
  root + absolutely-positioned cover (without a link). Cross-scope descendant rules use
  the `.hz-hero … :global(…)` pattern Card uses for its `:global` overlay/inner rules.
- **Tokens:** `--hz-space-*` with literal fallbacks per the Shared Scale in
  `specs/03-layout.md`; the `md`=968px breakpoint is the same one `Split` / `Grid` use.
- **Headless conventions / hook-only-visuals precedent:**
  `original-specs/00-architecture.md`, `specs/07-card.md` (Card-R12), `specs/06-media.md`.
- **Barrel + export test:** `src/lib/components/index.ts` and `src/lib/exports.spec.ts`
  (extend the `$lib (.)` assertion to include `Hero`).
- **Test harness:** `Card.svelte.spec.ts` / `Nav.svelte.spec.ts` — Vitest browser mode
  (`vitest-browser-svelte`: `render`, `page.getBy*`, `await expect.element`,
  `createRawSnippet` for snippet props, `vitest/browser` `userEvent`).
  `expect.requireAssertions` is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file `src/lib/components/Hero.svelte.spec.ts` (the
`.svelte.spec.ts` suffix routes to the browser `client` project in `vite.config.ts`).
No Playwright e2e (docs demos are Sprint 4). Computed responsive styles asserted with
viewport resize + `getComputedStyle(el)`.

**Unit / component (browser):**

- Hero-R1: defaults → `data-layout="center"` / `data-height="auto"` /
  `data-align="center"`, no `data-reverse-on-mobile`; each enum parametrized;
  `reverseOnMobile` → attribute present; assert no `role`.
- Hero-R2/R3/R4: each slot present/absent → correct presence of
  `hz-hero-content` / `-eyebrow` / `-subtitle` / `-actions` / `-media`;
  `hz-hero-content` omitted when none of eyebrow/title/subtitle/actions present;
  overlay + `media` → `hz-hero-background` rendered (first child, no
  `hz-hero-media`); non-overlay layouts never render `hz-hero-background`.
  Text slots parametrized over both string and Snippet forms.
- Hero-R5: overlay with `media` + content: `hz-hero-background` is the first DOM
  child, content follows; in `center`/`split`, content precedes media.
- Hero-R6: `title` → `<h1 class="hz-hero-title" id=…>`; `headingLevel={3}` → `<h3>`
  with same class/id pattern; no `title` → no heading element.
- Hero-R7: `title` → root `aria-labelledby` matches the heading `id`; no title +
  `ariaLabel` → `aria-label` set, no `aria-labelledby`; both → `aria-labelledby`
  present, `aria-label` absent; neither → both absent.
- Hero-R8: `center` → computed root `flex-direction: column`; each `align` → computed
  `align-items` (root + content) and `text-align` (content) mapping; `media` rendered
  as a sibling after `hz-hero-content`.
- Hero-R9: `split` → renders a `.hz-split` (with `data-fraction="1/2"` /
  `data-gap="lg"` / `data-stack-below="md"`) wrapping `hz-hero-content` +
  `hz-hero-media`; computed two-column `grid-template-columns` at ≥968px and single
  column at <968px; each `align` → computed `align-items` on the `.hz-split`.
- Hero-R10: `split` + `reverseOnMobile` at <968px → computed `order` puts media first;
  at ≥968px → no order swap; DOM order unchanged in both; `data-reverse-on-mobile`
  reflects.
- Hero-R11: each `height` → computed `min-height` (`auto` → none; `half` / `screen`
  set); assert the `dvh` progressive override is present in shipped CSS; computed root
  `justify-content: center`.
- Hero-R12: `overlay` → root `position: relative`; `hz-hero-background` computed
  `position: absolute` / `inset: 0` / `z-index: 0`; `hz-hero-content` `z-index: 1`.
- Hero-R13: assert **no** computed `background-color` / `box-shadow` / `border` /
  `border-radius` / non-default `color` shipped by the component for any layout.
- Hero-R14: no `class` → exactly `hz-hero`; `class="foo bar"` → `hz-hero foo bar`
  (order).
- Hero-R15: `...rest` (e.g. `data-testid`) forwarded; override attempt on `class` /
  `data-layout` / `aria-label` → managed wins.
- Hero-R16: extend `exports.spec.ts` to assert `Hero` resolves from `$lib`, plus a
  smoke render.

**Integration (browser, viewport resize):**

- Hero-R9/R10: split hero computes equal two columns at a wide viewport and a single
  column at ≤320px; `reverseOnMobile` order applies only below 968px while DOM order
  is preserved across the switch.

### Out of Scope

- Any colors, gradients, scrims, overlay contrast treatments, borders, shadows,
  border-radius, fonts, or animation — all hooks only (Hero-R13); the reference theme
  is Sprint 4.
- A configurable root element (`as` prop) — root is always `<section>` per
  `original-specs/10-hero.md`.
- A configurable split ratio / media-track size — the `split` layout is fixed to
  `Split`'s equal `1/2` columns (Hero-R9); consumers retune by targeting the internal
  `.hz-split`.
- Importing/bundling `Button` / `Image` / `Container` / `Cluster` — those regions are
  consumer snippet content, not Hero dependencies (only `Split` is composed).
- Width-capping the content (no internal `Container` / `max-width`); the consumer
  composes a `Container` inside the snippets if desired.
- Enforcing contrast for `overlay`, or shipping a scrim/gradient — consumer/theme
  concern.
- Docs demo routes and Playwright e2e — Sprint 4.
- New shared types in `src/lib/types/index.ts` — prop unions stay local.
