/** Slider's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const sliderDoc: ComponentDoc = {
	importLine: 'import { Slider } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Form field name (on the range input).'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Labels the range; sr-only with hideLabel.'
		},
		{ name: 'min', type: 'number', default: '0' },
		{ name: 'max', type: 'number', default: '100' },
		{ name: 'step', type: 'number', default: '1' },
		{ name: 'value', type: 'number', default: 'min', note: 'Bindable.' },
		{
			name: 'showInput',
			type: 'boolean',
			default: 'true',
			note: 'Renders the exact-entry number field next to the slider.'
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
			note: 'Visual suffix after the number field; rendered aria-hidden.'
		},
		{
			name: 'inputLabel',
			type: 'string',
			default: '`${label} (exact value)`',
			note: 'Accessible name for the number field.'
		},
		{
			name: 'orientation',
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			note: 'Vertical uses writing-mode: vertical-lr (bottom-up growth); horizontal is unchanged.'
		},
		{
			name: 'inputPosition',
			type: "'start' | 'end'",
			default: "'end'",
			note: 'Logical on both axes: horizontal trailing/leading, vertical below/above the track.'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false', note: 'Label indicator only.' },
		{ name: 'disabled', type: 'boolean', default: 'false', note: 'Disables both inputs.' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--slider classes.'
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
		'The range input is the labeled (`id`/`for`), named, form-participating control. Its slider semantics (value, min, max) are native, and arrow keys step it.\n\nThe number field is an exact-entry affordance with its own accessible name (`inputLabel`) and no `name`, so it never submits.\n\n`description` and `error` chain into `aria-describedby` on the range (description first), and an `error` sets `aria-invalid`. `required` renders the label indicator only. `aria-required` is not part of the slider role\'s supported ARIA attributes, so it is never applied.\n\n`unit` is decorative and `aria-hidden`. Put meaning-bearing units in the label or description instead. In vertical orientation the component stamps `aria-orientation="vertical"` on the range explicitly, since writing-mode does not reliably flip a native range\'s implicit `horizontal` orientation in the accessibility tree across engines and assistive tech.',
	a11yLinks: [
		{ label: 'APG Slider pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/' },
		{
			label: 'MDN: <input type="range">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range'
		}
	]
};
