/** tooltip's DocPage inputs — specs/50 R-DOCS. */
import type { ComponentDoc } from './types.js';

export const tooltipDoc: ComponentDoc = {
	importLine: 'import { tooltip } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'text',
			type: 'string',
			default: '—',
			note: "Required. The tooltip text. `tooltip('Save changes')` is shorthand for `tooltip({ text: 'Save changes' })`."
		},
		{
			name: 'placement',
			type: "'top' | 'bottom' | 'left' | 'right' | '<side>-start' | '<side>-end'",
			default: "'top'",
			note: "'top' == 'top-center'; -start/-end add alignment. left/right follow the trigger's writing direction, so RTL flips the physical side."
		},
		{ name: 'offset', type: 'number', default: '8', note: 'Gap from the trigger, in px.' },
		{
			name: 'openDelay',
			type: 'number',
			default: '400',
			note: 'A hover-intent filter, in ms. A pointer that only passes over the trigger never opens it. Keyboard focus shows the tooltip right away, with no delay.'
		},
		{
			name: 'closeDelay',
			type: 'number',
			default: '150',
			note: 'The hoverable bridge, in ms. It gives the pointer time to travel from the trigger onto the tooltip itself without the tooltip disappearing.'
		},
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-tooltip class.'
		}
	],
	a11yNote:
		'The trigger gains `aria-describedby` pointing at the tooltip\'s `role="tooltip"` node. Any existing `aria-describedby` is kept, with the tooltip appended to it, and restored on teardown. The tooltip shows on hover (after `openDelay`, which filters out incidental passes) **and** on keyboard focus (immediately, no delay). The APG Tooltip pattern requires both, not just one.\n\nWCAG 2.2 SC 1.4.13 (Content on Hover or Focus) is satisfied: **Dismissible:** Escape hides the tooltip without moving focus or the pointer, and it will not re-open until you leave and re-enter or re-focus the trigger. **Hoverable:** the pointer can travel from the trigger onto the tooltip itself (across the `offset` gap) without it disappearing, because `closeDelay` bridges the gap. **Persistent:** it stays visible until you dismiss it, blur the trigger, or leave both the trigger and the tooltip. It never times out on its own.\n\n`tooltip` never adds `tabindex`. It enhances a control that is already focusable. Attach it to a non-focusable element (a plain `<span>`, say) and it still shows on hover, but keyboard users cannot reach it. That case dev-warns.\n\nThere is no hover on touch. With a touch or coarse pointer, a tap activates the control underneath rather than revealing the tooltip, though `aria-describedby` still exposes the text to assistive tech. For content revealed by a tap, use Popover.',
	a11yLinks: [
		{
			label: 'APG Tooltip pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/'
		},
		{
			label: 'MDN: Popover API',
			href: 'https://developer.mozilla.org/en-US/docs/Web/API/Popover_API'
		},
		{
			label: 'WCAG 2.2 SC 1.4.13: Content on Hover or Focus',
			href: 'https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html'
		}
	]
};
