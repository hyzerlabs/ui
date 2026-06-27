import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Textarea from './Textarea.svelte';

// ---------------------------------------------------------------------------
// Field-R1 — Wrapper + state
// ---------------------------------------------------------------------------

describe('Field-R1 — wrapper and state', () => {
	it('renders a root div with class hz-field', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X' });
		expect(container.querySelector('div.hz-field')).not.toBeNull();
	});

	it('data-state="default" by default', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'default'
		);
	});

	it('data-state="error" when error is set', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', error: 'Bad' });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(Textarea, {
			name: 'x',
			label: 'X',
			error: 'Bad',
			disabled: true
		});
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'error'
		);
	});

	it('data-state="disabled" when only disabled is set', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', disabled: true });
		expect((container.querySelector('.hz-field') as HTMLElement).getAttribute('data-state')).toBe(
			'disabled'
		);
	});
});

// ---------------------------------------------------------------------------
// Field-R2/R3/R4/R5/R6/R7 — Shared scaffold (spot-checked for Textarea)
// ---------------------------------------------------------------------------

describe('Field scaffold', () => {
	it('label always in DOM with for= pointing to textarea id', () => {
		const { container } = render(Textarea, { name: 'x', label: 'Notes' });
		const lbl = container.querySelector('label') as HTMLLabelElement;
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(lbl.textContent?.trim()).toContain('Notes');
		expect(lbl.htmlFor).toBe(ta.id);
	});

	it('hideLabel adds sr-only to label', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', hideLabel: true });
		expect((container.querySelector('label') as HTMLElement).classList.contains('sr-only')).toBe(
			true
		);
	});

	it('required: aria-required="true" on textarea + * span in label', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', required: true });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(ta.getAttribute('aria-required')).toBe('true');
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('description renders with hz-desc id', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', description: 'Help' });
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		expect(desc).not.toBeNull();
		expect(desc.id).toMatch(/^hz-desc-/);
	});

	it('error renders with role="alert" and hz-error id', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', error: 'Req' });
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(err.getAttribute('role')).toBe('alert');
		expect(err.id).toMatch(/^hz-error-/);
	});

	it('aria-describedby chains desc then error', () => {
		const { container } = render(Textarea, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		const descId = (container.querySelector('.hz-field-description') as HTMLElement).id;
		const errId = (container.querySelector('.hz-field-error') as HTMLElement).id;
		expect(ta.getAttribute('aria-describedby')).toBe(`${descId} ${errId}`);
	});

	it('no desc no error: aria-describedby absent', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X' });
		expect(
			(container.querySelector('textarea') as HTMLTextAreaElement).hasAttribute('aria-describedby')
		).toBe(false);
	});

	it('disabled: native disabled on textarea', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', disabled: true });
		expect((container.querySelector('textarea') as HTMLTextAreaElement).disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Textarea-R1 — Structure
// ---------------------------------------------------------------------------

describe('Textarea-R1 — structure', () => {
	it('renders a <textarea> with id, name, and rows', () => {
		const { container } = render(Textarea, { name: 'bio', label: 'Bio' });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(ta).not.toBeNull();
		expect(ta.id).toMatch(/^hz-input-/);
		expect(ta.name).toBe('bio');
		expect(ta.rows).toBe(3);
	});

	it('rows defaults to 3', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X' });
		expect((container.querySelector('textarea') as HTMLTextAreaElement).rows).toBe(3);
	});

	it('rows prop is applied', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', rows: 6 });
		expect((container.querySelector('textarea') as HTMLTextAreaElement).rows).toBe(6);
	});

	it('maxlength is applied only when defined', () => {
		const { container: c1 } = render(Textarea, { name: 'x', label: 'X', maxlength: 200 });
		expect(c1.querySelector('textarea')!.getAttribute('maxlength')).toBe('200');
		const { container: c2 } = render(Textarea, { name: 'x', label: 'X' });
		expect(c2.querySelector('textarea')!.hasAttribute('maxlength')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Textarea-R2 — Value binding
// ---------------------------------------------------------------------------

describe('Textarea-R2 — value binding', () => {
	it('initial value is empty string', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X' });
		expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('');
	});

	it('typing updates the textarea value', async () => {
		const { container } = render(Textarea, { name: 'x', label: 'X' });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		await userEvent.type(ta, 'hello');
		expect(ta.value).toBe('hello');
	});
});

// ---------------------------------------------------------------------------
// Textarea-R3 — Resize mapping
// ---------------------------------------------------------------------------

describe('Textarea-R3 — resize', () => {
	it('data-resize reflects the resize prop', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', resize: 'none' });
		expect(
			(container.querySelector('textarea') as HTMLTextAreaElement).getAttribute('data-resize')
		).toBe('none');
	});

	it('resize="none": computed CSS resize is none', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', resize: 'none' });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(getComputedStyle(ta).resize).toBe('none');
	});

	it('resize="vertical": computed CSS resize is vertical', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', resize: 'vertical' });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(getComputedStyle(ta).resize).toBe('vertical');
	});

	it('resize="both": computed CSS resize is both', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', resize: 'both' });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(getComputedStyle(ta).resize).toBe('both');
	});

	it('resize="auto": data-resize="auto" present', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', resize: 'auto' });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;
		expect(ta.getAttribute('data-resize')).toBe('auto');
	});

	it('resize="auto": JS fallback syncHeight runs on input when field-sizing unsupported', async () => {
		// Exercise the input handler path; height should be set to scrollHeight.
		const { container } = render(Textarea, { name: 'x', label: 'X', resize: 'auto' });
		const ta = container.querySelector('textarea') as HTMLTextAreaElement;

		if (!CSS.supports('field-sizing', 'content')) {
			// Type to trigger the fallback oninput
			await userEvent.type(ta, 'line1\nline2');
			expect(ta.style.height).toBeTruthy();
		} else {
			// field-sizing supported: CSS handles it, height style not set by JS
			expect(ta.getAttribute('data-resize')).toBe('auto');
		}
	});
});

// ---------------------------------------------------------------------------
// Forms-R1/R2 — Class + rest
// ---------------------------------------------------------------------------

describe('Forms-R1/R2 — class and rest', () => {
	it('no class: root exactly hz-field', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-field']);
	});

	it('class="foo": root has hz-field foo', () => {
		const { container } = render(Textarea, { name: 'x', label: 'X', class: 'foo' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('foo');
	});
});
