/** Badge's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const badgeDoc: ComponentDoc = {
	description:
		'A small inline status chip with intent coloring, soft/solid/outline variants, the shared rounded scale, and an optional dismiss button — the building block for selected-option chips.',
	importLine: 'import { Badge } from "@hyzer-labs/ui"',
	props: [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The badge content.' },
		{
			name: 'intent',
			type: 'Intent',
			default: "'neutral'",
			note: 'See Foundation → Colors & Intent.',
			noteHref: '/foundation/colors#intent'
		},
		{ name: 'variant', type: "'soft' | 'solid' | 'outline'", default: "'soft'" },
		{ name: 'size', type: "'sm' | 'md'", default: "'md'" },
		{
			name: 'rounded',
			type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
			default: "'full'",
			note: 'The shared Rounded scale — 1:1 with the --hz-radius-* tokens.'
		},
		{
			name: 'onDismiss',
			type: '() => void',
			default: '—',
			note: 'Renders the trailing remove button (the chip form).'
		},
		{
			name: 'dismissLabel',
			type: 'string',
			default: "'Remove'",
			note: 'In lists, pass a per-item label — "Remove" alone is ambiguous.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-badge class.' }
	],
	a11yNote:
		'A badge is plain inline text — no role, no label; it announces as part of the surrounding content. Never let the intent color be the only signal: the text carries the meaning. The dismiss button is a real `<button>` named by `dismissLabel` with a decorative icon — when rendering several chips, give each a per-item label like `Remove Destroyer`.'
};
