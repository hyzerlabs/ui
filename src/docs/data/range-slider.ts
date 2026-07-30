/** RangeSlider's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const rangeSliderDoc: ComponentDoc = {
	importLine: 'import { RangeSlider } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Base name — the thumbs submit as {name}-min and {name}-max.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Rendered as the fieldset legend; sr-only with hideLabel.'
		},
		{ name: 'min', type: 'number', default: '0' },
		{ name: 'max', type: 'number', default: '100' },
		{ name: 'step', type: 'number', default: '1' },
		{ name: 'valueMin', type: 'number', default: 'min', note: 'Bindable. The lower thumb.' },
		{ name: 'valueMax', type: 'number', default: 'max', note: 'Bindable. The upper thumb.' },
		{
			name: 'showInput',
			type: 'boolean',
			default: 'true',
			note: 'Renders the pair of exact-entry number fields.'
		},
		{
			name: 'ticks',
			type: 'SliderTick[]',
			default: '—',
			note: 'Decorative marks under the track. See SliderTick below.'
		},
		{
			name: 'unit',
			type: 'string',
			default: '—',
			note: 'One visual suffix after the pair; rendered aria-hidden.'
		},
		{
			name: 'minThumbLabel',
			type: 'string',
			default: '`${label} (minimum)`',
			note: 'Accessible name for the lower thumb (and its number field).'
		},
		{
			name: 'maxThumbLabel',
			type: 'string',
			default: '`${label} (maximum)`',
			note: 'Accessible name for the upper thumb (and its number field).'
		},
		{
			name: 'orientation',
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			note: 'Vertical uses writing-mode: vertical-lr (bottom-up growth) on both ranges; horizontal is unchanged.'
		},
		{
			name: 'inputPosition',
			type: "'start' | 'end'",
			default: "'end'",
			note: 'Logical on both axes; the min–max pair stays one inline cluster, placed above/below the track in vertical rather than stacked to mirror the thumbs.'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the legend.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false', note: 'Legend indicator only.' },
		{ name: 'disabled', type: 'boolean', default: 'false', note: 'Disables all four inputs.' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--slider hz-field--slider-range classes.'
		}
	],
	types: [
		{
			name: 'SliderTick',
			props: [
				{
					name: 'value',
					type: 'number',
					default: '—',
					note: 'Required. A bare number is shorthand for an unlabeled tick. Out-of-range ticks are skipped.'
				},
				{ name: 'label', type: 'string', default: '—', note: 'Small text under the mark.' }
			]
		}
	],
	a11yNote:
		'The group is a `<fieldset>` whose `label` renders as the `<legend>`. Each thumb is a real range input with its own accessible name (`minThumbLabel`/`maxThumbLabel`) and native slider semantics. Tab reaches both thumbs, arrow keys step them, and a thumb dragged past its partner clamps rather than crossing.\n\nThe number fields carry derived accessible names and never submit. The two thumbs submit as the base `name` plus `-min`/`-max` suffixes.\n\n`description` and `error` chain into `aria-describedby` on both ranges, and an `error` also sets `aria-invalid` on both. `required` renders the legend indicator only. `aria-required` is not part of the slider role\'s supported ARIA attributes, so it is never applied.\n\nTicks, the separator, and the readout are decorative and `aria-hidden`. In vertical orientation the component stamps `aria-orientation="vertical"` on both ranges explicitly, since writing-mode does not reliably flip a native range\'s implicit `horizontal` orientation in the accessibility tree across engines and assistive tech.',
	a11yLinks: [
		{
			label: 'APG Slider (Multi-Thumb) pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/'
		},
		{
			label: 'MDN: <input type="range">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range'
		}
	]
};
