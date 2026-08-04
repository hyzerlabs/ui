/**
 * Print the GitHub Release body for one version, taken from CHANGELOG.md.
 * The body is that version's section with hard-wrapped lines unwrapped,
 * because GitHub renders single newlines as line breaks. It ends with the
 * compare link against the previous version. The Publish workflow pipes
 * this into `gh release create` on every v* tag push, so the releases page
 * stays in step with the changelog. It drifted for 0.4.0 and 0.5.0.
 * Run: `pnpm exec tsx scripts/release-notes.ts 0.6.0`
 */
import { readFileSync } from 'node:fs';

const REPO_URL = 'https://github.com/hyzerlabs/ui';

/** The unwrapped changelog section for `version`, ending with the compare link. */
export function releaseNotes(changelog: string, version: string): string {
	const escaped = version.replace(/[.\\[\]{}()*+?^$|]/g, '\\$&');
	const match = changelog.match(
		new RegExp(`## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|$)`)
	);
	if (!match) {
		throw new Error(
			`CHANGELOG.md has no section for version ${version}. Add a "## [${version}]" heading.`
		);
	}
	const body = match[1].trim();

	// Unwrap: a line that is not blank and does not start a bullet or a
	// heading continues the previous line.
	const out: string[] = [];
	for (const line of body.split('\n')) {
		const s = line.trim();
		if (!s) out.push('');
		else if (s.startsWith('- ') || s.startsWith('### ') || !out.length || !out[out.length - 1]) {
			out.push(s);
		} else {
			out[out.length - 1] += ` ${s}`;
		}
	}

	// The previous version is the next section heading down. The first
	// release ever has nothing to compare against, so it gets a plain tag
	// link instead of a compare range.
	const after = changelog.slice(changelog.indexOf(match[0]) + match[0].length);
	const prev = after.match(/## \[([^\]]+)\]/)?.[1];
	const link = prev
		? `${REPO_URL}/compare/v${prev}...v${version}`
		: `${REPO_URL}/releases/tag/v${version}`;

	return `${out.join('\n')}\n\n**Full changelog:** ${link}\n`;
}

const invokedDirectly = process.argv[1]?.endsWith('release-notes.ts');
if (invokedDirectly) {
	const version = process.argv[2];
	if (!version) {
		console.error('Usage: tsx scripts/release-notes.ts <version>, for example 0.6.0');
		process.exit(1);
	}
	process.stdout.write(releaseNotes(readFileSync('CHANGELOG.md', 'utf8'), version));
}
