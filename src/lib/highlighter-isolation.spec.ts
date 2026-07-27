import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * CodeBlock-R18 (specs/47) — the library never depends on a highlighter.
 *
 * Mirrors iconsBarrelGuard.spec.ts's style: walk a scan root, read every
 * non-test source file, regex for a forbidden import. Highlighting is always
 * bring-your-own (the `language` class hook, or the `children` escape hatch)
 * — no highlighting engine may be imported under `src/lib`, listed as a
 * `dependency`/`peerDependency`, or imported by the docs site outside the
 * two firewalled demo importers.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../..');

const FILE_PATTERN = /\.(svelte|ts)$/;
const TEST_PATTERN = /\.(spec|e2e)\.ts$/;

// `from '…'` and `import('…')`, covering both the package root and any deep
// subpath (e.g. `shiki/bundle/web`, `@shikijs/langs`).
const HIGHLIGHTER_IMPORT =
	/(?:from\s+['"]|import\(\s*['"])(shiki|@shikijs\/[a-z0-9-]+|prismjs|prism|highlight\.js|highlightjs)(?:\/[^'"]*)?['"]/;

const HIGHLIGHTJS_IMPORT =
	/(?:from\s+['"]|import\(\s*['"])(highlight\.js|highlightjs)(?:\/[^'"]*)?['"]/;

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) walk(full, out);
		else if (FILE_PATTERN.test(entry) && !TEST_PATTERN.test(entry)) out.push(full);
	}
	return out;
}

describe('R18 — src/lib never imports a highlighter', () => {
	it('no file under src/lib imports shiki, @shikijs/*, prismjs, prism, or highlight.js', () => {
		const offenders: string[] = [];
		for (const file of walk(join(repoRoot, 'src/lib'))) {
			const src = readFileSync(file, 'utf8');
			if (HIGHLIGHTER_IMPORT.test(src)) offenders.push(relative(repoRoot, file));
		}
		expect(offenders, `highlighter import(s) found under src/lib: ${offenders.join(', ')}`).toEqual(
			[]
		);
	});
});

describe('R18 — package.json keeps highlighters out of the shipped dependency graph', () => {
	it('dependencies/peerDependencies list none of shiki, @shikijs/*, prismjs, highlight.js', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		const forbidden = ['shiki', '@shikijs/', 'prismjs', 'prism', 'highlight.js', 'highlightjs'];
		for (const field of ['dependencies', 'peerDependencies'] as const) {
			const deps = Object.keys((pkg.default as Record<string, unknown>)[field] ?? {});
			const hits = deps.filter((d) => forbidden.some((f) => d === f || d.startsWith(f)));
			expect(hits, `${field} contains a highlighter: ${hits.join(', ')}`).toEqual([]);
		}
	});

	it('prismjs and shiki are devDependencies only', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		const dev = Object.keys((pkg.default as Record<string, unknown>).devDependencies ?? {});
		expect(dev).toContain('prismjs');
		expect(dev).toContain('shiki');
	});

	it('highlight.js appears in no dependency field at all', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
			const deps = Object.keys((pkg.default as Record<string, unknown>)[field] ?? {});
			expect(deps.includes('highlight.js') || deps.includes('highlightjs')).toBe(false);
		}
	});
});

describe('R18 — docs highlighter imports are firewalled to exactly two files', () => {
	const SCAN_DIRS = ['src/routes', 'src/docs'];
	const ALLOWED_FILES = new Set([
		'src/docs/PrismCodeBlock.svelte',
		'src/routes/components/code-block/+page.server.ts'
	]);

	it('a highlighter import appears in exactly the two allow-listed docs files, and nowhere else', () => {
		const offenders: string[] = [];
		const seenAllowed = new Set<string>();
		for (const dir of SCAN_DIRS) {
			for (const file of walk(join(repoRoot, dir))) {
				const rel = relative(repoRoot, file).split('\\').join('/');
				const src = readFileSync(file, 'utf8');
				if (!HIGHLIGHTER_IMPORT.test(src)) continue;
				if (ALLOWED_FILES.has(rel)) seenAllowed.add(rel);
				else offenders.push(rel);
			}
		}
		expect(
			offenders,
			`highlighter import(s) outside the allow-list: ${offenders.join(', ')}`
		).toEqual([]);
		expect(
			[...seenAllowed].sort(),
			'both allow-listed docs demos must actually import a highlighter'
		).toEqual([...ALLOWED_FILES].sort());
	});

	it('highlight.js is imported nowhere under src/routes or src/docs', () => {
		const offenders: string[] = [];
		for (const dir of SCAN_DIRS) {
			for (const file of walk(join(repoRoot, dir))) {
				const src = readFileSync(file, 'utf8');
				if (HIGHLIGHTJS_IMPORT.test(src)) offenders.push(relative(repoRoot, file));
			}
		}
		expect(offenders).toEqual([]);
	});
});
