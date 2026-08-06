import { describe, expect, it } from 'vitest';
import { resolveConfig, HyzerConfigError } from './schema.js';
import { resolveIcons } from './icons.js';
import { CORE_ICONS } from '../icons/core.js';

describe('resolveConfig — icons field (specs/36 R5)', () => {
	it('no icons key resolves icons as undefined', () => {
		expect(resolveConfig().icons).toBeUndefined();
	});

	it('icons: [] resolves to an empty (but defined) array', () => {
		expect(resolveConfig({ icons: [] }).icons).toEqual([]);
	});

	it('duplicate entries are deduplicated, order preserved', () => {
		expect(resolveConfig({ icons: ['plus', 'menu', 'plus'] }).icons).toEqual(['plus', 'menu']);
	});

	it('rejects a non-array icons value', () => {
		expect(() => resolveConfig({ icons: 'plus' as unknown as string[] })).toThrow(HyzerConfigError);
	});

	it('rejects an array containing a non-string / empty-string entry', () => {
		expect(() => resolveConfig({ icons: [''] })).toThrow(HyzerConfigError);
		expect(() => resolveConfig({ icons: [42 as unknown as string] })).toThrow(HyzerConfigError);
	});

	it('an unrecognized top-level "icons" typo still fails via assertKnownKeys, "icons" itself is accepted', () => {
		expect(() => resolveConfig({ iconz: [] } as never)).toThrow(HyzerConfigError);
		expect(() => resolveConfig({ icons: ['menu'] })).not.toThrow();
	});
});

describe('resolveIcons — trimmed barrel resolution (specs/36 R6)', () => {
	it('no icons key → undefined (no file, no report section)', () => {
		expect(resolveIcons(resolveConfig())).toBeUndefined();
	});

	it('icons: [] → the core-only barrel', () => {
		const result = resolveIcons(resolveConfig({ icons: [] }))!;
		expect(result.names).toEqual([...CORE_ICONS].sort());
		expect(result.coreCount).toBe(CORE_ICONS.length);
		expect(result.configuredCount).toBe(0);
		expect(result.unknown).toEqual([]);
	});

	it('a configured core icon is deduplicated into the core group with no warning', () => {
		const result = resolveIcons(resolveConfig({ icons: ['menu'] }))!;
		expect(result.names.filter((n) => n === 'menu')).toHaveLength(1);
		expect(result.coreCount).toBe(CORE_ICONS.length);
		expect(result.configuredCount).toBe(0);
		expect(result.unknown).toEqual([]);
	});

	it('a valid non-core name is added as a configured extra, alphabetical among extras', () => {
		const result = resolveIcons(resolveConfig({ icons: ['trash-2', 'settings'] }))!;
		expect(result.configuredCount).toBe(2);
		expect(result.names).toEqual([...[...CORE_ICONS].sort(), 'settings', 'trash-2']);
	});

	it('an unknown name is reported and omitted from the emitted barrel', () => {
		const result = resolveIcons(resolveConfig({ icons: ['serch'] }))!;
		expect(result.unknown).toEqual(['serch']);
		expect(result.names).not.toContain('serch');
		expect(result.names).toEqual([...CORE_ICONS].sort());
	});

	it('duplicate configured extras are deduplicated silently', () => {
		const result = resolveIcons(resolveConfig({ icons: ['trash-2', 'trash-2'] }))!;
		expect(result.names.filter((n) => n === 'trash-2')).toHaveLength(1);
		expect(result.configuredCount).toBe(1);
	});

	it('renders an icons.ts module with a deep re-export per included icon', () => {
		const result = resolveIcons(resolveConfig({ icons: ['settings'] }))!;
		expect(result.module).toContain('GENERATED FILE - do not edit by hand');
		expect(result.module).toContain(
			`export { default as IconSettings } from '@hyzer-labs/ui/icons/settings';`
		);
		expect(result.module).toContain(
			`export { default as IconChevronDown } from '@hyzer-labs/ui/icons/chevron-down';`
		);
	});
});
