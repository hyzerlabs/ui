# Pagination Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Pagination-Rn`) and edge case as pass/fail. Write scope for
> the Builder is the library source (`src/lib/**`).

### Goal

Ship one headless Svelte 5 `Pagination` component: a `<nav>` landmark of page
controls with previous/next, boundary and sibling windows around the current
page, and ellipsis truncation. Two interaction modes: **button mode** (SPA
state — bindable `page`, `onchange`) and **link mode** (`href(page)` renders
real anchors for URL-driven pagination). Pagination and Carousel share one
control chrome in the reference theme (the round icon-button treatment moves
to a shared partial) so the two read as siblings — while keeping their
distinct semantics: Pagination is a navigation landmark with
`aria-current="page"`; Carousel controls are widget buttons inside a group
(decided 2026-07-13 — no component-level reuse).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Pagination.svelte`, exported from the barrel; assertion
  in `exports.spec.ts`.
- Pages are **1-based**. `page` is `$bindable` (button mode); in link mode
  the consumer drives `page` from the URL and items render as `<a>`.
- Mirror existing patterns: `cx`, `...rest`-first spread on the root
  (managed attributes win), icon components (`IconChevronLeft/Right`),
  Carousel's `prevLabel`/`nextLabel` naming.

### Props

| Prop         | Type                          | Default             |
| ------------ | ----------------------------- | ------------------- |
| `count`      | `number`                      | _required_ (total pages) |
| `page`       | `number` (`$bindable`)        | `1`                 |
| `siblings`   | `number`                      | `1`                 |
| `boundaries` | `number`                      | `1`                 |
| `href`       | `(page: number) => string`    | — (⇒ button mode)   |
| `onchange`   | `(page: number) => void`      | —                   |
| `ariaLabel`  | `string`                      | `'Pagination'`      |
| `prevLabel`  | `string`                      | `'Previous page'`   |
| `nextLabel`  | `string`                      | `'Next page'`       |
| `pageLabel`  | `(page: number) => string`    | `` `Page ${page}` `` |
| `class`      | `string` (→ `cx`)             | —                   |

Plus arbitrary `...rest` forwarded onto the root `<nav>`.

### Requirements

1. **Pagination-R1 — Structure.** Renders
   `<nav class="hz-pagination" aria-label={ariaLabel}>` containing a single
   `<ul class="hz-pagination-list">`; every control is an `<li>`:
   - the previous control (`.hz-pagination-prev`, `IconChevronLeft`,
     `aria-label={prevLabel}`), first;
   - the page items in order (`.hz-pagination-page`, visible text = the page
     number, `aria-label={pageLabel(n)}`), with
     `<span class="hz-pagination-ellipsis" aria-hidden="true">…</span>`
     placeholders where ranges are elided;
   - the next control (`.hz-pagination-next`, `IconChevronRight`,
     `aria-label={nextLabel}`), last.

   Every control **composes `Button`** (Pagination-R6, amended 2026-07-13):
   chevrons as `variant="outline" intent="neutral" size="sm"` with the icon
   in `iconStart` and no children (Button's derived icon-only circle form,
   Button R4b); pages as `size="sm"` neutral `ghost` with the current one
   `solid`/`primary`. The current page carries `aria-current="page"` and
   `data-current` (via Button's rest).
2. **Pagination-R2 — Truncation.** Shows `boundaries` pages at each end and
   `siblings` pages on each side of the current page. When
   `count ≤ 2·boundaries + 2·siblings + 3` every page renders (no ellipsis).
   Otherwise the sibling window is clamped inward at the edges so the item
   count stays constant while paging (window size `2·siblings + 1`, anchored
   away from the boundaries), and a gap is elided **only when it spans two or
   more pages** — a gap of exactly one renders that page, never an ellipsis.
3. **Pagination-R3 — Button mode** (no `href`). Items render as `<button>`s
   (via Button); activating a page sets `page` (bindable) and calls
   `onchange(page)`; prev/next step by one. Activating the current page is a
   no-op (no `onchange`). At the ends, prev/next follow **Button's disabled
   contract** (aria-disabled, swallowed clicks — Button R9). `page` is not
   validated — out-of-range values clamp only the window arithmetic, never
   the prop.
4. **Pagination-R4 — Link mode** (`href` provided). Page items and prev/next
   are `<a href={href(n)}>` (Button's anchor rendering); the component
   performs **no** navigation and does not mutate `page` — the consumer
   re-renders from the URL. At the ends, prev/next are disabled Buttons —
   no `href` is computed, so they render without one and out of the tab
   order, keeping the slot without a dead link. `onchange` still fires on
   activation (without preventing navigation) for consumers that want both;
   the current page fires no `onchange`.
5. **Pagination-R5 — ARIA.** The `<nav>` landmark is named by `ariaLabel`;
   `aria-current="page"` marks the current item (link and button modes
   alike); ellipses are `aria-hidden`; icons are decorative. No roving
   tabindex — native Tab order over real links/buttons.
6. **Pagination-R6 — Controls are Buttons (amended 2026-07-13).** The
   interim `.hz-icon-button` shared-chrome class is **retired**: Carousel's
   prev/next and every Pagination control compose the `Button` component
   (`specs/01-button.md` R4/R4b — the `neutral` intent and the derived
   icon-only circle form were added for exactly this). Button owns the link/button duality, the
   disabled contract, sizing, and the intent-aware focus ring; component
   class hooks (`hz-carousel-prev`, `hz-pagination-page`, …) ride Button's
   `class` prop. `pagination.css` adds only the numeric sizing (`2rem`
   min-width, tabular numerals) and the muted ellipsis — the current-page
   fill is just Button `solid`/`primary`.
7. **Pagination-R7 — class & rest.** Root class
   `cx('hz-pagination', className)`; `...rest` spreads first on the `<nav>`;
   managed attributes win.
8. **Pagination-R8 — Barrel export.** `Pagination` exported from the barrel;
   `import { Pagination } from '$lib'` resolves; assertion + smoke render in
   `exports.spec.ts`.
9. **Pagination-R9 — Structural CSS only.** Scoped styles: the list as a
   flex row (`list-style` reset, token gap, wrap). All chrome is the
   theme's (controls.css + pagination.css, both in `@layer hz-theme`).

### Accessibility (WCAG 2.1 AA)

- A named `<nav>` landmark (2.4.1) — screen-reader users find it in the
  rotor; distinct `ariaLabel`s matter when a page hosts several.
- `aria-current="page"` announces the current position (4.1.2); page items
  carry full names via `pageLabel` ("Page 7"), so bare numbers aren't the
  accessible name.
- Ellipses are decorative (`aria-hidden`) — elided ranges are still
  reachable by stepping, and the boundary/sibling structure keeps targets
  predictable.
- Link mode keeps everything a real `<a>` (works without JS, middle-click,
  copy link); disabled end controls leave the accessibility tree entirely
  rather than announcing as dead links.

### Edge Cases & Error States

| Case                                  | Expected behavior                                                       |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `count={1}`                            | One page item, current; prev/next disabled (or placeholders in link mode). |
| `count={0}`                            | Empty list; prev/next disabled. Nothing throws.                           |
| `count` below the truncation threshold | All pages, no ellipsis (Pagination-R2).                                   |
| Gap of exactly one page                | The page renders, not an ellipsis (Pagination-R2).                        |
| `page` at an edge                      | Sibling window clamps inward; item count stays constant (Pagination-R2).  |
| Activating the current page            | No-op — no `page` write, no `onchange` (Pagination-R3).                   |
| `siblings={0}` / `boundaries={0}`      | Valid — minimal windows; arithmetic holds (Pagination-R2).                |
| `...rest` attempts `class`/`aria-label` | Component-managed value wins (Pagination-R7).                            |

### Test Plan

`Pagination.svelte.spec.ts` (browser project): structure (nav label, list,
prev → pages → next order, every control is a `.hz-button`); truncation —
all-pages case, ellipsis placement left/right/both, gap-of-one renders the
page, window clamping at edges keeps item count constant,
`siblings`/`boundaries` variations; button mode — click sets `page` +
`onchange`, current click no-op, ends aria-disabled with swallowed clicks;
link mode — hrefs from the callback, `aria-current` on current, disabled
ends render without an href; labels (`ariaLabel`, `prevLabel`/`nextLabel`,
`pageLabel`); class/rest managed-wins; export + smoke render. Carousel
suite: prev/next are `.hz-button` Buttons (composition regression guard).

### Out of Scope

- Page-size selectors, "showing X–Y of Z" summaries, jump-to-page inputs.
- Infinite scroll / load-more patterns.
- Keyboard shortcuts beyond native link/button behavior.
