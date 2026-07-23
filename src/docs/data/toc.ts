/** Toc's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const tocDoc: ComponentDoc = {
	description:
		"A navigation rail: automatic heading collection, nested levels, scroll-spy, smooth scroll, and an optional mobile collapse — the docs site's own 'On this page' rail (R9), generalized behind props.",
	importLine: 'import {Toc} from "@hyzer-labs/ui"',
	props: [
		{
			name: 'container',
			type: 'string | HTMLElement',
			default: "'main'",
			note: 'Selector or element to collect headings from.'
		},
		{
			name: 'levels',
			type: 'number[]',
			default: '[2]',
			note: 'Heading levels to collect — 2 for h2, 3 for h3, and so on.'
		},
		{
			name: 'exclude',
			type: 'string',
			default: '—',
			note: 'Headings inside a match are skipped (e.g. demo/example regions).'
		},
		{
			name: 'minEntries',
			type: 'number',
			default: '2',
			note: 'Renders nothing below this many entries — a single link is not navigation.'
		},
		{ name: 'title', type: 'string', default: "'On this page'", note: "'' hides it." },
		{
			name: 'ariaLabel',
			type: 'string',
			default: '— (defaults to title)',
			note: 'Names the nav landmark.'
		},
		{
			name: 'autoId',
			type: 'boolean',
			default: 'true',
			note: 'Slugify id-less headings (kebab, deduped with -2, -3 …). false skips them instead.'
		},
		{
			name: 'watch',
			type: 'boolean',
			default: 'true',
			note: 'Re-collects on DOM mutation (a MutationObserver on container, debounced). No framework coupling — no $app/* import, so it works the same in any SvelteKit or plain-Svelte app.'
		},
		{
			name: 'smoothScroll',
			type: 'boolean',
			default: 'true',
			note: 'Instant under prefers-reduced-motion regardless.'
		},
		{
			name: 'breakpoint',
			type: "'sm' | 'md' | 'lg' | 'none'",
			default: "'none'",
			note: 'Collapses into a disclosure below this width (640/968/1200px). none never collapses.'
		},
		{
			name: 'active',
			type: 'string',
			default: "''",
			note: 'Bindable id of the current heading (scroll-spy — or the last clicked link).'
		},
		{
			name: 'onActive',
			type: '(id: string) => void',
			default: '—',
			note: 'Fires when the active heading changes — not on every scroll frame.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-toc class.' }
	],
	types: [
		{
			name: 'TocEntry',
			props: [
				{
					name: 'id',
					type: 'string',
					default: '—',
					note: "The heading's id — its own, or an autoId slug."
				},
				{
					name: 'label',
					type: 'string',
					default: '—',
					note: "The heading's trimmed text content."
				},
				{
					name: 'level',
					type: 'number',
					default: '—',
					note: 'The collected heading level (2, 3, …).'
				}
			]
		}
	],
	a11yNote:
		'The root is a `nav` landmark named by `ariaLabel` (which defaults to `title`) — give every Toc on a page a distinct name if there\'s more than one. The active entry carries `aria-current="location"`, updated by the scroll-spy and by clicking a link. In collapse mode the trigger is a real disclosure button (`aria-expanded`/`aria-controls`); `Escape` closes it and returns focus to the trigger, and an outside click closes it without stealing focus from wherever the click landed. Motion respects `prefers-reduced-motion`: `smoothScroll` degrades to an instant jump automatically.',
	a11yLinks: [
		{
			label: 'APG Disclosure pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/'
		},
		{
			label: 'MDN: aria-current',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current'
		}
	]
};
