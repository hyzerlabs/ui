# Header / Nav split — extract the bar chrome into a Header component

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Write scope: `src/lib/components/Header.svelte`
> (new) + `Nav.svelte` (slim), their specs/tests, `src/lib/theme/components/
> header.css` (new) + `nav.css` (slim), `src/lib/components/index.ts`,
> `src/lib/theme/theme.css`, `src/docs/hooks.ts`, `src/docs/manifest.ts`
> (+ a Header page), the Homepage sample, the docs shell, the Nav docs page,
> and the spec amendments in R10.

### Goal

`Nav` currently does two jobs: **bar chrome** (logo, actions, the hamburger
and mobile drawer, sticky/variant/bordered, responsive collapse + focus trap)
and **navigation** (the link list with horizontal dropdowns / vertical
disclosure). The docs shell already treats it as pure navigation
(`mobileBreakpoint="none"`, its own header + drawer); the Homepage sample uses
the full bar. Split them, decided with the user (2026-07-20):

- **Header** (new) owns the bar. It composes Nav — batteries-included: given
  `items` + `brand` + `actions`, it renders the navigation horizontally in the
  bar and vertically in the drawer, and owns the responsive collapse.
- **Nav** slims to pure navigation: `items`, `orientation`, disclosure. No
  logo, no actions, no bar, no hamburger, no drawer.

Greenfield — this is a breaking change to `Nav`, and that's fine (only the docs
site and the Homepage sample consume it).

### Requirements

1. **R1 — Nav slims to navigation only.** `Nav` keeps: `items`, `orientation`
   (`horizontal` | `vertical`), `ariaLabel`, `chevronIcon`, `class`, rest. It
   renders `<nav class="hz-nav" data-orientation>` wrapping the link list
   (`.hz-nav-links`) — horizontal dropdown menus (roving `role="menu"` panels,
   single-open, outside-click/Escape close) or vertical nested disclosure
   (`.hz-nav-trigger`/`.hz-nav-panel`, multi-open, path-keyed, spec 34) exactly
   as today. **Removed props:** `sticky`, `variant`, `bordered`,
   `mobileBreakpoint`, `logo`, `actions`, `menuIcon`. **Removed markup:**
   `.hz-nav-inner`, `.hz-nav-logo`, `.hz-nav-actions`, `.hz-nav-toggle`,
   `.hz-nav-mobile*`, and the responsive-collapse CSS. The heading subtype
   (spec 31 R2) and everything under `.hz-nav-links` stays.
2. **R2 — Header composes Nav.** `Header` renders `<header class="hz-header">`
   with an inner bar: `brand` snippet, a horizontal `Nav`, then `actions`
   snippet. Props: `items` (forwarded to Nav), `brand?`, `actions?` (snippets),
   `sticky?`, `bordered?`, `variant?` (`default` | `transparent`),
   `mobileBreakpoint?` (`sm` | `md` | `lg` | `none`), `menuIcon?`,
   `chevronIcon?` (forwarded to Nav), `ariaLabel?` (the `<header>`/nav label),
   `class`, rest. It exports from `$lib`.
3. **R3 — Responsive collapse (Header owns it).** Below `mobileBreakpoint`,
   the bar hides its Nav and actions and shows a hamburger (`.hz-header-toggle`,
   `menuIcon` overridable) that toggles a drawer (`.hz-header-drawer`). The
   drawer renders a **vertical** `Nav` (same `items`, inline disclosure) plus
   the `actions`. `mobileBreakpoint="none"` never collapses (bar-only, no
   hamburger/drawer). This is the exact behavior Nav has today, moved up.
4. **R4 — Drawer a11y (moved intact).** The hamburger carries `aria-expanded`
   / `aria-controls`; the drawer traps focus while open (Tab cycles within),
   `Escape` closes and returns focus to the toggle, an outside click closes.
   Both the bar and drawer navs are real `<nav>` landmarks with distinct
   accessible names (`ariaLabel` for the bar/brand region; the Nav's own label
   for the lists) so nested landmarks don't collide.
5. **R5 — Two Navs, one item set.** Header renders `<Nav items
   orientation="horizontal">` in the bar and `<Nav items
   orientation="vertical">` in the drawer, forwarding `chevronIcon`. The
   vertical drawer Nav uses the same nested-disclosure rendering as the sidebar
   (spec 34), replacing the old bespoke `<details>` drawer markup.
6. **R6 — Theme CSS split.** `nav.css` keeps only the link-list/panel/
   trigger/heading/chevron rules (both orientations). A new `header.css` holds
   the bar (`.hz-header`, `.hz-header-inner`), `.hz-header-brand`,
   `.hz-header-actions`, `.hz-header-toggle`, `.hz-header-drawer` +
   `-drawer-actions`, and the sticky/variant/bordered + responsive rules
   (keyed on `.hz-header[data-*]`). Register `header.css` in `theme.css`
   (loaded near nav.css). Class renames: `hz-nav-logo`→`hz-header-brand`,
   `hz-nav-actions`→`hz-header-actions`, `hz-nav-toggle`→`hz-header-toggle`,
   `hz-nav-inner`→`hz-header-inner`, `hz-nav-mobile`→`hz-header-drawer`,
   `hz-nav-mobile-actions`→`hz-header-drawer-actions`,
   `hz-nav-mobile-section` drops (drawer uses vertical Nav disclosure).
7. **R7 — Theme hooks.** `src/docs/hooks.ts`: a new **Header** entry (root
   `hz-header`; attrs `data-variant`/`data-sticky`/`data-bordered`/
   `data-mobile-breakpoint`, drawer `data-state`; parts brand/actions/toggle/
   drawer). **Nav** entry loses the bar/drawer parts, keeping the link-list
   parts. The pinning test (`hooks.spec.ts`) must stay green in both
   directions.
8. **R8 — Docs page + IA.** Add a **Header** page under the Navigation group
   (`/components/header`, manifest + route + DocPage). The **Nav** page drops
   its bar/mobile demos and documents pure navigation (horizontal menus,
   vertical disclosure); its bar/logo/actions demos move to the Header page.
9. **R9 — Migrate consumers.** The Homepage sample switches its `<Nav logo
   actions>` top bar to `<Header brand actions items>`. The docs shell's
   vertical `<Nav>` drops the now-removed `mobileBreakpoint`/`variant` props
   (its bespoke fixed-sidebar chrome is unchanged; it keeps composing Nav
   directly, not Header, since it owns a custom drawer). The prerender crawl
   stays green.
10. **R10 — Spec bookkeeping.** `specs/04-nav.md`: dated amendment — Nav is
    navigation-only; the bar/logo/actions/mobile contract moved to Header
    (specs/35). `specs/16-docs.md`: Header joins the component IA. Historical
    references aren't rewritten.

### Accessibility

- Nested `<nav>` landmarks (bar Nav, drawer Nav) each need a distinct
  accessible name — reviewer verifies a screen reader can tell them apart.
- The drawer keeps the current focus trap, Escape-to-close, and
  toggle-returns-focus contract verbatim; it is a move, not a redesign.
- The bar collapses only via `mobileBreakpoint`; keyboard users reach every
  link through the hamburger → drawer at narrow widths.

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| `Header` with no `items` | Bar renders brand + actions; the Nav renders an empty list; no hamburger content beyond an empty drawer. |
| `Header mobileBreakpoint="none"` | Bar only — Nav + actions always inline, no toggle, no drawer. |
| A heading entry in Header `items` (top level) | Same as Nav: filtered out, dev-warns (children-only, spec 31 R2). |
| Vertical `Nav` used directly (docs sidebar) | Unchanged — pure navigation, nested disclosure (spec 34). |
| Header drawer open, resize to desktop | Drawer hides via the responsive rule; state is harmless. |

### Existing Code to Reuse

- All of Nav's current bar/mobile/focus-trap/keyboard code — this is a **move**
  into Header, not a rewrite. Keep the behavior identical; only the component
  boundary and class names change.
- Nav's horizontal dropdown + vertical disclosure rendering stays in Nav and is
  what Header composes.
- The docs shell already demonstrates pure-Nav usage — its pattern is the
  reference for the slimmed Nav.

### Test Plan

**Unit (Nav):** the existing link-list / dropdown / vertical-disclosure /
heading / nested-disclosure tests stay and pass against the slimmed component;
tests asserting `.hz-nav-logo`/`.hz-nav-actions`/`.hz-nav-toggle`/`.hz-nav-mobile`
move to the Header spec.

**Unit (Header):** bar renders brand + horizontal Nav + actions; below the
breakpoint the toggle appears and opens the drawer; the drawer holds a vertical
Nav + actions; focus trap, Escape-closes-and-refocuses, outside-click close;
`mobileBreakpoint="none"` never collapses; distinct landmark names.

**Unit (server):** `hooks.spec.ts` green — Header documented and real, Nav entry
trimmed; every component page (now incl. Header) covered.

**e2e:** `/components/header` renders and its demos work; the Homepage sample's
header still renders and its nav landmark name is distinct from the docs
sidebar; prerender crawl green over the new route.

### Out of Scope

- A `Drawer`/`Sidebar` primitive (the docs shell keeps its bespoke fixed
  sidebar; Header covers the top-bar case).
- Changing Nav's disclosure behavior (spec 34 stands).
- Multi-row / mega-menu headers.
