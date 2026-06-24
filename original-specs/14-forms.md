# Forms & Inputs

A collection of form primitives sharing a consistent structure and validation pattern.

---

## Shared Field Props (all input types)

| Prop        | Type                  | Default    |
| ----------- | --------------------- | ---------- |
| name        | `string`              | _required_ |
| label       | `string`              | _required_ |
| description | `string \| undefined` | —          |
| error       | `string \| undefined` | —          |
| required    | `boolean`             | `false`    |
| disabled    | `boolean`             | `false`    |
| hideLabel   | `boolean`             | `false`    |

## Shared Field Structure

Every input renders inside a consistent wrapper:

```html
<div class="hz-field" data-state="error | disabled | default">
	<label class="hz-field-label" for="hz-input-{uid}">
		{label} {#if required}<span aria-hidden="true" class="hz-field-required">*</span>{/if}
	</label>
	{#if hideLabel}
	<!-- label has .hz-sr-only applied — always present in DOM -->
	{/if} {#if description}
	<p class="hz-field-description" id="hz-desc-{uid}">{description}</p>
	{/if}

	<!-- input element with aria-describedby="hz-desc-{uid} hz-error-{uid}" -->

	{#if error}
	<p class="hz-field-error" id="hz-error-{uid}" role="alert">{error}</p>
	{/if}
</div>
```

Labels are **always** present in the DOM. `hideLabel` applies `sr-only` to visually hide the label while keeping it accessible to screen readers. The component never ships without a label — if you don't want visible labels, you must explicitly opt in to hiding them.

---

## TextInput

| Prop         | Type                                                                        | Default  |
| ------------ | --------------------------------------------------------------------------- | -------- |
| type         | `'text' \| 'email' \| 'password' \| 'tel' \| 'url' \| 'search' \| 'number'` | `'text'` |
| value        | `string`                                                                    | `''`     |
| placeholder  | `string \| undefined`                                                       | —        |
| autocomplete | `string \| undefined`                                                       | —        |
| maxlength    | `number \| undefined`                                                       | —        |
| pattern      | `string \| undefined`                                                       | —        |
| inputmode    | `string \| undefined`                                                       | —        |

**Bindable:** `bind:value`

**Slots:** `prefix` (icon/text before input), `suffix` (icon/text after input)

```html
<div class="hz-field">
	<label for="hz-input-{uid}">{label}</label>
	<div class="hz-input-wrapper">
		<span class="hz-input-prefix" aria-hidden="true"><!-- prefix slot --></span>
		<input
			id="hz-input-{uid}"
			type="text"
			name="..."
			aria-required="true"
			aria-invalid="true"
			aria-describedby="hz-desc-{uid} hz-error-{uid}"
		/>
		<span class="hz-input-suffix" aria-hidden="true"><!-- suffix slot --></span>
	</div>
</div>
```

**Data attributes:** `data-state="default | error | disabled"`, `data-has-prefix`, `data-has-suffix`

---

## Textarea

| Prop      | Type                                       | Default      |
| --------- | ------------------------------------------ | ------------ |
| value     | `string`                                   | `''`         |
| rows      | `number`                                   | `3`          |
| resize    | `'none' \| 'vertical' \| 'both' \| 'auto'` | `'vertical'` |
| maxlength | `number \| undefined`                      | —            |

**Bindable:** `bind:value`

`resize="auto"` grows the textarea to fit content using a hidden mirror element or `field-sizing: content` where supported.

---

## Select

| Prop        | Type             | Default       |
| ----------- | ---------------- | ------------- |
| options     | `SelectOption[]` | _required_    |
| value       | `string`         | `''`          |
| placeholder | `string`         | `'Select...'` |

`SelectOption`: `{ value: string, label: string, disabled?: boolean }` or `{ group: string, options: SelectOption[] }` for optgroups.

Uses the **native `<select>` element**. Not a custom dropdown. Native selects are more accessible, more performant, and work correctly on every device and assistive technology. The consumer's CSS targets data attributes and the native element for visual customization.

```html
<select id="hz-input-{uid}" name="..." aria-describedby="hz-desc-{uid}">
	<option value="" disabled selected>{placeholder}</option>
	<option value="...">...</option>
	<optgroup label="...">
		<option value="...">...</option>
	</optgroup>
</select>
```

---

## Checkbox

| Prop          | Type                  | Default |
| ------------- | --------------------- | ------- |
| checked       | `boolean`             | `false` |
| indeterminate | `boolean`             | `false` |
| value         | `string \| undefined` | —       |

**Bindable:** `bind:checked`

Uses a native `<input type="checkbox">`. The `indeterminate` state is set via JavaScript on the element ref (it's not an HTML attribute).

```html
<div class="hz-field hz-field--checkbox">
	<input type="checkbox" id="hz-input-{uid}" name="..." aria-describedby="..." />
	<label for="hz-input-{uid}">{label}</label>
</div>
```

Note: for Checkbox and Radio, the label comes **after** the input in DOM order (conventional placement for checkboxes/radios).

---

## Radio Group

| Prop        | Type                                                     | Default      |
| ----------- | -------------------------------------------------------- | ------------ |
| options     | `{ value: string, label: string, disabled?: boolean }[]` | _required_   |
| value       | `string`                                                 | `''`         |
| orientation | `'horizontal' \| 'vertical'`                             | `'vertical'` |

**Bindable:** `bind:value`

Renders as a `<fieldset>` with `<legend>` (using the `label` prop from shared field props):

```html
<fieldset class="hz-field hz-field--radio-group" data-orientation="vertical">
	<legend class="hz-field-label">{label}</legend>
	{#if description}
	<p class="hz-field-description" id="hz-desc-{uid}">{description}</p>
	{/if}
	<div class="hz-radio-options" role="radiogroup" aria-describedby="hz-desc-{uid}">
		<div class="hz-radio-option">
			<input type="radio" id="hz-radio-{uid}-{value}" name="..." value="..." />
			<label for="hz-radio-{uid}-{value}">{option.label}</label>
		</div>
		<!-- ...more options -->
	</div>
	{#if error}
	<p class="hz-field-error" id="hz-error-{uid}" role="alert">{error}</p>
	{/if}
</fieldset>
```

Keyboard: arrow keys move between radio options within the group (native behavior).

---

## Toggle / Switch

| Prop    | Type      | Default |
| ------- | --------- | ------- |
| checked | `boolean` | `false` |

**Bindable:** `bind:checked`

Renders as `<button role="switch" aria-checked="true|false">`. Not a checkbox — the switch role communicates the on/off semantic more clearly for toggling settings.

```html
<div class="hz-field hz-field--toggle">
	<button
		role="switch"
		aria-checked="false"
		aria-labelledby="hz-label-{uid}"
		aria-describedby="hz-desc-{uid}"
		class="hz-toggle"
		data-state="off"
	>
		<span class="hz-toggle-thumb"></span>
	</button>
	<label id="hz-label-{uid}" class="hz-field-label">{label}</label>
</div>
```

---

## Accessibility (all form components)

- Every input has an associated `<label>` — never placeholder-as-label
- `aria-describedby` chains: description ID + error ID when both present
- Errors use `role="alert"` for immediate screen reader announcement
- Required fields: `aria-required="true"` on the input, visual indicator on label
- Invalid fields: `aria-invalid="true"` when error is present
- Disabled: `aria-disabled="true"` — allows screen reader focus while preventing interaction
- Fieldsets group related inputs (radio groups, checkbox groups)
- `autocomplete` prop exposed for autofill support
- `inputmode` exposed for mobile keyboard optimization
- Prefix/suffix slots are `aria-hidden="true"` — they're visual decoration, not meaningful content
