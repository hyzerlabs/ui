/**
 * Shared renderer behind `/llms.txt` and `/llms-full.txt` — the `agentRules.ts`
 * shape one directory over: plain data + render functions under `src/docs/`,
 * consumed by thin SvelteKit routes. One source serves both, plus a future
 * node process that is not SvelteKit (a headless reader of the same
 * registries), because nothing here touches `fs`, `$app/*`, or `Response`.
 *
 * `renderLlmsFull()` and `buildLlmsFullJson()` both walk the manifest's
 * `Components` section and read `componentDocs` / `hooks` for each page —
 * neither contains a component name, prop, type, default, note, hook, class,
 * description, or URL literally. Everything they produce is derived, so
 * neither can drift from the pages a human reads; `llms.spec.ts` holds both
 * against the same data they are built from. The two share one walk
 * (`componentGroups()` below) rather than each re-deriving the component
 * list, so the markdown file and the JSON file can never index a different
 * set of components from one another.
 */
import { componentDocs, type ComponentDoc } from './data/index.js';
import { REST_NOTE_DEFAULT } from './data/types.js';
import type { PropRow } from './PropsTable.svelte';
import type { TypeTable } from './DocPage.svelte';
import { hooks, type ComponentHooks, type HookRow } from './hooks';
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
	`The same reference as JSON, for keyed lookup rather than reading straight through: ${SITE}/llms-full.json`,
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
		if (doc.restNote !== false) out.push(doc.restNote ?? REST_NOTE_DEFAULT, '');
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

/** One documented component page inside one manifest group — the pairing both renderers walk. */
interface ComponentGroup {
	label: string;
	pages: { page: ManifestPage; doc: ComponentDoc }[];
}

/**
 * The manifest's `Components` section, group by group, page by page, in
 * manifest order, with each page's `componentDocs` entry attached. A page
 * with no entry is dropped rather than throwing — data.spec.ts fails first,
 * so a red test is the failure mode, not a build crash. `renderLlmsFull()`
 * and `buildLlmsFullJson()` both read this instead of each re-deriving the
 * component list, so they cannot index different components from each other.
 */
function componentGroups(): ComponentGroup[] {
	const componentsSection = manifest.find(
		(e): e is ManifestGroupedSection => isSection(e) && isGrouped(e) && e.label === 'Components'
	);
	if (!componentsSection) return [];
	return componentsSection.groups.map((group) => ({
		label: group.label,
		pages: group.pages
			.map((page) => ({ page, doc: componentDocs[page.label] }))
			.filter((entry): entry is { page: ManifestPage; doc: ComponentDoc } => Boolean(entry.doc))
	}));
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

	for (const group of componentGroups()) {
		parts.push(`## ${group.label}`, '');
		for (const { page, doc } of group.pages) {
			parts.push(...componentSection(page, doc));
		}
	}

	return parts.join('\n');
}

/** The JSON companion's per-component record — one entry in `LlmsFullJson['components']`. */
export interface LlmsFullJsonComponent {
	name: string;
	group: string;
	/** Site-relative — join with `LlmsFullJson.site` for the absolute docs URL. */
	route: string;
	description: string;
	importLine: string;
	props: PropRow[];
	/** How unlisted props behave; absent for a component with no rest spread. */
	restNote?: string;
	/** Supporting item/option types (empty when the component has none). */
	types: TypeTable[];
	/** Absent for a component with no styling contract (e.g. Metatags). */
	hooks?: ComponentHooks;
	a11yNote?: string;
}

/** The shape `/llms-full.json` serves. */
export interface LlmsFullJson {
	site: string;
	/** The same import surface `## Imports` carries in llms-full.txt, verbatim. */
	imports: string;
	components: LlmsFullJsonComponent[];
}

/**
 * The `llms-full.json` companion: the same component walk as
 * `renderLlmsFull()`, structured for keyed lookup (`components.find(c =>
 * c.name === 'Button')`) rather than reading straight through. Both read
 * `componentGroups()`, so a component that appears in one appears in the
 * other, with the same data.
 */
export function buildLlmsFullJson(): LlmsFullJson {
	const components: LlmsFullJsonComponent[] = [];
	for (const group of componentGroups()) {
		for (const { page, doc } of group.pages) {
			components.push({
				name: page.label,
				group: group.label,
				route: page.href,
				description: page.description,
				importLine: doc.importLine,
				props: doc.props ?? [],
				restNote: doc.restNote === false ? undefined : (doc.restNote ?? REST_NOTE_DEFAULT),
				types: doc.types ?? [],
				hooks: hooks[page.label],
				a11yNote: doc.a11yNote
			});
		}
	}
	return { site: SITE, imports: importSurface, components };
}
