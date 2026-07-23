import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Banner from './Banner.svelte';
// Banner-R9 recipe pin — the reference theme must be loaded so the computed
// fg/bg reflect the actual solid:intent-<name> pairing the AA gate grades.
import '../tokens/tokens.css';
import '../theme/components/banner.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const children = createRawSnippet(() => ({
	render: () => `<p data-testid="banner-content">Course closed for maintenance.</p>`
}));

const iconSnippet = createRawSnippet(() => ({
	render: () => `<svg data-testid="banner-icon"></svg>`
}));

const actionsSnippet = createRawSnippet(() => ({
	render: () => `<a href="#" data-testid="banner-action">Learn more</a>`
}));

const base = { children };

function getBanner(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-banner') as HTMLElement;
}

/** Resolve a CSS color expression via a throwaway probe, like tokens.svelte.spec.ts. */
function resolveColor(varExpression: string): string {
	const probe = document.createElement('div');
	probe.style.cssText = `color: ${varExpression}`;
	document.body.appendChild(probe);
	const resolved = getComputedStyle(probe).color;
	document.body.removeChild(probe);
	return resolved;
}

// ---------------------------------------------------------------------------
// Banner-R1 — Structure
// ---------------------------------------------------------------------------

describe('Banner-R1 — structure', () => {
	it('renders div.hz-banner with the content and default data-intent="neutral"', () => {
		const { container } = render(Banner, base);
		const banner = getBanner(container);
		expect(banner.tagName.toLowerCase()).toBe('div');
		expect(banner.getAttribute('data-intent')).toBe('neutral');
		expect(
			banner.querySelector('.hz-banner-content [data-testid="banner-content"]')?.textContent
		).toBe('Course closed for maintenance.');
	});

	it('icon renders in an aria-hidden wrapper preceding the content', () => {
		const { container } = render(Banner, { ...base, icon: iconSnippet });
		const wrapper = container.querySelector('.hz-banner-icon') as HTMLElement;
		expect(wrapper.getAttribute('aria-hidden')).toBe('true');
		expect(wrapper.querySelector('[data-testid="banner-icon"]')).not.toBeNull();
		const banner = getBanner(container);
		const kids = Array.from(banner.children);
		expect(kids.indexOf(wrapper)).toBeLessThan(
			kids.findIndex((el) => el.classList.contains('hz-banner-content'))
		);
	});

	it('no icon: no .hz-banner-icon wrapper renders', () => {
		const { container } = render(Banner, base);
		expect(container.querySelector('.hz-banner-icon')).toBeNull();
	});

	it('actions render in a wrapper following the content', () => {
		const { container } = render(Banner, { ...base, actions: actionsSnippet });
		const wrapper = container.querySelector('.hz-banner-actions') as HTMLElement;
		expect(wrapper.querySelector('[data-testid="banner-action"]')).not.toBeNull();
		const banner = getBanner(container);
		const kids = Array.from(banner.children);
		expect(kids.indexOf(wrapper)).toBeGreaterThan(
			kids.findIndex((el) => el.classList.contains('hz-banner-content'))
		);
	});

	it('no actions: no .hz-banner-actions wrapper renders', () => {
		const { container } = render(Banner, base);
		expect(container.querySelector('.hz-banner-actions')).toBeNull();
	});

	it('onDismiss renders a trailing .hz-banner-dismiss button with the aria-label', () => {
		const { container } = render(Banner, { ...base, onDismiss: () => {} });
		const btn = container.querySelector('.hz-banner-dismiss') as HTMLButtonElement;
		expect(btn).not.toBeNull();
		expect(btn.type).toBe('button');
		expect(btn.getAttribute('aria-label')).toBe('Dismiss');
		const banner = getBanner(container);
		expect(Array.from(banner.children).at(-1)).toBe(btn);
	});
});

// ---------------------------------------------------------------------------
// Banner-R2/R3 — Data hooks + pinning
// ---------------------------------------------------------------------------

describe('Banner-R2/R3 — data hooks and pinning', () => {
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
			const { container } = render(Banner, { ...base, intent });
			expect(getBanner(container).getAttribute('data-intent')).toBe(intent);
		}
	});

	it('no pin: no data-pin attribute (static, full-width form)', () => {
		const { container } = render(Banner, base);
		expect(getBanner(container).hasAttribute('data-pin')).toBe(false);
	});

	it("pin='top'/'bottom' reflect into data-pin", () => {
		const { container: top } = render(Banner, { ...base, pin: 'top' });
		expect(getBanner(top).getAttribute('data-pin')).toBe('top');

		const { container: bottom } = render(Banner, { ...base, pin: 'bottom' });
		expect(getBanner(bottom).getAttribute('data-pin')).toBe('bottom');
	});

	it('a pinned banner computes position: sticky', () => {
		const { container } = render(Banner, { ...base, pin: 'top' });
		expect(getComputedStyle(getBanner(container)).position).toBe('sticky');
	});

	it('no onDismiss: no data-dismissible', () => {
		const { container } = render(Banner, base);
		expect(getBanner(container).hasAttribute('data-dismissible')).toBe(false);
	});

	it('onDismiss set: data-dismissible present (empty)', () => {
		const { container } = render(Banner, { ...base, onDismiss: () => {} });
		expect(getBanner(container).getAttribute('data-dismissible')).toBe('');
	});
});

// ---------------------------------------------------------------------------
// Banner-R4 — Announcement is opt-in
// ---------------------------------------------------------------------------

describe('Banner-R4 — announcement', () => {
	it('no default role or live-region attributes', () => {
		const { container } = render(Banner, base);
		const banner = getBanner(container);
		expect(banner.hasAttribute('role')).toBe(false);
		expect(banner.hasAttribute('aria-live')).toBe(false);
	});

	it('role passes through rest untouched', () => {
		const { container } = render(Banner, { ...base, role: 'status' } as Record<string, unknown>);
		expect(getBanner(container).getAttribute('role')).toBe('status');
	});
});

// ---------------------------------------------------------------------------
// Banner-R5 — Dismiss
// ---------------------------------------------------------------------------

describe('Banner-R5 — dismiss', () => {
	it('no onDismiss: no button, no data-dismissible', () => {
		const { container } = render(Banner, base);
		expect(container.querySelector('.hz-banner-dismiss')).toBeNull();
		expect(getBanner(container).hasAttribute('data-dismissible')).toBe(false);
	});

	it('onDismiss renders a labelled button; click fires it once per activation; icon decorative', () => {
		const onDismiss = vi.fn();
		const { container } = render(Banner, { ...base, onDismiss });
		const btn = container.querySelector('.hz-banner-dismiss') as HTMLButtonElement;
		expect(btn.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
		btn.click();
		expect(onDismiss).toHaveBeenCalledOnce();
		btn.click();
		expect(onDismiss).toHaveBeenCalledTimes(2);
	});

	it('dismissLabel overrides the button name', () => {
		const { container } = render(Banner, {
			...base,
			onDismiss: () => {},
			dismissLabel: 'Dismiss maintenance notice'
		});
		expect(
			(container.querySelector('.hz-banner-dismiss') as HTMLElement).getAttribute('aria-label')
		).toBe('Dismiss maintenance notice');
	});
});

// ---------------------------------------------------------------------------
// Banner-R6 — Polymorphic root
// ---------------------------------------------------------------------------

describe('Banner-R6 — polymorphic root', () => {
	it('as=\'aside\' renders an <aside class="hz-banner">', () => {
		const { container } = render(Banner, { ...base, as: 'aside' });
		const banner = getBanner(container);
		expect(banner.tagName.toLowerCase()).toBe('aside');
		expect(banner.classList.contains('hz-banner')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Banner-R7 — class & rest
// ---------------------------------------------------------------------------

describe('Banner-R7 — class and rest forwarding', () => {
	it('class merges after hz-banner; rest forwards; managed hooks win', () => {
		const { container } = render(Banner, {
			...base,
			class: 'promo',
			'data-testid': 'my-banner',
			'data-intent': 'clobbered',
			'data-pin': 'clobbered'
		} as Record<string, unknown>);
		const banner = getBanner(container);
		expect(banner.classList.contains('hz-banner')).toBe(true);
		expect(banner.classList.contains('promo')).toBe(true);
		expect(banner.getAttribute('data-testid')).toBe('my-banner');
		expect(banner.getAttribute('data-intent')).toBe('neutral');
		expect(banner.hasAttribute('data-pin')).toBe(false);
	});

	it('tabindex passes through rest', () => {
		const { container } = render(Banner, { ...base, tabindex: -1 } as Record<string, unknown>);
		expect(getBanner(container).getAttribute('tabindex')).toBe('-1');
	});
});

// ---------------------------------------------------------------------------
// Banner-R9 — Solid intent paint recipe pin (required)
// ---------------------------------------------------------------------------

describe('Banner-R9 — solid recipe pin', () => {
	it('--hz-banner-fg resolves to the surface token; --hz-banner-bg resolves to the active intent token', () => {
		const { container } = render(Banner, { ...base, intent: 'danger' });
		const style = getComputedStyle(getBanner(container));
		expect(style.color).toBe(resolveColor('var(--hz-color-surface)'));
		expect(style.backgroundColor).toBe(resolveColor('var(--hz-intent-danger)'));
	});

	it('the neutral default follows the same recipe', () => {
		const { container } = render(Banner, base);
		const style = getComputedStyle(getBanner(container));
		expect(style.color).toBe(resolveColor('var(--hz-color-surface)'));
		expect(style.backgroundColor).toBe(resolveColor('var(--hz-intent-neutral)'));
	});
});

// ---------------------------------------------------------------------------
// Banner-R10 — Barrel export
// ---------------------------------------------------------------------------

describe('Banner-R10 — barrel export', () => {
	it('Banner resolves from $lib and smoke-renders', async () => {
		const { Banner: B } = await import('$lib');
		expect(B).toBeDefined();
		const { container } = render(B, base);
		expect(container.querySelector('.hz-banner')).not.toBeNull();
	});
});
