import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * specs/46 R4 — the import inversion. The docs site is the literal
 * dogfooder of the shipped "Docs" example theme: there is exactly one copy
 * of this CSS, so there is nothing to drift from and no sync gate is
 * needed. This guard pins both halves of that invariant.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const layoutPath = join(repoRoot, 'src/routes/+layout.svelte');
const privateDocsCssPath = join(repoRoot, 'src/docs/docs.css');
const shippedDocsCssPath = join(repoRoot, 'src/lib/theme/examples/docs/docs.css');

describe('specs/46 R4 — docs.css import inversion', () => {
	it('+layout.svelte imports the shipped $lib/theme/examples/docs/docs.css example', () => {
		const layout = readFileSync(layoutPath, 'utf8');
		expect(layout).toMatch(/import\s+['"]\$lib\/theme\/examples\/docs\/docs\.css['"]/);
	});

	it('+layout.svelte no longer imports a private ../docs/docs.css copy', () => {
		const layout = readFileSync(layoutPath, 'utf8');
		expect(layout).not.toMatch(/from\s+['"]\.\.\/docs\/docs\.css['"]/);
		expect(layout).not.toMatch(/^\s*import\s+['"]\.\.\/docs\/docs\.css['"]/m);
	});

	it('the private src/docs/docs.css copy no longer exists', () => {
		expect(existsSync(privateDocsCssPath)).toBe(false);
	});

	it('the shipped example sheet exists at src/lib/theme/examples/docs/docs.css', () => {
		expect(existsSync(shippedDocsCssPath)).toBe(true);
	});
});
