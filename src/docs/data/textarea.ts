/** Textarea's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const textareaDoc: ComponentDoc = {
	description:
		'A labeled multi-line text area with configurable resize behavior — including an auto-grow mode — plus description and inline error.',
	importLine: 'import {Textarea} from "@hyzer-labs/ui"',
	props: [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{ name: 'value', type: 'string', default: "''", note: 'Bindable.' },
		{ name: 'rows', type: 'number', default: '3' },
		{
			name: 'resize',
			type: "'none' | 'vertical' | 'both' | 'auto'",
			default: "'vertical'",
			note: "'vertical' and 'auto' grow with content; 'vertical' keeps the drag handle, 'auto' hides it. rows is the minimum height."
		},
		{ name: 'maxlength', type: 'number', default: '—' },
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
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-field class.' }
	],
	a11yNote:
		'The textarea is associated with its label via `id`/`for`; with `hideLabel` the label stays in the DOM as screen-reader-only text. `description` and `error` chain into `aria-describedby` (description first). `required` sets `aria-required` and an `error` sets `aria-invalid`.',
	a11yLinks: [
		{
			label: 'MDN: <textarea>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea'
		}
	]
};
