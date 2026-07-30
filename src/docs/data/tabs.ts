/** Tabs's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const tabsDoc: ComponentDoc = {
	importLine: 'import { Tabs } from "@hyzer-labs/ui"',
	props: [
		{ name: 'items', type: 'TabItem[]', default: '—', note: 'Required. See TabItem below.' },
		{ name: 'ariaLabel', type: 'string', default: '—', note: 'Required. Labels the tablist.' },
		{ name: 'defaultTab', type: 'string', default: '—', note: 'ID of the initially active tab.' },
		{ name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'" },
		{
			name: 'activation',
			type: "'auto' | 'manual'",
			default: "'auto'",
			note: 'auto activates on arrow-key focus; manual waits for Enter/Space.'
		},
		{
			name: 'panel',
			type: 'Snippet<[TabItem]>',
			default: '—',
			note: 'Required. Renders each panel.'
		},
		{ name: 'onChange', type: '(activeId: string) => void', default: '—' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-tabs class.' }
	],
	types: [
		{
			name: 'TabItem',
			props: [
				{ name: 'id', type: 'string', default: '—', note: 'Required. Must be unique.' },
				{
					name: 'label',
					type: 'string | Snippet',
					default: '—',
					note: 'Required. String for plain text; snippet for inner markup.'
				},
				{ name: 'disabled', type: 'boolean', default: 'false' }
			]
		}
	],
	a11yNote:
		"Implements the WAI-ARIA tabs pattern: `role='tablist'/'tab'/'tabpanel'`, `aria-selected`, and roving `tabindex`. Tab is one stop for the whole tablist, and arrow keys move between triggers, with Home/End jumping to the first/last.\n\nPanels are only their own tab stop when they contain no focusable content. `ariaLabel` is required to name the tablist.\n\nDisabled tabs stay focusable via arrows but carry `aria-disabled='true'` and never activate.",
	a11yLinks: [{ label: 'APG Tabs pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' }]
};
