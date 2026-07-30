/**
 * GENERATED FILE — do not edit by hand. Regenerate with:
 *   pnpm run package && pnpm run gen:sizes
 *
 * Measured from the files this package publishes. `browserItems` is exact for
 * the stylesheets: they are imported whole, so the gzipped bytes are what a
 * visitor downloads. `installParts` is the tarball, which also carries
 * declarations, unminified source, every icon and the CLI. None of those reach
 * a browser.
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
		raw: 237604,
		gzip: 51540,
		note: 'A real build of the whole library, carrying only the few icons the components draw. Import three components and you ship a fraction of this.'
	},
	{
		label: 'Component structural CSS',
		raw: 40706,
		gzip: 5997,
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
		raw: 145804,
		gzip: 50143,
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
	raw: 445716,
	gzip: 114007
};

/** Packages pulled in at runtime. */
export const runtimeDependencies = 0;

/** Peer dependencies, which a consumer already has. */
export const peerDependencies = ['svelte'];

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1000) return `${kb < 100 ? kb.toFixed(1) : Math.round(kb)} kB`;
	return `${(kb / 1024).toFixed(1)} MB`;
}
