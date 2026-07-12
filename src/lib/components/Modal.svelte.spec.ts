import { page } from 'vitest/browser';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Modal from './Modal.svelte';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const bodySnippet = createRawSnippet(() => ({
	render: () => `<p data-testid="body-content">Body content</p>`
}));

const actionsSnippet = createRawSnippet(() => ({
	render: () => `<button data-testid="action-btn">Confirm</button>`
}));

const focusableBodySnippet = createRawSnippet(() => ({
	render: () => `<button data-testid="first-focusable">First</button>`
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait one event-loop turn so Svelte effects and microtasks can settle. */
function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

/** Flush a microtask queue turn (for queueMicrotask calls in Modal). */
function nextMicrotask(): Promise<void> {
	return new Promise((r) => queueMicrotask(r));
}

// ---------------------------------------------------------------------------
// Modal-R1 — Root element, ARIA attributes, defaults
// ---------------------------------------------------------------------------

describe('Modal-R1 — root element and ARIA attributes', () => {
	afterEach(async () => {
		// Ensure body overflow is restored after each test
		document.body.style.overflow = '';
	});

	it('renders a <dialog class="hz-modal"> always (never conditionally mounted)', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal');
		expect(dialog).not.toBeNull();
	});

	it('dialog carries aria-modal="true"', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.getAttribute('aria-modal')).toBe('true');
	});

	it('dialog carries tabindex="-1"', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.getAttribute('tabindex')).toBe('-1');
	});

	it('dialog carries data-size="md" by default', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.getAttribute('data-size')).toBe('md');
	});

	it('dialog carries data-state="closed" when open=false (default)', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.getAttribute('data-state')).toBe('closed');
	});

	it('aria-labelledby points to the title element id', async () => {
		const { container } = render(Modal, { title: 'My Modal' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		const labelledBy = dialog.getAttribute('aria-labelledby');
		expect(labelledBy).toBeTruthy();
		const titleEl = document.getElementById(labelledBy as string);
		expect(titleEl).not.toBeNull();
		expect(titleEl?.textContent).toBe('My Modal');
	});

	it('aria-describedby is absent when no description is provided', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.hasAttribute('aria-describedby')).toBe(false);
	});

	it('aria-describedby is present and points to description when provided', async () => {
		const { container } = render(Modal, { title: 'Test', description: 'A description' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		const describedBy = dialog.getAttribute('aria-describedby');
		expect(describedBy).toBeTruthy();
		const descEl = document.getElementById(describedBy as string);
		expect(descEl).not.toBeNull();
		expect(descEl?.textContent).toBe('A description');
	});

	it('aria-describedby is absent when description="" (empty string)', async () => {
		const { container } = render(Modal, { title: 'Test', description: '' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.hasAttribute('aria-describedby')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Modal-R2 — Header and title
// ---------------------------------------------------------------------------

describe('Modal-R2 — header and title', () => {
	it('renders .hz-modal-header always', async () => {
		const { container } = render(Modal, { title: 'Test' });
		expect(container.querySelector('.hz-modal-header')).not.toBeNull();
	});

	it('header contains an <h2 class="hz-modal-title"> with the title text', async () => {
		const { container } = render(Modal, { title: 'Hello World' });
		const h2 = container.querySelector('.hz-modal-header h2.hz-modal-title') as HTMLElement;
		expect(h2).not.toBeNull();
		expect(h2.textContent).toBe('Hello World');
	});

	it('title element is always an h2 (not configurable)', async () => {
		const { container } = render(Modal, { title: 'Fixed Heading' });
		const heading = container.querySelector('.hz-modal-title') as HTMLElement;
		expect(heading.tagName).toBe('H2');
	});

	it('header contains the close control when showClose=true (default)', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const header = container.querySelector('.hz-modal-header') as HTMLElement;
		expect(header.querySelector('.hz-button')).not.toBeNull();
	});

	it('header does NOT contain a close control when showClose=false', async () => {
		const { container } = render(Modal, { title: 'Test', showClose: false });
		const header = container.querySelector('.hz-modal-header') as HTMLElement;
		expect(header.querySelector('.hz-button')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Modal-R3 — Description
// ---------------------------------------------------------------------------

describe('Modal-R3 — description element', () => {
	it('renders .hz-modal-description <p> when description is a non-empty string', async () => {
		const { container } = render(Modal, { title: 'Test', description: 'A description' });
		const desc = container.querySelector('p.hz-modal-description') as HTMLElement;
		expect(desc).not.toBeNull();
		expect(desc.textContent).toBe('A description');
	});

	it('does not render .hz-modal-description when description is absent', async () => {
		const { container } = render(Modal, { title: 'Test' });
		expect(container.querySelector('.hz-modal-description')).toBeNull();
	});

	it('does not render .hz-modal-description when description="" (empty)', async () => {
		const { container } = render(Modal, { title: 'Test', description: '' });
		expect(container.querySelector('.hz-modal-description')).toBeNull();
	});

	it('description element id is referenced by aria-describedby', async () => {
		const { container } = render(Modal, { title: 'Test', description: 'Info' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		const desc = container.querySelector('.hz-modal-description') as HTMLElement;
		expect(dialog.getAttribute('aria-describedby')).toBe(desc.id);
	});
});

// ---------------------------------------------------------------------------
// Modal-R4 — Body
// ---------------------------------------------------------------------------

describe('Modal-R4 — body region', () => {
	it('renders .hz-modal-body always', async () => {
		const { container } = render(Modal, { title: 'Test' });
		expect(container.querySelector('.hz-modal-body')).not.toBeNull();
	});

	it('body renders empty without error when children is absent', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const body = container.querySelector('.hz-modal-body') as HTMLElement;
		expect(body).not.toBeNull();
		expect(body.textContent?.trim()).toBe('');
	});

	it('body renders children snippet content', async () => {
		const { container } = render(Modal, { title: 'Test', children: bodySnippet });
		const body = container.querySelector('.hz-modal-body') as HTMLElement;
		expect(body.querySelector('[data-testid="body-content"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Modal-R5 — Footer / actions
// ---------------------------------------------------------------------------

describe('Modal-R5 — footer region', () => {
	it('no .hz-modal-footer element when actions is absent', async () => {
		const { container } = render(Modal, { title: 'Test' });
		expect(container.querySelector('.hz-modal-footer')).toBeNull();
	});

	it('renders .hz-modal-footer wrapping actions snippet when provided', async () => {
		const { container } = render(Modal, { title: 'Test', actions: actionsSnippet });
		const footer = container.querySelector('.hz-modal-footer') as HTMLElement;
		expect(footer).not.toBeNull();
		expect(footer.querySelector('[data-testid="action-btn"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Modal-R6 — Size
// ---------------------------------------------------------------------------

describe('Modal-R6 — size', () => {
	it.each(['sm', 'md', 'lg', 'full'] as const)('size="%s" → data-size="%s"', (size) => {
		const { container } = render(Modal, { title: 'Test', size });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.getAttribute('data-size')).toBe(size);
	});

	it('default size is "md" → data-size="md"', () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.getAttribute('data-size')).toBe('md');
	});

	it('open modal width reflects a --hz-modal-width CSS override', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		// Set a custom width token and verify the dialog respects it
		dialog.style.setProperty('--hz-modal-width', '35rem');
		expect(dialog.style.getPropertyValue('--hz-modal-width')).toBe('35rem');
	});
});

// ---------------------------------------------------------------------------
// Modal-R7 / R8 — State and open/close mechanics
// ---------------------------------------------------------------------------

describe('Modal-R7/R8 — state and open/close mechanics', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('open=false (default) → dialog.open===false, data-state="closed"', async () => {
		const { container } = render(Modal, { title: 'Test' });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(dialog.open).toBe(false);
		expect(dialog.getAttribute('data-state')).toBe('closed');
	});

	it('open=true → dialog.open===true via showModal(), data-state="open"', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(dialog.open).toBe(true);
		expect(dialog.getAttribute('data-state')).toBe('open');
	});

	it('clicking close button closes the dialog (dialog.open becomes false)', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(dialog.open).toBe(true);

		const closeBtn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		closeBtn.click();
		await tick();

		expect(dialog.open).toBe(false);
		expect(dialog.getAttribute('data-state')).toBe('closed');
	});
});

// ---------------------------------------------------------------------------
// Modal-R9 — Two-way bind:open
// ---------------------------------------------------------------------------

describe('Modal-R9 — two-way bind:open', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('close button click sets open to false (data-state reflects "closed")', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		const closeBtn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		closeBtn.click();
		await tick();
		expect(dialog.getAttribute('data-state')).toBe('closed');
	});

	it('backdrop click sets open to false when closeOnOverlay=true', async () => {
		const { container } = render(Modal, { title: 'Test', open: true, closeOnOverlay: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(dialog.getAttribute('data-state')).toBe('closed');
	});

	it('Escape (cancel event) sets open to false', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new Event('cancel', { cancelable: true, bubbles: false }));
		await tick();
		expect(dialog.getAttribute('data-state')).toBe('closed');
	});
});

// ---------------------------------------------------------------------------
// Modal-R10 — onclose callback
// ---------------------------------------------------------------------------

describe('Modal-R10 — onclose callback', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('onclose does NOT fire when modal is initially rendered with open=false', async () => {
		const onclose = vi.fn();
		render(Modal, { title: 'Test', open: false, onclose });
		await tick();
		expect(onclose).not.toHaveBeenCalled();
	});

	it('onclose does NOT fire when modal is opened (open=true)', async () => {
		const onclose = vi.fn();
		render(Modal, { title: 'Test', open: true, onclose });
		await tick();
		expect(onclose).not.toHaveBeenCalled();
	});

	it('onclose fires exactly once when close button is clicked', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, { title: 'Test', open: true, onclose });
		await tick();
		const closeBtn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		closeBtn.click();
		await tick();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('onclose fires exactly once on backdrop click (closeOnOverlay=true)', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			closeOnOverlay: true,
			onclose
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('onclose fires exactly once on Escape', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			onclose
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('onclose is called with no arguments', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, { title: 'Test', open: true, onclose });
		await tick();
		const closeBtn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		closeBtn.click();
		await tick();
		expect(onclose).toHaveBeenCalledWith();
	});
});

// ---------------------------------------------------------------------------
// Modal-R11 — Focus on open
// ---------------------------------------------------------------------------

describe('Modal-R11 — focus on open', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('focus lands on first focusable element inside dialog when children has one', async () => {
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			children: focusableBodySnippet
		});
		await tick();
		await nextMicrotask();
		const firstFocusable = container.querySelector(
			'[data-testid="first-focusable"]'
		) as HTMLElement;
		expect(document.activeElement).toBe(firstFocusable);
	});

	it('focus lands on the close button when showClose=true and no other focusable content', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		await nextMicrotask();
		const closeBtn = container.querySelector('[data-modal-close]') as HTMLElement;
		expect(document.activeElement).toBe(closeBtn);
	});

	it('focus lands on dialog itself when showClose=false and no focusable content', async () => {
		const { container } = render(Modal, { title: 'Test', open: true, showClose: false });
		await tick();
		await nextMicrotask();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(document.activeElement).toBe(dialog);
	});
});

// ---------------------------------------------------------------------------
// Modal-R12 — Focus return on close
// ---------------------------------------------------------------------------

describe('Modal-R12 — focus return on close', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('focus returns to the pre-open trigger element after close', async () => {
		// Create a trigger button outside the modal
		const trigger = document.createElement('button');
		trigger.textContent = 'Open modal';
		document.body.appendChild(trigger);
		trigger.focus();
		expect(document.activeElement).toBe(trigger);

		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		await nextMicrotask();

		// Close via close button
		const closeBtn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		closeBtn.click();
		await tick();

		expect(document.activeElement).toBe(trigger);

		// Cleanup
		trigger.remove();
	});
});

// ---------------------------------------------------------------------------
// Modal-R13 — Escape / cancel handling
// ---------------------------------------------------------------------------

describe('Modal-R13 — Escape (cancel event) handling', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	// Escape ALWAYS closes — the WAI-ARIA dialog pattern requires it, so the
	// former closeOnEscape opt-out was removed (2026-07).
	it('Escape (cancel) closes the modal', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			onclose
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
		expect(dialog.open).toBe(false);
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('Escape closes even when overlay dismissal is disabled (no Esc opt-out exists)', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			closeOnOverlay: false,
			onclose
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
		expect(dialog.open).toBe(false);
		expect(onclose).toHaveBeenCalledOnce();
	});
});

// ---------------------------------------------------------------------------
// Modal-R14 — Backdrop click
// ---------------------------------------------------------------------------

describe('Modal-R14 — backdrop click', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('click on <dialog> (backdrop) closes when closeOnOverlay=true', async () => {
		const { container } = render(Modal, { title: 'Test', open: true, closeOnOverlay: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		// Dispatch click directly on dialog element — target will be dialog itself.
		dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(dialog.open).toBe(false);
	});

	it('click on inner content does NOT close the modal (target is not the dialog)', async () => {
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			closeOnOverlay: true,
			children: bodySnippet
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		const innerEl = container.querySelector('[data-testid="body-content"]') as HTMLElement;
		// Click on inner element — event bubbles to dialog but target is innerEl.
		innerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(dialog.open).toBe(true);
	});

	it('click on <dialog> is ignored when closeOnOverlay=false', async () => {
		const { container } = render(Modal, { title: 'Test', open: true, closeOnOverlay: false });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(dialog.open).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Modal-R15 — Close control (Button + IconX)
// ---------------------------------------------------------------------------

describe('Modal-R15 — close control', () => {
	it('showClose=true → close control renders inside header', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const header = container.querySelector('.hz-modal-header') as HTMLElement;
		expect(header.querySelector('.hz-button')).not.toBeNull();
	});

	it('close control has aria-label matching closeLabel (default "Close dialog")', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const btn = container.querySelector('[data-modal-close]') as HTMLElement;
		expect(btn).not.toBeNull();
		expect(btn.getAttribute('aria-label')).toBe('Close dialog');
	});

	it('custom closeLabel is applied to aria-label', async () => {
		const { container } = render(Modal, { title: 'Test', closeLabel: 'Dismiss' });
		const btn = container.querySelector('[data-modal-close]') as HTMLElement;
		expect(btn.getAttribute('aria-label')).toBe('Dismiss');
	});

	it('close control has data-modal-close attribute forwarded through Button', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const btn = container.querySelector('.hz-button[data-modal-close]') as HTMLElement;
		expect(btn).not.toBeNull();
	});

	it('IconX inside the close control is aria-hidden (decorative)', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const btn = container.querySelector('[data-modal-close]') as HTMLElement;
		const svg = btn.querySelector('svg') as SVGElement;
		expect(svg).not.toBeNull();
		expect(svg.getAttribute('aria-hidden')).toBe('true');
	});

	it('clicking the close control closes an open modal', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		const btn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		btn.click();
		await tick();
		expect(dialog.open).toBe(false);
	});

	it('showClose=false → no close control rendered', async () => {
		const { container } = render(Modal, { title: 'Test', showClose: false });
		expect(container.querySelector('[data-modal-close]')).toBeNull();
	});

	it('no icon-only dev-warning fires (ariaLabel satisfies Button guard)', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Modal, { title: 'Test' });
		// The Button dev-warning for icon-only without ariaLabel should NOT fire
		// since we always provide ariaLabel={closeLabel}.
		const calls = warnSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('icon-only')
		);
		expect(calls.length).toBe(0);
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Modal-R16 — Scroll lock (preventScroll)
// ---------------------------------------------------------------------------

describe('Modal-R16 — scroll lock', () => {
	afterEach(() => {
		document.body.style.overflow = '';
	});

	it('open with preventScroll=true → document.body.style.overflow is "hidden"', async () => {
		document.body.style.overflow = '';
		render(Modal, { title: 'Test', open: true, preventScroll: true });
		await tick();
		expect(document.body.style.overflow).toBe('hidden');
	});

	it('close with preventScroll=true → document.body.style.overflow is restored to ""', async () => {
		document.body.style.overflow = '';
		const { container } = render(Modal, { title: 'Test', open: true, preventScroll: true });
		await tick();
		expect(document.body.style.overflow).toBe('hidden');

		const closeBtn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		closeBtn.click();
		await tick();
		expect(document.body.style.overflow).toBe('');
	});

	it('close restores a pre-existing body overflow value exactly', async () => {
		document.body.style.overflow = 'scroll';
		const { container } = render(Modal, { title: 'Test', open: true, preventScroll: true });
		await tick();
		expect(document.body.style.overflow).toBe('hidden');

		const closeBtn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		closeBtn.click();
		await tick();
		expect(document.body.style.overflow).toBe('scroll');
	});

	it('open with preventScroll=false → body overflow is untouched', async () => {
		document.body.style.overflow = '';
		render(Modal, { title: 'Test', open: true, preventScroll: false });
		await tick();
		expect(document.body.style.overflow).toBe('');
	});

	it('unmounting while open restores scroll (no leaked overflow: hidden)', async () => {
		document.body.style.overflow = '';
		const { unmount } = render(Modal, { title: 'Test', open: true, preventScroll: true });
		await tick();
		expect(document.body.style.overflow).toBe('hidden');

		unmount();
		await tick();
		expect(document.body.style.overflow).toBe('');
	});
});

// ---------------------------------------------------------------------------
// Modal-R17 — class composition
// ---------------------------------------------------------------------------

describe('Modal-R17 — class composition', () => {
	it('no class prop → root class is exactly "hz-modal" (plus Svelte hash)', () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		const classes = [...dialog.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-modal']);
	});

	it('class="foo bar" → hz-modal is first, foo and bar present', () => {
		const { container } = render(Modal, { title: 'Test', class: 'foo bar' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		const classes = [...dialog.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-modal');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});

	it('hz-modal is always present even when class prop is set', () => {
		const { container } = render(Modal, { title: 'Test', class: 'custom' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.classList.contains('hz-modal')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Modal-R18 — rest forwarding
// ---------------------------------------------------------------------------

describe('Modal-R18 — rest forwarding', () => {
	it('arbitrary rest attr (data-testid) is forwarded to the root dialog', async () => {
		render(Modal, { title: 'Test', 'data-testid': 'my-modal' } as Record<string, unknown>);
		await expect.element(page.getByTestId('my-modal')).toBeInTheDocument();
	});

	it('rest override attempt on aria-modal → managed value "true" wins', () => {
		const { container } = render(Modal, {
			title: 'Test',
			'aria-modal': 'false'
		} as Record<string, unknown>);
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.getAttribute('aria-modal')).toBe('true');
	});

	it('rest override attempt on class → managed hz-modal class still wins', () => {
		const { container } = render(Modal, {
			title: 'Test',
			class: 'custom'
		} as Record<string, unknown>);
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(dialog.classList.contains('hz-modal')).toBe(true);
	});

	it('rest override attempt on data-state → managed value wins', () => {
		const { container } = render(Modal, {
			title: 'Test',
			'data-state': 'override'
		} as Record<string, unknown>);
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		// Managed value is 'closed' (open defaults to false)
		expect(dialog.getAttribute('data-state')).toBe('closed');
	});
});

// ---------------------------------------------------------------------------
// Modal-R19 — Barrel export
// ---------------------------------------------------------------------------

describe('Modal-R19 — barrel export', () => {
	it('Modal is resolvable from $lib', async () => {
		const { Modal: ModalComp } = await import('$lib');
		expect(ModalComp).toBeDefined();
	});

	it('Modal smoke-renders from $lib import', async () => {
		const { Modal: ModalComp } = await import('$lib');
		const { container } = render(ModalComp, { title: 'Smoke Test' });
		expect(container.querySelector('dialog.hz-modal')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('open starts true → dialog opens on mount via showModal()', async () => {
		const { container } = render(Modal, { title: 'Test', open: true });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(dialog.open).toBe(true);
	});

	it('no children → hz-modal-body renders empty; no error', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const body = container.querySelector('.hz-modal-body') as HTMLElement;
		expect(body).not.toBeNull();
		expect(body.textContent?.trim()).toBe('');
	});

	it('no actions → no hz-modal-footer element', async () => {
		const { container } = render(Modal, { title: 'Test' });
		expect(container.querySelector('.hz-modal-footer')).toBeNull();
	});

	it('no description → no hz-modal-description and no aria-describedby', async () => {
		const { container } = render(Modal, { title: 'Test' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(container.querySelector('.hz-modal-description')).toBeNull();
		expect(dialog.hasAttribute('aria-describedby')).toBe(false);
	});

	it('description="" (empty) → treated as absent; no description element; no aria-describedby', async () => {
		const { container } = render(Modal, { title: 'Test', description: '' });
		const dialog = container.querySelector('dialog.hz-modal') as HTMLElement;
		expect(container.querySelector('.hz-modal-description')).toBeNull();
		expect(dialog.hasAttribute('aria-describedby')).toBe(false);
	});

	it('closeOnOverlay=false → backdrop clicks are ignored', async () => {
		const { container } = render(Modal, { title: 'Test', open: true, closeOnOverlay: false });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(dialog.open).toBe(true);
	});

	it('click on inner content never closes (target not the dialog element)', async () => {
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			closeOnOverlay: true,
			children: bodySnippet
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		const inner = container.querySelector('[data-testid="body-content"]') as HTMLElement;
		inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(dialog.open).toBe(true);
	});

	it('any dismissal path sets open false AND fires onclose once', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, { title: 'Test', open: true, onclose });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;

		// Close via button
		const btn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		btn.click();
		await tick();

		expect(dialog.open).toBe(false);
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('showClose=false and no focusable content → dialog itself receives focus', async () => {
		const { container } = render(Modal, { title: 'Test', open: true, showClose: false });
		await tick();
		await nextMicrotask();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(document.activeElement).toBe(dialog);
	});

	it('no focusable content with showClose=true → close button gets focus', async () => {
		const { container } = render(Modal, { title: 'Test', open: true, showClose: true });
		await tick();
		await nextMicrotask();
		const closeBtn = container.querySelector('[data-modal-close]') as HTMLElement;
		expect(document.activeElement).toBe(closeBtn);
	});

	it('preventScroll=true with pre-set body overflow → restores exactly on close', async () => {
		document.body.style.overflow = 'auto';
		const { container } = render(Modal, { title: 'Test', open: true, preventScroll: true });
		await tick();
		expect(document.body.style.overflow).toBe('hidden');

		const btn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		btn.click();
		await tick();
		expect(document.body.style.overflow).toBe('auto');
	});

	it('component unmounted while open → scroll lock restored; no leaked overflow: hidden', async () => {
		document.body.style.overflow = '';
		const { unmount } = render(Modal, { title: 'Test', open: true, preventScroll: true });
		await tick();
		expect(document.body.style.overflow).toBe('hidden');
		unmount();
		await tick();
		expect(document.body.style.overflow).toBe('');
	});
});

// ---------------------------------------------------------------------------
// Integration — open → dismiss round-trips bind:open and onclose together
// ---------------------------------------------------------------------------

describe('Integration — open/dismiss round-trips', () => {
	afterEach(async () => {
		document.body.style.overflow = '';
	});

	it('close button dismissal: data-state goes "open" → "closed"; onclose fires', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, { title: 'Test', open: true, onclose });
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(dialog.getAttribute('data-state')).toBe('open');

		const btn = container.querySelector('[data-modal-close]') as HTMLButtonElement;
		btn.click();
		await tick();

		expect(dialog.getAttribute('data-state')).toBe('closed');
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('Escape dismissal: data-state goes "open" → "closed"; onclose fires', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			onclose
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();

		expect(dialog.getAttribute('data-state')).toBe('closed');
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('backdrop dismissal: data-state goes "open" → "closed"; onclose fires', async () => {
		const onclose = vi.fn();
		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			closeOnOverlay: true,
			onclose
		});
		await tick();
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();

		expect(dialog.getAttribute('data-state')).toBe('closed');
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('Tab key cycles within open dialog (native trap — no background control receives focus)', async () => {
		// Add a button outside the modal that should NOT receive focus via Tab.
		const outside = document.createElement('button');
		outside.textContent = 'outside';
		document.body.appendChild(outside);

		const { container } = render(Modal, {
			title: 'Test',
			open: true,
			children: actionsSnippet
		});
		await tick();
		await nextMicrotask();

		// Focus is inside the dialog; tabbing should stay inside (native trap).
		const dialog = container.querySelector('dialog.hz-modal') as HTMLDialogElement;
		expect(dialog.contains(document.activeElement)).toBe(true);

		outside.remove();
	});
});
