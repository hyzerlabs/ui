/** Toggle's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const toggleDoc: ComponentDoc = {
	description:
		'A switch for binary on/off settings — a native checkbox exposed with the switch role, so it submits a form value like any other field.',
	importLine: 'import {Toggle} from "@hyzer-labs/ui"',
	props: [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{ name: 'checked', type: 'boolean', default: 'false', note: 'Bindable.' },
		{ name: 'value', type: 'string', default: '—', note: 'Submitted value when on.' },
		{ name: 'description', type: 'string', default: '—', note: 'Help text on its own row.' },
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
			note: 'Merged after the hz-field hz-field--toggle classes.'
		}
	],
	a11yNote:
		'Toggle renders an `<input type="checkbox" role="switch">` associated with its label via `id`/`for` — screen readers announce it as a switch while the native checked state, keyboard behavior (Space toggles; Enter submits the form), and form participation all come from the platform. `description` and `error` chain into `aria-describedby` (description first). Reach for Toggle over `Checkbox` when the setting reads as on/off rather than selected/unselected.',
	a11yLinks: [
		{ label: 'APG Switch pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/' },
		{
			label: 'MDN: switch role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/switch_role'
		}
	]
};
