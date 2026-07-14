import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RangeSlider from './RangeSlider.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function getMinThumb(container: HTMLElement): HTMLInputElement {
	return container.querySelector('input.hz-slider-min') as HTMLInputElement;
}

function getMaxThumb(container: HTMLElement): HTMLInputElement {
	return container.querySelector('input.hz-slider-max') as HTMLInputElement;
}

function getRow(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-slider-row') as HTMLElement;
}

/** Move a thumb and fire input (delegated event — must bubble). */
async function moveThumb(el: HTMLInputElement, raw: string): Promise<void> {
	el.value = raw;
	el.dispatchEvent(new Event('input', { bubbles: true }));
	await tick();
}

/** Commit a number field (delegated change event — must bubble). */
async function commitField(el: HTMLInputElement, raw: string): Promise<void> {
	el.value = raw;
	el.dispatchEvent(new Event('change', { bubbles: true }));
	await tick();
}

// ---------------------------------------------------------------------------
// Range-R1 — Structure
// ---------------------------------------------------------------------------

describe('Range-R1 — structure', () => {
	it('root is fieldset.hz-field.hz-field--slider.hz-field--slider-range with a legend', () => {
		const { container } = render(RangeSlider, { name: 'len', label: 'Hole length' });
		const root = container.querySelector(
			'fieldset.hz-field.hz-field--slider.hz-field--slider-range'
		) as HTMLElement;
		expect(root).not.toBeNull();
		const legend = root.querySelector('legend.hz-field-label') as HTMLElement;
		expect(legend.textContent?.trim()).toContain('Hole length');
	});

	it('two ranges with {name}-min/-max, thumb aria-labels, min/max/step reflected', () => {
		const { container } = render(RangeSlider, {
			name: 'len',
			label: 'Hole length',
			min: 100,
			max: 900,
			step: 10
		});
		const lo = getMinThumb(container);
		const hi = getMaxThumb(container);
		expect(lo.name).toBe('len-min');
		expect(hi.name).toBe('len-max');
		expect(lo.getAttribute('aria-label')).toBe('Hole length (minimum)');
		expect(hi.getAttribute('aria-label')).toBe('Hole length (maximum)');
		for (const el of [lo, hi]) {
			expect(el.type).toBe('range');
			expect(el.min).toBe('100');
			expect(el.max).toBe('900');
			expect(el.step).toBe('10');
		}
	});

	it('thumb labels are overridable', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			minThumbLabel: 'Shortest',
			maxThumbLabel: 'Longest'
		});
		expect(getMinThumb(container).getAttribute('aria-label')).toBe('Shortest');
		expect(getMaxThumb(container).getAttribute('aria-label')).toBe('Longest');
	});

	it('two number fields (no name) with derived aria-labels, plus the separator', () => {
		const { container } = render(RangeSlider, { name: 'x', label: 'Hole length' });
		const fields = container.querySelectorAll('input.hz-slider-number');
		expect(fields.length).toBe(2);
		for (const f of fields) expect(f.hasAttribute('name')).toBe(false);
		expect(fields[0].getAttribute('aria-label')).toBe('Hole length (minimum) (exact value)');
		expect(fields[1].getAttribute('aria-label')).toBe('Hole length (maximum) (exact value)');
		const sep = container.querySelector('.hz-slider-sep') as HTMLElement;
		expect(sep.getAttribute('aria-hidden')).toBe('true');
	});

	it('showInput=false: single aria-hidden readout "{min}–{max}"', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			valueMin: 20,
			valueMax: 60,
			showInput: false
		});
		expect(container.querySelector('input.hz-slider-number')).toBeNull();
		const readout = container.querySelector('.hz-slider-value') as HTMLElement;
		expect(readout.textContent).toBe('20–60');
		expect(readout.getAttribute('aria-hidden')).toBe('true');
	});

	it('row exposes chars and both fill fractions', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			min: 0,
			max: 200,
			valueMin: 50,
			valueMax: 150
		});
		const row = getRow(container);
		expect(row.style.getPropertyValue('--hz-slider-chars')).toBe('3');
		expect(row.style.getPropertyValue('--hz-slider-fill-start')).toBe('0.25');
		expect(row.style.getPropertyValue('--hz-slider-fill-end')).toBe('0.75');
	});

	it('ticks render in one aria-hidden container; out-of-range skipped; labels only for objects', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			min: 0,
			max: 100,
			ticks: [0, { value: 50, label: 'mid' }, 100, 150]
		});
		const ticksBox = container.querySelector('.hz-slider-ticks') as HTMLElement;
		expect(ticksBox.getAttribute('aria-hidden')).toBe('true');
		const marks = ticksBox.querySelectorAll('.hz-slider-tick');
		expect(marks.length).toBe(3); // 150 skipped
		expect((marks[1] as HTMLElement).style.getPropertyValue('--hz-tick-pos')).toBe('0.5');
		expect(marks[1].querySelector('.hz-slider-tick-label')?.textContent).toBe('mid');
		expect(marks[0].querySelector('.hz-slider-tick-label')).toBeNull();
		expect(getRow(container).hasAttribute('data-has-ticks')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Range-R2 — Binding & cross-clamp
// ---------------------------------------------------------------------------

describe('Range-R2 — binding and cross-clamp', () => {
	it('defaults to [min, max]', () => {
		const { container } = render(RangeSlider, { name: 'x', label: 'X', min: 10, max: 90 });
		expect(getMinThumb(container).value).toBe('10');
		expect(getMaxThumb(container).value).toBe('90');
	});

	it('min thumb dragged past max clamps at valueMax; partner unmoved', async () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			valueMin: 20,
			valueMax: 60
		});
		await moveThumb(getMinThumb(container), '80');
		expect(getMinThumb(container).value).toBe('60');
		expect(getMaxThumb(container).value).toBe('60');
	});

	it('max thumb dragged past min clamps at valueMin; partner unmoved', async () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			valueMin: 40,
			valueMax: 80
		});
		await moveThumb(getMaxThumb(container), '10');
		expect(getMaxThumb(container).value).toBe('40');
		expect(getMinThumb(container).value).toBe('40');
	});

	it('normal moves pass through and update the number fields', async () => {
		const { container } = render(RangeSlider, { name: 'x', label: 'X' });
		await moveThumb(getMinThumb(container), '25');
		const fields = container.querySelectorAll('input.hz-slider-number');
		expect((fields[0] as HTMLInputElement).value).toBe('25');
	});

	it('min field commit clamps to [min, valueMax] and snaps', async () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			min: 0,
			max: 100,
			step: 5,
			valueMin: 10,
			valueMax: 60
		});
		const fields = container.querySelectorAll('input.hz-slider-number');
		// 83 → snaps to 85 → clamps to partner 60
		await commitField(fields[0] as HTMLInputElement, '83');
		expect(getMinThumb(container).value).toBe('60');
		// 12 → snaps to 10
		await commitField(fields[0] as HTMLInputElement, '12');
		expect(getMinThumb(container).value).toBe('10');
	});

	it('max field commit clamps to [valueMin, max]', async () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			valueMin: 40,
			valueMax: 80
		});
		const fields = container.querySelectorAll('input.hz-slider-number');
		await commitField(fields[1] as HTMLInputElement, '5');
		expect(getMaxThumb(container).value).toBe('40');
	});

	it('empty entry restores without assignment', async () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			valueMin: 30,
			valueMax: 70
		});
		const fields = container.querySelectorAll('input.hz-slider-number');
		await commitField(fields[0] as HTMLInputElement, '');
		expect((fields[0] as HTMLInputElement).value).toBe('30');
		expect(getMinThumb(container).value).toBe('30');
	});
});

// ---------------------------------------------------------------------------
// Range-R3 — Overlap stacking
// ---------------------------------------------------------------------------

describe('Range-R3 — overlap stacking', () => {
	it('data-top="max" normally and on coincidence below the midpoint', () => {
		const { container } = render(RangeSlider, { name: 'x', label: 'X' });
		expect(getRow(container).getAttribute('data-top')).toBe('max');
		const { container: low } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			valueMin: 20,
			valueMax: 20
		});
		expect(getRow(low).getAttribute('data-top')).toBe('max');
	});

	it('data-top="min" on coincidence past the midpoint', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			valueMin: 90,
			valueMax: 90
		});
		expect(getRow(container).getAttribute('data-top')).toBe('min');
	});
});

// ---------------------------------------------------------------------------
// Range-R4 — ARIA
// ---------------------------------------------------------------------------

describe('Range-R4 — aria chain', () => {
	it('describedby chain and aria-invalid land on BOTH ranges', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		for (const el of [getMinThumb(container), getMaxThumb(container)]) {
			expect(el.getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
			expect(el.getAttribute('aria-invalid')).toBe('true');
		}
	});

	it('no aria-required; required renders the legend indicator only', () => {
		const { container } = render(RangeSlider, { name: 'x', label: 'X', required: true });
		expect(getMinThumb(container).hasAttribute('aria-required')).toBe(false);
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('error paragraph has role="alert"; data-state="error" wins over disabled', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			error: 'Bad',
			disabled: true
		});
		expect((container.querySelector('.hz-field-error') as HTMLElement).getAttribute('role')).toBe(
			'alert'
		);
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});
});

// ---------------------------------------------------------------------------
// Range-R5 — Disabled
// ---------------------------------------------------------------------------

describe('Range-R5 — disabled', () => {
	it('disables all four inputs natively', () => {
		const { container } = render(RangeSlider, { name: 'x', label: 'X', disabled: true });
		const inputs = container.querySelectorAll('input');
		expect(inputs.length).toBe(4);
		for (const el of inputs) expect((el as HTMLInputElement).disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Range-R6 — Rest forwarding
// ---------------------------------------------------------------------------

describe('Range-R6 — rest forwarding', () => {
	it('data-testid from rest lands on the fieldset', () => {
		const { container } = render(RangeSlider, {
			name: 'x',
			label: 'X',
			'data-testid': 'my-range'
		} as Record<string, unknown>);
		const el = container.querySelector('[data-testid="my-range"]') as HTMLElement;
		expect(el.tagName.toLowerCase()).toBe('fieldset');
	});

	it('class merges after the managed classes', () => {
		const { container } = render(RangeSlider, { name: 'x', label: 'X', class: 'foo' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('hz-field--slider-range');
		expect(classes).toContain('foo');
	});
});

// ---------------------------------------------------------------------------
// Range-R7 — Barrel export
// ---------------------------------------------------------------------------

describe('Range-R7 — barrel export', () => {
	it('RangeSlider resolves from $lib and smoke-renders', async () => {
		const { RangeSlider: R } = await import('$lib');
		expect(R).toBeDefined();
		const { container } = render(R, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-field--slider-range')).not.toBeNull();
	});
});
