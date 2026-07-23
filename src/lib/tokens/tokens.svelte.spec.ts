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

describe('R2/R3 — palette tokens resolve on :root (specs/42 R1)', () => {
	it('--hz-palette-gray is defined and non-empty', () => {
		expect(rootVar('--hz-palette-gray')).toBeTruthy();
	});

	it('--hz-palette-primary is defined and non-empty', () => {
		expect(rootVar('--hz-palette-primary')).toBeTruthy();
	});

	it('--hz-palette-info is defined and non-empty', () => {
		expect(rootVar('--hz-palette-info')).toBeTruthy();
	});

	it('--hz-palette-black / --hz-palette-white are defined and non-empty', () => {
		expect(rootVar('--hz-palette-black')).toBeTruthy();
		expect(rootVar('--hz-palette-white')).toBeTruthy();
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
	it('--hz-duration-base resolves to "400ms"', () => {
		expect(rootVar('--hz-duration-base')).toBe('400ms');
	});

	it('--hz-ease-standard resolves to the standard cubic-bezier', () => {
		expect(rootVar('--hz-ease-standard')).toBe('cubic-bezier(0.2, 0, 0, 1)');
	});

	it('--hz-z-sticky resolves to "100"', () => {
		expect(rootVar('--hz-z-sticky')).toBe('100');
	});
});

// ---------------------------------------------------------------------------
// Density spacing — --hz-density grid unit + data-density-shift levels
// ---------------------------------------------------------------------------

describe('density spacing tokens', () => {
	/**
	 * Resolve a length var by applying it to a probe's width and reading the
	 * computed pixel value (default root font size: 0.4rem = 6.4px).
	 */
	function resolveLength(parent: HTMLElement, varName: string): number {
		const probe = document.createElement('div');
		probe.style.cssText = `width: var(${varName})`;
		parent.appendChild(probe);
		const width = parseFloat(getComputedStyle(probe).width);
		parent.removeChild(probe);
		return width;
	}

	it('--hz-density resolves to "0.4rem" on :root', () => {
		expect(rootVar('--hz-density')).toBe('0.4rem');
	});

	/** Build a chain of `depth` nested data-density-shift divs; returns the innermost. */
	function shiftChain(depth: number): { root: HTMLElement; innermost: HTMLElement } {
		const root = document.createElement('div');
		root.setAttribute('data-density-shift', '');
		let innermost = root;
		for (let i = 1; i < depth; i++) {
			const next = document.createElement('div');
			next.setAttribute('data-density-shift', '');
			innermost.appendChild(next);
			innermost = next;
		}
		document.body.appendChild(root);
		return { root, innermost };
	}

	it('base level: near = 10 units, away = 20 units', () => {
		expect(resolveLength(document.body, '--hz-space-near')).toBeCloseTo(6.4 * 10, 1);
		expect(resolveLength(document.body, '--hz-space-away')).toBeCloseTo(6.4 * 20, 1);
	});

	it('one data-density-shift ancestor tightens to 5 / 10 units', () => {
		const { root, innermost } = shiftChain(1);
		expect(resolveLength(innermost, '--hz-space-near')).toBeCloseTo(6.4 * 5, 1);
		expect(resolveLength(innermost, '--hz-space-away')).toBeCloseTo(6.4 * 10, 1);
		root.remove();
	});

	it('two nested data-density-shift ancestors tighten to 2 / 5 units', () => {
		const { root, innermost } = shiftChain(2);
		expect(resolveLength(innermost, '--hz-space-near')).toBeCloseTo(6.4 * 2, 1);
		expect(resolveLength(innermost, '--hz-space-away')).toBeCloseTo(6.4 * 5, 1);
		root.remove();
	});

	it('three nested data-density-shift ancestors tighten to 1 / 2 units (the floor)', () => {
		const { root, innermost } = shiftChain(3);
		expect(resolveLength(innermost, '--hz-space-near')).toBeCloseTo(6.4 * 1, 1);
		expect(resolveLength(innermost, '--hz-space-away')).toBeCloseTo(6.4 * 2, 1);
		root.remove();
	});

	it('overriding --hz-density rescales both distances', () => {
		document.documentElement.style.setProperty('--hz-density', '0.5rem');
		expect(resolveLength(document.body, '--hz-space-near')).toBeCloseTo(8 * 10, 1);
		expect(resolveLength(document.body, '--hz-space-away')).toBeCloseTo(8 * 20, 1);
		document.documentElement.style.removeProperty('--hz-density');
	});
});

// ---------------------------------------------------------------------------
// R4 — semantic role indirection (light mode)
// ---------------------------------------------------------------------------

describe('R4 — semantic role indirection in light mode', () => {
	it('--hz-color-surface resolves to the same color as --hz-palette-white', () => {
		const surface = resolveColor('var(--hz-color-surface)');
		const white = resolveColor('var(--hz-palette-white)');
		expect(surface).toBe(white);
	});

	it('--hz-color-text resolves to the same color as --hz-palette-black', () => {
		const text = resolveColor('var(--hz-color-text)');
		const black = resolveColor('var(--hz-palette-black)');
		expect(text).toBe(black);
	});

	it('--hz-color-surface-muted resolves to a 6% gray mix over surface', () => {
		expect(resolveColor('var(--hz-color-surface-muted)')).toBe(
			resolveColor('color-mix(in srgb, var(--hz-palette-gray) 6%, var(--hz-color-surface))')
		);
	});

	it('--hz-color-black / --hz-color-white alias roles resolve to the palette pair', () => {
		expect(resolveColor('var(--hz-color-black)')).toBe(resolveColor('var(--hz-palette-black)'));
		expect(resolveColor('var(--hz-color-white)')).toBe(resolveColor('var(--hz-palette-white)'));
	});
});

// ---------------------------------------------------------------------------
// Intent roles (2026-07-13 amendment) — same indirection pattern
// ---------------------------------------------------------------------------

describe('intent role indirection', () => {
	it('all seven --hz-intent-* tokens are defined', () => {
		for (const name of [
			'neutral',
			'primary',
			'secondary',
			'danger',
			'warning',
			'success',
			'info'
		]) {
			expect(rootVar(`--hz-intent-${name}`)).toBeTruthy();
		}
	});

	it('--hz-intent-danger resolves to the same color as --hz-palette-danger', () => {
		expect(resolveColor('var(--hz-intent-danger)')).toBe(resolveColor('var(--hz-palette-danger)'));
	});

	it('--hz-intent-neutral resolves to the same color as --hz-palette-gray', () => {
		expect(resolveColor('var(--hz-intent-neutral)')).toBe(resolveColor('var(--hz-palette-gray)'));
	});

	it('overriding --hz-intent-danger retargets it without touching the palette', () => {
		document.documentElement.style.setProperty('--hz-intent-danger', 'rgb(1, 2, 3)');
		try {
			expect(resolveColor('var(--hz-intent-danger)')).toBe('rgb(1, 2, 3)');
			expect(resolveColor('var(--hz-palette-danger)')).not.toBe('rgb(1, 2, 3)');
		} finally {
			document.documentElement.style.removeProperty('--hz-intent-danger');
		}
	});
});

// ---------------------------------------------------------------------------
// R5 — dark theme hook
// ---------------------------------------------------------------------------

describe('R5 — dark theme override hook', () => {
	afterEach(() => {
		document.documentElement.removeAttribute('data-theme');
	});

	it('data-theme="dark" on root flips --hz-color-surface to the same color as --hz-palette-black', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		const surface = resolveColor('var(--hz-color-surface)');
		const black = resolveColor('var(--hz-palette-black)');
		expect(surface).toBe(black);
	});

	it('data-theme="dark" on root flips --hz-color-text to the same color as --hz-palette-white', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		const text = resolveColor('var(--hz-color-text)');
		const white = resolveColor('var(--hz-palette-white)');
		expect(text).toBe(white);
	});

	it('--hz-palette-primary lightens to its dark companion', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(resolveColor('var(--hz-palette-primary)')).toBe('rgb(96, 165, 250)'); // #60a5fa
	});

	it('--hz-palette-gray lightens in dark mode (border/muted chains follow)', () => {
		const before = resolveColor('var(--hz-palette-gray)');
		document.documentElement.setAttribute('data-theme', 'dark');
		const after = resolveColor('var(--hz-palette-gray)');
		expect(after).not.toBe(before);
		expect(after).toBe('rgb(156, 163, 175)'); // #9ca3af
	});

	it('--hz-color-text-muted lightens in dark mode (AA on dark surfaces)', () => {
		const before = resolveColor('var(--hz-color-text-muted)');
		document.documentElement.setAttribute('data-theme', 'dark');
		const after = resolveColor('var(--hz-color-text-muted)');
		expect(after).not.toBe(before);
		expect(after).toBe('rgb(156, 163, 175)'); // #9ca3af
	});

	it('every --hz-intent-* retargets to its light companion in dark mode', () => {
		const before = Object.fromEntries(
			['neutral', 'primary', 'secondary', 'danger', 'warning', 'success', 'info'].map((name) => [
				name,
				resolveColor(`var(--hz-intent-${name})`)
			])
		);
		document.documentElement.setAttribute('data-theme', 'dark');
		for (const [name, light] of Object.entries(before)) {
			expect(resolveColor(`var(--hz-intent-${name})`)).not.toBe(light);
		}
	});

	it('dark status intents still chain through the (lightened) palette', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(resolveColor('var(--hz-intent-danger)')).toBe(resolveColor('var(--hz-palette-danger)'));
		expect(resolveColor('var(--hz-palette-danger)')).toBe('rgb(248, 113, 113)'); // #f87171
	});

	it('dark mode is authored at the palette layer — intents stay pure chains', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(resolveColor('var(--hz-intent-primary)')).toBe(
			resolveColor('var(--hz-palette-primary)')
		);
		expect(resolveColor('var(--hz-intent-primary)')).toBe('rgb(96, 165, 250)'); // #60a5fa
		expect(resolveColor('var(--hz-intent-neutral)')).toBe(resolveColor('var(--hz-palette-gray)'));
	});

	it('--hz-color-border chains through the lightened gray in dark mode', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(resolveColor('var(--hz-color-border)')).toBe(resolveColor('var(--hz-palette-gray)'));
	});

	it('data-theme="dark" strengthens --hz-color-surface-muted to a 25% gray mix over surface', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(resolveColor('var(--hz-color-surface-muted)')).toBe(
			resolveColor('color-mix(in srgb, var(--hz-palette-gray) 25%, var(--hz-color-surface))')
		);
	});

	it('--hz-color-black / --hz-color-white anchor roles do NOT flip under data-theme="dark"', () => {
		const lightBlack = resolveColor('var(--hz-color-black)');
		const lightWhite = resolveColor('var(--hz-color-white)');
		// In light mode the anchors sit opposite surface/text (white surface,
		// black text) — distinct from the anchor of the same name.
		expect(lightBlack).not.toBe(resolveColor('var(--hz-color-surface)'));
		expect(lightWhite).not.toBe(resolveColor('var(--hz-color-text)'));
		document.documentElement.setAttribute('data-theme', 'dark');
		// The anchors themselves are unchanged...
		expect(resolveColor('var(--hz-color-black)')).toBe(lightBlack);
		expect(resolveColor('var(--hz-color-white)')).toBe(lightWhite);
		// ...even though dark mode's flipped surface/text now happen to
		// COINCIDE with them by design (surface flips TO black, text TO white)
		// — that coincidence is the point of the anchors, not a contradiction.
		expect(resolveColor('var(--hz-color-surface)')).toBe(lightBlack);
		expect(resolveColor('var(--hz-color-text)')).toBe(lightWhite);
	});

	it('--hz-palette-black / --hz-palette-white are absolute — no dark companion at all', () => {
		const lightBlack = resolveColor('var(--hz-palette-black)');
		const lightWhite = resolveColor('var(--hz-palette-white)');
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(resolveColor('var(--hz-palette-black)')).toBe(lightBlack);
		expect(resolveColor('var(--hz-palette-white)')).toBe(lightWhite);
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
		const white = resolveColor('var(--hz-palette-white)');
		expect(surface).toBe(white);
	});
});
