# Virtualizer Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Virtualizer-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).
>
> Created 2026-07-14. Key decisions recorded inline (Context): **v1 supports
> variable row heights** — uniform (`itemHeight: number`), known-variable
> (`itemHeight: (item, index) => number`), and **runtime-measured**
> (`measure` + a ResizeObserver height cache) — because real lists are rarely
> uniform; the viewport **`height` prop is optional** — a fixed px value for
> deterministic/SSR-exact windowing, or **omitted for fluid mode** (the
> consumer sizes the viewport with CSS and the component measures its own box,
> Virtualizer-R14; revised same day — a fixed viewport can never grow with the
> screen); a **stable scrollbar gutter is shipped structurally**; and
> **Combobox integration is explicitly deferred** to a follow-up spec (Out of
> Scope). These are decisions, not open questions.

### Goal

Ship one headless Svelte 5 `Virtualizer`: a **windowing / virtual-list
primitive** that renders only the visible slice (plus an overscan margin) of a
potentially huge `items` array, so a list of thousands of rows costs a handful
of DOM nodes. It owns a native-scroll viewport, a full-height spacer that
preserves the real scrollbar geometry, and an offset-translated window of rows;
the consumer supplies the row markup via a `row` snippet that receives the item
and its **absolute** index. Row heights may be **uniform**, **known-variable**
(a height function), or **runtime-measured** (content-driven heights the
consumer cannot know ahead of time). Virtualizer is a **rendering optimization,
not a widget** — it ships only structural CSS and the functional inline
dimensions the windowing requires, carries **no ARIA role of its own**, and
leaves all semantics (list/listbox roles, `aria-setsize`/`aria-posinset`,
focusability) to the consumer via the row snippet and `...rest`.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript, **generic over the item type**
  (`<script lang="ts" generics="T">`, exactly as `Carousel.svelte`). One file:
  `src/lib/components/Virtualizer.svelte`, exported from the barrel; assertion +
  smoke render in `src/lib/exports.spec.ts`.
- **v1 scope (decision 2026-07-14):** vertical scrolling with **variable row
  heights** in three modes (Virtualizer-R2): uniform `number`, a per-item
  height **function**, or runtime **measured** heights seeded by an estimate.
  Horizontal scrolling, 2-D grids, sticky headers, infinite-load / windowed
  fetching, a reorder-safe key extractor, and an imperative `scrollToIndex` API
  are **Out of Scope** for v1.
- **Row snippet idiom.** The per-item slot is a **named `row` snippet**
  (`row: Snippet<[T, number]>`), matching the library's parameterized-item
  convention (`Carousel`'s `slide`, `Tabs`/`Accordion`'s `panel`) — **not** a
  default `children` snippet. It is invoked `{@render row(item, index)}` with
  the item's **absolute** index in `items` (not the window-local index), so
  consumers can compute `aria-posinset`, keys, or striping correctly
  (Virtualizer-R4/R8).
- **Viewport height: fixed prop OR fluid (decision 2026-07-14, revised same
  day).** `height` (px number) is **optional**. When provided it is applied
  inline to the scroll viewport and, with the resolved row heights, drives the
  window math deterministically — including a pixel-exact SSR first window.
  When **omitted** the viewport is **fluid**: the consumer constrains its
  height with CSS (`height: 100%` inside a sized parent, a flex track,
  `max-height`, media queries — whatever fits), and the component tracks its
  own box with the instance `ResizeObserver` and windows against the
  **measured** height (Virtualizer-R14). A breakpoint-style height *prop* was
  rejected: media-query logic belongs in the consumer's CSS, which fluid mode
  already honors. Fluid SSR / first paint renders a minimal `1 + overscan`
  window that resolves to the real window on mount — consumers who need exact
  SSR pass a numeric `height`. Per-**row** measurement (a different thing) is
  independently supported (Virtualizer-R2/R6).
- **Native scroll, no custom callback.** The viewport scrolls with the native
  scrollbar; native DOM events (including `onscroll`) flow through `...rest`.
  The component's **own** windowing scroll listener is attached with
  `addEventListener` inside an `$effect` (with cleanup), **not** as an inline
  `onscroll` attribute, so a consumer's `onscroll` passed via `...rest` is never
  clobbered — the same rationale as `Form.svelte`'s `addEventListener`-attached
  `reset` listener (`specs/14-form.md` Form-R5).
- Mirror existing patterns: `cx` from `$lib/utils`; `...rest`-first spread on the
  viewport (managed attributes win); generics + named item snippet per
  `Carousel.svelte`; `bind:this` viewport ref + `$effect` listener add/remove
  with cleanup per `Nav.svelte`.
- **Structural-CSS only, zero theme chrome (decision 2026-07-14).** The
  component ships **only** the structural CSS the windowing requires — the
  viewport's `overflow-y: auto`, `position: relative`, and
  **`scrollbar-gutter: stable`** (a layout-stability property, not chrome — it
  reserves the scrollbar track so toggling content never shifts row width); the
  sizer's block geometry; and the window's absolute offset positioning. The
  **dimensional** values (viewport `height`, sizer total height, window
  `translateY`, and known-mode row `height`) are **inline styles** computed from
  props/state, not tokens — they are functional and per-instance. There is
  **no** `theme/virtualizer.css` and **no** `--hz-*` chrome: the component
  renders only the consumer's row content, so it has no color, border, radius,
  or font surface.

### Props

| Prop         | Type                                             | Default    |
| ------------ | ------------------------------------------------ | ---------- |
| `items`      | `T[]`                                            | _required_ |
| `itemHeight` | `number \| ((item: T, index: number) => number)` | _required_ |
| `height`     | `number` (px)                                    | — (⇒ fluid) |
| `measure`    | `boolean`                                        | `false`    |
| `overscan`   | `number`                                         | `3`        |
| `row`        | `Snippet<[T, number]>`                           | _required_ |
| `class`      | `string` (→ `cx`)                                | —          |

- With `measure = false` (default), `itemHeight` is **authoritative** — a fixed
  px (uniform) or a per-item function (known-variable); the math is exact and
  the SSR first window is pixel-accurate.
- With `measure = true`, `itemHeight` is the **estimate/seed** for unmeasured
  rows (and SSR); rendered rows are measured and their real heights override the
  estimate (Virtualizer-R6).
- With `height` provided, the viewport extent is fixed and inline; **omitted**,
  the viewport is **fluid** — CSS-sized by the consumer and runtime-measured
  (Virtualizer-R14).

Plus arbitrary `...rest` HTML attributes forwarded onto the **scroll viewport**
`<div>` (managed attributes win; a forwarded `onscroll` / `tabindex` /
`role` / `aria-*` reaches the viewport).

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

1. **Virtualizer-R1 — Structure.** Renders three nested elements:
   - the **viewport** `<div class="hz-virtualizer">` (`cx('hz-virtualizer',
     className)`; `...rest` spread first) — the native-scroll container
     (`overflow-y: auto; position: relative; scrollbar-gutter: stable`),
     carrying the inline `style="height: {height}px"` **only when the `height`
     prop is provided**; in fluid mode (Virtualizer-R14) it has **no** inline
     height and is sized by the consumer's CSS;
   - inside it, the **sizer**
     `<div class="hz-virtualizer-sizer" style="height: {totalHeight}px">` where
     `totalHeight` is the sum of every row's resolved height (Virtualizer-R2) — a
     full-height spacer so the scrollbar thumb reflects the **entire** list, not
     just the rendered window;
   - inside the sizer, the **window**
     `<div class="hz-virtualizer-window" style="transform: translateY({offsetY}px)">`
     (absolutely positioned, `top: 0; inset-inline: 0`) holding **only** the
     rendered rows (Virtualizer-R4), pushed down by `offsetY` so each row sits at
     its true scroll position.

   The viewport is a plain `<div>` with **no** ARIA role, `tabindex`, or
   list/listbox semantics of its own (Virtualizer-R9).
2. **Virtualizer-R2 — Height model & offsets.** A resolver `heightOf(index)`
   yields each row's height:
   - `itemHeight` is a **number** → that constant for every row (uniform);
   - `itemHeight` is a **function** → `itemHeight(items[index], index)`
     (known-variable);
   - **measured mode** (`measure = true`) → the measured height from the cache
     if the row has been measured, else the estimate from `itemHeight` (number
     or function) as above (Virtualizer-R6).

   Offsets are the running prefix sums: `offset(0) = 0`,
   `offset(i) = offset(i - 1) + heightOf(i - 1)`, and
   `totalHeight = offset(n)` (`n = items.length`). `indexForOffset(y)` returns
   the largest `i` with `offset(i) <= y`. **Uniform fast path:** when
   `itemHeight` is a number **and** `measure` is false, every height is equal, so
   `offset(i) = i * itemHeight` and `indexForOffset(y) = Math.floor(y /
   itemHeight)` in O(1) with no offset array; the variable/measured modes build a
   cached prefix-sum array and **binary-search** `indexForOffset`. Rebuilding the
   array is required only from the first index whose height changed
   (Virtualizer-R6/R7).
3. **Virtualizer-R3 — Window math.** From the viewport's current `scrollTop`
   (`$state`, updated per Virtualizer-R5), the **effective viewport height**
   (`height` when provided, else the measured viewport height —
   Virtualizer-R14), `overscan`, and the offset model (Virtualizer-R2), derive
   (all `$derived`, recomputing when any input changes; `height` below means
   the effective height):
   - `first = indexForOffset(scrollTop)` — the first row intersecting the top
     edge;
   - `startIndex = Math.max(0, first - overscan)`;
   - `last` = the smallest index whose `offset(last + 1) >= scrollTop + height`
     (the row crossing the bottom edge), i.e. `indexForOffset(scrollTop +
     height)`;
   - `endIndex = Math.min(n, last + 1 + overscan)`;
   - `offsetY = offset(startIndex)`.

   The rendered slice is `items[startIndex … endIndex)`, always clamped to
   `[0, n]`, so an empty `items` renders zero rows, `offsetY = 0`, and
   `totalHeight = 0`.
4. **Virtualizer-R4 — Row rendering.** For each item in the rendered slice, in
   order, render `<div class="hz-virtualizer-row" data-index={absIndex}>`
   wrapping `{@render row(item, absIndex)}`, where `absIndex = startIndex + k`
   is the item's **absolute** index in `items`. Rows are keyed by `absIndex`
   (`{#each … as item, k (startIndex + k)}`) — index keying is correct for a
   rendering window and needs no consumer key extractor (Out of Scope). Row
   height:
   - **known mode** (`measure = false`) → the row carries an inline
     `style="height: {heightOf(absIndex)}px"` so it is exactly its resolved
     height;
   - **measured mode** (`measure = true`) → the row imposes **no** height (its
     height is intrinsic/content-driven) and is measured (Virtualizer-R6).
5. **Virtualizer-R5 — Scroll re-windowing.** On mount, an `$effect` attaches a
   `scroll` listener to the viewport via `addEventListener` (removed on
   cleanup). On scroll, the new `scrollTop` is committed to `$state` **coalesced
   with `requestAnimationFrame`**: a scroll event schedules (once) a rAF that
   reads `viewport.scrollTop` and updates the state, so multiple scroll events
   within a frame trigger a single re-window; a pending frame is cancelled on
   cleanup. The re-derived window (Virtualizer-R3) re-renders the rows and updates
   `offsetY`. Because the internal listener is added separately, a consumer
   `onscroll` passed via `...rest` still fires (Context). The initial `scrollTop`
   is `0`, so the first render (including SSR) shows the window from
   `startIndex = 0`.
6. **Virtualizer-R6 — Measured heights & scroll anchoring.** When
   `measure = true`, every rendered `.hz-virtualizer-row` is observed with a
   **`ResizeObserver`** (created once in an `$effect`, `observe`d per row via a
   Svelte action / `{@attach}` on the row, `unobserve`d when the row leaves the
   window, `disconnect`ed on component teardown). When an observed row's measured
   `borderBoxSize`/`offsetHeight` **differs** from its cached value, the cache
   (`Map<absIndex, number>`) is updated, offsets are rebuilt from that index
   (Virtualizer-R2), and `totalHeight` updates. Writes are **change-gated** (only
   on an actual delta) and read via `untrack` where needed to avoid a
   measure→state→re-render→measure feedback loop.
   - **Scroll anchoring:** if a measured row **above** the viewport top
     (`absIndex < first`) changes height by Δ, the content below would visually
     jump; the component compensates by setting `viewport.scrollTop += Δ` in the
     same frame so the visible rows stay put. A row at or below `first` growing
     reflows downward naturally (no compensation) but still updates
     `totalHeight`.
   - Unmeasured rows use the `itemHeight` estimate, so SSR / first paint renders
     an estimate-based first window that is **corrected on mount** once real
     heights are measured; a good estimate minimizes the post-mount shift.
7. **Virtualizer-R7 — Reactivity to `items` / `itemHeight` / `height` /
   `measure`.** The offset model (Virtualizer-R2), window (Virtualizer-R3), and
   `totalHeight` are `$derived`, so changing `items` (append, replace, shrink),
   `itemHeight`, `height`, or `measure` re-windows without any imperative call.
   When `items` **shrinks** so the current `scrollTop` exceeds the new
   `totalHeight`, the browser clamps the viewport's `scrollTop` natively as the
   sizer shrinks; the next rAF (Virtualizer-R5) re-reads the clamped value and
   the derived `startIndex`/`endIndex` stay within `[0, items.length]`, so
   **no** out-of-range item is ever dereferenced. In measured mode, replacing
   `items` **invalidates** the measurement cache for indices whose identity is
   no longer valid — for v1 the cache is keyed by **absolute index**, so a
   wholesale `items` replacement clears the cache and re-measures (documented
   limitation; a stable per-item key is Out of Scope).
8. **Virtualizer-R8 — Generic row typing.** The component is generic over `T`;
   `items: T[]`, `itemHeight: number | ((item: T, index: number) => number)`,
   and `row: Snippet<[T, number]>` share `T`, so the height function and row
   snippet receive a correctly-typed `item` and numeric absolute index with no
   `any`. Consumers get inference from the `items` they pass.
9. **Virtualizer-R9 — Role-neutral; consumer owns semantics.** The Virtualizer
   applies **no** `role`, `aria-*`, or `tabindex` to any element it renders. It
   is a rendering optimization, so:
   - **List/listbox semantics** (`role="list"`/`"listbox"` on a wrapper,
     `role="listitem"`/`"option"` on rows) are the consumer's, applied inside
     the `row` snippet (and/or via `role`/`aria-*` on the viewport through
     `...rest`).
   - Because windowing **elides** rows from the DOM, naive assistive-tech
     counting is wrong; consumers who need an accurate count/position **must**
     set `aria-setsize={items.length}` and `aria-posinset={index + 1}` on each
     row using the absolute `index` the snippet receives (Virtualizer-R4/R8).
     This guidance is documented on the docs page and in the Accessibility
     section.
   - **Focusability** of the scroll viewport is consumer-owned: the component
     sets no `tabindex`. A consumer who wants a keyboard-scrollable region adds
     `tabindex="0"` (and a `role`/label) via `...rest`; a consumer with
     focusable content inside rows relies on that content to drive scrolling.
10. **Virtualizer-R10 — class & rest.** Root class is
    `cx('hz-virtualizer', className)` — the base class first and never removable
    (no `class` → exactly `hz-virtualizer`; `class="foo"` → `hz-virtualizer
    foo`). `...rest` spreads **first** on the viewport so component-managed
    attributes (`class`, the inline `height` style) win over conflicting rest
    values; a forwarded `data-testid` / `onscroll` / `tabindex` / `role` /
    `aria-*` reaches the viewport. Rest does **not** land on the sizer, the
    window, or the rows.
11. **Virtualizer-R11 — Barrel export.** `Virtualizer` exported from
    `src/lib/components/index.ts`; `import { Virtualizer } from '$lib'` resolves;
    assertion + smoke render added to `src/lib/exports.spec.ts`.
12. **Virtualizer-R12 — Structural CSS only.** Scoped component styles carry
    **no** chrome (decision 2026-07-14): `.hz-virtualizer`
    (`overflow-y: auto; position: relative; scrollbar-gutter: stable`),
    `.hz-virtualizer-sizer` (`position: relative; width: 100%`),
    `.hz-virtualizer-window` (`position: absolute; top: 0; inset-inline: 0`).
    All dimensional values (viewport `height` — fixed mode only
    (Virtualizer-R14), sizer `height`, window `translateY`, known-mode row
    `height`) are **inline** styles from props/state, not tokens. `scrollbar-gutter: stable` is shipped as a
    layout-stability property (not chrome). There is **no**
    `theme/virtualizer.css` and no `--hz-*` reference — the component ships no
    color, border, radius, shadow, font, or animation, and adds nothing to
    `theme.css`.
13. **Virtualizer-R13 — Docs page.** A docs route
    `src/routes/layout/virtualizer/+page.svelte` per `specs/16-docs.md` R6
    (docs write scope: `src/routes/layout/virtualizer/` and a
    `src/docs/manifest.ts` entry — outside the library source): a single `<h1>`
    "Virtualizer", a one-line description, the import snippet
    (`import { Virtualizer } from '@hyzer-labs/ui'`), one or more **live**
    `Example` demos rendering the real component — a large uniform list (e.g.
    10,000 rows) proving only a handful of DOM nodes exist; a **known-variable**
    demo (an `itemHeight` function); a **measured** demo (`measure` with
    wrapping text of unknown height); and a demo that sets `role="list"` +
    `aria-setsize` / `aria-posinset` to show the semantics guidance — a
    `PropsTable` sourced from the Props table above, a supporting **type note**
    for the `itemHeight` union and the `row` snippet signature
    (`Snippet<[item, index]>`), and an accessibility note covering the
    role-neutral design and the `aria-setsize`/`aria-posinset` consumer
    responsibility (Virtualizer-R9). A
    `{ label: 'Virtualizer', href: '/layout/virtualizer' }` entry is added to
    the **Layout** section of `src/docs/manifest.ts` (placed after `Split`),
    keeping the
manifest↔exports parity enforcement satisfied (`specs/16-docs.md` R14 —
exports.spec.ts + the docs e2e route pass).
    **Section choice (decision 2026-07-14):** Virtualizer joins the existing
    **Layout** section — it is a headless structural container primitive with no
    visual chrome, in the same family as `Container`/`Stack`/`Grid`/`Split`;
    spinning up a one-item "Utilities" section would leave an orphan IA node.
    Revisit if more low-level utility primitives arrive. The page also includes
    a **fluid-height demo** (Virtualizer-R14): a `Virtualizer` with no `height`
    prop, CSS-sized (e.g. `height: 100%` inside a container the user can see is
    driving the size, or a viewport-relative height), plus the guidance note
    that a fluid viewport **must** be height-constrained by CSS — an
    unconstrained `overflow: auto` box grows to its content and windowing
    degenerates to rendering nearly everything.
14. **Virtualizer-R14 — Fluid viewport height.** When the `height` prop is
    **omitted**:
    - the viewport carries **no inline height** (Virtualizer-R1); the consumer
      constrains it via CSS (a sized parent + `height: 100%`, a flex track,
      `max-height`, media queries);
    - a `viewportHeight` `$state` (seeded `0`) is kept current by observing the
      **viewport element itself** with the instance's `ResizeObserver` — the
      **same** observer as Virtualizer-R6, its callback branching on
      `entry.target` (viewport vs. row) — reading the border-box height,
      **change-gated** like row measurements; the window math (Virtualizer-R3)
      uses `height ?? viewportHeight`;
    - **SSR / first paint** (measured height still `0`) renders the minimal
      window `items[0 … min(n, 1 + overscan))`; the observer's initial
      callback on mount delivers the real height and the full window renders —
      no magic fallback constant. Consumers needing an exact SSR window pass a
      numeric `height`;
    - any later viewport resize (window resize, breakpoint change, parent
      reflow) re-windows automatically through the same observation;
    - when `height` **is** provided, the viewport is **not** observed and
      behavior is exactly the fixed-height contract (deterministic,
      SSR-exact). The viewport observation is independent of `measure` — fluid
      mode works with all three row-height modes.

### Responsive Behavior

- The Virtualizer is width-fluid: the viewport fills its container's width at
  **all** breakpoints (mobile `<640px`, tablet `640–1024px`, desktop `>1024px`);
  rows span the viewport width. The component ships no breakpoint-specific CSS.
- Viewport height is responsive through **fluid mode** (Virtualizer-R14): omit
  `height` and size the viewport with CSS — `height: 100%` in a sized parent, a
  flex track, or per-breakpoint heights in a media query — and the component
  re-windows as its measured box changes, so a taller screen shows more rows.
  A numeric `height` opts into fixed, SSR-exact windowing instead.
- **Measured mode** naturally absorbs responsive **row** reflow: when a narrower
  viewport makes text wrap taller, the per-row `ResizeObserver` re-measures and
  offsets/`totalHeight` update (Virtualizer-R6). Horizontal scrolling / windowing
  is Out of Scope; long row content is the consumer's layout concern.

### Accessibility (WCAG 2.1 AA)

- The Virtualizer is **role-neutral by design** (Virtualizer-R9): it is a
  rendering optimization, not an interactive widget, so it imposes no role,
  state, or focus behavior that could conflict with the pattern the consumer is
  building (4.1.2). All semantics are the consumer's, applied through the `row`
  snippet and `...rest`.
- Because windowing **removes** off-screen rows from the DOM, any
  count-dependent semantics must be supplied explicitly: consumers set
  `aria-setsize={items.length}` and `aria-posinset={index + 1}` on each row
  using the absolute index the snippet provides, so screen readers announce
  "item N of TOTAL" correctly despite the elided DOM (1.3.1, 4.1.2). The docs
  page demonstrates this.
- **Keyboard:** the component adds no key handling and no `tabindex`. A
  keyboard-scrollable viewport (`tabindex="0"` + an accessible `role`/name) is
  opt-in via `...rest`; focusable content inside rows drives scrolling
  naturally. No keyboard trap is introduced (2.1.1, 2.1.2).
- **Motion:** the component ships **no** animation — windowing is an instant
  `transform` and scrolling is native — so there is nothing to gate under
  `prefers-reduced-motion` (2.3.3). Measured-mode scroll anchoring
  (Virtualizer-R6) is an instant `scrollTop` correction, not an animation. Any
  motion inside a consumer's row snippet is the consumer's concern.
- **Focus management caveat:** virtualization can scroll a focused element out
  of the DOM (a known windowing hazard). Patterns that rely on a persistently
  focused off-screen row (e.g. `aria-activedescendant` combobox listboxes) must
  keep the active row rendered — see the Combobox integration deferral (Out of
  Scope) rather than reaching for the raw Virtualizer.
- Color contrast: N/A — the component ships no colors (Virtualizer-R12).

### Edge Cases & Error States

| Case                                          | Expected behavior                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `items` empty                                 | `totalHeight = 0`; zero rows rendered; `offsetY = 0`; the empty viewport still renders (Virtualizer-R3). |
| `items.length` smaller than a full window     | All items render (`startIndex = 0`, `endIndex = n`); overscan clamps to the array (Virtualizer-R3).    |
| Scrolled to the bottom                        | `endIndex` clamps to `n`; the last row sits flush at `totalHeight`; no phantom rows past the end.       |
| `items` shrinks while scrolled past new end   | Browser clamps `scrollTop` as the sizer shrinks; next rAF re-windows; indices stay in range (R7).      |
| `itemHeight` (number) changes                 | Uniform fast path re-derives `totalHeight`, window, `offsetY`; rows re-lay-out (R2/R7).                 |
| `itemHeight` is a function                    | Per-row heights resolve from the function; offsets are a prefix-sum with binary-search windowing (R2). |
| `measure` true, row taller/shorter than estimate | ResizeObserver updates the cache, rebuilds offsets, updates `totalHeight`; a row above the viewport top anchors scroll so visible rows don't jump (R6). |
| `measure` true, SSR / first paint             | First window renders from the `itemHeight` estimate; measured heights correct it on mount (R6).        |
| `measure` true, viewport width change reflows rows | Per-row RO re-measures; offsets/`totalHeight` update (R6, Responsive).                             |
| `measure` true, `items` replaced wholesale    | Index-keyed cache clears and re-measures (documented v1 limitation — no stable per-item key) (R7).     |
| `height` changes                              | Visible span re-derives; more/fewer rows render (R3/R7).                                                |
| `height` omitted (fluid), viewport resizes    | The viewport ResizeObserver re-measures; window re-derives — more rows on a taller box (R14).           |
| `height` omitted, SSR / first paint           | Minimal `1 + overscan` window renders; the observer's initial callback resolves the real window on mount (R14). |
| `height` omitted, viewport not CSS-constrained | The `overflow: auto` box grows to its content and windowing degenerates — consumer error, documented on the docs page (R14). |
| `overscan = 0`                                | Only strictly-visible rows render; no margin (R3).                                                      |
| Rapid scroll (many events per frame)          | rAF coalesces to one re-window per frame; overscan absorbs the transient (R5).                          |
| Consumer passes `onscroll` via `...rest`      | Fires on every native scroll; the internal windowing listener still runs (both attached) (R5/R10).     |
| Consumer sets `role`/`tabindex`/`aria-*` on the viewport via rest | Applied to the viewport; the component overrides none of them (R9/R10).            |
| `...rest` attempts `class` / inline `height` style | Component-managed value wins (R10).                                                             |
| SSR / pre-mount                               | Static markup renders the first window (`scrollTop = 0`, `startIndex = 0`) from the `height` prop and the resolved/estimated heights; the scroll listener, rAF, and (measured mode) ResizeObserver attach on mount (R5/R6). |

### Existing Code to Reuse

- **Generics + named item snippet:** `Carousel.svelte`
  (`generics="T"`, `slide: Snippet<[T, number]>`, `$bindable`, `...rest` with
  `[key: string]: unknown`) — mirror its generic + snippet shape for `items` /
  `row` (Virtualizer-R8). `Tabs`/`Accordion` `panel` snippets are the same
  idiom.
- **Utils:** `cx` from `src/lib/utils` (Virtualizer-R10) — no new class-merge
  logic. (`uid` is not needed — the component emits no id relationships.)
- **Listener plumbing:** `Nav.svelte` (`bind:this` element ref, `$effect`
  listener add/remove with cleanup) and `Form.svelte`'s
  `addEventListener`-attached listener rationale (Form-R5) — attach the internal
  `scroll` listener (and the `ResizeObserver` lifecycle) separately so a consumer
  `onscroll` via `...rest` survives (Virtualizer-R5/R6).
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` (Virtualizer-R11).
- **Docs scaffold:** `src/docs/DocPage.svelte`, `Example.svelte`,
  `PropsTable.svelte` (with `PropRow`), and `Stack` from `$lib`, mirroring an
  existing layout docs page such as `src/routes/layout/grid/+page.svelte`
  (Virtualizer-R13).
- **Test harness:** mirror `Carousel.svelte.spec.ts` / `Tabs.svelte.spec.ts` —
  Vitest browser mode (`vitest-browser-svelte`: `render`, `page.getBy*`,
  `await expect.element`, `createRawSnippet` for the `row` snippet, `userEvent`
  from `vitest/browser`). Scroll, `scrollTop`, ResizeObserver measurement, and
  the rAF re-window are asserted in the real browser env.
  `expect.requireAssertions` is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file
`src/lib/components/Virtualizer.svelte.spec.ts` (the `.svelte.spec.ts` suffix
routes to the browser `client` project in `vite.config.ts`). Scroll geometry,
`scrollTop`-driven re-windowing, per-row measurement, and the rAF coalescing are
asserted in the real browser env. No Playwright e2e (docs demos are a later
sprint).

**Unit / component (browser):**

- **Structure & uniform window math (Virtualizer-R1/R2/R3):** with a known
  `items.length`, numeric `itemHeight`, `height`, and `overscan`, the viewport
  (`.hz-virtualizer`) has the inline `height` and `scrollbar-gutter: stable`; the
  sizer height equals `items.length * itemHeight`; the rendered row count equals
  `min(n, visibleCount + overscan)` at the top; the first row's `data-index` is
  `0`; the window `translateY` is `0`.
- **Overscan (Virtualizer-R3):** after scrolling into the middle, the rendered
  slice spans `[first - overscan, last + 1 + overscan)` (assert first/last
  `data-index`); `overscan = 0` renders exactly the visible rows.
- **Known-variable heights (Virtualizer-R2):** an `itemHeight` **function**
  returning different heights per index → the sizer height equals the sum of all
  heights; a row's inline height matches the function; `offsetY` at a scrolled
  position equals the prefix-sum offset of `startIndex` (binary-search
  windowing).
- **Measured heights (Virtualizer-R6):** with `measure = true` and rows whose
  real height differs from the estimate, after mount the sizer height reflects
  **measured** totals; a row above the viewport growing triggers a `scrollTop`
  compensation so the visible first `data-index` is unchanged (no jump);
  change-gating avoids an infinite measure loop (render settles).
- **Scroll re-windowing (Virtualizer-R5):** setting `viewport.scrollTop` and
  dispatching a `scroll` event re-renders the window — the first rendered
  `data-index` and the window `translateY` (`= offset(startIndex)`) update to
  match; rapid successive scrolls settle to one correct final window (rAF
  coalescing).
- **Items-change re-clamp (Virtualizer-R7):** scrolling near the end and then
  **shrinking** `items` re-windows with all `data-index` values `< items.length`
  (no out-of-range render); growing/replacing `items` re-derives the sizer
  height; in measured mode a wholesale replace clears the cache and re-measures.
- **`itemHeight` / `height` change (Virtualizer-R2/R7):** changing a numeric
  `itemHeight` updates sizer height, row heights, and visible count; changing
  `height` changes the number of rendered rows.
- **SSR first window (Virtualizer-R5):** the initial (pre-scroll) render — or a
  server render — contains exactly the first-window rows starting at
  `data-index="0"`, sized from the `height` prop and resolved/estimated heights
  with no measurement.
- **Row snippet receives item + absolute index (Virtualizer-R4/R8):** the `row`
  snippet renders content derived from both the item and its index; after
  scrolling, a mid-list row shows its **absolute** index; generic typing infers
  `T` from `items` (the height function receives the typed item).
- **Empty & tiny lists (Virtualizer-R3):** `items = []` → zero rows, sizer height
  `0`; `items.length < visibleCount` → all rows render, `startIndex = 0`.
- **Fluid viewport height (Virtualizer-R14):** with `height` omitted and the
  viewport CSS-sized (a fixed-height wrapper + `height: 100%` via `class`), no
  inline height style is present, and after mount the rendered row count
  matches the wrapper-driven viewport height; growing/shrinking the wrapper
  re-windows (more/fewer rows) without any scroll event; the pre-measure first
  render contains exactly the minimal `1 + overscan` window; a numeric `height`
  alongside (fixed mode) never observes the viewport (row count is unaffected
  by wrapper resize).
- **class & rest (Virtualizer-R10):** no `class` → exactly `hz-virtualizer`;
  `class="foo"` appended; a forwarded `data-testid` reaches the viewport; a
  consumer `onscroll` in `...rest` fires **and** the window still updates; a
  consumer `role`/`tabindex`/`aria-label` on the viewport is applied and not
  overridden.
- **Export (Virtualizer-R11):** extend `exports.spec.ts` to assert `Virtualizer`
  resolves from `$lib` (+ smoke render).

### Out of Scope

- **Horizontal scrolling, 2-D grids, and sticky headers** — vertical windowing
  only in v1.
- **A stable per-item key for the measurement cache** — the cache is keyed by
  absolute index, so a wholesale `items` replacement clears and re-measures
  (Virtualizer-R7). A `getKey` extractor that preserves measurements across
  reorders/replacements is a later addition.
- **Infinite-load / windowed data fetching, `onReachEnd`, and loading rows** —
  `items` is a fully-materialized array the consumer owns; the component never
  fetches.
- **`scrollToIndex` / imperative scroll API, scroll-restoration, and
  scroll-anchoring beyond the measured-mode above-viewport compensation
  (Virtualizer-R6)** — native scrollbar only in v1.
- **Combobox / listbox integration (deferred, decision 2026-07-14).** Wiring the
  Combobox (`specs/22-combobox.md`) listbox to render its options through the
  Virtualizer is a **follow-up spec**, not this one. The reason it is deferred
  rather than free: a virtual-focus combobox tracks the active option via
  `aria-activedescendant`, which requires the active option's `<li>` to be
  **present in the DOM** — but windowing elides off-screen rows, so the active
  row can be scrolled out of existence; and the Combobox keys option ids off the
  **filtered** index, which must stay reconciled with the Virtualizer's absolute
  index. The intended future direction: a dedicated spec that (a) forces the
  active option to always render within the window, (b) reconciles filtered ↔
  absolute indices, and (c) drives `scrollIntoView` through the Virtualizer's
  scroll offset. Until then, Combobox does **not** virtualize (Combobox Out of
  Scope), and consumers should not hand a `role="option"` combobox listbox to
  the raw Virtualizer.
- **Colors, borders, radius, fonts, and animation** — the component ships only
  functional structural CSS plus `scrollbar-gutter: stable` (Virtualizer-R12);
  any visual treatment of the scroll region is the consumer/theme's job.
- **Docs demo Playwright e2e** — later sprint (Virtualizer-R13 ships the page
  and manifest entry; the browser unit suite covers behavior).
