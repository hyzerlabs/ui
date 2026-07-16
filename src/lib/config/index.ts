/**
 * @hyzer-labs/ui token engine — the `./config` subpath (specs/29).
 *
 * `hyzer.config.ts` consumer hook: `defineConfig` for typed configs, plus
 * the pure engine (`resolveConfig` → `generateCss`/`contrastReport`) the
 * `hyzer` CLI and this repo's own `pnpm gen:tokens` both run on. With no
 * config, `generateCss(resolveConfig())` is exactly the shipped tokens.css.
 */

export {
	defineConfig,
	resolveConfig,
	HyzerConfigError,
	type HyzerConfig,
	type HyzerTokensOverride,
	type HyzerDarkOverride,
	type TokenGroupOverride,
	type ColorGroupOverride,
	type ResolvedConfig,
	type ResolvedSection,
	type TokenEntry,
	type SectionId
} from './schema.js';
export { generateCss, type GenerateOptions } from './generate.js';
export { contrastReport, type ContrastReport, type ContrastReportRow } from './report.js';
