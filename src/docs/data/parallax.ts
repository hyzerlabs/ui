/** Parallax's DocPage inputs. ParallaxLayer's props are documented as a `types` sub-table (there is no separate ParallaxLayer page — one page, two components). */
import type { ComponentDoc } from './types.js';

export const parallaxDoc: ComponentDoc = {
	importLine: 'import { Parallax, ParallaxLayer } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'as',
			type: 'string',
			default: "'div'",
			note: "Rendered via <svelte:element>. 'section' is the common choice for a decorative band."
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Layers and foreground content, in normal flow.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-parallax class.' }
	],
	types: [
		{
			name: 'ParallaxLayer',
			props: [
				{
					name: 'x',
					type: 'string | number',
					default: '0',
					note: "Total horizontal travel across the band's pass through the viewport. A number is px; a string is a CSS length used verbatim. Negative drifts the other way."
				},
				{
					name: 'y',
					type: 'string | number',
					default: '0',
					note: 'Total vertical travel. Same rules as x.'
				},
				{
					name: 'z',
					type: 'number',
					default: '-1',
					note: "z-index inside the band's own stacking context. The default sits the layer behind foreground content; 1 puts it in front."
				},
				{
					name: 'children',
					type: 'Snippet',
					default: '—',
					note: "The layer's art. Non-interactive by contract — see Accessibility."
				},
				{ name: 'class', type: 'string', default: '—', note: 'Merged after hz-parallax-layer.' }
			]
		}
	],
	a11yNote:
		'Every layer is `aria-hidden` and `pointer-events: none` by default: layers are decorative, so put buttons and links in a plain, non-layer child of the band instead. `prefers-reduced-motion: reduce` removes the drift entirely, with no opt-out — scroll-triggered parallax is exactly the motion WCAG 2.3.3 asks to be disableable, and this component treats none of it as essential. A browser without scroll-driven animation support shows the same still composition, with no polyfill and no console noise. Nothing moves until the visitor scrolls, so there is no auto-motion to satisfy 2.2.2 either.\n\nThe component reorders nothing and adds no role, tabindex, or live region — reading and focus order come from `as` and your own content. It also contributes no color, so text sitting over a moving layer still has to meet contrast on its own.'
};
