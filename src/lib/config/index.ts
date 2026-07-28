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
	type HyzerThemeOverride,
	type TokenGroupOverride,
	type RampGroupOverride,
	type ResolvedConfig,
	type ResolvedSection,
	type ResolvedTheme,
	type TokenEntry,
	type SectionId
} from './schema.js';
export {
	generateCss,
	generateUtilitiesCss,
	themeVars,
	type GenerateOptions,
	type GenerateUtilitiesOptions
} from './generate.js';
export {
	contrastReport,
	softTints,
	type ContrastReport,
	type ContrastReportRow
} from './report.js';
export { resolveIcons, type IconsResult } from './icons.js';
