/** CodeBlock's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const codeBlockDoc: ComponentDoc = {
	importLine: 'import { CodeBlock } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'code',
			type: 'string',
			default: '—',
			note: 'Required. The source text. Copy, the line count, and the gutter always read from this, never from `children` or highlighter-injected markup.'
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: "Escape hatch for pre-highlighted content, usually a build-time highlighter's own `<pre>` via `{@html}` (Shiki, for example). Replaces the default `<pre><code>` entirely; `code` is still required."
		},
		{
			name: 'title',
			type: 'string',
			default: '—',
			note: 'A filename or label. Renders the header bar, together with `language`.'
		},
		{
			name: 'language',
			type: 'string',
			default: '—',
			note: 'Stamps `class="language-<language>"` on the default code (the hook browser-side highlighters look for) and shows a visible, non-interactive tag in the header.'
		},
		{
			name: 'lineNumbers',
			type: 'boolean',
			default: 'false',
			note: 'Opt-in decorative line-number gutter. Never part of copy or selection.'
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
			note: 'Rows shown while collapsed. The toggle appears only when the listing is longer than this.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-code-block class.' }
	],
	a11yNote:
		'The copy button is a real labeled `<button>`. Its "Copied" state lasts about 2 seconds and is announced once through a polite live region. If the clipboard is denied or unavailable, nothing happens and nothing is announced, so you never get a false "copied" (WCAG 4.1.3).\n\nIn its default rendering the code region is a focusable, named `role="group"`, so you can scroll an overflowing listing with the arrow keys (WCAG 2.1.1). When `children` supplies pre-highlighted markup, the region gives up its own tab stop to your focusable `<pre>` (Shiki\'s carries `tabindex="0"`) rather than creating a second one.\n\nThe language tag is plain visible text with no interactive role. It is never the region\'s accessible name, so nothing is announced twice. The line-number gutter is `aria-hidden` and left out of selection, so a screen-reader user and a mouse copy both get clean source.\n\nIf you supply a highlighter\'s markup through `children`, its token colours (a Shiki theme, say) are yours to check for contrast. CodeBlock adds no colour to that markup.',
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
