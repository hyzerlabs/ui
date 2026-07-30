/** Divider's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const dividerDoc: ComponentDoc = {
	importLine: 'import { Divider } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'children',
			type: 'Snippet',
			default: '— (label)',
			note: 'Optional. Absent → bare <hr>; present → the labeled form.'
		},
		{ name: 'variant', type: "'solid' | 'dashed' | 'dotted'", default: "'solid'" },
		{
			name: 'spacing',
			type: 'LayoutPadding',
			default: "'md'",
			note: "Block margin: 'none' | 'sm' | 'md' | 'lg' | 'near' | 'away' — the shared layout scale; near/away tighten inside data-density-shift regions."
		},
		{
			name: 'lineWidth',
			type: "'thin' | 'thick'",
			default: "'thin'",
			note: 'Maps 1:1 to the --hz-border-width-thin/-thick tokens.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-divider class.' }
	],
	a11yNote:
		'The bare form is a native `<hr>`: implicit `role="separator"`, horizontal, non-focusable, and needing no ARIA.\n\nThe labeled form keeps `role="separator"` on the wrapping `<div>`, so the thematic break survives the switch away from `<hr>`. The label text is the separator\'s accessible name and stays in the tree, so screen readers announce \'separator, OR\'.\n\nThe flanking rules are decorative `::before`/`::after` pseudo-elements, never part of the accessibility tree.',
	a11yLinks: [
		{ label: 'MDN: <hr>', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr' },
		{
			label: 'MDN: separator role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/separator_role'
		}
	]
};
