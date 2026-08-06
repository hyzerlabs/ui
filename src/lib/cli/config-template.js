/**
 * The full-reference `hyzer.config.ts`. It shows every option in the schema
 * (src/lib/config/schema.ts) with each group commented out, so as written it
 * is a valid, empty config (`defineConfig({})`). Uncomment one line, or all of
 * them, and it stays valid (checked against resolveConfig). This is the one
 * source of truth for `hyzer init`, the docs Config & CLI page, and the
 * `@hyzer-labs/sv` community add-on.
 *
 * The `tokens`/`themes` defaults below (`CONFIG_TOKEN_DEFAULTS` /
 * `CONFIG_DARK_DEFAULTS`) are generated from `src/lib/tokens/index.ts`; see
 * `config-defaults.js` and `scripts/gen-config-defaults.ts`, run by
 * `pnpm gen:tokens`. Edit that pair at the generator. Everything else in this
 * file is hand-written prose, edited here.
 */
import { CONFIG_TOKEN_DEFAULTS, CONFIG_DARK_DEFAULTS } from './config-defaults.js';

export const INIT_HEADER = `// hyzer.config.ts: every option, commented out. Valid exactly as written.
// Uncomment what you need, then run:
//   hyzer generate                   write the token sheet
//   hyzer generate --check --strict  validate without writing (for CI)
// The values shown are the current defaults, so uncommenting a line changes nothing until you edit it.
// Docs: https://design.hyzer.sh/docs/foundation/config

`;

export const CONFIG_TEMPLATE = `import { defineConfig } from '@hyzer-labs/ui/config';

export default defineConfig({
	/**
	 * Where the sheet goes, and what the default theme is called.
	 */
	// output: 'src/styles/tokens.css', // path relative to this file; leave it out and the sheet lands here as hyzer-tokens.css
	// selector: '.theme-ocean', // root the sheet at a class instead of :root, so one region keeps its own palette
	// defaultThemeName: 'brand', // names the tokens block below, and the [data-theme] value that restores it; default 'default'

	/**
	 * The default theme: every token below, with the value the library ships.
	 * Uncomment a line and change it to make it yours. Leave the rest alone.
	 */
${CONFIG_TOKEN_DEFAULTS}

	/**
	 * Named overrides of the default above, one block per data-theme="<name>".
	 * Each takes any group \`tokens\` takes, not only color.
	 *
	 * \`dark\` is always emitted, so an entry here changes dark rather than
	 * creating it. Its name is fixed, because the platform defines it. Any
	 * other name is yours:
	 *   ocean: { palette: { primary: '#0ea5e9' } }
	 *   print: { typography: { fontSize: { base: '0.9rem' } }, radius: { md: '0' } }
	 */
${CONFIG_DARK_DEFAULTS}

	// icons: ['plus', 'trash-2', 'settings'], // trims the generated icons.ts barrel

	// utilities: true, // opt in to hyzer-utilities.css (or { output: 'styles/hyzer-utilities.css' })

	// contrast: { level: 'AAA' }, // the WCAG bar the report grades against; default 'AA'
	// strict: true                // fail the run on a contrast miss, an unknown icon or an out-of-date file; --strict does the same
});
`;
