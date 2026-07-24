# Slider Vertical Orientation Spec (Slider + RangeSlider)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Vert-Rn`) and edge case as pass/fail. Write scope:
> `src/lib/components/{Slider,RangeSlider}.svelte` + `specs/17-slider.md`
> (dated amendment), `src/lib/theme/components/field.css`, `src/docs/hooks.ts`
> + `src/docs/hooks.spec.ts`, `src/docs/data/{slider,range-slider}.ts`, the two
> docs pages, and docs e2e. **This spec builds on `specs/17-slider.md` and does
> not restate it.** Everything in 17 (Slider-R*, Ticks-R*, Fill-R*, Range-R*)
> still holds unless a requirement below explicitly amends it.

### Goal

Add an opt-in **vertical orientation** to the slider family — `Slider` and
`RangeSlider` — driven by the native `writing-mode` mechanism, keeping every
existing affordance intact: the synced exact-entry number field(s), the
`showInput={false}` readout, `SliderTick[]` ticks with labels, the
`--hz-slider-fill*` filled tracks, `--hz-slider-chars` field sizing, and (for
RangeSlider) the two-overlapped-ranges meet-never-cross + `data-top` mechanics.
A new `inputPosition` prop places the number field/readout at the logical start
or end of the control on **both** axes.

### Context: the reversal

- `specs/17` recorded vertical orientation as **permanently out of scope**
  ("product decision 2026-07-13"). The user **reversed that on 2026-07-23**:
  "slider needs a vertical option (potentially range slider also?), where the
  input can be top or bottom of the actual slider. should still support ticks
  and labels." This spec is that reversal. `specs/17` receives a dated
  amendment (Vert-R10) pointing here — the same precedent as `specs/33`→`43`.
- **Orientation ships on BOTH `Slider` and `RangeSlider` in this spec**
  (user-confirmed 2026-07-23). The RangeSlider cost is low — its dual-thumb
  logic is orientation-agnostic and reused untouched (Vert-R7).
- **Native mechanism (locked):** vertical is achieved with
  `writing-mode: vertical-lr` + `direction: rtl` on the range input(s). `rtl`
  makes the value grow **bottom-up** (min at the bottom, max at the top) —
  matching the physical-up-is-more convention. This is the modern standard,
  Baseline since 2024 (Chrome/Edge ≥ 108, Firefox, Safari ≥ 17.4). The
  non-standard `appearance: slider-vertical` and the Firefox `orient="vertical"`
  attribute are **not** used (they conflict with the theme's `appearance: none`
  custom-painted track and are deprecated).
- **Browser-support floor (user-confirmed 2026-07-23):** the Baseline-2024
  floor is accepted with **no legacy fallbacks**. Pre-2024 engines (Safari
  < 17.4, old Chrome) degrade to a *horizontal* native range when
  `orientation="vertical"` — it degrades, it does not break. Acceptable in a
  greenfield package with no consumers (MEMORY: greenfield-no-consumers).
- **aria-orientation:** a native range's implicit `aria-orientation` is
  `horizontal`, and writing-mode does **not** reliably flip it in the
  accessibility tree across engines/AT. The component therefore **stamps**
  `aria-orientation="vertical"` explicitly (Vert-R5) — unlike `aria-required`
  (which the slider role doesn't support), `aria-orientation` **is** in the
  slider role's supported set, so stamping is correct, not a hack.

### New / changed props (both components)

| Prop            | Type                          | Default        | Notes |
| --------------- | ----------------------------- | -------------- | ----- |
| `orientation`   | `'horizontal' \| 'vertical'`  | `'horizontal'` | Vert-R1. Applies to Slider and RangeSlider identically. |
| `inputPosition` | `'start' \| 'end'`            | `'end'`        | Vert-R3. Logical: horizontal → inline start/end (left/right in LTR); vertical → block start/end (top/bottom). Default `'end'` (user-confirmed 2026-07-23) preserves today's trailing-input horizontal layout and puts the vertical number field/readout below the track. |

No other prop signatures change. `...rest` still spreads onto the range (Slider)
/ fieldset (RangeSlider) per Slider-R6 / Range-R6.

### Requirements

1. **Vert-R1 — Orientation prop & attribute.** Both components accept
   `orientation` (default `'horizontal'`). The `.hz-slider-row` carries
   `data-orientation={orientation}` (always present, both values) so the theme
   and structural CSS switch geometry off one attribute. No behavior changes
   when `orientation === 'horizontal'` — every existing Slider-R*/Range-R* test
   must still pass unchanged.

2. **Vert-R2 — Native vertical mechanism (structural).** When
   `data-orientation="vertical"`, the component's **scoped structural** CSS:
   - sets the range input(s) `writing-mode: vertical-lr; direction: rtl`
     (bottom-up value growth);
   - switches `.hz-slider-row` to `flex-direction: column`;
   - gives the track a block length from a new hook
     `block-size: var(--hz-slider-length, 12rem)` and collapses its inline size
     to the thumb thickness (so headless-vertical has a real, non-zero height —
     the vertical analogue of horizontal's structural `flex: 1`).
   Horizontal keeps its current structural rules (`flex-direction: row`,
   track `flex: 1`, range `width: 100%`).

3. **Vert-R3 — Input position (logical, both axes).** `inputPosition`
   (`'start' | 'end'`, default `'end'`) sets `data-input-position` on the row;
   structural CSS reorders the track vs the number field/readout so the input
   sits at the logical start or end of the flex line. Horizontal: `'end'` =
   trailing (today's layout), `'start'` = leading. Vertical: `'end'` = below the
   track (bottom), `'start'` = above (top). The unit suffix and (RangeSlider)
   the separator stay adjacent to the number field/readout in all four
   combinations. For RangeSlider in vertical, the min/max exact-entry pair stays
   a single **inline cluster** (`min – max`) placed above/below the track per
   `inputPosition` — it is **not** stacked to mirror the thumbs (user-confirmed
   2026-07-23). `--hz-slider-chars` sizing of the number field/readout is
   **unchanged** by orientation.

4. **Vert-R4 — Fill & ticks rotate (theme).** In vertical mode the theme:
   - paints the single-Slider fill gradient **`to top`** (was `to right`); the
     `--_fill-stop` thumb-center calc is axis-agnostic (`100%` now resolves to
     the block length) and is reused verbatim;
   - repositions the RangeSlider track `::before`/`::after` onto the block axis
     — `::before` spans the full block length; `::after` is offset by
     `bottom: calc(thumb/2 + var(--hz-slider-fill-start) * (100% − thumb))` with
     `height: calc((fill-end − fill-start) * (100% − thumb))`;
   - repositions ticks onto the block axis: each mark at
     `bottom: calc(thumb/2 + var(--hz-tick-pos) * (100% − thumb))`, sitting at
     the track's **inline-end** (beside the track, not beneath); tick **labels**
     render beside the mark (inline-end), vertically centered on it. The
     `data-has-ticks` room-reservation switches from bottom padding to
     inline-end padding.
   `--hz-tick-pos`, `--hz-slider-fill`, `--hz-slider-fill-start/-end`, and
   `--hz-slider-chars` are all computed unchanged in the component — only the
   CSS that consumes them rotates.

5. **Vert-R5 — aria-orientation stamped.** When `orientation === 'vertical'`,
   the range input (Slider) / **both** ranges (RangeSlider) carry
   `aria-orientation="vertical"`; when horizontal, the attribute is omitted
   (implicit `horizontal`). This is independent of the CSS writing-mode.

6. **Vert-R6 — Keyboard (native, verified).** Vertical ranges keep native
   stepping with no reimplemented handlers: Up/Right arrow **increase** toward
   `max`, Down/Left **decrease** toward `min` (the `direction: rtl` bottom-up
   layout aligns Up with increase). Home/End/PageUp/PageDown behave natively.
   This is asserted by e2e (Test plan), not assumed — it is the one claim that
   varies by engine.

7. **Vert-R7 — RangeSlider vertical is CSS-only over 17.** The dual-thumb
   value logic is orientation-agnostic and **unchanged**: meet-never-cross
   clamp (Range-R2), the `data-top` past-midpoint heuristic (Range-R3), and
   `pointer-events` thumb pickup all operate in value space. Vertical only adds
   the writing-mode/direction on both stacked ranges and the rotated
   `::before`/`::after`. No new JS branch in `onThumbInput`/`commitNumber`/
   `topThumb`.

8. **Vert-R8 — Reflow / bounded height.** A vertical slider is still a block
   Field. Its intrinsic height is `--hz-slider-length` (+ label/description/
   error rows + tick inline padding); it does not collapse and does not force
   the page to grow unbounded (the hook is a fixed length, not `100%`). Placing
   several vertical sliders side-by-side is the author's job (e.g. wrap in
   `Cluster`); the component does not impose horizontal layout. Docs demos
   bound their height via the default `--hz-slider-length`.

9. **Vert-R9 — Docs & hooks.** Both docs pages gain a **Vertical** demo tab
   showing ticks + labels and both `inputPosition` values; `--hz-slider-length`
   is added to the shared `SLIDER_PROPS` hook rows (`hooks.ts`) with
   `hooks.spec.ts` updated; `data/{slider,range-slider}.ts` gain `orientation`
   and `inputPosition` prop rows and an a11y note on the stamped
   `aria-orientation`.

10. **Vert-R10 — specs/17 amendment.** In `specs/17-slider.md`, the
    "Vertical orientation is deliberately not supported (product decision
    2026-07-13)" bullet and the Out-of-Scope "Vertical orientation" line are
    annotated (not deleted) with:
    `> Amended 2026-07-23: reversed — vertical orientation is now supported. See specs/45-slider-vertical.md.`

### CSS split (structural vs theme)

- **Structural (component `<style>`):** the load-bearing orientation mechanism —
  `data-orientation="vertical"` → range `writing-mode: vertical-lr; direction:
  rtl`, row `flex-direction: column`, track `block-size:
  var(--hz-slider-length, 12rem)` + thumb-thickness inline size; and
  `data-input-position` → track `order` reflow. These are layout/behavior, the
  vertical analogues of the existing structural `flex`/`width` rules
  (Slider-R8), so they stay in the component, not the theme.
- **Theme (`field.css`, in `@layer hz-theme`):** all *visuals* that rotate —
  gradient direction, `::before`/`::after` block offsets, tick block
  positioning + beside-track labels, `data-has-ticks` inline padding, thumb
  recenter on the inline axis, and the canonical `--hz-slider-length` default
  value declared alongside `--hz-slider-track-height`/`--hz-slider-thumb-size`
  on the row. The number-field chrome (`.hz-slider-number`, spin-button
  hiding, `field-sizing`) is orientation-independent and unchanged.

### Responsive Behavior

- Full-width block Field at all breakpoints (Field baseline), unchanged for
  horizontal. Vertical sliders keep a fixed block length (`--hz-slider-length`)
  at every breakpoint — no breakpoint-specific orientation switch (orientation
  is an explicit prop, not breakpoint-derived). Authors compose multiple
  vertical sliders side-by-side with `Cluster`/`Grid`; the component does not
  impose horizontal layout (Vert-R8).

### Accessibility (WCAG 2.1 AA)

- `aria-orientation="vertical"` stamped in vertical mode (Vert-R5) — 4.1.2.
- Native slider semantics (value/min/max, arrow stepping) preserved on both
  axes; Tab order and both-thumb reachability unchanged (2.1.1, 2.4.3).
- Number field(s), readout, ticks, separator, unit remain exactly as in 17 —
  the exact-entry path and decorative `aria-hidden` marks carry over verbatim.
- Focus ring stays on the thumb (theme), visible in vertical.
- No motion introduced; reduced-motion is not implicated.
- Reflow (1.4.10): vertical sliders keep a fixed block length and do not
  introduce two-dimensional scroll at 320px width when authored normally.

### Edge Cases & Error States

| Case | Expected |
| ---- | -------- |
| `orientation="vertical"`, no other change | Bottom-up vertical track; all existing behavior intact (Vert-R1/R2). |
| `orientation` omitted / `"horizontal"` | Byte-for-byte current behavior; every 17 test still green (Vert-R1). |
| `inputPosition="start"` horizontal | Number field/readout leads (inline-start); unit/sep stay adjacent (Vert-R3). |
| `inputPosition="start"` vertical | Number field/readout above the track; `"end"` below (Vert-R3). |
| Vertical + `showInput={false}` | Readout at start/end per `inputPosition`; range announces value (Vert-R3, Slider-R1/Range-R1). |
| Vertical + ticks with labels | Marks + labels beside the track at rotated positions; out-of-range ticks still skipped (Vert-R4, Ticks-R1). |
| Vertical RangeSlider number pair | Single inline `min – max` cluster placed above/below per `inputPosition`, not stacked (Vert-R3). |
| Vertical + `max === min` | Fill fractions `0`; no division by zero (Fill-R1 unchanged). |
| Vertical RangeSlider, thumbs coincide | `data-top` picks the escapable thumb; keyboard reaches both (Range-R3 unchanged). |
| Vertical arrow keys | Up/Right increase, Down/Left decrease (Vert-R6, e2e-verified). |
| `--hz-slider-length` overridden | Track block length follows the hook; fill/ticks stay aligned (thumb-center calc is length-relative). |
| Vertical in a narrow container | Fixed block length; no unbounded growth (Vert-R8). |
| Pre-2024 engine, `orientation="vertical"` | Degrades to a horizontal native range; no error (browser-support floor accepted). |

### Existing Code to Reuse

- Everything in `specs/17`: `Field.svelte` scaffold (Slider), RadioGroup-style
  fieldset/legend (RangeSlider), `cx`/`uid`, `FieldBase`/`SliderTick`, the fill
  and tick fraction derivations, `commitNumber`/`onThumbInput`/`topThumb`
  (all orientation-agnostic — reused untouched).
- The existing slider block in `src/lib/theme/components/field.css`
  (~lines 185–465): the vertical rules are added as `[data-orientation='vertical']`
  overrides of the same selectors, reusing `--_fill-stop`, `--_track-color`,
  and the thumb-center calc pattern.
- Docs: `DocPage`/`Example`/`Tabs` pattern (MEMORY: docs-page-pattern — mind the
  hidden-panel measurement gotcha for vertical e2e); `SLIDER_PROPS` shared hook
  array in `hooks.ts`.

### Test Plan (house style: vitest browser project + e2e)

**`Slider.svelte.spec.ts` / `RangeSlider.svelte.spec.ts` (vitest browser):**
- Vert-R1: `data-orientation` present with correct value both ways; default is
  `horizontal`.
- Vert-R3: `data-input-position` reflects the prop; asserted structurally (DOM
  attr + computed `order` on the track) — reliable in the browser project.
  RangeSlider: the min/max number fields + separator remain a single inline
  cluster (one `.hz-slider-row` child group) in vertical.
- Vert-R5: `aria-orientation="vertical"` present on the range(s) when vertical,
  absent when horizontal (both ranges for RangeSlider).
- Regression: the full existing 17 suites run **unchanged** and pass (proves
  Vert-R1's "no horizontal change").
- Computed-geometry assertions kept conservative: assert **attributes and
  custom-property values** (`--hz-slider-fill*`, `--hz-tick-pos`,
  `--hz-slider-chars`) are identical across orientations (they are
  orientation-agnostic), rather than asserting pixel `getBoundingClientRect`
  of pseudo-elements (flaky, and `::before`/`::after` boxes aren't directly
  queryable).

**Docs e2e (Playwright):**
- Vertical demo tab renders; the track's rendered box is **taller than wide**
  in the vertical panel (bounded, single reliable geometry check on the
  visible panel only — respect the hidden-panel gotcha).
- Vert-R6 keyboard: focus a vertical thumb, press ArrowUp → value increases
  (reads `aria-valuenow`/`value`); ArrowDown → decreases. This is the
  engine-dependent claim, so it lives in e2e against a real browser.
- `inputPosition` start vs end: the number field appears above/before vs
  below/after the track in the rendered order.

### Out of Scope

- Everything already out of scope in `specs/17` except vertical orientation
  (tick detents, >2 thumbs, tooltips, unit switching, file/color pickers).
- Legacy vertical fallbacks (`appearance: slider-vertical`, Firefox
  `orient="vertical"`) — the pre-2024 support floor is accepted (user-confirmed
  2026-07-23).
- A `both`/responsive auto-orientation mode (orientation is an explicit prop,
  not breakpoint-derived).
- Stacking the RangeSlider number pair to mirror thumb positions in vertical —
  the pair stays an inline cluster (user-confirmed 2026-07-23).
- Horizontal RTL locale flipping of the fill (separate concern, unchanged).
