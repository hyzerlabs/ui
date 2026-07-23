/** Form's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const formDoc: ComponentDoc = {
	description:
		"A form wrapper that renders an accessible error summary and manages focus on failed submits — while staying out of the way of native submission and SvelteKit's use:enhance.",
	importLine: 'import { Form, toFormErrors } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'errors',
			type: 'FormError[]',
			default: '[]',
			note: 'The summary renders when non-empty. See FormError below.'
		},
		{
			name: 'onSubmit',
			type: '(e: SubmitEvent) => void',
			default: '—',
			note: 'Omit for native submission / use:enhance (the default path); provide it for client-side validation — preventDefault runs first.'
		},
		{ name: 'summaryTitle', type: 'string', default: "'There is a problem'" },
		{
			name: 'summaryHeadingLevel',
			type: '2 | 3 | 4 | 5 | 6',
			default: '2',
			note: "Match the page's heading structure."
		},
		{
			name: 'focusTarget',
			type: "'summary' | 'firstField'",
			default: "'summary'",
			note: 'What receives focus after a submit with errors.'
		},
		{ name: 'novalidate', type: 'boolean', default: 'false' },
		{ name: 'ariaLabel', type: 'string', default: '—', note: 'Names the form landmark.' },
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The form content.' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-form class.' }
	],
	types: [
		{
			name: 'FormError',
			props: [
				{
					name: 'name',
					type: 'string',
					default: '—',
					note: 'Field name to link to. Empty or unresolved names become non-interactive form-level errors, listed last.'
				},
				{ name: 'message', type: 'string', default: '—', note: 'Required.' }
			]
		}
	],
	a11yNote:
		'The error summary is the first child of the form, has `role="alert"` (announced when it appears), and is focused when errors arrive after a submit — or the first invalid field is, with `focusTarget="firstField"`. Each summary item links to its field and focuses it on activation, scrolling smoothly unless `prefers-reduced-motion` is set. Set `summaryHeadingLevel` so the summary title fits your page\'s heading outline.',
	a11yLinks: [
		{ label: 'MDN: <form>', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form' }
	]
};
