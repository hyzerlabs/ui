/** Header's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const headerDoc: ComponentDoc = {
	description:
		'A site header bar: branding, navigation, and actions, with a responsive hamburger + drawer built in. It composes Nav — horizontally in the bar, vertically in the drawer — so one item set drives both.',
	importLine: 'import {Header} from "@hyzer-labs/ui"',
	props: [
		{
			name: 'items',
			type: 'NavItem[]',
			default: '—',
			note: 'Navigation — rendered horizontally in the bar and vertically in the drawer. See Nav.'
		},
		{ name: 'brand', type: 'Snippet', default: '—', note: 'Logo / brand region at the start.' },
		{
			name: 'actions',
			type: 'Snippet',
			default: '—',
			note: 'End of the bar; repeated inside the drawer.'
		},
		{
			name: 'sticky',
			type: 'boolean',
			default: 'false',
			note: 'position: sticky at the top of the nearest scroll container.'
		},
		{ name: 'variant', type: "'default' | 'transparent'", default: "'default'" },
		{
			name: 'bordered',
			type: 'boolean',
			default: 'false',
			note: 'Bottom hairline — composes with any variant.'
		},
		{
			name: 'mobileBreakpoint',
			type: "'sm' | 'md' | 'lg' | 'none'",
			default: "'md'",
			note: 'Collapse threshold (640/968/1200px), a container query against the header width. none never collapses.'
		},
		{
			name: 'ariaLabel',
			type: 'string',
			default: "'Main navigation'",
			note: 'Names the navigation.'
		},
		{ name: 'menuIcon', type: 'Snippet', default: '—', note: 'Replaces the hamburger icon.' },
		{ name: 'chevronIcon', type: 'Snippet', default: '—', note: 'Forwarded to the Nav.' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-header class.' }
	],
	a11yNote:
		"The header is a `banner` landmark; its bar and drawer each render a `Nav` landmark with distinct accessible names (`ariaLabel` and `ariaLabel (menu)`) so they don't collide. The hamburger carries `aria-expanded`/`aria-controls`; the open drawer traps focus, `Escape` closes it and returns focus to the toggle. Every link stays reachable at narrow widths through the drawer."
};
