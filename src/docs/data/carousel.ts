/** Carousel's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const carouselDoc: ComponentDoc = {
	importLine: 'import { Carousel } from "@hyzer-labs/ui"',
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
		{
			name: 'index',
			type: 'number (bindable)',
			default: '0',
			note: 'In the rail layout, the item nearest the scroll position — writing it scrolls the row there.'
		},
		{
			name: 'layout',
			type: "'single' | 'rail'",
			default: "'single'",
			note: 'single is the sliding track, one slide per view. rail is a native horizontally-scrolling row with several items visible at once.'
		},
		{
			name: 'snap',
			type: 'boolean',
			default: 'true',
			note: 'Rail only. true snaps the row to item starts as you scroll; false is free, continuous scrolling. No effect outside the rail layout.'
		},
		{
			name: 'loop',
			type: 'boolean',
			default: 'false',
			note: 'Wrap from the last slide to the first and back. In the rail layout this renders a hidden buffer of cloned items so scrolling past either end continues seamlessly instead of stopping.'
		},
		{
			name: 'draggable',
			type: 'boolean',
			default: 'true',
			note: 'Pointer drag to slide (drag wraps when loop is set — seamlessly, when seamless is also set). Off leaves keyboard, buttons, and dots working.'
		},
		{
			name: 'controls',
			type: "'visible' | 'focus'",
			default: "'visible'",
			note: 'focus keeps the prev/next buttons and indicator in the DOM and fully operable, hidden only visually until :hover/:focus-within reveals the whole row together — the WCAG 2.5.7 non-dragging alternative, always reachable.'
		},
		{
			name: 'seamless',
			type: 'boolean',
			default: 'false',
			note: 'Opt-in continuous boundary wrap: every ±1 loop step — drag, buttons, dots, arrow keys — settles through a hidden clone instead of sweeping back through the row. Only meaningful with loop; an inert no-op without it. Ignored in the rail layout, since loop is already continuous there.'
		},
		{
			name: 'indicator',
			type: "'counter' | 'dots'",
			default: "'counter'",
			note: 'The "1 / 3" counter, or clickable slide-picker dots. Not shown in the rail layout — with several items visible at once there is no single position to indicate.'
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
		'Built on the APG carousel pattern. The region and each slide carry `aria-roledescription`, and slides are named (\'2 of 5\'-style by default, or set your own with `slideLabel`).\n\nThere is no auto-rotation, so the viewport is an `aria-live="polite"` region and slide changes announce themselves. Arrow keys, Home, and End move between slides while focus is inside the carousel.\n\n`controls="focus"` hides the control row visually only. It never uses `display`, `visibility`, `aria-hidden`, or `inert`, so the row stays reachable by Tab and appears on hover. That is the WCAG 2.5.7 alternative to the drag gesture.\n\nThe rail layout is a real scroll container, so it works differently: every item stays visible and reachable — nothing is hidden or inert — and the container itself is a single tab stop. Once focused, the native Arrow, Home, End, Page Up/Down, and Space keys scroll it with no extra handling, and tabbing into a partly visible card scrolls it fully into view.',
	a11yLinks: [
		{ label: 'APG Carousel pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/' },
		{
			label: 'WCAG 2.5.7 Dragging Movements',
			href: 'https://www.w3.org/WAI/WCAG21/Understanding/dragging-movements.html'
		}
	]
};
