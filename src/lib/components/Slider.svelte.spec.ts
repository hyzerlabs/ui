import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Slider from './Slider.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function getRange(container: HTMLElement): HTMLInputElement {
	return container.querySelector('input.hz-slider') as HTMLInputElement;
}

function getNumber(container: HTMLElement): HTMLInputElement {
	return container.querySelector('input.hz-slider-number') as HTMLInputElement;
}

/** Type into the number field and fire the change event (commit). */
async function commitNumber(container: HTMLElement, raw: string): Promise<void> {
	const el = getNumber(container);
	el.value = raw;
	// change is a Svelte-delegated event — it must bubble to the root listener.
	el.dispatchEvent(new Event('change', { bubbles: true }));
	await tick();
}

// ---------------------------------------------------------------------------
// Field-R1 — Wrapper + state
// ---------------------------------------------------------------------------

describe('Field-R1 — wrapper and state', () => {
	it('root is div.hz-field.hz-field--slider', () => {
		const { container } = render(Slider, { name: 'x', label: 'Distance' });
		expect(container.querySelector('div.hz-field.hz-field--slider')).not.toBeNull();
	});

	it('data-state="default" by default', () => {
		const { container } = render(Slider, { name: 'x', label: 'X' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'default'
		);
	});

	it('data-state="disabled" when disabled', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', disabled: true });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'disabled'
		);
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', error: 'Bad', disabled: true });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});
});

// ---------------------------------------------------------------------------
// Slider-R1 — Structure
// ---------------------------------------------------------------------------

describe('Slider-R1 — structure', () => {
	it('renders input[type="range"].hz-slider with label association via for/id', () => {
		const { container } = render(Slider, { name: 'dist', label: 'Distance' });
		const range = getRange(container);
		expect(range).not.toBeNull();
		expect(range.type).toBe('range');
		expect(range.id).toMatch(/^hz-input-/);
		const lbl = container.querySelector('label') as HTMLLabelElement;
		expect(lbl.htmlFor).toBe(range.id);
	});

	it('name lands on the range; min/max/step reflected on both inputs', () => {
		const { container } = render(Slider, {
			name: 'dist',
			label: 'X',
			min: 10,
			max: 400,
			step: 5
		});
		const range = getRange(container);
		const num = getNumber(container);
		expect(range.name).toBe('dist');
		for (const el of [range, num]) {
			expect(el.min).toBe('10');
			expect(el.max).toBe('400');
			expect(el.step).toBe('5');
		}
	});

	it('number input has no name and carries the default aria-label', () => {
		const { container } = render(Slider, { name: 'dist', label: 'Distance' });
		const num = getNumber(container);
		expect(num.hasAttribute('name')).toBe(false);
		expect(num.getAttribute('aria-label')).toBe('Distance (exact value)');
	});

	it('inputLabel overrides the number input accessible name', () => {
		const { container } = render(Slider, {
			name: 'x',
			label: 'X',
			inputLabel: 'Exact feet'
		});
		expect(getNumber(container).getAttribute('aria-label')).toBe('Exact feet');
	});

	it('row carries data-has-input by default', () => {
		const { container } = render(Slider, { name: 'x', label: 'X' });
		expect(
			(container.querySelector('.hz-slider-row') as HTMLElement).hasAttribute('data-has-input')
		).toBe(true);
	});

	it('showInput=false: no number input, no data-has-input, readout shows the value', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', showInput: false, value: 7 });
		expect(getNumber(container)).toBeNull();
		expect(
			(container.querySelector('.hz-slider-row') as HTMLElement).hasAttribute('data-has-input')
		).toBe(false);
		const readout = container.querySelector('.hz-slider-value') as HTMLElement;
		expect(readout.textContent).toBe('7');
		expect(readout.getAttribute('aria-hidden')).toBe('true');
	});

	it('showInput=false: the readout tracks slider movement', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X', showInput: false });
		const range = getRange(container);
		range.value = '60';
		range.dispatchEvent(new Event('input'));
		await tick();
		expect((container.querySelector('.hz-slider-value') as HTMLElement).textContent).toBe('60');
	});

	it('showInput=true: no readout span', () => {
		const { container } = render(Slider, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-slider-value')).toBeNull();
	});

	it('row exposes --hz-slider-chars from the widest bound at step precision', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', min: 0, max: 700 });
		expect(
			(container.querySelector('.hz-slider-row') as HTMLElement).style.getPropertyValue(
				'--hz-slider-chars'
			)
		).toBe('3');
		const { container: frac } = render(Slider, {
			name: 'x',
			label: 'X',
			min: 150,
			max: 180,
			step: 0.5
		});
		// "180.5" — decimals from the step count toward the width
		expect(
			(frac.querySelector('.hz-slider-row') as HTMLElement).style.getPropertyValue(
				'--hz-slider-chars'
			)
		).toBe('5');
	});

	it('unit renders aria-hidden only when set', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', unit: 'ft' });
		const unit = container.querySelector('.hz-slider-unit') as HTMLElement;
		expect(unit.textContent).toBe('ft');
		expect(unit.getAttribute('aria-hidden')).toBe('true');
		const { container: bare } = render(Slider, { name: 'x', label: 'X' });
		expect(bare.querySelector('.hz-slider-unit')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Slider-R2 — Value binding
// ---------------------------------------------------------------------------

describe('Slider-R2 — value binding', () => {
	it('defaults to min', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', min: 25, max: 100 });
		expect(getRange(container).value).toBe('25');
		expect(getNumber(container).value).toBe('25');
	});

	it('slider input updates the number field display', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X' });
		const range = getRange(container);
		range.value = '60';
		range.dispatchEvent(new Event('input'));
		await tick();
		expect(getNumber(container).value).toBe('60');
	});
});

// ---------------------------------------------------------------------------
// Slider-R3 — Number-field commit
// ---------------------------------------------------------------------------

describe('Slider-R3 — number-field commit', () => {
	it('committing a valid value assigns it to the range', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X' });
		await commitNumber(container, '42');
		expect(getRange(container).value).toBe('42');
		expect(getNumber(container).value).toBe('42');
	});

	it('above max clamps to max and reflects it', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X', max: 100 });
		await commitNumber(container, '350');
		expect(getRange(container).value).toBe('100');
		expect(getNumber(container).value).toBe('100');
	});

	it('below min clamps to min', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X', min: 20 });
		await commitNumber(container, '3');
		expect(getRange(container).value).toBe('20');
		expect(getNumber(container).value).toBe('20');
	});

	it('off-grid values snap to the step anchored at min', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X', min: 10, max: 100, step: 5 });
		await commitNumber(container, '23');
		// grid: 10, 15, 20, 25 … → 23 snaps to 25
		expect(getRange(container).value).toBe('25');
	});

	it('empty entry restores the current value without assignment', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X', min: 0 });
		await commitNumber(container, '42');
		await commitNumber(container, '');
		expect(getRange(container).value).toBe('42');
		expect(getNumber(container).value).toBe('42');
	});
});

// ---------------------------------------------------------------------------
// Ticks-R1 / Fill-R1
// ---------------------------------------------------------------------------

describe('Ticks-R1 / Fill-R1 — ticks and fill fraction', () => {
	it('row exposes --hz-slider-fill and it tracks slider movement', async () => {
		const { container } = render(Slider, { name: 'x', label: 'X', min: 0, max: 200, value: 50 });
		const row = container.querySelector('.hz-slider-row') as HTMLElement;
		expect(row.style.getPropertyValue('--hz-slider-fill')).toBe('0.25');
		const range = getRange(container);
		range.value = '100';
		range.dispatchEvent(new Event('input'));
		await tick();
		expect(row.style.getPropertyValue('--hz-slider-fill')).toBe('0.5');
	});

	it('ticks render aria-hidden with position fractions; out-of-range entries skipped', () => {
		const { container } = render(Slider, {
			name: 'x',
			label: 'X',
			min: 0,
			max: 100,
			ticks: [0, { value: 25, label: 'quarter' }, 100, -5, 120]
		});
		const box = container.querySelector('.hz-slider-ticks') as HTMLElement;
		expect(box.getAttribute('aria-hidden')).toBe('true');
		const marks = box.querySelectorAll('.hz-slider-tick');
		expect(marks.length).toBe(3);
		expect((marks[1] as HTMLElement).style.getPropertyValue('--hz-tick-pos')).toBe('0.25');
		expect(marks[1].querySelector('.hz-slider-tick-label')?.textContent).toBe('quarter');
		expect(marks[0].querySelector('.hz-slider-tick-label')).toBeNull();
		expect(
			(container.querySelector('.hz-slider-row') as HTMLElement).hasAttribute('data-has-ticks')
		).toBe(true);
	});

	it('no ticks: no container, no data-has-ticks', () => {
		const { container } = render(Slider, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-slider-ticks')).toBeNull();
		expect(
			(container.querySelector('.hz-slider-row') as HTMLElement).hasAttribute('data-has-ticks')
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Slider-R4 — ARIA
// ---------------------------------------------------------------------------

describe('Slider-R4 — aria chain', () => {
	it('description: range aria-describedby = desc id', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', description: 'Help' });
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(getRange(container).getAttribute('aria-describedby')).toBe(desc.id);
	});

	it('error: aria-describedby = error id + aria-invalid, role=alert message', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', error: 'Too far' });
		const range = getRange(container);
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(range.getAttribute('aria-describedby')).toBe(err.id);
		expect(range.getAttribute('aria-invalid')).toBe('true');
		expect(err.getAttribute('role')).toBe('alert');
	});

	it('both: chained desc then error; neither: attribute absent', () => {
		const { container } = render(Slider, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		expect(getRange(container).getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
		const { container: bare } = render(Slider, { name: 'x', label: 'X' });
		expect(getRange(bare).hasAttribute('aria-describedby')).toBe(false);
	});

	it('required: label indicator only — aria-required is not valid on the slider role', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', required: true });
		expect(getRange(container).hasAttribute('aria-required')).toBe(false);
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Slider-R5 — Disabled
// ---------------------------------------------------------------------------

describe('Slider-R5 — disabled', () => {
	it('disables both inputs natively', () => {
		const { container } = render(Slider, { name: 'x', label: 'X', disabled: true });
		expect(getRange(container).disabled).toBe(true);
		expect(getNumber(container).disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Slider-R6 — Rest forwarding
// ---------------------------------------------------------------------------

describe('Slider-R6 — rest forwarding', () => {
	it('data-testid from rest lands on the range input', () => {
		const { container } = render(Slider, {
			name: 'x',
			label: 'X',
			'data-testid': 'my-slider'
		} as Record<string, unknown>);
		const el = container.querySelector('[data-testid="my-slider"]') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.classList.contains('hz-slider')).toBe(true);
	});

	it('type/min in rest lose to managed values', () => {
		const { container } = render(Slider, {
			name: 'x',
			label: 'X',
			min: 5,
			type: 'text'
		} as Record<string, unknown>);
		const range = getRange(container);
		expect(range.type).toBe('range');
		expect(range.min).toBe('5');
	});
});

// ---------------------------------------------------------------------------
// Slider-R7 — Barrel export
// ---------------------------------------------------------------------------

describe('Slider-R7 — barrel export', () => {
	it('Slider resolves from $lib and smoke-renders', async () => {
		const { Slider: S } = await import('$lib');
		expect(S).toBeDefined();
		const { container } = render(S, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-field--slider')).not.toBeNull();
	});
});
