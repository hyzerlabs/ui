import { describe, it, expect } from 'vitest';
import { stylesheetEdit } from '../src/index.js';

const order = (cssText, snippets) => {
	const positions = snippets.map((s) => cssText.indexOf(s));
	for (const [i, at] of positions.entries()) {
		expect(at, `missing or misplaced: ${snippets[i]}`).toBeGreaterThan(i === 0 ? -1 : positions[i - 1]);
	}
};

describe('stylesheetEdit', () => {
	it('plain project: reset → tokens → theme, no layer declaration', () => {
		const out = stylesheetEdit({ reset: true, utilities: false })('');
		order(out, [
			`@import '@hyzer-labs/ui/reset.css'`,
			`@import '@hyzer-labs/ui/tokens.css'`,
			`@import '@hyzer-labs/ui/theme'`
		]);
		expect(out).not.toContain('@layer');
		expect(out).not.toContain('utilities.css');
	});

	it('no reset, with utilities', () => {
		const out = stylesheetEdit({ reset: false, utilities: true })('');
		order(out, [
			`@import '@hyzer-labs/ui/tokens.css'`,
			`@import '@hyzer-labs/ui/theme'`,
			`@import '@hyzer-labs/ui/utilities.css'`
		]);
		expect(out).not.toContain('reset.css');
	});

	it('tailwind project: pins the cascade order and imports before tailwindcss', () => {
		const existing = "@import 'tailwindcss';\n@plugin '@tailwindcss/typography';\n";
		const out = stylesheetEdit({ reset: false, utilities: false })(existing);
		order(out, [
			'@layer hz-reset, hz-theme, theme, base, components, utilities',
			`@import '@hyzer-labs/ui/tokens.css'`,
			`@import '@hyzer-labs/ui/theme'`,
			`@import 'tailwindcss'`,
			`@plugin '@tailwindcss/typography'`
		]);
		expect(out).not.toContain('reset.css');
	});
});
