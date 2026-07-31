# 58 — Carousel rail mode (multi-visible native scroller)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on `specs/33-carousel.md`
> (sliding track, drag, touch targets) and `specs/43-carousel-drag.md` (controls
> presentation, seamless wrap) and does not restate them.** Everything in 33 and 43
> continues to hold **unchanged for the default single-slide layout**; this spec
> adds a second layout that opts out of the transform track entirely.

### Goal

Give Carousel a **multi-visible rail** — a row of cards that scrolls horizontally,
roughly 3–7 visible depending on available width (a storefront row). The rail is a
**native `overflow-x` scroll container**: the browser owns scrolling, momentum,
touch, wheel, keyboard scroll keys, and (with `snap`) snapping. The component adds
only what the platform does not give for free: mouse drag-to-scroll, the prev/next
paging buttons, an index derived from scroll position, and the `loop` clone/teleport
buffer.

The single-slide layout is the default and is **fully backward compatible**: with
`layout` unset, the rendered DOM, CSS, and behavior are byte-for-byte specs 33/43.

### Context & Conventions

- Decisions locked with the user (2026-07-31): a new layout mode on the existing
  Carousel (not a new component); native scroll container as the mechanism; a
  snapping toggle; `loop` must work in rail mode too.
- **Native first.** Anything the browser already does in a scroll container — touch
  panning, fling momentum, rubber-band, wheel, Arrow/Home/End/PageUp/PageDown key
  scrolling, scroll-into-view on focus, snapping — is *not* reimplemented. Every
  requirement below that adds JS exists because the platform has no equivalent.
- **Layouts are mutually exclusive mechanisms.** Single = transform track, one slide
  per view, one active slide, non-active slides `inert`. Rail = scroll container,
  many visible slides, no active slide, nothing `inert`. A requirement in 33/43 that
  is about the transform track (33 R1, R2, R3–R6 drag physics, R7 settle transition;
  43 R6/R7 seamless clones) applies to **single only** unless named below.
- **Post-palette-split theme doctrine (specs/42)** applies to any color the theme
  resolves here.
- **Lightbox is untouched.** `LightboxOverlay` renders `<Carousel loop …>` without
  `layout`, so it keeps single mode exactly (`Lightbox-R14`, specs/25). Its fixed
  gallery-stage CSS depends on `flex: 0 0 100%` slides, which rail never applies.

### Props (new)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| **`layout`** | **`'single' \| 'rail'`** | **`'single'`** | **NEW.** `'rail'` swaps the transform track for a native horizontal scroller with multiple slides visible. |
| **`snap`** | **`boolean`** | **`true`** | **NEW.** Rail only. `true` = CSS scroll-snap to item starts; `false` = free continuous momentum scrolling. Ignored in single mode (R10). |

Every other prop keeps its 33/43 type and default; R10 states what each one means in
rail mode. Two rail sizing hooks (`--hz-carousel-item-width`, `--hz-carousel-gap`)
are custom properties, not props — R2.

---

### Requirements

**R1 — `layout` prop + root hook.** `layout?: 'single' | 'rail'` (default
`'single'`). The component stamps `data-layout={layout}` on the `.hz-carousel` root
always, for both values, so the Reviewer and themes can target either. With
`layout="single"` the component's rendered DOM and inline styles are **identical to
specs 33/43** — no rail attribute, no scroll container, no tabindex, no clones
(rail's clones are R7's, distinct from 43 R6's wrap clones). A second root hook,
`data-loop` (amended 2026-07-31, user decision), reflects whether the rail's loop
is effectively active — see R12.

**R2 — Rail structure and sizing.** With `layout="rail"`:

- `.hz-carousel-viewport` becomes the scroll container: `overflow-x: auto;
  overflow-y: hidden; overscroll-behavior-x: contain;`. `overflow-y: hidden` is
  required because a single non-`visible` axis forces the other to `auto`, which
  would otherwise grow a stray vertical scrollbar; the viewport carries
  `padding-block: var(--hz-carousel-rail-inset, 0.25rem)` so an item's focus ring
  or shadow is not clipped by that vertical clip.
- `.hz-carousel-track` stays the flex row but carries **no inline transform** and no
  `touch-action` override in rail — the browser owns the gesture. It gains
  `gap: var(--hz-carousel-gap, var(--hz-space-sm, 1rem))`. The gap applies in rail
  **only**; adding it in single mode would break 33's `100%`-per-slide transform math.
- `.hz-carousel-slide` in rail is
  `flex: 0 0 var(--hz-carousel-item-width, clamp(9rem, 20%, 18rem)); min-width: 0;`.
  One knob controls visible count, and the count falls out of container width: the
  percentage resolves against the viewport, so ~5 items at 1024px and ~6–7 at
  1920px, while the `9rem` floor keeps a phone at ~2.5 items with a peeking edge as
  the "there is more" affordance. A consumer who wants an exact count sets the
  property, e.g. `--hz-carousel-item-width: calc((100% - 2 * 1rem) / 3)`.
- Slides in rail are **never `inert`** and **never carry `data-active`** — every item
  is on screen or one scroll away, and there is no single active slide. Each slide
  keeps its `role="group"`, `aria-roledescription="slide"`, and `{n} of {total}` name
  (or `slideLabel`), unchanged from 33.

Rationale for structural placement: sizing, gap, and overflow are *how the rail
works*, not chrome — they live in the component's `<style>` with custom-property
hooks, matching 33's posture on the track and settle transition.

**R3 — `snap` prop.** `snap?: boolean` (default `true`), rail only. When
`layout === 'rail' && snap`, the component stamps `data-snap` (present) on the root
and the structural CSS applies `scroll-snap-type: x mandatory` to the viewport;
slides always carry `scroll-snap-align: start` in rail (inert when snap-type is
`none`). With `snap={false}` the attribute is absent and scrolling is free
continuous momentum — the browser's own fling, no JS. `data-snap` is never stamped
in single mode.

**R4 — Scroll-derived `index`, and the one-way sync.** In rail mode `index` means
**the item nearest the scroll origin** — i.e. the leading (start-edge) item, chosen
as the real slide minimising `|slideStart − scrollPosition|`. Nearest, not
"first fully visible", so the value matches what snapping lands on and never
flickers at a fractional offset.

- The scroll listener is **rAF-throttled** (one recompute per animation frame, not
  per scroll event) and is the **sole writer** of `index` while the user scrolls. On
  a computed change it assigns `index` and fires `onchange(index)` **once per
  crossing** (not per frame). Under `loop` the clone-space position is mapped back
  into the real-index space before comparison (R7).
- Programmatic navigation (buttons, a consumer's `bind:index` write, the initial
  index on mount) **scrolls the container** and lets the scroll listener settle the
  value; it must not also write `index` directly, and a scroll-derived update must
  **not** feed back into a programmatic scroll. Reviewer treats a duplicate
  `onchange` for one movement, or a scroll/index feedback loop, as a fail.
- Programmatic scroll-to-index uses the platform: `slideEl.scrollIntoView({ inline:
  'start', block: 'nearest', behavior })`. No manual `scrollLeft` arithmetic, no
  offset bookkeeping, and vertical page position is left alone.
- **Amended 2026-07-31 (mount-only exception).** The one-time initial-position write
  (the bullet below, and the same write repeated after loop's clone buffer mounts,
  R7) uses `viewportEl.scrollTo({ left: slideEl.offsetLeft, behavior: 'auto' })`
  instead — element-scoped, so it can never move an ancestor. `scrollIntoView`'s own
  "vertical position is left alone" guarantee only holds once the element is already
  vertically visible; a rail that first paints partly off-screen (or, unavoidably for
  loop, always needs the real block's start rather than whatever is already in view)
  would otherwise have its `block: 'nearest'` default pull the ancestor scrollport
  down to fully reveal it. Every *other* programmatic scroll — the buttons, a
  `bind:index` write — still uses `scrollIntoView` as specified above; only this
  one-time mount write is the exception.
- On mount with a non-zero `index`, the rail scrolls to it **instantly** (`behavior:
  'auto'`), never smoothly — a smooth animation on first paint is not navigation.
- `go()` keeps its 33 contract (clamp/wrap + single `onchange`) and stays the funnel
  for single mode; rail's scroll-derived updates route through the same
  index-assignment + `onchange` path so the "fires only on a real change" guarantee
  is one implementation, not two.

**R5 — Controls in rail: page-based buttons, no indicator.**

- **Prev/next page by one viewport width**: `scrollBy({ left: ±viewport.clientWidth,
  behavior })`. This is the storefront convention and needs no item measurement;
  with `snap` on, the browser resolves the landing position to an item boundary for
  free. Both buttons keep their 33 markup, `Button variant="ghost"` composition,
  labels, and 44px touch targets.
- **Disabled state comes from scroll metrics, not from `index`**: with `loop` off,
  prev is disabled at the scroll start and next at the scroll end (a 1px tolerance
  absorbs sub-pixel layout), and both are disabled when the content does not
  overflow. With `loop` on, neither disables (there is always somewhere to go).
  Before the first measurement (SSR and the pre-hydration frame), prev is disabled
  and next is enabled when `count > 1`; the first post-mount measurement corrects it.
- **No indicator in rail.** `.hz-carousel-dots` and `.hz-carousel-status` are not
  rendered; the control row is prev/next only. A multi-visible free scroller has no
  single position to indicate — per-item dots would misreport with 6 items on
  screen, and page dots would need item measurement that free scrolling invalidates.
  The counter is decorative (`aria-hidden`) in 33, so removing it costs no
  information; the buttons remain the complete non-dragging alternative (R9).
- The control row still renders only when `count > 1` (33, unchanged).

**R6 — Mouse drag-to-scroll.** With `draggable` (default `true`) in rail mode, a
**mouse** pointer press on the rail scroller drags the scroll position. Touch and pen
are **excluded** — the browser already pans and flings them natively, and capturing
them would replace good native behavior with worse JS. The gesture reuses spec
33/43's conventions verbatim rather than inventing new ones:

- Primary button only (`button === 0`), 8px `DRAG_THRESHOLD`, horizontal-dominant
  axis lock, pointer capture taken on commit and released on end/cancel,
  `user-select: none` and the grab/grabbing cursor while dragging, and 33 R6's
  one-shot capture-phase click suppression after a real drag (a press that never
  crossed the threshold still clicks through to a link inside a card).
- **Amended 2026-07-31 (rail listener surface).** The pointer handlers (and the
  cursor/`user-select` styling) live on `.hz-carousel-viewport` in rail mode, not
  `.hz-carousel-track` — a leading/trailing loop clone (R7) is `inert`, so it is not
  hit-testable, and a press over one resolves to the nearest hit-testable ancestor,
  the viewport, not the track; listening on the track alone would silently drop
  drags that start over a clone card. Single mode is unaffected — its handlers stay
  on the track exactly as specs 33/43 describe. `data-dragging` still stamps on
  `.hz-carousel-track` in both layouts, unchanged, so the `:has()` snap-suppression
  selector below and every existing hook keep working without a second copy.
- Each move sets the scroll position by the raw pointer delta (1:1, no rubber-band —
  the container's own overscroll handles the ends).
- `data-dragging` stays on `.hz-carousel-track`, the same element and hook as 33.
  While it is present, the structural CSS **suppresses snapping** on the viewport
  (`.hz-carousel-viewport:has(.hz-carousel-track[data-dragging]) { scroll-snap-type:
  none }`) so mandatory snap does not fight each scroll assignment; clearing it on
  release re-enables snap and the browser settles to the nearest snap point. Using
  `:has()` keeps one hook on one element instead of stamping a second copy.
- No JS momentum/inertia on mouse release — see Non-goals.
- `draggable={false}` in rail disables **only** this mouse gesture. Native touch
  panning, wheel, scrollbar dragging, and keyboard scrolling are the browser's and
  are never disabled.

**R7 — `loop` in rail: clone buffers + scroll teleport.** With `layout="rail" loop`:

- **Clones.** One full copy of `items` is rendered **before** the real slides and one
  **after** (3× the item DOM). A full copy, rather than a measured subset, is chosen
  because item widths are consumer-tunable (R2) and any "enough to cover a viewport"
  calculation is a measurement cache to invalidate; a full copy is unconditionally
  sufficient whenever the real block itself overflows, which R7's guard already
  requires. Clone slides carry `data-clone` (present), `inert`, and
  `aria-hidden="true"` — the same hook and invariants as 43 R6 — and are never
  counted in `count`, in `{n} of {total}`, in the buttons' bounds, or in the
  scroll-derived `index`, and never take focus.
- **By design (user decision, 2026-07-31): clones stay non-interactive while visible
  at the seam.** A card that has wrapped around into a clone copy — visible right at
  either edge before the teleport lands the user on the real element underneath —
  is `inert`, so nothing inside it (links, buttons) is reachable or clickable yet.
  This is intentional, not a gap to fix: the clone is a positioning device, not a
  second copy of the interactive content: it exists to be scrolled *through*, and it
  hands off to the corresponding real, focusable, non-`aria-hidden` slide the moment
  the scroll settles onto it (immediately, since the teleport itself is instantaneous
  — R7's "Teleport" bullet below). A future audit should not flag this as a defect.
- **Client-only.** Clones mount **after hydration** only (a `mounted` flag set in an
  effect). The server frame and the pre-hydration frame render the plain rail
  starting at the first real item; mounting clones before the scroll offset could be
  applied would paint the tail of the list first.
- **Degenerate guard.** If the real block does not overflow the viewport (fewer items
  than fit), `loop` is **inert** in rail: no clones, no teleport, plain bounded
  scrolling. There is nothing to wrap around.
- **Initial position.** After clones mount, the scroll position is set instantly to
  the start of the real block (the first real item's start), so the user begins in
  the middle copy with a full copy of slack in each direction.
- **Teleport.** The period is `realFirstSlide.offsetLeft − leadingCloneOfItem0.offsetLeft`
  — measured live from the DOM in the same rAF frame as the index recompute (R4), so
  it needs no cache, no `ResizeObserver`, and no invalidation on resize or font load.
  In that frame: if the scroll position has fallen below the real block's start, add
  one period; if it has reached or passed the real block's end, subtract one period.
  The assignment is instant and unanimated. Because the shift is exactly one period
  and the three copies are identical, the painted pixels before and after the
  teleport are the same — nothing moves on screen. A teleport that fires mid-drag
  must shift the gesture's captured scroll origin by the same ±period, so the next
  pointermove's absolute-base assignment stays in the post-teleport coordinate
  space instead of reverting it (amended 2026-07-31).
- **Snap composes for free.** Since the shift is exactly one period, every
  post-teleport position is the same snap position one copy over; a browser
  re-evaluating snap after the assignment resolves to a no-op. No snap suppression
  is needed around a teleport.
- **Reduced motion.** A teleport is instantaneous by construction, so `reduce`
  changes nothing about it (R8 governs the *animated* scrolls only).
- **Invariants (Reviewer):** a teleport never changes `index`, never fires
  `onchange`, never moves focus, and never announces. `index` is always a real-item
  index in `[0, count)`.
- **Known ceiling:** assigning the scroll position mid-fling can interrupt iOS
  momentum at the teleport point. Accepted; the alternative (predicting the fling)
  is more machinery than the artifact is worth.

**R8 — Reduced motion.** Every *programmatic* rail scroll — prev/next paging, a
`bind:index` write, dot-free navigation from a consumer — passes `behavior: 'smooth'`
normally and `behavior: 'auto'` (instant) under `prefers-reduced-motion: reduce`,
read at call time via `matchMedia` (the guarded helper already in `Carousel.svelte`
for 43 R6, reused, not duplicated). The rail must **not** set CSS `scroll-behavior:
smooth`, because that would also animate focus scroll-into-view and browser scroll
restoration, which the user did not ask for. User-driven scrolling (touch, wheel,
drag, keys) is direct manipulation, not vestibular motion, and is untouched — as is
33 R7's stance on live finger-tracking.

**R9 — Rail accessibility model (WCAG 2.1 AA).**

- **Focusable scroller.** In rail mode `.hz-carousel-viewport` carries
  `tabindex="0"`. A scrollable region must be operable by keyboard (2.1.1); with a
  tab stop on the scroller, the browser's own Arrow/Home/End/PageUp/PageDown/Space
  scrolling operates the rail with zero JS. No `role` or `aria-label` is added to
  the scroller: it sits inside the root `role="group"` /
  `aria-roledescription="carousel"` with its required `ariaLabel`, which announces
  on entry, and a second copy of the same name on a nested element is noise.
- **No keydown interception in rail.** The root's Arrow/Home/End handler (33) is
  **not** attached in rail mode. Arrow keys scroll the rail natively; Home/End go to
  the ends of the scroller. Intercepting them would replace native behavior with a
  worse copy and break the scroller's keyboard operability.
- **Everything is exposed.** No slide is `inert`, so all item content is in the
  accessibility tree and in the tab order in DOM order = visual order. Tabbing to a
  partly-off-screen item scrolls it into view natively. Clones are `inert` +
  `aria-hidden` so they add no duplicate tab stops or duplicate readings (R7).
- **No live region in rail.** The viewport does **not** carry `aria-live` in rail
  mode. There is no slide swap to announce (nothing appears or disappears), the
  position is continuous rather than discrete, and — decisively — mounting the R7
  clones inside a live region would announce every cloned card's content on
  hydration. Single mode keeps `aria-live="polite"` exactly as 33/43 specify.
- **2.5.7 Dragging Movements (AA).** The mouse drag (R6) is never the only path:
  the prev/next buttons (single-pointer click, R5), the native scrollbar, the
  keyboard, and touch panning all move the rail. The buttons are mandatory in rail
  and, under `controls="focus"`, keep 43 R2's hidden-but-operable guarantee
  unchanged.
- **`ariaLabel` stays required** and unchanged.

**R10 — Prop interaction matrix + dev warnings.** Each existing prop, in rail mode:

| Prop | In rail |
| --- | --- |
| `items`, `ariaLabel`, `slide`, `class` | Apply unchanged. |
| `index` (bindable) | Applies, with R4's nearest-item semantics; writing it scrolls the rail. |
| `onchange` | Applies, fires on each scroll-derived index crossing (R4). |
| `loop` | Applies, via R7's clone/teleport mechanism. Inert when content does not overflow. |
| `draggable` | Applies to the **mouse** drag only (R6); touch/wheel/keys are native regardless. |
| `snap` | Applies (R3). |
| `controls` | Applies unchanged — `'focus'` reveals the prev/next row on hover/focus exactly as 43 R1–R4. |
| `prevLabel` / `nextLabel` | Apply unchanged. |
| `slideLabel` | Applies — every slide keeps its `{n} of {total}` name. |
| `indicator` | **Ignored** (R5, no indicator in rail). Dev-warns when set to `'dots'`. |
| `dotLabel` | **Ignored** (no dots). No warn — indistinguishable from its default at runtime. |
| `seamless` | **Ignored.** Rail's `loop` is inherently continuous, so there is nothing to opt into. `data-seamless` is **never** stamped in rail (43 R6's rule that the hook reflects effective behavior). Dev-warns when set. |

Dev-only warnings follow the library convention (`import { DEV } from 'esm-env'`, a
single `untrack()`ed block evaluated once at creation, the `Loading.svelte`
precedent), prefixed `[hyzer-ui] <Carousel>:`. Exactly three conditions warn:
`layout="rail"` with `indicator="dots"`; `layout="rail"` with `seamless`; and
`snap={false}` outside rail mode. Each names the prop and says it has no effect in
the chosen layout. These are inert-prop warnings, not a11y bypasses, so they are
informational — no behavior changes.

**R11 — SSR safety.** No `window`, `document`, or `matchMedia` access at module
scope or during component initialization; every measurement, scroll assignment,
`matchMedia` read, and the R7 clone mount happens in an effect or an event handler.
Server-rendered rail markup is the plain scroller with the real items only: it lays
out and scrolls correctly with CSS alone before hydration (native overflow needs no
JS), with prev/next in their R5 pre-measurement state. The existing guarded
`prefersReducedMotion()` helper is reused rather than re-guarded.

**R12 — Theme hooks, documented.** Structural CSS (component `<style>`) owns:
overflow/`overscroll-behavior`/`padding-block` on the rail viewport, the track gap,
slide flex-basis and `scroll-snap-align`, `scroll-snap-type` and its `data-dragging`
suppression, and the `data-layout` / `data-snap` / `data-loop` stamps. Theme
(`carousel.css`, `@layer hz-theme`) owns exactly one thing: the rail's **scrollbar
presentation** — `scrollbar-width: thin` plus `scrollbar-color` resolved through
`--hz-color-*`, scoped to `[data-layout='rail']`. The scrollbar stays visible (slim,
themed) for a non-looping rail: it is a free affordance that more content exists and
a free mouse-drag path. No edge fade/mask (Non-goals).

**Amended 2026-07-31 (user decision) — the scrollbar hides on an effectively
looping rail.** `[data-layout='rail'][data-loop]` sets `scrollbar-width: none`,
overriding the rule above. `data-loop` (R1) is present only once the rail's loop is
*effectively* active — content overflows and R7's clone buffer has mounted — same
doctrine as `data-seamless`: the hook never advertises a loop that's inert (no
overflow) or not yet measured. Rationale: a scrollbar's thumb position and size
describe a fixed range, which a looping rail does not have — the thumb would start
partway in on mount and jump a full copy-width at every teleport, both misleading.
Buttons, keyboard, touch, and wheel scrolling are all unaffected; 2.5.7 continues to
hold on the buttons alone (R9). A non-overflowing rail with `loop` set never gets
`data-loop` (R7's degenerate guard), so it keeps the visible scrollbar like any
other non-looping rail.

New entries in Carousel's `src/docs/hooks.ts` record, held against source by
`src/docs/hooks.spec.ts`: attrs `data-layout`, `data-snap`, and `data-loop`; props
`--hz-carousel-item-width`, `--hz-carousel-gap`, `--hz-carousel-rail-inset`. Amend
the existing `data-active` note (single mode only — rail has no active slide), the
`data-clone` note (rail's loop buffer is a second, persistent producer of it), and
`.hz-carousel-viewport` (the scroll container and a tab stop in rail; the live
region in single mode only).

---

### Edge cases

| Case | Expected |
| --- | --- |
| `layout` unset | Byte-for-byte specs 33/43. No `data-snap`, no tabindex, no gap, no rail clones. |
| `count <= 1` in rail | Track renders, no control row (33). Nothing to scroll; no clones under `loop`. |
| Rail content narrower than the viewport | No overflow; both buttons disabled; `loop` inert (R7 guard); native no-op scrolling. |
| `loop` set but content does not overflow (or before clones mount) | `data-loop` absent — loop is not yet, or never, effective; scrollbar stays visible (amended 2026-07-31). |
| `snap={false}` | Free momentum scroll; `data-snap` absent; `index` still tracks the nearest item (R4). |
| Free scroll (`snap={false}`) across several items | `onchange` fires once per index crossing, not per frame. |
| Touch swipe in rail | Native pan + fling. The JS drag never engages (R6, mouse only). |
| Mouse drag in rail with `snap` | Snap suppressed while `data-dragging`; on release the browser settles to the nearest item. |
| Mouse drag released over a card link | Link does not activate (33 R6 suppression, reused). |
| Click a card link without dragging | Activates normally. |
| Overscroll at either end, `loop` off | Native rubber-band/overscroll; `overscroll-behavior-x: contain` keeps it from triggering browser back-navigation. |
| `loop` on, scroll past the last item | Continues into the trailing clone; teleport is invisible; `index` wraps to 0 with one `onchange`. |
| `loop` on, teleport mid-fling | Position shifts by exactly one period; painted pixels identical. iOS momentum may stutter (accepted ceiling, R7). |
| `loop` on, before hydration | No clones; plain bounded rail from item 0 (R7/R11). |
| Tab into the rail | The viewport itself is a tab stop; arrows/Home/End scroll it natively (R9). |
| Tab to a card partly off screen | Browser scrolls it into view; with snap, it lands on a snap position. |
| Screen reader in rail | All items exposed and named `{n} of {total}`; clones silent; no live-region chatter. |
| `controls="focus"` + rail | Row hidden until hover/focus, fully operable throughout (43 R2/R3), prev/next only. |
| `indicator="dots"` + rail | No dots render; one dev warning; no other behavior change. |
| `seamless` + rail | Ignored; `data-seamless` absent; one dev warning. |
| `prefers-reduced-motion: reduce` | Button paging and index writes jump instantly; user scrolling unchanged; teleport unchanged. |
| Viewport resized while idle, `loop` on | Period is re-measured on the next scroll frame; the first teleport after the resize corrects the position. |
| Lightbox | Never passes `layout`; single mode, unchanged in every respect. |

### Existing code to reuse

- **`Carousel.svelte`'s drag scaffolding** (33 R3–R6): the pointer down/move/up/cancel
  handlers, `DRAG_THRESHOLD`, axis lock, pointer capture, `dragged` flag, the
  capture-phase click suppression, `ondragstart` prevention, and the `data-dragging`
  stamp. Rail branches the *effect* of a move (scroll position vs. transform) inside
  the existing handlers; it does not add a second gesture implementation.
- **`prefersReducedMotion()`** (already SSR-guarded in the component) for R8.
- **The clone conventions from 43 R6** — `data-clone` + `inert` + `aria-hidden`,
  excluded from `count`/labels — reused verbatim for the loop buffer.
- **The index/`onchange` "only on a real change" guarantee** — one assignment path,
  shared with `go()`, not a parallel one.
- **`Button` composition, 44px touch targets, `controls` presentation** (33 R8, 43
  R1–R4) unchanged in rail.
- **The dev-warning idiom** in `src/lib/components/Loading.svelte` (`DEV` from
  `esm-env`, one `untrack()` block, `[hyzer-ui] <Component>:` prefix).
- **Docs scaffolds** — `DocPage`, `Example`, `Tabs`, `tab-note`, `demoTabs` on the
  Carousel page; `carouselDoc` in `src/docs/data/carousel.ts`.

### Test plan

Runner: **Vitest** — browser project (chromium, Playwright provider,
`vitest-browser-svelte`) in `src/lib/components/Carousel.svelte.spec.ts`, following
its existing conventions (`createRawSnippet` slide face, the `parts()` helper, the
`pointer()` dispatcher). The browser project has real layout and real scrolling, so
scroll metrics are assertable there — but only with **explicit widths set on the
viewport and an explicit `--hz-carousel-item-width`**, exactly as the existing drag
suite pins `vp.style.width` for determinism. Smooth scrolls are asynchronous: poll
for the expected scroll position (`vi.waitFor`) rather than sleeping a fixed time.

**Unit (browser) — must cover:**
- **Mode gating:** `data-layout` reflects the prop for both values; in rail the
  viewport computes `overflow-x: auto`, has `tabindex="0"`, and has **no**
  `aria-live`; the track has no inline transform; no slide is `inert` and none has
  `data-active`; slides keep `role`/`aria-roledescription`/`{n} of {total}`. In
  single mode none of the rail attributes appear and the existing 33/43 suites stay
  green unmodified (the backward-compatibility proof).
- **Sizing:** a slide's resolved flex-basis follows `--hz-carousel-item-width` when
  the property is set on the root.
- **`snap`:** `data-snap` present by default in rail, absent with `snap={false}` and
  absent in single mode; computed `scroll-snap-type` matches; the computed value
  becomes `none` while `data-dragging` is on the track.
- **Buttons:** next increases the scroll position by about one viewport width; prev
  decreases it; with `loop` off prev is disabled at the start and next at the end;
  with `loop` on neither disables; both are disabled when content does not overflow.
- **Index semantics:** setting the scroll position to an item's start updates `index`
  and fires `onchange` once; a further scroll within the same item fires nothing; a
  `bind:index` write scrolls the rail toward that item.
- **Indicator:** rail renders no `.hz-carousel-dots` and no `.hz-carousel-status`
  even with `indicator="dots"`, and a dev warning is emitted (spy on `console.warn`);
  `seamless` in rail emits a warning and stamps no `data-seamless`.
- **Mouse drag:** a mouse-type pointer sequence past the threshold changes the scroll
  position, sets and clears `data-dragging`, and suppresses the trailing click; a
  short press does not; a **touch**-type sequence engages no JS drag (no
  `data-dragging`, scroll position untouched by the component); `draggable={false}`
  suppresses the mouse drag while leaving buttons working.
- **Loop bookkeeping:** with `loop` and an overflowing rail, after mount exactly
  `2 × count` `[data-clone]` slides exist, each `inert` + `aria-hidden="true"`, and
  `.hz-carousel-slide:not([data-clone])` still counts `count`; the initial scroll
  position is the first real item's start; scrolling below that start teleports
  forward by one period on the next frame while preserving the sub-period offset,
  with `index` in `[0, count)`, `onchange` not fired by the teleport itself, and
  `document.activeElement` unchanged. With `loop` and a non-overflowing rail, no
  clones render. `data-loop` (amended 2026-07-31) is present on the root once
  clones mount for an overflowing loop rail, and absent for a non-loop rail, a
  non-overflowing loop rail, and single mode.

**Not unit-testable — carries to e2e or manual:** real fling momentum and its
timing, the browser's snap-resolution feel, iOS momentum behavior at a teleport,
scrollbar presentation, and the absence of a visible jump at the teleport (a
rendered-frame property).

**Unit (server):** `hooks.spec.ts` — `data-layout`, `data-snap`, `data-loop`,
`--hz-carousel-item-width`, `--hz-carousel-gap`, `--hz-carousel-rail-inset`
documented and present in source; Carousel entry still covered.

**e2e (`/docs/components/carousel`, rail tab):** at 1280px at least 3 items are
visible in the rail; a next click scrolls it; Tab reaches the rail and ArrowRight
scrolls it; the page has no horizontal overflow at 375px and the rail itself does
not force the page wider; the rail grows no vertical scrollbar.

### Docs

One new **Rail** tab on the existing Carousel page
(`src/routes/docs/components/carousel/+page.svelte`), with `carouselDoc`
(`src/docs/data/carousel.ts`) gaining `layout` and `snap` prop rows and an a11y-note
sentence on the rail's keyboard/scroll model. Consumer-facing framing only — no spec
numbers, no R-numbers, no test-gate or process language. It must show:

1. A basic rail of cards: `<Carousel layout="rail" …>`.
2. How to control how many are visible — the `--hz-carousel-item-width` property,
   with both a plain value and the "exactly three" `calc()` form, plus
   `--hz-carousel-gap`.
3. Snapping on (default) versus `snap={false}` free scrolling, and what each feels
   like.
4. `loop` in a rail — the row wraps continuously in either direction.
5. A short note that the rail is a real scroll container: touch, trackpad, wheel, the
   scrollbar, and the arrow keys all scroll it; the prev/next buttons page it by one
   screenful; a mouse can drag it; and there is no dots/counter indicator in this
   layout because several items are visible at once.

### Non-goals

- **Autoplay / auto-rotation** — unchanged from 33, and the reason the single-mode
  viewport can be a live region at all.
- **A vertical rail** — one axis. A vertical variant is a different sizing and
  keyboard model, not a flag.
- **Virtualization / windowing** — the rail renders every item (and, under `loop`,
  three copies). A rail is a row of a few dozen cards; `Virtualizer` (specs/23) is
  the answer for large lists.
- **Custom momentum/inertia for the mouse drag** — release ends the drag; snapping
  (or nothing) resolves it. Simulated fling physics is the browser's job on touch
  and unnecessary on a device with a scrollbar and a wheel.
- **Peek/partial-slide layouts in *single* mode** — still out of scope (33); rail's
  peeking edge is a consequence of item sizing, not a new single-mode option.
- **Edge fade / gradient masks on the rail** — a mask clips focus rings and adds a
  contrast surface to defend; the slim themed scrollbar plus the peeking item is the
  affordance. Revisit only on a user request.
- **`seamless` semantics in rail, or dots/counter in rail** — resolved as ignored
  (R5/R10), not deferred.
- **RTL loop teleport** — the rail itself lays out and scrolls under RTL (flexbox
  and native scrolling handle it), but the R7 teleport arithmetic is specified and
  verified against LTR scroll coordinates only. Documented ceiling.
- **Re-tuning the drag constants** — 33's threshold and axis-lock values are reused
  verbatim (R6).

### Write scope

`src/lib/components/Carousel.svelte` and `src/lib/components/Carousel.svelte.spec.ts`,
`src/lib/theme/components/carousel.css` (scrollbar rule only), `src/docs/hooks.ts` +
`src/docs/hooks.spec.ts`, `src/docs/data/carousel.ts`,
`src/routes/docs/components/carousel/+page.svelte`, and the Carousel docs e2e spec.
No new files, no new dependencies, no `manifest.ts` change.
