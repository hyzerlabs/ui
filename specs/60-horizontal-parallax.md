# 60 — Horizontal parallax (`axis` on Parallax + `HorizontalScroll`)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope is named at the end.
> **Extends `specs/59-parallax.md`** (Parallax/ParallaxLayer, already built) and
> **follows `specs/58-carousel-rail.md`'s native-scroller posture** (overflow-x
> scroller, snap toggle, tabindex tab stop, effective-behavior `data-*` hooks).
> Nothing in 59 is repealed: every requirement there continues to hold for the
> default vertical axis, byte-for-byte.

### Goal

Two deliverables, one shipment:

1. **`axis` on `Parallax`** — a band can drive its layers off the **horizontal**
   crossing of its scroller instead of the vertical one, so layers drift as the
   band travels sideways past the viewport. Still CSS-only
   (`animation-timeline: view(inline)`), still zero JS motion, still gated
   identically by reduced motion and `@supports`.
2. **`HorizontalScroll`** — a new Layout-family component: a full-viewport
   horizontally scrolling shell whose children flow inline as panels. Native
   scroll container; optional CSS scroll-snap (**default off**); a wheel remap,
   **on by default** (`wheel={false}` opts out; amended 2026-07-31), that turns
   vertical wheel input into horizontal travel and hands the wheel back to the
   page at either end.

Together they are the "made you look" page shell: full-height panels sliding
sideways, each panel a `Parallax` band whose layers drift at different speeds.

### Context & Conventions

- Decisions locked with the user (2026-07-31): band-level axis; a new scroller
  component owning the page shell; wheel remap **on by default** (originally
  opt-in; flipped by user decision later the same day — `wheel={false}` opts
  out), never trapping, never disabling a native input path; snap **default
  off** (deliberately unlike the carousel rail's snap-on default).
- **Layout family posture (specs/03).** Structural CSS only — flow, overflow,
  sizing, scroll behavior. No colors, borders, shadows, fonts. **No theme sheet
  ships** (Container/Stack/Cluster/Grid/Split/Parallax have none); every hook is
  declared and read in the component's own `<style>`.
- **Native first (58).** Touch panning, fling momentum, trackpad two-finger pan,
  shift+wheel, the scrollbar, arrow keys, focus scroll-into-view and snapping are
  the browser's. The component adds exactly two things the platform has no
  equivalent for: the default-on wheel remap and a Home/End jump on the inline axis.
- Svelte 5 runes mode, TypeScript. `$props()` destructuring, `class: className`
  via `cx`, `...rest` spread **first** so managed attributes win.
- **Component naming.** `HorizontalScroll` over `Pan`/`Strip`/`Reel`: the Layout
  family's names say what the box does (`Split`, `Grid`, `Virtualizer`), the docs
  posture is plainspoken over clever, and "horizontal scroll" is what a consumer
  searches for. Multi-word component names already exist (`RadioGroup`,
  `CodeBlock`), and the kebab root class follows them: `hz-horizontal-scroll`,
  hooks `--hz-horizontal-scroll-*`.

### Props

**`Parallax`** — one new prop; every existing prop unchanged.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `axis` | `'y' \| 'x'` | `'y'` | Which axis of the band's scroller drives the drift. `'y'` is the page-scroll behavior of spec 59, unchanged. `'x'` tracks the band's horizontal crossing — for a band inside a `HorizontalScroll`. |

`'x' | 'y'` rather than `'horizontal' | 'vertical'`: the values line up 1:1 with
`ParallaxLayer`'s `x`/`y` travel props, and `orientation` in this library means
the direction a component arranges its *own* items, which is not what this is.

**`ParallaxLayer`** — **no prop changes.** `x`, `y`, `z`, `class`, `children`,
rest, the custom properties, the bleed math and the keyframes are all untouched
(R8).

**`HorizontalScroll`** — the new scroller.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `as` | `string` | `'div'` | Rendered via `<svelte:element>`, the layout-family convention (specs/03 R18). `section` and `main` are common. |
| `snap` | `boolean` | **`false`** | CSS scroll-snap at panel starts. Off by default — see R3. |
| `wheel` | `boolean` | **`true`** (amended 2026-07-31, user decision) | Translate vertical wheel input into horizontal travel (R5/R6/R7). On by default — it is what sells the shell under a mouse; set `wheel={false}` for native-only scrolling. |
| `children` | `Snippet` | — | The panels, as direct children. |
| `class` | `string` | — | Merged after `hz-horizontal-scroll` via `cx`. |

Plus `...rest` on the root. There is deliberately **no `ariaLabel` prop**: a
consumer who wants the shell announced as a landmark passes
`role="region" aria-label="…"` through rest (R10).

---

### Requirements

**R1 — New component, exported.** New `src/lib/components/HorizontalScroll.svelte`,
exported from `src/lib/components/index.ts` (Layout block, after `ParallaxLayer`,
before `Virtualizer`) and resolvable as
`import { HorizontalScroll } from '@hyzer-labs/ui'`. Added to
`src/lib/exports.spec.ts` (resolution assertion + SSR smoke render asserting
`hz-horizontal-scroll`). Zero runtime dependencies.

**R2 — Scroller structure and the panel model.** One element — the root is both
the scroll container and the flex row (no inner track: nothing here needs the
carousel's viewport/track split, and a single box has no "trailing padding is not
scrollable" flexbox trap because the component ships no padding). Structural CSS:

```
.hz-horizontal-scroll {
	display: flex;
	block-size: var(--hz-horizontal-scroll-height, 100dvh);
	overflow-x: auto;
	overflow-y: hidden;
	overscroll-behavior-x: contain;   /* x only — see R6 */
	gap: var(--hz-horizontal-scroll-gap, 0);
	min-width: 0;
}
.hz-horizontal-scroll > :global(*) {
	flex: 0 0 var(--hz-horizontal-scroll-panel-width, 100%);
	min-width: 0;
	scroll-snap-align: start;         /* inert until R3 turns snap-type on */
}
```

- **Panels are plain direct children.** No `Panel` subcomponent and no wrapper
  element: a `<Parallax>` band, a `<section>`, or a `<Card>` written as a direct
  child *is* a panel, sized by the parent's `> :global(*)` rule (the
  `Split.svelte` precedent for styling consumer children). This is what lets a
  Parallax band slot in with no adapter. The `:global()` is required because a
  child rendered from the consumer's snippet carries the consumer's scope class,
  not this component's.
- **Height.** `100dvh` by default — the primary case is a full-viewport shell,
  and `dvh` (not `vh`) is what survives a mobile URL bar collapsing. Embedding at
  another height is one property (`--hz-horizontal-scroll-height: 22rem`) or an
  inline `style="height: …"`, which wins over the stylesheet by construction.
- **Panel height is free.** Flex `align-items: stretch` (the default, not
  restated) gives every panel the scroller's full height, so a `Parallax` band
  used as a panel needs no `min-height` of its own — unlike a band in normal
  flow (59 R2).
- **`overflow-y: hidden`** for the reason 58 R2 gives: a single non-`visible`
  axis forces the other to `auto`, which would grow a stray vertical scrollbar.
  A panel that genuinely needs vertical scrolling makes its own inner scroller,
  which R6 then defers to.
- **Scrollbar: native, visible, unstyled, never hidden.** The Layout family ships
  no theme sheet, and scrollbar *presentation* is exactly what a theme sheet owns
  (58 R12 puts the rail's slim scrollbar in `carousel.css`), so this component
  ships neither `scrollbar-width` nor `scrollbar-color`. Leaving it visible is
  also the honest call for a full-page horizontal shell: the scrollbar is the
  only at-rest signal that the page moves sideways, and it is a free pointer path
  for users who cannot drag or wheel. Consumers who want it slim write
  `scrollbar-width: thin` in their own class. There is no prop to hide it
  (Non-goals).
- `min-width: 0` is the Split/Grid guard, so the shell never props a flex/grid
  parent open.

**R3 — `snap`, default off.** `snap?: boolean`, default **`false`**. When on, the
root carries `data-snap` (present) and
`.hz-horizontal-scroll[data-snap] { scroll-snap-type: x mandatory; }` applies;
panels already carry `scroll-snap-align: start` (R2), inert while snap-type is
`none`. When off, no attribute and free continuous scrolling.

**The default deliberately differs from the carousel rail's `snap={true}`**
(58 R3). A rail is a row of small cards where every card is a discrete stop and
mandatory snap is what makes paging land cleanly. This is a page shell: panels
are viewport-sized, the content between them is meant to be read while it moves,
and mandatory snap on a full-screen scroller fights every partial gesture — it is
also the mechanism most likely to feel like a hijack. Free-flowing is the correct
default; snapping is a design choice a consumer opts into.

**R4 — Keyboard operability.** The root carries `tabindex="0"` — the 58 R9
precedent: a scrollable region must be operable by keyboard (2.1.1), and a tab
stop on the scroller gives the browser's own arrow-key scrolling for free with
zero JS. No `role` and no name are added by the component (R10).

- **Arrow keys are native.** No keydown interception for them, ever (58 R9).
- **Home/End are the one exception**, because browsers map them to the *block*
  axis and this scroller has no block overflow, so they would be dead keys. One
  `onkeydown` handler on the root: `Home` → scroll to the inline start, `End` →
  to the inline end, guarded by **`event.target === rootEl`** (so Home/End inside
  a focused input or textarea in a panel still mean caret movement) and by no
  modifier key being held. `event.preventDefault()` only when it acts.
  Implemented with `rootEl.scrollTo({ left, behavior })`, `behavior` read at call
  time: `'auto'` under `prefers-reduced-motion: reduce`, `'smooth'` otherwise
  (R11). The component never sets CSS `scroll-behavior: smooth` — that would also
  animate focus scroll-into-view and browser scroll restoration (58 R8).
- Tabbing into a panel that is off-screen scrolls it into view natively; nothing
  in this component interferes with that.

**R5 — Wheel remap: on by default, and only what it can use.** `wheel?: boolean`,
default **`true`** (amended 2026-07-31, user decision: the wheel remap is what
sells the whole shell under a mouse, so it ships on rather than opt-in — every
safety behavior below is unchanged by the flip). When `false` **nothing is
attached and nothing is remapped** — no listener exists, and the wheel behaves
exactly as it does on any scroll container.

When not `false` (the default, or explicit `true`), an `$effect` attaches
`rootEl.addEventListener('wheel', onWheel, { passive: false })` and its cleanup
removes it (so flipping the prop off mid-session detaches). `addEventListener`
rather than an `onwheel` attribute for two reasons: the listener must **not
exist** when the prop is off, and `passive: false` must be explicit rather than
inherited from Svelte's default list (Svelte 5 forces `passive` only for
`touchstart`/`touchmove` — correct today, but not a thing to depend on
implicitly when `preventDefault()` is load-bearing). The root stamps `data-wheel`
(present) from the same effect, so the hook reflects the **attached listener**,
not the prop — the effective-behavior doctrine (58 R12).

The handler, in order:

```
function onWheel(e) {
	if (e.ctrlKey || e.metaKey || e.shiftKey) return;         // 1
	if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;     // 2
	if (nestedVerticalScrollerCanTake(e)) return;             // 3  (R6)
	const max = rootEl.scrollWidth - rootEl.clientWidth;      // 4  (R6)
	if (e.deltaY > 0 && rootEl.scrollLeft >= max - 1) return;
	if (e.deltaY < 0 && rootEl.scrollLeft <= 0) return;
	rootEl.scrollLeft += pixels(e);                           // 5
	e.preventDefault();
	markWheeling();                                           // 6  (R7)
}
```

1. **`ctrlKey`/`metaKey` = zoom, `shiftKey` = horizontal intent.** Ctrl+wheel is
   pinch/browser zoom and must never be consumed (1.4.4). Shift+wheel is already
   horizontal on every platform — either the browser reports `deltaX`, or it
   swaps axes itself — so remapping it too would double the speed.
2. **Vertical-dominant only.** A trackpad two-finger horizontal pan arrives as
   `deltaX` and the browser already scrolls the container with it; consuming
   those events would apply the motion twice.
3. Nested vertical scroller precedence — R6.
4. End fall-through — R6.
5. **`deltaMode` normalization**, since `deltaY` is not always pixels:
   `0` (pixel) → `deltaY`; `1` (line) → `deltaY * 16`; `2` (page) →
   `deltaY * rootEl.clientWidth` (a page of *this* travel is one panel-width of
   horizontal, not a screen of vertical). The `16` is a line-height
   approximation and the one tuning constant here — name it
   (`WHEEL_LINE_PX = 16`) rather than inlining it.
   The assignment is direct and unanimated (1:1 direct manipulation, no
   `behavior: 'smooth'`, no easing, no multiplier hook).

**R6 — Fall-through, precedence, and the two `overscroll-behavior` axes.** The
remap must never trap the user. Three rules, all evaluated **before** the delta is
applied, all of which end in *returning without `preventDefault()`* so the
browser does its normal thing with that event:

- **At either end of the inline range, the wheel falls through to the page.**
  Evaluated per event, with a 1px tolerance for fractional layout: a wheel-down
  at the end edge, or a wheel-up at the start edge, is not consumed, so the page
  scrolls vertically as usual. There is no latch, no timer, and no "rubber band
  then release": the event that *reaches* the end is fully consumed (clamped by
  the browser), and the **next** event falls through. That is one notch of
  overshoot at most, and it is what makes the shell feel like a section of a page
  rather than a trap.
- **A scroller whose content fits needs no special case.** `max === 0` makes both
  end tests true, so every wheel event falls through and the shell behaves like
  an ordinary block. No guard, no dev warning.
- **A nested vertical scroller inside a panel wins.** From `e.target` (when it is
  an `Element`) walk `parentElement` up to — but not including — the root; if any
  node has computed `overflow-y` of `auto`/`scroll`, has vertical range
  (`scrollHeight - clientHeight > 1`), **and has room left in the delta's
  direction**, return without consuming, so the browser scrolls that inner
  scroller. Only when the inner scroller is exhausted in that direction does the
  remap take over — which is exactly how native scroll chaining reads. *Known
  ceiling:* this is a `getComputedStyle` walk per wheel event, bounded by the
  DOM depth from the target to the root; if it ever shows in a profile, the fix
  is caching the resolved scroller per `e.target`, not removing the rule.
- **`overscroll-behavior-x: contain` only — never both axes.** The `x` value is
  58 R2's guard against a horizontal overscroll triggering browser
  back-navigation. Setting `overscroll-behavior: contain` (or a `y` value) would
  block the vertical chaining that the end fall-through depends on, and the
  fall-through would silently become a trap. This is a Reviewer fail condition,
  not a style preference.

**R7 — Wheel × snap.** With `snap` and `wheel` both on, a `scrollLeft` assignment
per wheel event fights `scroll-snap-type: x mandatory` — a mouse notch (~100px)
is smaller than half a viewport-wide panel, so the browser re-snaps straight back
and the remap feels dead. The fix is 58 R6's, reused, not reinvented: while a
remapped wheel burst is in flight the root carries `data-wheeling`, and

```
.hz-horizontal-scroll[data-wheeling] { scroll-snap-type: none; }
```

placed **after** the `[data-snap]` rule (same specificity — source order decides).
`markWheeling()` stamps the attribute on each consumed event and clears it
`WHEEL_SETTLE_MS = 150` after the last one (one `setTimeout` handle, reset per
event, cleared on destroy); when it clears, re-enabling snap makes the browser
settle to the nearest panel on its own. The attribute is stamped whenever the
remap consumes an event, regardless of `snap`, because it is an honest state hook
either way. `data-wheeling` is never present when `wheel` is off.

**R8 — `axis` on Parallax: what changes, what does not.** `axis?: 'y' | 'x'`,
default `'y'`. `Parallax` stamps `data-axis={axis}` on its root **for both
values** (58 R1's posture: stamp both so themes and tests can target either),
after the `...rest` spread so the managed value wins. It is the component's first
`data-*`.

`ParallaxLayer` gains exactly one CSS rule, **inside the existing
`@media (prefers-reduced-motion: no-preference)` → `@supports (animation-timeline:
view())` nest**, immediately after the existing `.hz-parallax-layer` block:

```css
:global(.hz-parallax[data-axis='x']) .hz-parallax-layer {
	animation-timeline: view(inline);
}
```

- **No JS, no context plumbing, no prop on the layer.** The band's attribute
  reaches every layer through the cascade, so the axis stays live and reactive
  for free and applies to layers at any depth inside the band. (Rejected:
  `animation-timeline: var(--hz-parallax-axis)` — a custom property in a timeline
  property is thinner ice than an attribute selector, for no gain.)
- **Band-level, not per-layer**, because a band crosses one scroller on one axis;
  two layers of the same band tracking different axes is a composition of two
  bands, not a prop.
- **`view(inline)` not `view(x)`**: the default `view()` is `view(block)`, so
  keeping the pair logical keeps both modes in one coordinate system and composes
  with the layer's logical `inset-*` bleed. In the library's writing mode they are
  the same axis; RTL and vertical writing modes are a documented ceiling, matching
  58's RTL ceiling.
- **Travel props are symmetric and unchanged.** In `axis="x"` a layer's `x`
  travel is drift along the scroll direction and `y` is cross-axis drift; both
  work, both keep their keyframes, their `±half` neutral-at-midpoint semantics,
  their bleed math and their custom properties. `--hz-parallax-range` also works
  unchanged — the range is relative to whichever axis the timeline uses.
- **The gating structure extends identically (59 R6).** The new rule sits inside
  both gates, so under `reduce` or without `animation-timeline` support a
  horizontal band renders exactly like a vertical one: static, neutral, correct.
  A rule that lands outside either gate is a Reviewer fail.
- **Untouched in 59:** `Parallax`'s four structural declarations, the context key,
  `ParallaxLayer`'s entire script, props, bleed, z-index, `pointer-events`,
  `aria-hidden`, keyframes, and all four existing dev warnings.

**R9 — One new dev warning: the axis has no scroller.** `ParallaxLayer`'s existing
DEV post-mount effect (59 R10.4) gains a second check, same block, same
`[hyzer-ui] <ParallaxLayer>:` prefix, DEV-only, behavior-neutral: resolve the
band's nearest ancestor **scroll container** (walk up until a node whose computed
`overflow-x` or `overflow-y` is `auto`/`scroll`/`hidden` — `clip` and `visible`
are not scroll containers, so the band's own `overflow: clip` is correctly
skipped — falling back to the document scrolling element), then check it has range
on the timeline's axis (`scrollWidth > clientWidth` for `x`,
`scrollHeight > clientHeight` for `y`). If not, warn that the drift will not move
and name the axis.

One check catches both new misuses: an `axis="x"` band on a page with no
horizontal scroller, and — more likely — a default `axis="y"` band used as a panel
**inside** a `HorizontalScroll`, where the nearest scrollport is the shell and its
block axis does not scroll, which would otherwise freeze every layer at a fixed
offset with no clue why. The axis is read from the band's `data-axis` in the same
effect (no new context). *Known ceiling:* measured once post-mount, so a scroller
that only overflows later (late-loading images) can produce one false warning in
dev; DEV-only and behavior-neutral, so the cost is a console line.

`HorizontalScroll` ships **no** dev warnings: it has no required label, no
mutually-exclusive props, and no inert-prop combinations (`wheel` on a
non-overflowing shell is self-healing per R6).

**R10 — Accessibility (WCAG 2.1 AA).**

- **2.1.1 Keyboard.** The shell is a tab stop with native arrow scrolling plus the
  Home/End jump (R4). Every panel's content is in the tab order in DOM order =
  visual order; nothing is `inert`, nothing is hidden, and tabbing to an
  off-screen panel scrolls it into view natively.
- **No `role`, no name, by default.** A focusable scroll container needs neither
  to satisfy 2.1.1, and a `role="region"` without an accessible name is not
  exposed as a landmark anyway. A consumer whose shell *is* the page's main
  content passes `role="region" aria-label="…"` (or uses `as="main"`) through
  rest; the docs say so once.
- **Scroll-jack ethics.** The wheel remap is on by default (amended 2026-07-31;
  `wheel={false}` opts out) and consumes only vertical-dominant, unmodified
  wheel events the scroller can actually use, defers to a nested vertical
  scroller, and returns the wheel to the page at either end (R5/R6). Touch
  panning, trackpad pan, shift+wheel, keyboard, the scrollbar and browser
  find-in-page scrolling are never intercepted, in any configuration. There is
  no configuration of this component
  that leaves a user unable to leave the page.
- **2.3.3 Animation from Interactions.** Composition with 59 is unchanged: layer
  drift is removed entirely under `prefers-reduced-motion: reduce` by 59 R6's
  outer gate, which R8's new rule sits inside. Scrolling itself is direct
  manipulation, not vestibular motion, and stays — including the wheel remap
  (58 R8's stance on user-driven scrolling). The only *programmatic* motion this
  spec adds is the Home/End jump, which goes instant under `reduce` (R4).
- **2.2.2 Pause, Stop, Hide.** Nothing auto-advances; there is no autoplay, no
  timer-driven scroll, no idle motion.
- **1.4.4 Resize text / zoom.** Ctrl+wheel is never consumed (R5).
- **2.5.7 Dragging Movements.** No dragging gesture is required by this component
  (there is none — Non-goals); the scrollbar, keyboard, wheel and touch all move
  it.
- **Contrast (1.4.3).** The component contributes no color.

**R11 — SSR safety and pre-hydration.** No `window`, `document`, or `matchMedia`
at module scope or during initialization; the wheel listener, the `matchMedia`
read for Home/End, and every measurement live in an effect or an event handler.
The server frame and the pre-hydration frame render a working scroller: native
overflow, flex panels, and snapping need no JS, so the shell lays out and scrolls
correctly before hydration — only the wheel remap and Home/End arrive with it.
`data-wheel` is stamped by the effect, so it is absent server-side, honestly. The
reduced-motion check is the same guarded two-line call-time `matchMedia` shape
`Carousel.svelte`, `Video.svelte` and `Form.svelte` each keep locally — copy the
shape, do not export or refactor an existing one.

**R12 — Hooks and theme posture.** Everything is structural; **no
`src/lib/theme/components/horizontal-scroll.css` is created** and `theme.css` is
not touched. Two `src/docs/hooks.ts` edits, held by `hooks.spec.ts`:

- New `HorizontalScroll` entry (Layout group, after `Parallax`):
  - **attrs**: `data-snap` — "present when snapping is on" ; `data-wheel` —
    "present once the wheel remap is actually listening (client-side only)" ;
    `data-wheeling` — "present while a remapped wheel burst is in flight;
    suppresses snapping so the burst is not fought, then the browser settles".
  - **props**: `--hz-horizontal-scroll-height` — `<length> — default 100dvh` ;
    `--hz-horizontal-scroll-panel-width` — `<length|percentage> — default 100%`
    ("one knob for how much of the shell a panel fills; `auto` sizes each panel
    to its content") ; `--hz-horizontal-scroll-gap` — `<length> — default 0`.
  - **parts**: none — panels are the consumer's own elements.
- Amended `Parallax` entry: new **attrs** section with `data-axis` —
  `'y' | 'x'` — "which axis of the nearest scroller drives the drift; stamped for
  both values".

**R13 — Registration touchpoints.** A new Components page trips the shared pins;
the complete list:

- `src/docs/manifest.ts` — a `HorizontalScroll` page in **Components → Layout**
  (after `Parallax`, before `Virtualizer`), `href:
  '/docs/components/horizontal-scroll'`, one-line description.
- `src/routes/docs/components/horizontal-scroll/+page.svelte` — new page (Docs).
- `src/docs/data/horizontal-scroll.ts` exporting
  `horizontalScrollDoc: ComponentDoc`, registered in `src/docs/data/index.ts`
  (Layout block). `importLine: 'import { HorizontalScroll } from
  "@hyzer-labs/ui"'`.
- `src/docs/data/parallax.ts` — an `axis` prop row (`data.spec.ts` matches every
  documented prop name against `Parallax.svelte`) and one added sentence in
  `a11yNote` about the axis composing with the same reduced-motion rule.
- `src/docs/hooks.ts` — R12's two edits.
- `src/docs/hooks.spec.ts` — bump `expect(componentPages).toHaveLength(51)` to
  `52` and extend the tally comment (`… + HorizontalScroll (spec 60)`).
- `src/lib/components/index.ts`, `src/lib/exports.spec.ts` — R1.
- `src/routes/docs.e2e.ts` — the targeted assertions in the Test Plan.
- `llms.txt`, `llms-full.txt` and `search-index.json` are manifest-derived and
  need **no** edit; the manifest-driven `docs.e2e.ts` sweep picks the new route up
  automatically (kill port 4173 before serving — stale-preview note).

**R14 — Tests.** See Test Plan.

---

### Responsive Behavior

- **Mobile (<640px).** Panels are one screen wide by default, so the shell is a
  swipe-through story: native touch pan and fling, no wheel involved (the remap is
  inert without a wheel device). `100dvh` keeps a panel exactly one screen tall as
  the URL bar collapses. `overscroll-behavior-x: contain` stops a pan at the start
  edge from triggering the browser's back-swipe. Nothing hides or reflows; the
  panel count and order are identical at every width.
- **Tablet (640–1024px).** Same structure. A consumer showing more than one panel
  at a time sets `--hz-horizontal-scroll-panel-width` per breakpoint in their own
  class — the component ships no breakpoints of its own.
- **Desktop (>1024px).** Same structure, plus the two desktop-only inputs: the
  scrollbar and (unless opted out) the wheel remap.
- **Parallax inside the shell** ships no breakpoints either; 59's advice stands —
  tune travel per breakpoint via `--hz-parallax-x`/`-y` in a consumer class.

### Accessibility

Covered in R10, plus R4 (keyboard) and R9's composition note. The one-line
summary for the Reviewer: nothing here is reachable only by wheel, only by drag,
or only by pointer; and no configuration can prevent the user from scrolling the
page away.

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| `wheel` unset (default, amended 2026-07-31) | Listener attached, `data-wheel` present — the remap is on out of the box. |
| `wheel` unset/`true`, wheel at the inline end, scrolling further | Not consumed, not `preventDefault`ed: the page scrolls vertically (R6). |
| `wheel` unset/`true`, at the end, scrolling back | Consumed normally — the end test is direction-aware. |
| `wheel` unset/`true`, content does not overflow | Every event falls through (`max === 0`); the shell behaves like a plain block. No warning. |
| `wheel={false}` | No listener attached, no `data-wheel`, no `preventDefault` anywhere. The wheel behaves as on any scroll container. |
| Shift+wheel / trackpad horizontal pan | Never remapped; the browser's own horizontal scrolling handles it (no double speed). |
| Ctrl+wheel / pinch zoom | Never consumed; zoom works (1.4.4). |
| Wheel over a nested vertical scroller with room | The inner scroller scrolls; the remap stays out of it. When the inner scroller is exhausted in that direction, the remap takes over (R6). |
| `wheel` flipped to `false` at runtime | The effect's cleanup removes the listener and `data-wheel`; nothing is remapped afterwards. |
| `snap` unset (default) | Free scrolling; no `data-snap`; panels' `scroll-snap-align` is inert. |
| `snap` + `wheel` | `data-wheeling` suppresses snap during the burst; 150ms after the last consumed event snap returns and the browser settles to the nearest panel (R7). |
| Tab into the shell, arrow keys | Native horizontal scrolling; no interception. |
| Home/End with focus on the shell | Jumps to the inline start/end; instant under `reduce`. |
| Home/End inside a focused input in a panel | Ignored by the component — caret movement, untouched (R4). |
| Panel taller than the shell | Clipped (`overflow-y: hidden`). A panel that needs vertical scrolling makes its own scroller, which R6 then defers to. |
| `Parallax` band as a panel | Gets full height from flex stretch — no `min-height` needed, unlike a band in normal flow. |
| `Parallax` with default `axis="y"` inside the shell | Layers freeze at a fixed offset (the shell's block axis does not scroll) — one dev warning naming the axis (R9). Use `axis="x"`. |
| `Parallax axis="x"` on an ordinary vertical page | Same freeze in the other direction — the same one dev warning. |
| `axis="x"` + `prefers-reduced-motion: reduce` | No animation declared at all; layers paint at their neutral position, exactly as `axis="y"` (59 R6, extended). |
| `axis="x"` in a browser without `animation-timeline` | Static, neutral, correct — identical to the reduced-motion render. |
| `axis` toggled at runtime | The cascade re-resolves; the timeline swaps axes with no JS, no remount. |
| Layer travel in a horizontal band | `x` drifts along the scroll direction, `y` across it; bleed, z-index, range and the ±half neutral semantics are unchanged. |
| Page-level horizontal overflow | The shell scrolls internally and never widens the document (`min-width: 0` + its own `overflow-x`); the e2e sweep's no-horizontal-overflow assertion must stay green at all three viewports. |
| SSR / pre-hydration | Layout, scrolling and snapping work from markup + CSS; `data-wheel` absent until the effect runs; nothing shifts on hydration. |
| RTL | The shell lays out and scrolls natively, but the R5/R6 `scrollLeft` arithmetic and `view(inline)` progress are specified and verified for LTR only — documented ceiling, matching 58's. |
| `...rest` collides with a managed attribute | Component-managed value wins (rest spreads first), as everywhere in the library. |

### Existing Code to Reuse

- **`src/lib/components/Carousel.svelte`** (rail paths, 58): the
  `overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain` scroller
  shape, `tabindex="0"` on a scroll region with the two `svelte-ignore` comments
  it needs, `scroll-snap-align: start` on items with a `data-*`-gated
  `scroll-snap-type`, the `data-dragging`→`data-wheeling` snap-suppression idea,
  and the local `prefersReducedMotion()` shape for call-time `behavior`.
- **`src/lib/components/Split.svelte`** — `> :global(*)` for styling
  consumer-supplied children, and the `<svelte:element this={as}>` + `cx` +
  rest-first house shape.
- **`src/lib/components/Parallax.svelte` / `ParallaxLayer.svelte`** — edited in
  place per R8/R9; the existing DEV `untrack()` warning block and post-mount
  effect are extended, not duplicated.
- **`src/lib/utils`** `cx`.
- **`src/docs/ScrollStage.svelte`** — the bounded-demo precedent (docs-only
  chrome, `ResizableDemo.svelte` lineage). Reused as-is on the Parallax page; the
  HorizontalScroll page needs no horizontal equivalent because the component
  bounded by `--hz-horizontal-scroll-height` **is** its own stage (Docs).
- **`src/docs/data/parallax.ts` + `src/routes/docs/components/parallax/+page.svelte`**
  — the copy-from template for the new data module and page (`DocPage`,
  `Example`, `Tabs`, `tab-note`, `demoSvg`).
- **`src/lib/components/Parallax.svelte.spec.ts` / `parallax.spec.ts`** — the
  browser-project CDP reduced-motion emulation idiom and the source-text gate
  pins; extend both rather than starting new files for the Parallax changes.
- **`src/lib/exports.spec.ts`** — the resolution + SSR smoke-render pattern.

### Test Plan

Runner: **Vitest**, two projects — `client` (real Chromium via the Playwright
provider, `vitest-browser-svelte`, `*.svelte.spec.ts`) and `server` (node,
`*.spec.ts`) — plus **Playwright** for docs e2e. Scroll metrics are real in the
browser project, so pin explicit widths on the shell and an explicit
`--hz-horizontal-scroll-panel-width` for determinism (the existing rail suite's
convention), and poll with `vi.waitFor` for anything smooth.

**Browser — `src/lib/components/HorizontalScroll.svelte.spec.ts`** (new):

- **Structure:** root `.hz-horizontal-scroll` computes `display: flex`,
  `overflow-x: auto`, `overflow-y: hidden`, `overscroll-behavior-x: contain`, and
  — the fall-through prerequisite, asserted explicitly —
  `overscroll-behavior-y` is **not** `contain`. `as="section"` →
  `tagName === 'SECTION'`; `class` merges after the root class; a rest attr
  forwards and a colliding managed attribute loses; `tabindex="0"` present.
- **Panel model:** a direct child's computed flex-basis follows
  `--hz-horizontal-scroll-panel-width`; `scroll-snap-align` is `start` on every
  direct child regardless of `snap`.
- **Snap default (the locked decision):** `data-snap` **absent** by default and
  computed `scroll-snap-type` is `none`; with `snap`, `data-snap` present and
  `x mandatory`.
- **Wheel on by default (amended 2026-07-31):** with no `wheel` prop at all,
  `data-wheel` is present and `new WheelEvent('wheel', { deltaY: 120,
  cancelable: true, bubbles: true })` moves `scrollLeft` by 120 and is
  `defaultPrevented`.
- **`wheel={false}` opts out:** dispatching the same event → `scrollLeft`
  unchanged, `defaultPrevented === false`, no `data-wheel`.
- **`deltaMode`:** `deltaMode: 1, deltaY: 3` → +48; `deltaMode: 2, deltaY: 1` →
  +`clientWidth`.
- **Guards:** `shiftKey`, `ctrlKey`, and `deltaX: 200, deltaY: 10` are each not
  consumed (`scrollLeft` unchanged, not `defaultPrevented`).
- **End fall-through:** at `scrollLeft === 0`, `deltaY: -120` is not consumed; at
  the max, `deltaY: 120` is not consumed but `deltaY: -120` is; a shell whose
  content fits consumes nothing.
- **Nested scroller precedence:** a panel containing an `overflow-y: auto` box
  with range — dispatch from inside it → not consumed; scroll that box to its
  bottom and dispatch down → consumed by the remap.
- **Snap suppression:** with `snap` and `wheel`, a consumed event stamps
  `data-wheeling` and computed `scroll-snap-type` is `none`; `vi.waitFor` that the
  attribute clears and the value returns to `x mandatory`.
- **Teardown:** rerender with `wheel={false}` → `data-wheel` gone and a dispatched
  event is no longer consumed.
- **Home/End:** a `Home`/`End` keydown with `target` the root moves `scrollLeft`
  to 0 / the max (poll); the same key dispatched from an `<input>` inside a panel
  changes nothing and is not `defaultPrevented`.

**Browser — `src/lib/components/Parallax.svelte.spec.ts`** (extend):

- `data-axis` is `'y'` by default and `'x'` when set — stamped for both values.
- With `axis="x"` inside a real horizontal scroller (explicit widths), the layer's
  single animation has a `ViewTimeline` whose `axis === 'inline'`; with the
  default, `axis === 'block'`. Guard `typeof ViewTimeline !== 'undefined'` and
  skip with a comment otherwise.
- Under CDP `prefers-reduced-motion: reduce`, an `axis="x"` layer reports zero
  animations and computed `translate: none` — the extended gate. Reset emulation
  in `afterEach`.
- **Dev warning (R9):** a band with `axis="x"` in a non-scrolling wrapper warns;
  the same band inside a horizontally overflowing scroller does not; a default
  `axis="y"` band inside a horizontal-only scroller warns. Existing 59 warnings
  still fire exactly as before (no new noise for a well-formed vertical band).

**Server — `src/lib/components/parallax.spec.ts`** (extend): the new
`animation-timeline: view(inline)` declaration appears **only** inside the
`@media (prefers-reduced-motion: no-preference)` span **and** inside the
`@supports (animation-timeline: view())` span; `ParallaxLayer.svelte` still
declares no `-global-` keyframes and still contains no
`addEventListener('scroll'`, `requestAnimationFrame`, or `IntersectionObserver`.

**Server — `src/lib/components/horizontal-scroll.spec.ts`** (new, source-text
pins for things a computed style cannot show): the source contains
`overscroll-behavior-x` and **not** a bare `overscroll-behavior:` or
`overscroll-behavior-y:` declaration (R6's fail condition); the wheel listener is
registered with `{ passive: false }`; there is no `scroll-behavior: smooth` in the
stylesheet; no `src/lib/theme/components/horizontal-scroll.css` exists and
`theme.css` references none.

**Registry pins (server):** `hooks.spec.ts` green with the bumped count and both
entries (no-fiction / no-drift / well-formed); `data.spec.ts` green with
`horizontalScrollDoc` registered and Parallax's new `axis` prop row matching the
source; `manifest.spec.ts` green; `exports.spec.ts` covers the new export.

**e2e (`src/routes/docs.e2e.ts`):** the manifest-driven sweep already asserts one
`<h1>`, skip-link first, and **no horizontal page overflow at all three
viewports** — the primary regression a horizontal scroller can cause, and it now
covers `/docs/components/horizontal-scroll` automatically. Targeted additions:

- On the HorizontalScroll page, hover the wheel demo and `page.mouse.wheel(0, 400)`
  → the stage's `scrollLeft` increases while `window.scrollY` is unchanged.
- Continue wheeling past the last panel → `scrollLeft` is pinned at the max and
  `window.scrollY` has increased (the fall-through, end to end).
- Tab to the shell and press `End` → `scrollLeft` reaches the max.
- On the Parallax page's horizontal tab, scrolling the stage horizontally advances
  a layer's animation `currentTime`; under
  `page.emulateMedia({ reducedMotion: 'reduce' })` the same layer reports zero
  animations.

**Honestly not assertable in headless Chromium** — carried to manual review: the
*feel* of the remap against a real trackpad's high-frequency events and a real
mouse's coarse notches, momentum/fling behavior on iOS, whether 150ms is the right
settle for snap, whether panel pacing reads well, and the unsupported-browser
render (no CI engine lacks `view()`).

### Docs

**New page `src/routes/docs/components/horizontal-scroll/+page.svelte`** on the
standard scaffold (`DocPage` + `horizontalScrollDoc`, `Example` blocks with code,
`Tabs` + `demoTabs`). **Every demo is the component itself, bounded** — set
`--hz-horizontal-scroll-height` to ~22rem via a page class so each demo scrolls in
place; no new docs-chrome component is needed (unlike the vertical `ScrollStage`,
this component is its own stage). Consumer-facing framing only — no spec numbers,
no R-numbers, no test-gate or process language. Tabs:

1. **Scroll it** (opening tab, amended 2026-07-31 — the wheel remap is on by
   default, so the opening demo IS the wheel demo) — three or four full-width
   panels with big art; note that a panel is just a direct child, and that
   the scrollbar, a trackpad pan, a touch swipe, tabbing in and pressing an
   arrow key, and — with nothing switched on — a plain mouse wheel all move
   it. Give the honest explanation of the remap here: it only takes plain
   vertical wheel input while the pointer is over the shell, it stays out of
   the way of a nested scroller, and **at either end it hands the wheel
   straight back to the page** — which the reader can feel by wheeling past
   the last panel of this very demo and watching the docs page continue.
2. **Panel width & gap** — `--hz-horizontal-scroll-panel-width` at `100%`, `70%`
   (peeking edge), and `auto` (content-sized), plus
   `--hz-horizontal-scroll-gap`. One knob each, tunable per breakpoint in your
   own class.
3. **Snapping** — default free-flowing vs `snap`, side by side, with one line on
   why it is off by default here (viewport-sized panels are read while they move)
   and a one-line aside that `scroll-snap-stop: always` in your own CSS forces
   one panel per gesture.
4. **Native-only** — `wheel={false}`, a brief counter-example: the mouse wheel
   goes back to scrolling the page like any other block, while pinch-zoom,
   shift+wheel, trackpad panning, touch and the keyboard are never touched
   either way, wheel on or off.
5. **With Parallax** — bands as panels: `<HorizontalScroll>` containing two or
   three `<Parallax axis="x">` bands with layers at different `x` travel, which is
   the whole point of the pair. Links across to the Parallax page for the layer
   API.

**Parallax page** (`src/routes/docs/components/parallax/+page.svelte`) gains one
new tab, **Horizontal scrolling**, after "Horizontal drift" (and one clarifying
line on that older tab that it is drift *on a vertical scroll*, which is a
different thing): a small bounded `HorizontalScroll` holding two `Parallax
axis="x"` bands, with the `axis` prop explained as "which scroller axis drives
the drift", the note that `x` travel now runs along the scroll direction and `y`
across it, and the note that a band inside a horizontal scroller needs
`axis="x"` or its layers will sit still.

Prose must also state, once each: the shell keeps its scrollbar on purpose
(slim it with `scrollbar-width` in your own CSS if you like); if the shell is
your page's main content, give it `role="region"` and a label (or use
`as="main"`); a panel that needs to scroll vertically should be its own scroller;
and motion rules are unchanged — layers stop drifting entirely for visitors who
ask for less motion, while scrolling itself always works.

### Non-goals

- **No pin/scrub timelines.** No pinned sections, no scrubbed video, no
  progress-driven sequencing. That is GSAP ScrollTrigger territory and a
  different mechanism entirely.
- **No scroll-driven anything beyond the drift.** No opacity, scale, colour, or
  entrance animation on the timeline (`./motion`'s `reveal` is the entrance tool).
- **No vertical wheel remap anywhere else** — the remap is a prop on this
  component, not a utility, an attachment, or an option on `Carousel`'s rail.
- **No URL/section deep-linking, no `index` binding, no `onchange`, no
  panel-change events, no dots or counters.** A page shell has no active panel;
  if a consumer needs a discrete index, `Carousel layout="rail"` (58) is that
  component.
- **No virtualization or lazy panel mounting.** Every panel renders.
  `Virtualizer` (specs/23) is for large lists.
- **No autoplay, auto-advance, or timer-driven motion.**
- **No mouse drag-to-pan.** The rail has one because its cards are small and its
  scrollbar is short; a full-viewport shell has a full-width scrollbar, a wheel
  remap, touch, and the keyboard. Revisit only on request.
- **No scrollbar hiding prop, no edge fade/gradient mask.** A mask clips focus
  rings and adds a contrast surface to defend (58's reasoning), and hiding the
  scrollbar removes the only at-rest signal that the shell scrolls.
- **No `Panel` subcomponent, no per-panel props.** Children are panels.
- **No wheel speed/multiplier hook and no smooth-scroll remap.** 1:1 direct
  manipulation only; the only constants are `WHEEL_LINE_PX` and
  `WHEEL_SETTLE_MS`.
- **No per-layer axis, no mixed-axis bands, no `axis="both"`.** One band, one
  axis (R8).
- **No vertical variant of `HorizontalScroll`.** The page already scrolls
  vertically.
- **No RTL guarantee** for the wheel arithmetic or `view(inline)` progress —
  layout and native scrolling work, the remap is verified LTR only (documented
  ceiling, 58 precedent).
- **No theme sheet, no colors, no polyfill, no JS fallback for `view()`** — 59's
  non-goals carry over unchanged.

### Write scope

New: `src/lib/components/HorizontalScroll.svelte`,
`src/lib/components/HorizontalScroll.svelte.spec.ts`,
`src/lib/components/horizontal-scroll.spec.ts`,
`src/docs/data/horizontal-scroll.ts`,
`src/routes/docs/components/horizontal-scroll/+page.svelte`.
Edited: `src/lib/components/Parallax.svelte` (the `axis` prop + `data-axis`),
`src/lib/components/ParallaxLayer.svelte` (one gated CSS rule + one dev warning),
`src/lib/components/Parallax.svelte.spec.ts`,
`src/lib/components/parallax.spec.ts`, `src/lib/components/index.ts`,
`src/lib/exports.spec.ts`, `src/docs/hooks.ts`, `src/docs/hooks.spec.ts`
(count + comment), `src/docs/data/index.ts`, `src/docs/data/parallax.ts`,
`src/docs/manifest.ts`, `src/routes/docs/components/parallax/+page.svelte`,
`src/routes/docs.e2e.ts`.
No theme sheet, no `theme.css` edit, no `package.json` change, no new
dependencies.
