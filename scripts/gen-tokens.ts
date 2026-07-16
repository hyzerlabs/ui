/**
 * Regenerate the committed token sheets from the token engine:
 *   - src/lib/tokens/tokens.css              (base schema, full mode)
 *   - src/lib/theme/examples/{ocean,sunset}.css (example configs, overrides mode)
 * Run via `pnpm gen:tokens`. Drift tests (src/lib/config/config.spec.ts and
 * src/lib/theme/examples/examples.spec.ts) fail CI when a committed sheet
 * and its engine output diverge.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig, generateCss } from '../src/lib/config/index.js';
import oceanConfig, { intro as oceanIntro } from '../src/lib/theme/examples/ocean.config.js';
import sunsetConfig, { intro as sunsetIntro } from '../src/lib/theme/examples/sunset.config.js';

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
		target: 'src/lib/theme/examples/sunset.css',
		css: generateCss(resolveConfig(sunsetConfig), { mode: 'overrides', intro: sunsetIntro })
	}
];

for (const { target, css } of sheets) {
	writeFileSync(join(root, target), css);
	console.log(`wrote ${target}`);
}
