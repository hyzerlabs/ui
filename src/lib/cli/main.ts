/**
 * @hyzer-labs/ui — `hyzer` CLI implementation.
 *
 * `hyzer generate [--config <path>] [--out <path>] [--mode full|overrides]
 *                 [--utilities] [--check] [--strict]`
 *
 * Loads an optional hyzer.config.{ts,js,mjs} (TypeScript via Node's native
 * type stripping, ≥ 22.18), merges it over the base token schema, writes the
 * generated sheet, and always prints a WCAG contrast report — warnings by
 * default, `--strict` turns AA failures into a non-zero exit.
 *
 * The utilities sheet is opt-in only — absent `--utilities`
 * and `config.utilities`, no utilities file is written.
 */

import { parseArgs } from 'node:util';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
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

const CONFIG_FILENAMES = ['hyzer.config.ts', 'hyzer.config.js', 'hyzer.config.mjs'];
const DEFAULT_OUTPUT = 'hyzer-tokens.css';
const DEFAULT_UTILITIES_OUTPUT = 'hyzer-utilities.css';

const USAGE = `hyzer — @hyzer-labs/ui token generator

Usage:
  hyzer generate [options]

Options:
  --config <path>   Config file (default: hyzer.config.{ts,js,mjs} in cwd)
  --out <path>      Output path (default: config "output", else ./${DEFAULT_OUTPUT})
  --mode <mode>     "full" (complete sheet, replaces tokens.css) or
                    "overrides" (patch sheet, import after tokens.css)
  --utilities       Also write the opt-in utilities sheet, next to the tokens
                    sheet (default: ./${DEFAULT_UTILITIES_OUTPUT}, or
                    config.utilities.output). Overrides config.utilities when
                    present; absent both, no utilities file is written.
  --check           Validate and report only — write nothing
  --strict          Exit 1 when any pairing fails WCAG AA (default: warn)
  --help            Show this help

TypeScript configs need Node ≥ 22.18 (native type stripping); on older
runtimes use hyzer.config.mjs.`;

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
			log(`No config found (looked for ${CONFIG_FILENAMES.join(', ')}) — using the base schema.`);
		}
	}

	let config: HyzerConfig = {};
	if (configPath) {
		try {
			const mod = (await import(pathToFileURL(configPath).href)) as { default?: unknown };
			if (mod.default === undefined) {
				error(`${configPath} has no default export — export default defineConfig({ … }).`);
				return 1;
			}
			config = mod.default as HyzerConfig;
			log(`config: ${configPath}`);
		} catch (e) {
			if (isTypeStrippingError(e) && configPath.endsWith('.ts')) {
				error(
					`Could not load ${configPath}: this Node runtime cannot import TypeScript directly.\n` +
						'Use Node ≥ 22.18 (native type stripping) or rename the config to hyzer.config.mjs.'
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

	const report = contrastReport(resolved);
	const failures = report.rows.filter((row) => !row.pass);
	const iconsResult = resolveIcons(resolved);

	// --- write ----------------------------------------------------------------
	const mode = parsed.mode ?? 'full';
	if (!parsed.check) {
		const outPath = parsed.out
			? resolve(cwd, parsed.out)
			: resolved.output && configPath
				? resolve(dirname(configPath), resolved.output)
				: resolve(cwd, resolved.output ?? DEFAULT_OUTPUT);
		mkdirSync(dirname(outPath), { recursive: true });
		writeFileSync(outPath, generateCss(resolved, { mode }));
		const tokenCount =
			resolved.sections.reduce((n, s) => n + s.entries.length, 0) +
			1 + // --hz-density
			resolved.dark.palette.length +
			resolved.dark.color.length +
			resolved.dark.intent.length;
		log(`wrote ${outPath} (${mode}, ${tokenCount} tokens)`);

		if (iconsResult) {
			const iconsPath = join(dirname(outPath), 'icons.ts');
			writeFileSync(iconsPath, iconsResult.module);
			log(`wrote ${iconsPath} (${iconsResult.names.length} icons)`);
		}

		// --utilities overrides config.utilities when present;
		// absent both, no utilities file is written — non-users pay nothing.
		const utilitiesEnabled = parsed.utilities === true || resolved.utilities.enabled;
		if (utilitiesEnabled) {
			const utilitiesRelOutput = resolved.utilities.output;
			const utilitiesPath = utilitiesRelOutput
				? configPath
					? resolve(dirname(configPath), utilitiesRelOutput)
					: resolve(cwd, utilitiesRelOutput)
				: join(dirname(outPath), DEFAULT_UTILITIES_OUTPUT);
			mkdirSync(dirname(utilitiesPath), { recursive: true });
			writeFileSync(utilitiesPath, generateUtilitiesCss(resolved));
			log(`wrote ${utilitiesPath}`);
		}
	}

	// --- contrast report -------------------------------------------------------
	for (const row of failures) {
		error(`  ✗ ${row.mode} ${row.id} — ${row.ratio.toFixed(2)}:1 (${row.level})`);
	}
	for (const name of report.unresolved) {
		log(`  ? ${name} could not be statically resolved — pairing skipped`);
	}
	if (failures.length === 0) {
		log(`contrast: ${report.rows.length} pairings checked — all pass WCAG AA`);
	} else {
		const suffix = parsed.strict ? '' : ' (warnings; use --strict to fail the build)';
		error(`contrast: ${failures.length} of ${report.rows.length} pairings fail WCAG AA${suffix}`);
	}

	// --- icons report ---------------------------------------------
	let iconsFailed = false;
	if (iconsResult) {
		for (const name of iconsResult.unknown) {
			error(`  ? icons: "${name}" is not a valid Lucide icon name — omitted from the barrel`);
		}
		if (iconsResult.unknown.length > 0) {
			iconsFailed = true;
			const suffix = parsed.strict ? '' : ' (warnings; use --strict to fail the build)';
			error(`icons: ${iconsResult.unknown.length} unknown name(s)${suffix}`);
		}
		log(
			`icons: ${iconsResult.names.length} included (${iconsResult.coreCount} core, ${iconsResult.configuredCount} configured)`
		);
	}

	return parsed.strict && (failures.length > 0 || iconsFailed) ? 1 : 0;
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
