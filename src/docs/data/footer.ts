/** Footer's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const footerDoc: ComponentDoc = {
	importLine: 'import { Footer } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'columns',
			type: 'FooterColumn[]',
			default: '—',
			note: 'Required. See FooterColumn below.'
		},
		{ name: 'variant', type: "'default' | 'minimal'", default: "'default'" },
		{
			name: 'bordered',
			type: 'boolean',
			default: 'false',
			note: 'Top hairline — composes with any variant.'
		},
		{
			name: 'linkVariant',
			type: "'default' | 'subtle' | 'nav'",
			default: "'subtle'",
			note: 'Passed through to every column Link.'
		},
		{
			name: 'headingLevel',
			type: '2 | 3 | 4 | 5 | 6',
			default: '2',
			note: 'Heading element for column titles — match your page hierarchy.'
		},
		{ name: 'logo', type: 'Snippet', default: '—', note: 'Rendered above the columns.' },
		{
			name: 'social',
			type: 'Snippet',
			default: '—',
			note: 'Icon-link row rendered under the columns.'
		},
		{
			name: 'bottom',
			type: 'Snippet',
			default: '—',
			note: 'Bottom bar with a top hairline — copyright, legal links.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-footer class.' }
	],
	types: [
		{
			name: 'FooterColumn',
			props: [
				{
					name: 'title',
					type: 'string',
					default: '—',
					note: 'Required. Labels the column’s nav landmark.'
				},
				{
					name: 'links',
					type: 'NavItem[]',
					default: '—',
					note: 'Required. label/href/external/ariaCurrent apply — see NavItem on the Nav page.'
				}
			]
		}
	],
	a11yNote:
		"Each column is a `<nav>` landmark with `aria-label` set to its title — the visible heading repeats the same text but isn't what names the landmark. Set `headingLevel` to match your page hierarchy. Links use the Link component, and icon-only social links need an `ariaLabel`."
};
