# Carousel Drag Mode — controls-free presentation, focus-revealed controls, seamless loop-wrap

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope:
> `src/lib/components/Carousel.svelte` + its spec, `src/lib/theme/components/carousel.css`,
> `src/docs/hooks.ts` + `src/docs/hooks.spec.ts`, `src/docs/data/carousel.ts`, the
> Carousel docs page (`src/routes/components/carousel/+page.svelte`), and docs e2e.
> **This spec builds on `specs/33-carousel.md` and does not restate it.** Carousel
> never had a formal spec before 33; 33 documents the sliding-track + drag contract,
> and this file adds the drag-first *presentation* mode plus an opt-in seamless
> loop-wrap. Everything in 33 (R1–R10) still holds unless a requirement below
> explicitly amends it.

### Goal

Give Carousel a **controls-free, drag-first presentation** — a slide track a user
drags/swipes with no chrome in the resting view — **without sacrificing any
non-drag operability**. The prev/next buttons and the indicator stay in the DOM,
keyboard-focusable, and reveal on focus/hover; keyboard steering, the live region,
and the WCAG 2.5.7 single-pointer alternative all keep working. The user's target
composition is `draggable loop seamless controls="focus"`, and with the opt-in
`seamless` prop every boundary wrap — drag, buttons, dots, arrow keys — is visually
continuous (no backward-sweep "teleport" when crossing the first/last boundary).

### Context & Conventions

- Decisions locked with the user (2026-07-23): the "no visible controls" look is a
  **presentation mode layered on the existing controls**, never a removal of them.
  Hidden-but-focusable controls are the load-bearing a11y mechanism, not chrome.
- **The existing `draggable?: boolean` prop is retained by name** (default `true`),
  not renamed to the brief's suggested `drag`. It already ships, is documented in
  `src/docs/data/carousel.ts`, and is covered by the 33 drag suite; renaming is
  churn for no gain even in a greenfield package. "Drag mode" in this spec means
  `draggable` (on) composed with `controls="focus"`.
- **`draggable`, `controls`, and `seamless` are orthogonal.** Pointer drag
  (`draggable`), control visibility (`controls`), and seamless boundary wrap
  (`seamless`) are independent axes: any combination is valid. `controls="focus"`
  works with `draggable={false}` (a keyboard-only controls-free carousel);
  `seamless` works with buttons and keys even when `draggable={false}`. The user's
  ask composes all three.
- **`seamless` is opt-in and only meaningful with `loop`.** Default `false`. Without
  it, all navigation — including drag settle — keeps spec 33's `go()`-animated
  rewind, and the DOM stays byte-for-byte identical to spec 33 (no clones). Setting
  `seamless` without `loop` is an inert no-op (R6).
- **Post-palette-split theme doctrine (specs/42).** Any color the theme resolves
  goes through `--hz-color-*` / `--hz-intent-*` only; no raw palette refs.
- **Lightbox composition is protected.** `LightboxOverlay` renders a `Carousel`
  with `loop` and the default `draggable={true}` (Lightbox-R14) but **does not pass
  `seamless` or `controls`**, so both default off/`"visible"`: Lightbox keeps spec
  33's exact presentation and `go()` rewind, with no clones and no reveal behavior.
  It is unaffected by this spec — see R6 and Out of Scope.

### Props

Full surface restated (33 had no formal prop table here); **NEW/AMENDED** flagged.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `T[]` | — | Required. |
| `ariaLabel` | `string` | — | Required. Names the carousel region. |
| `index` | `number` (bindable) | `0` | Active slide. |
| `loop` | `boolean` | `false` | Wrap both directions. Prerequisite for `seamless` (R6). |
| `draggable` | `boolean` | `true` | Pointer drag (spec 33 R3–R10). Retained name. |
| **`controls`** | **`'visible' \| 'focus'`** | **`'visible'`** | **NEW.** `'focus'`: controls are in-DOM and focusable but visually hidden until focus/hover, and reveal together (R1–R4). `'visible'`: today's always-shown row. |
| **`seamless`** | **`boolean`** | **`false`** | **NEW.** Opt-in continuous boundary wrap (no backward sweep), applied uniformly to every ±1 wrap navigation. Only meaningful with `loop`; inert no-op otherwise (R6). |
| `indicator` | `'counter' \| 'dots'` | `'counter'` | Counter, or clickable dots. |
| `prevLabel` / `nextLabel` | `string` | `'Previous slide'` / `'Next slide'` | |
| `slideLabel` | `(item, i) => string` | `'{n} of {total}'` | |
| `dotLabel` | `(i, count) => string` | `'Go to slide {n} of {total}'` | |
| `onchange` | `(index: number) => void` | — | |
| `slide` | `Snippet<[T, number]>` | — | Required. |
| `class` | `string` | — | Merged after `hz-carousel`. |

### Requirements

1. **R1 — `controls` prop + root hook.** `controls?: 'visible' | 'focus'`
   (default `'visible'`). The component stamps `data-controls={controls}` on the
   `.hz-carousel` root (always, both values, so the Reviewer can assert either).
   The value drives **presentation only** — the controls markup (`.hz-carousel-controls`,
   prev/next Buttons, dots/counter) renders identically to spec 33 in both modes
   whenever `count > 1`. `data-controls` is the sole component-side change for the
   focus mode; the reveal itself is theme (R3, Structural vs theme split).

2. **R2 — Controls stay operable in `focus` mode (load-bearing a11y).** With
   `controls="focus"`, every control (prev, next, each dot, or the counter) is:
   (a) present in the DOM, (b) in the accessibility tree — **never** `display:none`,
   `visibility:hidden`, `aria-hidden`, or `inert`, (c) in the natural tab order,
   and (d) fully operable by keyboard (Enter/Space activate; Arrow/Home/End steer
   from anywhere inside per 33) and by single-pointer click. The visual-hide
   technique in R3 is opacity/clip/transform-based **only**, precisely so operability
   and the accessibility tree are preserved. This is the WCAG 2.5.7 alternative
   (Accessibility) — the Reviewer treats any a11y-tree removal as a fail.

3. **R3 — Focus/hover reveal, whole-row (theme).** Under `[data-controls="focus"]`
   the theme visually hides `.hz-carousel-controls` in the resting state and reveals
   it on `:hover` **and** `:focus-within` of the carousel (the skip-link reveal
   pattern, extended to pointer hover so mouse users get a visible non-dragging
   control — R2/2.5.7). **The entire control row reveals together** — chevrons **and**
   the indicator (counter or dots) — not per-control: tabbing to prev reveals next and
   the indicator too. Hidden state uses opacity/position, not
   `display`/`visibility`/`aria-hidden`. Controls are positioned as an **overlay** on
   the viewport in focus mode (no reserved layout space — the resting carousel is
   chrome-free); `.hz-carousel` is `position: relative` to anchor them. Focus order
   still matches visual order (controls follow the viewport in DOM; overlay
   positioning does not reorder the tab sequence).

4. **R4 — Reveal transition respects reduced motion.** The reveal is a transform/
   opacity transition gated behind `@media (prefers-reduced-motion: no-preference)`;
   under `reduce` the controls appear/disappear instantly on focus/hover with no
   fade. This is **theme** (chrome), unlike the settle transition which is structural
   (33 R7).

5. **R5 — Drag works unchanged in focus mode.** With `draggable` (default) and
   `controls="focus"`, pointer drag behaves exactly as spec 33 R3–R6 — the **8px
   `DRAG_THRESHOLD`, 0.5 px/ms flick velocity, half-viewport-width settle, 0.35
   rubber-band, one-slide-per-flick, click suppression, and `data-dragging`** all
   unchanged (no re-tuning). Dragging never moves keyboard focus, never traps focus,
   and never reveals the controls by itself (reveal is focus/hover only, R3). The live
   region (33) keeps announcing "{n} of {total}" on every settle, in both `controls`
   modes.

6. **R6 — Seamless boundary wrap (opt-in `seamless`, all navigation paths).**
   `seamless?: boolean` (default `false`). Its behavior:
   - **Inert without `loop`.** `seamless` is only meaningful with `loop`. Set without
     `loop` it is a no-op and `data-seamless` is **not** stamped (the hook reflects
     effective behavior, never advertising a wrap that cannot happen).
   - **Root hook.** When effective (`seamless && loop`), the component stamps
     `data-seamless` (present) on the `.hz-carousel` root, for theme/Reviewer
     targeting; absent otherwise.
   - **Uniform across all paths.** When `seamless && loop && count > 1`, **every ±1
     wrap step that crosses the first/last boundary is visually continuous** — the
     user never sees the track sweep backward through the intervening slides. This
     applies uniformly to: drag settle, the prev/next Buttons, ArrowLeft/ArrowRight,
     and a dot click that is itself an adjacent wrap step. The two wrap steps are
     `go(index+1)` at the last slide (→ first) and `go(index-1)` at the first slide
     (→ last).
   - **Adjacent-only rule.** Seamless engages **only for distance-1 wrap steps**. Any
     navigation whose net move is more than one slide — a dot jump of >1 slide, and
     `Home`/`End` (which target the absolute first/last, not a wrap neighbor) —
     animates directly via `go()` exactly as spec 33 does today, with **no clone**,
     because there is no adjacent-direction illusion to preserve.
   - **Mechanism (recommended; Builder may use an equivalent transform-only approach
     meeting the invariants).** Render an **inert, aria-hidden clone** of the
     opposite-end slide adjacent to the boundary, animate the settle/move forward into
     the clone, then **silently reset** the track transform to the real target slide
     with **no transition** after the animation completes.
   - **Invariants (Reviewer checks, for every seamless path):** clones carry
     `data-clone` (present), `inert`, and `aria-hidden="true"`; they are **never**
     counted in `count`, in "{n} of {total}", or in the dot rail; they never receive
     focus. The silent reset does not change the value of `index`, does not re-fire
     `onchange`, and does not re-announce (the announcement fired once from `go()`).
     Clones render **only** when `seamless && loop && count > 1` **and** the move is a
     distance-1 wrap step; otherwise the DOM is identical to spec 33 (no clones).
   - **Without the opt-in.** With `seamless` off (default), **all** navigation —
     including drag settle — uses spec 33's `go()`-animated rewind at the boundary
     (33 R4/R5); no clone machinery renders; the DOM is byte-for-byte spec 33. This is
     why Lightbox (which never opts in) is unaffected.
   - **Reduced motion.** Under `prefers-reduced-motion: reduce` every track move is
     instant (33 R7 gates the transition for buttons/keys/drag alike), so there is no
     sweep to hide; the seamless path is a no-op visual and must not introduce motion.

7. **R7 — Amends 33 R2 slide keying for clones.** The `{#each}` key and `inert`/
   `data-active` logic from 33 R2 continue to apply to **real** slides. Clones (R6)
   are appended outside the real-slide index space and always `inert` — the active
   slide is always a real slide, so screen readers and Tab still only ever reach the
   one active real slide.

### Structural CSS vs theme split

- **Structural (component `<style>` + component-stamped hooks):** `data-controls` and
  `data-seamless` on the root (R1/R6); the sliding track, transform, `data-dragging`,
  and the reduced-motion-gated **settle** transition (unchanged from 33 R1/R7); clone
  rendering + `data-clone`/`inert`/`aria-hidden` and the silent-reset transform logic
  (R6) — the wrap is *how the carousel moves*, not chrome, so its mechanism is
  structural. Clones must not depend on any theme rule to be inert/hidden from AT.
- **Theme (`carousel.css`, `@layer hz-theme`):** the focus-mode reveal — the resting
  hidden state, the overlay positioning, and the `:hover`/`:focus-within` whole-row
  reveal with its reduced-motion-gated fade (R3/R4); `.hz-carousel` `position:
  relative` to anchor the overlay; any scrim/background the revealed controls need for
  contrast over slide content (Accessibility). All colors resolve via `--hz-color-*` /
  `--hz-intent-*` only (specs/42). The existing 44px touch targets (33 R8) are
  unchanged.

### Accessibility (WCAG 2.1 AA)

- **APG grouped carousel** (unchanged, 33): region + slides carry
  `aria-roledescription`; no auto-rotation, so the viewport is `aria-live="polite"`
  and announces "{n} of {total}"; Arrow/Home/End steer from inside.
- **2.5.7 Dragging Movements (AA) — the reason focus-mode controls are mandatory.**
  All drag functionality has a single-pointer, non-dragging alternative: the prev/next
  buttons and dots. In `controls="focus"` these are hidden-but-present (R2) and
  revealed to pointer users on hover and to keyboard users on focus (R3), so the
  non-dragging alternative is both operable and discoverable. The spec states
  explicitly: **"no visible controls" must never mean "no controls"** — removing the
  controls from the DOM or the a11y tree would fail 2.5.7. The Reviewer verifies each
  control is reachable and operable in focus mode with drag disabled.
- **Keyboard.** Focus order matches visual order (R3). Tabbing into the carousel
  reveals the controls (focus-within) so the focused control is visible (2.4.7 Focus
  Visible). Dragging never steals or traps focus (R5). Seamless wrap never moves or
  removes focus — the silent reset is transform-only (R6).
- **Screen reader / touch.** With a screen reader active on touch, the SR consumes
  swipe gestures for its own navigation, so the carousel's pointer drag will not
  receive raw swipes; the SR user reaches the in-DOM prev/next/dots and activates
  them — the controls are the SR path, which is why they must not be `aria-hidden`
  (R2). Position changes announce via the live region regardless of `controls` mode.
  Clones are `aria-hidden` + `inert` and never announce or duplicate slide content
  (R6).
- **Reduced motion.** Reveal fade (R4) and settle (33 R7) both gate on
  `prefers-reduced-motion`; live finger-tracking is direct manipulation, not
  vestibular motion, and is unaffected. Seamless wrap introduces no motion under
  `reduce` (R6).
- **Contrast.** Revealed controls compose `Button variant="outline"` (opaque
  background) so chevrons meet contrast over arbitrary slide content; the theme adds
  a scrim behind the dot rail if needed so dots clear 3:1 non-text contrast (1.4.11)
  over imagery.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| `controls="focus"`, `count <= 1` | No controls exist (33) — nothing to reveal; resting view chrome-free. |
| `controls="focus"`, keyboard Tab in | Whole control row reveals (focus-within) — chevrons + indicator together; focused control visible. |
| `controls="focus"`, mouse hover | Whole control row reveals; click prev/next/dot works (2.5.7 pointer path). |
| `controls="focus"`, `draggable={false}` | Controls-free resting look, keyboard/hover-revealed controls only; no pointer drag. |
| `controls="focus"` + screen reader | Controls in a11y tree and operable regardless of visual reveal; live region announces. |
| `controls="visible"` (default) | Byte-for-byte spec 33 presentation; no reveal behavior. |
| `seamless` set, `loop` off | No-op; `data-seamless` not stamped; navigation is plain spec 33 (bounded). |
| `seamless loop`, drag flick past last slide | Wraps first-ward with **no backward sweep** (R6); `index` → 0, `onchange(0)` once. |
| `seamless loop`, **prev/next button** wrap | Same seamless wrap as drag — clone + silent reset, single `onchange` (R6). |
| `seamless loop`, **ArrowRight** at last / **ArrowLeft** at first | Seamless ±1 wrap (R6). |
| `seamless loop`, **dot jump >1 slide** across boundary | Direct `go()` animation as today; **no clone** (multi-slide, no direction illusion). |
| `seamless loop`, **Home/End** | Direct `go()` animation to absolute first/last; **no clone** (not a ±1 wrap step). |
| `seamless` off, `loop` on, any boundary crossing (incl. drag) | Spec 33 `go()` rewind everywhere; no clones; DOM byte-identical to 33. |
| `prefers-reduced-motion: reduce` | Reveal instant (R4); all moves instant (33); no sweep, no clone motion (R6). |
| Clone slide vs "{n} of {total}" / dots | Clone never counted, never announced, never focusable (R6/R7). |
| Lightbox (loop, default drag, no `seamless`/`controls`) | Unaffected: `controls="visible"`, no clones, spec 33 rewind; slide-count/index assertions see no `[data-clone]`. |

### Existing Code to Reuse

- **Everything in spec 33 / `Carousel.svelte`** — the track, `go()` (clamp/wrap +
  single `onchange`), axis detection, `data-dragging`, settle transition, 44px touch
  targets, dots/counter, `draggable`, and the drag tuning constants (kept verbatim,
  R5). Drag-mode adds `controls` + `seamless` clones on top; it does not re-derive
  drag or re-tune it.
- **`go()` as the single navigation funnel** — buttons/dots/keys/drag all keep
  routing through it; the seamless path (R6) wraps `go()`'s ±1 boundary move with the
  clone + silent-reset visual rather than replacing it, so clamp/wrap bounds and the
  single-`onchange` guarantee are unchanged.
- **The `.sr-only` / skip-link reveal idiom** already in the theme base (`.sr-only`
  ships in theme base.css) — the focus-reveal (R3) is the *revealed-on-focus* variant
  of that same technique; reuse its clip/position approach rather than inventing one.
- **The reduced-motion posture** used across the theme and the component's own settle
  transition (33 R7) — the reveal fade (R4) mirrors it.
- **`data-*` + class hooks doctrine** — `data-controls`, `data-seamless`, and
  `data-clone` join Carousel's `src/docs/hooks.ts` entry (attrs), with
  `src/docs/hooks.spec.ts` holding them against source (no-fiction: attribute
  stamped, class/attr present).
- **Docs scaffolds** — `DocPage`, `Example`, `Tabs`, `tab-note`, `demoTabs` on the
  Carousel page; `carouselDoc` in `src/docs/data/carousel.ts` (add the `controls` and
  `seamless` prop rows, amend the `draggable` note, add the 2.5.7 `a11yLinks` entry).

### Test Plan

Runner: **Vitest** — browser project (chromium, **Playwright** provider,
`vitest-browser-svelte`) for component behavior; `server` (node) project untouched.
`createRawSnippet` for the slide face, exactly as `Carousel.svelte.spec.ts` does.

**Pointer-event simulation strategy (what the browser unit suite can/can't do).**
`vitest-browser-svelte` dispatches synthetic `PointerEvent`s (the existing 33 suite's
`pointer()` helper) — sufficient to assert **state and DOM**: `data-controls` and
`data-seamless` stamping; controls present + not `aria-hidden`/`inert`/`display:none`
in focus mode; tab order and `.click()` operability of hidden controls; that a
seamless boundary wrap (via drag, button, dot, or arrow) sets `index`/fires
`onchange` once and renders/keys clones (`data-clone`, `inert`, `aria-hidden`,
excluded from count and the dot rail); that the silent reset leaves `index`
unchanged. Synthetic events **cannot** faithfully reproduce: real
`:hover`/`:focus-visible` computed styles and the reveal *paint*, `touch-action`
scroll arbitration, momentum timing/feel, and the seamless-wrap *visual* (absence of a
backward sweep is a rendered-frame property). **Those carry to e2e.**

- **Unit (browser):** `data-controls` reflects the prop (both values); `data-seamless`
  present only when `seamless && loop`, absent when `seamless` is set without `loop`.
  In `controls="focus"`: each control is in the a11y tree (no `aria-hidden`/`inert`/
  `display:none`/`visibility:hidden`), keyboard-focusable, `.click()`-operable, and
  Arrow/Home/End still steer — i.e. R2 proven without relying on paint. Drag in focus
  mode advances/announces identically to 33 and does not move `document.activeElement`
  (R5). With `seamless loop`: a boundary wrap triggered by **each** path — drag settle,
  prev/next button, dot click that is a ±1 wrap step, and ArrowLeft/ArrowRight —
  wraps `index`, fires `onchange` once, and renders a `[data-clone]` slide that is
  `inert` + `aria-hidden` + absent from the counter/dots; after the move the DOM
  returns to no-clone. A **multi-slide dot jump** and **Home/End** render **no clone**
  even with `seamless` on (adjacent-only rule). With `seamless` off (any `loop`): no
  clone renders on any boundary crossing, including drag; existing 33 suites stay green
  (no-clone DOM unchanged).
- **Unit (server):** `hooks.spec.ts` — `data-controls`, `data-seamless`, and
  `data-clone` documented and present in source; Carousel entry still covered.
- **e2e (`/components/carousel`, drag demo tab):** with the theme applied and the
  target composition `draggable loop seamless controls="focus"` — resting view shows
  no controls (measure the control row hidden/offscreen); Tab reveals them and focus is
  visible; hover reveals them for the pointer/2.5.7 path; a pointer drag advances the
  demo; a `loop` drag flicked past the last slide wraps with **no visible backward
  sweep** (assert via the wrapped active slide appearing without the intervening slides
  painting mid-settle, e.g. transform-sampling or a screenshot diff at the wrap frame);
  a prev/next click at the boundary wraps seamlessly too; no horizontal overflow at
  375px; `prefers-reduced-motion` disables the reveal fade.

**Docs:** the Carousel page gains a **Drag** demo tab: `<Carousel draggable loop
seamless controls="focus" …>` with a `tab-note` explaining the focus-reveal a11y story
(controls hidden-but-present, revealed together on focus/hover, the 2.5.7 alternative)
and one line on `seamless` (continuous boundary wrap across every navigation path).
`a11yLinks` in `carouselDoc` gains **WCAG 2.5.7 Dragging Movements**
(`https://www.w3.org/WAI/WCAG21/Understanding/dragging-movements.html`). No
`manifest.ts` change (page exists). Reviewer verifies by inspection.

### Out of Scope

- **Enabling seamless/focus-mode on Lightbox** — Lightbox does not pass `seamless` or
  `controls`, so it keeps spec 33's presentation and `go()` rewind; changing it is a
  separate decision (v1: no change). This spec only guarantees Lightbox is not
  regressed.
- **Seamless wrap for multi-slide jumps** — the adjacent-only rule (R6) is deliberate:
  dot jumps of >1 slide and Home/End animate directly as today, because there is no
  single-direction illusion to preserve.
- **Multi-slide momentum** — one flick still advances one slide (33 out-of-scope);
  no inertial multi-slide fling.
- **Re-tuning the drag constants** — the 33 threshold/velocity/rubber-band values are
  kept verbatim (R5).
- **Peek/multi-slide layouts, autoplay/auto-rotation** — unchanged from 33.
- **Renaming `draggable` → `drag`** — retained by name (Context).
- **A per-control (individual skip-link) reveal** — the reveal is whole-row (R3).

### Amendments

**2026-07-23 — focus-mode min-height (theme, user report).** The `controls="focus"`
row (R3) is an absolutely positioned overlay with no reserved layout space — on a
short carousel (e.g. a one-line `Blockquote` slide) it could cover most of the
slide content while dragging/hovering. `carousel.css` gains a scoped rule:
`.hz-carousel[data-controls='focus'] .hz-carousel-viewport { min-height:
var(--hz-carousel-focus-min-height, 12rem); }` — a new sizing hook (the
`--hz-carousel-dot-size` precedent), applied only under `data-controls='focus'`.
The default `controls="visible"` row sits in normal flow below the viewport
(never overlaid on slide media) and needs no reserved height, so it is
unaffected; Lightbox never passes `controls="focus"` (specs/25, unamended), so
its embedded Carousel's layout is unchanged — verified in-browser, no visual
diff. `hooks.ts` gained the prop row.
