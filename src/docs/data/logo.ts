/** Logo's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const logoDoc: ComponentDoc = {
	importLine: 'import { Logo } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Names the mark for assistive technology, and is the visible text when no SVG is given.'
		},
		{
			name: 'svg',
			type: 'string',
			default: '—',
			note: 'Raw SVG markup, rendered as-is and never sanitized. Pass only a static asset you control — a `?raw` import or a build-time constant, never user input or a fetched string. Missing (or whitespace-only) renders `name` as text instead.'
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Another way to supply the mark: an `<svg>` written directly as markup. Logo can only measure it once it mounts in the browser, while `svg` is measured during server rendering. If both are given, `svg` wins.'
		},
		{
			name: 'scale',
			type: 'number',
			default: '1',
			note: 'A multiplier on top of the normalized width — the optical-weight knob. A positive number, typically 0.7-1.4.'
		},
		{
			name: 'brightness',
			type: 'number',
			default: '1',
			note: 'A filter: brightness() nudge for a mark that reads too dark or too light. Written inline only when it differs from 1.'
		},
		{
			name: 'decorative',
			type: 'boolean',
			default: 'false',
			note: 'Set when adjacent text already names the brand — hides the mark from assistive technology entirely.'
		},
		{
			name: 'monochrome',
			type: 'boolean',
			default: 'true',
			note: "Recolors the mark to one color that follows the surrounding text. Set to false to keep the SVG's own colors."
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-logo class.' }
	],
	a11yNote:
		'An informative logo (the default) gets `role="img"` and an `aria-label` taken from `name`. Assistive technology reads one graphic with one name, however many paths or groups the SVG holds inside. Set `decorative` when nearby text already says the brand name; the mark is then hidden from assistive technology. With no `svg`, `name` renders as real, selectable text and needs no `role` at all.',
	a11yLinks: [
		{
			label: 'MDN: role="img"',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/img_role'
		},
		{
			label: 'WAI: An alt Decision Tree',
			href: 'https://www.w3.org/WAI/tutorials/images/decision-tree/'
		}
	]
};
