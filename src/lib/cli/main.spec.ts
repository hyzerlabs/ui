import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './main.js';
import { resolveConfig, generateCss, generateUtilitiesCss } from '../config/index.js';

/** Fresh sandbox per test — unique paths keep ESM config imports uncached. */
function sandbox(): {
	cwd: string;
	logs: string[];
	errors: string[];
	io: Parameters<typeof run>[1];
} {
	const cwd = mkdtempSync(join(tmpdir(), 'hyzer-cli-'));
	const logs: string[] = [];
	const errors: string[] = [];
	return { cwd, logs, errors, io: { cwd, log: (l) => logs.push(l), error: (l) => errors.push(l) } };
}

describe('hyzer generate — zero config', () => {
	it('writes the base-schema sheet to ./hyzer-tokens.css and notes the missing config', async () => {
		const { cwd, logs, io } = sandbox();
		const code = await run(['generate'], io);
		expect(code).toBe(0);
		expect(logs.join('\n')).toContain('No config found');
		const written = readFileSync(join(cwd, 'hyzer-tokens.css'), 'utf8');
		expect(written).toBe(generateCss(resolveConfig()));
		expect(logs.join('\n')).toContain('all pass WCAG AA');
	});
});

describe('hyzer generate — config loading', () => {
	it('discovers hyzer.config.mjs and honors its output path (relative to the config)', async () => {
		const { cwd, logs, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default {
				output: 'styles/tokens.css',
				tokens: { palette: { primary: '#0f766e', fairway: '#3f6212' } }
			};`
		);
		const code = await run(['generate'], io);
		expect(code).toBe(0);
		expect(logs.join('\n')).toContain('hyzer.config.mjs');
		const written = readFileSync(join(cwd, 'styles/tokens.css'), 'utf8');
		expect(written).toContain('--hz-palette-primary: #0f766e;');
		expect(written).toContain('--hz-palette-fairway: #3f6212;');
	});

	it('--config and --out override discovery and the config output', async () => {
		const { cwd, io } = sandbox();
		mkdirSync(join(cwd, 'conf'));
		writeFileSync(
			join(cwd, 'conf/custom.mjs'),
			`export default { output: 'ignored.css', tokens: { space: { xs: '0.25rem' } } };`
		);
		const code = await run(
			['generate', '--config', 'conf/custom.mjs', '--out', 'out/tokens.css'],
			io
		);
		expect(code).toBe(0);
		expect(existsSync(join(cwd, 'conf/ignored.css'))).toBe(false);
		expect(readFileSync(join(cwd, 'out/tokens.css'), 'utf8')).toContain('--hz-space-xs: 0.25rem;');
	});

	it('a missing --config path fails cleanly', async () => {
		const { errors, io } = sandbox();
		expect(await run(['generate', '--config', 'nope.mjs'], io)).toBe(1);
		expect(errors.join('\n')).toContain('Config file not found');
	});

	it('a config without a default export fails with guidance', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), 'export const nope = 1;');
		expect(await run(['generate'], io)).toBe(1);
		expect(errors.join('\n')).toContain('no default export');
	});

	it('an invalid config surfaces the engine error', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), 'export default { tokens: { colours: {} } };');
		expect(await run(['generate'], io)).toBe(1);
		expect(errors.join('\n')).toContain('Invalid config');
		expect(errors.join('\n')).toContain('Unknown key "colours"');
	});
});

describe('hyzer generate — modes and flags', () => {
	it('--mode overrides writes a patch sheet', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default { tokens: { palette: { primary: '#0f766e' } } };`
		);
		expect(await run(['generate', '--mode', 'overrides'], io)).toBe(0);
		const written = readFileSync(join(cwd, 'hyzer-tokens.css'), 'utf8');
		expect(written).toContain('--hz-palette-primary: #0f766e;');
		expect(written).not.toContain('--hz-space-md');
	});

	it('--check reports without writing', async () => {
		const { cwd, logs, io } = sandbox();
		expect(await run(['generate', '--check'], io)).toBe(0);
		expect(existsSync(join(cwd, 'hyzer-tokens.css'))).toBe(false);
		expect(logs.join('\n')).toContain('pairings checked');
	});

	it('an AA failure warns by default and fails with --strict (file still written)', async () => {
		const first = sandbox();
		// The retired 3.19:1 warning orange.
		writeFileSync(
			join(first.cwd, 'hyzer.config.mjs'),
			`export default { tokens: { palette: { warning: '#d97706' } } };`
		);
		expect(await run(['generate'], first.io)).toBe(0);
		expect(first.errors.join('\n')).toContain('fail WCAG AA');
		expect(first.errors.join('\n')).toContain('use --strict');

		const second = sandbox();
		writeFileSync(
			join(second.cwd, 'hyzer.config.mjs'),
			`export default { tokens: { palette: { warning: '#d97706' } } };`
		);
		expect(await run(['generate', '--strict'], second.io)).toBe(1);
		expect(second.errors.join('\n')).toContain('✗ light text:intent-warning/surface');
		expect(existsSync(join(second.cwd, 'hyzer-tokens.css'))).toBe(true);
	});

	it('rejects an unknown mode, command, and flag', async () => {
		const a = sandbox();
		expect(await run(['generate', '--mode', 'partial'], a.io)).toBe(1);
		const b = sandbox();
		expect(await run(['deploy'], b.io)).toBe(1);
		expect(b.errors.join('\n')).toContain('Unknown command');
		const c = sandbox();
		expect(await run(['generate', '--force'], c.io)).toBe(1);
	});

	it('--help exits 0 with usage; no command exits 1 with usage', async () => {
		const a = sandbox();
		expect(await run(['--help'], a.io)).toBe(0);
		expect(a.logs.join('\n')).toContain('hyzer generate');
		const b = sandbox();
		expect(await run([], b.io)).toBe(1);
		expect(b.errors.join('\n')).toContain('Usage');
	});
});

// ---------------------------------------------------------------------------
// specs/36 R6 — icons config: trimmed barrel emission, report, --strict
// ---------------------------------------------------------------------------

describe('hyzer generate — icons config', () => {
	it('no icons key writes no icons.ts and prints no icons report section', async () => {
		const { cwd, logs, io } = sandbox();
		expect(await run(['generate'], io)).toBe(0);
		expect(existsSync(join(cwd, 'icons.ts'))).toBe(false);
		expect(logs.join('\n')).not.toContain('icons:');
	});

	it('icons: [] writes the core-only barrel next to the tokens sheet', async () => {
		const { cwd, logs, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { icons: [] };`);
		expect(await run(['generate'], io)).toBe(0);
		const written = readFileSync(join(cwd, 'icons.ts'), 'utf8');
		expect(written).toContain(
			`export { default as IconChevronDown } from '@hyzer-labs/ui/icons/chevron-down';`
		);
		expect(logs.join('\n')).toContain('icons: 14 included (14 core, 0 configured)');
	});

	it('honors a custom output directory (icons.ts lands next to the tokens sheet)', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default { output: 'styles/tokens.css', icons: ['settings'] };`
		);
		expect(await run(['generate'], io)).toBe(0);
		expect(existsSync(join(cwd, 'styles/icons.ts'))).toBe(true);
		const written = readFileSync(join(cwd, 'styles/icons.ts'), 'utf8');
		expect(written).toContain(
			`export { default as IconSettings } from '@hyzer-labs/ui/icons/settings';`
		);
	});

	it('an unknown icon name warns by default and fails with --strict; the barrel is still written without it', async () => {
		const first = sandbox();
		writeFileSync(join(first.cwd, 'hyzer.config.mjs'), `export default { icons: ['serch'] };`);
		expect(await run(['generate'], first.io)).toBe(0);
		expect(first.errors.join('\n')).toContain(
			'icons: "serch" is not a valid Lucide icon name, omitted from the barrel'
		);
		expect(first.errors.join('\n')).toContain('icons: 1 unknown name(s)');
		expect(first.errors.join('\n')).toContain('use --strict');
		expect(readFileSync(join(first.cwd, 'icons.ts'), 'utf8')).not.toContain('serch');

		const second = sandbox();
		writeFileSync(join(second.cwd, 'hyzer.config.mjs'), `export default { icons: ['serch'] };`);
		expect(await run(['generate', '--strict'], second.io)).toBe(1);
		expect(existsSync(join(second.cwd, 'icons.ts'))).toBe(true);
	});

	it('--check reports the icons section without writing icons.ts', async () => {
		const { cwd, logs, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { icons: ['settings'] };`);
		expect(await run(['generate', '--check'], io)).toBe(0);
		expect(existsSync(join(cwd, 'icons.ts'))).toBe(false);
		expect(logs.join('\n')).toContain('icons: 15 included (14 core, 1 configured)');
	});
});

// ---------------------------------------------------------------------------
// specs/44 R4 — utilities sheet opt-in: --utilities flag / config.utilities
// ---------------------------------------------------------------------------

describe('hyzer generate — utilities opt-in', () => {
	it('writes no utilities file by default', async () => {
		const { cwd, io } = sandbox();
		expect(await run(['generate'], io)).toBe(0);
		expect(existsSync(join(cwd, 'hyzer-utilities.css'))).toBe(false);
	});

	it('--utilities writes the consumer utilities sheet next to the tokens sheet', async () => {
		const { cwd, logs, io } = sandbox();
		expect(await run(['generate', '--utilities'], io)).toBe(0);
		const written = readFileSync(join(cwd, 'hyzer-utilities.css'), 'utf8');
		expect(written).toBe(generateUtilitiesCss(resolveConfig()));
		expect(logs.join('\n')).toContain('wrote');
		expect(logs.join('\n')).toContain('hyzer-utilities.css');
	});

	it('config.utilities: true opts in with the default filename', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { utilities: true };`);
		expect(await run(['generate'], io)).toBe(0);
		const written = readFileSync(join(cwd, 'hyzer-utilities.css'), 'utf8');
		expect(written).toBe(generateUtilitiesCss(resolveConfig({ utilities: true })));
	});

	it('config.utilities.output opts in with a custom filename, relative to the config', async () => {
		const { cwd, io } = sandbox();
		mkdirSync(join(cwd, 'conf'));
		writeFileSync(
			join(cwd, 'conf/hyzer.config.mjs'),
			`export default { utilities: { output: 'styles/utils.css' } };`
		);
		expect(await run(['generate', '--config', 'conf/hyzer.config.mjs'], io)).toBe(0);
		expect(existsSync(join(cwd, 'conf/styles/utils.css'))).toBe(true);
	});

	it('honors a custom tokens output directory (default utilities filename lands beside it)', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default { output: 'styles/tokens.css', utilities: true };`
		);
		expect(await run(['generate'], io)).toBe(0);
		expect(existsSync(join(cwd, 'styles/hyzer-utilities.css'))).toBe(true);
	});

	it('the --utilities flag overrides config.utilities when present (config omits it, flag still writes)', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default {};`);
		expect(await run(['generate', '--utilities'], io)).toBe(0);
		expect(existsSync(join(cwd, 'hyzer-utilities.css'))).toBe(true);
	});

	it('a config-touched utilities sheet reflects consumer overrides', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default { utilities: true, tokens: { intent: { brand: 'var(--hz-palette-primary)' } } };`
		);
		expect(await run(['generate'], io)).toBe(0);
		const written = readFileSync(join(cwd, 'hyzer-utilities.css'), 'utf8');
		expect(written).toContain('.hz-text-brand {');
	});

	it('--check writes no utilities file even with --utilities', async () => {
		const { cwd, io } = sandbox();
		expect(await run(['generate', '--check', '--utilities'], io)).toBe(0);
		expect(existsSync(join(cwd, 'hyzer-utilities.css'))).toBe(false);
	});

	it('rejects an invalid config.utilities shape', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { utilities: 'yes' };`);
		expect(await run(['generate'], io)).toBe(1);
		expect(errors.join('\n')).toContain('Invalid config');
		expect(errors.join('\n')).toContain('config.utilities');
	});
});

describe('hyzer init', () => {
	it('writes the commented full-reference hyzer.config.ts', async () => {
		const { cwd, logs, io } = sandbox();
		expect(await run(['init'], io)).toBe(0);
		expect(logs.join('\n')).toContain('wrote');
		const scaffold = readFileSync(join(cwd, 'hyzer.config.ts'), 'utf8');
		expect(scaffold).toContain('defineConfig({');
		expect(scaffold).toContain('// Docs: https://design.hyzer.sh/docs/foundation/config');
	});

	it('refuses to overwrite an existing config, whatever its extension', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), 'export default {};');
		expect(await run(['init'], io)).toBe(1);
		expect(errors.join('\n')).toContain('already exists');
		expect(existsSync(join(cwd, 'hyzer.config.ts'))).toBe(false);
	});
});
