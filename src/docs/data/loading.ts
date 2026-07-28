/** Loading's DocPage inputs — specs/49 R17. */
import type { ComponentDoc } from './types.js';

export const loadingDoc: ComponentDoc = {
	description:
		'An accessible loading indicator. Fundamentally indeterminate — three variants (spinner, dots, bar) that say "something is happening" without knowing how far along it is. Passing a `value` progressively enhances the `bar` into a determinate linear progress bar, and the `spinner` into a determinate circular ring — both with native-style value semantics.',
	importLine: 'import { Loading } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'value',
			type: 'number',
			default: '— (indeterminate)',
			note: 'Omitted, undefined, or NaN ⇒ indeterminate. No separate `indeterminate` boolean — the mode follows value the same way a native `<progress>` does.'
		},
		{ name: 'max', type: 'number', default: '100' },
		{
			name: 'intent',
			type: 'Intent',
			default: "'primary'",
			note: 'Unlike Badge/Banner, defaults to primary — a fill is an accent by nature. See Foundation → Colors & Intent.',
			noteHref: '/foundation/colors#intent'
		},
		{ name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
		{
			name: 'variant',
			type: "'bar' | 'spinner' | 'dots'",
			default: "'bar'",
			note: 'A value on `bar` renders a determinate linear progress bar; a value on `spinner` renders a determinate circular ring. `dots` is indeterminate-only — a value passed to it is ignored (dev-warn).'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'The accessible name. Required — a bare progressbar has a role but no name; a missing name dev-warns. Alternative: aria-label / aria-labelledby via rest.'
		},
		{
			name: 'showValue',
			type: 'boolean',
			default: 'false',
			note: 'Renders a formatted readout beside the bar, or centered inside the ring. Determinate only — ignored (dev-warn) on any indeterminate presentation or on dots. At sm/md the centered ring readout may be tight; prefer lg or a larger --hz-loading-size.'
		},
		{
			name: 'format',
			type: '(value: number, max: number) => string',
			default: '(v, max) => `${Math.round((v / max) * 100)}%`',
			note: 'Feeds both the visible readout and aria-valuetext, so the seen and announced strings never diverge. Applies to both the bar and the ring.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-loading class.' }
	],
	a11yNote:
		'A determinate bar (the `value` enhancement) is a native `<progress>` — it carries `role="progressbar"` and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` for free; the component stamps none of those manually. A determinate spinner (`variant="spinner"` + `value`) renders a static circular ring instead — since the ring is a decorative SVG, the same ARIA (`role="progressbar"`, `aria-valuemin`/`aria-valuemax`/`aria-valuenow`) is stamped on its wrapping span. Neither determinate form sets `aria-busy` — progress is known.\n\nThe base indeterminate presentations — a bare bar with no `value`, the spinning glyph, and the dots — expose no `aria-valuenow` (unknown progress) and instead wrap in `role="progressbar" aria-busy="true"`; the glyph, the ring SVG, and the dots are all `aria-hidden` decoration, and the accessible name carries the meaning.\n\nA name is required: pass `label` (applied as `aria-label` on the progressbar element), or an `aria-label`/`aria-labelledby` via rest. A missing name dev-warns, citing WCAG 4.1.2.\n\nFor non-percentage units, pass a custom `format` — its output becomes `aria-valuetext` as well as the visible readout (bar or ring), so what a sighted user reads and what a screen reader announces always match.\n\n**Reduced motion is a deliberate exception here.** Unlike the rest of the library (which reduces animation to zero under `prefers-reduced-motion: reduce`), an *indeterminate* Loading keeps animating — a frozen loader reads as stalled or broken, which is worse for every user. It runs a calmer, roughly 2x-slower version of each animation instead (about 4.8s per cycle at the default speed): the spinner and dots keep spinning/cycling, just more slowly, and the bar softens from a traveling sweep to a gentle low-amplitude pulse. The **determinate** forms — the linear bar and the circular ring, whenever a `value` is present — are static regardless, so reduced motion changes nothing for them. Skeleton is the opposite of the indeterminate case: its shimmer/pulse goes fully still under reduced motion, because the placeholder shape is itself the "loading" cue and needs no motion.',
	a11yLinks: [
		{
			label: 'MDN: progressbar role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/progressbar_role'
		},
		{
			label: 'WAI-ARIA: progressbar role definition',
			href: 'https://www.w3.org/TR/wai-aria-1.2/#progressbar'
		}
	]
};
