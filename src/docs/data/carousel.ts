/** Carousel's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const carouselDoc: ComponentDoc = {
	description:
		'An accessible, manually-rotated carousel: a draggable slide track, labelled slides, previous/next controls, arrow-key steering, and a live region announcing changes. No auto-rotation, by design.',
	importLine: 'import {Carousel} from "@hyzer-labs/ui"',
	props: [
		{
			name: 'items',
			type: 'T[]',
			default: '—',
			note: 'Required. Generic — each item renders via the slide snippet.'
		},
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			note: 'Required. Names the carousel region.'
		},
		{ name: 'index', type: 'number (bindable)', default: '0' },
		{
			name: 'loop',
			type: 'boolean',
			default: 'false',
			note: 'Wrap from the last slide to the first and back.'
		},
		{
			name: 'draggable',
			type: 'boolean',
			default: 'true',
			note: 'Pointer drag to slide (drag wraps when loop is set). Off leaves keyboard, buttons, and dots working.'
		},
		{
			name: 'indicator',
			type: "'counter' | 'dots'",
			default: "'counter'",
			note: 'The "1 / 3" counter, or clickable slide-picker dots.'
		},
		{ name: 'prevLabel', type: 'string', default: "'Previous slide'" },
		{ name: 'nextLabel', type: 'string', default: "'Next slide'" },
		{
			name: 'slideLabel',
			type: '(item, index) => string',
			default: '—',
			note: 'Accessible name per slide; defaults to "{n} of {total}".'
		},
		{
			name: 'dotLabel',
			type: '(index, count) => string',
			default: '—',
			note: 'Accessible name per dot; defaults to "Go to slide {n} of {total}".'
		},
		{ name: 'onchange', type: '(index: number) => void', default: '—' },
		{
			name: 'slide',
			type: 'Snippet<[T, number]>',
			default: '—',
			note: 'Required. Renders one slide.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-carousel class.' }
	],
	a11yNote:
		'Follows the APG grouped-carousel pattern: the region and each slide carry `aria-roledescription`, slides are named (\'2 of 5\'-style by default, customizable via `slideLabel`), and because there is no auto-rotation the viewport is an `aria-live="polite"` region — slide changes announce themselves. Arrow keys, Home, and End steer while focus is inside the carousel.',
	a11yLinks: [
		{ label: 'APG Carousel pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/' }
	]
};
