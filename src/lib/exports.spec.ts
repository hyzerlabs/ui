import { describe, it, expect } from 'vitest';

/**
 * Verifies every subpath export resolves and exposes its public API.
 */
describe('subpath exports', () => {
	it('$lib (.) — exports Button, Link, layout primitives, Nav, and Footer', async () => {
		const mod = await import('$lib');
		expect(mod.Button).toBeDefined();
		expect(mod.Link).toBeDefined();
		expect(mod.Container).toBeDefined();
		expect(mod.Stack).toBeDefined();
		expect(mod.Cluster).toBeDefined();
		expect(mod.Grid).toBeDefined();
		expect(mod.Split).toBeDefined();
		expect(mod.Nav).toBeDefined();
		expect(mod.Footer).toBeDefined();
	});

	it('$lib/tokens — exports tokens object', async () => {
		const mod = await import('$lib/tokens');
		expect(mod.tokens).toBeDefined();
		expect(mod.tokens.prefix).toBe('--hz');
	});

	it('$lib/icons — exports IconLoader component', async () => {
		const mod = await import('$lib/icons');
		expect(mod.IconLoader).toBeDefined();
	});

	it('$lib/utils — exports cx and uid functions', async () => {
		const mod = await import('$lib/utils');
		expect(typeof mod.cx).toBe('function');
		expect(typeof mod.uid).toBe('function');
	});

	it('$lib/types — module is importable (type-only exports have no runtime value)', async () => {
		const mod = await import('$lib/types');
		expect(mod).toBeDefined();
	});
});

/**
 * Sanity-checks on package.json metadata.
 */
describe('package.json metadata', () => {
	it('package name is @hyzer-labs/ui', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		expect(pkg.default.name).toBe('@hyzer-labs/ui');
	});

	it('exports map contains all required subpath keys', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		const exports = pkg.default.exports as Record<string, unknown>;
		expect(exports['.']).toBeDefined();
		expect(exports['./tokens']).toBeDefined();
		expect(exports['./tokens.css']).toBeDefined();
		expect(exports['./icons']).toBeDefined();
		expect(exports['./utils']).toBeDefined();
		expect(exports['./types']).toBeDefined();
		expect(exports['./theme']).toBeDefined();
		expect(exports['./theme/*.css']).toBeDefined();
	});
});
