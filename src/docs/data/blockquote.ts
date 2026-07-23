/** Blockquote's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const blockquoteDoc: ComponentDoc = {
	description:
		'A semantic quote: a figure wrapping a blockquote, with an optional visible attribution and an optional machine-readable source URL.',
	importLine: 'import {Blockquote} from "@hyzer-labs/ui"',
	props: [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The quoted content.' },
		{
			name: 'cite',
			type: 'string | Snippet',
			default: '—',
			note: 'Visible attribution, rendered in a <cite> outside the quote.'
		},
		{
			name: 'citeUrl',
			type: 'string',
			default: '—',
			note: 'Source URL — sets the blockquote cite attribute; never rendered as text.'
		},
		{
			name: 'align',
			type: "'start' | 'center' | 'end'",
			default: "'start'",
			note: 'Aligns the attribution row under the quote; the quote body is untouched.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-blockquote class.' }
	],
	a11yNote:
		"The root is always a `<figure>` wrapping a `<blockquote>`; when `cite` is provided, the attribution renders in a `<figcaption><cite>` outside the quote, so screen readers don't announce it as part of the quotation itself. No ARIA is added — the native `figure`/`blockquote`/`figcaption`/`cite` elements carry all the semantics. The decorative em-dash before the attribution is a theme `::before` pseudo-element, so it never enters the accessible name.",
	a11yLinks: [
		{
			label: 'MDN: <blockquote>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote'
		}
	]
};
