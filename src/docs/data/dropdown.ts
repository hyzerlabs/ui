/** Dropdown's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const dropdownDoc: ComponentDoc = {
	importLine: 'import { Dropdown } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'items',
			type: 'DropdownEntry[]',
			default: '—',
			note: 'Required. A DropdownEntry is either a DropdownItem or a DropdownSeparator, both below.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Visible trigger text (and the accessible name, unless triggerLabel overrides it).'
		},
		{
			name: 'triggerLabel',
			type: 'string',
			default: '—',
			note: 'Accessible-name override; required for an icon-only trigger (no label).'
		},
		{
			name: 'triggerProps',
			type: 'DropdownTriggerProps',
			default: '{}',
			note: "Trigger appearance pass-through. Resolves to variant: 'outline', intent: 'neutral'."
		},
		{
			name: 'triggerIcon',
			type: 'Snippet',
			default: '— (⇒ IconChevronDown)',
			note: 'Decorative; the labeled trigger renders it trailing, the icon-only trigger renders it alone.'
		},
		{ name: 'align', type: "'start' | 'center' | 'end'", default: "'start'" },
		{
			name: 'onselect',
			type: '(id: string, item: DropdownItem) => void',
			default: '—',
			note: "Fires on every activation, after the item's own onselect."
		},
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-dropdown class.' }
	],
	types: [
		{
			name: 'DropdownItem',
			props: [
				{
					name: 'id',
					type: 'string',
					default: '—',
					note: 'Required. Stable identity — keys the item, its DOM id, and the onselect callback.'
				},
				{ name: 'label', type: 'string', default: '—', note: 'Required.' },
				{
					name: 'disabled',
					type: 'boolean',
					default: '—',
					note: 'Stays focusable — reachable by Arrow / Home / End / typeahead — but inert on activation.'
				},
				{
					name: 'danger',
					type: 'boolean',
					default: '—',
					note: 'Destructive action — surfaces the data-danger styling hook.'
				},
				{
					name: 'icon',
					type: 'Snippet',
					default: '—',
					note: 'Decorative leading glyph; the label owns the accessible name.'
				},
				{
					name: 'onselect',
					type: '() => void',
					default: '—',
					note: "Per-item action, fired before the component's onselect."
				}
			]
		},
		{
			name: 'DropdownSeparator',
			props: [
				{
					name: 'separator',
					type: 'true',
					default: '—',
					note: 'A non-interactive divider — discriminates it from an actionable item.'
				}
			]
		}
	],
	a11yNote:
		"The trigger is a real button (the library's own Button) with `aria-haspopup=menu`, `aria-expanded`, and `aria-controls`. It opens a `role=menu` popup of `role=menuitem` buttons, named by the trigger via `aria-labelledby`.\n\nUnlike `Combobox`, which keeps DOM focus on its text input and tracks a virtually-focused option with `aria-activedescendant`, Dropdown moves real DOM focus into the menu. Opening it lands focus on the first menuitem (the last, on `ArrowUp`). A roving `tabindex` (`0` on the focused item, `-1` on the rest) keeps the menu a single tab stop, so the active item is styled with native `:focus` rather than a `data-active` hook.\n\nKeyboard: `ArrowDown`/`ArrowUp` move focus and wrap, including over disabled items. `Home`/`End` jump to the first and last item. Typing a character cycles focus to the next item whose label starts with it. `Enter`/`Space` activate the focused item through its own native button click, with no separate handling. `Escape` closes the menu and returns focus to the trigger. `Tab`/`Shift+Tab` close the menu and let focus move on, since there is no focus trap.\n\nA disabled item keeps `aria-disabled=true` rather than the native `disabled` attribute, so it stays focusable and screen-reader users can discover it. Activating it does nothing.",
	a11yLinks: [
		{
			label: 'APG Menu Button pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/'
		}
	]
};
