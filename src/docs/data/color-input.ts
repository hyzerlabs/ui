/** ColorInput's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const colorInputDoc: ComponentDoc = {
	importLine: 'import { ColorInput } from "@hyzer-labs/ui"',
	props: [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{
			name: 'value',
			type: 'string',
			default: "'#000000'",
			note: 'Bindable. The platform normalizes to 7-char lowercase hex.'
		},
		{
			name: 'showInput',
			type: 'boolean',
			default: 'true',
			note: 'Renders the exact-entry hex field beside the swatch.'
		},
		{
			name: 'inputLabel',
			type: 'string',
			default: '`${label} (hex value)`',
			note: 'Accessible name for the hex field.'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false', note: 'Label indicator only.' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--color classes.'
		}
	],
	a11yNote:
		"The color input is the labeled (`id`/`for`), named, form-participating control. Activating it opens the platform picker, which owns the picking experience.\n\nThe hex field is an exact-entry affordance with its own accessible name (`inputLabel`) and no `name` — it never submits.\n\n`description` and `error` chain into `aria-describedby`, description first, and an `error` sets `aria-invalid`. `required` renders the label indicator only, since a color input always holds a value.\n\nDon't let color alone carry meaning — the visible hex value helps.",
	a11yLinks: [
		{
			label: 'MDN: <input type="color">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color'
		}
	]
};
