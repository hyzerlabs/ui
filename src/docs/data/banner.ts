/** Banner's DocPage inputs — specs/41 R12. */
import type { ComponentDoc } from './types.js';

export const bannerDoc: ComponentDoc = {
	description:
		'A full-width, solid-intent announcement bar with an optional dismiss button and top/bottom pinning. Made for page-level messages — maintenance notices, promos, and outage banners.',
	importLine: 'import { Banner } from "@hyzer-labs/ui"',
	props: [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The banner body.' },
		{
			name: 'intent',
			type: 'Intent',
			default: "'neutral'",
			note: 'See Foundation → Colors & Intent.',
			noteHref: '/foundation/colors#intent'
		},
		{
			name: 'pin',
			type: "'top' | 'bottom'",
			default: '—',
			note: 'Sticks the bar to that edge, in flow (position: sticky). Static by default.'
		},
		{ name: 'icon', type: 'Snippet', default: '—', note: 'Decorative; rendered aria-hidden.' },
		{
			name: 'actions',
			type: 'Snippet',
			default: '—',
			note: 'Trailing slot — a Link or Button, e.g. "Learn more".'
		},
		{
			name: 'onDismiss',
			type: '() => void',
			default: '—',
			note: 'Renders the dismiss button. Visibility is your state — the Banner never hides itself.'
		},
		{ name: 'dismissLabel', type: 'string', default: "'Dismiss'" },
		{
			name: 'as',
			type: 'string',
			default: "'div'",
			note: 'Polymorphic root — e.g. section or aside for landmark semantics.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-banner class.' }
	],
	a11yNote:
		'A statically rendered Banner is plain content — no role, no live region. For a Banner inserted after load, pass `role="status"` (polite) or `role="alert"` (assertive, sparingly) via the rest props. The icon slot is decorative (`aria-hidden`); links inside are underlined, colour is never the only signal. The dismiss button is a real labelled `<button>`; dismissal is your state change. A **pinned** Banner can cover a focused element that scrolls under it — keep pinned banners short (one line where possible), and give in-page anchor targets `scroll-margin-block-start`/`-end` equal to the banner height so they clear it; the Banner itself sets no `scroll-margin`. There is deliberately no Toast component — timed self-dismissing overlays fail WCAG 2.2.1 and routinely escape announcement; Banner (opt-in `role="status"`, consumer-owned dismissal) is the sanctioned pinned/site-wide pattern.',
	a11yLinks: [
		{
			label: 'WCAG 2.4.11: Focus Not Obscured (Minimum)',
			href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html'
		},
		{
			label: 'MDN: status role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role'
		},
		{
			label: 'MDN: alert role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role'
		}
	]
};
