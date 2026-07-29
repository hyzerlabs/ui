/** Popover's DocPage inputs — specs/50 R-DOCS. */
import type { ComponentDoc } from './types.js';

export const popoverDoc: ComponentDoc = {
	importLine: 'import { Popover } from "@hyzer-labs/ui"',
	props: [
		{ name: 'open', type: 'boolean', default: 'false', note: '$bindable.' },
		{ name: 'placement', type: 'Placement', default: "'bottom-start'" },
		{ name: 'offset', type: 'number', default: '8', note: 'Gap from the trigger, in px.' },
		{
			name: 'autoFocus',
			type: 'boolean',
			default: 'false',
			note: "true moves focus to the panel's first focusable element on open — off by default, since a disclosure shouldn't steal focus."
		},
		{
			name: 'dismissible',
			type: 'boolean',
			default: 'true',
			note: 'false suppresses outside-click dismissal; Escape always closes regardless — no opt-out.'
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
			note: 'Escape hatch — wins over triggerLabel/triggerProps/triggerIcon. Receives an attrs bag (id, aria-expanded, aria-controls, popovertarget, onclick) to spread onto your own element: a link, an avatar, a custom control.'
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Required. The panel content — interactive controls are fully supported.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-popover class.' }
	],
	a11yNote:
		'The trigger carries `aria-expanded` and `aria-controls` pointing at the panel — the APG Disclosure pattern, not a dialog. The panel itself is a plain region by default, or a labelled `role="group"` when you pass `label` (for a panel with no visible heading). It is never `aria-modal`, never traps focus, and never renders a backdrop — interactive content inside just flows through the normal tab order and back out.\n\nEscape always closes the panel and returns focus to the trigger, even with `dismissible: false` — there is no opt-out, the same rule Modal follows for its own Escape handling. Clicking outside the panel closes it too (unless `dismissible: false`), and — unlike Escape — leaves focus wherever the click landed rather than pulling it back.\n\nBy default (`autoFocus: false`) opening the panel does not move focus at all, since a disclosure shouldn\'t steal it uninvited; set `autoFocus` when the panel\'s first control genuinely is the next thing a user wants (a search field, say).',
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
