/**
 * @hyzer-labs/ui token engine — icons config.
 *
 * Resolves a consumer's `icons: string[]` against the always-shipped
 * `CORE_ICONS` set and the generated Lucide manifest into the trimmed
 * barrel's file contents plus the run-report numbers. `icons` is a new leaf
 * on the existing resolved-config/report plumbing, not a parallel system —
 * mirrors `generate.ts`'s role for tokens.
 */
import { CORE_ICONS } from '../icons/core.js';
import { ICON_NAMES, LUCIDE_VERSION } from '../icons/generated/manifest.js';
import { pascalize } from '../icons/pascalize.js';
import type { ResolvedConfig } from './schema.js';

export interface IconsResult {
	/** Final deduplicated barrel list: core group (alphabetical), then configured extras (alphabetical). */
	names: string[];
	/** Always CORE_ICONS.length — every core icon ships no matter what. */
	coreCount: number;
	/** Configured names beyond the core set that were valid and newly added. */
	configuredCount: number;
	/** Configured names that aren't valid Lucide icon names — omitted from `names`. */
	unknown: string[];
	/** Rendered `icons.ts` module contents. */
	module: string;
}

/**
 * `undefined` when the config has no `icons` key at all (no icons file, no
 * report section — tokens behavior unchanged). `icons: []` still resolves —
 * the core-only barrel, the minimum vocabulary.
 */
export function resolveIcons(resolved: ResolvedConfig): IconsResult | undefined {
	const configured = resolved.icons;
	if (configured === undefined) return undefined;

	const known = new Set<string>(ICON_NAMES);
	const core = [...CORE_ICONS].sort();
	const coreSet = new Set<string>(core);

	const unknown = configured.filter((name) => !known.has(name));
	const extras = [
		...new Set(configured.filter((name) => known.has(name) && !coreSet.has(name)))
	].sort();

	const names = [...core, ...extras];
	return {
		names,
		coreCount: core.length,
		configuredCount: extras.length,
		unknown,
		module: renderIconsModule(names)
	};
}

function renderIconsModule(names: string[]): string {
	const header = [
		'/**',
		' * @hyzer-labs/ui trimmed icon barrel (hyzer generate).',
		' *',
		` * GENERATED FILE — do not edit by hand. Lucide v${LUCIDE_VERSION} (ISC).`,
		' * Core icons (the chevrons, close, menu, ...) are always included, no',
		" * matter what your `icons` config says — they back this library's own",
		' * components. Named re-exports from deep `@hyzer-labs/ui/icons/<name>`',
		" * paths keep this barrel's own import graph limited to exactly the",
		' * icons your app uses. Regenerate with `hyzer generate`.',
		' */'
	].join('\n');
	const lines = names.map(
		(name) => `export { default as Icon${pascalize(name)} } from '@hyzer-labs/ui/icons/${name}';`
	);
	return [header, '', ...lines].join('\n') + '\n';
}
