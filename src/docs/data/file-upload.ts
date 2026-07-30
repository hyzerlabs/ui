/** FileUpload's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const fileUploadDoc: ComponentDoc = {
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
			note: 'Multiple mode only — ignored in single mode (the cap is always 1).'
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
		"Drag-and-drop is a progressive enhancement, so the non-drag alternative is always present. In basic mode, the visible native input opens the platform picker directly. In dropzone mode, a real `<button>` (`buttonText`) opens the same picker. No function ever depends on a dragging movement (WCAG 2.5.7).\n\nThe native input is labeled by the field's `<label for>`. In dropzone mode the input is `aria-hidden` and out of the tab order, because the button is the control you operate. `description` and `error` chain into `aria-describedby` on the input, description first. `required` sets `aria-required`, and an `error` sets `aria-invalid`.\n\nEach selected file's remove button carries its own `Remove` label naming that file. Additions, removals, and rejection counts are announced through a polite `aria-live` status region. That region sits outside the file list, so screen reader users hear changes the re-rendered list alone would not surface.\n\nThe theme's dragover state changes the background and the border, not the color alone.",
	a11yLinks: [
		{
			label: 'MDN: <input type="file">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file'
		}
	]
};
