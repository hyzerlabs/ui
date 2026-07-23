import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * specs/36 R9 — size and perf guardrails.
 *
 * The docs site's dev/build must not import the full icon barrel
 * (`$lib/icons`, which re-exports the ~1,748-component generated set)
 * anywhere except the `/foundation/icons` catalog page — that page imports
 * only the manifest (names + version) plus one glyph at a time via
 * `import.meta.glob`, never the eager barrel. Every other consumer uses a
 * deep `$lib/icons/generated/<name>.svelte` import (or, for a real
 * published app, `@hyzer-labs/ui/icons/<name>`).
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../..');

const SCAN_DIRS = ['src/routes', 'src/docs'];
const ALLOWED_FILES = new Set([
	'src/routes/foundation/icons/+page.svelte',
	// Audit-R3 (specs/40): the command-palette pattern sample imports named
	// exports from the barrel on purpose — its ?raw source is shown verbatim
	// (through consumerSource) as the copy-pasteable recipe, so the import a
	// reader sees has to be the real, working `@hyzer-labs/ui/icons` shape,
	// not a deep generated/ path no consumer app has. One sample, scoped cost.
	'src/docs/samples/CommandPalette.svelte'
]);
const FILE_PATTERN = /\.(svelte|ts)$/;
const TEST_PATTERN = /\.(spec|e2e)\.ts$/;

// Matches a full-barrel import: `from '$lib/icons'` or `'$lib/icons/index'`
// (with or without a `.js` extension) — but NOT a deep per-icon path like
// `$lib/icons/generated/x.svelte` or `$lib/icons/core.js`, which have more
// path segments after `icons`.
const FULL_BARREL_IMPORT = /from\s+['"]\$lib\/icons(?:\/index(?:\.js)?)?['"]/;

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const stat = statSync(full);
		if (stat.isDirectory()) walk(full, out);
		else if (FILE_PATTERN.test(entry) && !TEST_PATTERN.test(entry)) out.push(full);
	}
	return out;
}

describe('R9 — no full icon-barrel imports outside the catalog page', () => {
	it('every $lib/icons import under src/routes and src/docs is a deep per-icon path, except the catalog page', () => {
		const offenders: string[] = [];
		for (const dir of SCAN_DIRS) {
			for (const file of walk(join(repoRoot, dir))) {
				const rel = relative(repoRoot, file).split('\\').join('/');
				if (ALLOWED_FILES.has(rel)) continue;
				const src = readFileSync(file, 'utf8');
				if (FULL_BARREL_IMPORT.test(src)) offenders.push(rel);
			}
		}
		expect(offenders, `full-barrel $lib/icons import(s) found: ${offenders.join(', ')}`).toEqual(
			[]
		);
	});

	it('the catalog page itself never eagerly imports the full generated barrel', () => {
		const catalogPath = join(repoRoot, 'src/routes/foundation/icons/+page.svelte');
		const src = readFileSync(catalogPath, 'utf8');
		expect(/from\s+['"].*\/icons\/generated\/index(\.js)?['"]/.test(src)).toBe(false);
		expect(/import\s+\*\s+as\s+\w+\s+from\s+['"]\$lib\/icons['"]/.test(src)).toBe(false);
	});
});
