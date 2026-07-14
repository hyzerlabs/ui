import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { FormOption } from '$lib/types';
import RadioGroup from './RadioGroup.svelte';

// ---------------------------------------------------------------------------
// Sample options
// ---------------------------------------------------------------------------

const opts: FormOption[] = [
	{ value: 'a', label: 'Option A' },
	{ value: 'b', label: 'Option B' },
	{ value: 'c', label: 'Option C' }
];

const withDisabled: FormOption[] = [
	{ value: 'a', label: 'A' },
	{ value: 'b', label: 'B', disabled: true },
	{ value: 'c', label: 'C' }
];

// ---------------------------------------------------------------------------
// Field-R1 — Wrapper (fieldset)
// ---------------------------------------------------------------------------

describe('Field-R1 — fieldset root', () => {
	it('root is fieldset.hz-field.hz-field--radio-group', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const root = container.querySelector('fieldset.hz-field.hz-field--radio-group') as HTMLElement;
		expect(root).not.toBeNull();
	});

	it('data-state="default" by default', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		expect((container.querySelector('fieldset') as HTMLElement).getAttribute('data-state')).toBe(
			'default'
		);
	});

	it('data-state="error" when error set', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			error: 'Pick one'
		});
		expect((container.querySelector('fieldset') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			error: 'Bad',
			disabled: true
		});
		expect((container.querySelector('fieldset') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});

	it('data-state="disabled" when only disabled', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			disabled: true
		});
		expect((container.querySelector('fieldset') as HTMLElement).getAttribute('data-state')).toBe(
			'disabled'
		);
	});

	it('data-orientation="vertical" by default', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		expect(
			(container.querySelector('fieldset') as HTMLElement).getAttribute('data-orientation')
		).toBe('vertical');
	});

	it('data-orientation="horizontal" when orientation="horizontal"', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			orientation: 'horizontal'
		});
		expect(
			(container.querySelector('fieldset') as HTMLElement).getAttribute('data-orientation')
		).toBe('horizontal');
	});
});

// ---------------------------------------------------------------------------
// Field-R2 — Legend (label)
// ---------------------------------------------------------------------------

describe('Field-R2 — legend', () => {
	it('legend.hz-field-label always in DOM', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'Favourite', options: [] });
		const legend = container.querySelector('legend.hz-field-label') as HTMLElement;
		expect(legend).not.toBeNull();
		expect(legend.textContent?.trim()).toContain('Favourite');
	});

	it('hideLabel adds sr-only to legend', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: [],
			hideLabel: true
		});
		expect((container.querySelector('legend') as HTMLElement).classList.contains('sr-only')).toBe(
			true
		);
	});
});

// ---------------------------------------------------------------------------
// Field-R3/R4/R5/R6/R7 — Required / desc / error / aria / disabled
// ---------------------------------------------------------------------------

describe('Field scaffold', () => {
	it('required: * span in legend + aria-required on the radiogroup', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			required: true
		});
		expect(container.querySelector('legend .hz-field-required')).not.toBeNull();
		// aria-required belongs on the radiogroup container, not individual radios.
		const rg = container.querySelector('[role="radiogroup"]') as HTMLElement;
		expect(rg.getAttribute('aria-required')).toBe('true');
	});

	it('description renders with hz-desc id', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: [],
			description: 'Help'
		});
		expect((container.querySelector('.hz-field-description') as HTMLElement).id).toMatch(
			/^hz-desc-/
		);
	});

	it('error renders with role="alert"', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: [], error: 'Pick' });
		expect((container.querySelector('.hz-field-error') as HTMLElement).getAttribute('role')).toBe(
			'alert'
		);
	});

	it('error: aria-invalid on the radiogroup', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: [], error: 'Pick' });
		const rg = container.querySelector('[role="radiogroup"]') as HTMLElement;
		expect(rg.getAttribute('aria-invalid')).toBe('true');
	});

	it('no error: aria-invalid absent', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: [] });
		const rg = container.querySelector('[role="radiogroup"]') as HTMLElement;
		expect(rg.hasAttribute('aria-invalid')).toBe(false);
	});

	it('aria-describedby on radiogroup chains desc then error', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: [],
			description: 'Help',
			error: 'Bad'
		});
		const rg = container.querySelector('[role="radiogroup"]') as HTMLElement;
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		expect(rg.getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
	});

	it('neither desc nor error: aria-describedby absent on radiogroup', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: [] });
		const rg = container.querySelector('[role="radiogroup"]') as HTMLElement;
		expect(rg.hasAttribute('aria-describedby')).toBe(false);
	});

	it('group disabled: every radio gets native disabled', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			disabled: true
		});
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		radios.forEach((r) => expect(r.disabled).toBe(true));
	});
});

// ---------------------------------------------------------------------------
// RadioGroup-R1 — Structure
// ---------------------------------------------------------------------------

describe('RadioGroup-R1 — structure', () => {
	it('div.hz-radio-options with role="radiogroup" present', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const rg = container.querySelector('div.hz-radio-options[role="radiogroup"]') as HTMLElement;
		expect(rg).not.toBeNull();
	});

	it('empty options: fieldset and legend render, empty radiogroup, no error', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: [] });
		expect(container.querySelector('fieldset')).not.toBeNull();
		expect(container.querySelector('legend')).not.toBeNull();
		expect(container.querySelectorAll('input[type="radio"]').length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// RadioGroup-R2 — Options
// ---------------------------------------------------------------------------

describe('RadioGroup-R2 — options', () => {
	it('renders one div.hz-radio-option per option', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		expect(container.querySelectorAll('.hz-radio-option').length).toBe(3);
	});

	it('each option has input then label in DOM order', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const option = container.querySelector('.hz-radio-option') as HTMLElement;
		const children = Array.from(option.children);
		expect(children[0].tagName).toBe('INPUT');
		expect(children[1].tagName).toBe('LABEL');
	});

	it('each radio id matches its label for=', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const pairs = Array.from(container.querySelectorAll('.hz-radio-option'));
		pairs.forEach((pair) => {
			const input = pair.querySelector('input') as HTMLInputElement;
			const label = pair.querySelector('label') as HTMLLabelElement;
			expect(label.htmlFor).toBe(input.id);
		});
	});

	it('radio ids are hz-radio-{uid}-{i} format', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		radios.forEach((r) => expect(r.id).toMatch(/^hz-radio-/));
	});

	it('per-option disabled applies native disabled to only that radio', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: withDisabled
		});
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		expect(radios[0].disabled).toBe(false);
		expect(radios[1].disabled).toBe(true);
		expect(radios[2].disabled).toBe(false);
	});

	it('options render in array order', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		expect(radios[0].value).toBe('a');
		expect(radios[1].value).toBe('b');
		expect(radios[2].value).toBe('c');
	});
});

// ---------------------------------------------------------------------------
// RadioGroup-R3 — Value binding
// ---------------------------------------------------------------------------

describe('RadioGroup-R3 — value binding', () => {
	it('initial value is empty string (no radio selected)', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		radios.forEach((r) => expect(r.checked).toBe(false));
	});

	it('clicking a radio checks it and updates value', async () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		await userEvent.click(radios[1]);
		expect(radios[1].checked).toBe(true);
		expect(radios[0].checked).toBe(false);
	});

	it('clicking a different radio deselects the previous', async () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: opts });
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		await userEvent.click(radios[0]);
		await userEvent.click(radios[2]);
		expect(radios[0].checked).toBe(false);
		expect(radios[2].checked).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// RadioGroup-R4 — Arrow keys (native behavior)
// ---------------------------------------------------------------------------

describe('RadioGroup-R4 — native arrow key navigation', () => {
	it('all radios share the same name for native roving', () => {
		const { container } = render(RadioGroup, { name: 'color', label: 'Color', options: opts });
		const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
		radios.forEach((r) => expect(r.name).toBe('color'));
	});
});

// ---------------------------------------------------------------------------
// Structural CSS — orientation
// ---------------------------------------------------------------------------

describe('Structural CSS — orientation', () => {
	it('vertical: hz-radio-options flex-direction is column', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			orientation: 'vertical'
		});
		const rg = container.querySelector('.hz-radio-options') as HTMLElement;
		expect(getComputedStyle(rg).flexDirection).toBe('column');
	});

	it('horizontal: hz-radio-options flex-direction is row', () => {
		const { container } = render(RadioGroup, {
			name: 'x',
			label: 'X',
			options: opts,
			orientation: 'horizontal'
		});
		const rg = container.querySelector('.hz-radio-options') as HTMLElement;
		expect(getComputedStyle(rg).flexDirection).toBe('row');
	});
});

// ---------------------------------------------------------------------------
// Forms-R1 — Class composition
// ---------------------------------------------------------------------------

describe('Forms-R1 — class composition', () => {
	it('no class: root has hz-field and hz-field--radio-group', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: [] });
		const root = container.querySelector('fieldset') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toContain('hz-field');
		expect(classes).toContain('hz-field--radio-group');
	});

	it('class="foo": hz-field hz-field--radio-group foo', () => {
		const { container } = render(RadioGroup, { name: 'x', label: 'X', options: [], class: 'foo' });
		const root = container.querySelector('fieldset') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('hz-field--radio-group');
		expect(classes).toContain('foo');
	});
});

// ---------------------------------------------------------------------------
// Forms-R3 — Barrel export
// ---------------------------------------------------------------------------

describe('Forms-R3 — barrel export', () => {
	it('RadioGroup is resolvable from $lib', async () => {
		const { RadioGroup: RG } = await import('$lib');
		expect(RG).toBeDefined();
	});
});
