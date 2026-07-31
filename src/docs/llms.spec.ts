/**
 * Holds `renderLlmsFull()` against the same data it is built from — the
 * `data.spec.ts` / `hooks.spec.ts` idiom: a `violations: string[]` array
 * asserted `toEqual([])` so every failure reports at once.
 *
 * Rendered once at module scope; every test reads the same string.
 */
import { describe, it, expect } from 'vitest';
import { buildLlmsFullJson, renderLlmsFull, renderLlmsIndex, SITE } from './llms';
import { componentDocs } from './data/index.js';
import { isSection, isGrouped, manifest } from './manifest';

const output = renderLlmsFull();
const lines = output.split('\n');

const componentsSection = (() => {
	const section = manifest.find((e) => isSection(e) && e.label === 'Components');
	if (!section || !isSection(section) || !isGrouped(section)) {
		throw new Error('No grouped Components section in the manifest');
	}
	return section;
})();

const groupLabels = componentsSection.groups.map((g) => g.label);
const pageLabels = componentsSection.groups.flatMap((g) => g.pages.map((p) => p.label));

/** The slice of the output for one component's ### section, up to the next heading. */
function sectionFor(label: string): string {
	const start = output.indexOf(`### ${label}\n`);
	expect(start, `no ### ${label} heading found`).toBeGreaterThanOrEqual(0);
	const rest = output.slice(start + 1);
	const next = rest.search(/\n#{2,3} /);
	return next === -1 ? rest : rest.slice(0, next);
}

/** A markdown table row's cells, splitting on unescaped pipes only. */
function splitRow(line: string): string[] {
	return line.split(/(?<!\\)\|/).slice(1, -1);
}

describe('renderLlmsFull — coverage (Full-R1)', () => {
	it('has one ### heading per manifest component page, in order, no duplicates, nothing extra', () => {
		const headings = lines.filter((l) => l.startsWith('### ')).map((l) => l.slice(4));
		expect(headings).toEqual(pageLabels);
	});
});

describe('renderLlmsFull — group headings (Full-R5)', () => {
	it('has the seven group labels as ## headings, in manifest order', () => {
		const headings = lines
			.filter((l) => l.startsWith('## ') && groupLabels.includes(l.slice(3)))
			.map((l) => l.slice(3));
		expect(headings).toEqual(groupLabels);
	});
});

describe('renderLlmsFull — spot checks (Full-R5)', () => {
	it("Button's section contains the variant prop row with its documented default", () => {
		const button = sectionFor('Button');
		expect(button).toContain('`variant`');
		expect(button).toContain("`'solid' \\| 'outline' \\| 'ghost' \\| 'soft'`");
		expect(button).toContain("`'solid'`");
	});

	it("Skeleton's section contains the lastLineWidth prop", () => {
		expect(sectionFor('Skeleton')).toContain('`lastLineWidth`');
	});

	it("Button's section contains its root class, data-variant attribute, and --hz-button-accent property", () => {
		const button = sectionFor('Button');
		expect(button).toContain('Root class: `hz-button`');
		expect(button).toContain('`data-variant`');
		expect(button).toContain('`--hz-button-accent`');
	});

	it('every component section contains its importLine and its absolute docs URL', () => {
		for (const group of componentsSection.groups) {
			for (const page of group.pages) {
				const doc = componentDocs[page.label];
				if (!doc) continue;
				const section = sectionFor(page.label);
				expect(section).toContain(doc.importLine);
				expect(section).toContain(`${SITE}${page.href}`);
			}
		}
	});
});

describe('renderLlmsFull — table integrity (Full-R6)', () => {
	it('every table row has the same column count as its header — the load-bearing check for escaped pipes', () => {
		const violations: string[] = [];
		for (let i = 0; i < lines.length; i++) {
			if (!/^\|(\s*---\s*\|)+$/.test(lines[i])) continue;
			const header = lines[i - 1];
			const headerCols = splitRow(header).length;
			for (let j = i + 1; j < lines.length && lines[j].startsWith('|'); j++) {
				const cols = splitRow(lines[j]).length;
				if (cols !== headerCols) {
					violations.push(`line ${j + 1} (${cols} cols, expected ${headerCols}): ${lines[j]}`);
				}
			}
		}
		expect(violations).toEqual([]);
	});

	it('no table row is blank, and a separator always has a real header directly above it', () => {
		const violations: string[] = [];
		for (let i = 0; i < lines.length; i++) {
			if (!/^\|(\s*---\s*\|)+$/.test(lines[i])) continue;
			const header = lines[i - 1];
			if (!header || !header.startsWith('|') || header.trim() === '|') {
				violations.push(`separator at line ${i + 1} has no header row above it`);
			}
		}
		expect(violations).toEqual([]);
	});
});

describe('renderLlmsFull — a component with no styling contract (Full-R7)', () => {
	it('Metatags has a Props table and no Root class line, and the render carries no throw artefacts', () => {
		const metatags = sectionFor('Metatags');
		expect(metatags).toContain('#### Props');
		expect(metatags).not.toContain('Root class:');
		// A whole cell rendering as the literal token is the actual failure
		// mode (an unguarded `${row.note}` when a field is missing) — a bare
		// substring check would false-positive on legitimate prose, e.g.
		// Loading's "Omitted, undefined, or NaN ⇒ indeterminate." note.
		expect(output).not.toMatch(/\|\s*(undefined|null|\[object Object\])\s*\|/);
	});
});

describe('renderLlmsFull — header and imports (Full-R8)', () => {
	it('starts with the title, carries both absolute URLs and the import surface, and ends with exactly one trailing newline', () => {
		expect(output.startsWith('# @hyzer-labs/ui — full component reference')).toBe(true);
		expect(output).toContain(`${SITE}/llms.txt`);
		expect(output).toContain(`${SITE}/agents.md`);
		expect(output).toContain('import { Button, Modal, Combobox }');
		expect(output.endsWith('\n')).toBe(true);
		expect(output.endsWith('\n\n')).toBe(false);
	});
});

describe('renderLlmsFull — a11yLinks are absent (Decision 5)', () => {
	it("does not contain Skeleton's aria-busy MDN link", () => {
		expect(output).not.toContain(
			'developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy'
		);
	});
});

describe('renderLlmsIndex — unchanged apart from the new discovery line (Full-R2)', () => {
	it('still produces the strings the current route produces, plus the llms-full.txt line', () => {
		const index = renderLlmsIndex();
		expect(index).toContain('# @hyzer-labs/ui');
		expect(index).toContain('](https://design.hyzer.sh/docs)');
		expect(index).toContain('## Components');
		expect(index).toContain(`${SITE}/llms-full.txt`);
	});
});

// ---------------------------------------------------------------------------
// buildLlmsFullJson — the /llms-full.json companion
// ---------------------------------------------------------------------------

describe('buildLlmsFullJson', () => {
	const json = buildLlmsFullJson();
	// Round-tripped through JSON, the way the /llms-full.json route serves it —
	// proves the value is actually serializable (no undefined-swallowed shape
	// surprises) and gives every assertion below the same object a consumer
	// fetching the route would parse.
	const parsed = JSON.parse(JSON.stringify(json)) as typeof json;

	it('parses back to an object carrying site, imports, and a components array', () => {
		expect(typeof parsed.site).toBe('string');
		expect(typeof parsed.imports).toBe('string');
		expect(Array.isArray(parsed.components)).toBe(true);
	});

	it('has one component record per manifest component page, in order — the same count as the markdown file', () => {
		expect(parsed.components.map((c) => c.name)).toEqual(pageLabels);
		expect(parsed.components.length).toBe(pageLabels.length);
	});

	it("spot-checks Button's variant prop, its hooks, and Accordion's AccordionItem type", () => {
		const button = parsed.components.find((c) => c.name === 'Button')!;
		expect(button).toBeDefined();
		expect(button.props.some((p) => p.name === 'variant')).toBe(true);
		expect(button.hooks?.root).toBe('hz-button');
		expect(button.hooks?.attrs?.some((h) => h.name === 'data-variant')).toBe(true);
		expect(button.hooks?.props?.some((h) => h.name === '--hz-button-accent')).toBe(true);

		const accordion = parsed.components.find((c) => c.name === 'Accordion')!;
		expect(accordion).toBeDefined();
		const itemType = accordion.types.find((t) => t.name === 'AccordionItem');
		expect(itemType).toBeDefined();
		expect(itemType?.props.some((p) => p.name === 'id')).toBe(true);
	});

	it('a component with no styling contract (Metatags) round-trips with no hooks key at all', () => {
		const metatags = parsed.components.find((c) => c.name === 'Metatags')!;
		expect(metatags).toBeDefined();
		expect(metatags.hooks).toBeUndefined();
		// JSON.stringify drops an undefined-valued key outright rather than
		// serializing it — this is the assertion that actually catches a
		// component whose hooks entry was accidentally forced present.
		expect(Object.prototype.hasOwnProperty.call(metatags, 'hooks')).toBe(false);
	});

	it('carries the same importLine and site-relative route the markdown file resolves to an absolute URL', () => {
		const button = parsed.components.find((c) => c.name === 'Button')!;
		expect(button.importLine).toBe(componentDocs['Button'].importLine);
		expect(`${parsed.site}${button.route}`).toBe(`${SITE}/docs/components/button`);
	});

	it('every object serializes with a stable key order', () => {
		expect(Object.keys(json)).toEqual(['site', 'imports', 'components']);
		expect(Object.keys(json.components[0])).toEqual([
			'name',
			'group',
			'route',
			'description',
			'importLine',
			'props',
			'types',
			'hooks',
			'a11yNote'
		]);
	});
});
