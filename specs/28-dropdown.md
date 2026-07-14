# Dropdown Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Dropdown-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`) plus the one docs page named in
> Dropdown-R18.
>
> **Authored 2026-07-14.** This is the single canonical contract for the
> `Dropdown` component. Like `specs/22-combobox.md` and `specs/25-lightbox.md`,
> every design decision is recorded inline as a **settled decision** (dated), not
> an open question. **Accessibility is the organizing lens:** the roadmap
> (2026-07-13) scopes `Dropdown` as the generic **action menu** — the WAI-ARIA
> APG **menu button** pattern — and the user priority (2026-07-14) is that every
> implementation prioritizes the accessible experience. Each requirement is
> written against the accessible behavior it guarantees.

### Goal

Ship one headless, accessible Svelte 5 `Dropdown`: a generic **action menu**
following the WAI-ARIA APG **menu button** pattern. A trigger
`<button aria-haspopup="menu" aria-expanded>` (composed from the library's own
`Button`) opens a `role="menu"` popup of `role="menuitem"` actions. Unlike
`Combobox` (which keeps DOM focus on its input and uses **virtual focus** via
`aria-activedescendant`), the menu uses **real DOM focus** moving through the
items via **roving tabindex** — opening moves focus into the menu, arrow keys
move real focus between items, and activating an item fires its action, closes
the menu, and returns focus to the trigger. Headless: the component ships only
structural CSS and stable `hz-*` / `data-*` hooks; all chrome (the menu surface,
item states, separators, danger styling) is the reference theme's job. The
trigger's chrome comes for free from `Button` (`specs/01-button.md`) +
`button.css`.

### Context & Conventions (dated decisions, preserved)

- Svelte 5 **runes mode**, TypeScript. One component file
  `src/lib/components/Dropdown.svelte`, exported from the barrel
  (`src/lib/components/index.ts`); assertion + smoke render in
  `src/lib/exports.spec.ts`. Types in `src/lib/types/index.ts`. Reference theme
  in a new `src/lib/theme/dropdown.css` imported by `theme.css`.
- **Menu button, real focus (decision 2026-07-14).** `Dropdown` implements the
  APG **menu button** pattern with **real roving-tabindex focus** — the deliberate
  contrast with `Combobox`. In `Combobox` DOM focus never leaves the text input
  (virtual focus, `aria-activedescendant`, `data-active`) because the input must
  stay editable while the list is navigated. A menu has no editable field: APG
  menus move **real** focus through `menuitem`s, so the styling hook is native
  `:focus` (no `aria-activedescendant`, no `data-active`), the active item is
  simply `document.activeElement`, and a **roving tabindex** (the focused item
  `tabindex="0"`, all others `tabindex="-1"`) keeps the menu a single tab stop.
- **Nav is nav-scoped; Dropdown is the generic menu (roadmap 2026-07-13).**
  `Nav.svelte`'s disclosure dropdown is **nav-scoped** (a bar of navigation links
  rendered as `role="menu"` of link `menuitem`s, driven by `NavItem[]`).
  `Dropdown` is **THE generic action menu** — items are actions, not navigation.
  The two are documented as distinct (Dropdown-R18 cross-links `/navigation/nav`).
  `Dropdown` **reuses `Nav.svelte`'s popup plumbing pattern** (`bind:this` refs,
  a `$effect` document `click` listener with cleanup for outside-click dismissal,
  `getElementById`-based menuitem focus movement, `aria-expanded`/`aria-controls`
  wiring, `data-state`/`data-open` open hooks) rather than inventing new listener
  machinery — but as its own component, not by extending `Nav`.
- **Action-only v1 — no link `menuitem`s (decision 2026-07-14).** Every menu
  entry is a real `<button role="menuitem">` action with uniform Enter / Space /
  click activation. APG permits `role="menuitem"` on an `<a href>`, but mixing
  native anchor navigation (native Enter-navigate, Space-to-click, `target`/`rel`
  for external, and focus-return-vs-navigate) into v1 would multiply the
  activation paths for marginal gain — and `Nav`'s dropdown already covers
  navigational disclosure. Link `menuitem`s are **Out of Scope** with a recorded
  future direction. (This keeps `DropdownItem` free of `href`; add it when links
  land.)
- **Items array, not children (decision 2026-07-14).** The menu is data-driven —
  a single `items: DropdownEntry[]` prop, exactly like `Nav`/`Footer` take
  `NavItem[]`/`FooterColumn[]` and `Select`/`Combobox` take options. A
  snippet-children API is rejected: it would let a consumer render arbitrary
  markup inside `role="menu"` and break the menuitem/roving-focus contract. The
  array supports actionable items and separators (see Shared Types).
- **Per-item action + one component callback (decision 2026-07-14).** An action
  menu's dominant use is "each item does a different thing," so the primary
  affordance is a **per-item `onselect?: () => void`** (as Radix/most menu
  libraries do). The library's one-callback idiom (`Pagination.onchange`,
  `Combobox.onchange`) is **also** honored: a component-level
  `onselect?: (id, item) => void` fires on every activation for centralized
  handling / analytics. On activation the item callback runs **first**, then the
  component callback.
- **Trigger composes `Button`, no trigger snippet (decision 2026-07-14).** The
  trigger is the library's own `Button` (the established composition precedent —
  `Pagination`/`Carousel` compose `Button`), so it inherits the real-`<button>`
  keyboard/focus contract, the link/disabled duality, and full `button.css`
  chrome for free. `Dropdown` injects the menu-button ARIA
  (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `id`) and the
  open/keyboard handlers through `Button`'s `...rest` + `onclick` props. A
  `trigger` **snippet** is deliberately **rejected**: a snippet lets a consumer
  supply a non-button or strip the required ARIA — contrary to the library's
  real-button philosophy. Appearance is customized via a typed `triggerProps`
  pass-through (mirroring `Combobox`'s `chipProps`) and the label/icon props.
- **Disabled items are focusable-but-inert (decision 2026-07-14).** Per the APG
  menu guidance, a disabled `menuitem` stays **focusable** (reached by Arrow /
  Home / End / typeahead) so screen-reader users discover its presence; it is
  marked `aria-disabled="true"` (**not** the native `disabled` attribute) and its
  activation is a no-op. This is the deliberate opposite of `Combobox`, whose
  virtual-focus model **skips** disabled options — a menu's real focus should not
  hide items from AT. Recorded so the Reviewer does not "fix" it toward the
  Combobox behavior.
- **Internal open state (decision 2026-07-14).** Popup open/closed is internal
  `$state`, **not** a prop and **not** `$bindable` — ephemeral UI state with no
  consumer use, exactly as `Combobox`'s `open`. (Revisit only if a controlled-open
  need appears; `Modal.open` is bindable because a modal's open state is program-
  driven, a menu's is not.)
- **No collision engine (decision 2026-07-14).** The menu anchors below the
  trigger (`top: 100%`) with `inset-inline` start/end alignment (`align` prop);
  there is **no** flip/shift/auto-placement engine and no portal — the same
  Out-of-Scope stance as `Combobox`'s popup. A `max-height` scroll (theme) keeps
  a long menu inside the viewport.
- IDs via `uid` from `$lib/utils` — one stable base per instance deriving
  `hz-dd-trigger-{uid}`, `hz-dd-menu-{uid}`, and per-item
  `hz-dd-item-{uid}-{item.id}` (keyed on the consumer-stable `item.id`, so ids
  survive reactive re-derivation — the `Nav`/`Combobox` id convention).
- Mirror existing idioms: `cx` for class composition; `import.meta.env.DEV` +
  `untrack` for any dev warning (per `Button.svelte`/`Card.svelte`); `bind:this`
  element refs + `$effect` listener add/remove with cleanup (per `Nav.svelte`);
  deferred focus after a render via `tick()` (or a `0ms` timeout, as `Nav` does)
  when moving focus into freshly-shown menu items.
- **Structural-CSS exception** (same justification as the rest of the library):
  the component ships **minimal structural** CSS only — the root as the popup's
  positioning ancestor, the menu as an absolutely-positioned block, the list
  reset, item flex layout, and the closed-state `display: none`. **No** colors,
  borders, shadows, radius, fonts, padding-beyond-structural, or state visuals;
  any spacing references `--hz-space-*` tokens **with literal fallbacks**. All
  chrome is `theme/dropdown.css`. The trigger ships **no** Dropdown CSS — it is a
  `Button` and `button.css` styles it.

### Shared Types

**Decision 2026-07-14:** the menu-entry shape lives in `src/lib/types/index.ts`
alongside `NavItem` / `FormOption`, exported so consumers type their `items`
arrays. A discriminated union carries actionable items and separators, mirroring
`SelectOption`'s `FormOption | { group … }` union precedent. `src/lib/types`
gains `import type { Snippet } from 'svelte';` at the top (for the item `icon`).

```ts
/** An actionable entry in a Dropdown action menu. */
export interface DropdownItem {
	/** Stable identity — keys the item, its DOM id, and the onselect callback. */
	id: string;
	label: string;
	disabled?: boolean;
	/** Destructive action (e.g. Delete) — surfaces a `data-danger` styling hook. */
	danger?: boolean;
	/** Optional decorative leading glyph (rendered aria-hidden — the label owns
	 *  the accessible name). */
	icon?: Snippet;
	/** Per-item action, fired on activation before the component-level onselect. */
	onselect?: () => void;
}

/** A non-interactive divider between groups of Dropdown items. */
export interface DropdownSeparator {
	separator: true;
}

/** A Dropdown menu entry — an actionable item or a separator. */
export type DropdownEntry = DropdownItem | DropdownSeparator;

/**
 * Button appearance passed through to the Dropdown trigger — consumers who only
 * import Dropdown can still set the trigger's look. Behavioral trigger props
 * (label, aria, open/keyboard handlers) are component-managed and excluded.
 * (Button's `intent`/`size` are local literal unions, not exported shared types,
 * so they are inlined here — the same rationale by which `ComboboxChipProps`
 * referenced the now-shared Badge unions; extract them only if a second consumer
 * appears.)
 */
export interface DropdownTriggerProps {
	variant?: Variant;
	intent?: 'primary' | 'secondary' | 'danger' | 'neutral';
	size?: 'sm' | 'md' | 'lg';
	class?: string;
}
```

### Props

| Prop           | Type                                          | Default                          |
| -------------- | --------------------------------------------- | -------------------------------- |
| `items`        | `DropdownEntry[]`                             | _required_                       |
| `label`        | `string`                                      | — (visible trigger text)         |
| `triggerLabel` | `string`                                      | — (accessible name; see R2)      |
| `triggerProps` | `DropdownTriggerProps`                        | `{}` (⇒ `variant:'outline', intent:'neutral'`) |
| `triggerIcon`  | `Snippet`                                     | — (⇒ `IconChevronDown`)          |
| `align`        | `'start' \| 'end'`                            | `'start'`                        |
| `onselect`     | `((id: string, item: DropdownItem) => void) \| undefined` | —                    |
| `disabled`     | `boolean`                                     | `false`                          |
| `class`        | `string` (→ `cx`)                            | —                                |

Plus arbitrary `...rest` HTML attributes forwarded onto the **root
`<div class="hz-dropdown">`** wrapper (Dropdown-R14).

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered. `open`/`closed` in prose refers to the internal open `$state`.

1. **Dropdown-R1 — Structure & root.** Renders a root
   `<div class="hz-dropdown" data-open? data-align="start|end" data-state="disabled"?>`
   (`class` via `cx('hz-dropdown', className)` — `hz-dropdown` first, never
   removable). The root is the menu's positioning ancestor (`position: relative`,
   Dropdown-R17) and `bind:this`-captured for focus-return and focus-containment
   checks. It contains, in order: the **trigger** (Dropdown-R2) and the **menu
   popup** (Dropdown-R3), the popup rendered in the DOM at all times but hidden
   via CSS while closed (Dropdown-R17). `data-open` is present exactly while open;
   `data-align` mirrors the `align` prop; `data-state="disabled"` is present when
   the whole component is `disabled` (Dropdown-R11).
2. **Dropdown-R2 — Trigger (composes `Button`).** The trigger is the library's
   `Button` (`specs/01-button.md`), given
   `class={cx('hz-dropdown-trigger', triggerProps.class)}` (so it is locatable via
   `root.querySelector('.hz-dropdown-trigger')` for focus return), the merged
   appearance from `triggerProps` (defaulting `variant:'outline'`,
   `intent:'neutral'`), `disabled={disabled}`, `onclick` → toggle (Dropdown-R5),
   `onkeydown` → the trigger key handler (Dropdown-R7), and — forwarded through
   `Button`'s `...rest` — the menu-button ARIA: `id="hz-dd-trigger-{uid}"`,
   `aria-haspopup="menu"`, `aria-expanded` (`"true"` open / `"false"` closed),
   `aria-controls="hz-dd-menu-{uid}"`. Face:
   - **Labeled trigger** (`label` set): `Button` `children` = `label`; the chevron
     is `Button`'s `iconEnd` = `triggerIcon` (or `IconChevronDown` by default,
     decorative). The accessible name is the visible `label`; `triggerLabel`, when
     also set, is passed as `Button`'s `ariaLabel` to override it.
   - **Icon-only trigger** (`label` absent): no `children`; `triggerIcon` (or
     `IconChevronDown`) is `Button`'s icon snippet, so `Button` derives its
     icon-only circle form; `triggerLabel` is passed as `ariaLabel`. When
     `triggerLabel` is also absent, **`Button`'s own R14 dev warning** fires
     (icon-only without an accessible name) — `Dropdown` adds no second warning;
     it relies on `Button`'s guard.
3. **Dropdown-R3 — Menu container.** The popup is
   `<ul class="hz-dropdown-menu" id="hz-dd-menu-{uid}" role="menu"
   aria-labelledby="hz-dd-trigger-{uid}">` (named by the trigger, per APG), the
   root's last child so it anchors under the trigger. It carries a delegated
   `onkeydown` (Dropdown-R7) for in-menu navigation. It is rendered at all times
   and hidden with `display: none` while the root lacks `data-open`
   (Dropdown-R17) — so a closed menu is out of the accessibility tree and its
   items are not focusable. Each entry in `items` renders in array order:
   - a `DropdownItem` → `<li role="none"><button role="menuitem"
     id="hz-dd-item-{uid}-{item.id}" type="button" class="hz-dropdown-item"
     tabindex={roving}> {icon?} {label} </button></li>` (roving tabindex per
     Dropdown-R6), with `data-danger` when `item.danger`, and — when
     `item.disabled` — `aria-disabled="true"` + `data-disabled` (Dropdown-R10).
     The `icon` snippet, when present, renders inside the button **before** the
     label and is decorative (`aria-hidden` wrapper or a decorative-by-default
     icon — it never contributes to the button's accessible name; the `label`
     text does).
   - a `DropdownSeparator` → `<li role="separator" class="hz-dropdown-separator">`
     — never focusable, never a `menuitem`, skipped by all navigation.
4. **Dropdown-R4 — Items model & callback.** `items` is a `DropdownEntry[]`
   (required). Actionable items are `DropdownItem`; dividers are
   `{ separator: true }`. Activation of an enabled item (Dropdown-R9) fires
   `item.onselect?.()` **then** `onselect?.(item.id, item)` (the item callback
   first), then closes the menu and returns focus to the trigger. Separators and
   disabled items never fire either callback.
5. **Dropdown-R5 — Open / close triggers.** The menu **opens** on: a pointer
   click on the trigger while closed; `Enter` / `Space` on the trigger (native
   `Button` activation → the same toggle); `ArrowDown` / `ArrowUp` on the trigger
   (Dropdown-R7). It **closes** on: a pointer click on the trigger while open;
   `Escape` (Dropdown-R7/R12); activating any enabled item (Dropdown-R9); an
   outside pointer click (document listener, per `Nav.svelte`); `Tab` /
   `Shift+Tab` from the menu (Dropdown-R7); and focus leaving the whole
   `.hz-dropdown` root (Dropdown-R12). **On open, DOM focus moves into the menu**
   (Dropdown-R6): a click / `Enter` / `Space` / `ArrowDown` opens focused on the
   **first** menuitem; `ArrowUp` opens focused on the **last**. Focus is moved
   after the menu is shown (deferred via `tick()` / next tick, per `Nav`). When
   `disabled`, no open trigger has any effect (Dropdown-R11).
6. **Dropdown-R6 — Roving tabindex & real focus (the focus model).** DOM focus
   moves through the `menuitem`s themselves — there is **no** virtual focus. The
   component tracks the active item as `activeId` (a `DropdownItem.id`, or `null`
   when closed). Exactly one menuitem is the tab stop: `tabindex="0"` on the item
   whose `id === activeId`, `tabindex="-1"` on every other menuitem; separators
   have no tabindex. Moving the active item (Dropdown-R7/R8) updates `activeId`
   **and** calls `.focus()` on that item's element
   (`getElementById('hz-dd-item-{uid}-{id}')`, the `Nav` idiom), so
   `document.activeElement` is the focused menuitem and the theme styles it via
   native `:focus` / `:focus-visible` — **no** `aria-activedescendant` and **no**
   `data-active` are emitted. On close, `activeId` resets to `null`. Disabled
   items **are** part of the roving sequence and focusable (Dropdown-R10).
7. **Dropdown-R7 — Keyboard (APG menu button).**
   **On the trigger** (`onkeydown`): `ArrowDown` → open + focus first menuitem;
   `ArrowUp` → open + focus last menuitem (both `preventDefault`); `Escape` (when
   open) → close, focus stays on the trigger. `Enter` / `Space` are handled by
   `Button`'s native activation (→ toggle, Dropdown-R5) — the trigger `onkeydown`
   does **not** re-handle them (no double toggle).
   **In the menu** (delegated `onkeydown` on `role="menu"`):
   - `ArrowDown` → move focus to the next menuitem, wrapping last→first
     (`preventDefault`).
   - `ArrowUp` → previous menuitem, wrapping first→last (`preventDefault`).
   - `Home` → first menuitem; `End` → last menuitem (`preventDefault`).
   - Printable character (excluding `Space`) → typeahead (Dropdown-R8).
   - `Escape` → close + return focus to the trigger (`preventDefault`).
   - `Tab` / `Shift+Tab` → close the menu and let the browser's native focus move
     proceed (no `preventDefault`), mirroring `Nav.svelte`'s Tab handling; the
     `focusout` backstop (Dropdown-R12) also closes on any focus leaving the root.
   - `Enter` / `Space` are **not** handled here — a `menuitem` is a native
     `<button>`, so its own click (native on Enter/Space, and on pointer) drives
     activation (Dropdown-R9); handling them here too would double-fire.
   All handled keys that would otherwise scroll the page (`ArrowUp`/`ArrowDown`/
   `Home`/`End`) `preventDefault`.
8. **Dropdown-R8 — Typeahead.** Pressing a printable character (not `Space`) in
   the open menu moves focus to the **next** menuitem (cyclically from the current
   active item, wrapping) whose `label` **starts with** that character
   (case-insensitive). Repeatedly pressing the same character cycles through all
   items sharing that initial. Disabled items participate (they are focusable and
   discoverable, Dropdown-R10). No match → focus is unchanged. (Single-character
   cyclic matching only; a multi-character buffered type-ahead string is Out of
   Scope — single-char cycling is the widely-accepted, fully-testable APG minimum.)
9. **Dropdown-R9 — Activation.** Activating an **enabled** menuitem — a pointer
   click, or `Enter` / `Space` (native `<button>` activation) — runs, in order:
   `item.onselect?.()`, then `onselect?.(item.id, item)` (Dropdown-R4); then sets
   the menu closed (`open = false`, `activeId = null`); then returns DOM focus to
   the trigger (`root.querySelector('.hz-dropdown-trigger')?.focus()`). Because
   items use `aria-disabled` (not native `disabled`, Dropdown-R10), a click on a
   disabled item **does** dispatch, so the click/activation handler **guards**
   `if (item.disabled) return` — a disabled item is a no-op that leaves the menu
   open (Dropdown-R10).
10. **Dropdown-R10 — Disabled items (focusable-but-inert).** A `DropdownItem` with
    `disabled: true` renders its `<button role="menuitem">` with
    `aria-disabled="true"` + `data-disabled` and **without** the native `disabled`
    attribute, so it **remains focusable** and reachable by Arrow / Home / End /
    typeahead (Dropdown-R6/R7/R8) — screen-reader users discover it. Its
    activation is a no-op (Dropdown-R9): no callback fires and the menu stays
    open. It still occupies the roving sequence (its tabindex is `0` when active,
    `-1` otherwise).
11. **Dropdown-R11 — Disabled menu.** When the component `disabled` prop is true:
    the trigger `Button` receives `disabled` (its `button.css` disabled chrome +
    `aria-disabled`, and — via `Button`'s contract — swallowed activation), the
    root carries `data-state="disabled"`, and no open trigger (click / key) has
    any effect. The menu never opens while disabled.
12. **Dropdown-R12 — Outside click, focus-out, Escape (no focus trap).** The menu
    is **not** modal — there is **no focus trap** and **no scroll lock**. A
    document-level `click` listener (added/removed in a `$effect` with cleanup,
    per `Nav.svelte`) closes the menu when a pointer click lands outside
    `.hz-dropdown` (walk `composedPath()` / `target.closest('.hz-dropdown')`),
    **without** moving focus (focus is on the clicked element). A `focusout`
    handler on the root closes the menu when focus leaves the root
    (`relatedTarget` not within `.hz-dropdown`) — the backstop for Tab-away and
    click-away — **without** moving focus. `Escape` (trigger or menu) closes and
    **returns focus to the trigger** (Dropdown-R7). Focus moving between the
    trigger and a menuitem, or between menuitems, stays "within" the root and
    never closes the menu.
13. **Dropdown-R13 — Alignment.** The `align` prop (`'start'` default, or
    `'end'`) is reflected as `data-align` on the root and drives the popup's
    inline anchoring (Dropdown-R17): `start` → the menu's inline-start edge aligns
    to the trigger's inline-start; `end` → inline-end edges align (for a
    right-aligned kebab menu). No collision detection — a menu clipped by a
    constrained container is the consumer's layout concern (Out of Scope).
14. **Dropdown-R14 — class & rest.** Root class is `cx('hz-dropdown', className)`
    — the base class first and never removable. `...rest` spreads **first** on the
    **root `<div>`** so component-managed attributes (`class`, `data-open`,
    `data-align`, `data-state`) win over any conflicting rest value; a forwarded
    `data-testid` / `aria-*` reaches the root. Rest does **not** land on the
    trigger `Button`, the menu `<ul>`, or the items.
15. **Dropdown-R15 — Shared types.** `DropdownItem`, `DropdownSeparator`,
    `DropdownEntry`, and `DropdownTriggerProps` are declared in and exported from
    `src/lib/types/index.ts` (with the added `import type { Snippet } from
    'svelte'`); the component imports them rather than redeclaring. (See Shared
    Types.)
16. **Dropdown-R16 — Barrel export.** `Dropdown` exported from
    `src/lib/components/index.ts`; `import { Dropdown } from '$lib'` resolves;
    assertion + smoke render added to `src/lib/exports.spec.ts`.
17. **Dropdown-R17 — Structural CSS only + theme.** Scoped component styles carry
    **no** chrome:
    - `.hz-dropdown` — `position: relative; display: inline-block` (the popup's
      positioning ancestor; inline-block so the widget shrink-wraps the trigger).
    - `.hz-dropdown-menu` — `position: absolute; top: 100%;` with
      `inset-inline-start: 0` by default and `inset-inline-end: 0` under
      `.hz-dropdown[data-align='end'] .hz-dropdown-menu`; `min-width: max-content`;
      list reset (`list-style: none; margin: 0; padding: 0`).
    - `display: none` on `.hz-dropdown-menu` while `.hz-dropdown` lacks
      `data-open` (so a closed menu is inert / out of the a11y tree).
    - `.hz-dropdown-item` — a flex row (`display: flex; align-items: center;
      width: 100%; text-align: start`) so the optional icon + label lay out on one
      line; a cursor/appearance reset for the `<button>`.

    All visuals live in **`src/lib/theme/dropdown.css`** (in `@layer hz-theme`,
    imported by `theme.css`, every `var()` carrying a **literal fallback** per the
    fallback-compat convention): the menu surface / border / shadow / radius, the
    `z-index: var(--hz-z-dropdown, 10)` layering, the `margin-top` gap below the
    trigger, `max-height` + scroll for long menus, item padding and the
    `:hover` / `:focus` / `:focus-visible` background (the active-item highlight is
    a background/contrast change keyed on native `:focus`, **not** hue-only), the
    `[data-danger]` destructive color, the `[data-disabled]` muting, decorative
    icon spacing, and the `.hz-dropdown-separator` divider (border + block margin).
    Any menu open/appearance transition the theme adds **must** respect
    `prefers-reduced-motion`. The **trigger** ships no Dropdown CSS — it is a
    `Button`, fully covered by `button.css`.
18. **Dropdown-R18 — Docs page.** A docs route
    `src/routes/components/dropdown/+page.svelte` per `specs/16-docs.md` R6
    (docs write scope: `src/routes/components/dropdown/` and a
    `src/docs/manifest.ts` entry — outside the library source): one `<h1>`
    "Dropdown", a one-line description, the import snippet
    (`import { Dropdown } from '@hyzer-labs/ui'`), and one or more **live**
    `Example` demos rendering the real component — **basic action menu**
    (several items with per-item `onselect`, showing the fired action);
    **disabled + danger items** (a `disabled` item that stays focusable-but-inert
    and a `danger` "Delete" item); **alignment** (`align="end"`); **icons +
    separators** (items with an `icon` snippet and a `{ separator: true }`
    divider); and an **icon-only trigger** (no `label`, `triggerIcon` + a
    `triggerLabel`). Include a `PropsTable` sourced from the Props table above and
    a supporting **type table** for `DropdownItem` (`types={[…]}` like the Select
    page's `FormOption` table). An accessibility note covers the APG **menu
    button** pattern: the trigger's `aria-haspopup="menu"` / `aria-expanded`, the
    **real roving-tabindex focus** model (contrasted with `Combobox`'s virtual
    focus), the keyboard map (Arrow / Home / End / typeahead / Enter-Space / Escape
    / Tab), and disabled items staying focusable. The page carries a
    **"Dropdown vs Nav" callout** (an `<Alert intent="info">`, as the Combobox
    page pairs Select/Combobox) — reach for `Dropdown` for **actions** (an
    action menu / kebab menu), and use **`Nav`** (`/navigation/nav`) for
    **navigation** disclosure — **cross-linking `/navigation/nav`**. A
    `{ label: 'Dropdown', href: '/components/dropdown' }` entry is added to the
    **Components** section of `src/docs/manifest.ts`, keeping the
manifest↔exports parity enforcement satisfied (`specs/16-docs.md` R14 —
exports.spec.ts + the docs e2e route pass).

### Responsive Behavior

- The trigger is a `Button`; it reflows with its content and ships no
  breakpoint CSS. The whole `Dropdown` is an inline-block widget that sizes to
  the trigger at **all** breakpoints (mobile `<640px`, tablet `640–1024px`,
  desktop `>1024px`).
- The menu popup anchors below the trigger at every breakpoint (no
  interaction-pattern change by width — it never switches to a full-screen sheet).
  Its `min-width: max-content` keeps items on one line; a long menu is a
  `max-height`-capped scroll region (theme) so it never overflows the viewport
  vertically. `align="end"` keeps a right-anchored menu from overflowing the
  inline-end edge when the trigger sits near the right of its container.
- Touch: the trigger and items are pointer targets sized by the theme
  (≥44×44 hit area is a theme concern); the component ships no
  breakpoint-specific CSS.

### Accessibility (WCAG 2.1 AA)

- Implements the WAI-ARIA APG **menu button** pattern: a real
  `<button aria-haspopup="menu" aria-expanded aria-controls>` opening a
  `role="menu"` (labelled by the trigger via `aria-labelledby`) of
  `role="menuitem"` items — Name, Role, Value satisfied (4.1.2).
- **Real focus management (2.1.1 / 2.4.3).** Opening moves DOM focus into the
  menu (first item on click/Enter/Space/Down, last on Up); Arrow / Home / End /
  typeahead move real focus between items via roving tabindex; activating an item
  runs its action, closes the menu, and **returns focus to the trigger**; Escape
  closes and returns focus to the trigger; Tab / Shift+Tab close and release
  focus. The menu is **not** a focus trap (menus are not modal) — no keyboard
  trap (2.1.2), and outside click / Tab both dismiss.
- **Disabled discoverability (4.1.2).** Disabled items keep `aria-disabled="true"`
  and stay focusable so AT users can perceive them; activation is inert.
- **Not color alone (1.4.1).** The active item is conveyed by real focus
  (`:focus` background/contrast change, not hue only) plus the roving tab stop;
  `danger` items are conveyed by `data-danger` styling **and** their label text,
  never color alone.
- **Motion.** The component ships no menu animation; native `.focus()` scrolling
  is instant. Any theme-layer open transition must respect
  `prefers-reduced-motion`. No `outline: none` without a `:focus-visible`
  replacement — the trigger rides `button.css`'s focus ring; the menuitem focus
  ring is the theme's.
- Color contrast is a theme concern (no colors shipped by the component); the
  reference theme's item / focus / danger / disabled states target AA against the
  menu surface.

### Edge Cases & Error States

| Case                                              | Expected behavior                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `items` empty                                     | Trigger renders; opening shows an empty `role="menu"`; no item to focus (`activeId` stays `null`) — no crash. |
| Single item                                       | Opens focused on that item; Arrow/Home/End keep focus on it (wrap of one). |
| Click trigger (closed → open)                     | Menu opens, focus moves to the first menuitem (Dropdown-R5/R6). |
| Click trigger (open → close)                      | Menu closes, focus stays on the trigger (Dropdown-R5). |
| `ArrowDown` / `ArrowUp` on the trigger            | Opens focused on the first / last menuitem (Dropdown-R7). |
| Arrow past the ends                               | Wraps (Down from last → first, Up from first → last), including disabled items (Dropdown-R7/R10). |
| Activate an enabled item (click / Enter / Space)  | `item.onselect` then `onselect(id,item)` fire, menu closes, focus returns to the trigger (Dropdown-R9). |
| Activate a disabled item (click / Enter / Space)  | No-op — no callback, menu stays open (Dropdown-R9/R10). |
| Focus a disabled item via Arrow / typeahead       | Focus lands on it (it is focusable); it is announced `aria-disabled` (Dropdown-R10). |
| Separator entry                                   | Renders `role="separator"`; never focused, never activatable, skipped by all navigation (Dropdown-R3). |
| Typeahead, matching item                          | Focus moves to the next label-initial match, cycling on repeat; no match → focus unchanged (Dropdown-R8). |
| `Escape` (menu or trigger)                        | Menu closes, focus returns to the trigger (Dropdown-R7/R12). |
| Outside pointer click                             | Menu closes; focus not moved by the component (Dropdown-R12). |
| `Tab` / `Shift+Tab` from the menu                 | Menu closes; native focus move proceeds; `focusout` backstop also closes (Dropdown-R7/R12). |
| `disabled` component                              | Trigger disabled (`button.css` chrome + swallowed activation), `data-state="disabled"`, menu never opens (Dropdown-R11). |
| `label` set                                       | Trigger shows the text label + chevron `iconEnd`; accessible name is the label (Dropdown-R2). |
| No `label`, `triggerIcon` + `triggerLabel`        | Icon-only `Button` circle, accessible name = `triggerLabel` (Dropdown-R2). |
| No `label`, no `triggerLabel`                     | Renders; **`Button`'s R14** dev warning fires (icon-only, no accessible name) (Dropdown-R2). |
| `align="end"`                                     | `data-align="end"`; menu anchors inline-end edge to the trigger's inline-end (Dropdown-R13/R17). |
| Item with an `icon` snippet                       | Icon renders before the label, decorative (aria-hidden); does not affect the accessible name (Dropdown-R3). |
| `danger` item                                     | `data-danger` present; destructive theme styling; label still conveys meaning (Dropdown-R3, 1.4.1). |
| `...rest` attempts `class` / `data-open`          | Component-managed value wins on the root (Dropdown-R14). |
| SSR / pre-mount                                   | Static markup renders (trigger + closed, hidden menu); the document `click` listener and `focusout` attach on mount. |

### Existing Code to Reuse

- **Trigger:** the exported `Button` (`specs/01-button.md`) — compose it for the
  trigger (Dropdown-R2), exactly as `Pagination`/`Carousel` compose `Button`; do
  **not** hand-roll a `<button>`. `Button`'s icon-only derivation (R4b) and its
  R14 accessible-name warning are reused (Dropdown-R2).
- **Popup behavior pattern:** `Nav.svelte` — `bind:this` refs, the `$effect`
  document `click` listener with cleanup for outside-click dismissal,
  `getElementById`-based menuitem `.focus()` movement, deferred focus after render
  (`tick()` / `setTimeout(…, 0)`), and the `role="menu"` / `role="menuitem"` /
  `aria-expanded` / `aria-controls` wiring. Mirror it (in a new component; do not
  extend `Nav`).
- **Listener / id / cx idioms:** `Combobox.svelte` — internal `open` `$state`, the
  `composedPath()` outside-click check, `onfocusout` close-on-focus-out, `uid`
  base + derived ids, `cx` root-class composition. Mirror these.
- **Utils:** `cx` and `uid` from `src/lib/utils` — no new class-merge or id logic.
- **Types:** `DropdownItem` / `DropdownSeparator` / `DropdownEntry` /
  `DropdownTriggerProps` in `src/lib/types/index.ts` (Dropdown-R15); reuse the
  shared `Variant` type there for `triggerProps.variant`.
- **Icons:** `IconChevronDown` from `$lib/icons` for the default trigger chevron.
- **Callback idiom:** the single component-level `onselect(id, item)` mirrors
  `Pagination.onchange` / `Combobox.onchange`; the per-item `onselect` mirrors
  common menu-library ergonomics (Dropdown-R4).
- **Tokens:** `--hz-z-dropdown` for menu layering, `--hz-space-*` /
  `--hz-radius-*` / `--hz-color-*` with literal fallbacks (Dropdown-R17).
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` (Dropdown-R16).
- **Theme:** a new `src/lib/theme/dropdown.css` in `@layer hz-theme`, imported by
  `theme.css` alongside the other component sheets (Dropdown-R17).
- **Docs scaffold:** `src/docs/DocPage.svelte`, `Example.svelte`,
  `PropsTable.svelte` (with `PropRow`), `Tabs`, `Alert` from `$lib` — mirror
  `src/routes/forms/select/+page.svelte` and `src/routes/forms/combobox/+page.svelte`
  (Dropdown-R18).
- **Test harness:** mirror `Combobox.svelte.spec.ts` / `Nav.svelte.spec.ts` —
  Vitest browser mode (`vitest-browser-svelte`: `render`, `page.getBy*`,
  `await expect.element`, `userEvent` from `vitest/browser`), asserting real focus
  with `document.activeElement`. `expect.requireAssertions` is on.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file
`src/lib/components/Dropdown.svelte.spec.ts` (the `.svelte.spec.ts` suffix routes
to the browser `client` project in `vite.config.ts`). Real DOM focus, roving
tabindex, keyboard navigation, typeahead, and focus return are asserted in the
real browser via `document.activeElement`. No Playwright e2e (docs demos are a
later sprint).

**Unit / component (browser):**

- **Structure & ARIA (Dropdown-R1/R2/R3):** root `.hz-dropdown` with
  `data-align`; trigger is a `.hz-button.hz-dropdown-trigger` with
  `aria-haspopup="menu"`, `aria-expanded="false"` closed / `"true"` open,
  `aria-controls` → the `role="menu"` id; menu `aria-labelledby` → the trigger id;
  each `<button role="menuitem">` with a stable id; separators are
  `role="separator"` and not focusable; the menu is `display:none` (out of a11y
  tree) while closed; **no** `aria-activedescendant` / `data-active` is emitted.
- **Open triggers & opening focus (Dropdown-R5/R6):** click, `Enter`, `Space`,
  `ArrowDown` open focused on the **first** menuitem; `ArrowUp` opens focused on
  the **last** (`document.activeElement` is that button, `tabindex="0"`; others
  `tabindex="-1"`). Clicking the trigger while open closes it and focus stays on
  the trigger.
- **In-menu keyboard (Dropdown-R7):** `ArrowDown`/`ArrowUp` move real focus
  (wrapping, **including** disabled items) with the roving tabindex tracking the
  focused item; `Home`/`End` focus first/last; `Escape` closes and focus returns
  to the trigger; `Tab` closes the menu. `ArrowUp`/`Down`/`Home`/`End` do not
  scroll (preventDefault). `Enter`/`Space` are handled by the item button (no
  double activation).
- **Typeahead (Dropdown-R8):** a character focuses the next label-initial match,
  cycles on repeat, matches disabled items, and no-ops on no match; `Space` is
  **not** treated as typeahead.
- **Activation (Dropdown-R4/R9):** click and `Enter`/`Space` on an enabled item
  fire `item.onselect` **then** `onselect(id,item)` (assert order/args), close the
  menu, and return focus to the trigger; a disabled item's click/Enter is a no-op
  that leaves the menu open and fires no callback.
- **Disabled items (Dropdown-R10):** a disabled `<button role="menuitem">` has
  `aria-disabled="true"` + `data-disabled`, **no** native `disabled`, is reachable
  by Arrow/typeahead, and is inert on activation.
- **Disabled menu (Dropdown-R11):** `disabled` → trigger `Button` disabled, root
  `data-state="disabled"`, and no open trigger (click/key) opens the menu.
- **Outside click / focus-out (Dropdown-R12):** an outside pointer click closes
  the menu without moving focus; focus leaving the root (`relatedTarget` outside)
  closes it; focus moving trigger→item or item→item keeps it open.
- **Alignment (Dropdown-R13):** `align="end"` → `data-align="end"` on the root.
- **Trigger faces (Dropdown-R2):** `label` → visible text + accessible name;
  icon-only (`triggerIcon` + `triggerLabel`, no `label`) → `Button` icon-only form
  with the aria-label; icon-only with no `triggerLabel` → `console.warn` spy
  called (Button R14). `triggerProps` (e.g. `{ variant:'ghost', intent:'primary',
  class:'foo' }`) reaches the trigger's `data-variant`/`data-intent`/class.
- **class & rest (Dropdown-R14):** no `class` → root is exactly `hz-dropdown`;
  `class="foo"` appended; a forwarded `data-testid` reaches the root; an attempted
  `data-open`/`class` override loses to the managed value; rest does not land on
  the trigger/menu/items.
- **Export (Dropdown-R16):** extend `exports.spec.ts` to assert `Dropdown`
  resolves from `$lib` (+ smoke render).

**Integration (browser):** a `Dropdown` rendered after another focusable element
— opening, activating an item, and pressing `Escape` each return focus to the
trigger; `Tab` from the open menu lands on the next document tabbable and the menu
closes (no focus trap).

### Out of Scope

- **Link `menuitem`s (`href` items)** — v1 is action-only (every item is a
  `<button role="menuitem">`). APG permits `role="menuitem"` links; a future
  addition can extend `DropdownItem` with `href`/`external` and the anchor
  activation paths (native Enter-navigate, Space-to-click, `target`/`rel`,
  navigate-vs-focus-return). Until then, navigational disclosure is `Nav`'s job.
- **Submenus / nested menus** (`aria-haspopup` on an item, flyout panels,
  `ArrowRight`/`ArrowLeft` traversal) — deferred; a single flat menu only.
- **Checkbox / radio `menuitem`s** (`role="menuitemcheckbox"` /
  `menuitemradio`, `aria-checked`, selection state) — deferred; items are actions.
- **Groups with labels** (`role="group"` + `aria-label`, section headings) —
  only flat items + `role="separator"` dividers ship; grouped/labelled sections
  are a later addition (as `Select`'s optgroup form is to `Combobox`'s flat list).
- **Context menu / right-click activation** and **hover-open** — the menu opens
  only from the trigger via click / keyboard; no `contextmenu` or hover intent.
- **Controlled / bindable open state** — `open` is internal `$state` only
  (Context); add a bindable prop only if a controlled-open need appears.
- **Floating-popup collision handling** (flip / shift / auto-placement, portalling
  out of overflow) — the menu anchors below the trigger with `start`/`end`
  alignment and a `max-height` scroll; no floating-ui engine (same stance as
  `Combobox`).
- **Multi-character buffered typeahead** — v1 does single-character cyclic
  matching (Dropdown-R8).
- **Option / item virtualization** for very large menus — action menus are short;
  every item renders. (Cross-reference the `Virtualizer` follow-up noted in
  `specs/22-combobox.md` if a huge-menu need appears.)
- **Colors, borders, shadows, radius, fonts, and state animation** — the
  reference theme's job (`dropdown.css`; the trigger is `button.css`); the
  component guarantees only stable `hz-*` hooks + `data-*` / `aria-*`.
- **Playwright e2e** for the docs demo — later sprint (Dropdown-R18 ships the page
  and manifest entry; the browser unit suite covers behavior).
