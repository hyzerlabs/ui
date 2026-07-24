/** Video's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const videoDoc: ComponentDoc = {
	description:
		'Video player supporting YouTube, Vimeo embeds, and native HTML5 video. Detects provider from URL and builds the correct embed.',
	importLine: 'import { Video } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'src',
			type: 'string',
			default: '—',
			note: 'Required. Native file URL, or a YouTube/Vimeo URL — the provider is detected and the right embed is built.'
		},
		{ name: 'title', type: 'string', default: '—', note: 'Required for accessibility.' },
		{ name: 'aspectRatio', type: "'16/9' | '4/3' | '1/1' | '9/16'", default: "'16/9'" },
		{
			name: 'autoplay',
			type: 'boolean',
			default: 'false',
			note: 'Requires muted; suppressed under prefers-reduced-motion.'
		},
		{ name: 'muted', type: 'boolean', default: 'false' },
		{ name: 'controls', type: 'boolean', default: 'true' },
		{ name: 'loop', type: 'boolean', default: 'false' },
		{ name: 'poster', type: 'string', default: '—', note: 'Native provider only.' },
		{ name: 'loading', type: "'lazy' | 'eager'", default: "'lazy'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-video class.' }
	],
	a11yNote:
		'The `title` prop is required and maps to the iframe title or video aria-label. `autoplay` requires `muted` (a browser policy and an accessibility consideration) and is suppressed under `prefers-reduced-motion`.',
	a11yLinks: [
		{
			label: 'MDN: <video>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video'
		}
	]
};
