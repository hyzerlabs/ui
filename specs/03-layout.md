# Layout Containers Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (Rn) and edge case as pass/fail. Write scope for the Builder is
> the library source.

### Goal

Ship five headless Svelte 5 layout primitives — `Container`, `Stack`,
`Cluster`, `Grid`, `Split` — that provide the structural foundation every other
component sits inside. Each renders a configurable element via `as`, exposes its
layout choices through stable `hz-*` classes + `data-*` attributes (plus
CSS-custom-property hooks for `Grid` column counts), and **ships its own
structural CSS** (display, gap, padding, widths, alignment, responsive
behavior) while shipping **no** colors, borders, shadows, fonts, or animation —
so consuming sites get working layout out of the box and restyle via the
documented hooks.

### Context & Conventions

- Svelte 5 **runes mode** is forced project-wide; components are TypeScript.
- These five primitives are an **intentional, scoped exception** to the
  otherwise zero-CSS headless rule (`original-specs/00-architecture.md`): as the
  structural foundation of the library they ship structural CSS. They still ship
  **no visual opinions** — no colors, borders, shadows, fonts, or animation.
- Structural CSS lives in each component's scoped Svelte `<style>` block.
- All shipped CSS values reference design-token custom properties **with literal
  fallbacks**, e.g. `gap: var(--hz-space-md, 1rem)`. Tokens are a Sprint-1
  placeholder today (`src/lib/tokens/tokens.css` defines only the `--hz`
  prefix), so the fallbacks make layout functional now and auto-upgrade when
  tokens land.
- Component files: `src/lib/components/{Container,Stack,Cluster,Grid,Split}.svelte`
  — one file per primitive.
- Export each from the barrel `src/lib/components/index.ts` (currently exports
  `Button`, `Link`), resolvable via `import { Container } from '$lib'` etc.
- Mirror `src/lib/components/Link.svelte` for `$props()` destructuring,
  `class: className` handling, and `...rest`-first spread order (managed
  attributes win). Use `<svelte:element this={as}>` as the root.

### Shared Scales

These two scales are authoritative for this spec and supersede the width values
stated in `original-specs/03-layout.md` (`640/768/1024/1280`).

**Spacing scale** — used by every `gap` and `padding` prop, applied as
`var(--hz-space-{name}, <fallback>)`:

| Name   | Fallback  |
| ------ | --------- |
| `none` | `0`       |
| `xs`   | `0.25rem` |
| `sm`   | `0.5rem`  |
| `md`   | `1rem`    |
| `lg`   | `1.5rem`  |
| `xl`   | `2rem`    |

**Width / breakpoint scale** — one shared px scale used for `Container` max-width
**and** the `Grid`/`Split` responsive breakpoints, applied as
`var(--hz-width-{name}, <fallback>)` for widths:

| Name   | Value   |
| ------ | ------- |
| `sm`   | `640px` |
| `md`   | `968px` |
| `lg`   | `1200px`|
| `xl`   | `1440px`|
| `full` | `100%`  |

Breakpoints are mobile-first `min-width` queries at `md`=968px and `lg`=1200px
(see Responsive Behavior). `Container` `full` maps to `max-width: 100%` (i.e. no
cap).

### Props

All five additionally accept a `children` snippet, `class` (destructured as
`class: className`, composed via `cx`), and arbitrary `...rest` HTML attributes.

**Container**

| Prop      | Type                                     | Default |
| --------- | ---------------------------------------- | ------- |
| `max`     | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'`  |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'`         | `'md'`  |
| `center`  | `boolean`                                | `true`  |
| `as`      | `string`                                 | `'div'` |

**Stack**

| Prop    | Type                                             | Default     |
| ------- | ------------------------------------------------ | ----------- |
| `gap`   | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`      |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'`      | `'stretch'` |
| `as`    | `string`                                         | `'div'`     |

**Cluster**

| Prop      | Type                                          | Default    |
| --------- | --------------------------------------------- | ---------- |
| `gap`     | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg'`      | `'sm'`     |
| `justify` | `'start' \| 'center' \| 'end' \| 'between'`   | `'start'`  |
| `align`   | `'start' \| 'center' \| 'end' \| 'baseline'`  | `'center'` |
| `wrap`    | `boolean`                                     | `true`     |
| `as`      | `string`                                      | `'div'`    |

**Grid**

| Prop      | Type                                                  | Default                   |
| --------- | ----------------------------------------------------- | ------------------------- |
| `columns` | `number \| { sm?: number, md?: number, lg?: number }` | `{ sm: 1, md: 2, lg: 3 }` |
| `gap`     | `'none' \| 'sm' \| 'md' \| 'lg'`                      | `'md'`                    |
| `align`   | `'start' \| 'center' \| 'end' \| 'stretch'`           | `'stretch'`               |
| `as`      | `string`                                              | `'div'`                   |

**Split**

| Prop         | Type                                                  | Default |
| ------------ | ----------------------------------------------------- | ------- |
| `fraction`   | `'1/4' \| '1/3' \| '1/2' \| '2/3' \| '3/4' \| 'auto'` | `'1/2'` |
| `gap`        | `'none' \| 'sm' \| 'md' \| 'lg'`                      | `'md'`  |
| `reverse`    | `boolean`                                             | `false` |
| `stackBelow` | `'sm' \| 'md' \| 'lg'`                                | `'md'`  |
| `as`         | `string`                                              | `'div'` |

Declare every prop union **locally** in each component (mirroring how `Link`
declares `LinkVariant`/`LinkSize`); the shared `Size`/`Variant` types do not
match these enums and must not be reused.

### Requirements

Each is a testable assertion. "Attribute present" for boolean `data-*` means the
attribute exists with an empty value; "absent" means it is not rendered at all.

**Container**

1. **R1 — Default render.** No props → root `<div class="hz-container"
   data-max="lg" data-padding="md" data-center>`, with `children` rendered
   inside. Computed `max-width` resolves to the `lg` value (1200px fallback) and
   the element is horizontally centered (`margin-inline: auto`).
2. **R2 — max.** `max` is reflected verbatim in `data-max` for every enum value
   and drives the shipped `max-width` per the width scale; `max="full"` →
   `data-max="full"` and no width cap (`max-width: 100%`).
3. **R3 — padding.** `padding` is reflected verbatim in `data-padding` for every
   enum value (including `data-padding="none"`) and drives shipped horizontal
   padding per the spacing scale; `padding="none"` → `0` horizontal padding.
4. **R4 — center.** `center=true` → `data-center` present and `margin-inline: auto`
   applied; `center=false` → `data-center` absent and no auto margins.

**Stack**

5. **R5 — Default render.** No props → `<div class="hz-stack" data-gap="md"
   data-align="stretch">` with computed `display: flex`, `flex-direction: column`,
   `gap` = `md` (1rem fallback), `align-items: stretch`.
6. **R6 — gap / align.** `gap` and `align` reflected verbatim in `data-gap` /
   `data-align` across every enum value (including `gap="none"` → `gap: 0`), each
   driving the matching shipped CSS (`align` maps to `align-items`:
   `start`→`flex-start`, `center`→`center`, `end`→`flex-end`, `stretch`→`stretch`).

**Cluster**

7. **R7 — Default render.** No props → `<div class="hz-cluster" data-gap="sm"
   data-justify="start" data-align="center" data-wrap>` with computed
   `display: flex`, `flex-wrap: wrap`, `gap` = `sm` (0.5rem fallback),
   `justify-content: flex-start`, `align-items: center`.
8. **R8 — gap / justify / align.** Reflected verbatim in the matching `data-*`
   across every enum value, each driving shipped CSS. `justify` maps to
   `justify-content` (`start`→`flex-start`, `center`→`center`, `end`→`flex-end`,
   `between`→`space-between`); `align` maps to `align-items` (`start`→`flex-start`,
   `center`→`center`, `end`→`flex-end`, `baseline`→`baseline`).
9. **R9 — wrap.** `wrap=true` → `data-wrap` present and `flex-wrap: wrap`;
   `wrap=false` → `data-wrap` absent and `flex-wrap: nowrap`.

**Grid**

10. **R10 — Default render.** No props (default `columns={sm:1,md:2,lg:3}`) →
    `<div class="hz-grid" data-gap="md" data-align="stretch">` with computed
    `display: grid`, `gap` = `md`, `align-items: stretch`, and the responsive
    column hooks of R12.
11. **R11 — columns (number).** `columns={4}` → inline custom property
    `--hz-grid-cols: 4` on the root and **no** `--hz-grid-cols-*` per-breakpoint
    properties; the shipped CSS yields 4 columns at every breakpoint. An optional
    `data-columns="4"` may also be emitted for styling parity but is not required
    by the column behavior.
12. **R12 — columns (object).** Each present key emits an inline custom property
    `--hz-grid-cols-{sm,md,lg}`; omitted keys emit no property; no
    `--hz-grid-cols` and no `data-columns` in object mode. The shipped CSS
    consumes these via a fallback cascade so each breakpoint inherits the nearest
    smaller defined value:
    - base (<968px): `--hz-grid-cols-sm` → `--hz-grid-cols` → `1`
    - `@media (min-width: 968px)`: `--hz-grid-cols-md` → `--hz-grid-cols-sm` → `--hz-grid-cols` → `1`
    - `@media (min-width: 1200px)`: `--hz-grid-cols-lg` → `--hz-grid-cols-md` → `--hz-grid-cols-sm` → `--hz-grid-cols` → `1`

    Column tracks use `repeat(<n>, minmax(0, 1fr))`. Default object → 1 / 2 / 3
    columns across the three ranges.
13. **R13 — gap / align.** Reflected verbatim in `data-gap` / `data-align`, each
    driving shipped CSS (`align` → `align-items`, same mapping as Stack R6).

**Split**

14. **R14 — Default render.** No props → `<div class="hz-split" data-fraction="1/2"
    data-gap="md" data-stack-below="md">`, `data-reverse` absent. Computed
    `display: grid`, `gap` = `md`. Below the `md` breakpoint (968px) it is a
    single column; at ≥968px it is two columns of equal fraction.
15. **R15 — fraction.** Reflected verbatim in `data-fraction` for every enum
    value (including `auto`). The shipped CSS maps `data-fraction` to
    `grid-template-columns` (when un-stacked) via attribute selectors — **no
    custom property is emitted**:
    - `1/4` → `1fr 3fr`
    - `1/3` → `1fr 2fr`
    - `1/2` → `1fr 1fr`
    - `2/3` → `2fr 1fr`
    - `3/4` → `3fr 1fr`
    - `auto` → `auto 1fr`
16. **R16 — reverse.** `reverse=true` → `data-reverse` present and the two panels
    are **visually** swapped; `reverse=false` → `data-reverse` absent. DOM /
    source order of `children` is unchanged in both cases (the swap is CSS-only).
17. **R17 — stackBelow.** Reflected verbatim in `data-stack-below`. The component
    is a single column by default (mobile-first) and applies the R15 two-column
    template only at `min-width` of the named breakpoint (`sm`=640, `md`=968,
    `lg`=1200px). Gap is retained while stacked.

**All five**

18. **R18 — `as` renders the element.** `as="section"` → root tag is `SECTION`
    with identical classes / `data-*` / style hooks; the per-table default tag is
    used when `as` is omitted. Implemented via `<svelte:element this={as}>`.
19. **R19 — class composition.** Rendered `class` is `cx('hz-{component}',
    className)`: `hz-{component}` always first and never removable. No `class` →
    exactly `hz-{component}`; `class="foo bar"` → `hz-{component} foo bar`.
20. **R20 — rest forwarding.** Arbitrary extra HTML attributes (`...rest`) are
    forwarded onto the root element and must **not** overwrite component-managed
    attributes (`class`, every `data-*` listed above, and the `style` carrying
    `--hz-grid-cols*` hooks). Rest is spread first so managed attributes win.
21. **R21 — Barrel export.** `Container`, `Stack`, `Cluster`, `Grid`, `Split`
    each export from `src/lib/components/index.ts` and resolve via
    `import { … } from '$lib'`.

### Structural CSS (shipped)

Authored by the Builder in each component's scoped `<style>`. Illustrative only —
do not copy-paste; the value mappings above are the contract.

- **Container:** `display: block`; `max-width` per `data-max`; horizontal padding
  (`padding-inline`) per `data-padding`; `margin-inline: auto` when `data-center`.
- **Stack:** `display: flex; flex-direction: column`; `gap` per `data-gap`;
  `align-items` per `data-align`.
- **Cluster:** `display: flex`; `flex-wrap` per `data-wrap`; `gap` per `data-gap`;
  `justify-content` per `data-justify`; `align-items` per `data-align`.
- **Grid:** `display: grid`; `grid-template-columns: repeat(<cascade>, minmax(0,
  1fr))` per R12; `gap` per `data-gap`; `align-items` per `data-align`.
- **Split:** `display: grid`; single column by default; at the `data-stack-below`
  breakpoint, `grid-template-columns` per `data-fraction` (R15); `gap` per
  `data-gap`; visual swap when `data-reverse`.

All numeric gap/padding/width values use `var(--hz-…, <fallback>)` per the Shared
Scales. No colors, borders, shadows, fonts, or animation.

### Responsive Behavior

Mobile-first. Breakpoints: `md` = `min-width: 968px`, `lg` = `min-width: 1200px`
(plus `sm` = 640px used only by `Split` `stackBelow`).

- **Mobile (<640px):** `Container` fills width up to its `max` cap with
  horizontal padding. `Stack`/`Cluster` render identically (Cluster wraps when
  `wrap`). `Grid` uses its base column count (`--hz-grid-cols-sm`/number/`1`).
  `Split` is a single stacked column.
- **Tablet (640–1200px):** At ≥968px `Grid` applies its `md` column count and
  `Split` un-stacks into its two-column fraction (when `stackBelow` ≤ `md`).
  `Split` with `stackBelow="sm"` un-stacks at ≥640px.
- **Desktop (>1200px):** At ≥1200px `Grid` applies its `lg` column count;
  `Container` caps at its `max` width.

Single-column reflow at 320px is supported (no fixed widths block it).

### Accessibility (WCAG 2.1 AA)

- **Landmarks via `as` (R18).** Components add **no** ARIA and hard-code **no**
  `role`; semantics come from the chosen element (`section`, `nav`, `main`,
  `aside`, `header`, `footer`). Reviewer confirms no implicit role is injected.
- **DOM order = reading order.** `children` render in source order for all five.
  `Split reverse` (R16) and any Grid/Cluster visual reordering are CSS-only; the
  component never reorders the DOM, preserving logical reading and focus order
  (1.3.2, 2.4.3).
- **Non-interactive.** These are containers: they introduce no tabbable elements
  and must not set `tabindex` or `outline: none`.
- **Reflow (1.4.10).** Layout collapses to a single column on small viewports via
  the shipped responsive CSS; no fixed widths prevent 320px reflow.
- Color contrast / reduced motion: N/A — no colors and no animation are shipped.

### Edge Cases & Error States

| Case                                          | Expected behavior                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| No `children`                                 | Renders an empty container element; no error, no warning.                                          |
| `padding="none"` / `gap="none"`               | Emits `data-padding="none"` / `data-gap="none"` verbatim and resolves to `0`.                      |
| `center=false` / `wrap=false` / `reverse=false` | Corresponding boolean `data-*` attribute absent; no auto margins / `nowrap` / no visual swap.    |
| `max="full"`                                  | `data-max="full"`, `max-width: 100%` (no cap).                                                     |
| Grid `columns={1}`                            | `--hz-grid-cols: 1`; one column at all breakpoints; no per-breakpoint props.                       |
| Grid `columns={{ md: 2 }}` (partial object)   | Only `--hz-grid-cols-md: 2`; base & `lg` fall back through the cascade to `1` / `2` respectively.  |
| Grid `columns={{}}` (empty object)            | No column custom properties; cascade falls back to `1`; still renders.                             |
| Grid `columns={7}` (arbitrary)                | `--hz-grid-cols: 7`; seven equal columns — open-ended counts work via the custom property.         |
| Split `fraction="auto"`                       | `data-fraction="auto"`; un-stacked template is `auto 1fr`.                                          |
| Split with ≠ 2 element children               | Renders verbatim; the two-track grid simply applies to whatever children exist; no enforcement.    |
| `as="span"` or any non-void tag               | Rendered verbatim via `<svelte:element>`; no validation.                                           |
| `as` set to a void element (`"img"`, `"br"`)  | Unsupported — `<svelte:element>` cannot host children; documented, not guarded.                    |
| `class="foo"` provided                        | Rendered `class="hz-{component} foo"`, `hz-{component}` first (R19).                                |
| Rest attr attempts `class` / `data-gap` / `style` | Component-managed value wins (R20).                                                            |
| Long / overflowing content                    | No truncation; content overflows per normal flow (consumer concern).                               |

### Existing Code to Reuse

- **Utils:** `src/lib/utils/index.ts` — import `cx` for R19 class composition. Do
  **not** inline a duplicate. `uid` is not needed (no generated IDs).
- **Component pattern:** mirror `src/lib/components/Link.svelte` for `$props()`
  destructuring, `class: className` handling, and `...rest`-first spread order
  (managed attributes win). `<svelte:element this={as}>` as the root is new to
  this sprint (neither `Button` nor `Link` uses it).
- **Types:** declare prop unions locally per component (mirroring `Link`'s
  `LinkVariant`/`LinkSize`). Do not extend `src/lib/types/index.ts`.
- **Tokens:** reference `--hz-space-*` and `--hz-width-*` custom properties with
  literal fallbacks; the namespace prefix is `--hz` (`src/lib/tokens/index.ts`).
- **Test patterns:** follow `src/lib/components/Button.svelte.spec.ts` and
  `Link.svelte.spec.ts` — Vitest browser mode via `vitest-browser-svelte`
  (`render`, `page.getBy*`, `await expect.element(...)`, `createRawSnippet` for
  the `children` snippet). `expect.requireAssertions` is on (`vite.config.ts`) —
  every test must assert.
- **Export pattern:** mirror `export { default as Link }` in
  `src/lib/components/index.ts`; extend the `$lib (.)` assertion in
  `src/lib/exports.spec.ts` to cover all five primitives.
- **Headless conventions:** `class="hz-{component}"` + `data-*` per
  `original-specs/00-architecture.md`.

### Test Plan

Runner: **Vitest** browser project (chromium, Playwright provider) with
`vitest-browser-svelte`. One spec file per component:
`src/lib/components/{Container,Stack,Cluster,Grid,Split}.svelte.spec.ts` (the
`.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). No Playwright e2e (no routes; docs demos are Sprint 4).
Computed-style assertions use `getComputedStyle(el)` on the rendered root.

**Unit / component (browser):**

- R1–R4 (Container): default `data-*`; each `max`/`padding` enum parametrized →
  matching `data-*`; `max="full"` → `max-width` 100%; `padding="none"` → `0`
  horizontal padding; `center` true → `margin-inline: auto` present, false →
  absent.
- R5–R6 (Stack): defaults + computed `display:flex`/`flex-direction:column`; each
  `gap`/`align` value parametrized → `data-*` + computed `gap`/`align-items`
  mapping (incl. `gap="none"` → `0`).
- R7–R9 (Cluster): defaults + computed `display:flex`/`flex-wrap:wrap`; each
  `gap`/`justify`/`align` value → `data-*` + computed mapping; `wrap` true →
  `flex-wrap:wrap`, false → `nowrap`.
- R10–R13 (Grid): defaults render `--hz-grid-cols-sm/md/lg` and computed
  `display:grid`; `columns={4}` → `--hz-grid-cols:4`, no per-breakpoint props,
  4-track template; object → per-key custom props, omitted keys absent, no
  `data-columns`; empty/partial object cascade; arbitrary `columns={7}`; each
  `gap`/`align` value.
- R14–R17 (Split): defaults; each `fraction` value → `data-fraction` + correct
  un-stacked `grid-template-columns` (incl. `auto`); `reverse` true →
  `data-reverse` present and DOM order of two `children` unchanged, false →
  absent; each `stackBelow` value → `data-stack-below` + single column below the
  breakpoint.
- R18 (all, parametrized): `as="section"` → `tagName === 'SECTION'` with classes
  / `data-*` intact; default tag when omitted.
- R19 (all): no `class` → exactly `hz-{component}`; `class="foo bar"` →
  `hz-{component} foo bar` (order asserted).
- R20 (all): a `...rest` attr (e.g. `data-testid`) forwarded; a rest override
  attempt on a managed attribute (`class`, a `data-*`, `style`) → managed value
  survives.
- R21: extend `src/lib/exports.spec.ts` to assert all five resolve from `$lib`,
  plus a per-component smoke render.

**Integration (browser, viewport resize — recommended):**

- Grid responsive: set viewport to <968 / ≥968 / ≥1200 and assert computed
  `grid-template-columns` track count matches the default `1 / 2 / 3` cascade.
- Split responsive: set viewport below and at/above `data-stack-below` and assert
  single-column vs two-column `grid-template-columns`.

### Out of Scope

- Token *values* themselves (`src/lib/tokens/tokens.css` Sprint-1 work) — these
  components consume token names with fallbacks only.
- Any colors, borders, shadows, fonts, or animation — structural CSS only.
- Validation or warnings for `as` (void elements), Split child count, or empty
  Grid `columns`.
- Interactivity, ARIA roles, or focus management (non-interactive containers).
- Docs demo routes and Playwright e2e — Sprint 4.
- New shared types in `src/lib/types/index.ts` — prop unions stay local.
- Editing `original-specs/03-layout.md` to mirror the unified width/breakpoint
  scale (outside library write scope; this spec is authoritative).

### Amendments

- **2026-07-23 (audit, Layout round):** `paddingInline` / `paddingBlock` added
  to all five primitives — optional per-axis overrides of the `padding`
  shorthand (same `LayoutPadding` scale, no default), reflected as
  `data-padding-inline` / `data-padding-block` (absent when unset) with rules
  declared after the shorthand so the longhand wins on its axis. `padding`
  stays the both-axes shorthand (user decision). This amendment also records
  earlier shipped deviations never folded back into the tables above:
  `padding` exists on all five primitives (not just Container) and applies to
  **both axes** (Container R3's "horizontal" is superseded); the scale is the
  shared `LayoutPadding` type from `$lib/types` (the declare-unions-locally
  rule is relaxed) and includes the density distances `near`/`away`; Cluster
  `justify` gained `'around'` and align scales unified on shared
  `LayoutAlign`; Grid gained the `xl` band, the fluid `{ min }` mode, and
  container-query breakpoints (inner `.hz-grid-layout`); Split's default
  `stackBelow` is `'sm'` on the flex-switcher implementation.
