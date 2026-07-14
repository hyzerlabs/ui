import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const children = createRawSnippet(() => ({
	render: () => `<span data-testid="badge-content">3 discs</span>`
}));

const base = { children };

function getBadge(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-badge') as HTMLElement;
}

// ---------------------------------------------------------------------------
// Badge-R1/R2 — Structure and data hooks
// ---------------------------------------------------------------------------

describe('Badge-R1/R2 — structure and data hooks', () => {
	it('renders an inline span with the content and no implicit role', () => {
		const { container } = render(Badge, base);
		const badge = getBadge(container);
		expect(badge.tagName.toLowerCase()).toBe('span');
		expect(badge.hasAttribute('role')).toBe(false);
		expect(badge.querySelector('[data-testid="badge-content"]')?.textContent).toBe('3 discs');
	});

	it('defaults: neutral / soft / md / full, no dismissible hook', () => {
		const { container } = render(Badge, base);
		const badge = getBadge(container);
		expect(badge.getAttribute('data-intent')).toBe('neutral');
		expect(badge.getAttribute('data-variant')).toBe('soft');
		expect(badge.getAttribute('data-size')).toBe('md');
		expect(badge.getAttribute('data-rounded')).toBe('full');
		expect(badge.hasAttribute('data-dismissible')).toBe(false);
	});

	it('every intent value reflects into data-intent', () => {
		for (const intent of [
			'neutral',
			'primary',
			'secondary',
			'danger',
			'warning',
			'success',
			'info'
		] as const) {
			const { container } = render(Badge, { ...base, intent });
			expect(getBadge(container).getAttribute('data-intent')).toBe(intent);
		}
	});

	it('variant, size, and rounded values reflect into their data attributes', () => {
		const { container } = render(Badge, {
			...base,
			variant: 'outline',
			size: 'sm',
			rounded: 'sm'
		});
		const badge = getBadge(container);
		expect(badge.getAttribute('data-variant')).toBe('outline');
		expect(badge.getAttribute('data-size')).toBe('sm');
		expect(badge.getAttribute('data-rounded')).toBe('sm');
	});

	it('rounded accepts the full token scale', () => {
		for (const rounded of ['none', 'sm', 'md', 'lg', 'full'] as const) {
			const { container } = render(Badge, { ...base, rounded });
			expect(getBadge(container).getAttribute('data-rounded')).toBe(rounded);
		}
	});
});

// ---------------------------------------------------------------------------
// Badge-R3 — Dismiss affordance
// ---------------------------------------------------------------------------

describe('Badge-R3 — dismiss', () => {
	it('no onDismiss: no button', () => {
		const { container } = render(Badge, base);
		expect(container.querySelector('.hz-badge-dismiss')).toBeNull();
	});

	it('onDismiss renders a labelled button and data-dismissible; click fires it', async () => {
		const onDismiss = vi.fn();
		const { container } = render(Badge, {
			...base,
			onDismiss,
			dismissLabel: 'Remove Destroyer'
		});
		expect(getBadge(container).hasAttribute('data-dismissible')).toBe(true);
		const btn = container.querySelector('.hz-badge-dismiss') as HTMLButtonElement;
		expect(btn.type).toBe('button');
		expect(btn.getAttribute('aria-label')).toBe('Remove Destroyer');
		btn.click();
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('dismissLabel defaults to "Remove"; the icon is decorative', () => {
		const { container } = render(Badge, { ...base, onDismiss: () => {} });
		const btn = container.querySelector('.hz-badge-dismiss') as HTMLButtonElement;
		expect(btn.getAttribute('aria-label')).toBe('Remove');
		expect(btn.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});
});

// ---------------------------------------------------------------------------
// Badge-R5 — class & rest
// ---------------------------------------------------------------------------

describe('Badge-R5 — class and rest forwarding', () => {
	it('class merges after hz-badge; rest forwards; managed data hooks win', () => {
		const { container } = render(Badge, {
			...base,
			class: 'tag',
			'data-testid': 'my-badge',
			'data-intent': 'clobbered'
		} as Record<string, unknown>);
		const badge = getBadge(container);
		expect(badge.classList.contains('hz-badge')).toBe(true);
		expect(badge.classList.contains('tag')).toBe(true);
		expect(badge.getAttribute('data-testid')).toBe('my-badge');
		expect(badge.getAttribute('data-intent')).toBe('neutral');
	});
});

// ---------------------------------------------------------------------------
// Badge-R6 — Barrel export
// ---------------------------------------------------------------------------

describe('Badge-R6 — barrel export', () => {
	it('Badge resolves from $lib and smoke-renders', async () => {
		const { Badge: B } = await import('$lib');
		expect(B).toBeDefined();
		const { container } = render(B, base);
		expect(container.querySelector('.hz-badge')).not.toBeNull();
	});
});
