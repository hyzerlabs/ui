/** Modal's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const modalDoc: ComponentDoc = {
	description:
		'An accessible dialog built on the native <dialog> element with focus trap, Esc-to-close, scroll lock, and configurable sizes.',
	importLine: 'import { Modal } from "@hyzer-labs/ui"',
	props: [
		{ name: 'title', type: 'string', default: '—', note: 'Required for accessibility.' },
		{ name: 'open', type: 'boolean', default: 'false', note: '$bindable.' },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'size', type: "'sm' | 'md' | 'lg' | 'full'", default: "'md'" },
		{
			name: 'closeOnOverlay',
			type: 'boolean',
			default: 'true',
			note: 'Esc always closes regardless — the dialog pattern requires it.'
		},
		{ name: 'showClose', type: 'boolean', default: 'true' },
		{ name: 'preventScroll', type: 'boolean', default: 'true' },
		{ name: 'closeLabel', type: 'string', default: "'Close dialog'" },
		{ name: 'onclose', type: '() => void', default: '—' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-modal class.' },
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' }
	],
	a11yNote:
		"Modal uses `showModal()` for native top-layer focus trapping and backdrop. `aria-modal`, `aria-labelledby`, and optional `aria-describedby` are set automatically. Focus returns to the trigger on close. The built-in close button's accessible name comes from `closeLabel`.",
	a11yLinks: [
		{
			label: 'APG Dialog (Modal) pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/'
		},
		{
			label: 'MDN: <dialog>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog'
		}
	]
};
