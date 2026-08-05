/**
 * The `hyzer` CLI for @hyzer-labs/ui.
 *
 * `hyzer init` scaffolds a starter hyzer.config.ts: the full-reference
 * template, with every option commented out. It will not overwrite an
 * existing config.
 *
 * `hyzer generate [--config <path>] [--out <path>] [--mode full|overrides]
 *                 [--utilities] [--check] [--strict]`
 *
 * Generate loads an optional hyzer.config.{ts,js,mjs} (TypeScript needs Node
 * 22.18 or newer, which strips types natively), merges it over the base token
 * schema, writes the generated sheet, and always prints a contrast report
 * against the configured bar (`contrast.level`, default AA). Failures are
 * warnings by default. `--strict` turns any miss into a non-zero exit, and so
 * does `strict: true` in the config. The flag only ever turns strictness on,
 * never off.
 *
 * The utilities sheet is opt-in. Without `--utilities` and without
 * `config.utilities`, no utilities file is written.
 *
 * `--check` writes nothing. It compares whatever is already on disk to what
 * this run would have written, and reports a file that has drifted or was
 * never generated. A missing file is a note, never a failure, so generating
 * at build time instead of committing the sheet stays a supported workflow.
 */

import { parseArgs } from 'node:util';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	resolveConfig,
	generateCss,
	generateUtilitiesCss,
	contrastReport,
	resolveIcons,
	HyzerConfigError,
	type HyzerConfig,
	type ResolvedConfig
} from '../config/index.js';
import { CONFIG_TEMPLATE, INIT_HEADER } from './config-template.js';

const CONFIG_FILENAMES = ['hyzer.config.ts', 'hyzer.config.js', 'hyzer.config.mjs'];
const DEFAULT_OUTPUT = 'hyzer-tokens.css';
const DEFAULT_UTILITIES_OUTPUT = 'hyzer-utilities.css';

const USAGE = `hyzer: the @hyzer-labs/ui token generator

Usage:
  hyzer init                Scaffold a starter hyzer.config.ts (every option,
                            commented out, valid as written)
  hyzer generate [options]

Options (generate):
  --config <path>   Config file (default: hyzer.config.{ts,js,mjs} in cwd)
  --out <path>      Output path (default: config "output", else ./${DEFAULT_OUTPUT})
  --mode <mode>     "full" (complete sheet, replaces tokens.css) or
                    "overrides" (patch sheet, import after tokens.css)
  --utilities       Also write the opt-in utilities sheet, next to the tokens
                    sheet (default: ./${DEFAULT_UTILITIES_OUTPUT}, or
                    config.utilities.output). Wins over config.utilities when
                    present. Without either, no utilities file is written.
  --check           Report without writing. Compares the files on disk (the
                    token sheet, icons.ts, the utilities sheet if enabled)
                    against what this run would write, and reports any that
                    are missing or out of date.
  --strict          Exit 1 when any pairing misses the contrast bar (config:
                    contrast.level, default AA), any icon name is unknown, or
                    a checked file is out of date (default: warn). A missing
                    file is reported but never fails the build. Config key:
                    strict. The flag turns strictness on even when the config
                    does not; nothing turns it off from the command line.
  --help            Show this help

TypeScript configs need Node 22.18 or newer, which strips types natively. On
older versions, use hyzer.config.mjs.`;

/** Injectable environment so tests run the CLI without spawning processes. */
export interface RunOptions {
	cwd?: string;
	log?: (line: string) => void;
	error?: (line: string) => void;
}

export async function run(argv: string[], options: RunOptions = {}): Promise<number> {
	const cwd = options.cwd ?? process.cwd();
	const log = options.log ?? ((line: string) => console.log(line));
	const error = options.error ?? ((line: string) => console.error(line));

	let parsed: ReturnType<typeof parseCliArgs>;
	try {
		parsed = parseCliArgs(argv);
	} catch (e) {
		error(e instanceof Error ? e.message : String(e));
		error('');
		error(USAGE);
		return 1;
	}
	if (parsed.help) {
		log(USAGE);
		return 0;
	}
	if (parsed.command === undefined) {
		error(USAGE);
		return 1;
	}
	if (parsed.command === 'init') {
		const existing = CONFIG_FILENAMES.map((name) => resolve(cwd, name)).find((path) =>
			existsSync(path)
		);
		if (existing) {
			error(`Config already exists: ${existing}`);
			return 1;
		}
		const initPath = resolve(cwd, 'hyzer.config.ts');
		writeFileSync(initPath, INIT_HEADER + CONFIG_TEMPLATE);
		log(`wrote ${initPath}`);
		log('Uncomment what you need, then run "hyzer generate".');
		return 0;
	}
	if (parsed.command !== 'generate') {
		error(`Unknown command "${parsed.command}".`);
		error('');
		error(USAGE);
		return 1;
	}
	if (parsed.mode !== undefined && parsed.mode !== 'full' && parsed.mode !== 'overrides') {
		error(`--mode must be "full" or "overrides", got "${parsed.mode}".`);
		return 1;
	}

	// --- config -----------------------------------------------------------
	let configPath: string | undefined;
	if (parsed.config) {
		configPath = resolve(cwd, parsed.config);
		if (!existsSync(configPath)) {
			error(`Config file not found: ${configPath}`);
			return 1;
		}
	} else {
		configPath = CONFIG_FILENAMES.map((name) => resolve(cwd, name)).find((path) =>
			existsSync(path)
		);
		if (!configPath) {
			log(`No config found (looked for ${CONFIG_FILENAMES.join(', ')}), using the base schema.`);
		}
	}

	let config: HyzerConfig = {};
	if (configPath) {
		try {
			const mod = (await import(pathToFileURL(configPath).href)) as { default?: unknown };
			if (mod.default === undefined) {
				error(`${configPath} has no default export. Use: export default defineConfig({ … }).`);
				return 1;
			}
			config = mod.default as HyzerConfig;
			log(`config: ${configPath}`);
		} catch (e) {
			if (isTypeStrippingError(e) && configPath.endsWith('.ts')) {
				error(
					`Could not load ${configPath}: this Node runtime cannot import TypeScript directly.\n` +
						'Use Node 22.18 or newer, or rename the config to hyzer.config.mjs.'
				);
			} else {
				error(`Could not load ${configPath}: ${e instanceof Error ? e.message : String(e)}`);
			}
			return 1;
		}
	}

	// --- resolve + report ---------------------------------------------------
	let resolved: ResolvedConfig;
	try {
		resolved = resolveConfig(config);
	} catch (e) {
		if (e instanceof HyzerConfigError) {
			error(`Invalid config: ${e.message}`);
			return 1;
		}
		throw e;
	}

	// The flag turns strictness on even when the config does not; there is no
	// --no-strict, so this is the only place either source can win.
	const strict = parsed.strict === true || resolved.strict;

	const report = contrastReport(resolved);
	const failures = report.rows.filter((row) => !row.pass);
	const iconsResult = resolveIcons(resolved);

	// --- paths --------------------------------------------------------------
	// Hoisted above the write/check split so both branches read the same
	// expressions: "the path we would have written" and "the path we check"
	// are then provably the same thing, not two copies that can drift apart.
	const mode = parsed.mode ?? 'full';
	const outPath = parsed.out
		? resolve(cwd, parsed.out)
		: resolved.output && configPath
			? resolve(dirname(configPath), resolved.output)
			: resolve(cwd, resolved.output ?? DEFAULT_OUTPUT);
	const iconsPath = join(dirname(outPath), 'icons.ts');
	// --utilities wins over config.utilities when present. With neither set,
	// no utilities file is written (and none is checked, ever — R2).
	const utilitiesEnabled = parsed.utilities === true || resolved.utilities.enabled;
	const utilitiesRelOutput = resolved.utilities.output;
	const utilitiesPath = utilitiesRelOutput
		? configPath
			? resolve(dirname(configPath), utilitiesRelOutput)
			: resolve(cwd, utilitiesRelOutput)
		: join(dirname(outPath), DEFAULT_UTILITIES_OUTPUT);

	let staleCount = 0;

	// --- write, or check ---------------------------------------------------
	if (!parsed.check) {
		mkdirSync(dirname(outPath), { recursive: true });
		writeFileSync(outPath, generateCss(resolved, { mode }));
		const tokenCount =
			resolved.sections.reduce((n, s) => n + s.entries.length, 0) +
			1 + // --hz-density
			resolved.dark.palette.length +
			resolved.dark.color.length +
			resolved.dark.intent.length +
			resolved.dark.rest.length;
		log(`wrote ${outPath} (${mode}, ${tokenCount} tokens)`);

		if (iconsResult) {
			writeFileSync(iconsPath, iconsResult.module);
			log(`wrote ${iconsPath} (${iconsResult.names.length} icons)`);
		}

		if (utilitiesEnabled) {
			mkdirSync(dirname(utilitiesPath), { recursive: true });
			writeFileSync(utilitiesPath, generateUtilitiesCss(resolved));
			log(`wrote ${utilitiesPath}`);
		}
	} else {
		// specs/66 — compare what is on disk to what this run would have
		// written. Exactly the files the write branch above would write,
		// never more (an artifact the config never opts into is never
		// checked, so it can never be a false finding).
		const checks: ArtifactCheck[] = [checkArtifact(outPath, generateCss(resolved, { mode }), mode)];
		if (iconsResult) checks.push(checkArtifact(iconsPath, iconsResult.module));
		if (utilitiesEnabled) checks.push(checkArtifact(utilitiesPath, generateUtilitiesCss(resolved)));

		let checkedCount = 0;
		for (const check of checks) {
			if (check.status === 'absent') {
				log(check.line);
				continue;
			}
			checkedCount++;
			if (check.status === 'finding') {
				staleCount++;
				error(check.line);
			}
		}

		if (staleCount === 0) {
			log(`files: ${checkedCount} checked, all up to date`);
		} else {
			const modeSuffix = mode === 'overrides' ? ' --mode overrides' : '';
			const strictSuffix = strict ? '' : ' (warnings; use --strict to fail the build)';
			error(
				`files: ${staleCount} of ${checkedCount} out of date; run "hyzer generate${modeSuffix}" to update${strictSuffix}`
			);
		}
	}

	// --- contrast report -------------------------------------------------------
	for (const row of failures) {
		error(`  ✗ ${row.mode} ${row.id}: ${row.ratio.toFixed(2)}:1 (${row.level})`);
	}
	for (const name of report.unresolved) {
		log(`  ? ${name} could not be resolved statically, pairing skipped`);
	}
	if (failures.length === 0) {
		log(`contrast: ${report.rows.length} pairings checked, all pass WCAG ${report.level}`);
	} else {
		const suffix = strict ? '' : ' (warnings; use --strict to fail the build)';
		error(
			`contrast: ${failures.length} of ${report.rows.length} pairings fail WCAG ${report.level}${suffix}`
		);
	}

	// --- icons report ---------------------------------------------
	let iconsFailed = false;
	if (iconsResult) {
		for (const name of iconsResult.unknown) {
			error(`  ? icons: "${name}" is not a valid Lucide icon name, omitted from the barrel`);
		}
		if (iconsResult.unknown.length > 0) {
			iconsFailed = true;
			const suffix = strict ? '' : ' (warnings; use --strict to fail the build)';
			error(`icons: ${iconsResult.unknown.length} unknown name(s)${suffix}`);
		}
		log(
			`icons: ${iconsResult.names.length} included (${iconsResult.coreCount} core, ${iconsResult.configuredCount} configured)`
		);
	}

	return strict && (failures.length > 0 || iconsFailed || staleCount > 0) ? 1 : 0;
}

// ---------------------------------------------------------------------------
// specs/66 — --check compares what is on disk to what this run would write
// ---------------------------------------------------------------------------

type ArtifactCheck =
	| { status: 'absent'; line: string }
	| { status: 'finding'; line: string }
	| { status: 'ok' };

/**
 * EOL normalization only — so a Windows checkout with `core.autocrlf` does
 * not report every file stale on every run. A real drift differs in more
 * than line endings, so this can never hide one.
 */
function normalizeEol(s: string): string {
	return s.replace(/\r\n/g, '\n');
}

/** The tokens sheet's own header names the mode it was generated with. */
function detectMode(content: string): 'full' | 'overrides' | undefined {
	if (content.includes('@hyzer-labs/ui design tokens')) return 'full';
	if (content.includes('@hyzer-labs/ui token overrides')) return 'overrides';
	return undefined;
}

/**
 * One artifact, checked against what this run would have written.
 *
 * Three outcomes, in this order (R3): absent is a reported note, never a
 * finding — the normal state of a repo that gitignores its generated sheet
 * and regenerates in CI, and it must never fail `--strict`. A tokens sheet
 * whose header names the OTHER mode reports that instead of a byte diff — the
 * diff would be real but would send the reader hunting for a config change
 * that never happened. Anything else that differs is "out of date". Only the
 * tokens sheet carries a mode; `mode` is passed only for that check.
 */
function checkArtifact(path: string, expected: string, mode?: 'full' | 'overrides'): ArtifactCheck {
	if (!existsSync(path)) {
		return { status: 'absent', line: `  ? ${path} has not been generated, not checked` };
	}
	const onDisk = readFileSync(path, 'utf8');
	if (mode) {
		const onDiskMode = detectMode(onDisk);
		if (onDiskMode && onDiskMode !== mode) {
			return {
				status: 'finding',
				line: `  ✗ ${path} was generated with --mode ${onDiskMode}; this run checked ${mode}`
			};
		}
	}
	if (normalizeEol(onDisk) !== normalizeEol(expected)) {
		return { status: 'finding', line: `  ✗ ${path} is out of date` };
	}
	return { status: 'ok' };
}

function parseCliArgs(argv: string[]) {
	const { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		options: {
			config: { type: 'string' },
			out: { type: 'string' },
			mode: { type: 'string' },
			utilities: { type: 'boolean', default: false },
			check: { type: 'boolean', default: false },
			strict: { type: 'boolean', default: false },
			help: { type: 'boolean', default: false }
		}
	});
	if (positionals.length > 1) {
		throw new Error(`Unexpected arguments: ${positionals.slice(1).join(' ')}`);
	}
	return { command: positionals[0], ...values };
}

function isTypeStrippingError(e: unknown): boolean {
	if (!(e instanceof Error)) return false;
	const code = (e as NodeJS.ErrnoException).code;
	return (
		code === 'ERR_UNKNOWN_FILE_EXTENSION' ||
		code === 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX' ||
		/Unknown file extension "\.ts"/.test(e.message)
	);
}
