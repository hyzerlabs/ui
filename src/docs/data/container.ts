/** Container's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const containerDoc: ComponentDoc = {
	importLine: 'import { Container } from "@hyzer-labs/ui"',
	props: [
		{ name: 'max', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'lg'" },
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'md'",
			note: 'Both axes. Shared LayoutPadding scale — near/away tighten inside data-density-shift regions.'
		},
		{
			name: 'paddingInline',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: '—',
			note: 'Per-axis override — wins over padding on the inline axis. Same LayoutPadding scale.'
		},
		{
			name: 'paddingBlock',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: '—',
			note: 'Per-axis override — wins over padding on the block axis. Same LayoutPadding scale.'
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
		"Container is a layout primitive with no ARIA semantics. Use the `as` prop to render a meaningful landmark element (e.g. as='main') where that fits."
};
