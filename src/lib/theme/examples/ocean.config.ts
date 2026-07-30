/**
 * Ocean: an example theme built from nothing but token overrides.
 *
 * This is a working config, the kind you would write yourself. Running the
 * `hyzer` CLI over it produces `ocean.css` beside it, so edit this file and
 * regenerate rather than editing the sheet by hand.
 */
import { defineConfig } from '../../config/index.js';

/** The comment header the generated sheet opens with. */
export const intro = [
	'Example theme: Ocean',
	'Cool teal accents on slate neutrals. Every difference comes from',
	'redefining tokens. No component is restyled by hand.',
	'',
	'Import order matters: these overrides win by coming last.',
	"  import '@hyzer-labs/ui/tokens.css';",
	"  import '@hyzer-labs/ui/theme';            // optional",
	"  import '@hyzer-labs/ui/theme/examples/ocean.css';"
];

export default defineConfig({
	// Everything under `tokens` is the default theme: it is authored into the
	// :root block, which is what a page gets with no data-theme attribute.
	// Named variants (dark, and any of your own) go under `themes`.
	tokens: {
		palette: {
			// The accent hues. Warning and success are a little deeper than the
			// stock ones so they still pass AA on this theme's tinted surface.
			primary: '#0f766e',
			secondary: '#155e75',
			info: '#0369a1',
			warning: '#92400e',
			success: '#166534'
		},
		color: {
			// The semantic roles: what a color does in the layout.
			surface: '#f8fafc',
			text: '#0f172a',
			textMuted: '#475569',
			border: '#64748b'
		},
		// One intent remapped: neutral takes the slate used for muted text,
		// because the stock gray falls just short of AA on this theme's surface.
		intent: { neutral: 'var(--hz-color-text-muted)' }
	},
	themes: {
		dark: {
			palette: {
				// The dark theme brightens the accents that sit on a dark surface.
				primary: '#2dd4bf',
				secondary: '#22d3ee',
				danger: '#fca5a5'
			},
			color: {
				surface: '#0b1120',
				text: '#e2e8f0',
				textMuted: '#94a3b8'
			}
		}
	}
});
