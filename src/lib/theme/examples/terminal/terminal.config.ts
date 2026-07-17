/**
 * Terminal — example theme config (specs/32 R1).
 * `pnpm gen:tokens` renders this through the token engine (overrides mode,
 * scoped to `.hz-theme-terminal`) into the committed terminal.tokens.css next
 * to it; a drift test keeps them in sync. The config doubles as docs:
 * /theming/examples shows it verbatim.
 *
 * Terminal is the STANDALONE example: the sheets in ./components style the
 * headless hooks from scratch and the reference theme is never imported.
 *
 * It is also the EXTENSION example. Two intents the library has never heard
 * of — `phosphor` and `amber`, the two tubes every real terminal shipped with
 * — are defined below, registered as types in ./intents.d.ts, and styled in
 * ./components/button.css. They are not second-class: the contrast report
 * grades them exactly like `primary`, and `<Button intent="amber">`
 * type-checks and autocompletes.
 */
import { defineConfig } from '../../../config/index.js';

/** Header prose woven into the generated sheet. */
export const intro = [
	'Example theme — Terminal (tokens)',
	'Phosphor-on-black palette for the standalone CRT sheet. Scoped to the',
	'.hz-theme-terminal class rather than :root, so the theme travels with',
	'the class and can share a page with anything else.',
	'',
	'Terminal declines to be a light theme: both modes are dark. Light is the',
	'tube at rest, dark is lights-out — brighter phosphor on true black.',
	'',
	'This is only the palette — terminal.css imports it plus the component',
	'sheets. See terminal.css for the usage contract.'
];

export default defineConfig({
	tokens: {
		color: {
			// Layer 1 — palette. Saturated phosphor and signal colors, all
			// bright enough to burn through a black surface.
			primary: '#00ff41',
			secondary: '#00e5ff',
			danger: '#ff3b30',
			warning: '#ffb000',
			success: '#00ff41',
			info: '#00e5ff',

			// Layer 2 — semantic roles. There is no light mode: this IS the
			// light mode. A CRT at rest still glows.
			surface: '#0b0f0b',
			text: '#33ff66',
			textMuted: '#00a844',
			border: '#00ff41'
		},
		intent: {
			// Intent remap: neutral rides the dim phosphor rather than a gray
			// that would be invisible here.
			neutral: 'var(--hz-color-text-muted)',

			// NEW CATEGORY INTENTS — the extension surface (specs/32).
			// The library ships six; nothing stops a theme adding more. These
			// two are graded by the contrast report and typed via
			// ./intents.d.ts, so they behave like first-class intents.
			phosphor: 'var(--hz-color-primary)',
			amber: '#ffb000'
		}
	},
	dark: {
		color: {
			// Lights-out: true black, and the phosphor pushed hotter.
			surface: '#000000',
			text: '#4dff80',
			textMuted: '#00c853',
			border: '#33ff66'
		}
	}
});
