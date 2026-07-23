/** Alert's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const alertDoc: ComponentDoc = {
	description:
		'An inline feedback banner on the shared intent scale, with an optional heading and dismiss button — announcement semantics are opt-in, and the Form error summary is one of these.',
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
			noteHref: '/foundation/colors#intent'
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
		'A statically rendered Alert is plain content — no role, no live region; the optional `title` names it via `aria-labelledby`. For alerts inserted after load, pass `role="status"` (polite) or `role="alert"` (assertive, sparingly) via the rest props — a live role on static content is dead weight, so it is never a default. The dismiss button is a real labelled `<button>`; dismissal is your state change, so consider where focus should land. There is deliberately no Toast component — timed self-dismissing overlays fail WCAG 2.2.1 and routinely escape announcement; an inline Alert with `role="status"` covers the need accessibly.',
	a11yLinks: [
		{ label: 'APG Alert pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
		{
			label: 'MDN: alert role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role'
		}
	]
};
