/** TextInput's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const textInputDoc: ComponentDoc = {
	description:
		'A labeled single-line input covering the common HTML input types, with description, inline error, and decorative prefix/suffix slots.',
	importLine: 'import { TextInput } from "@hyzer-labs/ui"',
	props: [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{
			name: 'type',
			type: "'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date' | 'time' | 'datetime-local'",
			default: "'text'",
			note: 'Date/time types render the native platform picker.'
		},
		{ name: 'value', type: 'string', default: "''", note: 'Bindable.' },
		{ name: 'placeholder', type: 'string', default: '—' },
		{
			name: 'autocomplete',
			type: "HTMLInputAttributes['autocomplete']",
			default: '—',
			note: 'Native autofill hint, e.g. "email", "name".'
		},
		{ name: 'maxlength', type: 'number', default: '—' },
		{ name: 'pattern', type: 'string', default: '—', note: 'Native validation regex.' },
		{
			name: 'inputmode',
			type: "HTMLInputAttributes['inputmode']",
			default: '—',
			note: 'Virtual-keyboard hint, e.g. "numeric", "tel".'
		},
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
			name: 'prefix',
			type: 'Snippet',
			default: '—',
			note: 'Decorative leading content (icon, symbol); rendered aria-hidden.'
		},
		{
			name: 'suffix',
			type: 'Snippet',
			default: '—',
			note: 'Decorative trailing content (unit, icon); rendered aria-hidden.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-field class.' }
	],
	a11yNote:
		'The input is associated with its label via `id`/`for`. With `hideLabel`, the label stays in the DOM as screen-reader-only text.\n\n`description` and `error` chain into `aria-describedby`, description first. `required` sets `aria-required`, and an `error` sets `aria-invalid`.\n\n`prefix` and `suffix` are rendered `aria-hidden` — keep them decorative, and put any meaning in the label or description instead.',
	a11yLinks: [
		{
			label: 'MDN: <input>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input'
		}
	]
};
