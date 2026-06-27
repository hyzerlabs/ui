# Tabs Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Tabs-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).

### Goal

Ship one headless, accessible Svelte 5 `Tabs` component implementing the full
WAI-ARIA tabs pattern — horizontal/vertical orientation, automatic/manual
activation, roving tabindex, disabled tabs, and an uncontrolled active-tab model
with an `onChange` notification — exposing `hz-*` class / `data-*` hooks and
shipping only the **minimal structural CSS** the regions need and **no** visual
opinions (no colors, borders, shadows, radius, fonts, or animation).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Tabs.svelte`.
- Exported from `src/lib/components/index.ts`, resolvable via
  `import { Tabs } from '$lib'`; assertion added to `src/lib/exports.spec.ts`.
- Headless conventions (`original-specs/00-architecture.md`): root gets
  `class="hz-tabs"`, `data-orientation`; triggers/panels get `data-state`,
  triggers get `data-disabled`. Mirror `Accordion.svelte` / `Nav.svelte` for
  `$props()` destructuring, `class: className` via `cx`, `...rest`-first spread
  (managed attributes win), `bind:this` element arrays for focus, and `$effect`
  cleanup.
- IDs via `uid` from `$lib/utils` — one stable base id per instance; per-tab ids
  derived deterministically from that base + `item.id` so the `id` /
  `aria-controls` / `aria-labelledby` relationships are stable across reactive
  re-derivation (mirror `Accordion`/`Nav` `uid` usage).
- Dev warnings use the `import.meta.env.DEV` + `untrack(...)` pattern from
  `Accordion.svelte` / `Card.svelte`.
- **Structural-CSS exception** (same justification as Accordion/Nav): Tabs ships
  **minimal structural** CSS in a scoped `<style>` — the tablist as a flex
  row/column per orientation, plus the native `hidden` attribute handling for
  inactive panels. It ships **no** colors, borders, shadows, radius, fonts, or
  active-indicator/animation. Any spacing references `--hz-space-*` tokens **with
  literal fallbacks** (Shared Scale in `specs/03-layout.md`).

### Props

| Prop          | Type                                         | Default                        |
| ------------- | -------------------------------------------- | ------------------------------ |
| `items`       | `TabItem[]`                                  | _required_                     |
| `defaultTab`  | `string`                                     | first non-disabled item's `id` |
| `orientation` | `'horizontal' \| 'vertical'`                 | `'horizontal'`                 |
| `activation`  | `'auto' \| 'manual'`                         | `'auto'`                       |
| `panel`       | `Snippet<[TabItem]>`                         | _required_                     |
| `ariaLabel`   | `string`                                     | _required_                     |
| `onChange`    | `((activeId: string) => void) \| undefined`  | —                              |
| `class`       | `string` (optional → `cx`)                   | —                              |

`TabItem` (declared **locally**, no new shared type):
`{ id: string; label: string; disabled?: boolean }`.

Plus arbitrary `...rest` HTML attributes forwarded to the root `<div>`.

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not rendered.

**Structure & rendering**

1. **Tabs-R1 — Root.** Renders `<div class="hz-tabs">` carrying `data-orientation`
   reflecting `orientation` verbatim (`"horizontal"` | `"vertical"`). Contains
   exactly one tablist `<div>` (R2) followed by one panel per item (R5), in array
   order.
2. **Tabs-R2 — Tablist.** A `<div class="hz-tabs-list" role="tablist">` carrying
   `aria-orientation={orientation}` and `aria-label={ariaLabel}`. Contains one
   `<button class="hz-tabs-trigger" role="tab">` per `items` entry, in array
   order, keyed by index.
3. **Tabs-R3 — Trigger attributes.** Each trigger renders:
   `id="hz-tab-{baseId}-{item.id}"`, `aria-controls="hz-tabpanel-{baseId}-{item.id}"`,
   `aria-selected="true"|"false"`, `data-state="active"|"inactive"`, and
   `type="button"`. At most one trigger is `active` at a time (the active tab,
   R7). Trigger text content is `item.label`.
4. **Tabs-R4 — Roving tabindex.** Only the active trigger has `tabindex="0"`;
   every other trigger (including disabled ones) has `tabindex="-1"`. This yields
   a single tab stop in the tablist; arrow keys navigate within (R10). When no
   tab is active (all disabled, R8), every trigger is `tabindex="-1"`.
5. **Tabs-R5 — Panels (all rendered, APG reference).** One
   `<div class="hz-tabs-panel" role="tabpanel">` is rendered per item, in array
   order, each carrying `id="hz-tabpanel-{baseId}-{item.id}"`,
   `aria-labelledby="hz-tab-{baseId}-{item.id}"`, and `tabindex="0"`. The active
   item's panel carries `data-state="active"` and is visible; every inactive
   panel carries `data-state="inactive"` **and** the native `hidden` attribute
   (removed from layout and the tab order). The required `panel` snippet is
   invoked once per item with that item (`{@render panel(item)}`), so one render
   callback serves every tab and can branch on `item.id`.
6. **Tabs-R6 — Panel persistence.** Because all panels stay mounted (only
   visibility toggles via `hidden`/`data-state`), each panel's internal DOM, form
   input values, and scroll position persist across tab switches. Panels are
   never unmounted on deactivation.

**Behavior**

7. **Tabs-R7 — Active state (uncontrolled).** Active tab is internal `$state`,
   seeded by `defaultTab`: if `defaultTab` matches a non-disabled item, that tab
   is active; otherwise the **first non-disabled** item is active. If no item is
   non-disabled, no tab is active (R8 edge). Clicking a non-disabled trigger
   activates it. `aria-selected`, `data-state` (triggers and panels), `tabindex`,
   and panel `hidden` all reflect the active tab synchronously.
8. **Tabs-R8 — Disabled tabs.** A trigger for `item.disabled === true` renders
   `aria-disabled="true"`, `data-disabled` (present), and `tabindex="-1"`.
   Clicking it does **not** change the active tab (handler `return`s early); it
   stays visible and in the DOM. Arrow/Home/End navigation **skips** disabled
   triggers (R10). A disabled `defaultTab` is ignored (R7). Disabled triggers use
   `aria-disabled` (not the `disabled` attribute) so they remain
   focusable/discoverable.
9. **Tabs-R9 — onChange callback.** `onChange?: (activeId: string) => void` fires
   after any user-driven activation change (click or keyboard activation),
   receiving the newly-active tab id. It does **not** fire on initial mount, nor
   when re-activating the already-active tab. When omitted, no callback is
   invoked.

**Keyboard**

10. **Tabs-R10 — Arrow navigation.** A `keydown` handler on each trigger moves
    focus between **non-disabled** triggers using the `bind:this` trigger-element
    array (mirror `Accordion`/`Nav`):

    | Key (horizontal) | Key (vertical) | Action                                          |
    | ---------------- | -------------- | ----------------------------------------------- |
    | Arrow Right      | Arrow Down     | Move focus to next non-disabled trigger (wraps) |
    | Arrow Left       | Arrow Up       | Move focus to prev non-disabled trigger (wraps) |
    | Home             | Home           | Move focus to first non-disabled trigger        |
    | End              | End            | Move focus to last non-disabled trigger         |

    Orientation determines the live axis: horizontal handles Left/Right (ignores
    Up/Down), vertical handles Up/Down (ignores Left/Right). Arrow/Home/End call
    `preventDefault()` to suppress native scroll. Navigation **wraps** at both
    ends (last → first, first → last) per the APG tabs example, and **skips**
    disabled triggers.
11. **Tabs-R11 — Activation mode.** When `activation="auto"` (default), moving
    focus via R10 **also activates** the focused tab immediately (focus and
    selection move together). When `activation="manual"`, R10 moves focus only;
    the focused (but inactive) trigger is activated by **Enter** or **Space**
    (handler calls `preventDefault()` then activates). In both modes, clicking a
    trigger activates it.
12. **Tabs-R12 — Tab key into panel.** Roving tabindex (R4) means the Tab key
    from the active trigger moves focus past the inactive triggers and into the
    active panel, which is focusable via `tabindex="0"` (R5) even when it has no
    focusable content. Inactive panels carry `hidden` so they are not in the tab
    order. This is native browser behavior given DOM order tablist → panels; no
    JS handling required.

**Composition**

13. **Tabs-R13 — class composition.** Root `class` is `cx('hz-tabs', className)`:
    `hz-tabs` first and never removable. No `class` → exactly `hz-tabs`;
    `class="foo bar"` → `hz-tabs foo bar`.
14. **Tabs-R14 — rest forwarding.** `...rest` forwards onto the root `<div>`,
    spread first so managed attributes (`class`, `data-orientation`) cannot be
    clobbered.
15. **Tabs-R15 — Dev warning.** Under `import.meta.env.DEV` (read once via
    `untrack(...)`), emit a single `console.warn` if `items` contains duplicate
    `id` values (id/keying is ambiguous). An unknown or disabled `defaultTab`
    does **not** warn (silently falls back, R7). No warning in production builds.
16. **Tabs-R16 — barrel export.** `Tabs` exported from
    `src/lib/components/index.ts`; `import { Tabs } from '$lib'` resolves;
    assertion added to `exports.spec.ts`.

### Responsive Behavior

- The Tabs root is a full-width block at **every** breakpoint
  (mobile `<640px`, tablet `640–1024px`, desktop `>1024px`).
- **Horizontal** (default): the tablist is a flex **row**; triggers sit inline.
  Long label sets that exceed the container width wrap or scroll per the
  consumer/theme — the component ships no scroll/overflow opinion beyond
  `flex-direction: row`. Panels render as full-width blocks below the tablist.
- **Vertical**: the tablist is a flex **column**; the consumer/theme is
  responsible for placing the tablist beside the panels (e.g. via the layout
  primitives) — the component ships only `flex-direction: column` on the list.
- No region hides, reflows, or changes interaction pattern across breakpoints
  automatically; orientation is a prop, not a breakpoint behavior. Any minimum
  touch-target sizing (≥44×44 per architecture baseline) for triggers is a theme
  concern; the component ships no breakpoint-specific CSS.

### Accessibility (WCAG 2.1 AA)

- Full APG tabs pattern: `role="tablist"` / `role="tab"` / `role="tabpanel"`,
  with `aria-selected` on the active tab, `aria-controls`/`aria-labelledby`
  linking each trigger to its panel, and `aria-orientation` on the tablist so
  screen readers announce the arrow-key direction (1.3.1, 4.1.2).
- All panels stay in the DOM with inactive ones `hidden` (APG reference), so
  every trigger's `aria-controls` always resolves to an existing element.
- `ariaLabel` is **required** so the tablist has an accessible name (2.4.6);
  without it the tablist would be an unnamed group of controls.
- Roving tabindex (R4): one tab stop in the tablist; arrow keys navigate within;
  Tab moves into the active panel (R12). Focus order matches DOM/visual order
  (2.1.1, 2.4.3).
- Active panel has `tabindex="0"` so it is reachable and focusable even with no
  focusable content inside (per APG); inactive panels are `hidden` and out of the
  tab order.
- Disabled tabs use `aria-disabled="true"` (not the `disabled` attribute) so they
  remain discoverable/announced but non-activatable, and are skipped by arrow
  navigation (4.1.2).
- No `outline: none` / focus suppression anywhere; visible focus is a theme
  concern but must not be removed.
- Reduced motion: the component ships no animation; any theme-layer
  active-indicator transition must respect `prefers-reduced-motion`.
- Color contrast: N/A (no colors shipped).

### Edge Cases & Error States

| Case                                            | Expected behavior                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `items` empty                                   | Root + empty tablist render; no triggers, no panels; no error (R1, R2, R5).                          |
| `defaultTab` not in `items`                     | Ignored; first non-disabled item active; no dev warning (R7, R15).                                   |
| `defaultTab` references a disabled item         | Ignored; first non-disabled item active (R7, R8).                                                    |
| **All** items disabled                          | No tab active; every panel `hidden` with `data-state="inactive"`; every trigger `tabindex="-1"`; no error (R4, R5, R7). |
| Click a disabled trigger                        | No activation; `data-state` unchanged; `onChange` does not fire (R8, R9).                            |
| Arrow key onto a run of disabled triggers       | Skips them to the next non-disabled trigger; wraps if needed (R10).                                  |
| Only one non-disabled trigger                   | Arrow/Home/End keep focus on it (wrap resolves to itself) (R10).                                     |
| `activation="manual"`, arrow then no Enter      | Focus moves, active tab/panel unchanged until Enter/Space (R11).                                     |
| Re-activate the already-active tab              | No-op; `onChange` does not fire (R9).                                                                |
| Switch away from a tab with form input / scroll | Panel stays mounted; its input values and scroll position persist on return (R6).                    |
| Duplicate ids in `items`                        | Dev `console.warn` once (R15); triggers/panels still render keyed by index.                          |
| `onChange` omitted                              | No callback invoked on any activation (R9).                                                          |
| SSR / pre-mount                                 | Static markup renders with the initial active tab + all panels (inactive `hidden`); keydown listeners and `bind:this` focus management attach on mount (R7, R10). |
| `...rest` attempts `class` / `data-orientation` | Component-managed value wins (R14).                                                                  |

### Existing Code to Reuse

- **Utils:** `cx` and `uid` from `src/lib/utils` (R13, R3) — do not write new
  class-merging or id logic. Mirror `Accordion`/`Nav` for the per-instance base
  id + deterministic per-item ids.
- **Component pattern:** mirror `src/lib/components/Accordion.svelte` (region
  wrappers + `$props()` + `...rest`-first spread + `import.meta.env.DEV`/`untrack`
  dev warning + `panel: Snippet<[Item]>` render callback + `bind:this` element
  arrays + `$effect` cleanup) and `src/lib/components/Nav.svelte` (roving focus
  management across a `triggerEls` array).
- **Tokens:** `--hz-space-*` with literal fallbacks, per the Shared Scale in
  `specs/03-layout.md`.
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` to include `Tabs`.
- **Test harness:** `Accordion.svelte.spec.ts` / `Nav.svelte.spec.ts` — Vitest
  browser mode (`vitest-browser-svelte`: `render`, `page.getBy*`,
  `await expect.element`, `createRawSnippet` for snippet props, `userEvent` from
  `vitest/browser`, the local `tick()` / `fireKey()` helpers).
  `expect.requireAssertions` is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file `src/lib/components/Tabs.svelte.spec.ts`
(the `.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). No Playwright e2e (docs demos are a later sprint).

**Unit / component (browser):**

- Tabs-R1/R2: defaults → `<div.hz-tabs data-orientation="horizontal">` containing
  one `[role="tablist"]` with `aria-orientation` + `aria-label`, and one
  `[role="tab"]` per item.
- Tabs-R3: each trigger has matching `id` / `aria-controls`, `type="button"`,
  label text; exactly one `aria-selected="true"` / `data-state="active"`.
- Tabs-R4: active trigger `tabindex="0"`, all others `-1`.
- Tabs-R5: one `[role="tabpanel"]` per item with correct
  `id`/`aria-labelledby`/`tabindex="0"`; the active panel has
  `data-state="active"` and no `hidden`; inactive panels have
  `data-state="inactive"` and the `hidden` attribute; the `panel` snippet
  receives each item (assert per-item branched content in the correct panel).
- Tabs-R6: enter a value into an input in panel A, switch to B and back → the
  value persists (panel not remounted).
- Tabs-R7: `defaultTab` honored; missing/disabled `defaultTab` → first
  non-disabled active; clicking a trigger activates it and reveals its panel /
  hides the previous.
- Tabs-R8: disabled trigger → `aria-disabled="true"` + `data-disabled` +
  `tabindex="-1"`; click does not activate; arrow nav skips it.
- Tabs-R9: `onChange` spy receives new id on click and keyboard activation; not
  on mount; not on re-activating the active tab.
- Tabs-R10: horizontal → Right/Left move focus (wrap), Up/Down ignored; vertical
  → Up/Down move (wrap), Left/Right ignored; Home/End jump to first/last
  non-disabled; `preventDefault` called; disabled skipped.
- Tabs-R11: `auto` → arrow moves focus **and** activates (assert `aria-selected`
  + revealed panel); `manual` → arrow moves focus only, Enter/Space activates.
- Tabs-R12: from the active trigger, Tab moves focus into the active panel
  (assert the panel is the next focusable / `document.activeElement`); inactive
  panels (`hidden`) are not reachable.
- Tabs-R13: no `class` → exactly `hz-tabs`; `class="foo bar"` → `hz-tabs foo bar`.
- Tabs-R14: `...rest` (e.g. `data-testid`) forwarded; override attempt on
  `class`/`data-orientation` → managed wins.
- Tabs-R15: duplicate `items` ids → one dev `console.warn` (spy on
  `console.warn`); unique ids → no warning.
- Tabs-R16: extend `exports.spec.ts` to assert `Tabs` resolves from `$lib`, plus
  a smoke render.

**Integration (browser):** Tab key reaches the single active trigger (not the
inactive ones) then moves into the active panel; in `auto` mode arrowing through
the tablist swaps the visible panel and fires `onChange` each step; in `manual`
mode arrowing then Enter swaps once; all-disabled renders with no active panel
(all `hidden`) and no errors.

### Out of Scope

- Any colors, borders, shadows, border-radius, fonts, active-tab indicator, or
  panel transition/**animation** — reference-theme's job. The component only
  guarantees `data-state` + stable `hz-tabs-*` hooks.
- A controlled/`bind:`-able active-tab API or imperative activate method — state
  is uncontrolled via `defaultTab`; `onChange` is read-only notification (R9).
- Lazy / active-only panel rendering or unmount-on-deactivate — all panels stay
  mounted with inactive ones `hidden` (APG reference, R5/R6).
- Closeable/addable (dynamic) tabs, drag-to-reorder, overflow "more" menus, or
  scroll-buttons for overflowing tablists.
- A context/store API, nested tabs as a first-class feature, and vertical-layout
  placement of the panels beside the list (consumer composes with layout
  primitives).
- Docs demo routes and Playwright e2e — later sprint.
