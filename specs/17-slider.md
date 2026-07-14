# Slider Family Spec (Slider + RangeSlider)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Slider-Rn`, `Ticks-Rn`, `Fill-Rn`, `Range-Rn`) and edge case as
> pass/fail. Write scope for the Builder is the library source (`src/lib/**`).

### Goal

Ship two headless, accessible Svelte 5 slider components built on native
`<input type="range">`:

- **`Slider`** — one thumb, labeled via the shared Field scaffold, paired with
  a synced `<input type="number">` for fine-tuned keyboard entry (the pattern
  proven by the docs site's `ResizableDemo`).
- **`RangeSlider`** — two thumbs selecting a `[valueMin, valueMax]` interval:
  two overlapped native ranges (native keyboard/AT semantics per thumb) in a
  `<fieldset>`/`<legend>` structure (like RadioGroup — two controls cannot
  share one `for`/`id` label), each with its own exact-entry number field.

Both support **tick marks** (`ticks`) and expose live thumb-position fractions
so the reference theme can paint a **filled track** (min→thumb for Slider,
between thumbs for RangeSlider). The ranges are the form-participating
controls; number fields are UI affordances committing clamped, step-snapped
values on change. Components ship only minimal structural CSS — track, thumb,
fill, and tick visuals are the reference theme's job.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. Two files:
  `src/lib/components/Slider.svelte` (reusing the internal `Field.svelte`
  scaffold) and `src/lib/components/RangeSlider.svelte` (own
  fieldset/legend structure, like RadioGroup). All Field-R* and Forms-R1/R2
  requirements from `specs/13-forms.md` apply.
- Values are **numbers** (unlike TextInput's string contract): a range input
  always holds a numeric value and Svelte's `bind:value` is numeric for
  range/number inputs.
- Number inputs participate in **no** form submission (no `name`) — the
  range(s) carry `name`/value. Number inputs are labelled via `aria-label`,
  not the field label.
- **Native-first dual thumb:** RangeSlider is two real `<input type="range">`
  elements stacked on one visual track — each thumb is independently
  focusable/steppable with zero reimplemented keyboard/ARIA. The theme makes
  the inputs transparent (`pointer-events: none`) with interactive thumbs
  (`pointer-events: auto` on the thumb pseudo-elements).
- Vertical orientation is **deliberately not supported** (product decision
  2026-07-13).

### Shared Type

Add to `src/lib/types/index.ts`:

```ts
/** A tick mark on a Slider/RangeSlider track: a bare value or value + label. */
export type SliderTick = number | { value: number; label: string };
```

### Props

**Slider**

| Prop          | Type                    | Default                        |
| ------------- | ----------------------- | ------------------------------ |
| `name`        | `string`                | _required_                     |
| `label`       | `string`                | _required_                     |
| `min`         | `number`                | `0`                            |
| `max`         | `number`                | `100`                          |
| `step`        | `number`                | `1`                            |
| `value`       | `number` (`$bindable`)  | `min`                          |
| `showInput`   | `boolean`               | `true`                         |
| `ticks`       | `SliderTick[]`          | —                              |
| `unit`        | `string`                | — (visual suffix)              |
| `inputLabel`  | `string`                | `` `${label} (exact value)` `` |
| `description` | `string`                | —                              |
| `error`       | `string`                | —                              |
| `required`    | `boolean`               | `false`                        |
| `disabled`    | `boolean`               | `false`                        |
| `hideLabel`   | `boolean`               | `false`                        |
| `class`       | `string` (→ `cx`)       | —                              |

Plus arbitrary `...rest` forwarded onto the **range** input (Forms-R2).

**RangeSlider**

| Prop            | Type                   | Default                             |
| --------------- | ---------------------- | ----------------------------------- |
| `name`          | `string`               | _required_ (base; see Range-R1)     |
| `label`         | `string`               | _required_ (the legend)             |
| `min`           | `number`               | `0`                                 |
| `max`           | `number`               | `100`                               |
| `step`          | `number`               | `1`                                 |
| `valueMin`      | `number` (`$bindable`) | `min`                               |
| `valueMax`      | `number` (`$bindable`) | `max`                               |
| `showInput`     | `boolean`              | `true`                              |
| `ticks`         | `SliderTick[]`         | —                                   |
| `unit`          | `string`               | — (one suffix after the pair)       |
| `minThumbLabel` | `string`               | `` `${label} (minimum)` ``          |
| `maxThumbLabel` | `string`               | `` `${label} (maximum)` ``          |
| `description`   | `string`               | —                                   |
| `error`         | `string`               | —                                   |
| `required`      | `boolean`              | `false`                             |
| `disabled`      | `boolean`              | `false`                             |
| `hideLabel`     | `boolean`              | `false`                             |
| `class`         | `string` (→ `cx`)      | —                                   |

Plus arbitrary `...rest` forwarded onto the **fieldset** root (like
RadioGroup's Forms-R2 — with two ranges there is no single control to receive
it).

### Requirements — Slider

1. **Slider-R1 — Structure.** Renders the Field scaffold (Field-R*) with root
   class `cx('hz-field', 'hz-field--slider', className)`, wrapping a
   `<div class="hz-slider-row">` that contains, in order:
   - `<div class="hz-slider-track">` (the positioning host for ticks and, in
     RangeSlider, the painted track) containing
     `<input type="range" id="hz-input-{uid}" name={name} class="hz-slider">`
     with `min`/`max`/`step` reflected — the labelled (`for`/`id`), named,
     form-participating control — plus the tick elements (Ticks-R1);
   - when `showInput` is true (default): `<input type="number"
     class="hz-slider-number">` with the same `min`/`max`/`step`, **no**
     `name`, and `aria-label={inputLabel}`;
   - when `showInput` is false: `<span class="hz-slider-value"
     aria-hidden="true">{value}</span>` — the current value stays visible;
     `aria-hidden` because the range announces it natively;
   - when `unit` is set: `<span class="hz-slider-unit" aria-hidden="true">`
     containing it.

   The row carries `data-has-input` (present/absent per `showInput`),
   `data-has-ticks` (present when `ticks` is non-empty), and two custom
   properties: `--hz-slider-chars` — the character count of the widest bound
   formatted at the step's decimal precision (e.g. min 150 / max 180 /
   step 0.5 → `"180.5"` → 5), so the theme sizes the number field / readout
   to fit — and `--hz-slider-fill` (Fill-R1).
2. **Slider-R2 — Value binding.** `value` is `$bindable` **number**, default
   `min`, two-way bound to the range via `bind:value`. The number input
   **displays** `value` (one-way) and updates live as the slider moves.
3. **Slider-R3 — Number-field commit.** The number input commits on `change`
   (blur/Enter), not per keystroke: parse the field; empty or `NaN` →
   restore the displayed value to `value` (no assignment); otherwise **snap
   to the step grid anchored at `min`**, **clamp** to `[min, max]`, assign to
   `value`, and reflect the final value back into the field (so a clamped or
   snapped entry visibly corrects itself). Arrow keys on either input step
   natively by `step`.
4. **Slider-R4 — ARIA.** The range input carries the Field-R6
   `aria-describedby` chain and `aria-invalid="true"` on error (Field-R5).
   `required` renders the Field-R3 label indicator **only** —
   `aria-required` is not in the slider role's supported ARIA set (a range
   always holds a value), so it is deliberately not applied. Range semantics
   (`aria-valuenow`/`min`/`max`) are native.
5. **Slider-R5 — Disabled.** `disabled` sets the native `disabled` attribute on
   **both** inputs and `data-state="disabled"` on the wrapper (Field-R7,
   error-wins precedence per Field-R1).
6. **Slider-R6 — Rest forwarding.** `...rest` spreads onto the **range** input
   first; managed attributes (`type`, `id`, `name`, `class`, `min`, `max`,
   `step`, aria chain, binding) win (Forms-R2).
7. **Slider-R7 — Barrel export.** `Slider` exported from
   `src/lib/components/index.ts`; `import { Slider } from '$lib'` resolves;
   assertion + smoke render added to `exports.spec.ts`.
8. **Slider-R8 — Structural CSS only.** Scoped styles: the row as a flex line
   (`display: flex; align-items: center`, token gap), the track wrapper
   `flex: 1; min-width: 0; position: relative`, the range `width: 100%`.
   **No** track/thumb/fill/tick visuals, colors, or number-input chrome — all
   theme (see Theme section). Theme rules live inside `@layer hz-theme` (no
   unlayered exception needed — the components ship no competing visual
   rules, unlike Toggle).

### Requirements — Ticks & Fill (both components)

1. **Ticks-R1 — Rendering.** When `ticks` is a non-empty array, the track
   wrapper renders one `<span class="hz-slider-tick">` per entry **inside a
   single `aria-hidden="true"` container** (`<div class="hz-slider-ticks">`)
   — ticks are decorative; the ranges announce values. Each tick carries
   `--hz-tick-pos`: its position as a **fraction** `(value - min) / (max -
   min)`. A `{ value, label }` entry renders the label as the tick's text
   content (`<span class="hz-slider-tick-label">`); a bare number renders an
   unlabeled mark. Entries outside `[min, max]` are **skipped** (not
   clamped). Ticks never affect stepping or snapping — they are marks, not
   detents.
2. **Fill-R1 — Thumb-position custom properties.** The components expose live
   position **fractions** (0–1, clamped) so the theme can paint fills with
   pure CSS: Slider sets `--hz-slider-fill: (value - min) / (max - min)` on
   the row; RangeSlider sets `--hz-slider-fill-start` (min thumb) and
   `--hz-slider-fill-end` (max thumb). When `max === min`, fractions are `0`.
   Fractions update reactively as thumbs move.

### Requirements — RangeSlider

1. **Range-R1 — Structure.** Renders
   `<fieldset class="hz-field hz-field--slider hz-field--slider-range">`
   (root, `cx` with `className`, `data-state` per Field-R1) containing, in
   order: `<legend class="hz-field-label">{label}</legend>` (sr-only with
   `hideLabel`, `*` indicator per Field-R3), the optional description
   (Field-R4), a `<div class="hz-slider-row">` and the optional error
   (Field-R5). The row contains:
   - `<div class="hz-slider-track">` containing **two** range inputs — the
     **min thumb** `<input type="range" class="hz-slider hz-slider-min"
     name="{name}-min" aria-label={minThumbLabel}>` then the **max thumb**
     (`hz-slider-max`, `name="{name}-max"`, `aria-label={maxThumbLabel}`),
     both with `min`/`max`/`step` reflected — plus ticks (Ticks-R1);
   - when `showInput` (default): two number fields
     (`hz-slider-number hz-slider-number-min` / `-max`, no `name`,
     `aria-label` `` `${minThumbLabel} (exact value)` `` /
     `` `${maxThumbLabel} (exact value)` ``) separated by
     `<span class="hz-slider-sep" aria-hidden="true">–</span>`;
   - when `showInput` is false: a single readout
     `<span class="hz-slider-value" aria-hidden="true">{valueMin}–{valueMax}</span>`;
   - the optional `unit` span (one, after the pair).

   The row carries `data-has-input`/`data-has-ticks`/`--hz-slider-chars` as in
   Slider-R1, plus the fill fractions (Fill-R1) and `data-top` (Range-R3).
2. **Range-R2 — Binding & cross-clamp.** `valueMin`/`valueMax` are `$bindable`
   numbers defaulting to `min`/`max`. Thumbs **can meet but never cross**: on
   input, if the min thumb exceeds `valueMax` it is clamped to `valueMax`
   (and vice versa) — the partner never moves. Number fields commit per
   Slider-R3 semantics with the partner as the effective bound: the min field
   clamps to `[min, valueMax]`, the max field to `[valueMin, max]`.
3. **Range-R3 — Overlap stacking.** When the thumbs coincide, the stacked
   inputs would occlude each other for pointers; the row's `data-top`
   attribute names the thumb the theme must raise: `"min"` when
   `valueMin === valueMax` **and** the shared value is past the midpoint of
   `[min, max]` (the only escape is leftward, which only the min thumb can
   take), else `"max"`. Keyboard access is unaffected either way — both
   inputs remain individually focusable (this heuristic only affects pointer
   pickup on exact overlap).
4. **Range-R4 — ARIA.** Group semantics come from the fieldset/legend. Both
   range inputs carry the Field-R6 `aria-describedby` chain and
   `aria-invalid` on error; `aria-required` is not applied (Slider-R4
   rationale). Each thumb's accessible name is its `aria-label`
   (`minThumbLabel`/`maxThumbLabel`).
5. **Range-R5 — Disabled.** `disabled` natively disables all four inputs (two
   ranges, two number fields) and sets wrapper `data-state` (Field-R7/R1).
6. **Range-R6 — Rest forwarding.** `...rest` spreads onto the **fieldset**
   first; managed attributes (`class`, `data-state`) win (Forms-R2, RadioGroup
   precedent).
7. **Range-R7 — Barrel export.** `RangeSlider` exported from the barrel;
   `import { RangeSlider } from '$lib'` resolves; assertion + smoke render in
   `exports.spec.ts`. `SliderTick` exported from `$lib/types`.

### Theme (reference theme, `field.css`, in-layer)

- `.hz-slider` (single): `appearance: none`; the input itself is the track —
  painted as a `linear-gradient` from primary (fill) to the gray track color,
  with the stop at `calc(var(--hz-slider-thumb-size) / 2 +
  var(--hz-slider-fill, 0) * (100% - var(--hz-slider-thumb-size)))` so the
  fill edge tracks the **thumb center**. Thumb via
  `::-webkit-slider-thumb`/`::-moz-range-thumb`; hooks
  `--hz-slider-track-height`/`--hz-slider-thumb-size`.
- `.hz-field--slider-range .hz-slider-track`: the wrapper paints the gray
  track; the fill is its `::before`, positioned from
  `--hz-slider-fill-start`/`--hz-slider-fill-end` with the same thumb-center
  correction. The two range inputs are absolutely stacked over it,
  transparent, `pointer-events: none`, with `pointer-events: auto` on the
  thumb pseudo-elements; `data-top="min"` raises the min input's z-index.
- `.hz-slider-ticks`: absolute under the track; each tick a small mark at
  `left: calc(thumb/2 + var(--hz-tick-pos) * (100% - thumb))`, labels muted
  small text beneath; `row[data-has-ticks]` reserves the extra height.
- `.hz-slider-number` shares the **TextInput chrome** (same border, font,
  size, padding) and is **auto-sized to its content** via
  `field-sizing: content` — `--hz-slider-chars` feeds only a never-clipping
  `min-width` (so the row doesn't shift as digit counts change mid-drag) and
  the width fallback under `@supports not (field-sizing: content)`. Native
  spin buttons hidden — they overlay digits on desktop and duplicate the
  slider; arrow keys still step. `.hz-slider-value` (mono readout,
  `min-width` from the chars hook), `.hz-slider-sep`/`.hz-slider-unit`
  (muted).

### Responsive Behavior

- Full-width block fields at all breakpoints (Field baseline); tracks flex to
  fill the row, number fields and unit keep intrinsic width. No
  breakpoint-specific behavior.

### Accessibility (WCAG 2.1 AA)

- Slider: the range is the single labelled control (1.3.1, 4.1.2); native
  slider semantics announce value/min/max. RangeSlider: the fieldset/legend
  names the group; each thumb has its own accessible name and native slider
  semantics — Tab reaches both thumbs in order (2.1.1, 2.4.3).
- Number fields have their own accessible names and mirror the values, giving
  keyboard and screen-reader users an exact-entry path.
- `description`/`error` are announced with the range(s) via
  `aria-describedby`; the error paragraph is `role="alert"` (Field-R5).
- `unit`, ticks, the readout, and the pair separator are decorative
  (`aria-hidden`) — the ranges announce the real values. Put meaning-bearing
  units in `label`, `description`, or the thumb/input labels.
- Focus visibility is native/theme; no outline suppression.

### Edge Cases & Error States

| Case                                        | Expected behavior                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Typed value above `max` / below `min`       | Clamped on commit; the field reflects the clamped value (Slider-R3).                   |
| Typed value off the step grid               | Snapped to the nearest step anchored at `min`, then clamped (Slider-R3).               |
| Field cleared / non-numeric entry           | Restored to the current value; no assignment (Slider-R3).                              |
| `showInput={false}`                         | Read-only `.hz-slider-value` readout (`{value}` / `{valueMin}–{valueMax}`) (R1s).      |
| Value prop(s) initialized out of range      | Not validated by the component; the native range clamps its own position (Slider-R2).  |
| `disabled`                                  | All inputs natively disabled; wrapper `data-state="disabled"` (Slider-R5/Range-R5).    |
| `error` set                                 | `aria-invalid` on the range(s); `data-state="error"` wins over disabled (R4/R1).       |
| `...rest` attempts managed attributes       | Component-managed value wins (Slider-R6/Range-R6).                                     |
| Keyboard arrows on a thumb                  | Native stepping; displays track live (Slider-R2/Range-R2).                             |
| Min thumb dragged past the max thumb        | Clamped at `valueMax`; the max thumb never moves (Range-R2).                           |
| Min number field commits > `valueMax`       | Clamped to `valueMax` (partner bound), then snapped (Range-R2).                        |
| Thumbs coincide                             | `data-top` picks the escapable thumb for pointer pickup; keyboard reaches both (Range-R3). |
| `valueMin` initialized > `valueMax`         | Not validated; first interaction clamps into order (Range-R2).                         |
| Tick outside `[min, max]`                   | Skipped, not rendered (Ticks-R1).                                                      |
| `max === min`                               | Fill fractions are `0`; no division by zero (Fill-R1).                                 |

### Existing Code to Reuse

- `Field.svelte` scaffold (Slider) + RadioGroup's fieldset/legend pattern
  (RangeSlider); `cx`/`uid` from `$lib/utils`.
- `FieldBase`, `SliderTick` from `$lib/types`.
- Test harness patterns from `Slider.svelte.spec.ts` (note: synthetic
  `change`/`input` dispatches need `{ bubbles: true }` for Svelte-delegated
  events).

### Test Plan

`Slider.svelte.spec.ts` additions + new `RangeSlider.svelte.spec.ts` (browser
project):

- Slider (existing suite stands): plus ticks — rendered inside one
  `aria-hidden` container, `--hz-tick-pos` fractions, labels only for object
  entries, out-of-range entries skipped, `data-has-ticks` present/absent —
  and fill — `--hz-slider-fill` fraction present and tracking slider moves.
- Range-R1: fieldset/legend structure; two ranges with `{name}-min`/`-max`,
  thumb aria-labels, min/max/step reflected; two number fields (no `name`)
  plus separator; readout mode; chars/fill custom properties.
- Range-R2: defaults (`min`/`max`); moving min past max clamps at `valueMax`
  (partner unmoved), and vice versa; min field commit clamps to
  `[min, valueMax]` + snaps; max field commit clamps to `[valueMin, max]`.
- Range-R3: `data-top="max"` normally; `"min"` when coincident past midpoint;
  `"max"` when coincident below it.
- Range-R4: describedby chain + aria-invalid on **both** ranges; no
  aria-required.
- Range-R5: all four inputs disabled.
- Range-R6: `data-testid` in rest lands on the fieldset; `class` merge order.
- Range-R7: `$lib` export + smoke render (also in `exports.spec.ts`).

### Out of Scope (this spec)

- Vertical orientation (product decision — not needed) and value tooltips.
- Tick **detents** (snapping to tick values) — ticks are visual marks only;
  stepping stays on the `step` grid.
- More than two thumbs.
- Text/select-based unit switching; `unit` is a static visual suffix.
- File / color pickers (unchanged from `specs/13-forms.md`).
