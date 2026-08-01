/** HorizontalScroll's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const horizontalScrollDoc: ComponentDoc = {
	importLine: 'import { HorizontalScroll } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'as',
			type: 'string',
			default: "'div'",
			note: "Rendered via <svelte:element>. 'section' and 'main' are common choices."
		},
		{
			name: 'snap',
			type: 'boolean',
			default: 'false',
			note: 'CSS scroll-snap at panel starts. Off by default, because panels are viewport-sized and meant to be read while they move, unlike a rail of small cards.'
		},
		{
			name: 'wheel',
			type: 'boolean',
			default: 'true',
			note: 'Turns a plain, vertical-dominant wheel notch into horizontal travel. On by default, since it is most of what makes the shell feel right under a mouse. It defers to a nested vertical scroller, and hands the wheel back to the page at either end. Set wheel={false} for native-only scrolling (touch, trackpad, scrollbar, keyboard).'
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'The panels, as direct children. There is no Panel subcomponent: any element you write directly inside is a panel.'
		},
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-horizontal-scroll class.'
		}
	],
	a11yNote:
		'The shell is a keyboard tab stop with native arrow-key scrolling. Home and End jump to the first or last panel, instantly when the visitor asks for less motion. Every panel is in the normal tab order, in DOM order, and tabbing to an off-screen panel scrolls it into view on its own. The component adds no `role` and no accessible name, because a focusable scroll region needs neither for keyboard access. If this shell is your page\'s main content, give it `role="region" aria-label="…"` yourself, or use `as="main"`.\n\nThe wheel remap is on by default. It only ever takes plain, unmodified, vertical-dominant wheel input that the shell can use. It never takes pinch-zoom, shift+wheel, a trackpad pan, touch, the scrollbar, or the keyboard, and it stops at either end, where scrolling goes straight back to the page. Set `wheel={false}` for native-only scrolling. No setting leaves a visitor unable to scroll away.'
};
