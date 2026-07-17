/**
 * Regenerate the committed token sheets from the token engine:
 *   - src/lib/tokens/tokens.css                    (base schema, full mode)
 *   - src/lib/theme/examples/ocean.css             (:root token-override sheet)
 *   - src/lib/theme/examples/{sunset,terminal}/*.tokens.css
 *         (class-scoped palettes for the class-override themes, specs/32 R4)
 * Run via `pnpm gen:tokens`. Drift tests (src/lib/config/config.spec.ts and
 * src/lib/theme/examples/examples.spec.ts) fail CI when a committed sheet
 * and its engine output diverge.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig, generateCss } from '../src/lib/config/index.js';
import oceanConfig, { intro as oceanIntro } from '../src/lib/theme/examples/ocean.config.js';
import sunsetConfig, {
	intro as sunsetIntro
} from '../src/lib/theme/examples/sunset/sunset.config.js';
import terminalConfig, {
	intro as terminalIntro
} from '../src/lib/theme/examples/terminal/terminal.config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const sheets = [
	{
		target: 'src/lib/tokens/tokens.css',
		css: generateCss(resolveConfig())
	},
	{
		target: 'src/lib/theme/examples/ocean.css',
		css: generateCss(resolveConfig(oceanConfig), { mode: 'overrides', intro: oceanIntro })
	},
	{
		target: 'src/lib/theme/examples/sunset/sunset.tokens.css',
		css: generateCss(resolveConfig(sunsetConfig), {
			mode: 'overrides',
			selector: '.hz-theme-sunset',
			intro: sunsetIntro
		})
	},
	{
		target: 'src/lib/theme/examples/terminal/terminal.tokens.css',
		css: generateCss(resolveConfig(terminalConfig), {
			mode: 'overrides',
			selector: '.hz-theme-terminal',
			intro: terminalIntro
		})
	}
];

for (const { target, css } of sheets) {
	writeFileSync(join(root, target), css);
	console.log(`wrote ${target}`);
}
