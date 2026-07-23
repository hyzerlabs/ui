/** Cluster's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const clusterDoc: ComponentDoc = {
	description: 'Lays children out in a horizontal row that wraps to new lines as needed.',
	importLine: 'import {Cluster} from "@hyzer-labs/ui"',
	props: [
		{
			name: 'gap',
			type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'sm'",
			note: 'near/away are the density distances — they tighten inside data-density-shift regions.'
		},
		{
			name: 'justify',
			type: "'start' | 'center' | 'end' | 'between' | 'around'",
			default: "'start'"
		},
		{
			name: 'align',
			type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
			default: "'center'",
			note: 'Shared LayoutAlign scale (Stack/Cluster/Grid).'
		},
		{ name: 'wrap', type: 'boolean', default: 'true' },
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'none'",
			note: 'Both axes. Shared LayoutPadding scale — near/away tighten inside data-density-shift regions.'
		},
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-cluster class.' }
	],
	a11yNote:
		'Cluster is a layout primitive with no ARIA semantics. Reading and focus order follow DOM order.'
};
