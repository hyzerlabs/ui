/** Banner's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const bannerDoc: ComponentDoc = {
	importLine: 'import { Banner } from "@hyzer-labs/ui"',
	props: [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The banner body.' },
		{
			name: 'intent',
			type: 'Intent',
			default: "'neutral'",
			note: 'See Foundation → Colors & Intent.',
			noteHref: '/docs/foundation/colors#intent'
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
		'A statically rendered Banner is plain content: no role, no live region. For a Banner inserted after load, pass `role="status"` (polite) or `role="alert"` (assertive, use sparingly) via the rest props.\n\nThe icon slot is decorative (`aria-hidden`). Links inside are underlined, and color is never the only signal. The dismiss button is a real labeled `<button>`, and dismissal is your state change.\n\nA pinned Banner can cover a focused element that scrolls under it. Keep pinned banners short, one line where possible. Give in-page anchor targets `scroll-margin-block-start`/`-end` equal to the banner height so they clear it. The Banner itself sets no `scroll-margin`.',
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
