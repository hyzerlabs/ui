import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Alert from './Alert.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const children = createRawSnippet(() => ({
	render: () => `<p data-testid="alert-content">Course 18 is flooded.</p>`
}));

const titleSnippet = createRawSnippet(() => ({
	render: () => `<em>Heads up</em>`
}));

const iconSnippet = createRawSnippet(() => ({
	render: () => `<svg data-testid="alert-icon"></svg>`
}));

const base = { children };

function getAlert(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-alert') as HTMLElement;
}

// ---------------------------------------------------------------------------
// Alert-R1 — Structure
// ---------------------------------------------------------------------------

describe('Alert-R1 — structure', () => {
	it('renders div.hz-alert with the content and default data-intent="neutral"', () => {
		const { container } = render(Alert, base);
		const alert = getAlert(container);
		expect(alert.tagName.toLowerCase()).toBe('div');
		expect(alert.getAttribute('data-intent')).toBe('neutral');
		expect(
			alert.querySelector('.hz-alert-content [data-testid="alert-content"]')?.textContent
		).toBe('Course 18 is flooded.');
	});

	it('rounded defaults to md and accepts the shared token scale', () => {
		const { container } = render(Alert, base);
		expect(getAlert(container).getAttribute('data-rounded')).toBe('md');
		for (const rounded of ['none', 'sm', 'md', 'lg', 'full'] as const) {
			const { container: c } = render(Alert, { ...base, rounded });
			expect(getAlert(c).getAttribute('data-rounded')).toBe(rounded);
		}
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
			const { container } = render(Alert, { ...base, intent });
			expect(getAlert(container).getAttribute('data-intent')).toBe(intent);
		}
	});

	it('string title renders a default h3 with id wired to aria-labelledby', () => {
		const { container } = render(Alert, { ...base, title: 'Weather delay' });
		const heading = container.querySelector('.hz-alert-title') as HTMLElement;
		// h3, not h2: an alert is a callout inside a section, not a section.
		expect(heading.tagName.toLowerCase()).toBe('h3');
		expect(heading.textContent?.trim()).toBe('Weather delay');
		expect(heading.id).toMatch(/^hz-alert-title-/);
		expect(getAlert(container).getAttribute('aria-labelledby')).toBe(heading.id);
	});

	it('headingLevel changes the heading tag', () => {
		const { container } = render(Alert, { ...base, title: 'X', headingLevel: 4 });
		expect((container.querySelector('.hz-alert-title') as HTMLElement).tagName.toLowerCase()).toBe(
			'h4'
		);
	});

	it('snippet title renders inside the heading', () => {
		const { container } = render(Alert, { ...base, title: titleSnippet });
		expect(container.querySelector('.hz-alert-title em')?.textContent).toBe('Heads up');
	});

	it('no title: no heading, no managed aria-labelledby', () => {
		const { container } = render(Alert, base);
		expect(container.querySelector('.hz-alert-title')).toBeNull();
		expect(getAlert(container).hasAttribute('aria-labelledby')).toBe(false);
	});

	it('no title: a consumer aria-labelledby passes through rest', () => {
		const { container } = render(Alert, {
			...base,
			'aria-labelledby': 'external-heading'
		} as Record<string, unknown>);
		expect(getAlert(container).getAttribute('aria-labelledby')).toBe('external-heading');
	});

	it('icon renders in an aria-hidden wrapper', () => {
		const { container } = render(Alert, { ...base, icon: iconSnippet });
		const wrapper = container.querySelector('.hz-alert-icon') as HTMLElement;
		expect(wrapper.getAttribute('aria-hidden')).toBe('true');
		expect(wrapper.querySelector('[data-testid="alert-icon"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Alert-R2 — Announcement is opt-in
// ---------------------------------------------------------------------------

describe('Alert-R2 — announcement', () => {
	it('no default role or live-region attributes', () => {
		const { container } = render(Alert, base);
		const alert = getAlert(container);
		expect(alert.hasAttribute('role')).toBe(false);
		expect(alert.hasAttribute('aria-live')).toBe(false);
	});

	it('role passes through rest untouched', () => {
		const { container } = render(Alert, { ...base, role: 'status' } as Record<string, unknown>);
		expect(getAlert(container).getAttribute('role')).toBe('status');
	});
});

// ---------------------------------------------------------------------------
// Alert-R3 — Dismiss
// ---------------------------------------------------------------------------

describe('Alert-R3 — dismiss', () => {
	it('no onDismiss: no button, no data-dismissible', () => {
		const { container } = render(Alert, base);
		expect(container.querySelector('.hz-alert-dismiss')).toBeNull();
		expect(getAlert(container).hasAttribute('data-dismissible')).toBe(false);
	});

	it('onDismiss renders a labeled button; click fires it; icon decorative', () => {
		const onDismiss = vi.fn();
		const { container } = render(Alert, { ...base, onDismiss });
		expect(getAlert(container).hasAttribute('data-dismissible')).toBe(true);
		const btn = container.querySelector('.hz-alert-dismiss') as HTMLButtonElement;
		expect(btn.type).toBe('button');
		expect(btn.getAttribute('aria-label')).toBe('Dismiss');
		expect(btn.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
		btn.click();
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('dismissLabel overrides the button name', () => {
		const { container } = render(Alert, {
			...base,
			onDismiss: () => {},
			dismissLabel: 'Hide weather notice'
		});
		expect(
			(container.querySelector('.hz-alert-dismiss') as HTMLElement).getAttribute('aria-label')
		).toBe('Hide weather notice');
	});
});

// ---------------------------------------------------------------------------
// Alert-R4 — class & rest
// ---------------------------------------------------------------------------

describe('Alert-R4 — class and rest forwarding', () => {
	it('class merges after hz-alert; rest forwards; managed hooks win', () => {
		const { container } = render(Alert, {
			...base,
			class: 'banner',
			'data-testid': 'my-alert',
			'data-intent': 'clobbered'
		} as Record<string, unknown>);
		const alert = getAlert(container);
		expect(alert.classList.contains('hz-alert')).toBe(true);
		expect(alert.classList.contains('banner')).toBe(true);
		expect(alert.getAttribute('data-testid')).toBe('my-alert');
		expect(alert.getAttribute('data-intent')).toBe('neutral');
	});

	it('tabindex passes through rest (the Form summary contract)', () => {
		const { container } = render(Alert, { ...base, tabindex: -1 } as Record<string, unknown>);
		expect(getAlert(container).getAttribute('tabindex')).toBe('-1');
	});
});

// ---------------------------------------------------------------------------
// Alert-R6 — Barrel export
// ---------------------------------------------------------------------------

describe('Alert-R6 — barrel export', () => {
	it('Alert resolves from $lib and smoke-renders', async () => {
		const { Alert: A } = await import('$lib');
		expect(A).toBeDefined();
		const { container } = render(A, base);
		expect(container.querySelector('.hz-alert')).not.toBeNull();
	});
});
