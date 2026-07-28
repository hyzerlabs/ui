/** Button's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const buttonDoc: ComponentDoc = {
	description:
		'A button component with solid, outline, ghost, and soft variants, intent colors, sizes, a loading state, and icon slots.',
	importLine: 'import { Button } from "@hyzer-labs/ui"',
	props: [
		{ name: 'variant', type: "'solid' | 'outline' | 'ghost' | 'soft'", default: "'solid'" },
		{
			name: 'intent',
			type: 'Intent',
			default: "'primary'",
			note: 'The full intent registry, not a hand-picked subset — see Foundation → Colors & Intent.',
			noteHref: '/foundation/colors#intent'
		},
		{
			name: 'size',
			type: "'sm' | 'md' | 'lg' | 'full'",
			default: "'md'",
			note: 'full fills its container at the md height/padding; not combinable with sm/lg.'
		},
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'loading', type: 'boolean', default: 'false' },
		{
			name: 'loadingLabel',
			type: 'string',
			default: "'Loading'",
			note: 'Screen-reader-only text announced while loading; not rendered visually.'
		},
		{
			name: 'href',
			type: 'string',
			default: '—',
			note: 'Renders as a plain <a> (no role="button") when set — it genuinely navigates.'
		},
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
