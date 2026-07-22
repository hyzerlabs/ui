import { describe, expect, it } from 'vitest';
import { pascalize } from './pascalize.js';

describe('pascalize — kebab-case → PascalCase icon export names (specs/36 R1)', () => {
	it('a single-word name capitalizes its first letter', () => {
		expect(pascalize('menu')).toBe('Menu');
	});

	it('a multi-word name capitalizes every hyphen-separated segment', () => {
		expect(pascalize('chevron-down')).toBe('ChevronDown');
		expect(pascalize('external-link')).toBe('ExternalLink');
	});

	// Edge case: "Lucide name that pascalizes awkwardly (axis-3d, a-arrow-down)".
	it('a numeral-leading segment stays attached to its word — axis-3d → Axis3d', () => {
		expect(pascalize('axis-3d')).toBe('Axis3d');
	});

	it('a single-letter segment capitalizes to a lone letter — a-arrow-down → AArrowDown', () => {
		expect(pascalize('a-arrow-down')).toBe('AArrowDown');
	});

	it('a-large-small → ALargeSmall', () => {
		expect(pascalize('a-large-small')).toBe('ALargeSmall');
	});
});
