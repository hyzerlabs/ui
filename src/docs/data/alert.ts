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
		{ name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '2' },
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
		'A statically rendered Alert is plain content — no role, no live region. The optional `title` names it via `aria-labelledby`.\n\nFor alerts inserted after load, pass `role="status"` (polite) or `role="alert"` (assertive, use sparingly) via the rest props. A live role on static content is dead weight, so it\'s never a default.\n\nThe dismiss button is a real labelled `<button>`. Dismissal is your state change, so consider where focus should land.\n\nThere is deliberately no Toast component: timed self-dismissing overlays fail WCAG 2.2.1 and routinely escape announcement. An inline Alert with `role="status"` covers the need accessibly.',
	a11yLinks: [
		{ label: 'APG Alert pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
		{
			label: 'MDN: alert role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role'
		}
	]
};
