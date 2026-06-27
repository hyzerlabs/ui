# Forms & Inputs Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Field-Rn`, `TextInput-Rn`, `Textarea-Rn`, `Select-Rn`,
> `Checkbox-Rn`, `RadioGroup-Rn`, `Toggle-Rn`) and edge case as pass/fail. Write
> scope for the Builder is the library source (`src/lib/**`).

### Goal

Ship six headless, accessible Svelte 5 form primitives — **TextInput**,
**Textarea**, **Select**, **Checkbox**, **RadioGroup**, and **Toggle** — sharing
a consistent label / description / error field scaffold, two-way `$bindable`
`value`/`checked`, native form semantics, and `hz-*` class / `data-*` hooks,
shipping only the **minimal structural CSS** the controls need and **no** visual
opinions (no colors, borders, shadows, radius, fonts, or animation).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. Seven files in `src/lib/components/`:
  the six public components (`TextInput.svelte`, `Textarea.svelte`,
  `Select.svelte`, `Checkbox.svelte`, `RadioGroup.svelte`, `Toggle.svelte`) plus
  one **non-exported internal** `Field.svelte` scaffold reused by TextInput,
  Textarea, and Select for the label / description / error wrapper. Checkbox,
  Toggle, and RadioGroup render their own variant structure (label-after /
  fieldset-legend) but reuse the same id-derivation and `aria-describedby`
  chaining logic.
- Each public component is exported from `src/lib/components/index.ts`,
  resolvable via e.g. `import { TextInput } from '$lib'`; assertions added to
  `src/lib/exports.spec.ts`. `Field.svelte` is **not** exported from the barrel.
- Headless conventions (`original-specs/00-architecture.md`): each root gets a
  stable `class="hz-{component}"` plus `data-*` state hooks. Mirror existing
  components for `$props()` destructuring, `class: className` via `cx`,
  `...rest`-first spread (managed attributes win), `$effect` cleanup.
- Two-way data uses **`$bindable`** (mirror `Modal.svelte`'s
  `open = $bindable(false)`): `value` for TextInput/Textarea/Select/RadioGroup,
  `checked` for Checkbox/Toggle. Native DOM events (`oninput`, `onchange`,
  `onblur`, …) are forwarded via the `...rest` spread; **no** custom
  `onChange`-style callback props are introduced.
- IDs via `uid` from `$lib/utils` — one stable base id per instance, from which
  `hz-input-{uid}`, `hz-desc-{uid}`, `hz-error-{uid}` (and per-radio
  `hz-radio-{uid}-{i}`, the Toggle label id `hz-label-{uid}`) derive
  deterministically (mirror `Nav.svelte`'s `uid` usage) so id relationships are
  stable across reactive re-derivation.
- Dev warnings use the `import.meta.env.DEV` + `untrack(...)` pattern from
  `Card.svelte`.
- **Structural-CSS exception** (same justification as Card/Nav/Accordion/Tabs):
  each component ships **minimal structural** CSS in a scoped `<style>` — the
  TextInput prefix/suffix wrapper as a flex row, the radio-options flex direction
  per orientation, the checkbox/toggle as a label-aligned row, the textarea
  `resize`/`field-sizing` mapping, and native marker resets where needed. It
  ships **no** colors, borders, shadows, border-radius, fonts, or
  state/animation visuals. Any shipped spacing references `--hz-space-*` tokens
  **with literal fallbacks** (Shared Scale in `specs/03-layout.md`).
- Hidden labels reuse the existing bare **`.sr-only`** utility class already used
  by `Button.svelte` / `Link.svelte` (a global/theme-provided class the component
  only emits). Do **not** introduce a new `.hz-sr-only`.

### Shared Types

Add to `src/lib/types/index.ts` (mirroring the existing `NavItem` /
`FooterColumn` pattern; do not redeclare locally):

```ts
/** Props shared by every form field. */
export interface FieldBase {
	name: string;            // required
	label: string;           // required
	description?: string;
	error?: string;
	required?: boolean;      // default false
	disabled?: boolean;      // default false
	hideLabel?: boolean;     // default false
}

/** A single <option> for Select, or an <optgroup> wrapping nested options. */
export type SelectOption =
	| { value: string; label: string; disabled?: boolean }
	| { group: string; options: { value: string; label: string; disabled?: boolean }[] };

/** A single radio choice in a RadioGroup. */
export interface RadioOption {
	value: string;
	label: string;
	disabled?: boolean;
}
```

### Props

Every component accepts the `FieldBase` props above plus its own, listed per
component below. All components also accept arbitrary `...rest` HTML attributes
forwarded onto the control element, and an optional `class` (→ `cx`).

**TextInput**

| Prop           | Type                                                                        | Default  |
| -------------- | --------------------------------------------------------------------------- | -------- |
| `type`         | `'text' \| 'email' \| 'password' \| 'tel' \| 'url' \| 'search' \| 'number'` | `'text'` |
| `value`        | `string` (`$bindable`)                                                      | `''`     |
| `placeholder`  | `string \| undefined`                                                       | —        |
| `autocomplete` | `string \| undefined`                                                       | —        |
| `maxlength`    | `number \| undefined`                                                       | —        |
| `pattern`      | `string \| undefined`                                                       | —        |
| `inputmode`    | `string \| undefined`                                                       | —        |
| `prefix`       | `Snippet` (optional)                                                        | —        |
| `suffix`       | `Snippet` (optional)                                                        | —        |

**Textarea**

| Prop        | Type                                       | Default      |
| ----------- | ------------------------------------------ | ------------ |
| `value`     | `string` (`$bindable`)                     | `''`         |
| `rows`      | `number`                                   | `3`          |
| `resize`    | `'none' \| 'vertical' \| 'both' \| 'auto'` | `'vertical'` |
| `maxlength` | `number \| undefined`                      | —            |

**Select**

| Prop          | Type                   | Default       |
| ------------- | ---------------------- | ------------- |
| `options`     | `SelectOption[]`       | _required_    |
| `value`       | `string` (`$bindable`) | `''`          |
| `placeholder` | `string`               | `'Select...'` |

**Checkbox**

| Prop            | Type                    | Default |
| --------------- | ----------------------- | ------- |
| `checked`       | `boolean` (`$bindable`) | `false` |
| `indeterminate` | `boolean`               | `false` |
| `value`         | `string \| undefined`   | —       |

**RadioGroup**

| Prop          | Type                         | Default      |
| ------------- | ---------------------------- | ------------ |
| `options`     | `RadioOption[]`              | _required_   |
| `value`       | `string` (`$bindable`)       | `''`         |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` |

**Toggle**

| Prop      | Type                    | Default |
| --------- | ----------------------- | ------- |
| `checked` | `boolean` (`$bindable`) | `false` |

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

#### Shared field scaffold (`Field-R*`)

These hold for **every** component; the internal `Field.svelte` implements them
for TextInput/Textarea/Select, and Checkbox/Toggle/RadioGroup reproduce the same
id/aria logic in their own structure.

1. **Field-R1 — Wrapper + state.** Each component renders a root
   `<div class="hz-field">` (RadioGroup uses
   `<fieldset class="hz-field hz-field--radio-group">`; Checkbox adds
   `hz-field--checkbox`; Toggle adds `hz-field--toggle`) carrying
   `data-state="error" | "disabled" | "default"`. Precedence: `error` wins over
   `disabled` wins over `default`. One stable `uid` base per instance derives
   `hz-input-{uid}`, `hz-desc-{uid}`, `hz-error-{uid}`.
2. **Field-R2 — Label always present.** A label element always renders in the DOM
   with text content `label`:
   `<label class="hz-field-label" for="hz-input-{uid}">` for
   TextInput/Textarea/Select/Checkbox, `<legend class="hz-field-label">` for
   RadioGroup, and an `id="hz-label-{uid}"`-carrying
   `<label class="hz-field-label">` for Toggle. When `hideLabel` is true, the
   label additionally carries the **`.sr-only`** class — it is never omitted from
   the DOM.
3. **Field-R3 — Required indicator.** When `required` is true, the control gets
   `aria-required="true"` and the label appends
   `<span aria-hidden="true" class="hz-field-required">*</span>`. When false,
   neither is present.
4. **Field-R4 — Description.** When `description` is a non-empty string, render
   `<p class="hz-field-description" id="hz-desc-{uid}">{description}</p>`;
   otherwise the element is absent.
5. **Field-R5 — Error.** When `error` is a non-empty string, render
   `<p class="hz-field-error" id="hz-error-{uid}" role="alert">{error}</p>`, set
   `aria-invalid="true"` on the control, and `data-state="error"` on the wrapper.
   When `error` is empty/undefined, the element is absent and `aria-invalid` is
   not set.
6. **Field-R6 — `aria-describedby` chaining.** The control's `aria-describedby`
   is the space-joined list of present ids in the order `hz-desc-{uid}` then
   `hz-error-{uid}`. When only one is present, only that id is listed; when
   neither is present, the `aria-describedby` attribute is omitted entirely.
7. **Field-R7 — Disabled (native).** When `disabled` is true, the control gets
   the **native `disabled` attribute** (the `<button>` for Toggle; every radio
   `<input>` for RadioGroup) and the wrapper `data-state="disabled"` (unless
   `error` overrides per R1). Native `disabled` removes the control from the tab
   order and from form submission. No `aria-disabled` is used.
8. **Field-R8 — Shared types.** `FieldBase`, `SelectOption`, and `RadioOption`
   are declared in and exported from `src/lib/types/index.ts`; components import
   them rather than redeclaring.

#### TextInput (`TextInput-R*`)

1. **TextInput-R1 — Structure.** Renders the Field scaffold (Field-R*) wrapping a
   `<div class="hz-input-wrapper">` that contains, in order, an optional prefix
   span, the `<input id="hz-input-{uid}" name={name}>`, and an optional suffix
   span. The input's `type` reflects the `type` prop verbatim (default `text`).
2. **TextInput-R2 — Value binding.** `value` is `$bindable` and two-way bound to
   the input via `bind:value`, defaulting to `''`. For `type="number"` the bound
   `value` remains a **string** (native input value); no numeric coercion is
   performed.
3. **TextInput-R3 — Pass-through attributes.** `placeholder`, `autocomplete`,
   `maxlength`, `pattern`, and `inputmode` are applied to the input only when
   defined; when `undefined` the corresponding attribute is absent.
4. **TextInput-R4 — Prefix/suffix.** When the `prefix` snippet is provided,
   render `<span class="hz-input-prefix" aria-hidden="true">` containing it and
   set `data-has-prefix` (present) on the wrapper; likewise `suffix` →
   `<span class="hz-input-suffix" aria-hidden="true">` + `data-has-suffix`. When
   a snippet is absent, its span and data attribute are absent.
5. **TextInput-R5 — Native events.** `oninput`/`onchange`/`onblur` and any other
   handlers passed in `...rest` reach the `<input>`; the component adds no custom
   callback props.

#### Textarea (`Textarea-R*`)

1. **Textarea-R1 — Structure.** Renders the Field scaffold wrapping a
   `<textarea id="hz-input-{uid}" name={name} rows={rows}>` with `rows`
   defaulting to `3`. `maxlength` applies only when defined.
2. **Textarea-R2 — Value binding.** `value` is `$bindable`, two-way bound via
   `bind:value`, default `''`.
3. **Textarea-R3 — Resize mapping.** `resize` reflects to `data-resize` and maps
   to behavior: `'none' | 'vertical' | 'both'` set the CSS `resize` property to
   the matching value; `'auto'` disables manual resize and auto-grows to fit
   content via **`field-sizing: content`** as the primary mechanism, plus a
   **minimal JS height-sync fallback** for browsers lacking `field-sizing`
   support (feature-detected via `CSS.supports('field-sizing', 'content')`): an
   `oninput` handler resets `height` to `auto` then to `scrollHeight`, registered
   via `$effect` and synced on the initial value. The fallback is a no-op when
   `field-sizing` is supported.

#### Select (`Select-R*`)

1. **Select-R1 — Native element.** Renders the Field scaffold wrapping a native
   `<select id="hz-input-{uid}" name={name}>` (not a custom dropdown). `value` is
   `$bindable`, two-way bound via `bind:value`, default `''`.
2. **Select-R2 — Placeholder option.** A leading
   `<option value="" disabled selected>{placeholder}</option>` (default text
   `'Select...'`) is rendered; it is the selected option only while `value` is
   `''`. Once `value` is a real option, the placeholder is not selected.
3. **Select-R3 — Options & optgroups.** For each `SelectOption`: a flat
   `{ value, label, disabled? }` renders `<option value={value}>{label}</option>`
   with `disabled` applied when true; a `{ group, options }` entry renders
   `<optgroup label={group}>` wrapping its options. Array order is preserved.

#### Checkbox (`Checkbox-R*`)

1. **Checkbox-R1 — Structure.** Renders
   `<div class="hz-field hz-field--checkbox">` containing, in DOM order, the
   `<input type="checkbox" id="hz-input-{uid}" name={name}>` **then** the label
   (label after input, per checkbox convention). `value` applies to the input
   only when defined.
2. **Checkbox-R2 — Checked binding.** `checked` is `$bindable`, two-way bound via
   `bind:checked`, default `false`.
3. **Checkbox-R3 — Indeterminate.** `indeterminate` is reflected onto the input
   element's `.indeterminate` DOM property via a `bind:this` ref + `$effect`
   (it is not an HTML attribute). A user toggle clears it per native behavior.

#### RadioGroup (`RadioGroup-R*`)

1. **RadioGroup-R1 — Fieldset structure.** Renders
   `<fieldset class="hz-field hz-field--radio-group" data-orientation={orientation}>`
   with a `<legend class="hz-field-label">` (Field-R2), the optional description
   (Field-R4), a `<div class="hz-radio-options" role="radiogroup">`, and the
   optional error (Field-R5). `data-orientation` reflects `orientation` verbatim
   and drives the flex direction (`vertical` default → column,
   `horizontal` → row).
2. **RadioGroup-R2 — Options.** For each `RadioOption` (in array order, keyed by
   index) render a `<div class="hz-radio-option">` containing
   `<input type="radio" id="hz-radio-{uid}-{i}" name={name} value={option.value}>`
   then `<label for="hz-radio-{uid}-{i}">{option.label}</label>`. A per-option
   `disabled: true` applies the native `disabled` attribute to that radio only.
3. **RadioGroup-R3 — Value binding.** `value` is `$bindable`, two-way bound
   across the radio group (each radio `checked` when `option.value === value`),
   default `''`. Selecting a radio updates `value`. The `radiogroup` carries the
   `aria-describedby` chain (Field-R6) and `aria-invalid` on error (Field-R5).
4. **RadioGroup-R4 — Native arrow keys.** Arrow-key navigation between radios is
   native browser behavior (shared `name`); the component adds no custom keydown
   handler. Disabled options are skipped natively.

#### Toggle (`Toggle-R*`)

1. **Toggle-R1 — Switch structure.** Renders
   `<div class="hz-field hz-field--toggle">` containing a
   `<button type="button" role="switch" class="hz-toggle"
   aria-labelledby="hz-label-{uid}">` with a child
   `<span class="hz-toggle-thumb"></span>`, followed by a
   `<label id="hz-label-{uid}" class="hz-field-label">{label}</label>`. It is a
   `role="switch"` button, **not** a checkbox.
2. **Toggle-R2 — Checked state.** `checked` is `$bindable`, default `false`. The
   button carries `aria-checked="true"|"false"` and `data-state="on"|"off"`
   reflecting `checked`. Clicking the button and pressing Enter/Space (native
   button activation) toggle `checked` (and thus `aria-checked`/`data-state`).
3. **Toggle-R3 — describedby.** The button carries the `aria-describedby` chain
   (Field-R6) and, on error, `aria-invalid="true"` (Field-R5). When `disabled`,
   the button gets the native `disabled` attribute (Field-R7).

#### Composition & exports (all components)

1. **Forms-R1 — class composition.** Each root `class` is
   `cx('hz-{component}', className)`: the base class is first and never
   removable. No `class` → exactly the base class; `class="foo bar"` →
   `hz-{component} foo bar`. (RadioGroup/Checkbox/Toggle base classes are
   `hz-field hz-field--radio-group` / `hz-field hz-field--checkbox` /
   `hz-field hz-field--toggle` per Field-R1.)
2. **Forms-R2 — rest forwarding.** `...rest` forwards onto the control element
   (`input`/`textarea`/`select`/`button`/`fieldset` as appropriate), spread
   **first** so component-managed attributes (`id`, `name`, `class`,
   `data-state`, `aria-*`) cannot be clobbered.
3. **Forms-R3 — barrel export.** `TextInput`, `Textarea`, `Select`, `Checkbox`,
   `RadioGroup`, and `Toggle` are exported from `src/lib/components/index.ts`;
   each resolves via `import { … } from '$lib'`; assertions added to
   `exports.spec.ts`. `Field.svelte` is **not** exported.

### Responsive Behavior

- Every field is a full-width block at **all** breakpoints (mobile `<640px`,
  tablet `640–1024px`, desktop `>1024px`). No region hides, reflows, or changes
  interaction pattern by breakpoint.
- RadioGroup `horizontal` is a flex **row** that wraps when it exceeds the
  container; `vertical` (default) is a flex **column**. Orientation is a prop,
  not a breakpoint behavior.
- `inputmode` is exposed on TextInput for mobile keyboard optimization, and
  `autocomplete` for autofill. Minimum touch-target sizing (≥44×44 per the
  architecture baseline) for the control/label hit area is a theme concern; the
  component ships no breakpoint-specific CSS.

### Accessibility (WCAG 2.1 AA)

- Every control has a programmatically associated label — `<label for>` for
  text/textarea/select/checkbox, `<fieldset>`/`<legend>` for RadioGroup,
  `aria-labelledby` for the Toggle switch. Labels are never replaced by
  placeholders (1.3.1, 3.3.2, 4.1.2).
- `aria-describedby` chains the description then the error (Field-R6). Errors use
  `role="alert"` for immediate screen-reader announcement, and invalid controls
  set `aria-invalid="true"` (3.3.1).
- Required controls set `aria-required="true"`; the visual `*` indicator is
  `aria-hidden` so it is not double-announced (3.3.2).
- Disabled controls use the **native `disabled` attribute** (Field-R7), removing
  them from the tab order and from form submission with correct native semantics.
- RadioGroup uses `<fieldset>`/`<legend>` so the group has an accessible name,
  and a `role="radiogroup"` inner container; native radio roving arrow-key
  navigation is preserved and skips disabled options (2.1.1, 4.1.2).
- Toggle uses `role="switch"` + `aria-checked` to convey the on/off semantic
  clearly for settings toggles (4.1.2).
- Prefix/suffix spans are `aria-hidden="true"` (decorative, not meaningful
  content). The Checkbox indeterminate visual is conveyed by the native
  `.indeterminate` property, not a separate ARIA attribute.
- No `outline: none` / focus suppression anywhere; visible focus is a theme
  concern but must not be removed.
- Reduced motion: the components ship no animation; any theme-layer transition
  must respect `prefers-reduced-motion`.
- Color contrast: N/A (no colors shipped).

### Edge Cases & Error States

| Case                                              | Expected behavior                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `error` set                                       | `role="alert"` message renders, `aria-invalid="true"`, `data-state="error"`; the control's value is preserved (Field-R5). |
| `error` **and** `disabled` both set               | `data-state="error"` wins (Field-R1); native `disabled` still applied (Field-R7).                          |
| `description` and `error` both present            | `aria-describedby="hz-desc-{uid} hz-error-{uid}"` in that order (Field-R6).                                 |
| Neither description nor error                     | `aria-describedby` attribute omitted entirely (Field-R6).                                                   |
| `hideLabel` true                                  | Label stays in the DOM with `.sr-only`; remains programmatically associated (Field-R2).                    |
| `maxlength` set and reached                       | Native enforcement only; no custom counter shipped (TextInput-R3, Textarea-R1).                            |
| Select `value === ''`                             | Placeholder option shown and selected; once a real `value` is set the placeholder is not selected (Select-R2). |
| Select with optgroups / disabled options          | `<optgroup label>` wraps its options; `disabled` options render non-selectable (Select-R3).                |
| Checkbox `indeterminate` true                     | `.indeterminate` set on the element ref via `$effect`; a user toggle clears it natively (Checkbox-R3).      |
| RadioGroup `options` empty                        | `<fieldset>`/`<legend>` render with an empty `radiogroup`; no radios; no error (RadioGroup-R1, R2).         |
| RadioGroup option `disabled`                      | That radio gets native `disabled`; arrow navigation skips it natively (RadioGroup-R2, R4).                  |
| Textarea `resize="auto"`, browser lacks `field-sizing` | JS height-sync fallback grows the textarea to its content on input and initial value (Textarea-R3).   |
| Toggle click / Enter / Space                      | Toggles `checked`, `aria-checked`, and `data-state` (Toggle-R2).                                            |
| `value`/`checked` bound externally                | Two-way `$bindable` reflects programmatic changes into the control and user changes back out (per-component value/checked reqs). |
| `...rest` attempts `id`/`name`/`class`/`data-state`/`aria-*` | Component-managed value wins (Forms-R2).                                                          |
| SSR / pre-mount                                   | Static markup renders with initial `value`/`checked`; `indeterminate`, auto-resize sync, and any listeners attach on mount. |

### Existing Code to Reuse

- **Utils:** `cx` and `uid` from `src/lib/utils` (Forms-R1, Field-R1) — do not
  write new class-merging or id logic.
- **Types:** extend `src/lib/types/index.ts` with `FieldBase`, `SelectOption`,
  and `RadioOption` (Field-R8); components import these. Do not redeclare locally.
- **`.sr-only`:** reuse the existing bare `.sr-only` class emitted by
  `Button.svelte` / `Link.svelte` (Field-R2) — do not introduce `.hz-sr-only` or
  a new sr-only mechanism.
- **Component patterns:** `Modal.svelte` (`$bindable` two-way state),
  `Nav.svelte` (`uid` ids, `bind:this` element refs, `$effect` listener
  add/remove with cleanup), `Card.svelte` (`...rest`-first spread,
  `import.meta.env.DEV`/`untrack` dev warnings if any are added).
- **Internal scaffold:** new non-exported `src/lib/components/Field.svelte`
  implementing Field-R1…R7 for TextInput/Textarea/Select; the
  checkbox/radio/toggle variants reproduce the same id + `aria-describedby`
  logic inline.
- **Tokens:** `--hz-space-*` with literal fallbacks, per the Shared Scale in
  `specs/03-layout.md`.
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` to include all six
  components.
- **Test harness:** mirror `Tabs.svelte.spec.ts` / `Accordion.svelte.spec.ts` —
  Vitest browser mode (`vitest-browser-svelte`: `render`, `page.getBy*`,
  `await expect.element`, `createRawSnippet` for snippet props such as
  `prefix`/`suffix`, `userEvent` from `vitest/browser`). `expect.requireAssertions`
  is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file per component
(`TextInput.svelte.spec.ts`, `Textarea.svelte.spec.ts`, `Select.svelte.spec.ts`,
`Checkbox.svelte.spec.ts`, `RadioGroup.svelte.spec.ts`, `Toggle.svelte.spec.ts`;
the `.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). Native control behavior (`bind:value`, `bind:checked`,
`.indeterminate`, native radio arrow keys, `<select>` selection,
`field-sizing`) is asserted in the real browser env. No Playwright e2e (docs
demos are a later sprint).

**Shared scaffold (asserted per component):**

- Field-R1/R2: root `hz-field` (or variant) + `data-state` precedence
  (error > disabled > default); label always in DOM, gains `.sr-only` under
  `hideLabel`.
- Field-R3: `required` → `aria-required="true"` + visible `*` span
  (`aria-hidden`); absent otherwise.
- Field-R4/R5/R6: description renders with `hz-desc` id; error renders with
  `role="alert"` + `hz-error` id + `aria-invalid` + `data-state="error"`;
  `aria-describedby` lists desc then error, omitted when neither present.
- Field-R7: `disabled` → native `disabled` on the control + `data-state` (unless
  error wins); control removed from tab order.
- Field-R8: `FieldBase`/`SelectOption`/`RadioOption` importable from `$lib/types`.

**Per component:**

- TextInput-R1…R5: wrapper + input with `type` reflected; `bind:value` two-way
  (including `type="number"` value stays a string); `placeholder`/`autocomplete`/
  `maxlength`/`pattern`/`inputmode` present only when defined; `prefix`/`suffix`
  snippets render in `aria-hidden` spans with `data-has-prefix`/`data-has-suffix`;
  a forwarded `oninput` handler fires.
- Textarea-R1…R3: `rows` default `3`; `bind:value` two-way; `resize` →
  `data-resize` + CSS mapping; `resize="auto"` auto-grows (assert `field-sizing`
  path, and the JS fallback grows height when `field-sizing` is unsupported —
  exercise the input handler).
- Select-R1…R3: native `<select>` with `bind:value`; placeholder option
  `disabled selected` while `value===''` and not selected after a real choice;
  flat options + `<optgroup>` render in order; disabled options non-selectable.
- Checkbox-R1…R3: input-then-label DOM order; `bind:checked` two-way; `value`
  present only when defined; `indeterminate` reflected on the element ref and
  cleared by a user toggle.
- RadioGroup-R1…R4: `<fieldset>`/`<legend>` + `role="radiogroup"` +
  `data-orientation`; one radio+label per option keyed by index; `bind:value`
  selects the matching radio and updates on change; disabled option gets native
  `disabled`; native arrow keys move selection and skip disabled.
- Toggle-R1…R3: `<button role="switch">` with `aria-labelledby` + thumb span +
  trailing label; `aria-checked`/`data-state` reflect `checked`; click and
  Enter/Space toggle; `aria-describedby`/`aria-invalid`/native `disabled` honored.
- Forms-R1: no `class` → exactly the base class; `class="foo bar"` appended
  after the base.
- Forms-R2: `...rest` (e.g. `data-testid`) forwarded; override attempt on
  `id`/`name`/`class`/`data-state` → managed wins.
- Forms-R3: extend `exports.spec.ts` to assert each of the six resolves from
  `$lib`, plus a smoke render of each.

**Integration (browser):** Tab order reaches each enabled control and skips
disabled ones; typing into TextInput/Textarea updates the bound value and a
parent reflecting it; selecting a Select option / a radio updates the bound
value; toggling Checkbox/Toggle flips bound `checked`; setting an `error`
surfaces the `role="alert"` message and `aria-invalid`, and `aria-describedby`
points the control at the live error text.

### Out of Scope

- Validation logic, schema validation, form-level orchestration, or `FormData`
  handling — components present an externally-supplied `error` string only.
- A custom dropdown/listbox for Select (native `<select>` only); combobox,
  autocomplete, typeahead, or multi-select.
- Character counters, masked inputs, custom number steppers, and date / file /
  range / color pickers.
- Colors, borders, shadows, radius, fonts, checkbox/toggle/radio visuals,
  focus-ring styling, or any state **animation** — the reference theme's job. The
  components only guarantee stable `hz-*` hooks + `data-state`.
- A context/store API for cross-field coordination, and any custom
  `onChange`-style callback props (native events flow through `...rest`).
- Form-level error aggregation / submit orchestration — see the `Form`
  error-summary provider (`specs/14-form.md`), which resolves fields natively via
  `form.elements[name]` and needs no coupling to these primitives.
- Docs demo routes and Playwright e2e — later sprint.
