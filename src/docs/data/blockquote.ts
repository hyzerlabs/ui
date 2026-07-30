/** Blockquote's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const blockquoteDoc: ComponentDoc = {
	importLine: 'import { Blockquote } from "@hyzer-labs/ui"',
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
		{
			name: 'intent',
			type: 'Intent',
			default: '—',
			note: 'See Foundation → Colors & Intent.',
			noteHref: '/docs/foundation/colors#intent'
		},
		{
			name: 'intentScope',
			type: "'line' | 'full'",
			default: "'line'",
			note: 'Only relevant with intent set. line colors just the accent line; full also colors the quote text. Attribution stays muted either way.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-blockquote class.' }
	],
	a11yNote:
		'The root is always a `<figure>` wrapping a `<blockquote>`. When `cite` is provided, the attribution renders in a `<figcaption><cite>` outside the quote, so screen readers do not announce it as part of the quotation itself.\n\nNo ARIA is added: the native `figure`/`blockquote`/`figcaption`/`cite` elements carry all the semantics.\n\nThe decorative em-dash before the attribution is a theme `::before` pseudo-element, so it never enters the accessible name.',
	a11yLinks: [
		{
			label: 'MDN: <blockquote>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote'
		}
	]
};
