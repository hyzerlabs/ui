# Sidebar Nav Spec — nested vertical disclosure + command-palette search

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope:
> `src/lib/components/Nav.svelte` + its spec/tests (nested disclosure),
> `src/routes/+layout.svelte` (docs shell mapping + palette host),
> `src/docs/CommandPalette.svelte` (new) + its tests, docs e2e, and the spec
> amendments in R12. The manifest reorder/rename (Common-first) already landed.

### Goal

Two sidebar improvements, decided with the user (2026-07-17):

1. **Collapsible component groups.** The five Components groups (Common,
   Layout, Navigation, Media, Forms) were static, always-open headers
   (spec 31 R2). Make each a collapsible sub-section, so the long list can be
   folded down. This gives the vertical `Nav` a **second disclosure level** —
   an API change that reverses spec 04's "no nested disclosure" for the
   vertical orientation only.
2. **Command-palette search.** A search input in the docs sidebar header
   (below the logo and theme toggle) opens a results list of matching pages;
   arrow to move, Enter to jump, Escape to dismiss, Cmd/Ctrl+K to open.

The Nav/Header architecture question the user raised is a **separate
follow-up**, out of scope here.

## Part A — Nav nested vertical disclosure

The `NavItem` type already permits nesting: `children: NavChild[]` where
`NavChild = NavItem | NavHeading`, and a `NavItem` may itself carry `children`.
So this is a **renderer** change, not a type change.

1. **R1 — A child with children is a nested sub-section (vertical only).** In
   `orientation="vertical"`, a `children` entry that is itself a `NavItem` with
   its own `children` renders as a nested disclosure: a trigger button
   (`.hz-nav-trigger`) with a chevron and its own inline panel
   (`.hz-nav-panel`) of that entry's children, indented one level under its
   parent. Nesting is recursive — a nested section may contain further nested
   sections — though the docs use exactly two levels (section → group → pages).
2. **R2 — Horizontal is unchanged.** In `orientation="horizontal"`, dropdown
   panels stay one level: a nested child degrades to a static group label
   (the `.hz-nav-heading` treatment), its deeper children not rendered. Menus
   don't nest here. Spec 04's one-tier rule still holds for horizontal.
3. **R3 — Open state is per-node and survives rebuilds.** Each disclosure
   node's open/closed state is keyed by a **stable path** (top-level index,
   then child indices — e.g. `"3"`, `"3.1"`), not by object identity, because
   the docs shell rebuilds the `items` array on every navigation (to re-mark
   `aria-current`). Vertical stays **multi-open**: any number of sections and
   groups open at once. `aria-expanded` on each trigger reflects its node.
4. **R4 — `defaultOpen` cascades per level.** A node with `defaultOpen` starts
   open, at any depth, and re-opens when `items` is rebuilt (additive — never
   closes what the user opened), exactly as the one-level behavior does today.
   The docs shell sets `defaultOpen` on the active section **and** the active
   group, so navigating to `/components/button` opens Components → Common with
   the rest folded.
5. **R5 — `NavHeading` still supported.** The static group-label subtype
   (spec 31 R2) remains valid inside `children` and renders unchanged — a
   consumer who wants a non-collapsible label still has one. The docs shell
   moves the Components groups **from** headings **to** nested sections; the
   subtype itself is not removed.
6. **R6 — Nested panel a11y.** Vertical nested panels are plain disclosure
   lists (no `role="menu"`, no roving) — the same posture as the existing
   one-level vertical sections. Each trigger is a `<button aria-expanded
   aria-controls>`; the panel's id matches. Keyboard is native: Tab traverses
   triggers and links in order; Enter/Space toggles a trigger. A screen reader
   reads each trigger with its expanded state, then its contents when open.
7. **R7 — Mobile drawer.** The mobile menu (native `<details>` disclosure)
   renders nested sections as nested `<details>`, so the drawer folds the same
   way. Headings inside it stay static text (spec 31 R2).

### A11y (Part A)

- Every disclosure control is a real `<button>` with `aria-expanded`; the
  controlled panel carries a matching id via `aria-controls`. Nesting is
  conveyed by DOM structure + expanded state, not ARIA level hacks.
- Keyboard-only users reach every page: Tab to a group trigger, Enter to open,
  Tab into its links. No focus trap, no roving in vertical.
- The reviewer verifies a screen reader announces "Components, collapsed/
  expanded, button" → "Common, collapsed/expanded, button" → the page links,
  and that Tab order matches visual order.

### Edge Cases (Part A)

| Case | Expected |
| --- | --- |
| Nested section in a horizontal top-level items list | Degrades to a static label; deeper children not rendered (R2). |
| Deep nesting (3+ levels) vertical | Renders recursively; each level indents and toggles independently. |
| `items` rebuilt on navigation | Open state persists (path keys, R3); active section+group auto-open (R4). |
| A group with zero pages | Not produced by the manifest (parity test forbids it); renderer still tolerates an empty panel. |
| Heading and nested section as siblings in one `children` array | Both render — a static label and a collapsible group side by side. |

## Part B — Command-palette search (docs)

Docs chrome, not a library component — it lives in `src/docs/CommandPalette.svelte`
and is hosted by the docs shell. It searches the manifest, so it never drifts
from the nav.

8. **R8 — Trigger and placement.** A search input sits in the sidebar header,
   below the logo/theme-toggle row. `Cmd/Ctrl+K` from anywhere focuses/opens
   it; `/` may also focus it. Clicking it opens it. It shows a hint of the
   shortcut.
9. **R9 — Results.** Typing filters every routable page (the manifest's
   flattened pages) by a case-insensitive match on the page label and its
   section/group path (so "toggle", "forms toggle", and "form" all find
   Toggle). Results render as a listbox under the input, each row showing the
   page label and its section/group breadcrumb. Empty query shows nothing (or a
   short hint); no matches shows an empty-state line.
10. **R10 — Keyboard.** ArrowDown/ArrowUp move the active option (wrapping),
    Enter navigates to it, Escape clears/closes and returns focus to the input
    then the page. The combobox pattern: input is `role="combobox"`
    `aria-expanded` `aria-controls` `aria-activedescendant`; the list is
    `role="listbox"`; rows are `role="option"`. Mouse hover/click work too.
11. **R11 — Navigation.** Selecting a result navigates (SvelteKit client
    nav) to its href and closes the palette. The active page's sidebar link
    re-marks `aria-current` through the existing mechanism.

### A11y (Part B)

- Full APG combobox-with-listbox semantics (R10). The active option is tracked
  with `aria-activedescendant`; focus stays in the input.
- The shortcut is discoverable (visible hint) and does not trap: Escape always
  returns to normal browsing.
- Announced result count via an `aria-live` politeness region ("3 results").

### Edge Cases (Part B)

| Case | Expected |
| --- | --- |
| Cmd/Ctrl+K while typing in another field | Still opens the palette (global handler), unless a modal owns focus. |
| Query matches nothing | Empty-state row; Enter does nothing. |
| Enter with no active option but one result | Navigates to the sole result. |
| Palette open at 375px | Usable; results list scrolls within the drawer, no page overflow. |
| Selecting the current page | Navigates (no-op nav) and closes; harmless. |

### Existing Code to Reuse

- The vertical disclosure section rendering + `openSections` multi-open state
  (spec 04 R14) — nesting generalizes it with path keys rather than a new mode.
- `NavHeading` / `isNavHeading` (spec 31 R2) — kept; the docs shell stops using
  it for Components and uses nested sections instead.
- The manifest (`allRoutes`, `sectionPages`, groups) as the palette's index and
  the shell's nav source — one source of truth.
- The docs shell's `defaultOpen`-on-active-section pattern — extended to also
  open the active group.

### Test Plan

**Unit (browser — Nav):** vertical renders a child-with-children as a nested
`.hz-nav-trigger` + panel; toggling the nested trigger flips its
`aria-expanded` and shows/hides its panel independent of the parent; open state
is keyed so a rebuilt `items` keeps it; `defaultOpen` opens a nested node;
horizontal degrades a nested child to a static label (no deeper render).

**Unit (browser — CommandPalette):** typing filters pages; ArrowDown/Enter
navigates; Escape closes; combobox roles/`aria-activedescendant` wired; empty
and no-match states.

**e2e:** the Components section shows five collapsible group triggers; the
active group auto-expands on a component page; collapsing a group hides its
links; Cmd/Ctrl+K opens the palette, typing "toggle" then Enter lands on
`/components/toggle`; no horizontal overflow at 375px.

### Out of Scope

- The Nav/Header architecture split (separate follow-up).
- Nested disclosure in **horizontal** menus (degrades per R2).
- Fuzzy/typo-tolerant search ranking — a straightforward substring match on
  label + path is enough for 38 pages; revisit if the surface grows.
- Persisting palette history or recent pages.
