# Divider Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Divider-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`) plus the one docs route named in
> Divider-R8.

### Goal

Ship one headless Svelte 5 `Divider` component: a thematic separator that is a
native `<hr>` when bare, and a labelled `role="separator"` element when it wraps
a centered text label (e.g. "OR", "Continue with"). It exists to make the
_correct separator semantics_ the default — the library's
accessible-semantics-by-default philosophy (landing page) — since an `<hr>`
cannot contain text and hand-rolled labelled dividers routinely ship as bare
`<div>`s with no separator role. Border style and spacing are prop-driven hooks;
all color/weight chrome is the reference theme's job.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Divider.svelte`, exported from the barrel; assertion in
  `exports.spec.ts`.
- **Not a form field** — extends nothing.
- **Name decision:** `Divider` (not `Separator`/`Rule`) — matches the peer
  ecosystem and reads well as `<Divider>OR</Divider>`.
- **Two-root markup decision.** An `<hr>` is the most semantic bare separator
  (implicit `role="separator"`, thematic break) but **cannot hold text**.
  Therefore:
  - **bare** (no `children`) → a native `<hr class="hz-divider">`;
  - **labelled** (with `children`) → a `<div class="hz-divider"
    role="separator" aria-orientation="horizontal">` whose visible label is a
    `<span class="hz-divider-label">`, with the two flanking rules drawn as
    **decorative CSS pseudo-elements** (`::before`/`::after`), not elements.
  The root element therefore differs by mode (like Blockquote's figure/bare
  question, but here it is _forced_ by "hr can't contain text"); `class` and
  `...rest` spread onto whichever root renders.
- **ARIA decision.** The labelled `div` keeps `role="separator"` so the semantic
  break is preserved; the label text is the separator's accessible **name**
  (it participates in the tree — a screen reader announces "separator, OR",
  which is the useful information). The rules are pseudo-elements and never
  announced. A non-focusable `separator` needs no `aria-valuenow` (that is the
  focusable/slider variant, explicitly not us). `aria-orientation="horizontal"`
  is ARIA's default for `separator`; it is set explicitly on the labelled `div`
  for clarity and forward-compat with a future vertical mode. The bare `<hr>`
  needs no ARIA — `role="separator"` and horizontal orientation are implicit.
- **Orientation decision.** **Horizontal only in v1.** Vertical dividers require
  a defined-height flex/grid context and different rule geometry; deferred (Out
  of Scope) — hence `aria-orientation` is hard-coded `horizontal`, not a prop.
- **Border-style hook decision.** A `variant` prop
  (`'solid' | 'dashed' | 'dotted'`, default `'solid'`) reflected to
  `data-variant`; the theme maps it to `border-style`. (Prop + `data-attr`, per
  Badge's variant idiom — not a bag of boolean classes.)
- **Spacing hook decision (revised 2026-07-14, user).** A `spacing` prop typed
  as the **shared `LayoutPadding`**
  (`'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'`, default `'md'`) reflected
  to `data-spacing`, driving the block margin around the divider from the
  space tokens — including the **density distances** `near`/`away`
  (`--hz-space-near`/`--hz-space-away`, fallbacks `4rem`/`8rem` per the house
  base, tightening inside `data-density-shift` regions). Supersedes the
  original four-step-only decision: a divider's surrounding whitespace is
  exactly what the complementary-space model's near/away distances describe,
  so dividers participate in density like the layout family.
- **Line-width hook (added 2026-07-14, user).** A `lineWidth` prop
  (`'thin' | 'thick'`, default `'thin'`) reflected to `data-line-width`
  (always present), mapping 1:1 to the library's border-width tokens —
  `--hz-border-width-thin` (1px) / `--hz-border-width-thick` (2px) — via a
  theme custom-property switch (`--_bw`, same idiom as the `--_bs`
  border-style switch), applied to the bare `<hr>` line and the labelled
  form's `::before`/`::after` rules alike. The value set is exactly the token
  scale; no invented intermediate step.
- Mirror existing patterns: `$props()` destructuring, `class: className` via
  `cx`, `...rest`-first spread on the root (managed attributes win). No `uid`.

### Props

| Prop        | Type                              | Default    |
| ----------- | --------------------------------- | ---------- |
| `children`  | `Snippet`                         | — (label)  |
| `variant`   | `'solid' \| 'dashed' \| 'dotted'` | `'solid'`  |
| `spacing`   | `LayoutPadding`                   | `'md'`     |
| `lineWidth` | `'thin' \| 'thick'`               | `'thin'`   |
| `class`     | `string` (→ `cx`)                 | —          |

`children` is optional: absent → bare `<hr>`; present → the labelled form. Plus
arbitrary `...rest` forwarded onto whichever root renders (managed attributes —
`class`, `data-*`, and the labelled form's `role`/`aria-orientation` — win).

### Requirements

1. **Divider-R1 — Bare structure.** With no `children`, renders a native
   `<hr class="hz-divider" data-variant={variant} data-spacing={spacing}>`. No
   added `role` or ARIA (both are implicit on `<hr>`). `...rest` spreads first;
   managed attributes win.
2. **Divider-R2 — Labelled structure.** With `children`, renders
   `<div class="hz-divider" role="separator" aria-orientation="horizontal"
   data-variant={variant} data-spacing={spacing} data-labeled>` containing a
   single `<span class="hz-divider-label">{@render children()}</span>`. The two
   flanking rules are **not** elements — they are `::before`/`::after`
   pseudo-elements (Divider-R7), so the only child in the accessibility tree is
   the label, which becomes the separator's accessible name.
3. **Divider-R3 — Data hooks.** `data-variant`, `data-spacing`, and
   `data-line-width` are always present (including defaults
   `solid`/`md`/`thin`) on either root so the theme can target every
   combination without class variants. `data-labeled` (empty) is present
   exactly in the labelled form.
4. **Divider-R4 — Orientation.** Horizontal only. The labelled `div` sets
   `aria-orientation="horizontal"` (explicit, though it is ARIA's default); the
   bare `<hr>` relies on the implicit horizontal orientation. No vertical mode
   and no `orientation` prop in v1.
5. **Divider-R5 — class & rest.** Root class is `cx('hz-divider', className)` on
   whichever element renders; `...rest` spreads first so managed attributes
   (`class`, `data-*`, and the labelled form's `role`/`aria-orientation`) win.
6. **Divider-R6 — Barrel export.** `Divider` exported from
   `src/lib/components/index.ts`; `import { Divider } from '$lib'` resolves;
   assertion + smoke render added to `exports.spec.ts` (comment
   `// Divider-R6:`).
7. **Divider-R7 — Structural CSS only.** Scoped styles carry only geometry, no
   chrome color/weight:
   - bare `hr.hz-divider`: the component ships **no scoped rule at all**
     (amended 2026-07-14 — bug found in the docs: scoped component styles are
     **unlayered**, so a `border: 0; margin: 0` reset there beats every
     `@layer hz-theme` rule and leaves the themed line and `data-spacing`
     margins permanently invisible; the same unlayered-vs-layered trap as the
     docs-shell focus-ring exclusions). The UA-default border reset lives in
     `theme/divider.css`, in the same layered rule that redraws the line —
     and an unthemed consumer correctly gets a native `<hr>`;
   - labelled `.hz-divider`: `display: flex; align-items: center;` with a token
     `gap`, and `::before` / `::after` as `content: ''; flex: 1 1 auto;` so the
     rules occupy the space either side of the centered label; the label
     `min-width: 0` for wrapping.

   **No** colors, border-style, border-width, or block margin here. The theme
   (`theme/divider.css`, in `@layer hz-theme`, imported by `theme.css`
   alphabetically among the `@import` block) provides: the rule itself
   (`border-block-start` on `hr` and on the labelled `::before`/`::after`) using
   `--hz-color-border`; `border-style` switched on `data-variant`
   (`solid`/`dashed`/`dotted`) via the `--_bs` custom property; **border-width
   switched on `data-line-width`** (`thin` → `--hz-border-width-thin, 1px`,
   `thick` → `--hz-border-width-thick, 2px`) via a `--_bw` custom property
   (custom properties inherit into the pseudo-elements, border longhands don't);
   block margin switched on `data-spacing` (`none` → 0, `sm`/`md`/`lg` → the
   matching `--hz-space-*` tokens, `near`/`away` → `--hz-space-near, 4rem` /
   `--hz-space-away, 8rem` so dividers tighten inside `data-density-shift`
   regions); and label typography (`--hz-font-size-sm`,
   `--hz-color-text-muted`, letter-spacing).

### Responsive Behavior

Divider is fluid at every breakpoint: it fills its container's inline size and
introduces no fixed widths and no breakpoint-specific behavior. The labelled form
is a flex row whose rules flex to fill remaining space, so the centered label
stays centered as the container narrows; a long label wraps (`min-width: 0`)
without overflowing. Logical properties (`border-block-start`, `margin-block`,
`border-inline`) keep RTL correct. Nothing hides or changes at mobile (<640px),
tablet (640–1024px), or desktop (>1024px).

### Accessibility (WCAG 2.1 AA)

- Bare divider is a native `<hr>` — implicit `role="separator"`, horizontal,
  non-focusable; nothing to add (1.3.1).
- Labelled divider keeps `role="separator"` so the thematic break survives the
  switch away from `<hr>`; the label text is its accessible name and stays in the
  tree (not `aria-hidden`) so screen readers announce "separator, {label}"
  (4.1.2). The flanking rules are decorative pseudo-elements — absent from the
  tree by construction.
- Non-focusable separator: no `tabindex`, no `aria-valuenow`/`valuemin`/`valuemax`
  (those belong to the focusable slider-like separator, which this is not).
- The rule is never the only signal of meaning — it is purely presentational
  structure; where a divider carries meaning (e.g. "OR") that meaning is the
  visible label, not the line (1.4.1).
- No motion and no dynamic content — nothing for reduced-motion or live regions.
  Theme contrast: the muted label color must meet AA against the surface (theme
  concern; dark caveat per `specs/15-tokens.md`).

### Edge Cases & Error States

| Case                                    | Expected behavior                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| No `children`                           | `<hr class="hz-divider">`; no `role`, no `data-labeled` (Divider-R1/R3).        |
| `children` present                      | `<div role="separator" data-labeled>` with one `.hz-divider-label` (R2/R3).     |
| Defaults                                | `data-variant="solid" data-spacing="md"` on either root (R3).                   |
| `spacing="none"`                        | `data-spacing="none"` → `0` block margin (R7).                                  |
| Each `variant`                          | `data-variant` reflects verbatim; theme maps to `border-style` (R7).           |
| Long label                              | Label wraps; rules still flank it; no horizontal overflow (Responsive/R7).      |
| `...rest` attempts `class`/`role`       | Component-managed value wins (labelled `role="separator"` survives) (R5).       |

### Existing Code to Reuse

- **`cx`** from `$lib/utils` for the root class (per Badge/Alert). No `uid`.
- **Data-attr + variant idiom:** copy Badge's `data-variant`/`data-*` reflection
  and `:where([data-variant='…'])` theme switching
  (`src/lib/components/Badge.svelte`, `src/lib/theme/badge.css`).
- **Spacing type:** the shared `LayoutPadding` from `$lib/types`
  (`'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'`, `specs/03-layout.md`) —
  imported, not inlined (revised 2026-07-14; dividers participate in density,
  see Context).
- **Theme conventions:** `src/lib/theme/badge.css` as the template — `@layer
  hz-theme`, literal `var(--hz-…, <fallback>)` on every token.

### Test Plan

`src/lib/components/Divider.svelte.spec.ts` (browser project,
`vitest-browser-svelte`, mirroring `Badge.svelte.spec.ts`):

- **Bare/R1:** with no children, root is `<hr class="hz-divider">`; it has no
  `role` attribute and no `data-labeled`.
- **Labelled/R2:** with a `createRawSnippet` child, root is a
  `<div class="hz-divider">` with `role="separator"`,
  `aria-orientation="horizontal"`, `data-labeled` present, and exactly one
  `.hz-divider-label` rendering the child text.
- **Data hooks/R3:** defaults reflect
  `data-variant="solid"`/`data-spacing="md"`/`data-line-width="thin"` on both
  forms; each `variant` (`solid`/`dashed`/`dotted`), each `spacing`
  (`none`/`sm`/`md`/`lg`/`near`/`away` — the full `LayoutPadding` scale), and
  each `lineWidth` (`thin`/`thick`) reflects verbatim into its attribute.
- **R5:** `class` merges after `hz-divider` on both roots; a rest attr
  (`data-testid`) forwards; managed `hz-divider` class and (labelled)
  `role="separator"` survive a clobber attempt.
- **R6:** `Divider` resolves from `$lib` and smoke-renders (`.hz-divider`
  present) in both bare and labelled forms.

Add `expect(mod.Divider).toBeDefined();` (with a `// Divider-R6:` comment) to the
`$lib` export assertion in `src/lib/exports.spec.ts`.

### Docs (Divider-R8)

Not a numbered library requirement but part of this contract's write scope:

- **New page** `src/routes/components/divider/+page.svelte` using the docs
  scaffold (`DocPage`, `Example`, `PropsTable` — copy
  `src/routes/components/badge/+page.svelte`): one `<h1>`, one-line description,
  an `import { Divider } from '@hyzer-labs/ui'` snippet, live demos for (a) bare
  divider, (b) labelled ("OR"), (c) each `variant`, (d) `spacing` steps, a props
  table sourced from the Props section above, and a short accessibility note
  (hr vs `role="separator"`, label as accessible name, decorative rules).
- **Manifest:** add `{ label: 'Divider', href: '/components/divider' }` to the
  **Components** section of `src/docs/manifest.ts`, positioned after `Card` and
  before `Carousel`.
  - _Section rationale:_ Components (not Layout). Layout is the
    `specs/03-layout.md` spacing-primitive family (Container/Stack/Cluster/Grid/
    Split/Virtualizer); Divider is a discrete presentational element with its own
    chrome and label, alongside the other simple presentational components
    (Alert/Badge), matching the Badge/Alert precedent.

### Out of Scope

- **Vertical orientation** — deferred; horizontal only in v1 (Context /
  Divider-R4). A future `orientation` prop would add `aria-orientation="vertical"`
  and the vertical rule geometry.
- Label alignment options (start/end labels) — v1 centers the label only.
- Custom rule thickness/color/inset props — those are theme concerns (override
  via `class` or a theme token), not component props. Only `variant` (style) and
  `spacing` (margin) are prop hooks.
- Gradient/fade or icon-in-the-middle dividers, and content-region grouping
  semantics beyond `role="separator"`.
