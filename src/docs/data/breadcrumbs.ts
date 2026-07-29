/** Breadcrumbs's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const breadcrumbsDoc: ComponentDoc = {
	importLine: 'import { Breadcrumbs } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'items',
			type: 'BreadcrumbItem[]',
			default: '—',
			note: 'Required. See BreadcrumbItem below.'
		},
		{ name: 'ariaLabel', type: 'string', default: "'Breadcrumb'" },
		{
			name: 'separator',
			type: 'Snippet',
			default: '—',
			note: 'Replaces the chevron between items; rendered aria-hidden.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-breadcrumbs class.' }
	],
	types: [
		{
			name: 'BreadcrumbItem',
			props: [
				{ name: 'label', type: 'string', default: '—', note: 'Required.' },
				{
					name: 'href',
					type: 'string',
					default: '—',
					note: 'Omit on the last item to render the current page as plain text.'
				},
				{
					name: 'external',
					type: 'boolean',
					default: '—',
					note: 'Adds the external-link treatment.'
				},
				{
					name: 'ariaCurrent',
					type: "'page' | 'step' | 'true'",
					default: '—',
					note: 'The last item gets aria-current="page" automatically; set this to override.'
				}
			]
		}
	],
	a11yNote:
		'Breadcrumbs renders a `<nav aria-label="Breadcrumb">` landmark wrapping an ordered list. The last item is the current page — `aria-current="page"` is applied automatically (as plain text when it has no `href`). Separators are decorative and `aria-hidden`.',
	a11yLinks: [
		{
			label: 'APG Breadcrumb pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/'
		}
	]
};
