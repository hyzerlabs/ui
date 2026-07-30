/** Popover's DocPage inputs — specs/50 R-DOCS. */
import type { ComponentDoc } from './types.js';

export const popoverDoc: ComponentDoc = {
	importLine: 'import { Popover } from "@hyzer-labs/ui"',
	props: [
		{ name: 'open', type: 'boolean', default: 'false', note: '$bindable.' },
		{
			name: 'placement',
			type: "'top' | 'bottom' | 'left' | 'right' | '<side>-start' | '<side>-end'",
			default: "'bottom-start'",
			note: "A bare side centers on the trigger; -start/-end add alignment. left/right follow the trigger's writing direction, so RTL flips the physical side. See Positioning for how a placement resolves."
		},
		{ name: 'offset', type: 'number', default: '8', note: 'Gap from the trigger, in px.' },
		{
			name: 'autoFocus',
			type: 'boolean',
			default: 'false',
			note: "true moves focus to the panel's first focusable element when it opens. Off by default, because a disclosure should not steal focus."
		},
		{
			name: 'dismissible',
			type: 'boolean',
			default: 'true',
			note: 'false turns off closing on an outside click. Escape still closes the panel either way; there is no opt-out.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: "The panel's accessible name, used when it has no visible heading of its own."
		},
		{ name: 'onopen', type: '() => void', default: '—' },
		{ name: 'onclose', type: '() => void', default: '—' },
		{
			name: 'triggerLabel',
			type: 'string',
			default: '—',
			note: 'Visible label for the default composed-Button trigger. Ignored when `trigger` is provided.'
		},
		{
			name: 'triggerProps',
			type: 'PopoverTriggerProps',
			default: '{}',
			note: "Trigger appearance pass-through. Resolves to variant: 'outline', intent: 'neutral'."
		},
		{
			name: 'triggerIcon',
			type: 'Snippet',
			default: '—',
			note: 'Icon for the default Button trigger.'
		},
		{
			name: 'trigger',
			type: 'Snippet<[TriggerAttrs]>',
			default: '—',
			note: 'Escape hatch. Wins over triggerLabel/triggerProps/triggerIcon. Receives an attrs bag (id, aria-expanded, aria-controls, popovertarget, onclick) to spread onto your own element: a link, an avatar, a custom control.'
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Required. The panel content. Interactive controls are supported.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-popover class.' }
	],
	a11yNote:
		'The trigger carries `aria-expanded` and `aria-controls` pointing at the panel. That is the APG Disclosure pattern, not a dialog. The panel itself is a plain region by default, or a labeled `role="group"` when you pass `label` (for a panel with no visible heading). It is never `aria-modal`, never traps focus, and never renders a backdrop. Interactive content inside flows through the normal tab order and back out.\n\nEscape always closes the panel and returns focus to the trigger, even with `dismissible: false`. There is no opt-out, the same rule Modal follows for its own Escape handling. Clicking outside the panel closes it too, unless `dismissible: false`. Unlike Escape, an outside click leaves focus wherever the click landed rather than pulling it back.\n\nBy default (`autoFocus: false`) opening the panel does not move focus at all, because a disclosure should not take focus uninvited. Set `autoFocus` when the panel\'s first control really is the next thing someone wants, such as a search field.',
	a11yLinks: [
		{
			label: 'APG Disclosure (Show/Hide) pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/'
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
