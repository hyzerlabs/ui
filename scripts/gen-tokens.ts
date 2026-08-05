/**
 * Regenerate the committed token sheets from the token engine:
 *   - src/lib/tokens/tokens.css                    (base schema, full mode)
 *   - src/lib/theme/examples/ocean.css             (:root token-override sheet)
 *   - src/lib/theme/examples/terminal/terminal.tokens.css
 *         (class-scoped palette for the class-override theme, specs/32 R4)
 *   - src/lib/theme/utilities.css                  (opt-in utility sheet, specs/44)
 *   - src/lib/cli/config-defaults.js               (the config template's
 *         commented defaults, specs/69 R6 — text, not CSS, so it is written
 *         separately from the `sheets` loop below)
 * The "Docs" example (specs/46, theme/examples/docs/docs.css) is
 * hand-authored, not engine output — it has no config and no entry here.
 * Run via `pnpm gen:tokens`. Drift tests (src/lib/config/config.spec.ts and
 * src/lib/theme/examples/examples.spec.ts) fail CI when a committed sheet
 * and its engine output diverge; src/lib/cli/main.spec.ts does the same for
 * config-defaults.js.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig, generateCss, generateUtilitiesCss } from '../src/lib/config/index.js';
import oceanConfig, { intro as oceanIntro } from '../src/lib/theme/examples/ocean.config.js';
import terminalConfig, {
	intro as terminalIntro
} from '../src/lib/theme/examples/terminal/terminal.config.js';
import { renderConfigDefaults } from './gen-config-defaults.js';

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
		target: 'src/lib/theme/examples/terminal/terminal.tokens.css',
		css: generateCss(resolveConfig(terminalConfig), {
			mode: 'overrides',
			intro: terminalIntro
		})
	},
	{
		target: 'src/lib/theme/utilities.css',
		css: generateUtilitiesCss(resolveConfig())
	}
];

for (const { target, css } of sheets) {
	writeFileSync(join(root, target), css);
	console.log(`wrote ${target}`);
}

writeFileSync(join(root, 'src/lib/cli/config-defaults.js'), renderConfigDefaults());
console.log('wrote src/lib/cli/config-defaults.js');
