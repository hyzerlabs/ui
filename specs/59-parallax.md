# 59 — Parallax (page-scroll-driven layer drift)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope is named at the end.
> New component in the **Layout** family; follows `specs/03-layout.md` conventions
> (structural CSS in the component, no visual opinions) and `specs/39-motion.md`'s
> reduced-motion doctrine (motion collapses by default, never by consumer opt-in).

### Goal

Ship `Parallax` + `ParallaxLayer` — a single-band layout primitive whose child
layers drift as the band passes through the viewport, driven by the **page**
scroll. The mechanism is **CSS scroll-driven animation** (`animation-timeline:
view()`): zero scroll listeners, zero JS motion, zero runtime cost. Browsers
without scroll-driven animations render the layers **static and correctly
positioned**; `prefers-reduced-motion: reduce` does the same. Travel is per-layer
and two-axis, so the horizontal-drift-on-vertical-scroll pattern is a value, not a
mode.

### Context & Conventions

- Decisions locked with the user (2026-07-31): page-scroll driven, no
  own-scroll-container mode; CSS `view()` timelines with no polyfill and no JS
  fallback; per-layer x/y travel; reduced motion fully disables the drift (hard
  requirement — vestibular trigger).
- **Layout family posture (specs/03).** Structural CSS only — position, overflow,
  stacking, the animation. No colors, borders, shadows, fonts. **No theme sheet
  ships for this component** (Container/Stack/Cluster/Grid/Split have none
  either); every hook is declared and read in the component's own `<style>`.
- Svelte 5 runes mode, TypeScript. `$props()` destructuring, `class: className`
  composed via `cx`, `...rest` spread **first** so managed attributes win —
  `Link.svelte` / `Hero.svelte` precedent.
- `Hero.svelte`'s overlay layout is the closest existing shape (`position:
  relative` root, `position: absolute; inset: 0` background, content above) and is
  the pattern this generalizes to N layers with motion.
- **Two exported components, one docs page.** The library has no exported
  subcomponent pair yet; this is the first. The page label / `hooks.ts` key /
  `componentDocs` key / component file stem are all `Parallax` (the convention
  `hooks.spec.ts` and `data.spec.ts` enforce); `ParallaxLayer`'s props are
  documented in the page's `types` sub-table (R12).

### Props

**`Parallax`** — the band.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `as` | `string` | `'div'` | Rendered via `<svelte:element>`, the layout-family convention (specs/03 R18). `section` is the common choice. |
| `children` | `Snippet` | — | Layers and foreground content. |
| `class` | `string` | — | Merged after `hz-parallax` via `cx`. |

Plus `...rest` forwarded onto the root (this is how a decorative band gets a
height — `style="min-height: 40vh"` or a consumer class).

**`ParallaxLayer`** — one drifting layer.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `x` | `string \| number` | `0` | Total horizontal travel across the band's view range. A number is px; a string is a CSS **length** used verbatim. Negative drifts the other way. |
| `y` | `string \| number` | `0` | Total vertical travel. Same rules. |
| `z` | `number` | `-1` | `z-index` inside the band's own stacking context. The default sits the layer behind foreground content; `1` puts it in front. |
| `children` | `Snippet` | — | The layer's art. Non-interactive by contract (R8). |
| `class` | `string` | — | Merged after `hz-parallax-layer` via `cx`. |

Plus `...rest`. `aria-hidden="true"` is stamped **before** the rest spread so a
consumer can override it (the `Skeleton.svelte` precedent) — see R8 for why they
usually should not.

---

### Requirements

**R1 — Two components, exported.** New `src/lib/components/Parallax.svelte` and
`src/lib/components/ParallaxLayer.svelte`, both exported from
`src/lib/components/index.ts` and resolvable as
`import { Parallax, ParallaxLayer } from '@hyzer-labs/ui'`. Both are added to
`src/lib/exports.spec.ts` (resolution assertion + smoke render asserting
`.hz-parallax` / `.hz-parallax-layer`). Zero runtime dependencies.

**R2 — Band structure.** `Parallax` renders `<svelte:element this={as}
class={cx('hz-parallax', className)} {...rest}>` with `children` inside and no
`data-*` of its own. Its structural CSS is exactly four declarations:

- `position: relative` — the containing block every layer positions against.
- `overflow: clip` — **not `hidden`.** `hidden` establishes a scroll container,
  which would become the nearest scrollport for `view()` and kill the timeline;
  `clip` clips without one, so the page stays the timeline source. This is also
  what guarantees a horizontally drifting layer can never produce a page-level
  horizontal scrollbar (R14).
- `isolation: isolate` — a stacking context, so a `z: -1` layer stays behind the
  band's own content and never escapes behind ancestors or the page background.
- `min-width: 0` — the guard Split/Grid already ship, so a wide layer never props
  a flex/grid parent open.

Children are laid out in **normal flow**: foreground content is an ordinary child
and determines the band's height. Layers are out of flow (R3) and contribute
nothing to it.

**R3 — Layer structure, sizing, and coverage bleed.** `ParallaxLayer` renders a
`<div class={cx('hz-parallax-layer', className)}>` carrying the travel custom
properties (R4). Its structural CSS:

- `position: absolute`, so a layer never affects band height.
- `inset-block: calc(var(--_hz-parallax-bleed-y) / -2);`
  `inset-inline: calc(var(--_hz-parallax-bleed-x) / -2);` — the layer covers the
  band **inflated by its own travel distance in each axis**, so at either extreme
  of the drift the band edge is still covered and no seam appears. The private
  bleed values are the absolute travel, via the comparison-function idiom (CSS
  `abs()` is not broadly enough supported):
  `--_hz-parallax-bleed-x: max(var(--hz-parallax-x, 0px), calc(-1 * var(--hz-parallax-x, 0px)));`
  and the `y` equivalent. Private `--_`-prefixed properties follow the
  `--_loading-rm-scale` precedent and are **not** documented hooks.
- `z-index: var(--hz-parallax-z, -1)` (R7).
- `pointer-events: none` — layers are decorative and must never swallow clicks
  aimed at the content they overlap (R8).

A layer with zero travel is exactly band-sized. Sizing is the only mode: the layer
is a box the size of the band, and the consumer positions art *inside* it with
their own CSS. There is no natural-size / align mode.

**R4 — Travel is a distance, expressed as a custom property.** `x` and `y` stamp
inline `--hz-parallax-x` / `--hz-parallax-y` on the layer, **only when the prop is
provided** (a number is emitted as `px`, a string verbatim). Omitting the prop
leaves the property unstamped so a consumer stylesheet can set it — which is the
supported way to tune travel per breakpoint:

```css
/* consumer CSS, via the layer's `class` prop */
.hero-art { --hz-parallax-y: 4rem; }
@media (min-width: 968px) { .hero-art { --hz-parallax-y: 12rem; } }
```

An inline style wins over any stylesheet rule, so the prop and the breakpoint form
are mutually exclusive by construction — documented, not guarded.

Travel values are **lengths** (`px`, `rem`, `vw`, `vh`, `cqw`, …). Percentages are
not supported: `inset` percentages resolve against the containing block while
`translate` percentages resolve against the element's own box, so the R3 bleed
would under-cover by a hairline at the extremes. A percentage value dev-warns
(R10).

**R5 — The drift animation.** Authored in `ParallaxLayer.svelte`'s scoped
`<style>`:

```css
@keyframes hz-parallax-drift {
	from { translate: calc(var(--hz-parallax-x, 0px) / -2) calc(var(--hz-parallax-y, 0px) / -2); }
	to   { translate: calc(var(--hz-parallax-x, 0px) /  2) calc(var(--hz-parallax-y, 0px) /  2); }
}
```

- **`translate`, not `transform`** — a consumer's own `transform` (a rotate, a
  scale) on the layer composes instead of being clobbered.
- **Neutral at the midpoint.** The layer sits at its authored position when the
  band is centred in the viewport, and travels ±half the distance either side.
  That is why total travel is the value the consumer reasons about.
- `animation-timing-function: linear` — a scroll-linked animation must track the
  scroll 1:1; the `--hz-ease-*` tokens do not apply here (Non-goals).
- `animation-fill-mode: both`, `animation-timeline: view()`,
  `animation-range: var(--hz-parallax-range, cover)`. `cover` is the default
  `view()` range: the drift completes as the band travels from first entering the
  viewport to fully leaving it. `--hz-parallax-range` is a documented hook for
  consumers who want `entry`, `exit`, or `contain` instead.
- **Svelte scopes `@keyframes` names automatically** when the animation is
  referenced in the same component. Leave it scoped — do **not** use
  `-global-hz-parallax-drift`. The keyframe name is private; tests must not assert
  on it (R13).

**R6 — Both gates, nested, in this order.** The animation block sits inside
`@media (prefers-reduced-motion: no-preference)` and, within it,
`@supports (animation-timeline: view())`. Everything in R3 (position, inset,
bleed, z-index) sits **outside** both gates.

- **Reduced motion is the outer gate.** Under `reduce`, no animation is ever
  declared, so the layer paints at its neutral position. This is the house posture
  (`skeleton.css`, `carousel.css`, `accordion.css`), pinned by
  `src/lib/theme/reducedMotion.spec.ts`'s style of scan; ParallaxLayer gets the
  equivalent pin in R13. The media query is live, so an OS toggle mid-session
  stops or resumes the drift with no reload and no JS.
- **`@supports` is mandatory, not decorative.** Without it, a browser that ignores
  `animation-timeline` still applies `animation-name` with a `0s` duration and
  `fill: both`, which paints every layer frozen at its **end** offset — visibly
  broken. The gate makes the unsupported render identical to the reduced-motion
  render: static, neutral, correct. No polyfill, no JS detection, no fallback
  timeline (Non-goals). Consumers who want to style the two cases apart can write
  the same `@supports` query themselves.

**R7 — Stacking.** `z` stamps inline `--hz-parallax-z` (only when provided); the
layer reads `z-index: var(--hz-parallax-z, -1)`. Default `-1` places layers behind
the band's in-flow content but above the band's own background, inside the R2
stacking context. Layers with equal `z` paint in DOM order. A foreground drifting
layer is `z={1}`.

**R8 — Accessibility (WCAG 2.1 AA).**

- **Layers are decorative by default.** `aria-hidden="true"` is stamped on every
  `ParallaxLayer`, before the `...rest` spread so it is overridable (the
  `Skeleton.svelte` idiom).
- **Layers hold no interactive or focusable content.** `pointer-events: none`
  (R3) makes them non-clickable, and focusable content inside an `aria-hidden`
  subtree is a real violation (4.1.2) — so the component dev-warns when it finds
  any (R10). Interactive content belongs in a plain, non-layer child of the band.
- **Motion (2.3.3 Animation from Interactions, AA).** Scroll-triggered parallax is
  exactly the motion 2.3.3 asks to be disableable. `prefers-reduced-motion:
  reduce` removes it entirely (R6). There is no prop, no `essential` escape hatch,
  and no consumer opt-out — unlike `./motion`'s helpers, no parallax drift is ever
  essential.
- **No auto-motion (2.2.2).** Nothing moves unless the user scrolls; there is no
  timer, no autoplay, no idle animation.
- **Reading and focus order.** DOM order is untouched; the component reorders
  nothing and adds no `role`, no `tabindex`, and no live region. Semantics come
  from `as` and from the consumer's own content.
- **Contrast (1.4.3).** The component contributes no color. Foreground text over a
  moving layer is the consumer's contrast responsibility; the docs say so once.

**R9 — SSR safety and zero-JS motion.** No `window`, `document`, `matchMedia`, or
`getAnimations` at module scope or during initialization. The server frame and the
pre-hydration frame render the final layout: markup + CSS alone produce the
correct static composition, and the drift begins the moment the stylesheet
applies. The only client-side code either component runs is the DEV-only warning
block (R10), inside an effect. There is no scroll listener, no observer, no rAF
loop, and no animation constructed in script.

**R10 — Dev warnings.** Library convention: `import { DEV } from 'esm-env'`, a
single `untrack()` block evaluated once at creation (`Loading.svelte` /
`Skeleton.svelte` precedent), prefixed `[hyzer-ui] <Parallax>:` /
`[hyzer-ui] <ParallaxLayer>:`. Exactly four conditions warn; none changes
behavior:

1. **Layer outside a band.** `Parallax` sets a context key on creation;
   `ParallaxLayer` reads it and warns when absent — an unparented layer is
   absolutely positioned against some unknown ancestor, unclipped, and will leak.
2. **Zero travel.** Both `x` and `y` resolve to `0`/unset → the layer never moves;
   use a plain child instead.
3. **Percentage travel.** `x` or `y` is a string containing `%` → the R4 coverage
   math does not hold; use a length.
4. **Focusable content in a decorative layer** (DEV effect, post-mount): the
   layer's subtree matches
   `a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe, [contenteditable]`
   while `aria-hidden` is still `true` → focusable-but-hidden content, and
   `pointer-events: none` makes it unclickable anyway (R8).

**R11 — Theme hooks and `hooks.ts`.** Everything is structural; **no
`src/lib/theme/components/parallax.css` is created** and `theme.css` is not
touched. New `Parallax` entry in `src/docs/hooks.ts` (Layout group ordering, after
`Grid`/`Split`), held by `hooks.spec.ts`:

- `root`: `hz-parallax`
- **attrs**: none. The component stamps no `data-*` — there is no variant or state
  to reflect.
- **props**:
  - `--hz-parallax-x` — `<length> — default 0` — "Total horizontal travel of one
    layer across the band's pass through the viewport. Set it in your own CSS
    (and omit the `x` prop) to change travel per breakpoint. Negative drifts the
    other way."
  - `--hz-parallax-y` — `<length> — default 0` — "Total vertical travel. Same
    rules as `--hz-parallax-x`."
  - `--hz-parallax-z` — `<number> — default -1` — "The layer's z-index inside the
    band. The default sits it behind the band's content; `1` puts it in front."
  - `--hz-parallax-range` — `<animation-range> — default cover` — "Which part of
    the band's pass through the viewport the drift is spread over. `cover` is the
    whole pass; `entry`, `exit`, and `contain` narrow it."
- **parts**:
  - `.hz-parallax-layer` — `child element` — "One drifting layer: absolutely
    positioned, sized to the band plus its own travel so the edges stay covered,
    decorative (`aria-hidden`) and click-through by default."

The private `--_hz-parallax-bleed-*` properties are component-internal and are
**not** documented; `hooks.spec.ts`'s no-drift scan only reads the reference
theme, so no `INTERNAL_HOOKS` entry is needed.

**R12 — Docs page and registration.** Adding a Components page trips the shared
pins; the complete list of touchpoints:

- `src/docs/manifest.ts` — a `Parallax` page in the **Components → Layout** group
  (after `Split`, before `Virtualizer`), `href: '/docs/components/parallax'`, with
  the required one-line description.
- `src/routes/docs/components/parallax/+page.svelte` — the docs page (Docs
  section below).
- `src/docs/data/parallax.ts` exporting `parallaxDoc: ComponentDoc`, registered in
  `src/docs/data/index.ts` (Layout block). `importLine:
  'import { Parallax, ParallaxLayer } from "@hyzer-labs/ui"'`. `props` holds
  **`Parallax`'s** props only (`data.spec.ts` matches every documented prop name
  against `Parallax.svelte`); **`ParallaxLayer`'s** props go in a `types`
  sub-table named `ParallaxLayer`, which is the sanctioned way to document a
  second shape on one page.
- `src/docs/hooks.ts` — the R11 entry.
- `src/docs/hooks.spec.ts` — bump `expect(componentPages).toHaveLength(50)` to
  `51` and extend the tally comment (`… + Parallax (spec 59)`).
- `llms.txt`, `llms-full.txt`, and `search-index.json` are all derived from the
  manifest and need **no** edit; the manifest-driven `docs.e2e.ts` sweep picks the
  route up automatically (kill port 4173 before serving — stale-preview note).

**R13 — Tests.** See Test Plan.

---

### Responsive Behavior

The component ships **no breakpoints of its own** — its only media query is the
reduced-motion gate. Layout is identical at every viewport; what changes is the
travel a consumer chooses.

- **Mobile (<640px).** Large travel reads as jitter on a short viewport and eats
  battery on a phone; the docs recommend a smaller (or zero) travel below `md` via
  the R4 breakpoint form. Nothing hides, nothing reflows, no interaction pattern
  changes. The band's `overflow: clip` guarantees no horizontal page scroll at
  320px however large the horizontal travel is.
- **Tablet (640–1024px) / Desktop (>1024px).** Same structure; travel typically
  scales up. Viewport-relative travel units (`vw`, `vh`) scale on their own and
  are the recommended default for a hero background.
- A band with no in-flow content has zero height at every breakpoint (R2) — the
  consumer supplies one. Documented, warned about in prose, not guarded.

### Accessibility

Covered in R8: decorative-by-default layers, no focusable or clickable content in
a layer, `prefers-reduced-motion: reduce` fully removing the motion with no
opt-out (2.3.3), no auto-motion (2.2.2), untouched DOM/reading/focus order, no
ARIA and no live region, and no color contributed.

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| `prefers-reduced-motion: reduce` | No animation is declared at all; every layer paints at its neutral (mid-travel) position. Layout, clipping, and stacking are unchanged. |
| Browser without `animation-timeline: view()` | Same as reduced motion — static, neutral, correct. No polyfill, no JS, no console noise. |
| OS reduced-motion toggled mid-session | The media query re-evaluates live; drift stops or resumes with no reload. |
| Band with layers but no in-flow content | Height is 0 and nothing shows. The consumer sets a height (`style`, `class`, or content); documented, not guarded. |
| Layer with only `x` travel | Bleed is applied on the inline axis only; the block axis stays exactly band-sized. |
| Negative travel | Drifts the opposite way; bleed uses the absolute value, so coverage is identical. |
| Percentage travel (`x="10%"`) | Renders, but the bleed can leave a hairline at the extremes; one dev warning (R10). |
| Zero-travel layer | Renders as a static band-sized box; one dev warning (R10). |
| `ParallaxLayer` outside a `Parallax` | Positions against whatever ancestor is positioned, unclipped; one dev warning (R10). |
| Interactive content inside a layer | Not clickable (`pointer-events: none`), hidden from AT (`aria-hidden`); one dev warning (R10). |
| Horizontal drift at 320px | No page horizontal scrollbar — `overflow: clip` on the band (R2). |
| Very large travel (larger than the band) | Bleed grows with it, so coverage still holds; the drift is simply fast. No clamp. |
| Band inside a scrolling container | The timeline resolves against the nearest scrollport, so the drift tracks **that** scroller. Supported by the platform, untested by this spec, documented as such. |
| `position: sticky` **inside** a band | Sticks within the band, because the band clips. Stacked-section stickiness belongs on a wrapper **outside** `Parallax` (Docs). |
| `...rest` collides with `class` / a managed attribute | Component-managed value wins (`...rest` spreads first). `aria-hidden` is the deliberate exception: it precedes the spread, so rest overrides it. |
| SSR / pre-hydration | Full layout renders from markup + CSS; nothing shifts on hydration. |
| Many layers | No limit; each is one composited `translate` animation. No `will-change` is shipped. |

### Existing Code to Reuse

- **`src/lib/components/Hero.svelte`** — the positioned-root / absolute-background
  / stacking pattern this generalizes, plus the `$props()` + `cx` + rest-first
  house shape and `<svelte:element this={as}>`.
- **`src/lib/components/Skeleton.svelte`** — the `aria-hidden`-before-rest idiom,
  the `string | number → CSS length` prop conversion (a local two-line helper; do
  not export or refactor Skeleton's), and the `DEV` + `untrack()` warning block.
- **`src/lib/utils`** `cx`. `uid` is not needed (no generated ids).
- **`src/lib/theme/reducedMotion.spec.ts`** — copy its `mediaSpans` /
  `expectGated` / `expectUngated` helpers into the new server spec (R13). Do not
  edit that file; it scans the reference theme, and this component ships no theme
  sheet.
- **`src/lib/components/Loading.svelte.spec.ts` / `Image.svelte.spec.ts`** — the
  `cdp().send('Emulation.setEmulatedMedia', …)` reduced-motion emulation idiom for
  the browser project, including the `afterEach` reset to `features: []`.
- **`src/docs/data/split.ts` + `src/routes/docs/components/split/+page.svelte`** —
  the copy-from template for the new data module and page (`DocPage`, `Example`,
  `Tabs`, `demoTabs`).
- **`src/lib/exports.spec.ts`** — the resolution + smoke-render assertion pattern.

### Test Plan

Runner: **Vitest**, two projects — `client` (real Chromium via the Playwright
provider, `vitest-browser-svelte`, matching `*.svelte.spec.ts`) and `server`
(node, matching `*.spec.ts`) — plus **Playwright** for docs e2e.

**Browser — `src/lib/components/Parallax.svelte.spec.ts`** (one file covers both
components):

- **Structure:** root `.hz-parallax` with computed `position: relative`,
  `overflow: clip` (both axes), `isolation: isolate`; `as="section"` →
  `tagName === 'SECTION'`; `class` merges after `hz-parallax`; a rest attr
  forwards and a colliding managed attribute loses.
- **Layer structure:** `.hz-parallax-layer` computes `position: absolute`,
  `pointer-events: none`, `aria-hidden="true"`, and `z-index` `-1` by default /
  the `z` value when set; it contributes no height to the band (band height with
  and without a layer is identical).
- **Travel plumbing:** `x={40}` → inline `--hz-parallax-x: 40px`; `y="10vh"` →
  verbatim; omitted props stamp **no** property (assert
  `el.style.getPropertyValue(...) === ''`), so a stylesheet can win; `z` likewise.
- **Bleed:** with `x="100px"` on a band of a pinned width, the layer's bounding
  rect is 100px wider than the band and centred on it (50px each side); with zero
  travel the rects match.
- **Animation binding:** with travel set, `layer.getAnimations()` returns one
  animation whose `timeline` is a `ViewTimeline` (guard `typeof ViewTimeline !==
  'undefined'`, skip with a comment otherwise). **Do not assert the keyframe
  name** — Svelte hashes scoped `@keyframes` (R5).
- **Reduced motion (CDP emulation):** under `prefers-reduced-motion: reduce`,
  `layer.getAnimations()` is empty and the layer's computed `translate` is `none`
  — the neutral position. Reset the emulation in `afterEach`.
- **Dev warnings:** spy on `console.warn` — a layer rendered without a `Parallax`
  parent warns; a zero-travel layer warns; `x="10%"` warns; a layer containing a
  `<button>` warns after mount. A well-formed layer warns not at all.

**Server — `src/lib/components/parallax.spec.ts`** (source-text pins; the
`@supports` false branch cannot be exercised in a supporting browser, so its shape
is pinned instead):

- The `animation:` / `animation-timeline:` declarations in `ParallaxLayer.svelte`
  appear **only** inside a `@media (prefers-reduced-motion: no-preference)` span
  **and** inside an `@supports (animation-timeline: view())` span.
- `position: absolute`, the `inset-*` bleed, `z-index`, and `pointer-events: none`
  appear **outside** both gates.
- `ParallaxLayer.svelte` declares no `-global-` keyframes.
- Neither component's source contains `addEventListener('scroll'`,
  `requestAnimationFrame`, `IntersectionObserver`, or `matchMedia` — the zero-JS-
  motion pin (R9).
- No `src/lib/theme/components/parallax.css` exists and `theme.css` does not
  reference one (R11).

**Registry pins (server):** `hooks.spec.ts` green with the bumped count and the
new entry (no-fiction / no-drift / well-formed); `data.spec.ts` green with
`parallaxDoc` registered; `manifest.spec.ts` green (description present, route
exists); `exports.spec.ts` covers both new exports.

**e2e — `/docs/components/parallax`** (`src/routes/docs.e2e.ts`): the
manifest-driven sweep already asserts one `<h1>`, skip-link first, and **no
horizontal overflow at all three viewports** — which is the primary regression
this component could cause. Add two targeted assertions: after scrolling the
demo band through the viewport, a layer's animation `currentTime` has advanced;
and under `page.emulateMedia({ reducedMotion: 'reduce' })` the same layer reports
zero animations.

**Honestly not assertable in headless Chromium** — carried to e2e or manual
review: the *feel* and pacing of the drift, per-frame pixel positions during a
scroll, the unsupported-browser render (no engine in CI lacks `view()`), and
whether a given travel distance looks right. Computed styles, geometry, the
animation/timeline binding, and the gating **are** assertable and are pinned
above.

### Docs

New page `src/routes/docs/components/parallax/+page.svelte` on the standard
scaffold (`DocPage` + `parallaxDoc`, `Example` blocks with code, `Tabs` for the
demo set). Consumer-facing framing only — no spec numbers, no R-numbers, no
test-gate or process language. Tabs:

1. **Hero** — a slow background layer behind foreground copy: `<Parallax
   as="section">` with one `<ParallaxLayer y="8rem">` holding an `Image`, then a
   `Container` of copy as a plain child.
2. **Horizontal drift** — two layers with opposite `x` travel drifting sideways as
   the page scrolls vertically, which is the effect people usually mean by
   "horizontal parallax". One line noting travel is a distance, not a speed: it is
   how far the layer moves over the band's whole pass through the viewport.
3. **Depth** — three layers with increasing travel plus one `z={1}` layer drifting
   **in front of** the copy, showing how ordering works.
4. **Sticky sections** — the stacked full-screen pattern, presented as
   composition, not a feature: the consumer's own `position: sticky` wrapper
   around each `Parallax` band, with the note that the sticky element goes
   **outside** the band because the band clips. A short code fence of the consumer
   CSS.
5. **Tuning** — travel per breakpoint by setting `--hz-parallax-x` /
   `--hz-parallax-y` in your own class and omitting the props, and narrowing the
   drift with `--hz-parallax-range`.

Prose must also state, plainly and once each: layers are decorative and
click-through, so put buttons and links in a normal child; a band with no content
has no height; motion stops entirely for visitors who ask for less motion, and
browsers without scroll-driven animation show the same still composition; and
text sitting over a moving layer still has to meet contrast on its own.

### Non-goals

- **No JS fallback and no polyfill.** No scroll listener, no
  `ScrollTimeline`/`scroll-timeline-polyfill`, no IntersectionObserver
  approximation. Unsupported browsers get the static composition, by design.
- **No own-scroll-container mode.** The timeline is `view()` against the nearest
  scrollport — in practice the page. No `scroll()` timeline prop, no inner
  scroller, no `timeline-scope` plumbing.
- **No pointer, mouse-move, gyroscope, or tilt parallax.** Scroll only.
- **No sticky-stack machinery.** `position: sticky` composes from outside the
  component and lives in the docs as a pattern (Docs tab 4).
- **No autoplaying or idle motion**, no timers, no `essential` opt-out of reduced
  motion (R8).
- **No effects beyond `translate`** — no per-layer scale, rotate, opacity, blur,
  or color animation on the timeline. Entrance animation is `./motion`'s `reveal`;
  this is drift.
- **No speed/depth abstraction.** Travel is a distance in CSS units. No `speed`,
  `factor`, or `depth` prop, and no easing: the `--hz-ease-*` and `--hz-duration-*`
  tokens do not apply to a scroll-linked timeline.
- **No theme sheet, no colors, no `data-*` state hooks** (R11).
- **No media handling.** Layers hold whatever the consumer puts in them; compose
  `Image` for responsive art.
- **No RTL mirroring of travel.** `x` is physical: positive drifts right in every
  writing mode. The band's own insets stay logical.
- **No `will-change` or compositor tuning props.** Animating `translate` is
  compositor-friendly already; a consumer who needs more can add it via `class`.
- **No layer count limits, no virtualization, no lazy-mounting of layers.**

### Write scope

New: `src/lib/components/Parallax.svelte`,
`src/lib/components/ParallaxLayer.svelte`,
`src/lib/components/Parallax.svelte.spec.ts`,
`src/lib/components/parallax.spec.ts`, `src/docs/data/parallax.ts`,
`src/routes/docs/components/parallax/+page.svelte`.
Edited: `src/lib/components/index.ts`, `src/lib/exports.spec.ts`,
`src/docs/hooks.ts`, `src/docs/hooks.spec.ts` (count + comment),
`src/docs/data/index.ts`, `src/docs/manifest.ts`, `src/routes/docs.e2e.ts`.
No theme sheet, no `theme.css` edit, no `package.json` change, no new
dependencies.
