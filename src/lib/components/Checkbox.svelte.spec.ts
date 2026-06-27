import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Checkbox from './Checkbox.svelte';

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
	it('root is div.hz-field.hz-field--checkbox', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'Accept' });
		const root = container.querySelector('div.hz-field.hz-field--checkbox') as HTMLElement;
		expect(root).not.toBeNull();
	});

	it('data-state="default" by default', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'default'
		);
	});

	it('data-state="disabled" when disabled', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', disabled: true });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'disabled'
		);
	});

	it('data-state="error" when error is set', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', error: 'Required' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(Checkbox, {
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
// Checkbox-R1 — Structure (input THEN label)
// ---------------------------------------------------------------------------

describe('Checkbox-R1 — structure', () => {
	it('renders input type="checkbox" then label in DOM order', () => {
		const { container } = render(Checkbox, { name: 'agree', label: 'I agree' });
		const children = Array.from(container.querySelector('.hz-field--checkbox')!.children);
		const inputIdx = children.findIndex((el) => el.tagName === 'INPUT');
		const labelIdx = children.findIndex((el) => el.tagName === 'LABEL');
		expect(inputIdx).toBeGreaterThanOrEqual(0);
		expect(labelIdx).toBeGreaterThan(inputIdx);
	});

	it('input has id matching label for=', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		const lbl = container.querySelector('label') as HTMLLabelElement;
		expect(lbl.htmlFor).toBe(input.id);
	});

	it('input name is set', () => {
		const { container } = render(Checkbox, { name: 'agree', label: 'Agree' });
		expect((container.querySelector('input') as HTMLInputElement).name).toBe('agree');
	});

	it('value attribute set only when value prop defined', () => {
		const { container: c1 } = render(Checkbox, {
			name: 'x',
			label: 'X',
			value: 'yes'
		});
		expect(c1.querySelector('input')!.getAttribute('value')).toBe('yes');

		const { container: c2 } = render(Checkbox, { name: 'x', label: 'X' });
		// value not set — attribute absent or empty (browser default)
		expect(c2.querySelector('input')!.getAttribute('value')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Field-R2 — Label
// ---------------------------------------------------------------------------

describe('Field-R2 — label', () => {
	it('label text is the label prop', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'Accept Terms' });
		expect((container.querySelector('label') as HTMLElement).textContent?.trim()).toContain(
			'Accept Terms'
		);
	});

	it('hideLabel adds sr-only class but keeps label in DOM', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', hideLabel: true });
		const lbl = container.querySelector('label') as HTMLElement;
		expect(lbl).not.toBeNull();
		expect(lbl.classList.contains('sr-only')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Field-R3 — Required
// ---------------------------------------------------------------------------

describe('Field-R3 — required', () => {
	it('required: aria-required on input + * span in label', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', required: true });
		expect(
			(container.querySelector('input') as HTMLInputElement).getAttribute('aria-required')
		).toBe('true');
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('not required: no aria-required, no * span', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		expect(
			(container.querySelector('input') as HTMLInputElement).hasAttribute('aria-required')
		).toBe(false);
		expect(container.querySelector('.hz-field-required')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Field-R4/R5/R6 — Description / error / aria-describedby
// ---------------------------------------------------------------------------

describe('Field-R4/R5/R6 — description, error, aria-describedby', () => {
	it('description renders with hz-desc id', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', description: 'Help' });
		expect((container.querySelector('.hz-field-description') as HTMLElement).id).toMatch(
			/^hz-desc-/
		);
	});

	it('error renders with role="alert" and hz-error id + aria-invalid', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', error: 'Required' });
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		const input = container.querySelector('input') as HTMLInputElement;
		expect(err.getAttribute('role')).toBe('alert');
		expect(err.id).toMatch(/^hz-error-/);
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});

	it('both desc and error: aria-describedby = "desc-id error-id"', () => {
		const { container } = render(Checkbox, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const input = container.querySelector('input') as HTMLInputElement;
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		expect(input.getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
	});

	it('neither: aria-describedby absent', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		expect(
			(container.querySelector('input') as HTMLInputElement).hasAttribute('aria-describedby')
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Field-R7 — Disabled
// ---------------------------------------------------------------------------

describe('Field-R7 — disabled', () => {
	it('disabled: native disabled on input', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', disabled: true });
		expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(true);
	});

	it('not disabled: no disabled attribute', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		expect((container.querySelector('input') as HTMLInputElement).disabled).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Checkbox-R2 — Checked binding
// ---------------------------------------------------------------------------

describe('Checkbox-R2 — checked binding', () => {
	it('initial checked is false', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		expect((container.querySelector('input') as HTMLInputElement).checked).toBe(false);
	});

	it('clicking the checkbox toggles checked to true', async () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		await userEvent.click(input);
		expect(input.checked).toBe(true);
	});

	it('clicking again toggles back to false', async () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		await userEvent.click(input);
		await userEvent.click(input);
		expect(input.checked).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Checkbox-R3 — Indeterminate
// ---------------------------------------------------------------------------

describe('Checkbox-R3 — indeterminate', () => {
	it('indeterminate=true sets .indeterminate property on the element', async () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', indeterminate: true });
		await tick(); // let $effect run
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.indeterminate).toBe(true);
	});

	it('indeterminate=false: .indeterminate is false', async () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', indeterminate: false });
		await tick();
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.indeterminate).toBe(false);
	});

	it('user toggle clears indeterminate natively', async () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', indeterminate: true });
		await tick();
		const input = container.querySelector('input') as HTMLInputElement;
		await userEvent.click(input);
		// Native behavior: clicking a checkbox with indeterminate clears it
		expect(input.indeterminate).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Forms-R1 — Class composition
// ---------------------------------------------------------------------------

describe('Forms-R1 — class composition', () => {
	it('no class: root has hz-field and hz-field--checkbox', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toContain('hz-field');
		expect(classes).toContain('hz-field--checkbox');
	});

	it('class="foo": hz-field hz-field--checkbox foo', () => {
		const { container } = render(Checkbox, { name: 'x', label: 'X', class: 'foo' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('hz-field--checkbox');
		expect(classes).toContain('foo');
	});
});

// ---------------------------------------------------------------------------
// Forms-R3 — Barrel export
// ---------------------------------------------------------------------------

describe('Forms-R3 — barrel export', () => {
	it('Checkbox is resolvable from $lib', async () => {
		const { Checkbox: C } = await import('$lib');
		expect(C).toBeDefined();
	});
});
