/**
 * Terminal: an example theme that stands on its own.
 *
 * This is a working config, the kind you would write yourself. Running the
 * `hyzer` CLI over it produces `terminal.tokens.css` beside it, so edit this
 * file and regenerate rather than editing the sheet by hand.
 */
import { defineConfig } from '../../../config/index.js';

/** The comment header the generated sheet opens with. */
export const intro = [
	'Example theme: Terminal (tokens)',
	'A phosphor-on-black palette for the standalone CRT sheet. It is scoped to',
	'the .hz-theme-terminal class rather than :root, so the theme travels with',
	'the class. That lets it share a page with anything else.',
	'',
	'Both looks here are dark. The default is a tube at rest, and the dark',
	'theme is lights-out: brighter phosphor on true black.',
	'',
	'It is an EXTENSION as well. `phosphor` and `amber` are new intents, not',
	'remaps: two hues the library does not ship, given intent names of their',
	'own. They are typed in intents.d.ts, and the contrast report grades them',
	'like any other intent. <Button intent="amber"> type-checks and',
	'autocompletes.',
	'',
	'The theme decides its own TYPE too, not only its color. The mono stack',
	"here is the theme's, and it adds an xs step to a scale that ships six.",
	'Setting them here lets every component sheet inherit both from the theme',
	'root instead of repeating a font-family.',
	'',
	'This file is the palette and the type. terminal.css imports it along with',
	'the component sheets, and documents how to use them.',
	'',
	'Import order matters: these rules win by coming last.',
	"  import '@hyzer-labs/ui/tokens.css';",
	"  // NO '@hyzer-labs/ui/theme': that is the point.",
	"  import '@hyzer-labs/ui/theme/examples/terminal/terminal.css';"
];

export default defineConfig({
	// Everything under `tokens` is the default theme: it is authored into the
	// :root block, which is what a page gets with no data-theme attribute.
	// Named variants (dark, and any of your own) go under `themes`.
	tokens: {
		typography: {
			// The theme's own stack, and a real difference from the default: it
			// leads with the boxy grotesques a terminal emulator ships with
			// rather than the system UI mono. System faces only, so it resolves
			// wherever it runs and the example never depends on a font it does
			// not ship. Name your own face here if you load one.
			fontFamily: {
				mono: "Menlo, Monaco, Consolas, 'DejaVu Sans Mono', 'Courier New', monospace"
			},
			fontSize: { xs: '0.75rem' }
		},
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

			// The stock intent, remapped onto this theme's own hue. A consumer
			// writing <Button intent="primary"> gets the tube green, with no
			// second near-identical color in the palette to wonder about.
			primary: 'var(--hz-palette-phosphor)',

			// Two intents the library does not ship. It comes with seven, and
			// nothing stops a theme adding more. Each points at a hue defined
			// above, so these are new categories all the way down rather than
			// second names for colors that already existed. Both are graded by
			// the contrast report and typed in ./intents.d.ts, so they behave
			// exactly like the built-in intents.
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
