import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_ICONS } from './core.js';
import { ICON_NAMES } from './generated/manifest.js';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Every kebab icon name deep-imported (`lib/icons/generated/<name>.svelte`)
 * by files directly under `dir` — the internal-use surface R4's two-way pin
 * enforces. Recurses one level only; neither `src/lib/components` nor
 * `src/lib/attachments` nests further.
 */
function internalIconUses(dir: string): Set<string> {
	const names = new Set<string>();
	if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return names;
	for (const file of readdirSync(dir)) {
		if (!/\.(svelte|ts)$/.test(file)) continue;
		const src = readFileSync(join(dir, file), 'utf8');
		for (const m of src.matchAll(/lib\/icons\/generated\/([a-z0-9-]+)\.svelte/g)) {
			names.add(m[1]);
		}
	}
	return names;
}

describe('R4 — CORE_ICONS two-way pin', () => {
	it('every icon imported internally by src/lib/components or src/lib/attachments is in CORE_ICONS', () => {
		const used = new Set([
			...internalIconUses(join(here, '../components')),
			...internalIconUses(join(here, '../attachments'))
		]);
		// Sanity: the internal-use scan itself must find something, or this
		// assertion would vacuously pass forever.
		expect(used.size).toBeGreaterThan(0);
		for (const name of used) {
			expect(
				CORE_ICONS as readonly string[],
				`"${name}" is used internally but missing from CORE_ICONS`
			).toContain(name);
		}
	});

	it('every CORE_ICONS entry is a valid generated manifest name', () => {
		for (const name of CORE_ICONS) {
			expect(
				ICON_NAMES as readonly string[],
				`"${name}" is not a valid Lucide icon name`
			).toContain(name);
		}
	});
});
