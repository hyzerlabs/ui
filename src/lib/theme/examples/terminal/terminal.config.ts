/**
 * Terminal — example theme config.
 * `pnpm gen:tokens` renders this through the token engine (overrides mode,
 * scoped to `.hz-theme-terminal`) into the committed terminal.tokens.css next
 * to it — generated from this config, regenerate rather than hand-editing
 * terminal.tokens.css directly. The config doubles as docs: /docs/theming/examples
 * shows it verbatim.
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
	// Everything under `tokens` is the default theme: it is authored into the
	// :root block, which is what a page gets with no data-theme attribute.
	// Named variants (dark, and any of your own) go under `themes`.
	tokens: {
		palette: {
			// Layer 1 — palette. Saturated phosphor and signal colors, all
			// bright enough to burn through a black surface.
			secondary: '#00e5ff',
			danger: '#ff3b30',
			warning: '#ffd166',
			success: '#00ff41',
			info: '#00e5ff',

			// The two phosphor tubes a real terminal shipped with: P1 green and
			// the P3 amber of a later monitor. These are new hues, not remaps,
			// and phosphor is the canonical green here. There is deliberately no
			// separate palette primary: the intent below points at phosphor, so
			// the theme has one green with one name rather than two that look
			// alike.
			phosphor: '#39ff6a',
			amber: '#ffb000'
		},
		color: {
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

			// NEW CATEGORY INTENTS — the extension surface.
			// The library ships six; nothing stops a theme adding more. Each
			// points at a hue added above, so this is a new category all the way
			// down rather than a second name for an existing color. Both are
			// graded by the contrast report and typed via ./intents.d.ts, so
			// they behave like first-class intents.
			// The stock intent, remapped onto this theme's own hue. A consumer
			// writing <Button intent="primary"> gets the tube green, with no
			// second near-identical color in the palette to wonder about.
			primary: 'var(--hz-palette-phosphor)',

			phosphor: 'var(--hz-palette-phosphor)',
			amber: 'var(--hz-palette-amber)'
		}
	},
	themes: {
		dark: {
			color: {
				// Lights-out: true black, and the phosphor pushed hotter.
				surface: '#000000',
				text: '#4dff80',
				textMuted: '#00c853',
				border: '#33ff66'
			}
		}
	}
});
