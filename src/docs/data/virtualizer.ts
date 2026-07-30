/** Virtualizer's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const virtualizerDoc: ComponentDoc = {
	importLine: 'import { Virtualizer } from "@hyzer-labs/ui"',
	props: [
		{ name: 'items', type: 'T[]', default: '—', note: 'Required.' },
		{
			name: 'itemHeight',
			type: 'number | ((item: T, index: number) => number)',
			default: '—',
			note: 'Required. A fixed px height (uniform), or a per-item height function (known-variable). The estimate/seed when measure is true.'
		},
		{
			name: 'height',
			type: 'number',
			default: '—',
			note: 'Optional — omit for fluid. Viewport extent in px for fixed, SSR-exact windowing. Omitted, the viewport is fluid: CSS-size it and the component measures its own box at runtime.'
		},
		{
			name: 'measure',
			type: 'boolean',
			default: 'false',
			note: 'Runtime-measures each rendered row via ResizeObserver; itemHeight becomes the seed estimate for unmeasured rows.'
		},
		{
			name: 'overscan',
			type: 'number',
			default: '3',
			note: 'Extra rows rendered above/below the visible span.'
		},
		{
			name: 'row',
			type: 'Snippet<[T, number]>',
			default: '—',
			note: 'Required. Renders one row — see the row snippet signature below.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-virtualizer class.' }
	],
	types: [
		{
			name: 'itemHeight (union)',
			props: [
				{
					name: 'number',
					type: 'number',
					default: '—',
					note: 'Uniform row height in px — the O(1) fast path (no measure).'
				},
				{
					name: '(item, index) => number',
					type: '(item: T, index: number) => number',
					default: '—',
					note: 'Known-variable — a per-row height resolved from the item/index.'
				}
			]
		},
		{
			name: 'row snippet — Snippet<[item, index]>',
			props: [
				{ name: 'item', type: 'T', default: '—', note: 'The array element rendered by this row.' },
				{
					name: 'index',
					type: 'number',
					default: '—',
					note: "The item's absolute index in items — not the window-local render position — so keys, striping, and aria-posinset stay correct despite windowing."
				}
			]
		}
	],
	a11yNote:
		"Virtualizer is role-neutral by design. It applies no `role`, `aria-*`, or `tabindex` of its own. It is a rendering optimization rather than a widget, so all semantics come from the `row` snippet and `...rest` on the viewport.\n\nWindowing removes off-screen rows from the DOM, so any count-dependent semantics must be supplied explicitly. Set `aria-setsize` to the total item count and `aria-posinset` to the row's absolute index plus one, using the absolute index the snippet receives. That way assistive tech announces 'item N of total' correctly despite the elided DOM. See the List semantics demo below.\n\nA keyboard-scrollable viewport is opt-in: add a `tabindex` of 0 (plus a `role`/label) through `...rest`. The component adds no key handling of its own.\n\nVirtualization can scroll a focused row out of the DOM, a known windowing hazard. Patterns that need a persistently focused off-screen row (for example, `aria-activedescendant` listboxes) should keep the active row rendered rather than reaching for the raw Virtualizer."
};
