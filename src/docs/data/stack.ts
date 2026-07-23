/** Stack's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const stackDoc: ComponentDoc = {
	description:
		'Lays children out in a vertical column with consistent spacing between items. Stack arranges content; pair it with a Container when the column also needs a max-width or page gutters.',
	importLine: 'import { Stack } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'gap',
			type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'near' | 'away'",
			default: "'md'",
			note: 'near/away are the density distances — they tighten inside data-density-shift regions.'
		},
		{
			name: 'align',
			type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
			default: "'stretch'",
			note: 'Shared LayoutAlign scale (Stack/Cluster/Grid).'
		},
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'none'",
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
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-stack class.' },
		{ name: 'children', type: 'Snippet', default: '—' }
	],
	a11yNote:
		'Stack is a layout primitive with no ARIA semantics. The reading and focus order follow the DOM order of children.'
};
