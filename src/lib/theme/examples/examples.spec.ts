import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig, generateCss, contrastReport } from '../../config/index.js';
import oceanConfig, { intro as oceanIntro } from './ocean.config.js';
import sunsetConfig, { intro as sunsetIntro } from './sunset.config.js';

const here = dirname(fileURLToPath(import.meta.url));

const examples = [
	{ name: 'ocean', config: oceanConfig, intro: oceanIntro },
	{ name: 'sunset', config: sunsetConfig, intro: sunsetIntro }
] as const;

/**
 * specs/30 R2 — the committed example sheets ARE engine output of their
 * checked-in configs, and every example keeps the library's AA posture.
 */
describe.each(examples)('example theme: $name', ({ name, config, intro }) => {
	it('committed css equals the engine output of its config (drift test)', () => {
		const committed = readFileSync(join(here, `${name}.css`), 'utf8');
		expect(generateCss(resolveConfig(config), { mode: 'overrides', intro })).toBe(committed);
	});

	it('passes WCAG AA on every graded pairing, both modes', () => {
		const report = contrastReport(resolveConfig(config));
		const failures = report.rows
			.filter((row) => !row.pass)
			.map((row) => `${row.mode} ${row.id} — ${row.ratio.toFixed(2)}:1`);
		expect(failures).toEqual([]);
		expect(report.unresolved).toEqual([]);
	});
});
