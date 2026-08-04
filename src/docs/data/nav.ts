/** Nav's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const navDoc: ComponentDoc = {
	importLine: 'import { Nav } from "@hyzer-labs/ui"',
	props: [
		{ name: 'items', type: 'NavItem[]', default: '—', note: 'Required. See NavItem below.' },
		{
			name: 'orientation',
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			note: 'horizontal: a row of links with dropdown menus. vertical: a sidebar column with inline, nested, multi-open disclosure sections.'
		},
		{ name: 'ariaLabel', type: 'string', default: "'Main navigation'" },
		{ name: 'chevronIcon', type: 'Snippet', default: '—', note: 'Replaces the dropdown chevron.' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-nav class.' }
	],
	types: [
		{
			name: 'NavItem',
			props: [
				{ name: 'label', type: 'string', default: '—', note: 'Required.' },
				{
					name: 'href',
					type: 'string',
					default: '—',
					note: 'Omit (with children present) for a trigger-only dropdown / section parent.'
				},
				{
					name: 'children',
					type: 'NavChild[]',
					default: '—',
					note: 'Makes the item a dropdown (horizontal) or a nested disclosure section (vertical). May contain items or { heading } group labels.'
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
					note: 'Set on the active item.'
				},
				{
					name: 'defaultOpen',
					type: 'boolean',
					default: '—',
					note: 'Vertical only: the section starts open, and re-opens when items is rebuilt (e.g. on navigation).'
				}
			]
		}
	],
	a11yNote:
		'Horizontal dropdowns follow the APG menu-button pattern. The trigger carries `aria-haspopup`/`aria-expanded`, the panel is a `role=menu` with roving arrow-key focus, and `Escape` closes it and returns focus to the trigger.\n\nVertical sections are plain disclosure (`aria-expanded` on each `<button>`), not menus, with native keyboard traversal.\n\nA `heading` entry is static, non-focusable text read in sequence before the links it labels.',
	a11yLinks: [
		{
			label: 'MDN: <nav>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/nav'
		},
		{
			label: 'APG Menu Button pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/'
		}
	]
};
