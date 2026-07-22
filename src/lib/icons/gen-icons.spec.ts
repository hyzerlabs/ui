import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const generatedDir = join(here, 'generated');

describe('gen-icons — generated output present (specs/36 R1)', () => {
	it('the generated directory has the barrel, manifest, and per-icon components', () => {
		expect(existsSync(generatedDir), 'run `pnpm gen:icons` before the test suite').toBe(true);
		expect(existsSync(join(generatedDir, 'index.ts'))).toBe(true);
		expect(existsSync(join(generatedDir, 'manifest.ts'))).toBe(true);
		expect(existsSync(join(generatedDir, 'chevron-down.svelte'))).toBe(true);
		expect(existsSync(join(generatedDir, 'axis-3d.svelte'))).toBe(true);
	});

	it('LUCIDE_VERSION matches the installed lucide dev dependency — re-run `pnpm gen:icons` if this fails after a version bump', async () => {
		const lucidePkg = JSON.parse(
			readFileSync(join(here, '../../../node_modules/lucide/package.json'), 'utf8')
		) as { version: string };
		const { LUCIDE_VERSION } = await import('./generated/manifest.js');
		expect(
			LUCIDE_VERSION,
			`generated manifest stamps Lucide v${LUCIDE_VERSION} but node_modules/lucide is v${lucidePkg.version} — re-run \`pnpm gen:icons\`.`
		).toBe(lucidePkg.version);
	});
});
