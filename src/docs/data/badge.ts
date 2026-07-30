/** Badge's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const badgeDoc: ComponentDoc = {
	importLine: 'import { Badge } from "@hyzer-labs/ui"',
	props: [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The badge content.' },
		{
			name: 'intent',
			type: 'Intent',
			default: "'neutral'",
			note: 'See Foundation → Colors & Intent.',
			noteHref: '/docs/foundation/colors#intent'
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
		'A badge is plain inline text with no role and no label, so it announces as part of the surrounding content. Never let the intent color be the only signal; the text itself carries the meaning.\n\nThe dismiss button is a real `<button>` named by `dismissLabel`, with a decorative icon. When rendering several chips, give each a per-item label like `Remove Destroyer`.'
};
