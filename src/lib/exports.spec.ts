import { describe, it, expect } from 'vitest';

/**
 * R5: importing from each subpath returns the expected placeholder export.
 * Tests use $lib/* aliases which map to src/lib/* — same seams as the
 * published dist/ entries, tested at source level.
 */
describe('subpath exports — R5', () => {
	it('$lib (.) — exports Placeholder component', async () => {
		const mod = await import('$lib');
		expect(mod.Placeholder).toBeDefined();
	});

	it('$lib/tokens — exports tokens object', async () => {
		const mod = await import('$lib/tokens');
		expect(mod.tokens).toBeDefined();
		expect(mod.tokens.prefix).toBe('--hz');
	});

	it('$lib/icons — exports ICONS_PLACEHOLDER', async () => {
		const mod = await import('$lib/icons');
		expect(mod.ICONS_PLACEHOLDER).toBeDefined();
	});

	it('$lib/utils — exports utils object', async () => {
		const mod = await import('$lib/utils');
		expect(mod.utils).toBeDefined();
	});

	it('$lib/types — exports NavItem, FooterColumn, Size, Intent, Variant as types (module imports)', async () => {
		// Type-only exports have no runtime value; we verify the module loads without error.
		const mod = await import('$lib/types');
		// The module should exist and be importable
		expect(mod).toBeDefined();
	});
});

/**
 * R4: package.json name is @hyzer-labs/ui and exports keys match the architecture list.
 */
describe('package.json metadata — R4', () => {
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
