/**
 * Sunset — example theme config (specs/30 R2, restructured by specs/32 R3).
 * `pnpm gen:tokens` renders this through the token engine (overrides mode,
 * scoped to `.hz-theme-sunset`) into the committed sunset.tokens.css next to
 * it; a drift test keeps them in sync. The config doubles as docs:
 * /theming/examples shows it verbatim.
 *
 * Sunset is the LAYERED example: this palette plus the neo-soft component
 * sheets in ./components, applied over the reference theme. The tokens do the
 * color; the class overrides do the tactile shape and elevation.
 */
import { defineConfig } from '../../../config/index.js';

/** Header prose woven into the generated sheet. */
export const intro = [
	'Example theme — Sunset (tokens)',
	'Warm ember accents on stone neutrals. Scoped to the .hz-theme-sunset',
	'class rather than :root, so the theme travels with the class and can',
	'share a page with anything else.',
	'',
	'This is only the palette — sunset.css imports it plus the component',
	'sheets. See sunset.css for the usage contract.'
];

export default defineConfig({
	tokens: {
		palette: {
			// Layer 1 — accent palette. Warning deepens from the base hue so
			// it holds AA on the warm-tinted muted surface.
			primary: '#c2410c',
			secondary: '#be185d',
			warning: '#854d0e'
		},
		color: {
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
		palette: {
			// Brighten accents that sit on the warm dark surface — sunset's
			// stone-900 base and its muted tint sit lighter than pure black.
			primary: '#fb923c',
			secondary: '#f9a8d4',
			danger: '#fca5a5'
		},
		color: {
			surface: '#1c1917',
			text: '#fafaf9',
			textMuted: '#b3aca6'
		}
	}
});
