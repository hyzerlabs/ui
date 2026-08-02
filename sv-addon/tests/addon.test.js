import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';
import addon from '../src/index.js';
import { setupTest } from './setup/suite.js';

const { test, testCases } = setupTest(
	{ addon },
	{
		kinds: [
			{ type: 'default', options: { [addon.id]: { config: true, utilities: false } } },
			{
				type: 'no-config-with-utilities',
				options: { [addon.id]: { config: false, utilities: true } }
			}
		],
		filter: (testCase) => testCase.variant.includes('kit'),
		browser: false
	}
);

test.concurrent.for(testCases)('@hyzer-labs/sv $kind.type $variant', async (testCase, { ...ctx }) => {
	const cwd = ctx.cwd(testCase);
	const read = (p) => fs.readFileSync(path.resolve(cwd, p), 'utf8');
	const withConfig = testCase.kind.type === 'default';

	const pkg = JSON.parse(read('package.json'));
	expect(pkg.dependencies['@hyzer-labs/ui']).toBeDefined();

	const stylesheetPath = fs.existsSync(path.resolve(cwd, 'src/app.css'))
		? 'src/app.css'
		: 'src/routes/layout.css';
	const stylesheet = read(stylesheetPath);
	const tokensAt = stylesheet.indexOf(`@import '@hyzer-labs/ui/tokens.css'`);
	const themeAt = stylesheet.indexOf(`@import '@hyzer-labs/ui/theme'`);
	expect(tokensAt).toBeGreaterThanOrEqual(0);
	expect(themeAt).toBeGreaterThan(tokensAt);
	if (withConfig) {
		expect(stylesheet).not.toContain('utilities.css');
	} else {
		expect(stylesheet.indexOf(`@import '@hyzer-labs/ui/utilities.css'`)).toBeGreaterThan(themeAt);
	}

	const layout = read('src/routes/+layout.svelte');
	expect(layout).toContain(stylesheetPath === 'src/app.css' ? '../app.css' : './layout.css');

	if (withConfig) {
		const config = read('hyzer.config.ts');
		expect(config).toContain('defineConfig({');
		expect(config).toContain('// Docs: https://design.hyzer.sh/docs/foundation/config');
	} else {
		expect(fs.existsSync(path.resolve(cwd, 'hyzer.config.ts'))).toBe(false);
	}
});
