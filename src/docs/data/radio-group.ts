/** RadioGroup's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const radioGroupDoc: ComponentDoc = {
	importLine: 'import { RadioGroup } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Shared by every radio in the group.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Rendered as the fieldset legend; sr-only with hideLabel.'
		},
		{
			name: 'options',
			type: 'FormOption[]',
			default: '—',
			note: 'Required. See FormOption below.'
		},
		{ name: 'value', type: 'string', default: "''", note: 'Bindable. The selected option value.' },
		{ name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'" },
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the legend.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false', note: 'Disables the whole group.' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--radio-group classes.'
		}
	],
	types: [
		{
			name: 'FormOption',
			props: [
				{ name: 'value', type: 'string', default: '—', note: 'Required.' },
				{ name: 'label', type: 'string', default: '—', note: 'Required.' },
				{ name: 'disabled', type: 'boolean', default: '—', note: 'Disables only this option.' }
			]
		}
	],
	a11yNote:
		'The group is a `<fieldset>` whose `label` renders as the `<legend>`. With `hideLabel`, the legend stays in the DOM as screen-reader-only text. Each radio has its own label.\n\nThe options sit in an inner `role="radiogroup"` container that carries `aria-describedby` (description first, then error), `aria-invalid` on error, and `aria-required` when required.\n\nArrow-key movement between radios is native browser behavior.',
	a11yLinks: [
		{ label: 'APG Radio Group pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/' },
		{
			label: 'MDN: <input type="radio">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio'
		}
	]
};
