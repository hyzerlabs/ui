/** Link's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const linkDoc: ComponentDoc = {
	importLine: 'import { Link } from "@hyzer-labs/ui"',
	props: [
		{ name: 'href', type: 'string', default: '—', note: 'Required.' },
		{ name: 'external', type: 'boolean', default: 'false' },
		{
			name: 'externalIcon',
			type: 'boolean',
			default: 'true',
			note: 'Auto external glyph; iconEnd replaces it, false suppresses it.'
		},
		{ name: 'variant', type: "'default' | 'subtle' | 'nav'", default: "'default'" },
		{ name: 'ariaCurrent', type: "'page' | 'step' | 'true'", default: '—' },
		{ name: 'ariaLabel', type: 'string', default: '—' },
		{ name: 'onclick', type: '(e: MouseEvent) => void', default: '—' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-link class.' },
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'iconStart', type: 'Snippet', default: '—' },
		{ name: 'iconEnd', type: 'Snippet', default: '—' }
	],
	a11yNote:
		'External links automatically add `target="_blank"`, `rel="noopener noreferrer"`, a decorative external glyph, and a visually-hidden "(opens in new tab)" string. `ariaCurrent` sets `aria-current` on the anchor for nav links.',
	a11yLinks: [
		{ label: 'APG Link pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/link/' },
		{ label: 'MDN: <a>', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a' }
	]
};
