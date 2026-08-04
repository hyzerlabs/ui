import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { releaseNotes } from '../../scripts/release-notes.js';

const SAMPLE = `# Changelog

## [0.2.0] — 2026-01-02

Intro line that is
hard-wrapped.

### Added

- **A thing** — with a wrapped
  continuation line.
- Plain bullet.

## [0.1.0] — 2026-01-01

First release.
`;

describe('releaseNotes', () => {
	it('extracts the section, unwraps lines, and links the compare range', () => {
		const notes = releaseNotes(SAMPLE, '0.2.0');
		expect(notes).toContain('Intro line that is hard-wrapped.');
		expect(notes).toContain('- **A thing** — with a wrapped continuation line.');
		expect(notes).toContain('- Plain bullet.');
		expect(notes).toContain('/compare/v0.1.0...v0.2.0');
		expect(notes).not.toContain('## [');
	});

	it('links the tag instead of a compare range for the earliest version', () => {
		expect(releaseNotes(SAMPLE, '0.1.0')).toContain('/releases/tag/v0.1.0');
	});

	it('throws on a version the changelog does not have', () => {
		expect(() => releaseNotes(SAMPLE, '9.9.9')).toThrow('9.9.9');
	});

	it('builds notes from the real CHANGELOG.md for the current package version', () => {
		const changelog = readFileSync('CHANGELOG.md', 'utf8');
		const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
		const notes = releaseNotes(changelog, version);
		expect(notes).toContain('**Full changelog:**');
		expect(notes).not.toContain('## [');
	});
});
