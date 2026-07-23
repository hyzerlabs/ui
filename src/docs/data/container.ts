/** Container's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const containerDoc: ComponentDoc = {
	description: 'Centers content horizontally with a configurable max-width and padding.',
	importLine: 'import {Container} from "@hyzer-labs/ui"',
	props: [
		{ name: 'max', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'lg'" },
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'md'",
			note: 'Both axes. Shared LayoutPadding scale — near/away tighten inside data-density-shift regions.'
		},
		{ name: 'center', type: 'boolean', default: 'true' },
		{
			name: 'breakout',
			type: 'boolean',
			default: 'false',
			note: 'Escapes the parent column to span the nearest inline-size container (viewport when none). Overrides max.'
		},
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-container class.' },
		{ name: 'children', type: 'Snippet', default: '—' }
	],
	a11yNote:
		"Container is a layout primitive with no ARIA semantics. Supply a meaningful landmark element via the `as` prop (e.g. as='main') when appropriate."
};
