/** FileUpload's DocPage inputs — specs/40 R1. */
import type { ComponentDoc } from './types.js';

export const fileUploadDoc: ComponentDoc = {
	description:
		'A file selection field backed by a real native input — single or multiple, with accept/maxSize/maxFiles validation, a removable file list, and an optional drag-and-drop dropzone. It is a selection field, not a network uploader: the real named input carries the chosen files into a plain form submission or into your own upload code.',
	importLine: 'import { FileUpload } from "@hyzer-labs/ui"',
	props: [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Carried by the native input.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{
			name: 'files',
			type: 'File[]',
			default: '[]',
			note: 'Bindable. Selected files in selection order — not a FileList.'
		},
		{
			name: 'multiple',
			type: 'boolean',
			default: 'false',
			note: 'Single mode replaces on each pick; multiple mode appends + de-dupes.'
		},
		{
			name: 'accept',
			type: 'string',
			default: '—',
			note: 'Native accept syntax: extensions, exact MIME types, or wildcard MIME types.'
		},
		{
			name: 'maxSize',
			type: 'number',
			default: '—',
			note: 'Bytes, per file. No total-size cap.'
		},
		{
			name: 'maxFiles',
			type: 'number',
			default: '—',
			note: 'Multiple mode only — ignored in single mode (cap is inherently 1).'
		},
		{
			name: 'dropzone',
			type: 'boolean',
			default: 'false',
			note: 'Swaps the visible input for a drag-and-drop surface + activation button.'
		},
		{ name: 'buttonText', type: 'string', default: "'Browse files'", note: 'Dropzone mode only.' },
		{
			name: 'dropzoneText',
			type: 'string',
			default: "'Drag and drop files here, or'",
			note: 'Dropzone mode only.'
		},
		{
			name: 'onchange',
			type: '(files: File[]) => void',
			default: '—',
			note: 'Fires on every accepted change: add, remove, or single-mode replace.'
		},
		{
			name: 'onreject',
			type: '(rejections: FileRejection[]) => void',
			default: '—',
			note: 'Fires whenever a pick or drop yields rejected files — see FileRejection below.'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state. The component never sets this itself.'
		},
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-file-upload classes.'
		}
	],
	types: [
		{
			name: 'FileRejection',
			props: [
				{ name: 'file', type: 'File', default: '—', note: 'The rejected file.' },
				{
					name: 'reason',
					type: "'type' | 'size' | 'too-many'",
					default: '—',
					note: 'Accept mismatch, over maxSize, or beyond the count cap.'
				},
				{
					name: 'message',
					type: 'string',
					default: '—',
					note: 'A ready-to-display English string.'
				}
			]
		}
	],
	a11yNote:
		"Drag-and-drop is a progressive enhancement — the non-drag alternative is always present: in basic mode the visible native input opens the platform picker directly; in dropzone mode a real `<button>` (`buttonText`) opens the same picker, so no function ever depends on a dragging movement (WCAG 2.5.7). The native input is labelled by the field's `<label for>`; in dropzone mode it is `aria-hidden` and out of the tab order, since the button is the operable, accessible control. Each selected file's remove button carries a unique `Remove` label naming that file. File additions, removals, and rejection counts are announced through a polite `aria-live` status region, separate from the file list, so screen-reader users hear dynamic changes the re-rendered list alone wouldn't surface. The theme's dragover state is a background-and-border change, not color alone.",
	a11yLinks: [
		{
			label: 'MDN: <input type="file">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file'
		}
	]
};
