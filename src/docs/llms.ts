/**
 * Shared renderer behind `/llms.txt` and `/llms-full.txt` — the `agentRules.ts`
 * shape one directory over: plain data + render functions under `src/docs/`,
 * consumed by thin SvelteKit routes. One source serves both, plus a future
 * node process that is not SvelteKit (a headless reader of the same
 * registries), because nothing here touches `fs`, `$app/*`, or `Response`.
 *
 * `renderLlmsFull()` walks the manifest's `Components` section and reads
 * `componentDocs` / `hooks` for each page — it contains no component name,
 * prop, type, default, note, hook, class, description, or URL literally.
 * Everything it prints is derived, so it cannot drift from the pages a human
 * reads; `llms.spec.ts` holds it against the same data it is built from.
 */
import { componentDocs, type ComponentDoc } from './data/index.js';
import type { PropRow } from './PropsTable.svelte';
import { hooks, type HookRow } from './hooks';
import { importSurface } from './agentRules';
import {
	isSection,
	isGrouped,
	manifest,
	sectionPages,
	type ManifestPage,
	type ManifestGroupedSection
} from './manifest';

export const SITE = 'https://design.hyzer.sh';

const INDEX_INTRO = [
	'# @hyzer-labs/ui',
	'',
	'> A headless, accessible Svelte 5 component library. Components ship behavior,',
	'> structure and accessibility — every visual decision is yours. A token engine',
	'> generates the CSS custom properties and grades every color pairing against',
	'> WCAG AA; named themes scope to any element, not just the document root.',
	'',
	'Install with `pnpm add @hyzer-labs/ui`. Components import from the package root;',
	'the token engine, motion helpers, observers, icons, utilities and types each have',
	'their own subpath. See the Agents page for the conventions that keep generated',
	'code correct.',
	'',
	`Every component's props and styling hooks in one file: ${SITE}/llms-full.txt`,
	''
].join('\n');

/** `- [Title](absolute url): description` — one line per page. */
export function pageLink(page: ManifestPage): string {
	return `- [${page.label}](${SITE}${page.href}): ${page.description}`;
}

/**
 * The llms.txt index (llmstxt.org), built from the same manifest that renders
 * the sidebar — so a page cannot exist in the nav and be missing here, and a
 * description cannot drift from the one the page displays.
 */
export function renderLlmsIndex(): string {
	const parts: string[] = [INDEX_INTRO];

	const standalone = manifest.filter((e): e is ManifestPage => !isSection(e));
	if (standalone.length > 0) {
		parts.push('## Start here', '', ...standalone.map(pageLink), '');
	}

	for (const entry of manifest) {
		if (!isSection(entry)) continue;
		parts.push(`## ${entry.label}`, '');
		if (isGrouped(entry)) {
			// Group bands are presentational in the sidebar, but they carry real
			// meaning for a reader scanning by category — keep them as sub-headings.
			for (const group of entry.groups) {
				parts.push(`### ${group.label}`, '', ...group.pages.map(pageLink), '');
			}
		} else {
			parts.push(...sectionPages(entry).map(pageLink), '');
		}
	}

	return parts.join('\n');
}

/**
 * One value in a markdown table cell: escapes `|` (union types are the common
 * case), collapses any newline or run of whitespace to a single space so a
 * multi-line note cannot break the row, and trims. Text outside tables (a
 * description, an a11y note) is never passed through this — that is where
 * multi-paragraph prose is legal.
 */
function cell(value: string): string {
	return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

/** A sanitised cell, wrapped in backticks — for names, types, defaults, values. */
function code(value: string): string {
	return '`' + cell(value) + '`';
}

function propsTable(rows: PropRow[]): string[] {
	const lines = ['| Prop | Type | Default | Notes |', '| --- | --- | --- | --- |'];
	for (const row of rows) {
		lines.push(
			`| ${code(row.name)} | ${code(row.type)} | ${code(row.default)} | ${row.note ? cell(row.note) : ''} |`
		);
	}
	return lines;
}

function hookTable(firstHeader: string, rows: HookRow[]): string[] {
	const lines = [`| ${firstHeader} | Values | Notes |`, '| --- | --- | --- |'];
	for (const row of rows) {
		lines.push(`| ${code(row.name)} | ${code(row.values)} | ${cell(row.note)} |`);
	}
	return lines;
}

/** One component's section — every block whose source data is absent is omitted whole. */
function componentSection(page: ManifestPage, doc: ComponentDoc): string[] {
	const out: string[] = [
		`### ${page.label}`,
		'',
		page.description,
		'',
		`Docs: ${SITE}${page.href}`,
		'',
		'```ts',
		doc.importLine,
		'```',
		''
	];

	if (doc.props && doc.props.length > 0) {
		out.push('#### Props', '', ...propsTable(doc.props), '');
		for (const type of doc.types ?? []) {
			out.push(`#### ${type.name}`, '', ...propsTable(type.props), '');
		}
	}

	const h = hooks[page.label];
	if (h) {
		out.push('#### Styling', '', `Root class: \`${h.root}\``, '');
		if (h.warning) out.push(`> ${h.warning}`, '');
		if (h.attrs && h.attrs.length > 0) out.push(...hookTable('Attribute', h.attrs), '');
		if (h.props && h.props.length > 0) out.push(...hookTable('Custom property', h.props), '');
		if (h.parts && h.parts.length > 0) out.push(...hookTable('Part', h.parts), '');
	}

	if (doc.a11yNote) {
		out.push('#### Accessibility', '', doc.a11yNote, '');
	}

	return out;
}

/**
 * The llms-full.txt companion: every component's props, styling hooks, and
 * accessibility notes, walked in manifest order (group by group, page by
 * page) so related components stay next to each other for a model reading
 * straight through.
 */
export function renderLlmsFull(): string {
	const parts: string[] = [
		'# @hyzer-labs/ui — full component reference',
		'',
		"> Every component's props, styling hooks, and accessibility notes in one file.",
		'> Generated from the same data that renders the documentation site.',
		'',
		`Index of every documentation page: ${SITE}/llms.txt`,
		`Conventions for coding agents: ${SITE}/agents.md`,
		'',
		'## Imports',
		'',
		'```ts',
		importSurface,
		'```',
		''
	];

	const componentsSection = manifest.find(
		(e): e is ManifestGroupedSection => isSection(e) && isGrouped(e) && e.label === 'Components'
	);
	if (!componentsSection) return parts.join('\n');

	for (const group of componentsSection.groups) {
		parts.push(`## ${group.label}`, '');
		for (const page of group.pages) {
			// A manifest page with no componentDocs entry cannot happen —
			// data.spec.ts fails first. Skip rather than throw, so a red test is
			// the failure mode, not a build crash.
			const doc = componentDocs[page.label];
			if (!doc) continue;
			parts.push(...componentSection(page, doc));
		}
	}

	return parts.join('\n');
}
