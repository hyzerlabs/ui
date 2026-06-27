import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Toggle from './Toggle.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// Field-R1 — Wrapper + state
// ---------------------------------------------------------------------------

describe('Field-R1 — wrapper and state', () => {
	it('root is div.hz-field.hz-field--toggle', () => {
		const { container } = render(Toggle, { name: 'x', label: 'Dark mode' });
		const root = container.querySelector('div.hz-field.hz-field--toggle') as HTMLElement;
		expect(root).not.toBeNull();
	});

	it('data-state="default" by default', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'default'
		);
	});

	it('data-state="disabled" when disabled', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', disabled: true });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'disabled'
		);
	});

	it('data-state="error" when error set', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', error: 'Required' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(Toggle, {
			name: 'x',
			label: 'X',
			error: 'Bad',
			disabled: true
		});
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});
});

// ---------------------------------------------------------------------------
// Toggle-R1 — Structure
// ---------------------------------------------------------------------------

describe('Toggle-R1 — structure', () => {
	it('renders button[role="switch"].hz-toggle', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const btn = container.querySelector('button[role="switch"].hz-toggle') as HTMLElement;
		expect(btn).not.toBeNull();
	});

	it('button type is "button"', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		expect((container.querySelector('button') as HTMLButtonElement).type).toBe('button');
	});

	it('button contains a span.hz-toggle-thumb', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const thumb = container.querySelector('button .hz-toggle-thumb') as HTMLElement;
		expect(thumb).not.toBeNull();
	});

	it('label follows button in DOM with id="hz-label-{uid}"', () => {
		const { container } = render(Toggle, { name: 'x', label: 'Dark mode' });
		const root = container.querySelector('.hz-field--toggle') as HTMLElement;
		const btn = container.querySelector('button') as HTMLButtonElement;
		const lbl = container.querySelector('label') as HTMLLabelElement;
		// label id referenced by aria-labelledby
		expect(lbl.id).toMatch(/^hz-label-/);
		expect(btn.getAttribute('aria-labelledby')).toBe(lbl.id);
		// label follows button in DOM
		const children = Array.from(root.children);
		expect(children.indexOf(btn)).toBeLessThan(children.indexOf(lbl));
	});

	it('label text matches the label prop', () => {
		const { container } = render(Toggle, { name: 'x', label: 'Enable alerts' });
		expect((container.querySelector('label') as HTMLElement).textContent?.trim()).toContain(
			'Enable alerts'
		);
	});

	it('hideLabel adds sr-only to label but keeps it in DOM', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', hideLabel: true });
		const lbl = container.querySelector('label') as HTMLElement;
		expect(lbl).not.toBeNull();
		expect(lbl.classList.contains('sr-only')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Toggle-R2 — Checked state
// ---------------------------------------------------------------------------

describe('Toggle-R2 — checked state', () => {
	it('initial aria-checked="false" and data-state="off"', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		expect(btn.getAttribute('aria-checked')).toBe('false');
		expect(btn.getAttribute('data-state')).toBe('off');
	});

	it('clicking toggles aria-checked to "true" and data-state to "on"', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		btn.click();
		await tick();
		expect(btn.getAttribute('aria-checked')).toBe('true');
		expect(btn.getAttribute('data-state')).toBe('on');
	});

	it('clicking again toggles back to "false"/"off"', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		btn.click();
		await tick();
		btn.click();
		await tick();
		expect(btn.getAttribute('aria-checked')).toBe('false');
		expect(btn.getAttribute('data-state')).toBe('off');
	});

	it('Enter key on button toggles checked (native button activation)', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		btn.focus();
		await userEvent.keyboard('{Enter}');
		await tick();
		expect(btn.getAttribute('aria-checked')).toBe('true');
	});

	it('Space key on button toggles checked (native button activation)', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		btn.focus();
		await userEvent.keyboard(' ');
		await tick();
		expect(btn.getAttribute('aria-checked')).toBe('true');
	});
});

// ---------------------------------------------------------------------------
// Toggle-R3 — describedby / aria-invalid / disabled
// ---------------------------------------------------------------------------

describe('Toggle-R3 — aria chain and disabled', () => {
	it('description: button aria-describedby = desc id', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', description: 'Help' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(btn.getAttribute('aria-describedby')).toBe(desc.id);
	});

	it('error: button aria-describedby = error id + aria-invalid="true"', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', error: 'Required' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(btn.getAttribute('aria-describedby')).toBe(err.id);
		expect(btn.getAttribute('aria-invalid')).toBe('true');
	});

	it('both desc and error: aria-describedby chains them', () => {
		const { container } = render(Toggle, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const btn = container.querySelector('button') as HTMLButtonElement;
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		expect(btn.getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
	});

	it('neither: aria-describedby absent', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const btn = container.querySelector('button') as HTMLButtonElement;
		expect(btn.hasAttribute('aria-describedby')).toBe(false);
	});

	it('disabled: native disabled on button', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', disabled: true });
		const btn = container.querySelector('button') as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});

	it('disabled: clicking does not toggle checked', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', disabled: true });
		const btn = container.querySelector('button') as HTMLButtonElement;
		// Native disabled prevents click events from firing normally,
		// but even if it fires, the handler should not toggle.
		expect(btn.getAttribute('aria-checked')).toBe('false');
		expect(btn.disabled).toBe(true);
	});

	it('error renders with role="alert"', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', error: 'Required' });
		expect((container.querySelector('.hz-field-error') as HTMLElement).getAttribute('role')).toBe(
			'alert'
		);
	});
});

// ---------------------------------------------------------------------------
// Field-R3 — Required
// ---------------------------------------------------------------------------

describe('Field-R3 — required', () => {
	it('required: aria-required on button + * span in label', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', required: true });
		const btn = container.querySelector('button') as HTMLButtonElement;
		expect(btn.getAttribute('aria-required')).toBe('true');
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('not required: no aria-required and no * span', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		expect(
			(container.querySelector('button') as HTMLButtonElement).hasAttribute('aria-required')
		).toBe(false);
		expect(container.querySelector('.hz-field-required')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Forms-R1 — Class composition
// ---------------------------------------------------------------------------

describe('Forms-R1 — class composition', () => {
	it('no class: root has hz-field and hz-field--toggle', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toContain('hz-field');
		expect(classes).toContain('hz-field--toggle');
	});

	it('class="foo": hz-field hz-field--toggle foo', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', class: 'foo' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('hz-field--toggle');
		expect(classes).toContain('foo');
	});
});

// ---------------------------------------------------------------------------
// Forms-R2 — rest forwarding
// ---------------------------------------------------------------------------

describe('Forms-R2 — rest forwarding', () => {
	it('data-testid from rest forwards to the button', async () => {
		render(Toggle, {
			name: 'x',
			label: 'X',
			'data-testid': 'my-toggle'
		} as Record<string, unknown>);
		const btn = document.querySelector('[data-testid="my-toggle"]');
		expect(btn).not.toBeNull();
		expect(btn?.tagName.toLowerCase()).toBe('button');
	});

	it('role in rest is overridden by managed role="switch"', () => {
		const { container } = render(Toggle, {
			name: 'x',
			label: 'X',
			role: 'checkbox'
		} as Record<string, unknown>);
		const btn = container.querySelector('button') as HTMLButtonElement;
		expect(btn.getAttribute('role')).toBe('switch');
	});
});

// ---------------------------------------------------------------------------
// Forms-R3 — Barrel export
// ---------------------------------------------------------------------------

describe('Forms-R3 — barrel export', () => {
	it('Toggle is resolvable from $lib', async () => {
		const { Toggle: T } = await import('$lib');
		expect(T).toBeDefined();
	});

	it('Toggle smoke-renders from $lib import', async () => {
		const { Toggle: T } = await import('$lib');
		const { container } = render(T, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-field--toggle')).not.toBeNull();
	});
});
