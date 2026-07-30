/** Icons' DocPage inputs. Moved into Components ( IA). */
import type { ComponentDoc } from './types.js';

export const iconsDoc: ComponentDoc = {
	importLine: 'import IconSearch from "@hyzer-labs/ui/icons/search"',
	props: [
		{ name: 'size', type: 'number', default: '24', note: 'Width and height in px.' },
		{ name: 'strokeWidth', type: 'number', default: '2' },
		{
			name: 'intent',
			type: 'Intent',
			default: '—',
			note: 'Colors the glyph from the shared intent vocabulary.',
			noteHref: '/docs/foundation/colors#intent'
		},
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			note: 'Absent or empty means decorative, so the icon gets aria-hidden="true".'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-icon class.' }
	]
};
