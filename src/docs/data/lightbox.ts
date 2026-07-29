/** Lightbox's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const lightboxDoc: ComponentDoc = {
	importLine: 'import { Lightbox } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'items',
			type: 'LightboxItem[]',
			default: '—',
			note: 'Media entries (images and videos) — see LightboxItem below. Renders one thumbnail trigger per item; the viewer pages through them with a Carousel.'
		},
		{
			name: 'src / alt / thumbSrc / caption',
			type: 'string',
			default: '—',
			note: 'Single-image sugar — equivalent to a one-item items array.'
		},
		{ name: 'open', type: 'boolean (bindable)', default: 'false' },
		{
			name: 'dialogLabel',
			type: 'string',
			default: "'Media viewer'",
			note: 'Dialog name in multi-item mode (single items are labelled by their own name).'
		},
		{
			name: 'triggerLabel',
			type: 'string',
			default: "'View larger: {name}'",
			note: 'Single trigger only.'
		},
		{ name: 'closeLabel', type: 'string', default: "'Close media viewer'" },
		{ name: 'prevLabel', type: 'string', default: "'Previous item'" },
		{ name: 'nextLabel', type: 'string', default: "'Next item'" },
		{ name: 'onclose', type: '() => void', default: '—', note: 'Fires once per dismissal.' },
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Custom trigger content — replaces the thumbnail strip; opens the first item.'
		},
		{
			name: 'trigger',
			type: 'Snippet<[LightboxItem, number]>',
			default: '—',
			note: 'Per-item trigger face, e.g. an Image — replaces the default thumb/badge for every item. Ignored (with a DEV warning) when children is also passed.'
		},
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-lightbox-triggers class (the inline strip).'
		}
	],
	types: [
		{
			name: 'LightboxItem (image)',
			props: [
				{
					name: 'type',
					type: "'image'",
					default: "'image'",
					note: 'Optional — image is the default.'
				},
				{ name: 'src', type: 'string', default: '—', note: 'Required. Full-size image.' },
				{ name: 'alt', type: 'string', default: '—', note: 'Required.' },
				{
					name: 'thumbSrc',
					type: 'string',
					default: '—',
					note: 'Strip thumbnail; defaults to src.'
				},
				{ name: 'caption', type: 'string', default: '—' }
			]
		},
		{
			name: 'LightboxItem (video)',
			props: [
				{ name: 'type', type: "'video'", default: '—', note: 'Required for videos.' },
				{
					name: 'src',
					type: 'string',
					default: '—',
					note: 'Required. Native file or YouTube/Vimeo URL — plays via the Video component.'
				},
				{
					name: 'label',
					type: 'string',
					default: '—',
					note: 'Required. Accessible name (the Video title).'
				},
				{ name: 'poster', type: 'string', default: '—' },
				{
					name: 'thumbSrc',
					type: 'string',
					default: '—',
					note: 'Strip thumbnail; defaults to poster.'
				},
				{ name: 'caption', type: 'string', default: '—' }
			]
		}
	],
	a11yNote:
		'Each thumbnail is a real `<button>` with `aria-haspopup="dialog"`, named by its item.\n\nThe viewer is a native `<dialog>` opened with `showModal()`. Focus is trapped, Escape always closes it, the backdrop also closes it, and focus returns to the thumbnail that opened it.\n\nMulti-item viewers embed the Carousel (labelled slides, live announcements), and ArrowLeft/ArrowRight page through it from anywhere in the dialog. Body scroll is locked while open.',
	a11yLinks: [
		{
			label: 'APG Dialog (Modal) pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/'
		},
		{ label: 'APG Carousel pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/' }
	]
};
