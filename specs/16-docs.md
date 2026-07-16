# Documentation Site Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope for the Builder is
> `src/routes/**` and a docs-only source dir outside `src/lib` (R10). No library
> component, token, or theme source changes.

### Goal

Build a static, prerendered documentation site that **dogfoods the library**: the
site chrome is assembled from the library's own components, and every exported
component plus the token foundation gets a live demo page, organized into the
confirmed information architecture with nested-by-section URLs.

### Context & Conventions

- **Write scope:** `src/routes/**` for routes, plus a **docs-only** directory
  **outside `src/lib`** (e.g. `src/docs/`) for shared docs components and the nav
  manifest, so `svelte-package` (which only reads `src/lib`) never publishes them.
  No edits to `src/lib/**` (components, tokens, theme) — the docs consume the
  library as a real consumer would, via `$lib`.
- The site is prerendered: `src/routes/+layout.ts` already sets
  `prerender = true` (`adapter-static`). Every page must render statically with no
  client-only crash (no top-level `window`/DOM access in page modules).
- **Dogfooding is the point.** The shell is built from library components
  (`Nav`, `Footer`, `Container`, `Stack`, `Grid`, etc.), and each page renders the
  **actual** component it documents — never a screenshot or re-implementation.
- The token system (`specs/15-tokens.md`) ships `--hz-*` custom properties on
  `:root` and a `[data-theme="dark"]` role override. The docs supply their own
  chrome CSS (components are headless) and that CSS **consumes the semantic role
  tokens** (`--hz-color-surface`, `--hz-color-text`, `--hz-color-border`) so the
  whole site is theme-aware and a toggle visibly proves the dark hook.
- Decisions already locked by the team and reflected below: nested-by-section
  URLs; IA of **foundation [tokens + icons], layout, navigation, forms [form +
  inputs], media, components [everything else]**; separate page per foundation
  topic; **no committed demo assets yet**; structured so dark is trivial (already
  is, via tokens).

### Information Architecture

Single source of truth: a **nav manifest** (a typed `NavItem[]`/section structure
in the docs-only dir) that drives (a) the `Nav` component in the shell, (b) the
prerender crawl, and (c) the parity enforcement (R14). Sections, slugs, and the component
each page documents:

**foundation** — `/foundation` (index)

| Page | URL | Source |
| --- | --- | --- |
| Colors | `/foundation/colors` | `color` token metadata |
| Typography | `/foundation/typography` | `typography` token metadata |
| Contrast & Accessibility | `/foundation/contrast` | WCAG contrast math over `color` + `intent` metadata (added 2026-07-14) |
| Spacing & Sizing | `/foundation/spacing` | `space` + `width` metadata |
| Radius & Elevation | `/foundation/radius-elevation` | `radius` + `border` + `shadow` + `zIndex` |
| Motion | `/foundation/motion` | `motion` token metadata |
| Icons | `/foundation/icons` | all 21 icon exports (single page) |

Foundation-polish amendments (2026-07-14): Typography leads with a font-families
demo on the component-page tab pattern — family tabs (Sans/Serif/Mono, incl. the
new `--hz-font-family-serif`) × weight sub-tabs, each `Example` rendering the
full size scale; token tables follow. A dedicated **Contrast & Accessibility**
page (`/foundation/contrast`, listed after Typography) carries the a11y tooling,
driven by the library's own WCAG contrast utilities (promoted 2026-07-15 from
docs-only `src/docs/contrast.ts` to public API in `src/lib/utils/contrast.ts`,
exported from the package root and `./utils` — see specs/15 R10; unit-tested,
including a token-compliance suite that fails CI if a palette change breaks
AA; the page dogfoods the exports and documents them in a "Check your own
palette" section with a usage snippet): a
requirements table (AA/AAA/508 × normal/large); an interactive
foreground/background pairing checker (palette + per-mode intent roles +
resolved surface roles, incl. surface-muted's `color-mix()` resolved in JS)
with per-requirement pass/fail Badges and luminance readout; and **mode-aware,
in-situ-first** sections — every panel is painted from statically resolved
hexes (never live tokens) so each stays pinned to its mode regardless of the
site theme toggle, and every in-situ row shows 16px and 24px samples with
per-size level Badges: "Text on surfaces" (semantic text roles + all intents,
light values on light surfaces / dark companions on dark, surface sub-tabs +
matrix table), "Solid intent backgrounds" (surface-colored text per mode),
"Soft intent surfaces" (the Badge 14%/65% and Alert 10%/70% `color-mix()`
recipes re-derived per mode, light/dark sub-tabs), and a Resources section
linking WCAG 1.4.3/1.4.6/1.4.11, WAI-ARIA 1.2, the APG, and Section 508.
Colors & Intent cross-links to it. Still R7-compliant — everything derives
from token metadata. DocPage also gained `a11yLinks` (label/href pairs
rendered as a "References:" line under the a11y note); every component page
following an explicit APG pattern links that pattern, plus the MDN reference
for native-element-backed components.

**layout** — `/layout` (index): `/layout/container` (Container), `/layout/stack`
(Stack), `/layout/cluster` (Cluster), `/layout/grid` (Grid), `/layout/split` (Split).

**navigation** — `/navigation` (index): `/navigation/nav` (Nav),
`/navigation/footer` (Footer).

**forms** — `/forms` (index): `/forms/form` (Form), `/forms/text-input`
(TextInput), `/forms/textarea` (Textarea), `/forms/select` (Select),
`/forms/checkbox` (Checkbox), `/forms/radio-group` (RadioGroup), `/forms/toggle`
(Toggle).

**media** — `/media` (index): `/media/image` (Image), `/media/video` (Video).

**components** — `/components` (index, repurposed from the existing stub):
`/components/button` (Button), `/components/link` (Link), `/components/card`
(Card), `/components/hero` (Hero), `/components/modal` (Modal),
`/components/accordion` (Accordion), `/components/tabs` (Tabs).

This covers all **23** exported components from `src/lib/components/index.ts`
(5 layout + 2 navigation + 7 forms + 2 media + 7 components) and the icon set.

### Requirements

1. **R1 — Nav manifest is the single source of truth.** A typed manifest in the
   docs-only dir enumerates every section and page (label, slug/href, and the
   documented component's export name where applicable). The shell `Nav`, the
   prerender entries, and the R14 parity enforcement all derive from it. Adding a page is
   a one-line manifest edit plus the route file.
2. **R2 — Shell dogfoods library components.** `src/routes/+layout.svelte` renders
   the primary navigation with the **`Nav`** component (manifest → `items`, with a
   `logo` snippet linking home and section dropdowns via `NavItem.children`), wraps
   page content in **`Container`** + **`Stack`**, and renders the site footer with
   the **`Footer`** component (`columns`). The existing skip-to-content link and
   its behavior are preserved as the first tab stop.
3. **R3 — Tokens imported.** The root layout imports `@hyzer-labs/ui/tokens.css`
   (via `$lib/tokens/tokens.css`) so demos and foundation pages reflect real token
   values, and the docs chrome CSS references the semantic role tokens for its
   surface/text/border colors.
4. **R4 — Nested-by-section routing.** Routes follow the IA table exactly
   (`/section/page`), each section has an index page listing its pages, and every
   page is statically prerendered and reachable from the shell nav by keyboard.
5. **R5 — One page per component.** Every component in the IA table has its own
   route `+page.svelte` rendering that component live. No component is missing; no
   two components share a page (icons are the sole exception, R8).
6. **R6 — Component page contract.** Each component page contains, in order:
   exactly one `<h1>` with the component name; a one-line description; an import
   snippet (`import { X } from '@hyzer-labs/ui'`); **one or more live demos** that
   render the real imported component; demos covering its primary states/variants
   (e.g. Button: each `intent`, `size`, `variant`, plus `loading`, `disabled`, and
   icon-only with `ariaLabel`); a props table (name, type, default) sourced from
   the component's spec in `specs/`; and a short accessibility note. A shared
   docs-only "doc page" scaffold (built from `Stack`/`Card`/`Tabs` etc.) provides
   this consistent structure.
7. **R7 — Foundation pages render from token metadata.** Each foundation topic
   page maps over the typed metadata exported by `src/lib/tokens/index.ts` (per
   `specs/15-tokens.md` R7) — never a hardcoded copy — rendering token name + value
   (color pages show a swatch). Adding a token to `index.ts` surfaces it here
   automatically.
8. **R8 — Icons on a single page.** `/foundation/icons` renders all 21 exported
   icons (from `$lib/icons`) in a responsive grid, each labeled with its **export
   name as visible text**, and demonstrates `size`, `strokeWidth`, and the
   decorative-vs-`ariaLabel` distinction. No per-icon routes.
9. **R9 — Theme toggle dogfoods the dark hook.** The shell includes an accessible
   theme-toggle control that sets/removes `data-theme="dark"` on the
   `<html>` element. Toggling visibly flips the docs chrome (because its CSS
   consumes `--hz-color-surface`/`--hz-color-text`), proving the token dark hook
   end-to-end. Preference may persist (localStorage) but persistence is optional;
   the control reflects state via `aria-pressed`.
10. **R10 — Docs code is unpublished and route-clean.** All docs-only modules
    (manifest, scaffold components, demo helpers) live **outside `src/lib`** so
    `pnpm package`/`publint` output is byte-for-byte unchanged from before this
    spec. No stray routes are created (only `+`-prefixed files define routes), and
    `vite build` prerenders every manifest route with no error or warning.
11. **R11 — Landing page.** `src/routes/+page.svelte` is refreshed to introduce the
    library and link into each top-level section; it keeps a single `<h1>` and the
    existing install/usage snippets.
12. **R12 — Media pages without committed assets.** `/media/image` and
    `/media/video` exist with full descriptions, props tables, and demos that use
    **inline data-URI / solid-color placeholder states only** (no committed binary
    files). Image demos showcase the placeholder color (now backed by
    `--hz-color-gray`), aspect-ratio, fit, and rounded props; a real-asset demo is
    explicitly deferred (a visible "demo assets coming soon" note is acceptable).
13. **R13 — Repurpose the existing stub.** `src/routes/components/+page.svelte`
    (currently a placeholder) becomes the `components` section index; no dead stub
    remains.
14. **R14 — Manifest ↔ exports parity (revised 2026-07-14).** Every exported
    component appears exactly once in the manifest under the correct section,
    and every manifest route has a corresponding `+page.svelte`. Enforcement:
    the export half is covered by `src/lib/exports.spec.ts` (every component
    asserts its `$lib` export there — the established per-component
    convention), and route existence is covered by the docs e2e's
    parametrize-over-every-manifest-route page-load pass plus the prerender
    crawl (a manifest entry without a page fails the build). The originally
    planned dedicated parity unit test (`docs-manifest.spec.ts`) was never
    written and is **withdrawn** as redundant with those layers (user decision
    2026-07-14); manifest *placement* remains a per-component spec requirement
    verified in review.

### Responsive Behavior

Reuses the existing `.content-column` (`max-width: 1200px`) and global overflow
guards in `+layout.svelte`.

- **Mobile (<640px):** Single-column content. The `Nav` collapses to its mobile
  menu (`Nav` `mobileBreakpoint`); the section sidebar (if any) is behind that
  menu. Color-swatch grid and the icon grid reflow to 1–2 columns. Theme toggle
  remains reachable. No horizontal overflow at 375px.
- **Tablet (640–1024px):** `Nav` may show inline; content single column; swatch and
  icon grids at 3–4 columns (via `Grid`).
- **Desktop (>1024px):** Persistent top `Nav` (and optional left section rail);
  content centered in `Container`; swatch/icon grids at full column count. Demos
  never defeat the global `overflow-x: hidden` / `pre`/`img` max-width guards.

### Accessibility (WCAG 2.1 AA)

- Skip-to-content link stays the first focusable element and visible on focus
  (existing behavior preserved, covered by `landing.e2e.ts` pattern).
- Exactly one `<h1>` per page; section/demo headings form a correct, non-skipping
  `<h2>/<h3>` hierarchy.
- Primary nav is a `<nav>` landmark with an accessible name (via `Nav`'s
  `ariaLabel`); the current page's link carries `aria-current="page"`
  (`NavItem.ariaCurrent`). Focus order matches visual order; all nav links, demo
  controls, the mobile menu, and the theme toggle are keyboard reachable.
- Mobile menu and any disclosure use `aria-expanded`/`aria-controls`, close on
  `Esc`, and return focus to their trigger (handled by `Nav`; docs must not break
  it).
- Theme toggle is a `<button>` with a clear accessible name and `aria-pressed`
  reflecting the active theme.
- Icon grid labels are real visible text associated with each icon (not
  `title`-only); decorative demo icons set `aria-hidden`, labeled demos pass
  `ariaLabel`.
- Color/token pages never rely on color alone — token name and value are always
  shown as text. Docs **body text uses `--hz-color-text`** (not `--hz-color-text-muted`)
  so contrast is ≥ 7:1 in both light and dark, sidestepping the documented
  muted-on-dark caveat from `specs/15-tokens.md`.
- Docs-added transitions (theme switch, mobile menu) respect
  `prefers-reduced-motion`. Component-internal motion is the component's concern.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| Component with required props (inputs need `label`/`name`, `Footer` needs `columns`, `Nav` needs `items`) | Demo supplies valid props; never renders a broken control. |
| Modal / overlay demo | Opens from an in-page trigger; focus trap + `Esc` close demonstrated **only after activation** — nothing traps focus on page load. |
| Form / input demo submit | Uses `preventDefault`; no real navigation; an error-summary state is shown via example data. |
| Image/Video demo (no assets) | Renders placeholder/loading states via inline data-URI or solid color (R12); no committed binaries; no broken-image icon. |
| Empty/loading/error states | Where supported (Button `loading`, Field `error`, Image placeholder), at least one demo shows the non-default state. |
| Long token list / 21 icons | Grids wrap; no overflow at any breakpoint. |
| Prerender | Every manifest route builds with no client-only crash; no module-top-level `window` access. |
| Theme toggled before hydration / on a fresh load | Site renders in light by default; toggling applies dark without layout shift or flash beyond the role-token color change. |
| Missing/extra route vs manifest | Caught by R14 enforcement — the e2e route pass and the prerender crawl (a manifest entry without a page fails the build). |
| Direct deep-link to a section/page URL | Prerendered page loads standalone (no reliance on client-side nav state). |

### Existing Code to Reuse

- **Shell:** extend `src/routes/+layout.svelte` (skip link, `.content-column`,
  global guards) — replace the placeholder Home/Components `<nav>` with the `Nav`
  component and replace the hand-rolled `<footer>` with the `Footer` component.
- **Prerender:** `src/routes/+layout.ts` already exports `prerender = true`; keep it.
- **Existing stub:** repurpose `src/routes/components/+page.svelte` (R13).
- **e2e pattern:** mirror `src/routes/landing.e2e.ts` (Playwright) for
  h1-visible, skip-link-first-focus, and no-overflow-at-375/768/1280 checks;
  extend it to iterate the manifest.
- **Library components & types:** consume via `$lib` / `$lib/icons` /
  `$lib/tokens` exactly as an external consumer would — `Nav` (`items: NavItem[]`,
  `logo`/`actions` snippets, `mobileBreakpoint`), `Footer` (`columns:
  FooterColumn[]`, `social`/`bottom`), `Container`, `Stack`, `Grid`, `Card`,
  `Tabs`, `Button`, `Link`. `NavItem`/`FooterColumn` from `src/lib/types`.
- **Token metadata:** `src/lib/tokens/index.ts` exports (per `specs/15-tokens.md`)
  drive every foundation page (R7).
- **Props tables:** source each component's props from its existing spec under
  `specs/` (e.g. `specs/01-button.md`, `specs/03-layout.md`, `specs/13-forms.md`).

### Test Plan

Runner: **Playwright** e2e for the site (`*.e2e.ts`). `expect.requireAssertions`
is on.

**Manifest parity (R14, revised 2026-07-14):** no dedicated unit test —
enforcement rides `src/lib/exports.spec.ts` (per-component export assertions),
the e2e's every-manifest-route page-load pass below, and the prerender crawl.

**Site e2e (`src/routes/docs.e2e.ts`, mirroring `landing.e2e.ts`):**

- Parametrize over every manifest route and assert: page loads, exactly one
  visible `<h1>`, the skip link is the first focusable element, and no horizontal
  overflow at 375 / 768 / 1280 (R4–R6, Responsive).
- Assert the shell renders the `Nav` component (`.hz-nav` present) and `Footer`
  (`.hz-footer` present) — dogfood check (R2).
- Assert a section nav link navigates to its page and the active link exposes
  `aria-current="page"` (R4, A11y).
- **Component-render proof:** on a representative component page (e.g.
  `/components/button`), assert the real component renders (`button.hz-button`
  present) (R5/R6).
- **Modal demo:** on `/components/modal`, assert no dialog is open on load, the
  trigger opens it, and `Esc` closes it (edge case).
- **Icons:** on `/foundation/icons`, assert all 21 icon export names appear as
  visible text and 21 `svg.hz-icon` render (R8).
- **Foundation parity:** on `/foundation/colors`, assert each color token from
  `index.ts` is present as name + value (R7).
- **Theme toggle:** toggle the control, assert `<html>` gains `data-theme="dark"`,
  `aria-pressed="true"`, and computed `--hz-color-surface` changes to the dark
  value while `--hz-color-primary` is unchanged (R9, dogfoods `specs/15-tokens.md`
  R5).

**Packaging guard:** `pnpm package` + `publint` succeed and `dist/` contains no
docs-only modules (R10).

### Out of Scope

- The reference theme (`src/lib/theme/**`) and any component/token source changes —
  Sprint 4 / `specs/15-tokens.md` respectively.
- Committed demo media assets (images/video) — deferred; placeholder states only
  (R12).
- A live prop-editing playground / interactive controls — static demos of states.
- Search, versioned docs, MDX/markdown tooling, and syntax-highlighting
  infrastructure (plain `<pre><code>` is sufficient).
- A fully populated dark theme beyond what the token role hook already provides;
  per-component dark tuning.
- Visual/brand polish beyond a functional, accessible, theme-aware layout.
- Deploy/CI configuration and `package.json` changes (token/theme exports already
  wired).
- Auto-generating props tables from component source/types — props are authored
  from the existing component specs.
