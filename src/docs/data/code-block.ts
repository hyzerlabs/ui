/** CodeBlock's DocPage inputs — specs/47. */
import type { ComponentDoc } from './types.js';

export const codeBlockDoc: ComponentDoc = {
	importLine: 'import { CodeBlock } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'code',
			type: 'string',
			default: '—',
			note: 'Required. The source text — always the truth for copy, line count, and the gutter, never `children` or highlighter-injected markup.'
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: "Pre-highlighted content escape hatch — typically a build-time highlighter's own `<pre>` via `{@html}` (Shiki first). Replaces the default `<pre><code>` entirely; `code` stays required."
		},
		{
			name: 'title',
			type: 'string',
			default: '—',
			note: 'A filename/label. Renders the header bar together with `language`.'
		},
		{
			name: 'language',
			type: 'string',
			default: '—',
			note: 'Stamps `class="language-<language>"` on the default code (the client-autoloader hook) and a visible, non-interactive header tag.'
		},
		{
			name: 'lineNumbers',
			type: 'boolean',
			default: 'false',
			note: 'Opt-in decorative line-number gutter. Never part of copy/selection.'
		},
		{
			name: 'copyable',
			type: 'boolean',
			default: 'true',
			note: 'Whether the built-in copy button renders.'
		},
		{
			name: 'collapsible',
			type: 'boolean',
			default: 'false',
			note: 'Clamp tall listings behind a Show-more/less toggle.'
		},
		{
			name: 'collapsedLines',
			type: 'number',
			default: '16',
			note: 'Rows shown while collapsed; the toggle only appears when the listing actually exceeds this.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-code-block class.' }
	],
	a11yNote:
		'The copy button is a real labelled `<button>`; its ~2s "Copied" state is announced once via a polite live region, and a denied/unavailable clipboard is a silent no-op — never a false "copied" (WCAG 4.1.3).\n\nThe code region is a focusable, named `role="group"` in its default rendering, so an overflowing listing is arrow-scrollable by keyboard (WCAG 2.1.1). When `children` supplies pre-highlighted markup, the region yields its own tab stop to the consumer\'s focusable `<pre>` (Shiki\'s carries `tabindex="0"`) rather than creating a second one.\n\nThe language tag is plain visible text with no interactive role — it is never the region\'s accessible name, so nothing double-announces. The line-number gutter is `aria-hidden` and excluded from selection, so a screen-reader user and a mouse-copy both get clean source.\n\nA `children`-supplied highlighter\'s token palette (e.g. a Shiki theme) is the consumer\'s own contrast responsibility — CodeBlock contributes no colour to that markup.',
	a11yLinks: [
		{
			label: 'APG: Disclosure Pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/'
		},
		{
			label: 'MDN: Clipboard API',
			href: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'
		}
	]
};
