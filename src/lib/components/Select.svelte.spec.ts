import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SelectOption } from '$lib/types';
import Select from './Select.svelte';

// ---------------------------------------------------------------------------
// Sample options
// ---------------------------------------------------------------------------

const flatOptions: SelectOption[] = [
	{ value: 'a', label: 'Option A' },
	{ value: 'b', label: 'Option B' },
	{ value: 'c', label: 'Option C', disabled: true }
];

const groupedOptions: SelectOption[] = [
	{ value: 'x', label: 'Plain X' },
	{
		group: 'My Group',
		options: [
			{ value: 'g1', label: 'Group 1' },
			{ value: 'g2', label: 'Group 2', disabled: true }
		]
	}
];

// ---------------------------------------------------------------------------
// Field-R1/R2/R3/R4/R5/R6/R7 — Shared scaffold
// ---------------------------------------------------------------------------

describe('Field scaffold', () => {
	it('root is div.hz-field with data-state="default"', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		const root = container.querySelector('div.hz-field') as HTMLElement;
		expect(root).not.toBeNull();
		expect(root.getAttribute('data-state')).toBe('default');
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(Select, {
			name: 'x',
			label: 'X',
			options: [],
			error: 'Bad',
			disabled: true
		});
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});

	it('label for= matches select id', () => {
		const { container } = render(Select, { name: 'x', label: 'Pick', options: flatOptions });
		const lbl = container.querySelector('label') as HTMLLabelElement;
		const sel = container.querySelector('select') as HTMLSelectElement;
		expect(lbl.htmlFor).toBe(sel.id);
	});

	it('hideLabel adds sr-only', () => {
		const { container } = render(Select, {
			name: 'x',
			label: 'X',
			options: [],
			hideLabel: true
		});
		expect((container.querySelector('label') as HTMLElement).classList.contains('sr-only')).toBe(
			true
		);
	});

	it('required: aria-required="true" and * span', () => {
		const { container } = render(Select, {
			name: 'x',
			label: 'X',
			options: [],
			required: true
		});
		const sel = container.querySelector('select') as HTMLSelectElement;
		expect(sel.getAttribute('aria-required')).toBe('true');
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('description renders with hz-desc id', () => {
		const { container } = render(Select, {
			name: 'x',
			label: 'X',
			options: [],
			description: 'Help'
		});
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(desc.id).toMatch(/^hz-desc-/);
	});

	it('error renders with role="alert" and aria-invalid on select', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: [], error: 'Req' });
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		const sel = container.querySelector('select') as HTMLSelectElement;
		expect(err.getAttribute('role')).toBe('alert');
		expect(sel.getAttribute('aria-invalid')).toBe('true');
	});

	it('aria-describedby chains desc then error', () => {
		const { container } = render(Select, {
			name: 'x',
			label: 'X',
			options: [],
			description: 'Help',
			error: 'Bad'
		});
		const sel = container.querySelector('select') as HTMLSelectElement;
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		expect(sel.getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
	});

	it('disabled: native disabled on select', () => {
		const { container } = render(Select, {
			name: 'x',
			label: 'X',
			options: [],
			disabled: true
		});
		expect((container.querySelector('select') as HTMLSelectElement).disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Select-R1 — Native element
// ---------------------------------------------------------------------------

describe('Select-R1 — native select', () => {
	it('renders a native <select> with id and name', () => {
		const { container } = render(Select, { name: 'color', label: 'Color', options: flatOptions });
		const sel = container.querySelector('select') as HTMLSelectElement;
		expect(sel).not.toBeNull();
		expect(sel.id).toMatch(/^hz-input-/);
		expect(sel.name).toBe('color');
	});

	it('initial value is empty string', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		expect((container.querySelector('select') as HTMLSelectElement).value).toBe('');
	});
});

// ---------------------------------------------------------------------------
// Select-R2 — Placeholder option
// ---------------------------------------------------------------------------

describe('Select-R2 — placeholder', () => {
	it('placeholder option is the first option with value=""', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		const first = container.querySelector('select option') as HTMLOptionElement;
		expect(first.value).toBe('');
		expect(first.disabled).toBe(true);
	});

	it('default placeholder text is "Select..."', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		const first = container.querySelector('select option') as HTMLOptionElement;
		expect(first.textContent?.trim()).toBe('Select...');
	});

	it('custom placeholder text is used', () => {
		const { container } = render(Select, {
			name: 'x',
			label: 'X',
			options: flatOptions,
			placeholder: 'Choose one'
		});
		const first = container.querySelector('select option') as HTMLOptionElement;
		expect(first.textContent?.trim()).toBe('Choose one');
	});

	it('placeholder is selected while value is empty', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		const sel = container.querySelector('select') as HTMLSelectElement;
		expect(sel.value).toBe('');
		const placeholder = sel.querySelector('option[value=""]') as HTMLOptionElement;
		expect(placeholder.selected).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Select-R3 — Options and optgroups
// ---------------------------------------------------------------------------

describe('Select-R3 — options and optgroups', () => {
	it('flat options render in array order', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		const options = Array.from(
			container.querySelectorAll<HTMLOptionElement>('select option:not([value=""])')
		);
		expect(options[0].value).toBe('a');
		expect(options[1].value).toBe('b');
		expect(options[2].value).toBe('c');
	});

	it('disabled option renders as non-selectable', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		const disabledOpt = container.querySelector<HTMLOptionElement>('option[value="c"]')!;
		expect(disabledOpt.disabled).toBe(true);
	});

	it('optgroup renders with correct label and nested options', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: groupedOptions });
		const group = container.querySelector('optgroup') as HTMLOptGroupElement;
		expect(group).not.toBeNull();
		expect(group.getAttribute('label')).toBe('My Group');
		const groupOpts = Array.from(group.querySelectorAll('option'));
		expect(groupOpts[0].value).toBe('g1');
		expect(groupOpts[1].value).toBe('g2');
		expect(groupOpts[1].disabled).toBe(true);
	});

	it('mixed flat + optgroup renders in array order', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: groupedOptions });
		const plainOpt = container.querySelector<HTMLOptionElement>('option[value="x"]')!;
		expect(plainOpt).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Select value binding
// ---------------------------------------------------------------------------

describe('Select value binding', () => {
	it('selecting an option updates value away from placeholder', async () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: flatOptions });
		const sel = container.querySelector('select') as HTMLSelectElement;
		await userEvent.selectOptions(sel, 'a');
		expect(sel.value).toBe('a');
	});
});

// ---------------------------------------------------------------------------
// Forms-R1 — Class composition
// ---------------------------------------------------------------------------

describe('Forms-R1 — class composition', () => {
	it('no class: root exactly hz-field', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: [] });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-field']);
	});

	it('class="foo": hz-field foo', () => {
		const { container } = render(Select, { name: 'x', label: 'X', options: [], class: 'foo' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('foo');
	});
});

// ---------------------------------------------------------------------------
// Forms-R3 — Barrel export
// ---------------------------------------------------------------------------

describe('Forms-R3 — barrel export', () => {
	it('Select is resolvable from $lib', async () => {
		const { Select: S } = await import('$lib');
		expect(S).toBeDefined();
	});
});
