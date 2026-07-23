/** Hero's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const heroDoc: ComponentDoc = {
	description:
		'A section component for page heroes supporting center, split, and overlay layouts. Text slots accept plain strings or snippets; in the overlay layout, media becomes the full-bleed background.',
	importLine: 'import {Hero} from "@hyzer-labs/ui"',
	props: [
		{ name: 'layout', type: "'center' | 'split' | 'overlay'", default: "'center'" },
		{ name: 'height', type: "'auto' | 'screen' | 'half'", default: "'auto'" },
		{ name: 'align', type: "'start' | 'center' | 'end'", default: "'center'" },
		{
			name: 'reverseOnMobile',
			type: 'boolean',
			default: 'false',
			note: 'Split layout only: media renders above content while the split is stacked.'
		},
		{ name: 'headingLevel', type: '1 | 2 | 3 | 4 | 5 | 6', default: '1' },
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			note: 'Accessible name when no title is provided.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-hero class.' },
		{
			name: 'eyebrow',
			type: 'string | Snippet',
			default: '—',
			note: 'String for plain text; snippet for inner markup.'
		},
		{ name: 'title', type: 'string | Snippet', default: '—' },
		{ name: 'subtitle', type: 'string | Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' },
		{
			name: 'media',
			type: 'Snippet',
			default: '—',
			note: 'Beside/below content in center/split; becomes the background in overlay.'
		}
	],
	a11yNote:
		'Hero renders a `<section>` with `aria-labelledby` pointing to the title element, or `aria-label` when no title is provided. Use `headingLevel` to keep the page heading hierarchy correct — the docs shell sets the h1, so hero titles inside a page should typically be level 2.'
};
