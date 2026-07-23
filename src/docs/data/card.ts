/** Card's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const cardDoc: ComponentDoc = {
	description:
		'A content container with optional media, actions, horizontal layout, and clickable-overlay support.',
	importLine: 'import {Card} from "@hyzer-labs/ui"',
	props: [
		{ name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'rounded', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'href', type: 'string', default: '—', note: 'Makes the whole card clickable.' },
		{ name: 'ariaLabel', type: 'string', default: '—', note: 'Required when href is set.' },
		{ name: 'horizontal', type: 'boolean', default: 'false' },
		{ name: 'mediaPosition', type: "'start' | 'end'", default: "'start'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-card class.' },
		{ name: 'media', type: 'Snippet', default: '—' },
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' }
	],
	a11yNote:
		'When `href` is set the entire card is wrapped in a link — supply `ariaLabel` with a descriptive name. Inner interactive elements remain clickable above the overlay via z-index.'
};
