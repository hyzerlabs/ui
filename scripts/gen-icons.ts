/**
 * Regenerate the full Lucide icon set as per-icon Svelte components
 * (specs/36 R1). Run via `pnpm gen:icons` (tsx), like `gen:tokens`.
 *
 * Reads every icon's node data straight from the pinned `lucide` dev
 * dependency's ESM build (`node_modules/lucide/dist/esm/icons/*.mjs` — the
 * filenames ARE the canonical kebab names) and writes, per icon, a Svelte
 * component under `src/lib/icons/generated/`, plus a full alphabetical
 * barrel (`index.ts`) and a manifest (`manifest.ts`, sorted names + a
 * `LUCIDE_VERSION` stamp read from the installed package).
 *
 * The generated directory is gitignored — never committed. Determinism
 * holds: the same lucide version always produces the same bytes, so
 * `src/lib/icons/gen-icons.spec.ts` can pin freshness by comparing the
 * manifest's `LUCIDE_VERSION` stamp to the installed dependency instead of
 * diffing a committed tree.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pascalize } from '../src/lib/icons/pascalize.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lucideIconsDir = join(root, 'node_modules/lucide/dist/esm/icons');
const outDir = join(root, 'src/lib/icons/generated');

if (!existsSync(lucideIconsDir)) {
	throw new Error(
		`gen-icons: ${lucideIconsDir} not found — is the pinned "lucide" dev dependency installed?`
	);
}

const lucidePkg = JSON.parse(
	readFileSync(join(root, 'node_modules/lucide/package.json'), 'utf8')
) as { version: string };
const LUCIDE_VERSION = lucidePkg.version;

// Canonical kebab names come straight from the filenames Lucide ships —
// aliases (multiple names for one glyph, e.g. AlarmCheck/AlarmClockCheck)
// live in a separate export map we deliberately don't read, so every
// generated icon has exactly one name and one export.
const kebabNames = readdirSync(lucideIconsDir)
	.filter((f) => f.endsWith('.mjs') && !f.endsWith('.mjs.map'))
	.map((f) => f.replace(/\.mjs$/, ''))
	.sort();

// Fail loud on any export-name collision within the generated set itself —
// the only collision surface that exists post-specs/36 (the 7 hand-drawn
// brand marks that used to risk colliding with a generated name are deleted
// outright, not regenerated).
const exportNameToKebab = new Map<string, string>();
for (const kebab of kebabNames) {
	const exportName = `Icon${pascalize(kebab)}`;
	const prior = exportNameToKebab.get(exportName);
	if (prior) {
		throw new Error(
			`gen-icons: name collision — "${prior}" and "${kebab}" both pascalize to ${exportName}.`
		);
	}
	exportNameToKebab.set(exportName, kebab);
}

type LucideNode = [tag: string, attrs: Record<string, string>];

function renderComponent(kebab: string, nodes: LucideNode[]): string {
	const exportName = `Icon${pascalize(kebab)}`;
	const children = nodes
		.map(([tag, attrs]) => {
			const attrString = Object.entries(attrs)
				.map(([key, value]) => `${key}="${value}"`)
				.join(' ');
			return `\t<${tag} ${attrString} />`;
		})
		.join('\n');

	return `<script lang="ts">
	// Source: Lucide v${LUCIDE_VERSION} (ISC) — https://lucide.dev/icons/${kebab}
	// Barrel export name: ${exportName}
	// GENERATED FILE — do not edit by hand. Regenerate with \`pnpm gen:icons\`.
	import type { IconProps } from '../types.js';
	import { cx } from '$lib/utils';

	let { size = 24, strokeWidth = 2, class: className, ariaLabel, intent, style, ...rest }: IconProps = $props();

	const decorative = $derived(!ariaLabel);
	// Intent colors via the css var (stroke is currentColor); consumer style
	// comes after so it can still override. Amendment 2026-07-22 (specs/36).
	const mergedStyle = $derived(
		intent ? 'color: var(--hz-intent-' + intent + ');' + (style ?? '') : style
	);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	fill="none"
	stroke="currentColor"
	{...rest}
	style={mergedStyle}
	data-intent={intent}
	class={cx('hz-icon', className)}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={decorative ? 'true' : undefined}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : ariaLabel}
>
${children}
</svg>
`;
}

function barrelHeader(): string {
	return [
		'/**',
		' * @hyzer-labs/ui generated icon barrel — the full Lucide set (specs/36).',
		' *',
		` * GENERATED FILE — do not edit by hand. Lucide v${LUCIDE_VERSION} (ISC).`,
		' * Regenerate with `pnpm gen:icons`. Not committed — produced fresh by the',
		' * `prepare` script (and as a pre-step of `package`) so a clone + install',
		' * always has the full set. Alphabetical by kebab source name.',
		' */'
	].join('\n');
}

function renderBarrel(): string {
	const lines = kebabNames.map(
		(kebab) => `export { default as Icon${pascalize(kebab)} } from './${kebab}.svelte';`
	);
	return [barrelHeader(), '', ...lines].join('\n') + '\n';
}

function renderManifest(): string {
	const header = [
		'/**',
		' * @hyzer-labs/ui generated icon manifest (specs/36 R1).',
		' *',
		` * GENERATED FILE — do not edit by hand. Lucide v${LUCIDE_VERSION} (ISC).`,
		' * Regenerate with `pnpm gen:icons`. Not committed. `LUCIDE_VERSION` is the',
		' * freshness stamp `src/lib/icons/gen-icons.spec.ts` checks against the',
		' * installed dev dependency — a version bump without a re-run fails that',
		' * test with a "re-run gen:icons" message.',
		' */'
	].join('\n');
	const namesLiteral = kebabNames.map((n) => `\t'${n}'`).join(',\n');
	return `${header}

export const LUCIDE_VERSION = '${LUCIDE_VERSION}';

export const ICON_NAMES = [
${namesLiteral}
] as const;

export type IconName = (typeof ICON_NAMES)[number];
`;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const kebab of kebabNames) {
	const mod = (await import(pathToFileURL(join(lucideIconsDir, `${kebab}.mjs`)).href)) as {
		default: LucideNode[];
	};
	writeFileSync(join(outDir, `${kebab}.svelte`), renderComponent(kebab, mod.default));
}
writeFileSync(join(outDir, 'index.ts'), renderBarrel());
writeFileSync(join(outDir, 'manifest.ts'), renderManifest());

console.log(`wrote ${kebabNames.length} icons to ${outDir} (Lucide v${LUCIDE_VERSION})`);
