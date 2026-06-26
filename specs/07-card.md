# Card Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Card-Rn`) and edge case as pass/fail. Write scope for the Builder
> is the library source (`src/lib/**`).

### Goal

Ship one headless Svelte 5 `Card` component — a content container with `media` /
body / `actions` regions, vertical & horizontal layouts, configurable media
position, and an optional whole-card click target — that exposes its state
through stable `hz-*` classes and `data-*` hooks, ships only the **structural**
CSS needed to lay out regions and make the clickable-overlay pattern work, and
ships **no** visual opinions (no colors, borders, shadows, radius, fonts).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file: `src/lib/components/Card.svelte`.
- Exported from the barrel `src/lib/components/index.ts`, resolvable via
  `import { Card } from '$lib'`; assertion added to `src/lib/exports.spec.ts`.
- **Structural-CSS exception** (same justification as Nav/Footer/layout primitives
  in `original-specs/00-architecture.md`): Card owns region layout, the
  vertical/horizontal switch, mobile stacking, and the clickable-overlay
  positioning, so it ships **structural** CSS in a scoped `<style>` —
  display/flex/grid/position/order, media queries, padding. It ships **no**
  colors, borders, shadows, border-radius, fonts, or animation.
- Shipped spacing references `--hz-space-*` tokens **with literal fallbacks**
  (Shared Scale in `specs/03-layout.md`), e.g. `padding: var(--hz-space-md, 1rem)`.
- Mirror `Link.svelte` for `$props()` destructuring, `class: className` via `cx`,
  and `...rest`-first spread order (managed attributes win). Dev-only warnings use
  the `import.meta.env.DEV` + `untrack(...)` pattern from `Button.svelte` /
  `Link.svelte`.
- "Slots" are Svelte 5 **snippet props**: `media`, `children` (body), `actions`.
  Prop unions are declared **locally** (no new shared types).
- Card does **not** import `Image`/`Link`/`Stack`: `media`/`children`/`actions`
  are consumer snippets (a consumer drops `Image`, `Link`, etc. inside). The
  build-order "Uses: Image, Link, Stack" is compositional intent, not a hard import.

### Props

| Prop            | Type                                              | Default      |
| --------------- | ------------------------------------------------- | ------------ |
| `variant`       | `'elevated' \| 'outlined' \| 'filled' \| 'ghost'` | `'outlined'` |
| `padding`       | `'none' \| 'sm' \| 'md' \| 'lg'`                  | `'md'`       |
| `rounded`       | `'none' \| 'sm' \| 'md' \| 'lg'`                  | `'md'`       |
| `href`          | `string \| undefined`                             | —            |
| `ariaLabel`     | `string \| undefined`                             | —            |
| `horizontal`    | `boolean`                                         | `false`      |
| `mediaPosition` | `'start' \| 'end'`                                | `'start'`    |
| `media`         | `Snippet` (optional)                              | —            |
| `children`      | `Snippet` (optional, body)                        | —            |
| `actions`       | `Snippet` (optional)                              | —            |
| `class`         | `string` (optional, → `cx`)                       | —            |

Plus arbitrary `...rest` HTML attributes forwarded to the root `<div>`.

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

**Structure & regions**

1. **Card-R1 — Root.** Renders `<div class="hz-card">`. Reflects `data-variant`,
   `data-padding`, `data-rounded`, `data-media-position` verbatim for every enum
   value (defaults `outlined`/`md`/`md`/`start`). `data-horizontal` is present when
   `horizontal`, absent otherwise.
2. **Card-R2 — Media region.** When the `media` snippet is provided, renders
   `<div class="hz-card-media">` around it; when absent, **no** `hz-card-media`
   element and no error.
3. **Card-R3 — Content region.** Body + actions are grouped in
   `<div class="hz-card-content">`. Inside it: `children` renders in
   `<div class="hz-card-body">` (only when `children` provided), then `actions`
   renders in `<div class="hz-card-actions">` (only when `actions` provided). The
   `hz-card-content` wrapper renders only when `children` or `actions` is present.
4. **Card-R4 — DOM-order reordering (reading order == visual order).** Region
   order in the DOM is driven by `mediaPosition`, **not** CSS `order`: `start` →
   media before content; `end` → content before media. This holds in both vertical
   and horizontal layouts, so screen-reader/tab order always matches the visual
   order with no `order`/`grid-area` reflow. `actions` always follows `body` within
   the content region.

**Layout CSS (shipped, structural)**

5. **Card-R5 — Vertical (default).** `hz-card` lays regions out in a single
   column. With `mediaPosition="start"`, media sits above the content block; with
   `"end"`, below — achieved by R4 DOM order.
6. **Card-R6 — Horizontal.** When `horizontal`, media and content sit side by side
   at ≥640px; the content block flexes to fill remaining space and the media track
   width is a tunable hook `--hz-card-media-size` (fallback `40%`). `mediaPosition`
   controls which side media is on (via R4 DOM order). `actions` pins to the bottom
   of the content column (content is a column; the body/actions gap uses
   `--hz-space-*`).
7. **Card-R7 — Mobile stacking.** Below 640px, horizontal cards stack vertically
   (column). `mediaPosition` still controls order — `start` = media first (top),
   `end` = content first (top) — via the same R4 DOM order (no media query
   reordering needed).
8. **Card-R8 — Padding.** `padding` maps to padding on `hz-card-content` via
   `var(--hz-space-{sm|md|lg}, …)` with `none` → `0`. Media bleeds edge-to-edge
   (the media region is **not** padded). `data-padding` reflects.

**Clickable card**

9. **Card-R9 — Overlay link.** When `href` is a non-empty string, the card is
   clickable: `data-clickable` is present and an
   `<a class="hz-card-link" href={href}>` containing
   `<span class="hz-card-link-overlay"></span>` is rendered as the first child of
   `hz-card`. The overlay is absolutely positioned to cover the whole card (card
   root is `position: relative`). The overlay link is a normal tab stop (no
   `tabindex="-1"`) and is the card's primary link; its accessible name comes from
   `ariaLabel`. When `href` is absent/empty, no overlay, no `data-clickable`, root
   stays a plain `<div>`.
10. **Card-R10 — Inner interactive elements stay usable.** Within a clickable
    card, Card ships one low-specificity descendant rule —
    `.hz-card[data-clickable] :where(a, button, input, select, textarea, [tabindex]) { position: relative; z-index: 1; }`
    (the overlay sits at `z-index: 0`) — so links/buttons inside
    `media`/`children`/`actions` remain independently clickable and focusable above
    the overlay. This is the only descendant-targeting rule Card ships; `:where()`
    keeps it themable.
11. **Card-R11 — Accessible name warning.** In `import.meta.env.DEV`, if `href` is
    set without a non-empty `ariaLabel`, emit a one-time `console.warn` (untracked)
    explaining the clickable card needs an accessible name (WCAG 2.4.4 / 4.1.2).
    Non-DEV is silent. When `ariaLabel` is provided it renders as the overlay link's
    `aria-label`.

**Hooks-only (no shipped visual CSS)**

12. **Card-R12 — variant / rounded are hooks only.** `data-variant` and
    `data-rounded` reflect verbatim but Card ships **no** shadow (`elevated`),
    border (`outlined`), background (`filled`), `border-radius`, or `overflow` for
    them — identical precedent to `Image`'s `rounded` (`specs/06-media.md` IMG-R7)
    and `Footer`'s `variant`. Radius **and** the clipping it needs
    (`overflow: hidden`) are entirely a theme concern off the `data-rounded` hook.

**Cross-cutting**

13. **Card-R13 — class composition.** Root `class` is `cx('hz-card', className)`:
    `hz-card` first, never removable. No `class` → exactly `hz-card`;
    `class="foo bar"` → `hz-card foo bar`.
14. **Card-R14 — rest forwarding.** `...rest` forwards onto the root `<div>`,
    spread first so managed attributes (`class`, all `data-*`) win.
15. **Card-R15 — barrel export.** `Card` exported from
    `src/lib/components/index.ts`; `import { Card } from '$lib'` resolves; assertion
    added to `exports.spec.ts`.

### Responsive Behavior

- **Mobile (<640px):** Vertical cards unchanged. Horizontal cards **stack to a
  single column** (Card-R7); `mediaPosition` still governs which region is on top.
  Single-column reflow at 320px supported (no fixed widths; media track is a
  percentage/auto hook).
- **Tablet (640–1024px):** Horizontal cards are side-by-side (media track =
  `--hz-card-media-size`, fallback 40%); vertical unchanged.
- **Desktop (>1024px):** Same as tablet; no further reflow.
- No region hides at any breakpoint; only horizontal↔column flips at 640px.

### Accessibility (WCAG 2.1 AA)

- Card root is a non-landmark `<div>` (no injected `role`); the heading that titles
  the card lives in the consumer's `children` snippet at the level appropriate to
  context (Card renders no heading) (1.3.1).
- **DOM order == reading order == visual order** at every breakpoint and for both
  `mediaPosition` values, because reordering is DOM-driven, not CSS
  `order`/`grid-area` (Card-R4) (1.3.2, 2.4.3).
- Clickable card: the overlay `<a>` is a single, focusable tab stop with an
  `ariaLabel` accessible name (2.4.4, 4.1.2); a missing name dev-warns (Card-R11).
  Inner interactive elements remain independently focusable/operable above the
  overlay (Card-R10) (2.1.1).
- No `outline: none` / focus suppression anywhere; focus styling is a theme concern
  but must not be removed.
- Color contrast / reduced motion: N/A — Card ships no colors and no animation.

### Edge Cases & Error States

| Case                                            | Expected behavior                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| No `media` snippet                              | No `hz-card-media`; content-only card lays out fine (Card-R2).                                |
| No `children` and no `actions`                  | No `hz-card-content` wrapper; e.g. media-only card renders just `hz-card-media` (Card-R3).    |
| `actions` but no `children`                     | `hz-card-content` renders with only `hz-card-actions` (no empty `hz-card-body`) (Card-R3).    |
| `mediaPosition` set but no `media`              | `data-media-position` still reflects; no visual effect (no-op).                              |
| `horizontal` but no `media`                     | Content fills full width; no empty media track.                                              |
| `href=""` (empty)                               | Not clickable; no overlay, no `data-clickable`; plain `<div>` (Card-R9).                      |
| `href` set, no `ariaLabel`                      | Overlay still rendered & clickable; dev `console.warn` fires once (Card-R11).                 |
| Clickable card with inner `<a>`/`<button>`      | Inner element clickable & focusable above overlay; overlay covers the rest (Card-R10).       |
| `padding="none"`                                | `hz-card-content` padding is `0` (Card-R8).                                                   |
| `rounded`/`variant` any value                   | Only `data-*` reflects; no shipped radius/overflow/shadow/border/bg (Card-R12).              |
| Very long body / many actions                  | No truncation; content wraps/overflows per normal flow (consumer concern).                   |
| `...rest` attempts `class` / a managed `data-*` | Component-managed value wins (Card-R14).                                                      |

### Existing Code to Reuse

- **Utils:** `cx` from `src/lib/utils` for class composition (Card-R13). `uid`
  **not** needed (no generated ids / `aria-controls`).
- **Component pattern:** mirror `src/lib/components/Link.svelte` (`$props()`
  destructuring, `class: className`, `...rest`-first spread) and
  `src/lib/components/Stack.svelte` (scoped `<style>` with `data-*`-driven
  selectors + token-with-fallback spacing).
- **Dev-warning pattern:** `import.meta.env.DEV` + `untrack(...)` from
  `Button.svelte` / `Link.svelte` (Card-R11).
- **Tokens:** `--hz-space-*` with literal fallbacks per the Shared Scale in
  `specs/03-layout.md`.
- **Headless conventions / structural-CSS exception:**
  `original-specs/00-architecture.md`; precedent for hook-only `rounded`/`variant`
  is `specs/06-media.md` (IMG-R7) and `specs/05-footer.md`.
- **Barrel + export test:** `src/lib/components/index.ts` and
  `src/lib/exports.spec.ts` (extend the `$lib (.)` assertion to include `Card`).
- **Test harness:** `Button.svelte.spec.ts` / `Nav.svelte.spec.ts` /
  `Footer.svelte.spec.ts` — Vitest browser mode (`vitest-browser-svelte`:
  `render`, `page.getBy*`, `await expect.element`, `createRawSnippet` for snippet
  props, `vitest/browser` `userEvent`). `expect.requireAssertions` is on — every
  test asserts.
- **Note — clickable does NOT reuse `Link`:** the overlay needs the `hz-card-link`
  + `hz-card-link-overlay` span structure and Card's own positioning; `Link`
  renders a different element (`hz-link`, no overlay). Render a raw `<a>`
  (Card-R9), not `Link`.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file `src/lib/components/Card.svelte.spec.ts`
(the `.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). No Playwright e2e (docs demos are Sprint 4). Computed responsive
styles asserted with viewport resize + `getComputedStyle(el)`.

**Unit / component (browser):**

- Card-R1: defaults → `data-variant="outlined"`/`data-padding="md"`/
  `data-rounded="md"`/`data-media-position="start"`, no `data-horizontal`; each
  enum parametrized; `horizontal` → `data-horizontal` present; assert no `role`.
- Card-R2/R3: `media` present → `hz-card-media`; absent → none. `children`/`actions`
  combos → correct presence of `hz-card-content`/`hz-card-body`/`hz-card-actions`
  (including actions-only, media-only).
- Card-R4: with `media`+`children`, assert DOM order media-before-content for
  `start` and content-before-media for `end`; `actions` after `body`.
- Card-R5/R6/R7: vertical → computed `flex-direction: column`; horizontal at ≥640px
  → `row`; resize to <640px → `column`; media track reflects `--hz-card-media-size`.
- Card-R8: each `padding` → computed padding on `hz-card-content` (`none` → `0`);
  media region unpadded.
- Card-R9: `href` set → `data-clickable` + `a.hz-card-link[href]` with
  `span.hz-card-link-overlay` as first child; overlay covers card (computed position
  absolute); `href=""`/absent → none.
- Card-R10: clickable card with an inner `<button>` (via snippet) → inner element
  computed `z-index >= 1` / `position: relative`; `userEvent.click` on it fires its
  handler (not navigation).
- Card-R11: `href` without `ariaLabel` → `console.warn` spy fires; with `ariaLabel`
  → no warn and overlay `aria-label` set.
- Card-R12: `variant`/`rounded` values → only `data-*`; assert **no** computed
  `box-shadow`/`border`/`background`/`border-radius`/`overflow` shipped by the
  component.
- Card-R13: no `class` → exactly `hz-card`; `class="foo bar"` → `hz-card foo bar`
  (order).
- Card-R14: `...rest` (e.g. `data-testid`) forwarded; override attempt on
  `class`/`data-variant` → managed wins.
- Card-R15: extend `exports.spec.ts` to assert `Card` resolves from `$lib`, plus
  smoke render.

**Integration (browser, viewport resize):**

- Card-R6/R7: horizontal card computes `row` at a wide viewport and `column` at
  ≤320px; `mediaPosition` order preserved across the switch.

### Out of Scope

- Any colors, borders, shadows, **border-radius**, fonts, or animation —
  `variant`/`rounded` are hooks only (Card-R12); the reference theme is Sprint 4.
- A configurable root element (`as` prop) — root stays `<div>` per the reference
  render.
- Rendering a card heading or enforcing its level — the heading lives in the
  `children` snippet (consumer-owned).
- Importing/bundling `Image`/`Link`/`Stack` — they're consumer snippet content, not
  Card dependencies.
- The "consumer title-link + `tabindex=\"-1\"` overlay" variant of the clickable
  pattern — Card uses a single focusable overlay link (Card-R9).
- Docs demo routes and Playwright e2e — Sprint 4.
