import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Divider from './Divider.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const label = createRawSnippet(() => ({
	render: () => `<span>OR</span>`
}));

function getDivider(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-divider') as HTMLElement;
}

// ---------------------------------------------------------------------------
// Divider-R1 — Bare structure
// ---------------------------------------------------------------------------

describe('Divider-R1 — bare structure', () => {
	it('with no children, root is a native hr.hz-divider with no role and no data-labeled', () => {
		const { container } = render(Divider, {});
		const divider = getDivider(container);
		expect(divider.tagName.toLowerCase()).toBe('hr');
		expect(divider.hasAttribute('role')).toBe(false);
		expect(divider.hasAttribute('data-labeled')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Divider-R2 — Labeled structure
// ---------------------------------------------------------------------------

describe('Divider-R2 — labeled structure', () => {
	it('with children, root is a div with role=separator, aria-orientation, data-labeled, and one label', () => {
		const { container } = render(Divider, { children: label });
		const divider = getDivider(container);
		expect(divider.tagName.toLowerCase()).toBe('div');
		expect(divider.getAttribute('role')).toBe('separator');
		expect(divider.getAttribute('aria-orientation')).toBe('horizontal');
		expect(divider.hasAttribute('data-labeled')).toBe(true);
		const labels = divider.querySelectorAll('.hz-divider-label');
		expect(labels.length).toBe(1);
		expect(labels[0].textContent).toBe('OR');
	});
});

// ---------------------------------------------------------------------------
// Divider-R3 — Data hooks
// ---------------------------------------------------------------------------

describe('Divider-R3 — data hooks', () => {
	it('defaults reflect data-variant="solid", data-spacing="md", data-line-width="thin" on the bare form', () => {
		const { container } = render(Divider, {});
		const divider = getDivider(container);
		expect(divider.getAttribute('data-variant')).toBe('solid');
		expect(divider.getAttribute('data-spacing')).toBe('md');
		expect(divider.getAttribute('data-line-width')).toBe('thin');
	});

	it('defaults reflect data-variant="solid", data-spacing="md", data-line-width="thin" on the labeled form', () => {
		const { container } = render(Divider, { children: label });
		const divider = getDivider(container);
		expect(divider.getAttribute('data-variant')).toBe('solid');
		expect(divider.getAttribute('data-spacing')).toBe('md');
		expect(divider.getAttribute('data-line-width')).toBe('thin');
	});

	it('each variant reflects verbatim into data-variant', () => {
		for (const variant of ['solid', 'dashed', 'dotted'] as const) {
			const { container } = render(Divider, { variant });
			expect(getDivider(container).getAttribute('data-variant')).toBe(variant);
		}
	});

	it('each spacing reflects verbatim into data-spacing (full LayoutPadding scale incl. density)', () => {
		for (const spacing of ['none', 'sm', 'md', 'lg', 'near', 'away'] as const) {
			const { container } = render(Divider, { spacing });
			expect(getDivider(container).getAttribute('data-spacing')).toBe(spacing);
		}
	});

	it('each lineWidth reflects verbatim into data-line-width on both forms', () => {
		for (const lineWidth of ['thin', 'thick'] as const) {
			const bare = render(Divider, { lineWidth });
			expect(getDivider(bare.container).getAttribute('data-line-width')).toBe(lineWidth);

			const labeled = render(Divider, { lineWidth, children: label });
			expect(getDivider(labeled.container).getAttribute('data-line-width')).toBe(lineWidth);
		}
	});
});

// ---------------------------------------------------------------------------
// Divider-R4 — Orientation
// ---------------------------------------------------------------------------

describe('Divider-R4 — orientation', () => {
	it('bare hr relies on implicit horizontal orientation (no aria-orientation attribute)', () => {
		const { container } = render(Divider, {});
		expect(getDivider(container).hasAttribute('aria-orientation')).toBe(false);
	});

	it('labeled div sets aria-orientation="horizontal" explicitly', () => {
		const { container } = render(Divider, { children: label });
		expect(getDivider(container).getAttribute('aria-orientation')).toBe('horizontal');
	});
});

// ---------------------------------------------------------------------------
// Divider-R5 — class & rest
// ---------------------------------------------------------------------------

describe('Divider-R5 — class and rest forwarding', () => {
	it('bare form: class merges after hz-divider; rest forwards', () => {
		const { container } = render(Divider, {
			class: 'my-hr',
			'data-testid': 'my-divider'
		} as Record<string, unknown>);
		const divider = getDivider(container);
		expect(divider.classList.contains('hz-divider')).toBe(true);
		expect(divider.classList.contains('my-hr')).toBe(true);
		expect(divider.getAttribute('data-testid')).toBe('my-divider');
	});

	it('labeled form: class merges after hz-divider; rest forwards; managed role/class survive a clobber attempt', () => {
		const { container } = render(Divider, {
			children: label,
			class: 'my-separator',
			role: 'clobbered',
			'data-testid': 'my-divider'
		} as Record<string, unknown>);
		const divider = getDivider(container);
		expect(divider.classList.contains('hz-divider')).toBe(true);
		expect(divider.classList.contains('my-separator')).toBe(true);
		expect(divider.getAttribute('role')).toBe('separator');
		expect(divider.getAttribute('data-testid')).toBe('my-divider');
	});
});

// ---------------------------------------------------------------------------
// Divider-R6 — Barrel export
// ---------------------------------------------------------------------------

describe('Divider-R6 — barrel export', () => {
	it('Divider resolves from $lib and smoke-renders in both bare and labeled forms', async () => {
		const { Divider: D } = await import('$lib');
		expect(D).toBeDefined();
		const { container: bareContainer } = render(D, {});
		expect(bareContainer.querySelector('.hz-divider')).not.toBeNull();
		const { container: labeledContainer } = render(D, { children: label });
		expect(labeledContainer.querySelector('.hz-divider')).not.toBeNull();
	});
});
