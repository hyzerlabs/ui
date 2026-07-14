# ColorInput Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Color-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).

### Goal

Ship one headless, accessible Svelte 5 `ColorInput` component: a labeled
native `<input type="color">` on the shared Field scaffold
(`specs/13-forms.md` Field-R*), paired with a synced hex **text field** for
exact keyboard entry (the exact-entry pattern from Slider). The native picker
does the visual color work; the hex field commits validated, normalized
values on change. Amends `specs/13-forms.md` Out of Scope: color inputs move
from out-of-scope to this spec; file pickers remain out.

### Props

| Prop          | Type                    | Default                        |
| ------------- | ----------------------- | ------------------------------ |
| `name`        | `string`                | _required_                     |
| `label`       | `string`                | _required_                     |
| `value`       | `string` (`$bindable`)  | `'#000000'`                    |
| `showInput`   | `boolean`               | `true`                         |
| `inputLabel`  | `string`                | `` `${label} (hex value)` ``   |
| `description` | `string`                | —                              |
| `error`       | `string`                | —                              |
| `required`    | `boolean`               | `false`                        |
| `disabled`    | `boolean`               | `false`                        |
| `hideLabel`   | `boolean`               | `false`                        |
| `class`       | `string` (→ `cx`)       | —                              |

Plus arbitrary `...rest` forwarded onto the color input (Forms-R2).

### Requirements

1. **Color-R1 — Structure.** Renders the Field scaffold (Field-R*) with root
   class `cx('hz-field', 'hz-field--color', className)`, wrapping a
   `<div class="hz-color-row">` containing, in order:
   - `<input type="color" id="hz-input-{uid}" name={name} class="hz-color">`
     — the labelled (`for`/`id`), named, form-participating control;
   - when `showInput` (default): `<input type="text" class="hz-color-hex">`
     with **no** `name`, `aria-label={inputLabel}`, `maxlength={7}`,
     `spellcheck="false"` — the exact-entry hex field (Slider's
     `.hz-slider-number` precedent);
   - when `showInput` is false: `<span class="hz-color-value"
     aria-hidden="true">{value}</span>` — the hex value stays visible as a
     read-only readout (Slider's `.hz-slider-value` precedent); `aria-hidden`
     because the color input's own value is what assistive tech reads.
2. **Color-R2 — Value binding.** `value` is `$bindable` **string**, default
   `'#000000'`, two-way bound to the color input via `bind:value` (the
   platform normalizes picks to 7-character lowercase hex). The hex field
   **displays** `value` (one-way) and updates live as the user picks.
3. **Color-R8 — Hex-field commit.** The hex field commits on `change`
   (blur/Enter), not per keystroke: trim; accept `#rgb`/`#rrggbb` with or
   without the leading `#`, case-insensitive; anything else → restore the
   displayed value to `value` (no assignment); a valid entry is normalized —
   lowercase, `#` prefixed, 3-digit shorthand expanded (`#f60` → `#ff6600`)
   — assigned to `value`, and reflected back into the field.
4. **Color-R3 — ARIA.** The input carries the Field-R6 `aria-describedby`
   chain and `aria-invalid="true"` on error (Field-R5). `required` renders
   the Field-R3 label indicator **only** — a color input always holds a
   value, so `aria-required` is not applied (Slider-R4 rationale).
5. **Color-R4 — Disabled.** Native `disabled` on **both** inputs; wrapper
   `data-state` per Field-R7/R1 (error wins).
6. **Color-R5 — Rest forwarding.** `...rest` spreads onto the color input
   first; managed attributes (`type`, `id`, `name`, `class`, aria chain,
   binding) win (Forms-R2).
7. **Color-R6 — Barrel export.** `ColorInput` exported from
   `src/lib/components/index.ts`; `import { ColorInput } from '$lib'`
   resolves; assertion + smoke render in `exports.spec.ts`.
8. **Color-R7 — Structural CSS only.** Scoped styles: the row as a flex line
   (token gap, centered). Swatch sizing/border/radius and the hex field are
   the reference theme's job (`.hz-color` sized via `--hz-color-swatch-size`
   hook; vendor swatch-wrapper padding stripped; `.hz-color-hex` shares the
   **TextInput chrome** and is **auto-sized to its content** via
   `field-sizing: content` with a 7-char never-clipping `min-width` and a
   `@supports` width fallback, plus the shared `--hz-field-ring` focus
   ring). Theme rules live inside `@layer hz-theme`.

### Accessibility (WCAG 2.1 AA)

- The color input is the labelled (1.3.1, 4.1.2), named control; activating
  it opens the platform picker, which owns the picking UX. The hex field has
  its own accessible name (`inputLabel`), never submits, and gives keyboard
  and screen-reader users an exact-entry path (2.1.1).
- `description`/`error` are announced with the input via `aria-describedby`;
  the error paragraph is `role="alert"` (Field-R5).
- Color alone must not carry meaning (1.4.1) — that is the consumer's
  content concern; the visible hex value helps.

### Edge Cases & Error States

| Case                                   | Expected behavior                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `value` initialized to a non-hex string | Not validated by the component; the native input normalizes/falls back (Color-R2). |
| `showInput={false}`                    | No hex field; the read-only `.hz-color-value` readout shows the value (Color-R1). |
| Picking a color                        | `value` updates via `bind:value`; the hex field tracks live (Color-R2).         |
| Hex field commits `f60` / `#F60`       | Normalized to `#ff6600` and assigned (Color-R8).                                 |
| Hex field commits garbage / empty      | Restored to the current `value`; no assignment (Color-R8).                       |
| `disabled` / `error`                   | Both inputs natively disabled; `data-state` precedence per Field-R1 (Color-R4). |
| `...rest` attempts `type` / `name`     | Component-managed value wins (Color-R5).                                        |

### Test Plan

`src/lib/components/ColorInput.svelte.spec.ts` (browser project): Field-R1
wrapper/data-state suite; Color-R1 structure (input[type=color].hz-color,
for/id label; hex field with aria-label + no `name`; `showInput={false}` →
aria-hidden readout instead); Color-R2 default `'#000000'`, programmatic color input
updates the hex field display; Color-R8 commit — valid assignment, `#rgb`
expansion, case normalization, garbage/empty restore; Color-R3 describedby
chain/aria-invalid/no aria-required; Color-R4 both inputs disabled; Color-R5
rest forwarding + managed-wins; Color-R6 export + smoke render. (Synthetic
`change` dispatches must bubble — Svelte-delegated event.)

### Out of Scope

- Custom palette/swatch pickers, eyedropper API, alpha channels, and any
  non-native picking UI.
- Named colors, `rgb()`/`hsl()` notation in the hex field — `#rgb`/`#rrggbb`
  only.
- File pickers (unchanged from `specs/13-forms.md`).
