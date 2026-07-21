# Nav Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (Rn) and edge case as pass/fail. Write scope for the Builder is the
> library source (`src/lib/**`).

### Goal

Ship one headless Svelte 5 `Nav` component that renders simple flat navigations,
dropdown navigations, and navigable-parent-with-dropdown from a single
`NavItem[]` data shape — shipping correct semantics, ARIA, keyboard handling,
open/close state, and the **structural responsive CSS** needed for the
mobile/desktop collapse to work out of the box, while shipping **no** visual
opinions (no colors, borders, shadows, fonts, or animation).

### Context & Conventions

- Svelte 5 **runes mode** is forced project-wide; the component is TypeScript.
- One public component file `src/lib/components/Nav.svelte`, exported from the
  barrel `src/lib/components/index.ts`, resolvable via `import { Nav } from '$lib'`.
- Consumes the **existing** shared `NavItem` type from `$lib/types` (already
  defined in `src/lib/types/index.ts`). This spec does **not** redefine or extend
  it — `original-specs/04-nav-types.md` is satisfied by existing code; the only
  type work is importing `NavItem`.
- Like the five layout primitives (`specs/03-layout.md`), Nav is an
  **intentional, scoped exception** to the otherwise zero-CSS headless rule
  (`original-specs/00-architecture.md`): because it explicitly owns the
  mobile/desktop navigation collapse, it ships **structural** CSS (display /
  visibility / flex / positioning / responsive media queries) in its scoped
  Svelte `<style>` block. It still ships **no** colors, borders, shadows, fonts,
  or animation.
- All shipped numeric spacing values reference design-token custom properties
  **with literal fallbacks**, e.g. `gap: var(--hz-space-md, 1rem)`. Tokens are a
  Sprint-1 placeholder today (`src/lib/tokens/tokens.css`), so fallbacks make the
  nav functional now and auto-upgrade when tokens land.
- Mirror `src/lib/components/Link.svelte` for `$props()` destructuring,
  `class: className` composition via `cx`, and `...rest`-first spread order
  (managed attributes win).
- "Slots" in the brief are Svelte 5 **snippet props**: `logo` and `actions`.

### Props

| Prop               | Type                                       | Default             |
| ------------------ | ------------------------------------------ | ------------------- |
| `items`            | `NavItem[]`                                | _required_          |
| `sticky`           | `boolean`                                  | `false`             |
| `variant`          | `'default' \| 'transparent' \| 'bordered'` | `'default'`         |
| `mobileBreakpoint` | `'sm' \| 'md' \| 'lg'`                      | `'md'`              |
| `ariaLabel`        | `string`                                   | `'Main navigation'` |
| `logo`             | `Snippet` (optional)                       | —                   |
| `actions`          | `Snippet` (optional)                       | —                   |
| `menuIcon`         | `Snippet` (optional)                       | shipped `IconMenu`  |
| `chevronIcon`      | `Snippet` (optional)                       | shipped `IconChevronDown` |
| `class`            | `string` (optional, → `cx`)                | —                   |

Plus arbitrary `...rest` HTML attributes forwarded to the root `<nav>`. Declare
the prop unions **locally** in the component (mirroring `Link`'s
`LinkVariant`/`LinkSize`); do not add new shared types.

The component inspects each `NavItem`:

- **`href` only** → renders a link
- **`children` only** → renders a dropdown trigger (no link; click opens submenu)
- **`href` + `children`** → renders a link **plus** a separate chevron trigger

### Requirements

Each is a testable assertion. Boolean `data-*` "present" = empty-valued attribute
exists; "absent" = not rendered at all.

**Structure & props**

1. **R1 — Root landmark.** Renders `<nav class="hz-nav" aria-label={ariaLabel}>`
   with `ariaLabel` default `"Main navigation"`. `data-variant` reflects
   `variant` verbatim for every enum value (default `default`). `data-sticky`
   present iff `sticky=true`, absent otherwise. `data-mobile-breakpoint` reflects
   `mobileBreakpoint` verbatim (`sm`|`md`|`lg`, default `md`).
2. **R2 — items required.** `items: NavItem[]` is required and drives all
   rendering. `items={[]}` renders the `<nav>` with `logo`/`actions` and the
   toggle, but no link `<li>`s and no error.
3. **R3 — logo / actions snippets.** When provided, the `logo` snippet renders at
   the start of the desktop bar; the `actions` snippet renders in the desktop bar
   (right side) **and** inside the mobile menu (a snippet may render twice). Both
   optional; absent → nothing rendered, no empty wrappers, no error.
4. **R4 — icon override snippets.** The hamburger icon defaults to the shipped
   `IconMenu` and the dropdown chevron defaults to the shipped `IconChevronDown`;
   when `menuIcon` / `chevronIcon` snippet props are supplied they render in place
   of the respective defaults everywhere that icon appears.

**Per-item render mode**

5. **R5 — link-only (`href`, no `children`).** Renders a navigable link inside
   `<li>` in the desktop link list, with no dropdown trigger and no
   `data-has-children`.
6. **R6 — trigger-only (`children`, no `href`).** Renders
   `<li class="hz-nav-dropdown" data-has-children>` containing a
   `<button aria-expanded aria-haspopup="true" aria-controls={panelId}>` labeled
   with the item `label` + chevron icon, plus the dropdown panel (R9). No
   navigable link for the parent.
7. **R7 — link + dropdown (`href` and `children`).** Renders
   `<li class="hz-nav-dropdown" data-has-children>` containing a navigable link
   (the label) **plus** a separate chevron
   `<button aria-expanded aria-haspopup="true" aria-controls={panelId} aria-label="{label} submenu">`,
   plus the dropdown panel (R9).
8. **R8 — links reuse Link.** Every navigable link (top-level, dropdown items,
   mobile) is rendered via the existing `Link` component with `variant="nav"`,
   forwarding `href`, `external`, and `ariaCurrent` so external links
   automatically get `target="_blank"`, `rel="noopener noreferrer"`, and the
   sr-only "(opens in new tab)" announcement, and current items get
   `aria-current`. Dropdown-menu links additionally carry `role="menuitem"`
   (forwarded via Link's `...rest`).

**Desktop dropdown behavior**

9. **R9 — dropdown panel.** Each dropdown renders
   `<ul id={panelId} role="menu" data-state="closed|open">` with children as
   `<li role="none"><a role="menuitem" …>`. `panelId` is generated via the
   existing `uid` util. `data-state` is `open` only for the single currently-open
   dropdown, else `closed`; the trigger's `aria-expanded` matches (`"true"` when
   open, `"false"` when closed).
10. **R10 — single open / toggle on click.** Clicking a trigger toggles its
    dropdown; opening one closes any other (only one open at a time). Clicking an
    open trigger closes it.
11. **R11 — dismiss.** A click outside any open dropdown closes it; `Escape`
    closes the open dropdown and returns focus to its trigger.

**Mobile menu**

12. **R12 — toggle button.** Renders
    `<button class="hz-nav-toggle" aria-expanded aria-controls={menuId} aria-label="Toggle navigation menu">`
    containing the menu icon (R4). `aria-expanded` reflects mobile-menu open
    state (`"true"`/`"false"`).
13. **R13 — mobile menu container.** Renders
    `<div id={menuId} class="hz-nav-mobile" data-state="closed|open">` containing
    all items as a vertical list plus the `actions` snippet. `data-state`
    reflects open/closed; `menuId` via `uid`.
14. **R14 — mobile dropdown items use native disclosure.** Items with `children`
    render in the mobile menu as
    `<details class="hz-nav-mobile-section"><summary>{label} chevron</summary><ul>…links…</ul></details>`
    — accordion pattern, **no** `role="menu"`. Flat links render as plain list
    links.
15. **R15 — mobile focus trap.** When the mobile menu is open it traps focus among
    its focusable elements (`Tab`/`Shift+Tab` cycle within the menu); `Escape`
    closes the menu and returns focus to the toggle button.

**Keyboard (desktop dropdowns)**

16. **R16 — keyboard map.** On a dropdown trigger: `Enter`/`Space` toggle;
    `ArrowDown` opens and moves focus to the first menu item. Within an open
    `role="menu"`: `ArrowUp`/`ArrowDown` move roving focus between `menuitem`s,
    `Home`/`End` jump to first/last, `Escape` closes and returns focus to the
    trigger, `Tab` closes the dropdown and moves to the next top-level item.

**Responsive CSS (shipped, structural)**

17. **R17 — responsive collapse.** The component ships scoped media-query CSS,
    keyed off `data-mobile-breakpoint`, that:
    - **Below** the named breakpoint: hides `hz-nav-links` (`display: none`) and
      shows `hz-nav-toggle`; the mobile menu (`hz-nav-mobile`) is available.
    - **At/above** the named breakpoint: shows `hz-nav-links`, hides
      `hz-nav-toggle` and `hz-nav-mobile`.

    Breakpoints use the unified scale from `specs/03-layout.md` as **literal**
    `min-width` values (CSS media-query conditions cannot read custom properties):
    `sm`=`640px`, `md`=`968px`, `lg`=`1200px`. Each `data-mobile-breakpoint` value
    is matched by an attribute-scoped media query
    (`.hz-nav[data-mobile-breakpoint='md'] … @media (min-width: 968px) { … }`).
18. **R18 — open/closed visibility.** Shipped structural CSS hides closed surfaces
    and shows open ones: a dropdown panel and the mobile menu are not visible
    while `data-state="closed"` and become visible at `data-state="open"`.
    Dropdown panels are positioned (e.g. `position: absolute`) relative to their
    `hz-nav-dropdown` `<li>`. No animation accompanies the transition.

**Cross-cutting**

19. **R19 — class composition.** Root `class` is `cx('hz-nav', className)`:
    `hz-nav` always first, never removable. No `class` → exactly `hz-nav`;
    `class="foo bar"` → `hz-nav foo bar`.
20. **R20 — rest forwarding.** Arbitrary `...rest` HTML attributes forward onto
    the root `<nav>` and must **not** overwrite managed attributes (`class`,
    `aria-label`, and every `data-*` in R1). Rest is spread first so managed
    attributes win.
21. **R21 — barrel export.** `Nav` exports from `src/lib/components/index.ts` and
    resolves via `import { Nav } from '$lib'`.

### Amendment (2026-07-16, specs/31) — heading entries

22. **R22 — group labels inside `children`.** A `children` array accepts a
    heading entry (`{ heading: string }`, the `NavHeading` subtype of
    `NavChild`) alongside link items, so a long section can be banded without a
    second disclosure level. It renders as a static
    `<li class="hz-nav-heading">` carrying the text: **no href, no button, no
    focus stop.** Keyboard traversal skips it for free — the roving logic
    targets `[role=menuitem]` and the mobile trap collects links, buttons and
    summaries, and a heading is none of those. Screen readers read it in
    sequence before the links it labels; it takes no `role="separator"` and no
    `aria-hidden`, because the label is information.
    - Supported in vertical orientation; a horizontal dropdown panel renders it
      identically, with `role="presentation"` so the `role="menu"` parent keeps
      only `menuitem` children in its accessibility tree.
    - **Children-only.** A heading in the top-level `items` array is out of
      contract: Nav filters it out and warns in dev. It has no `label`, so
      rendering it as a top-level item would emit an empty row.
    - Discriminate with `isNavHeading` from `$lib/utils`. The guard lives with
      the runtime helpers because `$lib/types` stays type-only (it is the
      declaration-merging module for `IntentRegistry`).
    - The reference theme styles `.hz-nav-heading` as muted, small, uppercase
      text — a label, not a link.

### Amendment (2026-07-17, specs/34) — nested vertical disclosure

23. **R23 — vertical orientation supports nested disclosure.** This reverses
    the earlier "no nesting beyond one tier" for the **vertical** orientation:
    a `children` entry that is itself a `NavItem` with its own `children`
    renders as a nested collapsible sub-section (recursive). Open state is
    keyed by a stable path so it survives `items` rebuilds; `defaultOpen`
    cascades per level. **Horizontal is unchanged** — its menus stay one tier;
    an href-less nested group degrades to a `.hz-nav-heading` label, a nested
    child *with* an href stays a flattened link. See specs/34 Part A for the
    full contract and a11y.

### Structural CSS (shipped)

Authored by the Builder in the component's scoped `<style>`. Illustrative only —
do not copy-paste; the requirements above are the contract.

- **Bar:** `hz-nav-inner` is a flex row holding logo, links, actions, and toggle;
  `hz-nav-links` is a flex row of items; gaps use `var(--hz-space-*, <fallback>)`.
- **Responsive collapse (R17):** attribute-scoped media queries at literal
  `640/968/1200px` toggle `display` of `hz-nav-links` vs `hz-nav-toggle` +
  `hz-nav-mobile`.
- **Dropdown (R18):** `hz-nav-dropdown` is positioned context; the `role="menu"`
  panel is absolutely positioned and hidden at `data-state="closed"`, shown at
  `data-state="open"`.
- **Mobile menu (R18):** `hz-nav-mobile` is a vertical stack, hidden at
  `data-state="closed"`, shown at `data-state="open"`; sections are native
  `<details>`.

No colors, borders, shadows, fonts, or animation. All spacing values use
`var(--hz-space-…, <fallback>)`.

### Responsive Behavior

Mobile-first; breakpoints `sm`=640px, `md`=968px, `lg`=1200px (unified scale from
`specs/03-layout.md`), selected per item by the `mobileBreakpoint` prop.

- **Mobile (< breakpoint):** desktop `hz-nav-links` hidden; `hz-nav-toggle`
  shown; opening the toggle reveals `hz-nav-mobile`; dropdown items are
  `<details>` accordions; no hover interaction.
- **Tablet / Desktop (≥ breakpoint):** `hz-nav-links` shown with click-driven
  `role="menu"` dropdowns; toggle and mobile menu hidden.

Single-column reflow at 320px is supported (mobile menu stacks; no fixed widths).

### Accessibility (WCAG 2.1 AA)

- `<nav>` landmark with `aria-label` (2.4.1, 4.1.2).
- Toggle button exposes `aria-expanded` + `aria-controls`; icon-only toggle
  carries `aria-label="Toggle navigation menu"` (4.1.2).
- Dropdown triggers: `aria-expanded`, `aria-haspopup="true"`, `aria-controls`;
  panels `role="menu"`, items `role="menuitem"`, list items `role="none"`.
- Mobile dropdown sections use the native `<details>`/`<summary>` disclosure
  pattern (no `role="menu"`).
- Focus management: `ArrowDown` on a trigger opens and focuses the first menu
  item; `Escape` returns focus to the trigger; the open mobile menu traps focus
  and returns it to the toggle on close (2.4.3).
- DOM order = reading order; `aria-current` flows from `NavItem.ariaCurrent` via
  the reused `Link` (1.3.2).
- External links: `target="_blank"`, `rel="noopener noreferrer"`, sr-only
  "(opens in new tab)" — inherited from the reused `Link` component (3.2.5).
- Touch targets: the toggle and triggers are real `<button>`s; sizing is the
  consumer's concern (no fixed dimensions shipped).
- Reduced motion: no animation is shipped, so there is nothing to gate.
- Skip-nav compatible: the component adds no skip link; consumers add their own.

### Edge Cases & Error States

| Case                                              | Expected behavior                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `items={[]}`                                      | `<nav>` renders with logo/actions/toggle; no link `<li>`s; no error.              |
| No `logo` / no `actions`                          | Snippets not rendered; no empty wrappers, no error.                               |
| Item with neither `href` nor `children`           | Non-navigable `<li>` with the label as plain text (no `<a>`, no trigger).         |
| Item with `href` + `children`                     | Navigable link **and** separate chevron trigger (R7).                             |
| `external: true` item                             | `target`/`rel`/sr-only announcement via the reused `Link`.                        |
| `ariaCurrent` set on an item                      | `aria-current` rendered on that link via `Link`.                                  |
| Nesting deeper than one level                     | Third-level `children` are ignored/flattened — only one dropdown tier renders.    |
| Two triggers, open one then the other             | First closes when the second opens (R10, single-open).                            |
| `Escape` / outside-click with nothing open        | No-op; no error.                                                                  |
| `menuIcon` / `chevronIcon` override provided       | Custom snippet renders in place of the shipped default everywhere it appears.     |
| Rest attr attempts `class` / `aria-label` / `data-variant` | Component-managed value wins (R20).                                       |
| Mobile menu open, then viewport widened past breakpoint | State persists in `data-state`; the responsive CSS handles the visual handover; no JS resize listener required. |

### Existing Code to Reuse

- **Types:** import `NavItem` from `$lib/types` — already defined; do **not**
  redefine or extend (`src/lib/types/index.ts`).
- **Link rendering:** reuse `src/lib/components/Link.svelte` with `variant="nav"`
  for all navigable links (external / aria-current / sr-only handled there);
  forward `role="menuitem"` via Link's `...rest` for dropdown-menu links (R8).
- **Utils:** `cx` for class composition (R19); `uid` for `aria-controls`
  panel/menu IDs (R9, R13) — from `src/lib/utils`. Do not inline duplicates.
- **Icons:** `src/lib/icons` currently exports only `IconLoader`. The Builder adds
  `IconMenu` and `IconChevronDown` mirroring `src/lib/icons/IconLoader.svelte`
  (24px `viewBox`, `stroke="currentColor"`, `aria-hidden` unless `ariaLabel`, a
  `size` prop) and exports them from `src/lib/icons/index.ts`. These are the
  defaults for the `menuIcon` / `chevronIcon` snippet props (R4).
- **Tokens:** reference `--hz-space-*` custom properties with literal fallbacks;
  the namespace prefix is `--hz` (`src/lib/tokens`).
- **Component pattern:** mirror `Link.svelte` for `$props()` destructuring,
  `class: className`, and `...rest`-first spread order.
- **Test patterns:** follow `src/lib/components/Button.svelte.spec.ts` and
  `Link.svelte.spec.ts` — Vitest browser mode via `vitest-browser-svelte`
  (`render`, `page.getBy*`, `await expect.element(...)`, `createRawSnippet` for
  snippet props, keyboard via the browser driver). `expect.requireAssertions` is
  on (`vite.config.ts`) — every test must assert.
- **Export pattern:** mirror `export { default as Link }` in
  `src/lib/components/index.ts`; extend the `$lib (.)` assertion in
  `src/lib/exports.spec.ts` to include `Nav`.
- **Headless conventions:** `class="hz-nav"` + `data-*` per
  `original-specs/00-architecture.md`.

### Test Plan

Runner: **Vitest** browser project (chromium, Playwright provider) with
`vitest-browser-svelte`. One spec file `src/lib/components/Nav.svelte.spec.ts`
(the `.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). No Playwright e2e (docs demos are a later sprint). Computed
responsive styles are asserted with viewport resize + `getComputedStyle(el)`.

**Unit / component (browser):**

- R1: default `data-variant`/`aria-label`/`data-mobile-breakpoint`; `sticky`
  true → `data-sticky` present, false → absent; each `variant` /
  `mobileBreakpoint` enum parametrized → matching `data-*`.
- R2–R3: `items=[]` smoke render; `logo`/`actions` snippets present in expected
  locations (actions appears in both desktop bar and mobile menu); absent → not
  rendered.
- R4: default render uses the shipped `IconMenu`/`IconChevronDown`; supplying
  `menuIcon`/`chevronIcon` snippets renders the override instead.
- R5–R8: per render mode, assert presence/absence of trigger button,
  `data-has-children`, navigable link, `role="menuitem"` on dropdown links, and
  that external/aria-current attrs surface via the reused `Link`.
- R9–R11: trigger click toggles `aria-expanded` + panel `data-state`; opening a
  second closes the first; outside-click closes; `Escape` closes and focus
  returns to the trigger.
- R12–R15: toggle `aria-expanded`/`aria-controls`/`aria-label`; mobile container
  `data-state`; mobile dropdown items render as `<details>`/`<summary>`; mobile
  open → focus trapped (Tab cycles within), `Escape` closes and refocuses toggle.
- R16: keyboard interactions on trigger and within `role="menu"`
  (Enter/Space/ArrowDown/ArrowUp/Home/End/Escape/Tab).
- R19: no `class` → exactly `hz-nav`; `class="foo bar"` → `hz-nav foo bar` (order
  asserted).
- R20: a `...rest` attr (e.g. `data-testid`) forwarded; a rest override attempt on
  a managed attr (`class` / `aria-label` / `data-variant`) → managed value
  survives.
- R21: extend `src/lib/exports.spec.ts` to assert `Nav` resolves from `$lib`, plus
  a smoke render.

**Integration (browser, viewport resize):**

- R17: with `data-mobile-breakpoint="md"`, set viewport < 968px and assert
  `hz-nav-links` computes `display: none` while `hz-nav-toggle` is visible; set
  viewport ≥ 968px and assert `hz-nav-links` visible while `hz-nav-toggle` and
  `hz-nav-mobile` compute `display: none`. Repeat key checks for `sm`=640 and
  `lg`=1200 breakpoints.
- R18: closed dropdown panel / mobile menu compute hidden (`display: none`); after
  opening (click/toggle) they compute visible.

### Out of Scope

- Footer (`original-specs/06-footer.md`) — separate component, separate spec.
- Re-defining or extending `NavItem` / `FooterColumn` — already shipped in
  `$lib/types`.
- Any colors, borders, shadows, fonts, or animation/transitions — structural CSS
  only.
- The reference theme's visual styling of the nav — later sprint.
- Docs demo routes and Playwright e2e — later sprint.
- Mega-menu / nesting beyond one dropdown tier (the type supports it; the
  component flattens).
- New shared types in `src/lib/types/index.ts` — prop unions stay local.
