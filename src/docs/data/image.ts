/** Image's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const imageDoc: ComponentDoc = {
	importLine: 'import { Image } from "@hyzer-labs/ui"',
	props: [
		{ name: 'src', type: 'string', default: '—', note: 'Required. Fallback in picture mode.' },
		{
			name: 'alt',
			type: 'string',
			default: '—',
			note: 'Required. Empty string for decorative.'
		},
		{
			name: 'sources',
			type: 'ImageSource[]',
			default: '—',
			note: 'Renders a <picture>: candidates in priority order — see ImageSource below. src remains the fallback and drives the load state.'
		},
		{ name: 'width', type: 'number', default: '—' },
		{ name: 'height', type: 'number', default: '—' },
		{ name: 'loading', type: "'lazy' | 'eager'", default: "'lazy'" },
		{
			name: 'aspectRatio',
			type: "'auto' | '1/1' | '4/3' | '16/9' | '21/9' | string",
			default: "'auto'"
		},
		{ name: 'fit', type: "'cover' | 'contain' | 'fill' | 'none'", default: "'cover'" },
		{
			name: 'rounded',
			type: "boolean | 'sm' | 'md' | 'lg' | 'full'",
			default: 'false',
			note: 'true is shorthand for md.'
		},
		{ name: 'placeholder', type: "'blur' | 'color' | 'none'", default: "'none'" },
		{
			name: 'placeholderSrc',
			type: 'string',
			default: '—',
			note: 'Low-res image for placeholder="blur"; required in that mode.'
		},
		{ name: 'placeholderColor', type: 'string', default: "'var(--hz-color-border)'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-image class.' }
	],
	types: [
		{
			name: 'ImageSource',
			props: [
				{
					name: 'srcset',
					type: 'string',
					default: '—',
					note: 'Required. Candidate URL(s) for this source.'
				},
				{
					name: 'type',
					type: 'string',
					default: '—',
					note: "MIME type for format negotiation, e.g. 'image/avif'."
				},
				{
					name: 'media',
					type: 'string',
					default: '—',
					note: 'Viewport media query for art direction, e.g. (min-width: 968px).'
				},
				{ name: 'sizes', type: 'string', default: '—' }
			]
		}
	],
	a11yNote:
		"Pass descriptive alt text for informative images. Pass `alt=''` for decorative images: the component then sets `role='presentation'` for you.",
	a11yLinks: [
		{ label: 'MDN: <img>', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img' },
		{
			label: 'MDN: <picture>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture'
		}
	]
};
