import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consumerSource, INTERNAL_SPECIFIER } from './consumerSource.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * specs/32 R8 — every copyable sample on /theming/examples is a real file in
 * this repo, rewritten to the specifiers a consumer would type. If a sample
 * still shows `$lib` or a relative engine import, the reader copies something
 * that cannot work in their project.
 */
describe('consumerSource', () => {
	it('rewrites the engine import in an example config', () => {
		expect(consumerSource(`import { defineConfig } from '../../../config/index.js';`)).toBe(
			`import { defineConfig } from '@hyzer-labs/ui/config';`
		);
	});

	it('rewrites the registry augmentation to the declaring module', () => {
		// Augmenting '@hyzer-labs/ui' would NOT merge — the interface is
		// declared in the types module and only re-exported by the barrel.
		expect(consumerSource(`declare module '$lib/types' {`)).toBe(
			`declare module '@hyzer-labs/ui/types' {`
		);
	});

	it('rewrites a bare $lib import', () => {
		expect(consumerSource(`import { Button } from '$lib';`)).toBe(
			`import { Button } from '@hyzer-labs/ui';`
		);
	});

	it.each([
		'src/lib/theme/examples/ocean.config.ts',
		'src/lib/theme/examples/sunset/sunset.config.ts',
		'src/lib/theme/examples/terminal/terminal.config.ts',
		'src/lib/theme/examples/terminal/intents.d.ts'
	])('leaves no internal specifier in %s', (file) => {
		const rewritten = consumerSource(readFileSync(join(repo, file), 'utf8'));
		const hit = INTERNAL_SPECIFIER.exec(rewritten);
		expect(hit?.[0]).toBeUndefined();
	});
});
