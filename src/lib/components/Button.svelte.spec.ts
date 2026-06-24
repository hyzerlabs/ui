import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const childrenSnippet = createRawSnippet(() => ({
	render: () => `<span>Click me</span>`
}));

const iconStartSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="icon-start">S</span>`
}));

const iconEndSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="icon-end">E</span>`
}));

// ---------------------------------------------------------------------------
// R1 — Default render
// ---------------------------------------------------------------------------

describe('R1 — default render', () => {
	it('renders a native <button> element', async () => {
		render(Button);
		const btn = page.getByRole('button');
		await expect.element(btn).toBeInTheDocument();
		expect(btn.element().tagName).toBe('BUTTON');
	});

	it('has class="hz-button", type="button", and correct default data attributes', async () => {
		render(Button);
		const btn = page.getByRole('button');
		await expect.element(btn).toHaveAttribute('class', 'hz-button');
		await expect.element(btn).toHaveAttribute('type', 'button');
		await expect.element(btn).toHaveAttribute('data-variant', 'solid');
		await expect.element(btn).toHaveAttribute('data-intent', 'primary');
		await expect.element(btn).toHaveAttribute('data-size', 'md');
	});

	it('data-state and data-full-width are absent by default', async () => {
		render(Button);
		const btn = page.getByRole('button');
		await expect.element(btn).not.toHaveAttribute('data-state');
		await expect.element(btn).not.toHaveAttribute('data-full-width');
	});
});

// ---------------------------------------------------------------------------
// R2 — Children snippet
// ---------------------------------------------------------------------------

describe('R2 — children snippet', () => {
	it('renders the children snippet as the button label', async () => {
		render(Button, { children: childrenSnippet });
		await expect.element(page.getByRole('button')).toHaveTextContent('Click me');
	});
});

// ---------------------------------------------------------------------------
// R3 — Variant
// ---------------------------------------------------------------------------

describe('R3 — variant prop', () => {
	const variants = ['solid', 'outline', 'ghost', 'link'] as const;

	for (const variant of variants) {
		it(`variant="${variant}" is reflected in data-variant`, async () => {
			render(Button, { variant });
			await expect.element(page.getByRole('button')).toHaveAttribute('data-variant', variant);
		});
	}
});

// ---------------------------------------------------------------------------
// R4 — Intent
// ---------------------------------------------------------------------------

describe('R4 — intent prop', () => {
	const intents = ['primary', 'secondary', 'danger'] as const;

	for (const intent of intents) {
		it(`intent="${intent}" is reflected in data-intent`, async () => {
			render(Button, { intent });
			await expect.element(page.getByRole('button')).toHaveAttribute('data-intent', intent);
		});
	}
});

// ---------------------------------------------------------------------------
// R5 — Size
// ---------------------------------------------------------------------------

describe('R5 — size prop', () => {
	const sizes = ['sm', 'md', 'lg'] as const;

	for (const size of sizes) {
		it(`size="${size}" is reflected in data-size`, async () => {
			render(Button, { size });
			await expect.element(page.getByRole('button')).toHaveAttribute('data-size', size);
		});
	}
});

// ---------------------------------------------------------------------------
// R6 — type prop
// ---------------------------------------------------------------------------

describe('R6 — type prop', () => {
	it('type="submit" sets the native type attribute', async () => {
		render(Button, { type: 'submit' });
		await expect.element(page.getByRole('button')).toHaveAttribute('type', 'submit');
	});

	it('type="reset" sets the native type attribute', async () => {
		render(Button, { type: 'reset' });
		await expect.element(page.getByRole('button')).toHaveAttribute('type', 'reset');
	});
});

// ---------------------------------------------------------------------------
// R7 — fullWidth
// ---------------------------------------------------------------------------

describe('R7 — fullWidth prop', () => {
	it('data-full-width is present when fullWidth=true', async () => {
		render(Button, { fullWidth: true });
		const btn = page.getByRole('button');
		await expect.element(btn).toBeInTheDocument();
		expect(btn.element().hasAttribute('data-full-width')).toBe(true);
	});

	it('data-full-width is absent when fullWidth=false (default)', async () => {
		render(Button);
		await expect.element(page.getByRole('button')).not.toHaveAttribute('data-full-width');
	});
});

// ---------------------------------------------------------------------------
// R8 — Anchor rendering
// ---------------------------------------------------------------------------

describe('R8 — anchor rendering', () => {
	it('renders an <a> element when href is a non-empty string', async () => {
		render(Button, { href: '/x', children: childrenSnippet });
		const el = page.getByRole('button');
		await expect.element(el).toBeInTheDocument();
		expect(el.element().tagName).toBe('A');
	});

	it('the anchor has role="button" and the correct href', async () => {
		render(Button, { href: '/x', children: childrenSnippet });
		const el = page.getByRole('button');
		await expect.element(el).toHaveAttribute('role', 'button');
		await expect.element(el).toHaveAttribute('href', '/x');
	});

	it('data attributes are present on the anchor', async () => {
		render(Button, { href: '/x', variant: 'outline', intent: 'danger', size: 'lg' });
		const el = page.getByRole('button');
		await expect.element(el).toHaveAttribute('data-variant', 'outline');
		await expect.element(el).toHaveAttribute('data-intent', 'danger');
		await expect.element(el).toHaveAttribute('data-size', 'lg');
	});

	it('renders a <button> when href is an empty string', async () => {
		render(Button, { href: '' });
		const btn = page.getByRole('button');
		await expect.element(btn).toBeInTheDocument();
		expect(btn.element().tagName).toBe('BUTTON');
	});
});

// ---------------------------------------------------------------------------
// R9 — Disabled state
// ---------------------------------------------------------------------------

describe('R9 — disabled state', () => {
	it('sets aria-disabled="true" and data-state="disabled"', async () => {
		render(Button, { disabled: true });
		const btn = page.getByRole('button');
		await expect.element(btn).toHaveAttribute('aria-disabled', 'true');
		await expect.element(btn).toHaveAttribute('data-state', 'disabled');
	});

	it('does NOT set the native disabled attribute', async () => {
		render(Button, { disabled: true });
		await expect.element(page.getByRole('button')).not.toHaveAttribute('disabled');
	});

	it('does not invoke onclick when clicked while disabled', async () => {
		const handler = vi.fn();
		render(Button, { disabled: true, onclick: handler });
		// force:true bypasses Playwright's "enabled" check so we can test our handler logic
		await page.getByRole('button').click({ force: true });
		expect(handler).not.toHaveBeenCalled();
	});

	it('anchor: omits href when disabled', async () => {
		render(Button, { href: '/x', disabled: true, children: childrenSnippet });
		const el = page.getByRole('button');
		await expect.element(el).toBeInTheDocument();
		expect(el.element().hasAttribute('href')).toBe(false);
	});

	it('anchor: still renders as <a> when disabled', async () => {
		render(Button, { href: '/x', disabled: true, children: childrenSnippet });
		const el = page.getByRole('button');
		await expect.element(el).toBeInTheDocument();
		expect(el.element().tagName).toBe('A');
	});
});

// ---------------------------------------------------------------------------
// R10 — Loading state
// ---------------------------------------------------------------------------

describe('R10 — loading state', () => {
	it('sets aria-busy="true" and data-state="loading"', async () => {
		render(Button, { loading: true });
		const btn = page.getByRole('button');
		await expect.element(btn).toHaveAttribute('aria-busy', 'true');
		await expect.element(btn).toHaveAttribute('data-state', 'loading');
	});

	it('renders the IconLoader SVG with aria-hidden="true"', () => {
		const { container } = render(Button, { loading: true });
		const svg = container.querySelector('svg[aria-hidden="true"]');
		expect(svg).not.toBeNull();
	});

	it('renders the sr-only loading label (default "Loading")', () => {
		const { container } = render(Button, { loading: true });
		const srSpan = container.querySelector('.sr-only');
		expect(srSpan).not.toBeNull();
		expect(srSpan?.textContent).toBe('Loading');
	});

	it('reflects a custom loadingLabel in the sr-only span', () => {
		const { container } = render(Button, { loading: true, loadingLabel: 'Saving…' });
		const srSpan = container.querySelector('.sr-only');
		expect(srSpan?.textContent).toBe('Saving…');
	});

	it('does not invoke onclick when clicked while loading', async () => {
		const handler = vi.fn();
		render(Button, { loading: true, onclick: handler });
		await page.getByRole('button').click({ force: true });
		expect(handler).not.toHaveBeenCalled();
	});

	it('anchor: omits href when loading', async () => {
		render(Button, { href: '/x', loading: true });
		const el = page.getByRole('button');
		await expect.element(el).toBeInTheDocument();
		expect(el.element().hasAttribute('href')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R11 — State precedence (disabled + loading)
// ---------------------------------------------------------------------------

describe('R11 — state precedence when both disabled and loading', () => {
	it('data-state="disabled" wins over loading', async () => {
		render(Button, { disabled: true, loading: true });
		await expect.element(page.getByRole('button')).toHaveAttribute('data-state', 'disabled');
	});

	it('both aria-disabled and aria-busy are present', async () => {
		render(Button, { disabled: true, loading: true });
		const btn = page.getByRole('button');
		await expect.element(btn).toHaveAttribute('aria-disabled', 'true');
		await expect.element(btn).toHaveAttribute('aria-busy', 'true');
	});

	it('activation is blocked when both disabled and loading', async () => {
		const handler = vi.fn();
		render(Button, { disabled: true, loading: true, onclick: handler });
		await page.getByRole('button').click({ force: true });
		expect(handler).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// R12 — Icon snippets
// ---------------------------------------------------------------------------

describe('R12 — iconStart / iconEnd snippets', () => {
	it('iconStart renders before the label', async () => {
		render(Button, { children: childrenSnippet, iconStart: iconStartSnippet });
		const btn = page.getByRole('button');
		await expect.element(btn).toBeInTheDocument();
		const html = btn.element().innerHTML;
		expect(html.indexOf('icon-start')).toBeLessThan(html.indexOf('Click me'));
	});

	it('iconEnd renders after the label', async () => {
		render(Button, { children: childrenSnippet, iconEnd: iconEndSnippet });
		const btn = page.getByRole('button');
		await expect.element(btn).toBeInTheDocument();
		const html = btn.element().innerHTML;
		expect(html.indexOf('Click me')).toBeLessThan(html.indexOf('icon-end'));
	});

	it('iconStart and iconEnd both render in correct DOM order', async () => {
		render(Button, {
			children: childrenSnippet,
			iconStart: iconStartSnippet,
			iconEnd: iconEndSnippet
		});
		const btn = page.getByRole('button');
		await expect.element(btn).toBeInTheDocument();
		const html = btn.element().innerHTML;
		expect(html.indexOf('icon-start')).toBeLessThan(html.indexOf('Click me'));
		expect(html.indexOf('Click me')).toBeLessThan(html.indexOf('icon-end'));
	});
});

// ---------------------------------------------------------------------------
// R13 — ariaLabel
// ---------------------------------------------------------------------------

describe('R13 — ariaLabel prop', () => {
	it('sets aria-label on the root element', async () => {
		render(Button, { ariaLabel: 'Save document' });
		await expect.element(page.getByRole('button')).toHaveAttribute('aria-label', 'Save document');
	});
});

// ---------------------------------------------------------------------------
// R14 — Icon-only dev warning
// ---------------------------------------------------------------------------

describe('R14 — icon-only dev warning', () => {
	it('warns when icon-only and ariaLabel is absent', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		render(Button, { iconStart: iconStartSnippet });

		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('ariaLabel');

		warnSpy.mockRestore();
	});

	it('does not warn when ariaLabel is provided', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		render(Button, { iconStart: iconStartSnippet, ariaLabel: 'Add item' });

		expect(warnSpy).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});

	it('does not warn when there are no icons and no children (empty button)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		render(Button);

		expect(warnSpy).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R15 — onclick + attribute forwarding
// ---------------------------------------------------------------------------

describe('R15 — onclick and rest attribute forwarding', () => {
	it('invokes onclick on a normal click', async () => {
		const handler = vi.fn();
		render(Button, { onclick: handler, children: childrenSnippet });
		await page.getByRole('button').click();
		expect(handler).toHaveBeenCalledOnce();
	});

	it('forwards extra attributes (e.g. data-testid) to the root element', async () => {
		render(Button, { 'data-testid': 'my-button' } as Record<string, unknown>);
		await expect.element(page.getByRole('button')).toHaveAttribute('data-testid', 'my-button');
	});

	it('rest attributes do not overwrite managed data-variant', async () => {
		// Attempt to overwrite via rest; the component-managed value must win
		render(Button, { 'data-variant': 'ghost-override' } as Record<string, unknown>);
		await expect.element(page.getByRole('button')).toHaveAttribute('data-variant', 'solid');
	});
});

// ---------------------------------------------------------------------------
// R16 — Barrel export
// ---------------------------------------------------------------------------

describe('R16 — barrel export', () => {
	it('Button is resolvable from $lib', async () => {
		const { Button } = await import('$lib');
		expect(Button).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Form integration
// ---------------------------------------------------------------------------

describe('Form integration', () => {
	it('type="submit" button triggers form submission', async () => {
		const submitSpy = vi.fn();
		const { container } = render(Button, { type: 'submit', children: childrenSnippet });

		const form = document.createElement('form');
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			submitSpy();
		});
		form.appendChild(container);
		document.body.appendChild(form);

		await page.getByRole('button').click();

		expect(submitSpy).toHaveBeenCalledOnce();
		document.body.removeChild(form);
	});

	it('disabled type="submit" button does not submit the form', async () => {
		const submitSpy = vi.fn();
		const { container } = render(Button, {
			type: 'submit',
			disabled: true,
			children: childrenSnippet
		});

		const form = document.createElement('form');
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			submitSpy();
		});
		form.appendChild(container);
		document.body.appendChild(form);

		// force:true bypasses Playwright's "enabled" check — our handler must call preventDefault
		await page.getByRole('button').click({ force: true });

		expect(submitSpy).not.toHaveBeenCalled();
		document.body.removeChild(form);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('href="" (empty string) renders a <button>, not an <a>', async () => {
		render(Button, { href: '' });
		const btn = page.getByRole('button');
		await expect.element(btn).toBeInTheDocument();
		expect(btn.element().tagName).toBe('BUTTON');
	});

	it('anchor + disabled: <a> carries aria-disabled and no href', async () => {
		render(Button, { href: '/go', disabled: true, children: childrenSnippet });
		const el = page.getByRole('button');
		await expect.element(el).toHaveAttribute('aria-disabled', 'true');
		await expect.element(el).toHaveAttribute('data-state', 'disabled');
		expect(el.element().hasAttribute('href')).toBe(false);
	});

	it('anchor + loading: <a> carries aria-busy, data-state="loading", and no href', async () => {
		render(Button, { href: '/go', loading: true, children: childrenSnippet });
		const el = page.getByRole('button');
		await expect.element(el).toHaveAttribute('aria-busy', 'true');
		await expect.element(el).toHaveAttribute('data-state', 'loading');
		expect(el.element().hasAttribute('href')).toBe(false);
	});

	it('type prop is ignored on the anchor form (no type attribute on <a>)', async () => {
		render(Button, { href: '/x', type: 'submit', children: childrenSnippet });
		const el = page.getByRole('button');
		await expect.element(el).toBeInTheDocument();
		expect(el.element().tagName).toBe('A');
		await expect.element(el).not.toHaveAttribute('type');
	});
});
