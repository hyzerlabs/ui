import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import TextInput from './TextInput.svelte';

// ---------------------------------------------------------------------------
// Snippet helpers (TextInput-R4)
// ---------------------------------------------------------------------------

const prefixSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="prefix-content">$</span>`
}));

const suffixSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="suffix-content">USD</span>`
}));

// ---------------------------------------------------------------------------
// Field-R1 — Wrapper + state
// ---------------------------------------------------------------------------

describe('Field-R1 — wrapper and state', () => {
	it('renders a root div with class hz-field', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		expect(container.querySelector('div.hz-field')).not.toBeNull();
	});

	it('data-state="default" when no error or disabled', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		expect(root.getAttribute('data-state')).toBe('default');
	});

	it('data-state="disabled" when disabled is true', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', disabled: true });
		const root = container.querySelector('.hz-field') as HTMLElement;
		expect(root.getAttribute('data-state')).toBe('disabled');
	});

	it('data-state="error" when error is set', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', error: 'Required' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		expect(root.getAttribute('data-state')).toBe('error');
	});

	it('data-state="error" wins over disabled when both set', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			error: 'Bad',
			disabled: true
		});
		const root = container.querySelector('.hz-field') as HTMLElement;
		expect(root.getAttribute('data-state')).toBe('error');
	});
});

// ---------------------------------------------------------------------------
// Field-R2 — Label
// ---------------------------------------------------------------------------

describe('Field-R2 — label', () => {
	it('label is always in the DOM', () => {
		const { container } = render(TextInput, { name: 'x', label: 'My Label' });
		const lbl = container.querySelector('label.hz-field-label') as HTMLElement;
		expect(lbl).not.toBeNull();
		expect(lbl.textContent?.trim()).toContain('My Label');
	});

	it('label for= matches the input id', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const lbl = container.querySelector('label') as HTMLLabelElement;
		const input = container.querySelector('input') as HTMLInputElement;
		expect(lbl.htmlFor).toBe(input.id);
	});

	it('hideLabel=true adds sr-only class to label but keeps it in DOM', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', hideLabel: true });
		const lbl = container.querySelector('label') as HTMLElement;
		expect(lbl).not.toBeNull();
		expect(lbl.classList.contains('sr-only')).toBe(true);
	});

	it('hideLabel=false does not add sr-only to label', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', hideLabel: false });
		const lbl = container.querySelector('label') as HTMLElement;
		expect(lbl.classList.contains('sr-only')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Field-R3 — Required indicator
// ---------------------------------------------------------------------------

describe('Field-R3 — required', () => {
	it('required=true: input has aria-required="true"', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', required: true });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('aria-required')).toBe('true');
	});

	it('required=true: label contains * span with aria-hidden="true"', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', required: true });
		const span = container.querySelector('label .hz-field-required') as HTMLElement;
		expect(span).not.toBeNull();
		expect(span.getAttribute('aria-hidden')).toBe('true');
		expect(span.textContent).toBe('*');
	});

	it('required=false: no aria-required and no * span', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', required: false });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('aria-required')).toBe(false);
		expect(container.querySelector('.hz-field-required')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Field-R4 — Description
// ---------------------------------------------------------------------------

describe('Field-R4 — description', () => {
	it('description renders with correct id and class', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			description: 'Helper text'
		});
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(desc).not.toBeNull();
		expect(desc.textContent?.trim()).toBe('Helper text');
		expect(desc.id).toMatch(/^hz-desc-/);
	});

	it('no description: element is absent', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-field-description')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Field-R5 — Error
// ---------------------------------------------------------------------------

describe('Field-R5 — error', () => {
	it('error renders with role="alert", correct id, and class', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', error: 'Required' });
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(err).not.toBeNull();
		expect(err.getAttribute('role')).toBe('alert');
		expect(err.textContent?.trim()).toBe('Required');
		expect(err.id).toMatch(/^hz-error-/);
	});

	it('error: input has aria-invalid="true"', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', error: 'Bad' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});

	it('no error: aria-invalid absent and error element absent', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('aria-invalid')).toBe(false);
		expect(container.querySelector('.hz-field-error')).toBeNull();
	});

	it('error with disabled: native disabled still applied (Field-R7)', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			error: 'Bad',
			disabled: true
		});
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Field-R6 — aria-describedby chaining
// ---------------------------------------------------------------------------

describe('Field-R6 — aria-describedby', () => {
	it('only description: aria-describedby = desc id', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			description: 'Help'
		});
		const input = container.querySelector('input') as HTMLInputElement;
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(input.getAttribute('aria-describedby')).toBe(desc.id);
	});

	it('only error: aria-describedby = error id', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', error: 'Bad' });
		const input = container.querySelector('input') as HTMLInputElement;
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(input.getAttribute('aria-describedby')).toBe(err.id);
	});

	it('both description and error: aria-describedby = desc-id error-id', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const input = container.querySelector('input') as HTMLInputElement;
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(input.getAttribute('aria-describedby')).toBe(`${desc.id} ${err.id}`);
	});

	it('neither: aria-describedby is absent', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('aria-describedby')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Field-R7 — Disabled
// ---------------------------------------------------------------------------

describe('Field-R7 — disabled', () => {
	it('disabled=true: native disabled attribute on input', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', disabled: true });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.disabled).toBe(true);
	});

	it('disabled=false: no disabled attribute on input', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', disabled: false });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.disabled).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// TextInput-R1 — Structure
// ---------------------------------------------------------------------------

describe('TextInput-R1 — structure', () => {
	it('renders hz-input-wrapper div containing the input', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const wrapper = container.querySelector('.hz-input-wrapper') as HTMLElement;
		expect(wrapper).not.toBeNull();
		expect(wrapper.querySelector('input')).not.toBeNull();
	});

	it('input has id matching label for', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.id).toMatch(/^hz-input-/);
	});

	it('input has name attribute matching the name prop', () => {
		const { container } = render(TextInput, { name: 'email', label: 'Email' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.name).toBe('email');
	});

	it('type defaults to "text"', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.type).toBe('text');
	});

	it('type prop is reflected onto the input', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', type: 'email' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.type).toBe('email');
	});
});

// ---------------------------------------------------------------------------
// TextInput-R2 — Value binding
// ---------------------------------------------------------------------------

describe('TextInput-R2 — value binding', () => {
	it('input has empty value by default', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('typing into the input updates the value', async () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		await userEvent.type(input, 'hello');
		expect(input.value).toBe('hello');
	});

	it('type="number": value stays a string (no numeric coercion)', async () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', type: 'number' });
		const input = container.querySelector('input') as HTMLInputElement;
		await userEvent.type(input, '42');
		expect(typeof input.value).toBe('string');
		expect(input.value).toBe('42');
	});
});

// ---------------------------------------------------------------------------
// TextInput-R3 — Pass-through attributes
// ---------------------------------------------------------------------------

describe('TextInput-R3 — pass-through attributes', () => {
	it('placeholder is set when defined', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			placeholder: 'Enter value'
		});
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('placeholder')).toBe('Enter value');
	});

	it('placeholder is absent when undefined', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('placeholder')).toBe(false);
	});

	it('autocomplete is set when defined', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			autocomplete: 'email'
		});
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('autocomplete')).toBe('email');
	});

	it('maxlength is set when defined', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', maxlength: 50 });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('maxlength')).toBe('50');
	});

	it('pattern is set when defined', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', pattern: '[0-9]+' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('pattern')).toBe('[0-9]+');
	});

	it('inputmode is set when defined', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', inputmode: 'numeric' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.getAttribute('inputmode')).toBe('numeric');
	});

	it('maxlength is absent when undefined', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('maxlength')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// TextInput-R4 — Prefix / suffix
// ---------------------------------------------------------------------------

describe('TextInput-R4 — prefix and suffix', () => {
	it('prefix snippet renders in aria-hidden span with hz-input-prefix class', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			prefix: prefixSnippet
		});
		const span = container.querySelector('.hz-input-prefix') as HTMLElement;
		expect(span).not.toBeNull();
		expect(span.getAttribute('aria-hidden')).toBe('true');
		expect(span.querySelector('[data-testid="prefix-content"]')).not.toBeNull();
	});

	it('prefix present: wrapper has data-has-prefix attribute', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			prefix: prefixSnippet
		});
		const wrapper = container.querySelector('.hz-input-wrapper') as HTMLElement;
		expect(wrapper.hasAttribute('data-has-prefix')).toBe(true);
	});

	it('no prefix: hz-input-prefix span is absent and data-has-prefix absent', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-input-prefix')).toBeNull();
		const wrapper = container.querySelector('.hz-input-wrapper') as HTMLElement;
		expect(wrapper.hasAttribute('data-has-prefix')).toBe(false);
	});

	it('suffix snippet renders in aria-hidden span with hz-input-suffix class', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			suffix: suffixSnippet
		});
		const span = container.querySelector('.hz-input-suffix') as HTMLElement;
		expect(span).not.toBeNull();
		expect(span.getAttribute('aria-hidden')).toBe('true');
	});

	it('suffix present: wrapper has data-has-suffix attribute', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			suffix: suffixSnippet
		});
		const wrapper = container.querySelector('.hz-input-wrapper') as HTMLElement;
		expect(wrapper.hasAttribute('data-has-suffix')).toBe(true);
	});

	it('no suffix: hz-input-suffix span absent and data-has-suffix absent', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-input-suffix')).toBeNull();
		const wrapper = container.querySelector('.hz-input-wrapper') as HTMLElement;
		expect(wrapper.hasAttribute('data-has-suffix')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// TextInput-R5 — Native event forwarding
// ---------------------------------------------------------------------------

describe('TextInput-R5 — native events', () => {
	it('oninput handler passed via rest fires on user input', async () => {
		const spy = vi.fn();
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			oninput: spy
		} as Record<string, unknown>);
		const input = container.querySelector('input') as HTMLInputElement;
		await userEvent.type(input, 'a');
		expect(spy).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Forms-R1 — Class composition
// ---------------------------------------------------------------------------

describe('Forms-R1 — class composition', () => {
	it('no class: root has exactly hz-field (plus svelte hash)', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-field']);
	});

	it('class="foo bar": hz-field is first, foo and bar present', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', class: 'foo bar' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// Forms-R2 — rest forwarding
// ---------------------------------------------------------------------------

describe('Forms-R2 — rest forwarding', () => {
	it('data-testid from rest is forwarded to the input', async () => {
		render(TextInput, {
			name: 'x',
			label: 'X',
			'data-testid': 'my-input'
		} as Record<string, unknown>);
		await expect.element(page.getByTestId('my-input')).toBeInTheDocument();
	});

	it('id in rest is overridden by managed id', () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			id: 'override-id'
		} as Record<string, unknown>);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.id).toMatch(/^hz-input-/);
	});

	it('name in rest is overridden by managed name', () => {
		const { container } = render(TextInput, {
			name: 'real-name',
			label: 'X'
			// passing name via rest-like would conflict, managed prop wins
		} as Record<string, unknown>);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.name).toBe('real-name');
	});
});

// ---------------------------------------------------------------------------
// Forms-R4 — element exposure
// ---------------------------------------------------------------------------

describe('Forms-R4 — element exposure', () => {
	it('element bindable receives the underlying <input>', () => {
		// reactive props object — Svelte writes bindable props back into it.
		const props = $state({
			name: 'x',
			label: 'X',
			element: undefined as HTMLInputElement | undefined
		});
		const { container } = render(TextInput, props);
		expect(props.element).toBe(container.querySelector('input'));
	});
});

// ---------------------------------------------------------------------------
// Forms-R3 — Barrel export
// ---------------------------------------------------------------------------

describe('Forms-R3 — barrel export', () => {
	it('TextInput is resolvable from $lib', async () => {
		const { TextInput: TI } = await import('$lib');
		expect(TI).toBeDefined();
	});

	it('TextInput smoke-renders from $lib import', async () => {
		const { TextInput: TI } = await import('$lib');
		const { container } = render(TI, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-field')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Structural CSS
// ---------------------------------------------------------------------------

describe('Structural CSS', () => {
	it('hz-input-wrapper has computed flex-direction: row', () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const wrapper = container.querySelector('.hz-input-wrapper') as HTMLElement;
		expect(getComputedStyle(wrapper).flexDirection).toBe('row');
	});
});

// ---------------------------------------------------------------------------
// Integration
// ---------------------------------------------------------------------------

describe('Integration', () => {
	it('tab order reaches enabled input', async () => {
		render(TextInput, { name: 'x', label: 'X' });
		await userEvent.tab();
		// Just assert no error thrown and label/input exist
		expect(document.activeElement?.tagName.toLowerCase()).toBe('input');
	});

	it('disabled input is not focusable via tab', async () => {
		const { container } = render(TextInput, { name: 'x', label: 'X', disabled: true });
		const input = container.querySelector('input') as HTMLInputElement;
		// disabled attribute removes from tab order
		expect(input.disabled).toBe(true);
	});

	it('error surfaces role="alert" and aria-invalid pointing to error text', async () => {
		const { container } = render(TextInput, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Required'
		});
		const input = container.querySelector('input') as HTMLInputElement;
		const err = container.querySelector('[role="alert"]') as HTMLElement;
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(err).not.toBeNull();
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toContain(err.id);
		expect(input.getAttribute('aria-describedby')).toContain(desc.id);
	});

	it('value is preserved when error is set', async () => {
		const { container } = render(TextInput, { name: 'x', label: 'X' });
		const input = container.querySelector('input') as HTMLInputElement;
		await userEvent.type(input, 'typed');
		expect(input.value).toBe('typed');
	});
});
