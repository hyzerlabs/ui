/**
 * Sunset — example theme config (specs/30 R2).
 * `pnpm gen:tokens` renders this through the token engine (overrides mode)
 * into the committed sunset.css next to it; a drift test keeps them in sync.
 * The config doubles as docs: /theming/examples shows it verbatim.
 */
import { defineConfig } from '../../config/index.js';

/** Header prose woven into the generated sheet. */
export const intro = [
	'Example theme — Sunset',
	'Warm ember accents on stone neutrals. A token-override sheet: it restyles',
	'the headless hooks AND the reference theme purely by redefining tokens.',
	'',
	'Usage (order matters — overrides win by coming later in the cascade):',
	"  import '@hyzer-labs/ui/tokens.css';",
	"  import '@hyzer-labs/ui/theme';            // optional",
	"  import '@hyzer-labs/ui/theme/examples/sunset.css';"
];

export default defineConfig({
	tokens: {
		color: {
			// Layer 1 — accent palette. Warning deepens from the base hue so
			// it holds AA on the warm-tinted muted surface.
			primary: '#c2410c',
			secondary: '#be185d',
			warning: '#854d0e',

			// Layer 2 — semantic roles (light)
			surface: '#fffbf5',
			text: '#1c1917',
			textMuted: '#57534e',
			border: '#78716c'
		},
		// Intent remap: neutral rides the muted-text stone instead of the base
		// gray, which falls just short of AA on this theme's muted surface.
		intent: { neutral: 'var(--hz-color-text-muted)' },
		// A touch more shape personality.
		radius: {
			md: '0.625rem',
			lg: '1.25rem'
		}
	},
	dark: {
		color: {
			surface: '#1c1917',
			text: '#fafaf9',
			textMuted: '#b3aca6',

			// Brighten accents that sit on the warm dark surface — sunset's
			// stone-900 base and its muted tint sit lighter than pure black.
			primary: '#fb923c',
			secondary: '#f9a8d4',
			danger: '#fca5a5'
		}
	}
});
