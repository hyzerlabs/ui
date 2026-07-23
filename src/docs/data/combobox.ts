/** Combobox's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const comboboxDoc: ComponentDoc = {
	description:
		'A multi-select, filterable text input that follows the WAI-ARIA APG combobox (list-autocomplete) pattern, with each pick rendered as a dismissible chip.',
	importLine: 'import {Combobox} from "@hyzer-labs/ui"',
	props: [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Repeated on every hidden input.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{
			name: 'options',
			type: 'FormOption[]',
			default: '—',
			note: 'Required. Flat, multi-select — see FormOption below.'
		},
		{
			name: 'value',
			type: 'string[]',
			default: '[]',
			note: 'Bindable. Selected option values, in selection order.'
		},
		{ name: 'placeholder', type: 'string', default: "'Search...'" },
		{
			name: 'filter',
			type: '(query: string, option: FormOption) => boolean',
			default: '—',
			note: 'Overrides the default case-insensitive substring match.'
		},
		{ name: 'emptyText', type: 'string', default: "'No results'" },
		{ name: 'toggleLabel', type: 'string', default: "'Show options'" },
		{
			name: 'chipProps',
			type: 'ComboboxChipProps',
			default: '{}',
			note: "Styling applied to every chip — see ComboboxChipProps below. Resolves to size: 'sm'."
		},
		{
			name: 'onchange',
			type: '(value: string[]) => void',
			default: '—',
			note: 'Fires on every selection change: toggle, chip dismiss, or Backspace removal.'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-combobox classes.'
		}
	],
	types: [
		{
			name: 'FormOption',
			props: [
				{ name: 'value', type: 'string', default: '—', note: 'Required.' },
				{
					name: 'label',
					type: 'string',
					default: '—',
					note: 'Required. Shown on the chip and in the option row.'
				},
				{
					name: 'disabled',
					type: 'boolean',
					default: '—',
					note: 'Inert — visible but never toggleable; an existing selection stays removable.'
				}
			]
		},
		{
			name: 'ComboboxChipProps',
			props: [
				{ name: 'intent', type: 'Intent', default: "'neutral'" },
				{ name: 'variant', type: "'soft' | 'solid' | 'outline'", default: "'soft'" },
				{
					name: 'size',
					type: "'sm' | 'md'",
					default: "'sm'",
					note: "Combobox's own default overrides Badge's md default."
				},
				{ name: 'rounded', type: "'none' | 'sm' | 'md' | 'lg' | 'full'", default: "'full'" },
				{ name: 'class', type: 'string', default: '—' }
			]
		}
	],
	a11yNote:
		"The visible input carries `role=combobox` with `aria-autocomplete=list`, `aria-expanded`, and `aria-controls` pointing at the `role=listbox` popup, which is `aria-multiselectable`. Instead of moving DOM focus into the list, the currently highlighted option is tracked as virtual focus via `aria-activedescendant` on the input, so screen readers announce the active option while the field stays editable. Each selected value renders as a `Badge` chip inside the control, and every chip's labelled dismiss button (announced as Remove, followed by the option's label) is a real, individually-focusable tab stop — tabbing into the field reaches the chips before the input. Keyboard: `ArrowDown`/`ArrowUp` open and move the active option (wrapping, skipping disabled entries); `Alt+ArrowDown` opens without moving; `Alt+ArrowUp` closes unchanged; `Home`/`End` jump to the first/last enabled option while open (native text-cursor behavior while closed); `Enter` toggles the active option's membership and keeps the popup open so you can keep picking; `Backspace` on an empty query removes the last chip; `Escape` closes and clears the filter query only — it never clears a selection, since every chip carries its own dismiss button; `Tab` closes and lets focus move on. The input is the only tab stop for opening the popup — the trailing toggle button is `tabindex=-1`, reachable by pointer only.",
	a11yLinks: [
		{ label: 'APG Combobox pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/' }
	]
};
