/**
 * Ocean — example theme config.
 * `pnpm gen:tokens` renders this through the token engine (overrides mode)
 * into the committed ocean.css next to it — generated from this config,
 * regenerate rather than hand-editing ocean.css directly. The config doubles
 * as docs: /theming/examples shows it verbatim.
 */
import { defineConfig } from '../../config/index.js';

/** Header prose woven into the generated sheet. */
export const intro = [
	'Example theme — Ocean',
	'Cool teal accents on slate neutrals. A token-override sheet: it restyles',
	'the headless hooks AND the reference theme purely by redefining tokens.',
	'',
	'Usage (order matters — overrides win by coming later in the cascade):',
	"  import '@hyzer-labs/ui/tokens.css';",
	"  import '@hyzer-labs/ui/theme';            // optional",
	"  import '@hyzer-labs/ui/theme/examples/ocean.css';"
];

export default defineConfig({
	tokens: {
		palette: {
			// Layer 1 — accent palette. Warning/success deepen slightly from
			// the base hues so they hold AA on the slate-tinted muted surface.
			primary: '#0f766e',
			secondary: '#155e75',
			info: '#0369a1',
			warning: '#92400e',
			success: '#166534'
		},
		color: {
			// Layer 2 — semantic roles (light)
			surface: '#f8fafc',
			text: '#0f172a',
			textMuted: '#475569',
			border: '#64748b'
		},
		// Intent remap: neutral rides the muted-text slate instead of the base
		// gray, which falls just short of AA on this theme's muted surface.
		intent: { neutral: 'var(--hz-color-text-muted)' }
	},
	themes: {
		dark: {
			palette: {
				// Brighten accents that sit on dark surfaces.
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
