/**
 * Terminal: an example theme that stands on its own.
 *
 * This is a working config, the kind you would write yourself. Running the
 * `hyzer` CLI over it produces `terminal.tokens.css` beside it, so edit this
 * file and regenerate rather than editing the sheet by hand.
 *
 * Two things make it worth reading. It is STANDALONE: the sheets in
 * ./components style the headless hooks from scratch, and the reference theme is
 * never imported. It is also an EXTENSION: `phosphor` and `amber`, two hues the
 * library does not ship, become intents of their own here, typed in
 * ./intents.d.ts and styled in ./components/button.css. Nothing about them is
 * second class. The contrast report grades them like any other intent, and
 * `<Button intent="amber">` type-checks and autocompletes.
 */
import { defineConfig } from '../../../config/index.js';

/** The comment header the generated sheet opens with. */
export const intro = [
	'Example theme: Terminal (tokens)',
	'A phosphor-on-black palette for the standalone CRT sheet. It is scoped to',
	'the .hz-theme-terminal class rather than :root, so the theme travels with',
	'the class and can share a page with anything else.',
	'',
	'Both looks here are dark. The default is a tube at rest, and the dark',
	'theme is lights-out: brighter phosphor on true black.',
	'',
	'This file is only the palette. terminal.css imports it along with the',
	'component sheets, and documents how to use them.'
];

export default defineConfig({
	// Everything under `tokens` is the default theme: it is authored into the
	// :root block, which is what a page gets with no data-theme attribute.
	// Named variants (dark, and any of your own) go under `themes`.
	tokens: {
		palette: {
			// Saturated signal colors, all bright enough to read on black.
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
			// The semantic roles. There is no pale variant of this theme: even at
			// rest a CRT glows, so the default look is already dark.
			surface: '#0b0f0b',
			text: '#33ff66',
			textMuted: '#00a844',
			border: '#00ff41'
		},
		intent: {
			// Neutral takes the dim phosphor, since a gray would be invisible here.
			neutral: 'var(--hz-color-text-muted)',

			// Intents the library does not ship. It comes with six; nothing stops
			// a theme adding more. Each points at a hue defined above, so these
			// are new categories all the way down rather than second names for
			// colors that already existed. Both are graded by the contrast
			// report and typed in ./intents.d.ts, so they behave exactly like
			// the built-in intents.
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
				// Lights-out: true black, with the phosphor pushed hotter.
				surface: '#000000',
				text: '#4dff80',
				textMuted: '#00c853',
				border: '#33ff66'
			}
		}
	}
});
