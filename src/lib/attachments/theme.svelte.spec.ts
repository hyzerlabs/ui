import { describe, it, expect, vi } from 'vitest';
import { theme } from './theme.js';
import { themeVars } from '../config/generate.js';

/** Attach to a fresh element and hand back the node plus its cleanup. */
function attach(source: Parameters<typeof theme>[0], initial?: string) {
	const node = document.createElement('section');
	if (initial !== undefined) node.setAttribute('data-theme', initial);
	document.body.appendChild(node);
	const cleanup = theme(source)(node);
	return { node, cleanup };
}

describe('theme() — named form', () => {
	it('sets data-theme to the named theme', () => {
		const { node } = attach('dark');
		expect(node.getAttribute('data-theme')).toBe('dark');
	});

	it('removes the attribute on teardown when the element had none', () => {
		const { node, cleanup } = attach('dark');
		cleanup();
		expect(node.hasAttribute('data-theme')).toBe(false);
	});

	it('restores a prior data-theme on teardown rather than clearing it', () => {
		const { node, cleanup } = attach('ocean', 'dark');
		expect(node.getAttribute('data-theme')).toBe('ocean');
		cleanup();
		expect(node.getAttribute('data-theme')).toBe('dark');
	});
});

describe('theme() — inline form', () => {
	it('writes the resolved custom properties onto the element', async () => {
		const { node } = attach({ palette: { primary: '#0f766e' } });
		await vi.waitFor(() => {
			expect(node.style.getPropertyValue('--hz-palette-primary')).toBe('#0f766e');
		});
	});

	it('writes the derived chain too — a palette override alone leaves intents behind', async () => {
		const { node } = attach({ palette: { primary: '#0f766e' } });
		await vi.waitFor(() => {
			// The whole point: --hz-intent-primary is declared at :root, where it
			// already resolved to the base blue. Without a local declaration the
			// section would show a teal surface and base-blue buttons.
			expect(node.style.getPropertyValue('--hz-intent-primary')).toBe('var(--hz-palette-primary)');
		});
	});

	it('removes exactly what it set on teardown', async () => {
		const { node, cleanup } = attach({ palette: { primary: '#0f766e' } });
		await vi.waitFor(() => {
			expect(node.style.getPropertyValue('--hz-palette-primary')).toBe('#0f766e');
		});
		cleanup();
		expect(node.getAttribute('style')).toBeFalsy();
	});

	it('applies nothing when torn down before the resolver lands', async () => {
		const { node, cleanup } = attach({ palette: { primary: '#0f766e' } });
		cleanup();
		await new Promise((r) => setTimeout(r, 20));
		expect(node.getAttribute('style')).toBeFalsy();
	});
});

describe('themeVars', () => {
	it('returns the theme’s own declarations plus the derived chain', () => {
		const vars = themeVars({ palette: { primary: '#0f766e' } });
		expect(vars['--hz-palette-primary']).toBe('#0f766e');
		expect(vars['--hz-intent-primary']).toBe('var(--hz-palette-primary)');
	});

	it('throws on an override referencing an undefined token', () => {
		expect(() => themeVars({ color: { surface: 'var(--hz-palette-nope)' } })).toThrow();
	});
});
