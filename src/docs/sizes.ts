/**
 * GENERATED FILE — do not edit by hand. Regenerate with:
 *   pnpm run package && pnpm run gen:sizes
 *
 * Measured from the files this package publishes. `browserTiers` is exact:
 * stylesheets are imported whole, so the gzipped bytes are what a visitor
 * downloads. `installParts` is the tarball, which also carries declarations,
 * unminified source, every icon and the CLI — none of which reach a browser.
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
		label: 'Component JavaScript',
		raw: 237604,
		gzip: 51540,
		note: 'Every component, bundled and minified. Import fewer and ship less.'
	},
	{
		label: 'Component structural CSS',
		raw: 40706,
		gzip: 5997,
		note: 'Layout and behavior only, no visual opinions.'
	},
	{
		label: 'Tokens',
		raw: 12264,
		gzip: 3321,
		note: 'The --hz-* custom properties.'
	},
	{
		label: 'Reference theme',
		raw: 145804,
		gzip: 50143,
		note: 'The full styled look, one sheet per component.'
	},
	{
		label: 'Reset',
		raw: 2412,
		gzip: 1287,
		note: 'Optional, structural only.'
	},
	{
		label: 'Utilities',
		raw: 6926,
		gzip: 1719,
		note: 'Opt-in helper classes.'
	}
];

/** Everything in the table above, taken together. */
export const browserTotal: SizeRow = {
	label: 'Everything, together',
	raw: 445716,
	gzip: 114007
};

/** What npm unpacks, by part. */
export const installParts: SizeRow[] = [
	{
		label: 'Component source',
		raw: 461694,
		gzip: 166684,
		note: 'Unminified. Bundlers tree-shake it.'
	},
	{
		label: 'Type declarations',
		raw: 603829,
		gzip: 357962,
		note: 'Never reaches a browser.'
	},
	{
		label: 'Stylesheets',
		raw: 213857,
		gzip: 72787,
		note: 'Import what you need.'
	},
	{
		label: 'Icon set',
		raw: 2996687,
		gzip: 1699473,
		note: '1748 components, one glyph each.'
	},
	{
		label: 'hyzer CLI',
		raw: 81991,
		gzip: 28054,
		note: 'Build-time only.'
	},
	{
		label: 'Example themes',
		raw: 46451,
		gzip: 16317,
		note: 'Ocean, Docs and Terminal, for reading or copying.'
	}
];

/** Total unpacked install. */
export const installTotal = 3852989;

/** Packages pulled in at runtime. */
export const runtimeDependencies = 0;

/** Peer dependencies, which a consumer already has. */
export const peerDependencies = ['svelte'];

/** The core glyph count the components render internally. */
export const coreIconCount = 14;

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1000) return `${kb < 100 ? kb.toFixed(1) : Math.round(kb)} kB`;
	return `${(kb / 1024).toFixed(1)} MB`;
}
