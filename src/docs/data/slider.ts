/** Slider's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const sliderDoc: ComponentDoc = {
	description:
		'A labeled range slider paired with a synced number field for fine-tuned keyboard entry — typed values commit on change, snapped to the step and clamped to the range.',
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
		'The range input is the labelled (`id`/`for`), named, form-participating control; its slider semantics (value, min, max) are native, and arrow keys step it. The number field is an exact-entry affordance with its own accessible name (`inputLabel`) and no `name` — it never submits. `description` and `error` chain into `aria-describedby` on the range (description first) and an `error` sets `aria-invalid`. `unit` is decorative and `aria-hidden` — put meaning-bearing units in the label or description.',
	a11yLinks: [
		{ label: 'APG Slider pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/' },
		{
			label: 'MDN: <input type="range">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range'
		}
	]
};
