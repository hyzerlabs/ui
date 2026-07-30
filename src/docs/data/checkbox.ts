/** Checkbox's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const checkboxDoc: ComponentDoc = {
	importLine: 'import { Checkbox } from "@hyzer-labs/ui"',
	props: [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{ name: 'checked', type: 'boolean', default: 'false', note: 'Bindable.' },
		{
			name: 'indeterminate',
			type: 'boolean',
			default: 'false',
			note: 'Set via the DOM .indeterminate property; visual only, checked is unaffected.'
		},
		{ name: 'value', type: 'string', default: '—', note: 'Submitted value when checked.' },
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--checkbox classes.'
		}
	],
	a11yNote:
		'The input is associated with its label via `id`/`for` (the label renders after the box). `description` and `error` chain into `aria-describedby`, description first. `required` sets `aria-required`, and an `error` sets `aria-invalid`.\n\n`indeterminate` is applied through the DOM `.indeterminate` property, so screen readers announce the mixed state natively.',
	a11yLinks: [
		{ label: 'APG Checkbox pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/' },
		{
			label: 'MDN: <input type="checkbox">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox'
		}
	]
};
