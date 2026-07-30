/**
 * GENERATED FILE — do not edit by hand. Regenerate with:
 *   pnpm run package && pnpm run gen:sizes
 *
 * Measured from the files this package publishes. `browserItems` is exact for
 * the stylesheets: they are imported whole, so the gzipped bytes are what a
 * visitor downloads. The tarball also carries declarations, unminified source,
 * every icon and the CLI; none of those reach a browser, so they are reported
 * by the generator's console output rather than exported here.
 */

export interface SizeRow {
	label: string;
	/** Bytes on disk. */
	raw: number;
	/** The same bytes through gzip. */
	gzip: number;
	note?: string;
}

/**
 * Per-item browser cost. Add the rows you actually import; the total is the
 * ceiling with everything taken.
 */
export const browserItems: SizeRow[] = [
	{
		label: 'Every component, minified',
		raw: 246874,
		gzip: 53626,
		note: 'A real build of the whole library, carrying only the few icons the components draw. Import three components and you ship a fraction of this.'
	},
	{
		label: 'Component structural CSS',
		raw: 41014,
		gzip: 6090,
		note: 'Layout and behavior only. No colors or other visual styling.'
	},
	{
		label: 'Design tokens',
		raw: 12264,
		gzip: 3321,
		note: 'The --hz-* custom properties, also called CSS variables.'
	},
	{
		label: 'Reference theme',
		raw: 148290,
		gzip: 51058,
		note: 'One import for the shared base sheet plus a sheet per component. Import single component sheets instead and you pay less.'
	},
	{
		label: 'Reset',
		raw: 2412,
		gzip: 1287,
		note: 'Optional. Structural only.'
	},
	{
		label: 'Utilities',
		raw: 6926,
		gzip: 1719,
		note: 'Helper classes you import only if you want them.'
	}
];

/** Everything in the table above, taken together. */
export const browserTotal: SizeRow = {
	label: 'Everything, together',
	raw: 457780,
	gzip: 117101
};

/** Packages pulled in at runtime. */
export const runtimeDependencies = 1;

/** Peer dependencies, which a consumer already has. */
export const peerDependencies = ['svelte'];

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1000) return `${kb < 100 ? kb.toFixed(1) : Math.round(kb)} kB`;
	return `${(kb / 1024).toFixed(1)} MB`;
}
