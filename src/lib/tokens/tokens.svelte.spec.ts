import { describe, it, expect, afterEach } from 'vitest';
import './tokens.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get a CSS custom property value from :root, trimmed of whitespace.
 */
function rootVar(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Resolve a CSS color via var() by applying it to a temporary element's
 * `color` property and reading the computed result. The element is appended
 * and removed synchronously.
 */
function resolveColor(varExpression: string): string {
	const probe = document.createElement('div');
	probe.style.cssText = `color: ${varExpression}`;
	document.body.appendChild(probe);
	const resolved = getComputedStyle(probe).color;
	document.body.removeChild(probe);
	return resolved;
}

// ---------------------------------------------------------------------------
// R1/R2/R3/R6 — computed values on :root
// ---------------------------------------------------------------------------

describe('R1 — spacing tokens resolve correctly on :root', () => {
	it('--hz-space-md resolves to "2rem"', () => {
		expect(rootVar('--hz-space-md')).toBe('2rem');
	});

	it('--hz-space-xs resolves to "0.5rem"', () => {
		expect(rootVar('--hz-space-xs')).toBe('0.5rem');
	});

	it('--hz-space-sm resolves to "1rem"', () => {
		expect(rootVar('--hz-space-sm')).toBe('1rem');
	});

	it('--hz-space-lg resolves to "4rem"', () => {
		expect(rootVar('--hz-space-lg')).toBe('4rem');
	});

	it('--hz-space-xl resolves to "8rem"', () => {
		expect(rootVar('--hz-space-xl')).toBe('8rem');
	});
});

describe('R1 — width tokens resolve correctly on :root', () => {
	it('--hz-width-lg resolves to "1200px"', () => {
		expect(rootVar('--hz-width-lg')).toBe('1200px');
	});

	it('--hz-width-sm resolves to "640px"', () => {
		expect(rootVar('--hz-width-sm')).toBe('640px');
	});

	it('--hz-width-md resolves to "968px"', () => {
		expect(rootVar('--hz-width-md')).toBe('968px');
	});

	it('--hz-width-xl resolves to "1440px"', () => {
		expect(rootVar('--hz-width-xl')).toBe('1440px');
	});
});

describe('R2/R3 — color tokens resolve on :root', () => {
	it('--hz-color-gray is defined and non-empty', () => {
		expect(rootVar('--hz-color-gray')).toBeTruthy();
	});

	it('--hz-color-primary is defined and non-empty', () => {
		expect(rootVar('--hz-color-primary')).toBeTruthy();
	});

	it('--hz-color-info is defined and non-empty', () => {
		expect(rootVar('--hz-color-info')).toBeTruthy();
	});
});

describe('R6 — type scale token resolves on :root', () => {
	it('--hz-font-size-base resolves to "1rem"', () => {
		expect(rootVar('--hz-font-size-base')).toBe('1rem');
	});

	it('--hz-font-size-sm resolves to "0.875rem"', () => {
		expect(rootVar('--hz-font-size-sm')).toBe('0.875rem');
	});

	it('--hz-font-size-2xl resolves to "2.75rem"', () => {
		expect(rootVar('--hz-font-size-2xl')).toBe('2.75rem');
	});

	it('--hz-line-height-base resolves to "1.5"', () => {
		expect(rootVar('--hz-line-height-base')).toBe('1.5');
	});
});

describe('R6 — motion tokens resolve on :root', () => {
	it('--hz-duration-base resolves to "250ms"', () => {
		expect(rootVar('--hz-duration-base')).toBe('250ms');
	});

	it('--hz-ease-standard resolves to the standard cubic-bezier', () => {
		expect(rootVar('--hz-ease-standard')).toBe('cubic-bezier(0.2, 0, 0, 1)');
	});

	it('--hz-z-toast resolves to "1200"', () => {
		expect(rootVar('--hz-z-toast')).toBe('1200');
	});
});

// ---------------------------------------------------------------------------
// R4 — semantic role indirection (light mode)
// ---------------------------------------------------------------------------

describe('R4 — semantic role indirection in light mode', () => {
	it('--hz-color-surface resolves to the same color as --hz-color-white', () => {
		const surface = resolveColor('var(--hz-color-surface)');
		const white = resolveColor('var(--hz-color-white)');
		expect(surface).toBe(white);
	});

	it('--hz-color-text resolves to the same color as --hz-color-black', () => {
		const text = resolveColor('var(--hz-color-text)');
		const black = resolveColor('var(--hz-color-black)');
		expect(text).toBe(black);
	});
});

// ---------------------------------------------------------------------------
// R5 — dark theme hook
// ---------------------------------------------------------------------------

describe('R5 — dark theme override hook', () => {
	afterEach(() => {
		document.documentElement.removeAttribute('data-theme');
	});

	it('data-theme="dark" on root flips --hz-color-surface to the same color as --hz-color-black', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		const surface = resolveColor('var(--hz-color-surface)');
		const black = resolveColor('var(--hz-color-black)');
		expect(surface).toBe(black);
	});

	it('data-theme="dark" on root flips --hz-color-text to the same color as --hz-color-white', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		const text = resolveColor('var(--hz-color-text)');
		const white = resolveColor('var(--hz-color-white)');
		expect(text).toBe(white);
	});

	it('--hz-color-primary is unchanged in dark mode', () => {
		const before = rootVar('--hz-color-primary');
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(rootVar('--hz-color-primary')).toBe(before);
	});

	it('--hz-color-gray is unchanged in dark mode', () => {
		const before = rootVar('--hz-color-gray');
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(rootVar('--hz-color-gray')).toBe(before);
	});

	it('--hz-color-text-muted is unchanged in dark mode', () => {
		const before = rootVar('--hz-color-text-muted');
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(rootVar('--hz-color-text-muted')).toBe(before);
	});

	it('--hz-color-border is unchanged in dark mode', () => {
		const before = rootVar('--hz-color-border');
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(rootVar('--hz-color-border')).toBe(before);
	});

	it('--hz-space-md is unchanged in dark mode', () => {
		const before = rootVar('--hz-space-md');
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(rootVar('--hz-space-md')).toBe(before);
	});

	it('removing data-theme restores light-mode surface', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		document.documentElement.removeAttribute('data-theme');
		const surface = resolveColor('var(--hz-color-surface)');
		const white = resolveColor('var(--hz-color-white)');
		expect(surface).toBe(white);
	});
});
