import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorInput from './ColorInput.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function getInput(container: HTMLElement): HTMLInputElement {
	return container.querySelector('input.hz-color') as HTMLInputElement;
}

// ---------------------------------------------------------------------------
// Field-R1 — Wrapper + state
// ---------------------------------------------------------------------------

describe('Field-R1 — wrapper and state', () => {
	it('root is div.hz-field.hz-field--color', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'Disc color' });
		expect(container.querySelector('div.hz-field.hz-field--color')).not.toBeNull();
	});

	it('data-state default / disabled / error (error wins)', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'default'
		);
		const { container: err } = render(ColorInput, {
			name: 'x',
			label: 'X',
			error: 'Bad',
			disabled: true
		});
		expect((err.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});
});

// ---------------------------------------------------------------------------
// Color-R1 — Structure
// ---------------------------------------------------------------------------

describe('Color-R1 — structure', () => {
	it('renders input[type="color"].hz-color with id/for label association', () => {
		const { container } = render(ColorInput, { name: 'disc', label: 'Disc color' });
		const input = getInput(container);
		expect(input).not.toBeNull();
		expect(input.type).toBe('color');
		expect(input.name).toBe('disc');
		expect(input.id).toMatch(/^hz-input-/);
		expect((container.querySelector('label') as HTMLLabelElement).htmlFor).toBe(input.id);
	});

	it('hex field displays the value, has aria-label and no name', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'Disc color', value: '#ff6b35' });
		const hex = container.querySelector('.hz-color-hex') as HTMLInputElement;
		expect(hex.value).toBe('#ff6b35');
		expect(hex.getAttribute('aria-label')).toBe('Disc color (hex value)');
		expect(hex.hasAttribute('name')).toBe(false);
	});

	it('inputLabel overrides the hex field accessible name', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X', inputLabel: 'Exact hex' });
		expect(
			(container.querySelector('.hz-color-hex') as HTMLElement).getAttribute('aria-label')
		).toBe('Exact hex');
	});

	it('showInput=false: no hex field, readout shows the value', () => {
		const { container } = render(ColorInput, {
			name: 'x',
			label: 'X',
			showInput: false,
			value: '#2563eb'
		});
		expect(container.querySelector('.hz-color-hex')).toBeNull();
		const readout = container.querySelector('.hz-color-value') as HTMLElement;
		expect(readout.textContent).toBe('#2563eb');
		expect(readout.getAttribute('aria-hidden')).toBe('true');
	});

	it('showInput=true: no readout span', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-color-value')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Color-R8 — Hex-field commit
// ---------------------------------------------------------------------------

describe('Color-R8 — hex-field commit', () => {
	/** Commit a hex entry (delegated change event — must bubble). */
	async function commitHex(container: HTMLElement, raw: string): Promise<HTMLInputElement> {
		const hex = container.querySelector('.hz-color-hex') as HTMLInputElement;
		hex.value = raw;
		hex.dispatchEvent(new Event('change', { bubbles: true }));
		await tick();
		return hex;
	}

	it('valid #rrggbb assigns to the color input', async () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		await commitHex(container, '#2563eb');
		expect(getInput(container).value).toBe('#2563eb');
	});

	it('normalizes case and missing #', async () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		const hex = await commitHex(container, '2563EB');
		expect(getInput(container).value).toBe('#2563eb');
		expect(hex.value).toBe('#2563eb');
	});

	it('expands 3-digit shorthand', async () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		const hex = await commitHex(container, '#f60');
		expect(getInput(container).value).toBe('#ff6600');
		expect(hex.value).toBe('#ff6600');
	});

	it('garbage and empty entries restore without assignment', async () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X', value: '#a3e635' });
		let hex = await commitHex(container, 'not-a-color');
		expect(getInput(container).value).toBe('#a3e635');
		expect(hex.value).toBe('#a3e635');
		hex = await commitHex(container, '');
		expect(hex.value).toBe('#a3e635');
	});
});

// ---------------------------------------------------------------------------
// Color-R2 — Value binding
// ---------------------------------------------------------------------------

describe('Color-R2 — value binding', () => {
	it('defaults to #000000', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		expect(getInput(container).value).toBe('#000000');
		expect((container.querySelector('.hz-color-hex') as HTMLInputElement).value).toBe('#000000');
	});

	it('picking updates the hex field display', async () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		const input = getInput(container);
		input.value = '#2563eb';
		input.dispatchEvent(new Event('input'));
		await tick();
		expect((container.querySelector('.hz-color-hex') as HTMLInputElement).value).toBe('#2563eb');
	});
});

// ---------------------------------------------------------------------------
// Color-R3 — ARIA
// ---------------------------------------------------------------------------

describe('Color-R3 — aria chain', () => {
	it('describedby chains desc then error; aria-invalid on error; role=alert', () => {
		const { container } = render(ColorInput, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const input = getInput(container);
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errEl = container.querySelector('.hz-field-error') as HTMLElement;
		expect(input.getAttribute('aria-describedby')).toBe(`${descId} ${errEl.id}`);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(errEl.getAttribute('role')).toBe('alert');
	});

	it('neither: aria-describedby absent', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X' });
		expect(getInput(container).hasAttribute('aria-describedby')).toBe(false);
	});

	it('required: label indicator only, no aria-required', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X', required: true });
		expect(getInput(container).hasAttribute('aria-required')).toBe(false);
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Color-R4 — Disabled
// ---------------------------------------------------------------------------

describe('Color-R4 — disabled', () => {
	it('native disabled on both inputs', () => {
		const { container } = render(ColorInput, { name: 'x', label: 'X', disabled: true });
		expect(getInput(container).disabled).toBe(true);
		expect((container.querySelector('.hz-color-hex') as HTMLInputElement).disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Color-R5 — Rest forwarding
// ---------------------------------------------------------------------------

describe('Color-R5 — rest forwarding', () => {
	it('data-testid lands on the input; type override loses', () => {
		const { container } = render(ColorInput, {
			name: 'x',
			label: 'X',
			'data-testid': 'my-color',
			type: 'text'
		} as Record<string, unknown>);
		const el = container.querySelector('[data-testid="my-color"]') as HTMLInputElement;
		expect(el).not.toBeNull();
		expect(el.type).toBe('color');
	});
});

// ---------------------------------------------------------------------------
// Color-R6 — Barrel export
// ---------------------------------------------------------------------------

describe('Color-R6 — barrel export', () => {
	it('ColorInput resolves from $lib and smoke-renders', async () => {
		const { ColorInput: C } = await import('$lib');
		expect(C).toBeDefined();
		const { container } = render(C, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-field--color')).not.toBeNull();
	});
});
