/** Grid's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const gridDoc: ComponentDoc = {
	description:
		'Responsive CSS grid that adapts its column count to its own width via container queries.',
	importLine: 'import {Grid} from "@hyzer-labs/ui"',
	props: [
		{
			name: 'columns',
			type: 'number | { sm?: number; md?: number; lg?: number; xl?: number } | { min: string }',
			default: '{ sm: 1, md: 2, lg: 3 }',
			note: 'Band keys name the band ending at their width token: sm below 640px, md to 968px, lg to 1200px, xl beyond — fixed system constants (queries can’t read tokens). { min } is the fluid, fully var-driven mode.'
		},
		{
			name: 'gap',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
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
			note: 'Both axes, on the grid root — the column breakpoints measure the padded-down width. Shared LayoutPadding scale.'
		},
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-grid class.' },
		{ name: 'children', type: 'Snippet', default: '—' }
	],
	a11yNote:
		'Grid is a layout primitive with no ARIA semantics. Reading and focus order follow DOM order.'
};
