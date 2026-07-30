/**
 * Measure the published package and write src/docs/sizes.ts.
 *
 * Run after `pnpm run package`, via `pnpm run gen:sizes`. The docs render the
 * generated module, so every number on the site is one this script measured.
 *
 * Two things get measured, because they answer different questions:
 *
 *   1. What a browser downloads. The stylesheet figures are exact: a consumer
 *      imports whole sheets, so the gzipped bytes are the cost.
 *   2. What npm installs. The tarball also carries TypeScript declarations,
 *      unminified component source, every icon, and the CLI. None of those
 *      reach a browser, and a bundler ships only the components you import.
 *
 * Scope matches the `files` field in package.json: dist, minus spec output.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

function published(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...published(full));
		else if (!/\.(spec|test)\./.test(entry)) out.push(full);
	}
	return out;
}

const measure = (paths: string[]) => ({ raw: rawOf(paths), gzip: gzipOf(paths) });

const gzipOf = (paths: string[]) =>
	paths.reduce((n, p) => n + gzipSync(readFileSync(p)).byteLength, 0);
const rawOf = (paths: string[]) => paths.reduce((n, p) => n + readFileSync(p).byteLength, 0);

const files = published(DIST);
const rel = (f: string) => relative(DIST, f);

const sheet = (name: string) => files.filter((f) => rel(f) === name);
// The reference theme proper: its barrel, base, and one sheet per component.
// theme/examples/** are the shipped example themes, which a consumer imports
// instead of (or beside) this, so they are not part of the tier cost.
const themeSheets = files.filter(
	(f) =>
		rel(f).startsWith('theme/') &&
		!rel(f).startsWith('theme/examples/') &&
		f.endsWith('.css') &&
		!/reset\.css|utilities\.css$/.test(f)
);
const exampleSheets = files.filter(
	(f) => rel(f).startsWith('theme/examples/') && f.endsWith('.css')
);

/**
 * Bundle every component and measure the result, so the JavaScript figure is a
 * real build rather than the size of the unminified source. Svelte itself is
 * external: it is a peer dependency the consumer already has, and counting it
 * here would measure the framework rather than this library.
 */
function bundleEverything(): { js: number; jsGzip: number; css: number; cssGzip: number } {
	// The config must live inside the repo: pnpm isolates node_modules, so a
	// config in the system temp dir cannot resolve the Svelte plugin. The entry
	// pulls from dist, which is what a consumer installs.
	const work = join(ROOT, '.size-tmp');
	rmSync(work, { recursive: true, force: true });
	mkdirSync(work, { recursive: true });
	writeFileSync(join(work, 'entry.js'), "export * from '../dist/index.js';\n");
	writeFileSync(
		join(work, 'vite.config.js'),
		`import { svelte } from '@sveltejs/vite-plugin-svelte';
export default {
	logLevel: 'error',
	plugins: [svelte()],
	build: {
		lib: { entry: './.size-tmp/entry.js', formats: ['es'], fileName: 'all' },
		outDir: './.size-tmp/out',
		emptyOutDir: true,
		minify: 'esbuild',
		rollupOptions: { external: [/^svelte/, /^\\$app\\//] }
	}
};
`
	);
	execFileSync('npx', ['vite', 'build', '--config', '.size-tmp/vite.config.js'], {
		cwd: ROOT,
		stdio: 'inherit'
	});
	const out = join(work, 'out');
	// all.js is the eager bundle. Any sibling chunk is split out behind a dynamic
	// import (the token generator), so it is not part of what a page loads.
	const js = [join(out, 'all.js')];
	const css = readdirSync(out)
		.filter((f) => f.endsWith('.css'))
		.map((f) => join(out, f));
	const result = { js: rawOf(js), jsGzip: gzipOf(js), css: rawOf(css), cssGzip: gzipOf(css) };
	rmSync(work, { recursive: true, force: true });
	return result;
}

const bundle = bundleEverything();

/**
 * Per-item browser cost. Each row is that piece on its own, so a reader can add
 * up only the pieces they take. The stylesheets are exact (they are imported
 * whole); the JavaScript row is the ceiling, since a bundler drops what you do
 * not import.
 */
const browserItems = [
	{
		label: 'Every component, minified',
		raw: bundle.js,
		gzip: bundle.jsGzip,
		note: 'A real build of the whole library, carrying only the few icons the components draw. Import three components and you ship a fraction of this.'
	},
	{
		label: 'Component structural CSS',
		raw: bundle.css,
		gzip: bundle.cssGzip,
		note: 'Layout and behavior only. No colors or other visual styling.'
	},
	{
		label: 'Design tokens',
		...measure(sheet('tokens/tokens.css')),
		note: 'The --hz-* custom properties, also called CSS variables.'
	},
	{
		label: 'Reference theme',
		...measure(themeSheets),
		note: 'One import for the shared base sheet plus a sheet per component. Import single component sheets instead and you pay less.'
	},
	{ label: 'Reset', ...measure(sheet('theme/reset.css')), note: 'Optional. Structural only.' },
	{
		label: 'Utilities',
		...measure(sheet('theme/utilities.css')),
		note: 'Helper classes you import only if you want them.'
	}
];

const iconFiles = files.filter((f) => rel(f).startsWith('icons/'));
const declarations = files.filter((f) => f.endsWith('.d.ts'));
const tooling = files.filter((f) => /^(cli|config)\//.test(rel(f)));
const componentSource = files.filter(
	(f) =>
		!f.endsWith('.d.ts') &&
		!rel(f).startsWith('icons/') &&
		!f.endsWith('.css') &&
		!/^(cli|config)\//.test(rel(f))
);

/** What npm unpacks, by part. Nothing here is a per-page cost. */
const installParts = [
	{
		label: 'Component source',
		paths: componentSource,
		note: 'Only the components you import, minified by your bundler. It ships unminified so your bundler can drop the rest.'
	},
	{
		label: 'Type declarations',
		paths: declarations,
		note: 'No. TypeScript reads them; a browser never sees them.'
	},
	{
		label: 'Stylesheets',
		paths: files.filter((f) => f.endsWith('.css')),
		note: 'Only the sheets you import.'
	},
	{
		label: 'Icon set',
		paths: iconFiles,
		note: `Only the glyphs you use. ${iconFiles.filter((f) => f.endsWith('.svelte')).length} components, one glyph each.`
	},
	{ label: 'hyzer CLI', paths: tooling, note: 'No. It runs at build time.' },
	{
		label: 'Example themes',
		paths: exampleSheets,
		note: 'Only if you import one. Ocean, Docs and Terminal, for reading or copying.'
	}
];

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const module = `/**
 * GENERATED FILE — do not edit by hand. Regenerate with:
 *   pnpm run package && pnpm run gen:sizes
 *
 * Measured from the files this package publishes. \`browserItems\` is exact for
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
export const browserItems: SizeRow[] = ${JSON.stringify(browserItems, null, '\t')};

/** Everything in the table above, taken together. */
export const browserTotal: SizeRow = ${JSON.stringify(
	{
		label: 'Everything, together',
		raw: browserItems.reduce((n, r) => n + r.raw, 0),
		gzip: browserItems.reduce((n, r) => n + r.gzip, 0)
	},
	null,
	'\t'
)};



/** Packages pulled in at runtime. */
export const runtimeDependencies = ${Object.keys(pkg.dependencies ?? {}).length};

/** Peer dependencies, which a consumer already has. */
export const peerDependencies = ${JSON.stringify(Object.keys(pkg.peerDependencies ?? {}))};


export function formatBytes(bytes: number): string {
	if (bytes < 1024) return \`\${bytes} B\`;
	const kb = bytes / 1024;
	if (kb < 1000) return \`\${kb < 100 ? kb.toFixed(1) : Math.round(kb)} kB\`;
	return \`\${(kb / 1024).toFixed(1)} MB\`;
}
`;

writeFileSync(join(ROOT, 'src/docs/sizes.ts'), module);
console.log('wrote src/docs/sizes.ts');
for (const r of browserItems) {
	console.log(
		`  browser  ${r.label.padEnd(26)} ${(r.gzip / 1024).toFixed(1).padStart(7)} kB gzipped`
	);
}
console.log(
	`  browser  ${'TOTAL'.padEnd(26)} ${(browserItems.reduce((n, r) => n + r.gzip, 0) / 1024)
		.toFixed(1)
		.padStart(7)} kB gzipped`
);
for (const p of installParts) {
	console.log(
		`  install  ${p.label.padEnd(26)} ${(rawOf(p.paths) / 1024).toFixed(1).padStart(8)} kB`
	);
}
console.log(`  install  ${'TOTAL'.padEnd(26)} ${(rawOf(files) / 1024).toFixed(1).padStart(8)} kB`);
