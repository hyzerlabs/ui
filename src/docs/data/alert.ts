/** Alert's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const alertDoc: ComponentDoc = {
	importLine: 'import { Alert } from "@hyzer-labs/ui"',
	props: [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The alert body.' },
		{
			name: 'title',
			type: 'string | Snippet',
			default: '—',
			note: 'Optional heading; labels the alert via aria-labelledby.'
		},
		{
			name: 'headingLevel',
			type: '2 | 3 | 4 | 5 | 6',
			default: '3',
			note: 'An alert is nearly always a callout inside a section rather than a section of its own, so the default keeps it below your page headings. Raise or lower it to match the surrounding document.'
		},
		{
			name: 'intent',
			type: 'Intent',
			default: "'neutral'",
			note: 'See Foundation → Colors & Intent.',
			noteHref: '/docs/foundation/colors#intent'
		},
		{
			name: 'rounded',
			type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
			default: "'md'",
			note: 'The shared Rounded scale — 1:1 with the --hz-radius-* tokens.'
		},
		{ name: 'icon', type: 'Snippet', default: '—', note: 'Decorative; rendered aria-hidden.' },
		{
			name: 'onDismiss',
			type: '() => void',
			default: '—',
			note: 'Renders the dismiss button. Visibility is your state — the Alert never hides itself.'
		},
		{ name: 'dismissLabel', type: 'string', default: "'Dismiss'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-alert class.' }
	],
	a11yNote:
		'A statically rendered Alert is plain content — no role, no live region. The optional `title` names it via `aria-labelledby`.\n\nFor alerts inserted after load, pass `role="status"` (polite) or `role="alert"` (assertive, use sparingly) via the rest props. A live role on static content is dead weight, so it\'s never a default.\n\nThe dismiss button is a real labeled `<button>`. Dismissal is your state change, so consider where focus should land.\n\nThere is deliberately no Toast component: a timed self-dismissing overlay is hard to make accessible: under WCAG 2.2.1 the timing has to be adjustable, extendable or pausable, and a message that vanishes on its own often goes unannounced as well. The library prefers dismissal a reader chooses, so content never disappears out from under them. An inline Alert with `role="status"` covers the need accessibly.',
	a11yLinks: [
		{ label: 'APG Alert pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
		{
			label: 'MDN: alert role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role'
		}
	]
};
