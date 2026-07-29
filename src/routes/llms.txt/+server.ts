import {
	isSection,
	isGrouped,
	manifest,
	sectionPages,
	type ManifestPage
} from '../../docs/manifest';

export const prerender = true;

const SITE = 'https://design.hyzer.sh';

const INTRO = [
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
	''
].join('\n');

/** `- [Title](absolute url): description` — one line per page. */
function line(page: ManifestPage): string {
	return `- [${page.label}](${SITE}${page.href}): ${page.description}`;
}

/**
 * The llms.txt index (llmstxt.org), built from the same manifest that renders
 * the sidebar — so a page cannot exist in the nav and be missing here, and a
 * description cannot drift from the one the page displays.
 */
function render(): string {
	const parts: string[] = [INTRO];

	const standalone = manifest.filter((e): e is ManifestPage => !isSection(e));
	if (standalone.length > 0) {
		parts.push('## Start here', '', ...standalone.map(line), '');
	}

	for (const entry of manifest) {
		if (!isSection(entry)) continue;
		parts.push(`## ${entry.label}`, '');
		if (isGrouped(entry)) {
			// Group bands are presentational in the sidebar, but they carry real
			// meaning for a reader scanning by category — keep them as sub-headings.
			for (const group of entry.groups) {
				parts.push(`### ${group.label}`, '', ...group.pages.map(line), '');
			}
		} else {
			parts.push(...sectionPages(entry).map(line), '');
		}
	}

	return parts.join('\n');
}

export function GET(): Response {
	return new Response(render(), {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
}
