# Carousel Spec — sliding track, pointer drag, touch targets

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope:
> `src/lib/components/Carousel.svelte` + its spec, `src/lib/theme/components/
> carousel.css`, `src/docs/hooks.ts` (new hooks), the Carousel docs page, and
> docs e2e. Carousel had no prior spec — this documents the contract as it
> stands after this change, not a full re-derivation of the existing behavior.

### Goal

The Carousel was a discrete one-slide-at-a-time swap: every non-active slide
carried `hidden`, and navigation only ever jumped between whole slides. It had
no direct-manipulation affordance and its controls were below usable touch
size. This change makes it a **sliding track** — the slides sit in a row, the
track follows the pointer during a drag and snaps on release — and brings every
control up to a functional touch target, **without changing how anything
looks**.

Decisions locked with the user (2026-07-17): a true sliding track (not
drag-as-input); 44px hit areas achieved by expanding the target, not enlarging
the visual.

### What stays the same

- The APG grouping: root is `role="group"` / `aria-roledescription="carousel"`
  with the required `aria-label`; each slide is `role="group"` /
  `aria-roledescription="slide"` with its `{n} of {total}` name.
- No auto-rotation; the viewport stays an `aria-live="polite"` region.
- `index` is bindable; `go()` clamps (or wraps under `loop`); `onchange` fires
  only on a real change. Arrow/Home/End keys steer from anywhere inside.
- Prev/next compose Button; dots vs. counter via `indicator`.

### Requirements

1. **R1 — Track layout.** Slides render inside a new
   `.hz-carousel-track` (a flex row) within the `.hz-carousel-viewport`
   (`overflow: hidden`). Each slide is `flex: 0 0 100%` — one slide per view.
   The track's transform is `translateX(calc(-1 * <index> * 100% + <drag>))`,
   where `<drag>` is the live pointer offset (0 at rest). No slide carries
   `hidden` anymore.
2. **R2 — Off-screen slides are inert.** Every non-active slide carries `inert`
   (removed from the accessibility tree and the tab order, non-interactive);
   the active slide does not. This replaces the old `hidden` as the mechanism
   that keeps only the active slide's content exposed — so the `aria-live`
   region still announces the active slide on change, and focus can never land
   in a clipped slide. `data-active` remains on the active slide.
3. **R3 — Pointer drag.** When `draggable` (default `true`) and `count > 1`, a
   pointer press on the track begins gesture tracking. The drag is owned only
   once horizontal intent is clear (horizontal movement exceeds a small
   threshold and dominates vertical); until then the gesture may still become a
   vertical page scroll. While dragging, the track follows the pointer 1:1 and
   `data-dragging` is present (on the track).
   - Only the primary button drags (mouse `button === 0`).
   - `touch-action: pan-y` on the track yields vertical scrolling to the
     browser; horizontal axis detection covers mouse (which has no
     `touch-action`).
   - Pointer capture is taken once horizontal drag starts and released on
     end/cancel.
4. **R4 — Release resolves the drag.** On release the slide advances by one in
   the drag direction if the drag passed **half the viewport width** OR the
   release **flick velocity** exceeds the threshold; otherwise it snaps back.
   The resolve routes through `go()`, so it clamps/wraps and fires `onchange`
   exactly as button navigation does. `pointercancel` snaps back with no
   change.
5. **R5 — End behavior follows `loop`.** During a live drag the physical ends
   always resist (the offset is damped) rather than tracking 1:1 into blank
   space — the track holds a finite row. What happens on **release** at a
   boundary depends on `loop`:
   - `loop` off: the drag is bounded; a boundary drag snaps back, no change.
   - `loop` on: a boundary flick or past-half drag **wraps** (last → first,
     first → last), the same wrap buttons/dots/keys already perform. The wrap
     is not a seamless infinite scroll — the release routes through `go()`,
     which animates to the wrapped slide — but drag loops when the consumer
     asks for it.

   The release decision reads the **raw** pointer delta and velocity, not the
   damped visual offset, so a flick still registers at a resisting end.
6. **R6 — Click-through and click-suppression.** A press that never crosses the
   drag threshold is a click: it passes through to slide content (a link or
   button inside a slide works, a dot click works). A press that *did* drag
   suppresses the trailing `click` once, so releasing a drag over a link does
   not activate it.
7. **R7 — Reduced motion.** The snap/settle animation is a transform transition
   gated behind `@media (prefers-reduced-motion: no-preference)`; under
   `reduce` the track jumps to rest with no animation. Live finger-tracking is
   direct manipulation, not vestibular motion, and is unaffected. The
   transition is **structural** (the component's own `<style>`), because the
   sliding is how the carousel works, not theme chrome.
8. **R8 — Touch targets (44px, visuals unchanged).** Every interactive control
   has a hit area of at least the primary-touch standard, without changing its
   painted size:
   - Prev/next: a **44×44** hit area (the `sm` icon button is 32px painted; its
     target is expanded to 44).
   - Dots: the painted dot stays `--hz-carousel-dot-size` (8px default). Its hit
     area is a **44px-tall** band, and the dots' pitch is widened so hit areas
     **do not overlap** and each is at least 24px wide (WCAG 2.5.8 AA floor
     horizontally, 2.5.5 AAA vertically). Drag and prev/next are the primary
     touch paths and meet 44×44 outright.
9. **R9 — New theme hooks, documented.** `data-dragging` (state, on the track)
   and `.hz-carousel-track` (part) join Carousel's entry in `src/docs/hooks.ts`
   and therefore its page's Theme hooks table and the `/theming/components`
   roll-up. `src/docs/hooks.spec.ts` holds both against source (the attribute
   must be stamped; the class must exist).
10. **R10 — `draggable` prop.** `draggable?: boolean` (default `true`) turns
    pointer drag off without touching keyboard/button/dot navigation. Named for
    the behavior; consumed by the component (not forwarded to the root as the
    native `draggable` attribute).

### Accessibility

- `inert` (R2) is the load-bearing a11y mechanism: it removes clipped slides
  from the a11y tree and tab order in one attribute. Reviewer verifies a
  screen reader reads only the active slide and that Tab cannot enter an
  off-screen slide.
- The drag gesture is a pointer enhancement, not the only path: keyboard
  (arrows/Home/End), buttons, and dots all still fully operate the carousel, so
  drag adds no keyboard-inaccessible function.
- Dragging must not steal vertical scroll (R3) — a mostly-vertical gesture
  scrolls the page.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| `count <= 1` | No controls, no track drag (nothing to move). |
| `draggable={false}` | Track renders; pointer drag is inert; buttons/dots/keys work. |
| Vertical swipe on a slide | Page scrolls; carousel does not move (`touch-action: pan-y` + axis detection). |
| Drag released past half-width | Advances one slide via `go()`. |
| Fast flick under half-width | Advances one slide (velocity threshold). |
| Drag at slide 0 toward previous, `loop` off | Rubber-bands, snaps back; index unchanged. |
| Flick at the last slide, `loop` on | Wraps to the first slide (drag loops when opted in). |
| Click a link/button inside a slide without dragging | Activates normally (R6 click-through). |
| Release a drag over a link | Link does not activate (R6 suppression). |
| `prefers-reduced-motion: reduce` | Snap is instant; no transform transition. |

### Existing Code to Reuse

- `go()` / `index` / `onchange` / `loop` clamp+wrap logic — the drag resolve
  routes through `go()` rather than duplicating bounds math.
- Button composition for prev/next; `data-active` on dots and the active slide.
- The `--hz-carousel-dot-size` visual hook stays exactly as documented; only the
  hit area is added around it.
- The prefers-reduced-motion posture used elsewhere in the theme.

### Test Plan

**Unit (browser):** track transform reflects `index`; non-active slides carry
`inert` and not `hidden`; `data-active` on the active slide. Pointer sequence
(down → move past threshold → up) advances the slide and sets/clears
`data-dragging`; a short move snaps back with no change; a mostly-vertical move
does not drag; a drag over a control suppresses its click; `draggable={false}`
ignores pointer drag but keeps button/dot/key nav. Existing structure,
navigation, and indicator suites stay green (visibility assertions rewritten
from `hidden` to `inert`).

**Unit (server):** `hooks.spec.ts` — `data-dragging` and `.hz-carousel-track`
documented and present in source (no-fiction), Carousel entry still covered.

**e2e:** on `/components/carousel`, prev/next and dot hit boxes measure ≥44px
(tall) with the theme applied; a pointer drag advances the demo; no horizontal
overflow at 375px.

### Out of Scope

- Seamless infinite drag (cloning slides so the wrap has no backward sweep) —
  `loop` drag wraps, but via `go()`'s animation, not a seamless teleport.
- Multi-slide / peek layouts (partial neighbors at rest) — one slide per view.
- Auto-rotation / autoplay — the no-rotation + live-region posture is deliberate.
- Momentum scrolling past a single slide per flick — one flick advances one
  slide.
