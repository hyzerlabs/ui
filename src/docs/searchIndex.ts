/**
 * The search index behind the docs command palette — page records with their
 * manifest description, one record per prose-page section, and every
 * component's prop and styling-hook vocabulary — plus the fielded scorer
 * that ranks them.
 *
 * Same posture as llms.ts: a pure module under src/docs/ with no
 * `fs`, no SvelteKit app-module import, no other SvelteKit import, and no
 * `Response`. `buildSearchIndex()`
 * takes its page sources as an argument rather than reading them itself, so a
 * plain vitest test can call it today, and a later node process (a planned
 * MCP `search_docs` tool) can call it too, reading the same files with `fs`
 * instead of a glob. `src/routes/search-index.json/+server.ts` is the thin
 * SvelteKit wrapper that supplies the glob and prerenders the result.
 *
 * `buildSearchIndex()` walks the same manifest as llms.ts's `renderLlmsFull()`
 * and reads the same `componentDocs` / `hooks` registries — it contains no
 * component name, prop, hook, page label, description, route or heading text
 * literally, other than the two skipped generic heading names and the
 * breadcrumb separator. Everything it emits is derived, so it cannot drift
 * from the pages a reader sees; `searchIndex.spec.ts` holds it against the
 * same data it is built from.
 */
import { componentDocs, type ComponentDoc } from './data/index.js';
import { hooks, type ComponentHooks } from './hooks';
import { isSection, isGrouped, manifest, type ManifestPage } from './manifest';

/** One entry in the search index — a docs page, or one heading section of a prose page. */
export interface SearchRecord {
	/** 'page' — a docs page. 'heading' — one h2/h3 section of a prose page. */
	kind: 'page' | 'heading';
	/** The page label, or the heading's own text. */
	label: string;
	/** Breadcrumb: 'Foundation', 'Components · Forms', '' for standalone pages. */
	context: string;
	/** The route; heading records carry '#anchor' too. */
	href: string;
	/** The owning page's label. Heading records only. */
	page?: string;
	/** The manifest description. Page records only. */
	description?: string;
	/** Prop names, including supporting-type rows. Component pages only. */
	props?: string[];
	/** Root class, data-*, --hz-* and part names. Component pages only. */
	hooks?: string[];
}

/** One resolved search result. */
export interface SearchHit {
	/** 'Colors & Intent' · 'Utilities › Color utilities' · 'Logo › --hz-logo-color' */
	label: string;
	context: string;
	/** Route, with the anchor the hit earned. */
	href: string;
	score: number;
	record: SearchRecord;
}

// ---------------------------------------------------------------------------
// buildSearchIndex
// ---------------------------------------------------------------------------

// The two generic section headings DocPage.svelte would otherwise repeat as
// noise: eleven Patterns pages each carry a "Demo" and a "Source" heading,
// which would be the noisiest twenty-two records in the index.
// Every other heading — Requirements, Overview, Accessibility — is real and
// page-specific, and stays.
const SKIPPED_HEADINGS = new Set(['Demo', 'Source']);

/** Keeps first-seen order while dropping repeats. */
function dedupe(names: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const name of names) {
		if (!seen.has(name)) {
			seen.add(name);
			out.push(name);
		}
	}
	return out;
}

/** Every prop name a component page documents, including supporting types. */
function propNames(doc: ComponentDoc): string[] {
	const names = (doc.props ?? []).map((row) => row.name);
	for (const type of doc.types ?? []) names.push(...type.props.map((row) => row.name));
	return dedupe(names);
}

/** Every styling-hook name a component page documents: root, attrs, props, parts. */
function hookNames(entry: ComponentHooks): string[] {
	const names = [
		entry.root,
		...(entry.attrs ?? []).map((row) => row.name),
		...(entry.props ?? []).map((row) => row.name),
		...(entry.parts ?? []).map((row) => row.name)
	];
	return dedupe(names);
}

/**
 * Strips inner tags, decodes the five HTML entities these pages use, and
 * collapses whitespace runs to one space.
 */
function cleanHeadingText(raw: string): string {
	const stripped = raw.replace(/<[^>]+>/g, '');
	const decoded = stripped
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
	return decoded.replace(/\s+/g, ' ').trim();
}

// Every real section heading in these pages carries `id` as its only
// attribute (`aria-labelledby` points at it) — demo/sample headings never
// carry one at all, which is the whole discriminator.
const HEADING_RE = /<h([23]) id="([^"]*)">([\s\S]*?)<\/h\1>/g;

/** One heading record per real h2/h3 in a prose page's raw source. */
function headingRecords(source: string, page: ManifestPage, context: string): SearchRecord[] {
	const records: SearchRecord[] = [];
	for (const match of source.matchAll(HEADING_RE)) {
		const id = match[2];
		const label = cleanHeadingText(match[3]);
		// A fabricated id/text ({#each}-generated) or leftover markup after
		// cleaning is worse than a missing record.
		if (/[{<>]/.test(id) || /[{<>]/.test(label)) continue;
		if (SKIPPED_HEADINGS.has(label)) continue;
		records.push({
			kind: 'heading',
			label,
			context,
			href: `${page.href}#${id}`,
			page: page.label
		});
	}
	return records;
}

/**
 * Walks the manifest and derives every search record. `sources` is every
 * prose page's raw source, keyed by its Vite module id — the shape Vite's
 * eager, raw-query glob import of every docs `+page.svelte` produces (see
 * the route for the exact call). The route supplies it; a future node
 * process could supply the same shape read with `fs` instead.
 *
 * The breadcrumb `context` string is the one `src/routes/docs/+layout.svelte`
 * used to build inline (`'Foundation'`, `'Components · Forms'`, `''` for
 * standalone pages) — moved here rather than duplicated a second time.
 */
export function buildSearchIndex(sources: Record<string, string>): SearchRecord[] {
	const records: SearchRecord[] = [];

	function pushPage(page: ManifestPage, context: string, isComponent: boolean) {
		const record: SearchRecord = {
			kind: 'page',
			label: page.label,
			context,
			href: page.href,
			description: page.description
		};

		if (isComponent) {
			const doc = componentDocs[page.label];
			if (doc) {
				const props = propNames(doc);
				if (props.length > 0) record.props = props;
			}
			const hookEntry = hooks[page.label];
			if (hookEntry) {
				const names = hookNames(hookEntry);
				if (names.length > 0) record.hooks = names;
			}
			records.push(record);
			// Component pages have no headings of their own — DocPage.svelte
			// emits the same five for every one (Import/Demo/Props/Theme
			// hooks/Accessibility), so heading records would be fifty copies
			// of the same noise. Components are indexed by field instead.
			return;
		}

		records.push(record);
		const source = sources[`/src/routes${page.href}/+page.svelte`];
		if (source) records.push(...headingRecords(source, page, context));
	}

	for (const entry of manifest) {
		if (!isSection(entry)) {
			pushPage(entry, '', false);
			continue;
		}
		if (isGrouped(entry)) {
			for (const group of entry.groups) {
				const context = `${entry.label} · ${group.label}`;
				for (const page of group.pages) pushPage(page, context, true);
			}
		} else {
			for (const page of entry.children) pushPage(page, entry.label, false);
		}
	}

	return records;
}

// ---------------------------------------------------------------------------
// searchDocs
// ---------------------------------------------------------------------------

type FieldKey = 'label' | 'description' | 'context' | 'props' | 'hooks';

interface RecordMatch {
	record: SearchRecord;
	score: number;
	winningField: FieldKey;
	/** The specific props/hooks entry the hit names — set only when winningField is 'props' or 'hooks'. */
	entryName?: string;
}

/**
 * A token's score against one field's text: `null` when the
 * field doesn't contain the token at all (the AND gate's failure case), the
 * base plus 40 when the token equals the field exactly (case-insensitively),
 * the base plus 20 when it starts the field or starts a word inside it
 * (preceded by a non-alphanumeric character), and the bare base for any
 * other substring position.
 */
function fieldScore(base: number, token: string, fieldValue: string): number | null {
	const value = fieldValue.toLowerCase();
	if (!value.includes(token)) return null;
	if (value === token) return base + 40;
	let index = value.indexOf(token);
	while (index !== -1) {
		const before = index === 0 ? undefined : value[index - 1];
		if (before === undefined || !/[a-z0-9]/.test(before)) return base + 20;
		index = value.indexOf(token, index + 1);
	}
	return base;
}

const LABEL_BASE = { page: 100, heading: 70 } as const;

// Tie-break order when two fields land on the exact same accumulated total
// (only reachable on a multi-token query) — the field a reader would
// recognise the hit by first.
const FIELD_PRIORITY: FieldKey[] = ['label', 'props', 'hooks', 'description', 'context'];

/**
 * Scores one record against every query token. Every token must match
 * somewhere in the record (AND) or the record is excluded
 * entirely. A field's accumulated total across all tokens decides which
 * field "wins" the record — the field the hit's shape is resolved from.
 *
 * FIELD_PRIORITY and this per-field accumulation across tokens are what
 * decide the winning field on a multi-token query — a case the single-token
 * scoring table above doesn't need to cover, since with one token the
 * highest-scoring field and the winning field are the same thing.
 */
function matchRecord(record: SearchRecord, tokens: string[]): RecordMatch | null {
	const fieldTotals: Partial<Record<FieldKey, number>> = {};
	// Per props/hooks entry, its own cumulative score across tokens — decides
	// which single entry names a props/hooks-winning hit.
	const entryTotals: Partial<Record<'props' | 'hooks', Map<string, number>>> = {};
	let score = 0;

	for (const token of tokens) {
		let best = -1;
		let matched = false;

		const scalars: [FieldKey, number, string | undefined][] = [
			['label', LABEL_BASE[record.kind], record.label],
			['description', 30, record.description],
			['context', 10, record.context]
		];
		for (const [key, base, value] of scalars) {
			if (value === undefined) continue;
			const s = fieldScore(base, token, value);
			if (s === null) continue;
			matched = true;
			fieldTotals[key] = (fieldTotals[key] ?? 0) + s;
			if (s > best) best = s;
		}

		for (const key of ['props', 'hooks'] as const) {
			const entries = record[key];
			if (!entries) continue;
			let map = entryTotals[key];
			if (!map) entryTotals[key] = map = new Map();
			let arrayBest = -1;
			for (const entry of entries) {
				const s = fieldScore(50, token, entry);
				if (s === null) continue;
				matched = true;
				map.set(entry, (map.get(entry) ?? 0) + s);
				if (s > arrayBest) arrayBest = s;
			}
			if (arrayBest > -1) {
				fieldTotals[key] = (fieldTotals[key] ?? 0) + arrayBest;
				if (arrayBest > best) best = arrayBest;
			}
		}

		if (!matched) return null;
		score += best;
	}

	let winningField: FieldKey = FIELD_PRIORITY[0];
	let winningTotal = -1;
	for (const key of FIELD_PRIORITY) {
		const total = fieldTotals[key];
		if (total !== undefined && total > winningTotal) {
			winningTotal = total;
			winningField = key;
		}
	}

	// A heading record shares its `context` string with the page record it
	// belongs to, so a heading that matches only on context is never the
	// reason the query found anything — the owning page record already
	// matches that same field and produces its own hit. Emitting one for the
	// heading too would just be the page's href a second time under a
	// different label. Dropping it here keeps a breadcrumb-word query
	// (`foundation`, `theming`) returning one hit per page, not one per page
	// plus one per heading on that page.
	if (record.kind === 'heading' && winningField === 'context') return null;

	let entryName: string | undefined;
	if (winningField === 'props' || winningField === 'hooks') {
		let best = -1;
		for (const [name, total] of entryTotals[winningField]!) {
			if (total > best) {
				best = total;
				entryName = name;
			}
		}
	}

	return { record, score, winningField, entryName };
}

/** The winning field resolved to what the reader sees. */
function toHit({ record, score, winningField, entryName }: RecordMatch): SearchHit {
	const pageLabel = record.kind === 'page' ? record.label : (record.page as string);
	const pageHref = record.kind === 'page' ? record.href : record.href.split('#')[0];

	let label = pageLabel;
	let href = pageHref;

	if (winningField === 'label' && record.kind === 'heading') {
		label = `${pageLabel} › ${record.label}`;
		href = record.href;
	} else if (winningField === 'props') {
		label = `${pageLabel} › ${entryName}`;
		href = `${pageHref}#props-heading`;
	} else if (winningField === 'hooks') {
		label = `${pageLabel} › ${entryName}`;
		href = `${pageHref}#hooks-heading`;
	}
	// label/description/context winning on a page record, or context winning
	// on a heading record, all resolve to the page's own identity — already
	// the default above.

	return { label, context: record.context, href, score, record };
}

/**
 * Ranks every record against a query: substring and word-boundary only, no
 * fuzzy matching. Every query token must match somewhere in a
 * record for it to appear at all. Results sort by score descending, ties
 * broken by index order — a stable sort over the index array, since matches
 * are collected in that order.
 */
export function searchDocs(index: SearchRecord[], query: string, limit = 20): SearchHit[] {
	const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return [];

	const matches: RecordMatch[] = [];
	for (const record of index) {
		const match = matchRecord(record, tokens);
		if (match) matches.push(match);
	}
	matches.sort((a, b) => b.score - a.score);
	return matches.slice(0, limit).map(toHit);
}
