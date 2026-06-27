# Accordion Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Accordion-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).

### Goal

Ship one headless, accessible Svelte 5 `Accordion` built on native
`<details>`/`<summary>` — supporting single/multiple expand modes, an optional
non-collapsible mode, a configurable heading level, disabled items, an
`onToggle` callback, and enhanced arrow-key navigation — exposing `hz-*` class /
`data-*` hooks and shipping only the **minimal structural CSS** the regions need
and **no** visual opinions (no colors, borders, shadows, radius, fonts, or
animation).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Accordion.svelte`.
- Exported from `src/lib/components/index.ts`, resolvable via
  `import { Accordion } from '$lib'`; assertion added to `src/lib/exports.spec.ts`.
- Headless conventions (`original-specs/00-architecture.md`): root gets
  `class="hz-accordion"`, `data-type`; each item gets `data-state`,
  `data-disabled`. Mirror `Card.svelte`/`Nav.svelte` for `$props()`
  destructuring, `class: className` via `cx`, `...rest`-first spread (managed
  attributes win), and `$effect` listener cleanup.
- **Structural-CSS exception** (same justification as Card/Nav in
  `original-specs/00-architecture.md`): Accordion ships **minimal structural**
  CSS in a scoped `<style>` — the summary as a flex row and removal of the
  default disclosure marker (`::-webkit-details-marker` / `list-style`). It ships
  **no** colors, borders, shadows, border-radius, fonts, icon-rotation, or panel
  animation. Critically, it ships **no** `display`/`overflow`/`height` rule on
  `hz-accordion-panel` (so the theme can animate it — see Theming Hooks). Any
  shipped spacing references `--hz-space-*` tokens **with literal fallbacks**
  (Shared Scale in `specs/03-layout.md`).
- IDs via `uid` from `$lib/utils` — one stable `name` group id per instance,
  matching `Nav.svelte`'s `uid` usage; per-item ids (where needed) via a
  `WeakMap` keyed on the item object (mirror `Nav.svelte`'s `_idCache`) so ids
  survive reactive re-derivation.
- Icon: `IconChevronDown` from `$lib/icons` (decorative, `aria-hidden`), with an
  optional consumer override snippet matching `Nav.svelte`'s `chevronIcon`.
- Dev warnings use the `import.meta.env.DEV` + `untrack(...)` pattern from
  `Button.svelte`/`Card.svelte`.

### Props

| Prop           | Type                                    | Default    |
| -------------- | --------------------------------------- | ---------- |
| `items`        | `AccordionItem[]`                       | _required_ |
| `type`         | `'single' \| 'multiple'`                | `'single'` |
| `defaultOpen`  | `string \| string[]`                    | `[]`       |
| `collapsible`  | `boolean`                               | `true`     |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6`                  | `3`        |
| `panel`        | `Snippet<[AccordionItem]>`              | _required_ |
| `icon`         | `Snippet` (optional override)           | —          |
| `onToggle`     | `((openIds: string[]) => void) \| undefined` | —     |
| `class`        | `string` (optional → `cx`)              | —          |

`AccordionItem` (declared **locally**, no new shared type):
`{ id: string; title: string; disabled?: boolean }`.

Plus arbitrary `...rest` HTML attributes forwarded to the root `<div>`.

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not rendered.

**Structure & rendering**

1. **Accordion-R1 — Root.** Renders a `<div class="hz-accordion">` carrying
   `data-type` reflecting `type` verbatim (`"single"` | `"multiple"`). One
   `<details>` per `items` entry, in array order, keyed by array index.
2. **Accordion-R2 — Item.** Each item renders
   `<details class="hz-accordion-item">` containing a
   `<summary class="hz-accordion-trigger">` and a
   `<div class="hz-accordion-panel">`. The panel always renders inside `details`
   (native show/hide drives visibility), so basic expand/collapse works **without
   JavaScript** (progressive enhancement). The component ships no CSS that hides
   or sizes the panel itself (Theming Hooks).
3. **Accordion-R3 — Heading.** The summary contains a heading element whose tag
   is `h{headingLevel}` (default `h3`), `class="hz-accordion-heading"`, wrapping
   `item.title`. The chevron icon is a **sibling** of the heading
   (`<span class="hz-accordion-icon" aria-hidden="true">`), outside the heading,
   for clean screen-reader output. The dynamic tag is rendered via
   `<svelte:element this={...}>`.
4. **Accordion-R4 — Panel content.** The required `panel` snippet is invoked with
   the item as its single argument (`{@render panel(item)}`) inside
   `hz-accordion-panel`, so one render callback serves every item and can branch
   on `item.id`.
5. **Accordion-R5 — Icon.** `hz-accordion-icon` renders the `icon` snippet when
   provided, else `IconChevronDown` (no `ariaLabel`, so it is `aria-hidden`). The
   span itself carries `aria-hidden="true"`. No rotation/animation CSS is shipped
   (theme concern).

**Behavior**

6. **Accordion-R6 — Single-expand grouping.** When `type="single"`, every
   `<details>` gets `name="hz-accordion-{uid}"` (one shared id per instance) so
   the browser natively allows only one open at a time. When `type="multiple"`,
   no `name` attribute is set and items open independently.
7. **Accordion-R7 — Per-item state.** Each `<details>` carries
   `data-state="open"` when open and `data-state="closed"` when closed, kept in
   sync with the native open state via the `toggle` event so it updates
   **synchronously** with open/close (enabling CSS-only theme transitions — see
   Theming Hooks). The native `open` attribute is present on initially-open
   items (R8).
8. **Accordion-R8 — defaultOpen.** `defaultOpen` seeds initial open state: a
   `string` or `string[]` of item ids, normalized to a set. For `type="single"`,
   only the **first** matching id is honored (one open item); for
   `type="multiple"`, all matching ids open. Ids not present in `items` are
   silently ignored. An item whose id is in the set renders with the native
   `open` attribute and `data-state="open"`.
9. **Accordion-R9 — Single-expand JS fallback.** For browsers that do not support
   `<details name>` exclusivity, a `toggle`-event listener closes the other items
   in the group when one opens (only when `type="single"`). The listener is a
   no-op when the browser already enforced exclusivity (closing an
   already-closed sibling is harmless). Registered/removed via `$effect` cleanup
   (mirror `Nav.svelte`'s listener pattern).
10. **Accordion-R10 — Non-collapsible.** When `collapsible={false}` **and**
    `type="single"`, the currently-open item cannot be closed by activating its
    own summary — there is always exactly one open item. Implemented by
    intercepting the open item's `toggle`/click and reopening / `preventDefault`-ing
    it. `collapsible={false}` has **no effect** when `type="multiple"` (every
    item is independently collapsible).
11. **Accordion-R11 — Disabled items.** An item with `disabled: true` renders
    `data-disabled` on the `<details>` and `aria-disabled="true"` on the
    `<summary>`. A click/keydown handler calls `preventDefault()` so it cannot
    toggle. The item stays in the DOM and its summary stays focusable (so
    screen-reader users know it exists) but it cannot be opened or closed. A
    disabled item listed in `defaultOpen` still renders open (disabled blocks
    toggling, not initial state).
12. **Accordion-R12 — onToggle callback.** `onToggle?: (openIds: string[]) => void`
    fires after any user-driven open-state change (a summary toggle, an exclusive
    auto-close from R6/R9, or a non-collapsible switch from R10), receiving the
    ids of all currently-open items in DOM order. It does **not** fire on initial
    mount for `defaultOpen`. When omitted, no callback is invoked.

**Keyboard**

13. **Accordion-R13 — Native activation.** Native `<summary>` handles Enter and
    Space to toggle the focused item; the component does not override these
    (except the disabled/non-collapsible guards in R10/R11).
14. **Accordion-R14 — Roving arrow navigation.** A `keydown` handler on each
    summary moves focus between **summaries** (triggers); disabled summaries
    remain focus stops (not skipped):

    | Key        | Action                                  |
    | ---------- | --------------------------------------- |
    | Arrow Down | Focus next summary (clamps at last)     |
    | Arrow Up   | Focus previous summary (clamps at first)|
    | Home       | Focus first summary                     |
    | End        | Focus last summary                      |

    Arrow/Home/End call `preventDefault()` to suppress native scroll. Focus
    targeting uses the rendered summary elements (mirror `Nav.svelte`'s
    `triggerEls` `bind:this` array). Focus clamps at the ends (no wrap).

**Composition**

15. **Accordion-R15 — class composition.** Root `class` is
    `cx('hz-accordion', className)`: `hz-accordion` first and never removable. No
    `class` → exactly `hz-accordion`; `class="foo bar"` → `hz-accordion foo bar`.
16. **Accordion-R16 — rest forwarding.** `...rest` forwards onto the root
    `<div>`, spread first so managed attributes (`class`, `data-type`) cannot be
    clobbered.
17. **Accordion-R17 — Dev warning.** Under `import.meta.env.DEV` (read once via
    `untrack(...)`, per `Card.svelte`), emit a single `console.warn` if `items`
    contains duplicate `id` values (state/keying is ambiguous). Unknown
    `defaultOpen` ids do **not** warn (silently ignored, R8). No warning in
    production builds.
18. **Accordion-R18 — barrel export.** `Accordion` exported from
    `src/lib/components/index.ts`; `import { Accordion } from '$lib'` resolves;
    assertion added to `exports.spec.ts`.

### Theming Hooks (animation overridability)

The component ships **no** panel animation but guarantees the hooks a consumer or
the reference theme needs to add one in CSS only:

- A stable `hz-accordion-panel` element inside every `<details>` (R2), and a
  **synchronous** `data-state="open" | "closed"` on the `<details>` (R7).
- The component ships **no** `display`/`overflow`/`height`/`content-visibility`
  rule on `hz-accordion-panel`, so it never fights a theme transition.

Supported consumer-side animation strategies (illustrative, not shipped):

- **Modern:** transition the native `::details-content` pseudo-element using
  `interpolate-size: allow-keywords` (height `0 → auto`) plus
  `transition-behavior: allow-discrete` for `content-visibility`.
- **Broad support:** target `hz-accordion-panel` and transition
  `grid-template-rows: 0fr → 1fr`, keyed off `[data-state='open']`.

Either way the theme gates duration behind `prefers-reduced-motion: reduce`
(collapsing to `0ms`).

### Responsive Behavior

- The accordion is a full-width block at **every** breakpoint
  (mobile `<640px`, tablet `640–1024px`, desktop `>1024px`): each `<details>`
  spans the container width; the summary is a flex row with the heading taking
  available space and the icon at the end.
- No region hides, reflows, or changes interaction pattern across breakpoints —
  layout is content/container driven. Long titles wrap; the icon stays aligned to
  the start (top) of the summary row, not vertically centered against wrapped
  multi-line text (theme may override).
- Width and any minimum touch-target sizing for the summary are theme concerns;
  the component ships no breakpoint-specific CSS.

### Accessibility (WCAG 2.1 AA)

- Native `<details>`/`<summary>` give the open/closed disclosure semantic;
  screen readers announce "expanded"/"collapsed" without custom ARIA (1.3.1,
  4.1.2).
- The heading element (`h2`–`h6` per `headingLevel`) maintains the document
  outline; the icon sits outside the heading so the heading's accessible name is
  exactly the title (1.3.1, 2.4.6).
- The `name` attribute provides native exclusive-accordion behavior without
  custom ARIA (R6).
- Disabled items: `aria-disabled="true"`, focusable but non-activatable (R11), so
  they remain discoverable (4.1.2).
- Keyboard: Enter/Space toggles (native, R13); Arrow/Home/End move between
  triggers (R14); focus order matches DOM/visual order (2.1.1, 2.4.3).
- Basic expand/collapse works without JavaScript (progressive enhancement); JS
  only enhances single-expand exclusivity, non-collapsible, disabled guards,
  `onToggle`, and arrow navigation.
- The chevron icon is `aria-hidden` (decorative) — `IconChevronDown` gets no
  `ariaLabel` (1.1.1).
- No `outline: none` / focus suppression anywhere; visible focus is a theme
  concern but must not be removed.
- Reduced motion: the component ships no animation; any theme-layer panel
  transition must respect `prefers-reduced-motion` (see Theming Hooks).
- Color contrast: N/A (no colors shipped).

### Edge Cases & Error States

| Case                                              | Expected behavior                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `items` empty                                     | Root `<div.hz-accordion>` renders with no `<details>` children; no error (R1).                  |
| `defaultOpen` id not in `items`                   | Ignored; no item opened for it; no dev warning (R8, R17).                                       |
| `defaultOpen` is a `string[]` with `type="single"`| Only the first id that matches an item opens; the rest are ignored (R8).                        |
| `defaultOpen` is a bare `string`                  | Normalized to a single-id set (R8).                                                             |
| Disabled item in `defaultOpen`                    | Renders open; still cannot be toggled by the user (R8, R11).                                    |
| `collapsible={false}`, user clicks the open item  | Item stays open; `toggle`/click prevented; another item must be opened to switch (R10).         |
| `collapsible={false}` with `type="multiple"`      | No effect; every item independently collapsible (R10).                                          |
| Click/Enter/Space on a disabled summary           | No toggle; `data-state` unchanged; `onToggle` does not fire (R11, R12, R13).                    |
| Arrow Down on last / Arrow Up on first summary    | Focus stays put (clamped, no wrap) (R14).                                                       |
| `icon` snippet omitted                            | `IconChevronDown` renders as the default (R5).                                                  |
| Duplicate ids in `items`                          | Dev `console.warn` once (R17); items still render keyed by index; state for the duplicate is a documented consumer error. |
| `onToggle` omitted                                | No callback invoked on any toggle (R12).                                                        |
| SSR / pre-mount                                   | Static markup renders (panels visible per `open`); `toggle`/keydown listeners attach on mount (R9, R14). |
| `...rest` attempts `class` / `data-type`          | Component-managed value wins (R16).                                                             |

### Existing Code to Reuse

- **Utils:** `cx` and `uid` from `src/lib/utils` (R15, R6) — do not write new
  class-merging or id logic. Per-item ids (where needed) use a `WeakMap` keyed on
  the item object, mirroring `Nav.svelte`'s `_idCache`.
- **Icons:** `IconChevronDown` from `$lib/icons` for the chevron (R5) — do not
  inline new SVG.
- **Component pattern:** mirror `src/lib/components/Card.svelte` (region wrappers
  + `$props()` + `...rest`-first spread + `import.meta.env.DEV`/`untrack` dev
  warning) and `src/lib/components/Nav.svelte` (`$effect` add/remove listeners
  with cleanup, `bind:this` element arrays for focus management, `uid` ids,
  `chevronIcon` snippet override → `icon`).
- **Tokens:** `--hz-space-*` with literal fallbacks, per the Shared Scale in
  `specs/03-layout.md`.
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` to include `Accordion`.
- **Test harness:** `Nav.svelte.spec.ts` / `Card.svelte.spec.ts` — Vitest browser
  mode (`vitest-browser-svelte`: `render`, `page.getBy*`, `await expect.element`,
  `createRawSnippet` for snippet props, `userEvent` from `vitest/browser`).
  `expect.requireAssertions` is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file
`src/lib/components/Accordion.svelte.spec.ts` (the `.svelte.spec.ts` suffix
routes to the browser `client` project in `vite.config.ts`). Native `<details>`
`toggle`/`open` behavior is asserted in the real browser env. No Playwright e2e
(docs demos are a later sprint).

**Unit / component (browser):**

- Accordion-R1/R2: defaults → `<div.hz-accordion data-type="single">` with one
  `<details.hz-accordion-item>` per item, each containing a
  `summary.hz-accordion-trigger` and `div.hz-accordion-panel`.
- Accordion-R3: heading tag equals `h{headingLevel}` for each of `2..6`; heading
  text is `item.title`; the icon span is a sibling (not a child) of the heading.
- Accordion-R4: `panel` snippet receives the item — assert per-item branched
  content renders in the correct panel.
- Accordion-R5: default → `IconChevronDown` present and `aria-hidden`; with an
  `icon` snippet → the override renders instead.
- Accordion-R6: `type="single"` → all `<details>` share one `name`;
  `type="multiple"` → no `name` attribute.
- Accordion-R7: opening an item flips its `data-state` to `"open"` via `toggle`;
  closing flips to `"closed"`.
- Accordion-R8: `defaultOpen` as string and as array → correct items render
  `open`; single mode honors only the first; unknown ids ignored.
- Accordion-R9: `type="single"` → opening item B closes already-open item A
  (assert via `data-state`/`open`).
- Accordion-R10: `collapsible={false}` single → clicking the open item keeps it
  open; opening another switches the single open item; `type="multiple"` →
  `collapsible={false}` has no effect.
- Accordion-R11: disabled item → `data-disabled` + `aria-disabled="true"`;
  click/Enter/Space does not toggle; summary is still focusable; disabled +
  `defaultOpen` renders open but cannot be closed.
- Accordion-R12: `onToggle` spy receives the open-id array on user toggles, in
  DOM order; reflects exclusive auto-close in single mode; does not fire on mount.
- Accordion-R13: Enter and Space on a non-disabled summary toggle it.
- Accordion-R14: Arrow Down/Up move focus to next/previous summary and clamp at
  the ends; Home/End jump to first/last; `preventDefault` called.
- Accordion-R15: no `class` → exactly `hz-accordion`; `class="foo bar"` →
  `hz-accordion foo bar`.
- Accordion-R16: `...rest` (e.g. `data-testid`) forwarded; override attempt on
  `class`/`data-type` → managed wins.
- Accordion-R17: duplicate `items` ids → one dev `console.warn` (spy on
  `console.warn`); unique ids → no warning.
- Accordion-R18: extend `exports.spec.ts` to assert `Accordion` resolves from
  `$lib`, plus a smoke render.

**Integration (browser):** Tab reaches each summary in DOM order; arrow keys then
roam between summaries; in single mode opening successive items leaves exactly
one open and `onToggle` reports a single id; in multiple mode several can be open
at once and `onToggle` reports all open ids.

### Out of Scope

- Any colors, borders, shadows, border-radius, fonts, icon-rotation, or panel
  open/close **animation** — these are the reference-theme's job. The component
  only guarantees the Theming Hooks (`data-state` + stable `hz-accordion-panel` +
  no blocking panel CSS) that let a consumer add CSS-only animation.
- A controlled/`bind:`-able open API or an imperative open/close method — state
  is uncontrolled via `defaultOpen` + native `<details>`; `onToggle` is
  read-only notification (R12).
- A context/store API for cross-component coordination.
- Nested accordions as a first-class feature (consumers may nest manually; the
  `name` grouping is per-instance and not ref-counted).
- Filtering/search, lazy-loading panel content, or virtualization.
- Docs demo routes and Playwright e2e — later sprint.
