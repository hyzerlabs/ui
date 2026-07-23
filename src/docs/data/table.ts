/** Table's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const tableDoc: ComponentDoc = {
	description:
		'A data table with client sorting, row selection, a sticky header, built-in empty/loading states, and an opt-in stacked mode for narrow widths. Real <table> semantics throughout.',
	importLine: 'import { Table } from "@hyzer-labs/ui"',
	props: [
		{ name: 'items', type: 'T[]', default: '—', note: 'Required.' },
		{
			name: 'columns',
			type: 'TableColumn<T>[]',
			default: '—',
			note: "Required. Each column's `key` is a property name on T — the default cell reads `row[key]`. See TableColumn below."
		},
		{
			name: 'caption',
			type: 'string | Snippet',
			default: '—',
			note: 'Visible caption. `caption` or `ariaLabel` is required — dev-warns if neither is set. Caption wins if both are given (no aria-label).'
		},
		{ name: 'ariaLabel', type: 'string', default: '—', note: 'See `caption`.' },
		{
			name: 'sort',
			type: 'TableSort | null',
			default: 'null',
			note: 'Bindable. See TableSort below.'
		},
		{
			name: 'clientSort',
			type: 'boolean',
			default: 'true',
			note: 'false: Table renders `items` as given and only reports/marks sort state — you reorder `items` yourself.'
		},
		{
			name: 'selectable',
			type: 'boolean',
			default: 'false',
			note: 'Prepends a checkbox column.'
		},
		{
			name: 'selected',
			type: 'SvelteSet<string>',
			default: 'new SvelteSet()',
			note: 'Bindable — row ids (via getRowId) currently selected.'
		},
		{
			name: 'getRowId',
			type: '(row: T, index: number) => string',
			default: 'stringified index',
			note: 'Row identity for selection. Supply a real id so selection survives re-sorting.'
		},
		{
			name: 'rowLabel',
			type: '(row: T) => string',
			default: '—',
			note: "Accessible name for a row's checkbox; falls back to the first column's cell text."
		},
		{ name: 'stickyHeader', type: 'boolean', default: 'false' },
		{ name: 'loading', type: 'boolean', default: 'false' },
		{ name: 'loadingRows', type: 'number', default: '3' },
		{
			name: 'stack',
			type: "'sm' | 'md' | 'lg'",
			default: '—',
			note: 'Stacks below the named width. Off by default (scroll wrap only).'
		},
		{
			name: 'cell',
			type: 'Snippet<[T, TableColumn<T>]>',
			default: '—',
			note: 'Default is `String(row[column.key])`.'
		},
		{ name: 'empty', type: 'Snippet', default: '—', note: 'Default is "No rows".' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after hz-table-wrap.' }
	],
	types: [
		{
			name: 'TableColumn<T>',
			props: [
				{
					name: 'key',
					type: 'string',
					default: '—',
					note: 'Required. A property name on a row of T (the default cell renders `row[key]`) and the column id (sort target, stacked-mode data-label).'
				},
				{
					name: 'header',
					type: 'string',
					default: '—',
					note: 'Required. Header cell text (also the stacked-mode label).'
				},
				{ name: 'sortable', type: 'boolean', default: 'false' },
				{
					name: 'sortBy',
					type: '(row: T) => string | number',
					default: 'row[key]',
					note: 'The escape hatch for mixed-type or computed sort values.'
				},
				{
					name: 'align',
					type: "'start' | 'center' | 'end'",
					default: "'start'",
					note: 'Logical — flips under RTL.'
				},
				{ name: 'width', type: 'string', default: '—', note: "CSS width for the column's <col>." }
			]
		},
		{
			name: 'TableSort',
			props: [
				{ name: 'key', type: 'string', default: '—' },
				{ name: 'direction', type: "'asc' | 'desc'", default: '—' }
			]
		}
	],
	a11yNote:
		"Static data table, not an APG *grid* — sort buttons and checkboxes are ordinary native controls in the natural tab order; there is no roving grid navigation. `aria-sort` (`ascending`/`descending`) sits only on the sorted column's `th`, never on the others. Select-all announces the partial state via the native `indeterminate` property (not an ARIA attribute). Loading skeleton rows carry `aria-hidden`, so they never reach assistive tech. Real `role`/`scope` semantics are stamped explicitly (`table`/`row`/`columnheader`/`cell`, plus `scope`) so they survive the stacked mode's CSS display overrides.",
	a11yLinks: [
		{
			label: 'APG sortable table example',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/'
		},
		{
			label: 'MDN — accessible data tables',
			href: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML#accessible_data_tables'
		}
	]
};
