/** Button's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const buttonDoc: ComponentDoc = {
	description:
		'A versatile button component supporting solid, outline, ghost, and link variants with intent colors, sizes, loading, and icon slots.',
	importLine: 'import {Button} from "@hyzer-labs/ui"',
	props: [
		{ name: 'variant', type: "'solid' | 'outline' | 'ghost' | 'link'", default: "'solid'" },
		{
			name: 'intent',
			type: "'neutral' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info'",
			default: "'primary'",
			note: 'The full intent registry, not a hand-picked subset — see Foundation → Colors & Intent.'
		},
		{ name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'loading', type: 'boolean', default: 'false' },
		{
			name: 'loadingLabel',
			type: 'string',
			default: "'Loading'",
			note: 'Screen-reader-only text announced while loading; not rendered visually.'
		},
		{ name: 'fullWidth', type: 'boolean', default: 'false' },
		{ name: 'href', type: 'string', default: '—', note: 'Renders as <a> when set.' },
		{ name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'" },
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			note: 'Required for icon-only buttons.'
		},
		{
			name: 'onclick',
			type: '(e: MouseEvent) => void',
			default: '—',
			note: 'Swallowed while disabled or loading.'
		},
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-button class.'
		},
		{ name: 'children', type: 'Snippet', default: '—' },
		{
			name: 'iconStart',
			type: 'Snippet',
			default: '—',
			note: 'An icon snippet with no children renders the compact circular icon-only form.'
		},
		{ name: 'iconEnd', type: 'Snippet', default: '—' }
	],
	a11yNote:
		'Use `ariaLabel` for icon-only buttons (no visible text). The loading state sets `aria-busy="true"` and renders a screen-reader-only "Loading" label. Disabled state sets `aria-disabled="true"`.',
	a11yLinks: [
		{ label: 'APG Button pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/' },
		{
			label: 'MDN: <button>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button'
		}
	]
};
