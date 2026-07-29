import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { allRoutes, isSection, manifest, sectionPages, type ManifestPage } from './manifest';

const here = dirname(fileURLToPath(import.meta.url));
const routesDir = join(here, '../routes');

const pages: ManifestPage[] = manifest.flatMap((e) => (isSection(e) ? sectionPages(e) : [e]));

describe('manifest — specs/53 R3/R5/R8', () => {
	it('every page lives under /docs', () => {
		const strays = pages.map((p) => p.href).filter((h) => h !== '/docs' && !h.startsWith('/docs/'));
		expect(strays).toEqual([]);
	});

	it('Getting Started is /docs itself — no redirect, no index page', () => {
		expect(pages[0]).toMatchObject({ label: 'Getting Started', href: '/docs' });
		expect(pages.filter((p) => p.href === '/docs/getting-started')).toEqual([]);
	});

	it('every page has a description', () => {
		const missing = pages.filter((p) => !p.description?.trim()).map((p) => p.href);
		expect(missing).toEqual([]);
	});

	it('descriptions are plain text — they feed llms.txt and meta tags', () => {
		// Naming an element in prose ("built on the native <dialog> element") is
		// plain text and stays; a closing tag or an inline formatting tag means
		// markup was pasted in, which llms.txt and <meta> cannot render.
		const markup = /<\/|<(?:code|a|em|strong|span|p|ul|li|br)[\s>/]/i;
		const withMarkup = pages.filter((p) => markup.test(p.description)).map((p) => p.href);
		expect(withMarkup).toEqual([]);
	});

	it('descriptions stand on their own — no template leftovers, no dangling clause', () => {
		// Both defects come from lifting a description out of page markup: a
		// `{expr}` that only resolves inside a component, and a trailing colon
		// left by a list that stayed behind on the page.
		const broken = pages
			.filter((p) => /[{}]/.test(p.description) || p.description.trim().endsWith(':'))
			.map((p) => p.href);
		expect(broken).toEqual([]);
	});

	it('every page resolves to a real +page.svelte', () => {
		const missing = pages
			.map((p) => ({ href: p.href, file: join(routesDir, p.href, '+page.svelte') }))
			.filter((p) => !existsSync(p.file))
			.map((p) => p.href);
		expect(missing).toEqual([]);
	});

	it('every +page.svelte under routes/docs is in the manifest', () => {
		const known = new Set(allRoutes);
		const found: string[] = [];
		const walk = (dir: string, href: string) => {
			for (const name of readdirSync(dir)) {
				const full = join(dir, name);
				if (statSync(full).isDirectory()) walk(full, `${href}/${name}`);
				else if (name === '+page.svelte') found.push(href);
			}
		};
		walk(join(routesDir, 'docs'), '/docs');
		expect(found.filter((h) => !known.has(h)).sort()).toEqual([]);
	});
});

describe('links — no page still points at a pre-move URL (specs/53 R4)', () => {
	// Section prefixes that used to live at the root. After the move nothing
	// should link to them there — but demo data legitimately uses fictional
	// URLs (a Breadcrumbs demo showing "/components", a Footer demo's
	// "/about"), so this bans the SPECIFIC old page paths, not the shape.
	const stale = allRoutes.map((h) => h.replace(/^\/docs/, '')).filter(Boolean);

	const sources: string[] = [];
	const walk = (dir: string) => {
		for (const name of readdirSync(dir)) {
			const full = join(dir, name);
			if (statSync(full).isDirectory()) walk(full);
			else if (/\.(svelte|ts)$/.test(name)) sources.push(full);
		}
	};
	walk(join(here, '../routes'));
	walk(here);

	it('no href points at an old root-level docs path', () => {
		const violations: string[] = [];
		for (const file of sources) {
			const text = readFileSync(file, 'utf8');
			for (const path of stale) {
				// Match the quoted whole value only, so a correct
				// "/docs/components/button" never trips the bare needle inside it.
				const re = new RegExp(`href(?:=|: )["']${path}["']`);
				if (re.test(text)) violations.push(`${file.replace(here, '.')} → ${path}`);
			}
		}
		expect(violations).toEqual([]);
	});
});
