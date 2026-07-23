/**
 * Rewrite in-repo module specifiers to the ones a consumer actually types.
 *
 * The example configs and the intent-registry augmentation are real, working
 * files in this repo, so they import through relative paths and the `$lib`
 * alias. Shown verbatim in the docs those are a trap: a reader copies
 * `declare module '$lib/types'` into their app and it silently does nothing.
 *
 * Docs show what you would write; the repo keeps what it needs to build. The
 * mapping is mechanical and pinned by consumerSource.spec.ts, which also
 * asserts no internal specifier survives the rewrite.
 */
const REWRITES: [RegExp, string][] = [
	// theme/examples/<name>/<name>.config.ts → '@hyzer-labs/ui/config'
	[/(['"])(?:\.\.\/)+config\/index\.js\1/g, "'@hyzer-labs/ui/config'"],
	// The registry augmentation must name the DECLARING module.
	[/(['"])\$lib\/types\1/g, "'@hyzer-labs/ui/types'"],
	// Audit-R3: $lib/icons and $lib/utils are real subpath exports too — a
	// sample that reaches past the barrel into $lib/icons/generated/*.svelte
	// would otherwise ship a specifier no consumer app has.
	[/(['"])\$lib\/icons\1/g, "'@hyzer-labs/ui/icons'"],
	[/(['"])\$lib\/utils\1/g, "'@hyzer-labs/ui/utils'"],
	[/(['"])\$lib\1/g, "'@hyzer-labs/ui'"]
];

export function consumerSource(source: string): string {
	return REWRITES.reduce((acc, [re, to]) => acc.replace(re, to), source);
}

/**
 * Specifiers that must never reach a copyable docs sample.
 *
 * Audit-R3: broadened from a single lowercase path segment to arbitrary
 * `$lib` subpaths (any depth, any file extension) — otherwise a deep
 * specifier like `$lib/icons/generated/search.svelte` slipped past the old
 * `$lib(?:\/[a-z]+)?` shape uncaught.
 */
export const INTERNAL_SPECIFIER = /(['"])(?:\$lib(?:\/[\w.-]+)*|(?:\.\.\/)+config\/index\.js)\1/;
