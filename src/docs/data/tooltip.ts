/** tooltip's DocPage inputs — specs/50 R-DOCS. */
import type { ComponentDoc } from './types.js';

export const tooltipDoc: ComponentDoc = {
	description:
		'An accessible hover/focus description attached to any element you already have — an icon button, a link, an abbreviation. Non-interactive text only; for a click-triggered panel with rich content, use Popover instead.',
	importLine: 'import { tooltip } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'text',
			type: 'string',
			default: '—',
			note: "Required. The tooltip text. `tooltip('Save changes')` is sugar for `tooltip({ text: 'Save changes' })`."
		},
		{
			name: 'placement',
			type: "'top' | 'bottom' | 'left' | 'right' | '<side>-start' | '<side>-end'",
			default: "'top'",
			note: "'top' == 'top-center'; -start/-end add alignment. left/right resolve through the trigger's direction, so RTL flips the physical side."
		},
		{ name: 'offset', type: 'number', default: '8', note: 'Gap from the trigger, in px.' },
		{
			name: 'openDelay',
			type: 'number',
			default: '400',
			note: 'A hover-intent filter, in ms — incidental pointer passes never open it. Keyboard focus shows immediately, bypassing the delay.'
		},
		{
			name: 'closeDelay',
			type: 'number',
			default: '150',
			note: 'The hoverable bridge, in ms — lets the pointer travel from the trigger onto the tooltip itself without it disappearing.'
		},
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-tooltip class.'
		}
	],
	a11yNote:
		'The trigger gains `aria-describedby` pointing at the tooltip\'s `role="tooltip"` node — appended to any existing `aria-describedby`, and restored on teardown. It shows on hover (after `openDelay`, filtering incidental passes) **and** on keyboard focus (immediately, no delay) — both are required by the APG Tooltip pattern, not just one.\n\nWCAG 2.2 SC 1.4.13 (Content on Hover or Focus) is fully satisfied: **Dismissible** — Escape hides it without moving focus or the pointer, and it will not re-open until you leave and re-enter or re-focus the trigger. **Hoverable** — the pointer can travel from the trigger onto the tooltip itself (across the `offset` gap) without it disappearing; the `closeDelay` bridges the gap. **Persistent** — it stays visible until you dismiss it, blur the trigger, or leave both the trigger and the tooltip; it never times out on its own.\n\n`tooltip` never adds `tabindex` — it enhances an already-focusable control. Attaching it to a non-focusable element (a plain `<span>`, say) still shows it on hover but leaves it unreachable by keyboard, and dev-warns.\n\nTooltips have no hover on touch: on a touch/coarse pointer, a tap activates the underlying control rather than revealing the tooltip, though `aria-describedby` still exposes the text to assistive tech. For tap-revealed content, use Popover.',
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
