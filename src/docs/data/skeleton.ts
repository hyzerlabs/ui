/** Skeleton's DocPage inputs — specs/49 R17. */
import type { ComponentDoc } from './types.js';

export const skeletonDoc: ComponentDoc = {
	importLine: 'import { Skeleton } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'variant',
			type: "'text' | 'circle' | 'rect' | 'block'",
			default: "'text'",
			note: 'Picks a shape and its default dimensions. For a card-like placeholder, compose several Skeletons in your own Stack/Cluster/Card layout; there is no preset prop for it.'
		},
		{
			name: 'width',
			type: 'string | number',
			default: 'variant default',
			note: 'A number is emitted as px; a string is used as written (any CSS length or percentage). This is a per-instance style rather than a theme hook, like Grid’s --hz-grid-cols*.'
		},
		{ name: 'height', type: 'string | number', default: 'variant default', note: 'See width.' },
		{
			name: 'rounded',
			type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
			default: 'variant default',
			note: 'The shared Rounded scale. circle always forces full, whatever you pass here.'
		},
		{
			name: 'lines',
			type: 'number',
			default: '1',
			note: 'text only. > 1 renders that many stacked bars; a value ≤ 0 clamps to 1 (dev-warn). Ignored on other variants.'
		},
		{
			name: 'lastLineWidth',
			type: 'string | number',
			default: "'60%'",
			note: 'text only, lines > 1. The final line is shortened so the block reads like a real paragraph.'
		},
		{
			name: 'animation',
			type: "'shimmer' | 'pulse' | 'none'",
			default: "'shimmer'",
			note: 'Every mode collapses to a static muted block under prefers-reduced-motion: reduce.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-skeleton class.' }
	],
	a11yNote:
		'Skeleton stamps `aria-hidden="true"` by default. It is decorative scaffolding with no role, no live region, and no label, so it cannot announce loading on its own. You can override `aria-hidden` via rest in the rare case you want it exposed.\n\nThat is the deliberate split: Loading announces, Skeleton decorates. Wrap the loading region in `aria-busy="true"` and pair it with either a labelled indeterminate `Loading` or a polite `aria-live` "Loading…" message, so screen-reader users are told content is coming, then told when it arrives. See the paired loading pattern demo below.\n\n**Reduced motion is the opposite of Loading here, on purpose.** Skeleton\'s shimmer/pulse goes fully still under `prefers-reduced-motion: reduce`, because the placeholder shape already carries the "content loading here" cue, so no motion is needed. `Loading` (and Button\'s loading spinner) keep animating instead, much more slowly, because for them motion *is* the essential cue.',
	a11yLinks: [
		{
			label: 'MDN: aria-busy',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy'
		},
		{
			label: 'MDN: ARIA live regions',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions'
		}
	]
};
