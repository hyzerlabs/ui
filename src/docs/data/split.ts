/** Split's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const splitDoc: ComponentDoc = {
	description:
		'Two-column layout with configurable proportions that stacks to a single column when its own width gets narrow.',
	importLine: 'import { Split } from "@hyzer-labs/ui"',
	props: [
		{ name: 'fraction', type: "'1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'auto'", default: "'1/2'" },
		{
			name: 'gap',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'md'",
			note: 'near/away are the density distances — they tighten inside data-density-shift regions.'
		},
		{ name: 'reverse', type: 'boolean', default: 'false' },
		{
			name: 'stackBelow',
			type: "'sm' | 'md' | 'lg'",
			default: "'sm'",
			note: 'Stacks under the --hz-width-sm/md/lg token (640/968/1200px) of the Split’s own width. Resolves via var() — overriding the token retunes the threshold.'
		},
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'none'",
			note: 'Both axes, on the split root — stackBelow measures the padded-down width. Shared LayoutPadding scale.'
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
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-split class.' },
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Two direct children become the columns.'
		}
	],
	a11yNote:
		'Split is a layout primitive with no ARIA semantics. DOM order determines reading and focus order regardless of visual arrangement.'
};
