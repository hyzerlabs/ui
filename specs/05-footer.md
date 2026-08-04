# Footer Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (Rn) and edge case as pass/fail. Write scope for the Builder is the
> library source (`src/lib/**`).

### Goal

Ship one headless Svelte 5 `Footer` component that renders multi-column link
sections from a `FooterColumn[]` data shape — with correct `<footer>`/`<nav>`
landmark semantics, per-column `aria-label`s, external-link handling, and the
**structural responsive CSS** needed for columns to stack on mobile and flow into
a grid on wider viewports — while shipping **no** visual opinions (no colors,
borders, shadows, fonts, or animation).

### Context & Conventions

- Svelte 5 **runes mode** is forced project-wide; the component is TypeScript.
- One public component file `src/lib/components/Footer.svelte`, exported from the
  barrel `src/lib/components/index.ts`, resolvable via `import { Footer } from '$lib'`.
- Consumes the **existing** shared `FooterColumn` and `NavItem` types from
  `$lib/types` (`src/lib/types/index.ts`). This spec does **not** redefine or
  extend them. Footer reads `NavItem.label`, `href`, `external`, and `ariaCurrent`,
  and **ignores** `NavItem.children` (per `original-specs/00-architecture.md`:
  "Footer uses the same `NavItem` and ignores `children`").
- Like Nav (`specs/04-nav.md`) and the layout primitives (`specs/03-layout.md`),
  Footer is an **intentional, scoped exception** to the zero-CSS headless rule
  (`original-specs/00-architecture.md`): because it owns the column-stacking
  responsive layout, it ships a **minimal structural** CSS override in its scoped
  `<style>` block. It ships **no** colors, borders, shadows, fonts, or animation.
- All shipped numeric spacing values reference design-token custom properties
  **with literal fallbacks**, e.g. `gap: var(--hz-space-lg, 1.5rem)` (per the
  Shared Scales in `specs/03-layout.md`).
- Mirror `src/lib/components/Link.svelte` for `$props()` destructuring,
  `class: className` composition via `cx`, and `...rest`-first spread order
  (managed attributes win).
- "Slots" in the brief are Svelte 5 **snippet props**: `logo`, `social`, `bottom`.

### Props

| Prop           | Type                                   | Default     |
| -------------- | -------------------------------------- | ----------- |
| `columns`      | `FooterColumn[]`                       | _required_  |
| `variant`      | `'default' \| 'minimal' \| 'bordered'` | `'default'` |
| `linkVariant`  | `'default' \| 'subtle' \| 'nav'`       | `'subtle'`  |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6`                 | `2`         |
| `logo`         | `Snippet` (optional)                   | —           |
| `social`       | `Snippet` (optional)                   | —           |
| `bottom`       | `Snippet` (optional)                   | —           |
| `class`        | `string` (optional, → `cx`)            | —           |

Plus arbitrary `...rest` HTML attributes forwarded to the root `<footer>`.
Declare the `variant` / `linkVariant` / `headingLevel` unions **locally** in the
component (mirroring `Link`'s `LinkVariant`); do not add new shared types.

### Requirements

Each is a testable assertion. Boolean `data-*` "present" = empty-valued attribute
exists; "absent" = not rendered at all.

**Structure & props**

1. **R1 — Root landmark.** Renders `<footer class="hz-footer">` (implicit
   `contentinfo` landmark; no `role` added). `data-variant` reflects `variant`
   verbatim for every enum value (`default`|`minimal`|`bordered`, default
   `default`). `variant` is a styling hook only — it produces **no** structural or
   behavioral difference in the component.
2. **R2 — columns required.** `columns: FooterColumn[]` is required and drives the
   column rendering. `columns={[]}` renders the `<footer>` with any provided
   `logo`/`social`/`bottom` snippets and **no** `<nav>` columns and no error.
3. **R3 — logo / social / bottom snippets.** When provided, `logo` renders first
   (before the columns), `social` renders after the columns, and `bottom` renders
   last. Each is optional; when absent, nothing is rendered for it — **no empty
   wrapper element, no error**. When present, each is wrapped in its styling-hook
   container (`hz-footer-logo`, `hz-footer-social`, `hz-footer-bottom`
   respectively), and that wrapper exists only when its snippet is present.

**Columns**

4. **R4 — column = labelled nav.** Each `FooterColumn` renders as
   `<nav class="hz-footer-column" aria-label={column.title}>` containing a heading
   `<svelte:element this={`h${headingLevel}`} class="hz-footer-heading">{column.title}</…>`
   (default `<h2>` per `headingLevel=2`) and a `<ul role="list">` of its links.
   `headingLevel` reflects verbatim into the rendered tag for every enum value
   (`2`–`6`). All columns are wrapped in the single columns container of R8.
5. **R5 — links reuse Link.** Each `NavItem` in `column.links` with an `href`
   renders as `<li>` containing the existing `Link` component with
   `variant={linkVariant}` (default `subtle`, overridable via the `linkVariant`
   prop), forwarding `href`, `external`, `ariaCurrent`, and using `label` as the
   link text. External links therefore automatically get `target="_blank"`,
   `rel="noopener noreferrer"`, and the sr-only "(opens in new tab)" announcement;
   items with `ariaCurrent` get `aria-current` — both inherited from `Link`.
6. **R6 — children ignored.** `NavItem.children`, if present on any footer link,
   is **ignored** — no nested list, no dropdown, no trigger is rendered. Only
   `label`/`href`/`external`/`ariaCurrent` are used.
7. **R7 — non-navigable item.** A `NavItem` with **no** `href` renders as `<li>`
   containing the `label` as plain text (no `<a>`, no `Link`), mirroring Nav's
   non-navigable handling.

**Responsive CSS (shipped, structural)**

8. **R8 — responsive columns via Grid + auto-fit override.** The columns wrapper
   is the existing `Grid` primitive (`import { Grid } from '$lib'`) rendered with
   `class="hz-footer-columns"` (so the container carries both `hz-grid` and
   `hz-footer-columns`). Footer ships a single minimal scoped style — authored with
   a `:global(.hz-footer-columns)` selector because the class lands on the `Grid`
   component's root element — that overrides Grid's track template to:

   ```css
   grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--hz-footer-col-min, 12rem)), 1fr));
   ```

   so columns stack to a single column when narrow and flow into multiple tracks
   as width allows, with **no** media queries and no fixed widths blocking 320px
   reflow. `Grid` supplies `display: grid` and the gap; the auto-fit override
   governs the track count, so the value of Grid's `columns` prop does not affect
   layout. `--hz-footer-col-min` is a consumer-tunable wrap-point hook with the
   literal `12rem` fallback.
9. **R9 — no visual CSS.** The shipped `<style>` contains structural properties
   only (grid track template / the column-min hook). It ships **no** colors,
   borders, shadows, fonts, or animation. (`variant="bordered"` carries only
   `data-variant`; the border itself is the consumer's/theme's concern.)

**Cross-cutting**

10. **R10 — class composition.** Root `class` is `cx('hz-footer', className)`:
    `hz-footer` always first, never removable. No `class` → exactly `hz-footer`;
    `class="foo bar"` → `hz-footer foo bar`.
11. **R11 — rest forwarding.** Arbitrary `...rest` HTML attributes forward onto the
    root `<footer>` and must **not** overwrite managed attributes (`class`,
    `data-variant`). Rest is spread first so managed attributes win.
12. **R12 — barrel export.** `Footer` exports from `src/lib/components/index.ts`
    and resolves via `import { Footer } from '$lib'`.

### Structural CSS (shipped)

Authored by the Builder in the component's scoped `<style>`. Illustrative only —
do not copy-paste; the requirements above are the contract.

- **Columns container:** the `Grid` primitive provides `display: grid` and `gap`;
  Footer adds one `:global(.hz-footer-columns)` rule setting the auto-fit
  `grid-template-columns` (R8) and exposing `--hz-footer-col-min`.
- **Snippet wrappers:** `hz-footer-logo`, `hz-footer-social`, `hz-footer-bottom`
  are bare structural hooks rendered only when their snippet is present; they ship
  no layout opinions beyond what is needed (consumers may place a `Cluster` inside
  the `social` snippet for icon rows).

No colors, borders, shadows, fonts, or animation. All spacing values use
`var(--hz-space-…, <fallback>)`.

### Responsive Behavior

Mobile-first. The columns grid auto-stacks based on available width
(`--hz-footer-col-min`), so no breakpoint media queries are required for the
column layout.

- **Mobile (<640px):** `hz-footer-columns` collapses to a single column; columns
  render in source order. `social` and `bottom` content wraps naturally (consumer
  may place a `Cluster` in the `social` snippet).
- **Tablet (640–1024px):** columns flow into 2+ tracks as width permits per
  `--hz-footer-col-min`.
- **Desktop (>1024px):** columns occupy as many tracks as the column count /
  min-width allow.

Single-column reflow at 320px is supported (no fixed widths).

### Accessibility (WCAG 2.1 AA)

- `<footer>` is the page `contentinfo` landmark (1.3.1, 4.1.2); the component adds
  no `role`.
- Each column is a `<nav>` with `aria-label={column.title}`, making multiple
  footer nav regions individually distinguishable to assistive tech (2.4.1, 4.1.2).
- Column headings are real heading elements (`<h2>`–`<h6>` per `headingLevel`,
  default `<h2>`) (1.3.1); link groups use `<ul role="list">`.
- DOM order = reading order; `aria-current` flows from `NavItem.ariaCurrent` via
  the reused `Link` (1.3.2).
- External links: `target="_blank"`, `rel="noopener noreferrer"`, and sr-only
  "(opens in new tab)" — inherited from the reused `Link` (3.2.5). `Link` emits
  this announcement via its existing `sr-only` class; Footer does not introduce a
  separate sr-only mechanism.
- Social icon links live in the consumer-provided `social` snippet; the brief
  requires each icon-only link to carry an accessible name — `Link`/`Icon` already
  warn/enforce `ariaLabel` for icon-only usage, so this is satisfied by reuse
  rather than re-implemented here.
- Color contrast / reduced motion: N/A — no colors and no animation are shipped.

### Edge Cases & Error States

| Case                                          | Expected behavior                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `columns={[]}`                                | `<footer>` renders with logo/social/bottom snippets; no `<nav>` columns; no error.         |
| Column with `links: []`                       | `<nav>` + heading render with an empty `<ul role="list">`; no error.                        |
| No `logo` / `social` / `bottom`              | Snippet and its wrapper not rendered; no empty wrappers; no error.                          |
| Link item with no `href`                      | `<li>` with `label` as plain text; no `<a>` (R7).                                           |
| Link item with `children`                     | `children` ignored; only the flat link renders (R6).                                        |
| `external: true` item                         | `target`/`rel`/sr-only announcement via the reused `Link` (R5).                            |
| `ariaCurrent` set on an item                  | `aria-current` rendered on that link via `Link`.                                            |
| `linkVariant="nav"` (or `default`)            | Every footer `Link` renders with the overridden `data-variant`; default is `subtle` (R5).  |
| `headingLevel={3}`                            | Column headings render as `<h3 class="hz-footer-heading">` (R4).                            |
| Many columns (e.g. 6)                         | Grid flows/wraps per `--hz-footer-col-min`; multiple `<nav>` landmarks each labelled.       |
| Very long `label` or `title`                  | No truncation; wraps/overflows per normal flow (consumer concern).                          |
| Rest attr attempts `class` / `data-variant`   | Component-managed value wins (R11).                                                         |

### Existing Code to Reuse

- **Types:** import `FooterColumn` (and `NavItem` for typing) from `$lib/types` —
  already defined; do **not** redefine or extend (`src/lib/types/index.ts`).
- **Link rendering:** reuse `src/lib/components/Link.svelte` with
  `variant={linkVariant}` (default `subtle`) for all navigable footer links
  (external / aria-current / sr-only handled there) (R5).
- **Grid:** reuse the existing `Grid` primitive (`src/lib/components/Grid.svelte`,
  `import { Grid } from '$lib'`) as the columns container (R8); Footer adds only the
  auto-fit track override. Do not hand-roll a new grid from scratch.
- **Utils:** `cx` for class composition (R10) from `src/lib/utils`. `uid` is **not**
  needed (no generated IDs / `aria-controls`). Do not inline duplicates.
- **Tokens:** reference `--hz-space-*` custom properties with literal fallbacks per
  the Shared Scales in `specs/03-layout.md`; namespace prefix `--hz` (`src/lib/tokens`).
- **Component pattern:** mirror `Link.svelte` for `$props()` destructuring,
  `class: className`, and `...rest`-first spread order. Snippet props mirror Nav's
  `logo`/`actions` approach (`specs/04-nav.md`); the heading uses
  `<svelte:element this={…}>` as in the layout primitives (`specs/03-layout.md`).
- **Test patterns:** follow `src/lib/components/Button.svelte.spec.ts`,
  `Link.svelte.spec.ts`, and `Nav.svelte.spec.ts` — Vitest browser mode via
  `vitest-browser-svelte` (`render`, `page.getBy*`, `await expect.element(...)`,
  `createRawSnippet` for snippet props). `expect.requireAssertions` is on
  (`vite.config.ts`) — every test must assert.
- **Export pattern:** mirror `export { default as Nav }` in
  `src/lib/components/index.ts`; extend the `$lib (.)` assertion in
  `src/lib/exports.spec.ts` to include `Footer`.
- **Headless conventions:** `class="hz-footer"` + `data-*` per
  `original-specs/00-architecture.md`.

### Test Plan

Runner: **Vitest** browser project (chromium, Playwright provider) with
`vitest-browser-svelte`. One spec file `src/lib/components/Footer.svelte.spec.ts`
(the `.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). No Playwright e2e (docs demos are a later sprint). Computed
responsive styles are asserted with viewport resize + `getComputedStyle(el)`.

**Unit / component (browser):**

- R1: default `data-variant="default"`; each `variant` enum parametrized →
  matching `data-variant`; assert no `role` injected.
- R2: `columns=[]` smoke render — `<footer>` present, no `hz-footer-column`.
- R3: each of `logo`/`social`/`bottom` snippets present → rendered in its wrapper
  in the expected position; absent → wrapper not in DOM.
- R4: a column renders `<nav aria-label="{title}">` + heading + `<ul role="list">`;
  multiple columns → multiple labelled navs; `headingLevel={3}` →
  `<h3 class="hz-footer-heading">`, default → `<h2>`.
- R5: a link item renders a `Link` (`hz-link`, `data-variant="subtle"` by default);
  `linkVariant="nav"` → `data-variant="nav"`; external item surfaces
  `target`/`rel`/sr-only; `ariaCurrent` surfaces `aria-current`.
- R6: an item carrying `children` renders only the flat link (no nested list).
- R7: an item with no `href` renders plain-text label, no `<a>`.
- R10: no `class` → exactly `hz-footer`; `class="foo bar"` → `hz-footer foo bar`
  (order asserted).
- R11: a `...rest` attr (e.g. `data-testid`) forwarded; a rest override attempt on
  `class`/`data-variant` → managed value survives.
- R12: extend `src/lib/exports.spec.ts` to assert `Footer` resolves from `$lib`,
  plus a smoke render.

**Integration (browser, viewport resize):**

- R8: the columns container carries both `hz-grid` and `hz-footer-columns`; at a
  narrow viewport (≤320px) it computes a single grid track (stacked); at a wide
  viewport it computes multiple tracks. Confirm the computed
  `grid-template-columns` reflects the auto-fit override.

### Out of Scope

- Re-defining or extending `FooterColumn` / `NavItem` — already shipped in
  `$lib/types`.
- Dropdown / nested footer links — `children` is ignored (R6).
- Shipped social icons — the `social` snippet is consumer-provided; no new `Icon*`
  components are added by this spec.
- Any colors, borders, shadows, fonts, or animation/transitions — structural CSS
  only (`variant="bordered"` is a styling hook, not a shipped border).
- The reference theme's visual styling of the footer — later sprint.
- Docs demo routes and Playwright e2e — later sprint.
- New shared types in `src/lib/types/index.ts` — the prop unions stay local.

### Amendments

**2026-08-03 — dev warnings and blank-title degrade (specs/63, user decision).**
The composition question — should Footer compose Nav? — is settled in
`specs/63-footer-nav-composition.md`: it does not. Two behavior notes land
there and amend this spec:

- R6's `children` handling is unchanged (still ignored, flat `<Link>` only),
  but ignoring it now raises a dev-only `[hz-footer]` warning, once per render,
  naming the first offending item.
- R4 gains a blank-title exception: a column whose `title` is empty or
  whitespace-only renders as `<div class="hz-footer-column">` — no `<nav>`, no
  heading — because `aria-label=""` is a nameless `navigation` landmark. Links
  render unchanged, and a dev-only warning names the column index.
