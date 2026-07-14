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

function getInput(container: HTMLElement): HTMLInputElement {
	return container.querySelector('input.hz-toggle') as HTMLInputElement;
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
	it('renders input[type="checkbox"][role="switch"].hz-toggle', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const input = container.querySelector(
			'input[type="checkbox"][role="switch"].hz-toggle'
		) as HTMLInputElement;
		expect(input).not.toBeNull();
	});

	it('name lands on the input (form participation)', () => {
		const { container } = render(Toggle, { name: 'alerts', label: 'X' });
		expect(getInput(container).name).toBe('alerts');
	});

	it('value applies only when defined', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', value: 'yes' });
		expect(getInput(container).getAttribute('value')).toBe('yes');
		const { container: bare } = render(Toggle, { name: 'x', label: 'X' });
		expect(getInput(bare).hasAttribute('value')).toBe(false);
	});

	it('no aria-checked — native checked state carries semantics', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		expect(getInput(container).hasAttribute('aria-checked')).toBe(false);
	});

	it('label follows input in DOM and is associated via for/id', () => {
		const { container } = render(Toggle, { name: 'x', label: 'Dark mode' });
		const root = container.querySelector('.hz-field--toggle') as HTMLElement;
		const input = getInput(container);
		const lbl = container.querySelector('label') as HTMLLabelElement;
		expect(input.id).toMatch(/^hz-input-/);
		expect(lbl.htmlFor).toBe(input.id);
		const children = Array.from(root.children);
		expect(children.indexOf(input)).toBeLessThan(children.indexOf(lbl));
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
	it('initial unchecked with data-state="off"', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const input = getInput(container);
		expect(input.checked).toBe(false);
		expect(input.getAttribute('data-state')).toBe('off');
	});

	it('clicking the input toggles checked and data-state to "on"', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const input = getInput(container);
		input.click();
		await tick();
		expect(input.checked).toBe(true);
		expect(input.getAttribute('data-state')).toBe('on');
	});

	it('clicking again toggles back to unchecked/"off"', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const input = getInput(container);
		input.click();
		await tick();
		input.click();
		await tick();
		expect(input.checked).toBe(false);
		expect(input.getAttribute('data-state')).toBe('off');
	});

	it('clicking the LABEL toggles checked (native for/id association)', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const lbl = container.querySelector('label') as HTMLLabelElement;
		lbl.click();
		await tick();
		expect(getInput(container).checked).toBe(true);
	});

	/*
	 * Focus is established by CLICKING the input, not element.focus():
	 * userEvent.keyboard sends real CDP keys to whichever test-file iframe
	 * holds browser-level focus, and .focus() alone doesn't claim it — under
	 * parallel iframes the keystroke could land in another frame (same flake
	 * as Accordion R13). The click toggles on and focuses; the keypress
	 * asserts the toggle-off half of native checkbox activation.
	 */
	it('Space key toggles checked (native checkbox activation)', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const input = getInput(container);
		await userEvent.click(input);
		await tick();
		expect(input.checked).toBe(true);
		expect(document.activeElement).toBe(input);
		await userEvent.keyboard(' ');
		await tick();
		expect(input.checked).toBe(false);
	});

	it('Enter key does NOT toggle (native checkbox behavior)', async () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		const input = getInput(container);
		await userEvent.click(input);
		await tick();
		expect(input.checked).toBe(true);
		expect(document.activeElement).toBe(input);
		await userEvent.keyboard('{Enter}');
		await tick();
		expect(input.checked).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Toggle-R3 — describedby / aria-invalid / disabled
// ---------------------------------------------------------------------------

describe('Toggle-R3 — aria chain and disabled', () => {
	it('description: input aria-describedby = desc id', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', description: 'Help' });
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(getInput(container).getAttribute('aria-describedby')).toBe(desc.id);
	});

	it('error: input aria-describedby = error id + aria-invalid="true"', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', error: 'Required' });
		const input = getInput(container);
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(input.getAttribute('aria-describedby')).toBe(err.id);
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});

	it('both desc and error: aria-describedby chains them', () => {
		const { container } = render(Toggle, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		expect(getInput(container).getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
	});

	it('neither: aria-describedby absent', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		expect(getInput(container).hasAttribute('aria-describedby')).toBe(false);
	});

	it('disabled: native disabled on input', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', disabled: true });
		expect(getInput(container).disabled).toBe(true);
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
	it('required: aria-required on input + * span in label', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X', required: true });
		expect(getInput(container).getAttribute('aria-required')).toBe('true');
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('not required: no aria-required and no * span', () => {
		const { container } = render(Toggle, { name: 'x', label: 'X' });
		expect(getInput(container).hasAttribute('aria-required')).toBe(false);
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
	it('data-testid from rest forwards to the input', async () => {
		render(Toggle, {
			name: 'x',
			label: 'X',
			'data-testid': 'my-toggle'
		} as Record<string, unknown>);
		const input = document.querySelector('[data-testid="my-toggle"]');
		expect(input).not.toBeNull();
		expect(input?.tagName.toLowerCase()).toBe('input');
	});

	it('role in rest is overridden by managed role="switch"', () => {
		const { container } = render(Toggle, {
			name: 'x',
			label: 'X',
			role: 'checkbox'
		} as Record<string, unknown>);
		expect(getInput(container).getAttribute('role')).toBe('switch');
	});

	it('type in rest is overridden by managed type="checkbox"', () => {
		const { container } = render(Toggle, {
			name: 'x',
			label: 'X',
			type: 'radio'
		} as Record<string, unknown>);
		expect(getInput(container).type).toBe('checkbox');
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
