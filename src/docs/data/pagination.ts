/** Pagination's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const paginationDoc: ComponentDoc = {
	importLine: 'import { Pagination } from "@hyzer-labs/ui"',
	props: [
		{ name: 'count', type: 'number', default: '—', note: 'Required. Total pages.' },
		{ name: 'page', type: 'number', default: '1', note: 'Bindable. 1-based.' },
		{
			name: 'siblings',
			type: 'number',
			default: '1',
			note: 'Pages shown on each side of the current page.'
		},
		{ name: 'boundaries', type: 'number', default: '1', note: 'Pages pinned at each end.' },
		{
			name: 'href',
			type: '(page: number) => string',
			default: '—',
			note: 'Link mode: items render as real anchors; omit for button mode.'
		},
		{ name: 'onchange', type: '(page: number) => void', default: '—' },
		{ name: 'ariaLabel', type: 'string', default: "'Pagination'", note: 'Names the landmark.' },
		{ name: 'prevLabel', type: 'string', default: "'Previous page'" },
		{ name: 'nextLabel', type: 'string', default: "'Next page'" },
		{
			name: 'pageLabel',
			type: '(page: number) => string',
			default: '`Page ${page}`',
			note: 'Accessible name per page item.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-pagination class.' }
	],
	a11yNote:
		'Pagination renders a `<nav>` landmark named by `ariaLabel` — give it a distinct name when a page hosts several.\n\nEvery control is a `Button`, so the current item carries `aria-current="page"`, page items get full accessible names via `pageLabel` ("Page 7", not a bare number), and ellipses are decorative.\n\nIn link mode, everything is a real `<a>`. At the ends, the previous/next controls render as disabled Buttons without an `href` — a link can\'t be disabled, and a dead link announcing itself helps no one.\n\nTab order is native; there are no roving-focus tricks.',
	a11yLinks: [
		{ label: 'MDN: <nav>', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav' }
	]
};
