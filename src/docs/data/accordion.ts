/** Accordion's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const accordionDoc: ComponentDoc = {
	importLine: 'import { Accordion } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'items',
			type: 'AccordionItem[]',
			default: '—',
			note: 'Required. See AccordionItem below.'
		},
		{ name: 'type', type: "'single' | 'multiple'", default: "'single'" },
		{ name: 'defaultOpen', type: 'string | string[]', default: '[]' },
		{
			name: 'collapsible',
			type: 'boolean',
			default: 'true',
			note: 'false keeps one panel open in single mode.'
		},
		{ name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3' },
		{
			name: 'panel',
			type: 'Snippet<[AccordionItem]>',
			default: '—',
			note: 'Required. Renders each panel.'
		},
		{ name: 'icon', type: 'Snippet', default: '—', note: 'Replaces the default chevron.' },
		{ name: 'onToggle', type: '(openIds: string[]) => void', default: '—' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-accordion class.' }
	],
	types: [
		{
			name: 'AccordionItem',
			props: [
				{ name: 'id', type: 'string', default: '—', note: 'Required. Must be unique.' },
				{
					name: 'title',
					type: 'string | Snippet',
					default: '—',
					note: 'Required. String for plain text; snippet for inner markup.'
				},
				{ name: 'disabled', type: 'boolean', default: 'false' }
			]
		}
	],
	a11yNote:
		"Built on native `<details>`, so no ARIA is needed for disclosure semantics. Arrow keys navigate between summaries, and Home/End jump to the first/last.\n\nDisabled items have `aria-disabled='true'` and block interaction. Summaries wrap a real heading (`headingLevel`) so panels join the document outline.",
	a11yLinks: [
		{ label: 'APG Accordion pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/' }
	]
};
