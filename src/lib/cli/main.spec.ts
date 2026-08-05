import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { run } from './main.js';
import { resolveConfig, generateCss, generateUtilitiesCss } from '../config/index.js';
import { CONFIG_TEMPLATE } from './config-template.js';

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
		// specs/66 — the staleness section: no sheet has ever been generated
		// here, so it is a note, not a finding, and the exit code is unchanged.
		expect(logs.join('\n')).toContain('has not been generated, not checked');
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
		// specs/66 — the staleness section still runs alongside the icons report.
		expect(logs.join('\n')).toContain('has not been generated, not checked');
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

// ---------------------------------------------------------------------------
// specs/65 Stage 4 (R17–R20) — contrast.level and strict from the config
// ---------------------------------------------------------------------------

describe('hyzer generate — contrast bar and strict from the config', () => {
	it('the default bar is still named "WCAG AA" in a passing report', async () => {
		const { logs, io } = sandbox();
		expect(await run(['generate'], io)).toBe(0);
		expect(logs.join('\n')).toContain('all pass WCAG AA');
	});

	it('strict: true alone fails a failing config with no --strict flag, and omits the "use --strict" suffix', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default { strict: true, tokens: { palette: { warning: '#d97706' } } };`
		);
		expect(await run(['generate'], io)).toBe(1);
		expect(errors.join('\n')).toContain('fail WCAG AA');
		expect(errors.join('\n')).not.toContain('use --strict');
	});

	it('--strict still fails a config with strict left at the default', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default { tokens: { palette: { warning: '#d97706' } } };`
		);
		expect(await run(['generate', '--strict'], io)).toBe(1);
	});

	it('contrast: { level: "AAA" } fails the shipped palette and names AAA in the report', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { contrast: { level: 'AAA' } };`);
		expect(await run(['generate'], io)).toBe(0);
		expect(errors.join('\n')).toContain('fail WCAG AAA');
	});

	it('contrast: { level: "AAA" } with strict: true fails the build', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer.config.mjs'),
			`export default { contrast: { level: 'AAA' }, strict: true };`
		);
		expect(await run(['generate'], io)).toBe(1);
	});

	it('an unknown key under contrast is a config error', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { contrast: { threshold: 7 } };`);
		expect(await run(['generate'], io)).toBe(1);
		expect(errors.join('\n')).toContain('Unknown key "threshold" in config.contrast');
	});

	it('a non-boolean strict is a config error', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { strict: 'yes' };`);
		expect(await run(['generate'], io)).toBe(1);
		expect(errors.join('\n')).toContain('config.strict must be a boolean');
	});
});

// ---------------------------------------------------------------------------
// specs/66 — `--check` compares what is on disk to what this run would write
// ---------------------------------------------------------------------------

describe('hyzer generate --check — staleness', () => {
	it('a current sheet reports "all up to date" and exits 0', async () => {
		const { cwd, logs, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer-tokens.css'), generateCss(resolveConfig()));
		expect(await run(['generate', '--check'], io)).toBe(0);
		expect(logs.join('\n')).toContain('files: 1 checked, all up to date');
	});

	it('a drifted sheet is reported out of date, warns without --strict, fails with it, and is never rewritten', async () => {
		const { cwd, errors, io } = sandbox();
		const current = generateCss(resolveConfig());
		writeFileSync(join(cwd, 'hyzer-tokens.css'), current + '/* drift */\n');
		expect(await run(['generate', '--check'], io)).toBe(0);
		expect(errors.join('\n')).toContain(`✗ ${join(cwd, 'hyzer-tokens.css')} is out of date`);
		expect(errors.join('\n')).toContain('files: 1 of 1 out of date');
		expect(errors.join('\n')).toContain('use --strict');

		const second = sandbox();
		writeFileSync(join(second.cwd, 'hyzer-tokens.css'), current + '/* drift */\n');
		expect(await run(['generate', '--check', '--strict'], second.io)).toBe(1);
		// The check writes nothing: the stale file is untouched.
		expect(readFileSync(join(second.cwd, 'hyzer-tokens.css'), 'utf8')).toBe(
			current + '/* drift */\n'
		);
	});

	it('an absent sheet is a note, not a finding — exit 0 even under --strict, and it is not counted in files:', async () => {
		const { cwd, logs, io } = sandbox();
		expect(await run(['generate', '--check'], io)).toBe(0);
		expect(logs.join('\n')).toContain(
			`? ${join(cwd, 'hyzer-tokens.css')} has not been generated, not checked`
		);
		expect(logs.join('\n')).toContain('files: 0 checked, all up to date');

		// This is the gitignored-sheet workflow, and it must stay green.
		const strictSandbox = sandbox();
		expect(await run(['generate', '--check', '--strict'], strictSandbox.io)).toBe(0);
	});

	it('strict: true in the config fails a --check run on a drifted sheet with no flag', async () => {
		const { cwd, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { strict: true };`);
		writeFileSync(join(cwd, 'hyzer-tokens.css'), generateCss(resolveConfig()) + '/* drift */\n');
		expect(await run(['generate', '--check'], io)).toBe(1);
	});

	it('a sheet written with --mode overrides, checked without the flag, reports the mode line instead of a byte diff', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(
			join(cwd, 'hyzer-tokens.css'),
			generateCss(resolveConfig(), { mode: 'overrides' })
		);
		expect(await run(['generate', '--check'], io)).toBe(0);
		const out = errors.join('\n');
		expect(out).toContain('was generated with --mode overrides; this run checked full');
		expect(out).not.toContain('is out of date');
	});

	it('the reverse direction: a full sheet checked with --mode overrides also reports the mode line', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer-tokens.css'), generateCss(resolveConfig()));
		expect(await run(['generate', '--check', '--mode', 'overrides'], io)).toBe(0);
		expect(errors.join('\n')).toContain(
			'was generated with --mode full; this run checked overrides'
		);
	});

	it('no icons key: a stale icons.ts on disk is never checked, and files: counts only the tokens sheet', async () => {
		const { cwd, logs, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer-tokens.css'), generateCss(resolveConfig()));
		writeFileSync(join(cwd, 'icons.ts'), '// stale, unrelated to any config');
		expect(await run(['generate', '--check'], io)).toBe(0);
		const out = logs.join('\n');
		expect(out).not.toContain('icons.ts');
		expect(out).toContain('files: 1 checked, all up to date');
	});

	it("icons: ['settings'] with no icons.ts is a note, not a finding", async () => {
		const { cwd, logs, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), `export default { icons: ['settings'] };`);
		writeFileSync(
			join(cwd, 'hyzer-tokens.css'),
			generateCss(resolveConfig({ icons: ['settings'] }))
		);
		expect(await run(['generate', '--check'], io)).toBe(0);
		expect(logs.join('\n')).toContain(
			`? ${join(cwd, 'icons.ts')} has not been generated, not checked`
		);
		expect(errors.join('\n')).not.toContain('icons.ts');
		expect(logs.join('\n')).toContain('files: 1 checked, all up to date');
	});

	it('utilities absent from config and flag: no utilities finding even though no file exists', async () => {
		const { cwd, logs, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer-tokens.css'), generateCss(resolveConfig()));
		expect(await run(['generate', '--check'], io)).toBe(0);
		const out = logs.join('\n');
		expect(out).not.toContain('hyzer-utilities.css');
		expect(out).toContain('files: 1 checked, all up to date');
	});

	it('--utilities opts the sheet into being checked for this run, even absent from the config', async () => {
		const { cwd, logs, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer-tokens.css'), generateCss(resolveConfig()));
		expect(await run(['generate', '--check', '--utilities'], io)).toBe(0);
		expect(logs.join('\n')).toContain(
			`? ${join(cwd, 'hyzer-utilities.css')} has not been generated, not checked`
		);
	});

	it('utilities: { output } is checked at that path, resolved relative to the config file', async () => {
		const { cwd, logs, io } = sandbox();
		mkdirSync(join(cwd, 'conf'));
		writeFileSync(
			join(cwd, 'conf/hyzer.config.mjs'),
			`export default { utilities: { output: 'styles/u.css' } };`
		);
		expect(await run(['generate', '--config', 'conf/hyzer.config.mjs', '--check'], io)).toBe(0);
		expect(logs.join('\n')).toContain(
			`? ${join(cwd, 'conf/styles/u.css')} has not been generated, not checked`
		);
	});

	it('--out is the path checked', async () => {
		const { cwd, logs, io } = sandbox();
		expect(await run(['generate', '--check', '--out', 'out/tokens.css'], io)).toBe(0);
		expect(logs.join('\n')).toContain(
			`? ${join(cwd, 'out/tokens.css')} has not been generated, not checked`
		);
	});

	it('a current file rewritten with CRLF line endings is still up to date', async () => {
		const { cwd, logs, io } = sandbox();
		const current = generateCss(resolveConfig());
		writeFileSync(join(cwd, 'hyzer-tokens.css'), current.replace(/\n/g, '\r\n'));
		expect(await run(['generate', '--check'], io)).toBe(0);
		expect(logs.join('\n')).toContain('files: 1 checked, all up to date');
	});

	it('a normal (non-check) run prints no files: section', async () => {
		const { logs, io } = sandbox();
		expect(await run(['generate'], io)).toBe(0);
		expect(logs.join('\n')).not.toContain('files:');
	});

	it('an invalid config still exits 1 before any staleness check runs', async () => {
		const { cwd, errors, io } = sandbox();
		writeFileSync(join(cwd, 'hyzer.config.mjs'), 'export default { tokens: { colours: {} } };');
		expect(await run(['generate', '--check'], io)).toBe(1);
		expect(errors.join('\n')).toContain('Invalid config');
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

	it('the full-reference template resolves without throwing, every line uncommented', async () => {
		// Live gate for the template itself: uncomment every `// ` line (the
		// template's own convention — a leading tab, then `// `, then the
		// property at its real indentation), swap the published import for a
		// local identity function so the sandbox needs no package resolution,
		// and resolveConfig() the result.
		const { cwd } = sandbox();
		const source = CONFIG_TEMPLATE.replace(
			"import { defineConfig } from '@hyzer-labs/ui/config';",
			'const defineConfig = (c) => c;'
		)
			.split('\n')
			.map((line) => line.replace(/^\t\/\/ /, '\t'))
			.join('\n');
		const configPath = join(cwd, 'full-reference.mjs');
		writeFileSync(configPath, source);
		const mod = (await import(pathToFileURL(configPath).href)) as { default: unknown };
		expect(() => resolveConfig(mod.default as never)).not.toThrow();
	});
});
