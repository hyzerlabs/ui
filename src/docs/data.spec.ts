/**
 * Holds src/docs/data/ against the manifest and the library source — specs/40
 * R1/R2. Mirrors hooks.spec.ts's registry-keyed-by-component pattern: two
 * tests pin coverage in both directions (every component page has an entry;
 * every entry has a page), and a third holds the documented prop names
 * against the component source that actually declares them.
 *
 * The prop check is `documented ⊆ source`, not the reverse — it catches a
 * renamed or removed prop left stale in the docs, which is what R2 asks for.
 * The opposite direction (every real prop documented, types/defaults/
 * required flags correct) is a manual, per-page checklist item; a lint rule
 * can't read intent well enough to fill it in.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { componentDocs } from './data/index.js';
import { isSection, manifest, sectionPages } from './manifest';

const COMPONENTS = join(process.cwd(), 'src/lib/components');
const LIB = join(process.cwd(), 'src/lib');

/** Component pages, from the manifest's Components section — same helper as hooks.spec.ts. */
const componentPages = (() => {
	const section = manifest.find((e) => isSection(e) && e.label === 'Components');
	if (!section || !isSection(section)) throw new Error('No Components section in the manifest');
	return sectionPages(section);
})();

/**
 * <Name> → its .svelte source. The mapping from a registry entry to its
 * component source is this convention (specs/40 R2): the registry key IS
 * the manifest label IS the file stem — the same convention hooks.spec.ts's
 * componentSource() already relies on, holding here so a registry key with
 * no matching file fails loudly rather than silently reading nothing.
 */
function componentSource(name: string): string {
	// Tooltip (specs/50) has no Tooltip.svelte — `tooltip` is an attachment,
	// not a component; its documented options live in attachments/tooltip.ts.
	if (name === 'Tooltip') {
		return readFileSync(join(LIB, 'attachments/tooltip.ts'), 'utf8');
	}
	return readFileSync(join(COMPONENTS, `${name}.svelte`), 'utf8');
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('data/ — coverage (specs 40 R1)', () => {
	it('every component page has a registry entry', () => {
		const missing = componentPages.filter((p) => !componentDocs[p.label]);
		expect(missing.map((p) => p.label)).toEqual([]);
	});

	it('has no entry for a component that has no page', () => {
		const labels = new Set(componentPages.map((p) => p.label));
		const orphans = Object.keys(componentDocs).filter((k) => !labels.has(k));
		expect(orphans).toEqual([]);
	});

	it('every entry has a description and an importLine', () => {
		const violations: string[] = [];
		for (const [name, doc] of Object.entries(componentDocs)) {
			if (!doc.description.length) violations.push(`${name}: empty description`);
			if (!doc.importLine.length) violations.push(`${name}: empty importLine`);
		}
		expect(violations).toEqual([]);
	});
});

describe('data/ — documented props exist in source (specs 40 R2)', () => {
	it('every documented prop name appears in its component source', () => {
		const violations: string[] = [];
		for (const [name, doc] of Object.entries(componentDocs)) {
			const src = componentSource(name);
			for (const row of doc.props ?? []) {
				// A row may document several sibling props at once (Lightbox's
				// single-image sugar: 'src / alt / thumbSrc / caption' — one type,
				// default, and note shared by four real props) — check each name.
				for (const propName of row.name.split('/').map((n) => n.trim())) {
					const re = new RegExp('\\b' + escapeRegExp(propName) + '\\b');
					if (!re.test(src)) {
						violations.push(`${name}: documented prop \`${propName}\` not found in ${name}.svelte`);
					}
				}
			}
		}
		expect(violations).toEqual([]);
	});
});

describe('data/ — rows are well-formed', () => {
	it('every prop row has a name, type, and default', () => {
		const violations: string[] = [];
		for (const [name, doc] of Object.entries(componentDocs)) {
			for (const row of doc.props ?? []) {
				if (!row.name.length) violations.push(`${name}: a prop row has no name`);
				if (!row.type.length) violations.push(`${name}/${row.name}: no type`);
				if (!row.default.length) violations.push(`${name}/${row.name}: no default`);
			}
			for (const t of doc.types ?? []) {
				if (!t.name.length) violations.push(`${name}: a types entry has no name`);
				if (!t.props.length) violations.push(`${name}/${t.name}: no props`);
			}
			for (const link of doc.a11yLinks ?? []) {
				if (!link.label.length) violations.push(`${name}: an a11yLink has no label`);
				if (!link.href.length) violations.push(`${name}/${link.label}: no href`);
			}
		}
		expect(violations).toEqual([]);
	});
});
