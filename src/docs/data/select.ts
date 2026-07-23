/** Select's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const selectDoc: ComponentDoc = {
	description:
		'A labeled native select with flat options, option groups, a placeholder option, and standard field accessibility.',
	importLine: 'import {Select} from "@hyzer-labs/ui"',
	props: [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{
			name: 'options',
			type: 'SelectOption[]',
			default: '—',
			note: 'Required. Flat options and optgroups mix freely — see SelectOption below.'
		},
		{
			name: 'multiple',
			type: 'boolean',
			default: 'false',
			note: 'Renders the native multiple attribute; switches value to string[].'
		},
		{
			name: 'value',
			type: 'string | string[]',
			default: "'' (single) / [] (multiple)",
			note: 'Bindable. A discriminated union on multiple: string when omitted/false, string[] when true.'
		},
		{
			name: 'placeholder',
			type: 'string',
			default: "'Select...'",
			note: 'Rendered as a disabled leading option.'
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
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-field class.' }
	],
	types: [
		{
			name: 'FormOption',
			props: [
				{ name: 'value', type: 'string', default: '—', note: 'Required.' },
				{ name: 'label', type: 'string', default: '—', note: 'Required.' },
				{ name: 'disabled', type: 'boolean', default: '—', note: '—' }
			]
		},
		{
			name: 'SelectOption (group arm)',
			props: [
				{
					name: 'group',
					type: 'string',
					default: '—',
					note: 'Group form: renders an <optgroup> with this label.'
				},
				{
					name: 'options',
					type: 'FormOption[]',
					default: '—',
					note: 'Group form: the flat options inside the group.'
				}
			]
		}
	],
	a11yNote:
		'The select is associated with its label via `id`/`for`; with `hideLabel` the label stays in the DOM as screen-reader-only text. `description` and `error` chain into `aria-describedby` (description first). `required` sets `aria-required` and an `error` sets `aria-invalid`. The control is the native `<select>`, so keyboard and assistive-tech behavior come from the platform.',
	a11yLinks: [
		{
			label: 'MDN: <select>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select'
		}
	]
};
