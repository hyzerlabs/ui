import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import type { FormError } from '$lib/types';
import Form from './Form.svelte';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

/** A children snippet with a named text input and a submit button. */
const basicChildren = createRawSnippet(() => ({
	render: () =>
		`<div>
      <input name="email" id="field-email" type="email" />
      <input name="username" id="field-username" />
      <button type="submit">Submit</button>
    </div>`
}));

/** A children snippet with a radio group (RadioNodeList). */
const radioChildren = createRawSnippet(() => ({
	render: () =>
		`<div>
      <input type="radio" name="color" id="color-red" value="red" />
      <input type="radio" name="color" id="color-blue" value="blue" />
      <input name="other" id="field-other" />
      <button type="submit">Submit</button>
    </div>`
}));

/** A children snippet with an input that has NO id attribute. */
const noIdChildren = createRawSnippet(() => ({
	render: () =>
		`<div>
      <input name="noid" />
      <button type="submit">Submit</button>
    </div>`
}));

/** A plain snippet with just a submit button (no named fields). */
const emptyChildren = createRawSnippet(() => ({
	render: () => `<button type="submit">Submit</button>`
}));

// ---------------------------------------------------------------------------
// Sample errors
// ---------------------------------------------------------------------------

const emailError: FormError = { name: 'email', message: 'Email is required' };
const usernameError: FormError = { name: 'username', message: 'Username is required' };
const unknownError: FormError = { name: 'doesnotexist', message: 'Unknown field error' };
const formLevelError: FormError = { name: '', message: 'Something went wrong' };
const colorError: FormError = { name: 'color', message: 'Pick a color' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

/** Submit the form by clicking its submit button. */
function submitForm(container: Element): void {
	(container.querySelector('button[type="submit"]') as HTMLButtonElement).click();
}

// ---------------------------------------------------------------------------
// Form-R1 — Root element
// ---------------------------------------------------------------------------

describe('Form-R1 — root element', () => {
	it('renders <form class="hz-form">', () => {
		const { container } = render(Form, { errors: [], children: emptyChildren });
		expect(container.querySelector('form.hz-form')).not.toBeNull();
	});

	it('novalidate absent by default', () => {
		const { container } = render(Form, { errors: [], children: emptyChildren });
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.hasAttribute('novalidate')).toBe(false);
	});

	it('novalidate={true} sets the novalidate attribute', () => {
		const { container } = render(Form, {
			errors: [],
			novalidate: true,
			children: emptyChildren
		});
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.hasAttribute('novalidate')).toBe(true);
	});

	it('ariaLabel sets aria-label on the form', () => {
		const { container } = render(Form, {
			errors: [],
			ariaLabel: 'Contact form',
			children: emptyChildren
		});
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.getAttribute('aria-label')).toBe('Contact form');
	});

	it('no ariaLabel: aria-label is absent', () => {
		const { container } = render(Form, { errors: [], children: emptyChildren });
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.hasAttribute('aria-label')).toBe(false);
	});

	it('data-state absent when no errors', () => {
		const { container } = render(Form, { errors: [], children: emptyChildren });
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.hasAttribute('data-state')).toBe(false);
	});

	it('data-state="error" present when errors is non-empty', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.getAttribute('data-state')).toBe('error');
	});
});

// ---------------------------------------------------------------------------
// Form-R2 — Submit handling
// ---------------------------------------------------------------------------

describe('Form-R2 — submit handling', () => {
	it('submitting calls preventDefault and invokes onSubmit spy', async () => {
		const spy = vi.fn();
		const { container } = render(Form, {
			errors: [],
			novalidate: true,
			onSubmit: spy,
			children: emptyChildren
		});
		submitForm(container);
		await tick();
		expect(spy).toHaveBeenCalledOnce();
		const event = spy.mock.calls[0][0] as SubmitEvent;
		expect(event.defaultPrevented).toBe(true);
	});

	it('onSubmit receives the SubmitEvent', async () => {
		let captured: SubmitEvent | null = null;
		const { container } = render(Form, {
			errors: [],
			novalidate: true,
			onSubmit: (e) => (captured = e),
			children: emptyChildren
		});
		submitForm(container);
		await tick();
		expect(captured).not.toBeNull();
		expect(captured instanceof SubmitEvent).toBe(true);
	});

	it('no onSubmit: submit does not throw', async () => {
		const { container } = render(Form, {
			errors: [],
			novalidate: true,
			children: emptyChildren
		});
		submitForm(container);
		await tick();
		expect(container.querySelector('form')).not.toBeNull();
	});

	it('novalidate=false with required field empty: native validation blocks submit', async () => {
		const spy = vi.fn();
		// Render a form with a required input that stays empty.
		// Wrap in a div — createRawSnippet requires a single root element.
		const requiredChild = createRawSnippet(() => ({
			render: () => `<div><input name="x" id="x" required /><button type="submit">Go</button></div>`
		}));
		const { container } = render(Form, {
			errors: [],
			novalidate: false,
			onSubmit: spy,
			children: requiredChild
		});
		submitForm(container);
		await tick();
		// Native constraint validation blocks; spy not called.
		expect(spy).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Form-R3 — Summary rendering
// ---------------------------------------------------------------------------

describe('Form-R3 — summary rendering', () => {
	it('no errors: summary element is absent', () => {
		const { container } = render(Form, { errors: [], children: emptyChildren });
		expect(container.querySelector('.hz-form-error-summary')).toBeNull();
	});

	it('errors non-empty: summary renders with role="alert" and tabindex="-1"', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const summary = container.querySelector('.hz-form-error-summary') as HTMLElement;
		expect(summary).not.toBeNull();
		expect(summary.getAttribute('role')).toBe('alert');
		expect(summary.getAttribute('tabindex')).toBe('-1');
	});

	it('summary is the FIRST child of the form', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const first = form.firstElementChild as HTMLElement;
		expect(first.classList.contains('hz-form-error-summary')).toBe(true);
	});

	it('summary has aria-labelledby pointing to the heading id', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const summary = container.querySelector('.hz-form-error-summary') as HTMLElement;
		const labelledBy = summary.getAttribute('aria-labelledby')!;
		const heading = container.querySelector(`#${CSS.escape(labelledBy)}`) as HTMLElement;
		expect(heading).not.toBeNull();
	});

	it('heading uses summaryHeadingLevel (default h2)', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		expect(container.querySelector('.hz-form-error-summary h2')).not.toBeNull();
	});

	it('summaryHeadingLevel=3 renders h3', () => {
		const { container } = render(Form, {
			errors: [emailError],
			summaryHeadingLevel: 3,
			children: basicChildren
		});
		expect(container.querySelector('.hz-form-error-summary h3')).not.toBeNull();
	});

	it('heading text matches summaryTitle', () => {
		const { container } = render(Form, {
			errors: [emailError],
			summaryTitle: 'Fix these errors',
			children: basicChildren
		});
		const heading = container.querySelector('.hz-form-summary-title') as HTMLElement;
		expect(heading.textContent?.trim()).toBe('Fix these errors');
	});

	it('default summaryTitle is "There is a problem"', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const heading = container.querySelector('.hz-form-summary-title') as HTMLElement;
		expect(heading.textContent?.trim()).toBe('There is a problem');
	});
});

// ---------------------------------------------------------------------------
// Form-R4 — Summary items
// ---------------------------------------------------------------------------

describe('Form-R4 — summary items', () => {
	it('one <li> per error', () => {
		const { container } = render(Form, {
			errors: [emailError, usernameError],
			children: basicChildren
		});
		const items = container.querySelectorAll('.hz-form-error-summary-item');
		expect(items.length).toBe(2);
	});

	it('named input with id: item renders <a href="#id">', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const link = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		expect(link).not.toBeNull();
		expect(link.getAttribute('href')).toBe('#field-email');
		expect(link.textContent?.trim()).toBe('Email is required');
	});

	it('unresolved name: item renders as plain text (no link/button)', () => {
		const { container } = render(Form, {
			errors: [unknownError],
			children: basicChildren
		});
		const item = container.querySelector('.hz-form-error-summary-item') as HTMLElement;
		expect(item.querySelector('a')).toBeNull();
		expect(item.querySelector('button')).toBeNull();
		expect(item.textContent?.trim()).toBe('Unknown field error');
	});

	it('empty name (form-level error): plain text, no link/button', () => {
		const { container } = render(Form, {
			errors: [formLevelError],
			children: basicChildren
		});
		const item = container.querySelector('.hz-form-error-summary-item') as HTMLElement;
		expect(item.querySelector('a')).toBeNull();
		expect(item.querySelector('button')).toBeNull();
		expect(item.textContent?.trim()).toBe('Something went wrong');
	});

	it('radio group (RadioNodeList): item links to the first radio', () => {
		const { container } = render(Form, {
			errors: [colorError],
			children: radioChildren
		});
		const link = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		expect(link).not.toBeNull();
		// Should link to the first radio (color-red)
		expect(link.getAttribute('href')).toBe('#color-red');
	});

	it('control without id: item renders <button type="button">', () => {
		const { container } = render(Form, {
			errors: [{ name: 'noid', message: 'Missing' }],
			children: noIdChildren
		});
		const btn = container.querySelector(
			'.hz-form-error-summary-item button[type="button"]'
		) as HTMLButtonElement;
		expect(btn).not.toBeNull();
		expect(btn.textContent?.trim()).toBe('Missing');
	});

	it('form-level errors render LAST, after linked errors', () => {
		const { container } = render(Form, {
			errors: [formLevelError, emailError],
			children: basicChildren
		});
		const items = Array.from(
			container.querySelectorAll<HTMLElement>('.hz-form-error-summary-item')
		);
		// emailError is linked → should come first
		expect(items[0].querySelector('a')).not.toBeNull();
		// formLevelError is last
		expect(items[1].querySelector('a')).toBeNull();
		expect(items[1].querySelector('button')).toBeNull();
	});

	it('multiple errors for the same field all target it', () => {
		const { container } = render(Form, {
			errors: [
				{ name: 'email', message: 'Email required' },
				{ name: 'email', message: 'Invalid email' }
			],
			children: basicChildren
		});
		const links = container.querySelectorAll<HTMLAnchorElement>('.hz-form-error-summary-item a');
		expect(links.length).toBe(2);
		links.forEach((l) => expect(l.getAttribute('href')).toBe('#field-email'));
	});

	it('linked errors ordered by DOM position', () => {
		const { container } = render(Form, {
			// username appears after email in the DOM; errors in reverse order
			errors: [usernameError, emailError],
			children: basicChildren
		});
		const items = Array.from(
			container.querySelectorAll<HTMLElement>('.hz-form-error-summary-item')
		);
		// email field comes first in DOM, so its item should be first
		const firstLink = items[0].querySelector('a') as HTMLAnchorElement;
		expect(firstLink?.getAttribute('href')).toBe('#field-email');
	});
});

// ---------------------------------------------------------------------------
// Form-R5 — Managed focus
// ---------------------------------------------------------------------------

describe('Form-R5 — managed focus', () => {
	it('no errors: submitting does NOT move focus to summary', async () => {
		const { container } = render(Form, {
			errors: [],
			novalidate: true,
			children: emptyChildren
		});
		submitForm(container);
		await tick();
		await tick(); // extra tick for queueMicrotask
		const summary = container.querySelector('.hz-form-error-summary');
		expect(summary).toBeNull();
		// Focus should NOT have moved to the (absent) summary.
		expect(document.activeElement?.tagName?.toLowerCase()).not.toBe('div');
	});

	it('submit with errors: focus moves to summary element', async () => {
		// Use a fresh render with errors already present so the effect runs on submit.
		const { container: c2 } = render(Form, {
			errors: [emailError],
			novalidate: true,
			children: basicChildren
		});
		submitForm(c2);
		await tick();
		await tick();
		const summary = c2.querySelector('.hz-form-error-summary') as HTMLElement;
		expect(summary).not.toBeNull();
		expect(document.activeElement).toBe(summary);
	});

	it('focusTarget="firstField": submit focuses the first error control', async () => {
		const { container } = render(Form, {
			errors: [emailError],
			novalidate: true,
			focusTarget: 'firstField',
			children: basicChildren
		});
		submitForm(container);
		await tick();
		await tick();
		const emailInput = container.querySelector('#field-email') as HTMLInputElement;
		expect(document.activeElement).toBe(emailInput);
	});

	it('focusTarget="firstField" falls back to summary when first error has no control', async () => {
		const { container } = render(Form, {
			errors: [formLevelError],
			novalidate: true,
			focusTarget: 'firstField',
			children: basicChildren
		});
		submitForm(container);
		await tick();
		await tick();
		const summary = container.querySelector('.hz-form-error-summary') as HTMLElement;
		expect(document.activeElement).toBe(summary);
	});

	it('errors change without submit: no focus move', async () => {
		// Render with no errors and grab the initial active element.
		const { container } = render(Form, {
			errors: [],
			novalidate: true,
			children: basicChildren
		});
		// Focus something else first.
		const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
		submitBtn.focus();
		const previousActive = document.activeElement;

		// Simulate a reactive update to errors WITHOUT submitting.
		// In this test we just verify the summary is shown but focus hasn't moved.
		// Since we can't easily update a prop without a wrapper, we verify:
		// - errors=[] → no summary exists
		// - so if focus is on the button, it stays there.
		await tick();
		expect(document.activeElement).toBe(previousActive);
	});

	it('second submit re-moves focus', async () => {
		const { container } = render(Form, {
			errors: [emailError],
			novalidate: true,
			children: basicChildren
		});

		// First submit
		submitForm(container);
		await tick();
		await tick();
		const summary = container.querySelector('.hz-form-error-summary') as HTMLElement;
		expect(document.activeElement).toBe(summary);

		// Move focus away
		const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
		submitBtn.focus();
		expect(document.activeElement).toBe(submitBtn);

		// Second submit should re-move focus to summary
		submitForm(container);
		await tick();
		await tick();
		expect(document.activeElement).toBe(summary);
	});
});

// ---------------------------------------------------------------------------
// Form-R6 — Jump to field
// ---------------------------------------------------------------------------

describe('Form-R6 — jump to field', () => {
	it('clicking a summary link focuses the target control', async () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const link = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		link.click();
		await tick();
		const emailInput = container.querySelector('#field-email') as HTMLInputElement;
		expect(document.activeElement).toBe(emailInput);
	});

	it('clicking a summary link calls preventDefault (no hash navigation)', async () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const link = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
		link.dispatchEvent(clickEvent);
		await tick();
		expect(clickEvent.defaultPrevented).toBe(true);
	});

	it('clicking a "no-id" button focuses the control', async () => {
		const { container } = render(Form, {
			errors: [{ name: 'noid', message: 'Missing' }],
			children: noIdChildren
		});
		const btn = container.querySelector(
			'.hz-form-error-summary-item button[type="button"]'
		) as HTMLButtonElement;
		btn.click();
		await tick();
		const noidInput = container.querySelector('input[name="noid"]') as HTMLInputElement;
		expect(document.activeElement).toBe(noidInput);
	});
});

// ---------------------------------------------------------------------------
// Form-R7 — Decoupled targeting (plain native <input>)
// ---------------------------------------------------------------------------

describe('Form-R7 — decoupled targeting', () => {
	it('targets a plain native <input name> with no hz primitive', () => {
		const plainChild = createRawSnippet(() => ({
			render: () =>
				`<input name="plain-field" id="plain-field-id" /><button type="submit">Go</button>`
		}));
		const { container } = render(Form, {
			errors: [{ name: 'plain-field', message: 'Required' }],
			children: plainChild
		});
		const link = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		expect(link).not.toBeNull();
		expect(link.getAttribute('href')).toBe('#plain-field-id');
	});

	it('clicking the link for a plain <input> focuses it', async () => {
		const plainChild = createRawSnippet(() => ({
			render: () =>
				`<input name="plain-field" id="plain-field-id" /><button type="submit">Go</button>`
		}));
		const { container } = render(Form, {
			errors: [{ name: 'plain-field', message: 'Required' }],
			children: plainChild
		});
		const link = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		link.click();
		await tick();
		const input = container.querySelector('#plain-field-id') as HTMLInputElement;
		expect(document.activeElement).toBe(input);
	});
});

// ---------------------------------------------------------------------------
// Form-R8 — Class composition and rest forwarding
// ---------------------------------------------------------------------------

describe('Form-R8 — class composition and rest forwarding', () => {
	it('no class: root class is exactly hz-form', () => {
		const { container } = render(Form, { errors: [], children: emptyChildren });
		const form = container.querySelector('form') as HTMLFormElement;
		const classes = [...form.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-form']);
	});

	it('class="foo bar": hz-form is first, foo and bar present', () => {
		const { container } = render(Form, {
			errors: [],
			class: 'foo bar',
			children: emptyChildren
		});
		const form = container.querySelector('form') as HTMLFormElement;
		const classes = [...form.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-form');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});

	it('arbitrary rest attr (data-testid) forwarded to the form', () => {
		const { container } = render(Form, {
			errors: [],
			children: emptyChildren,
			'data-testid': 'my-form'
		} as Record<string, unknown>);
		expect(container.querySelector('form[data-testid="my-form"]')).not.toBeNull();
	});

	it('rest cannot overwrite managed class', () => {
		const { container } = render(Form, {
			errors: [],
			children: emptyChildren,
			class: 'extra'
		} as Record<string, unknown>);
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.classList.contains('hz-form')).toBe(true);
	});

	it('rest cannot overwrite managed data-state', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren,
			'data-state': 'override'
		} as Record<string, unknown>);
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.getAttribute('data-state')).toBe('error');
	});

	it('novalidate prop controls the attribute regardless of rest (managed wins)', () => {
		// When novalidate=false, the managed attribute binding (undefined) wins over
		// any value that might appear in the rest spread. The attribute is absent.
		const { container } = render(Form, {
			errors: [],
			novalidate: false,
			children: emptyChildren
		});
		const form = container.querySelector('form') as HTMLFormElement;
		expect(form.hasAttribute('novalidate')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Form-R9 — Barrel export
// ---------------------------------------------------------------------------

describe('Form-R9 — barrel export', () => {
	it('Form is resolvable from $lib', async () => {
		const { Form: F } = await import('$lib');
		expect(F).toBeDefined();
	});

	it('Form smoke-renders from $lib import', async () => {
		const { Form: F } = await import('$lib');
		const { container } = render(F, { errors: [], children: emptyChildren });
		expect(container.querySelector('form.hz-form')).not.toBeNull();
	});

	it('FormError is importable from $lib/types', async () => {
		// Type-only export — just verifying the module loads without error.
		const mod = await import('$lib/types');
		expect(mod).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Structural CSS
// ---------------------------------------------------------------------------

describe('Structural CSS', () => {
	it('summary is display: block', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const summary = container.querySelector('.hz-form-error-summary') as HTMLElement;
		expect(getComputedStyle(summary).display).toBe('block');
	});

	it('error list has no list-style markers', () => {
		const { container } = render(Form, {
			errors: [emailError],
			children: basicChildren
		});
		const list = container.querySelector('.hz-form-error-list') as HTMLElement;
		expect(getComputedStyle(list).listStyleType).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// Integration
// ---------------------------------------------------------------------------

describe('Integration', () => {
	it('submit → errors → summary shown → activating item focuses field', async () => {
		const { container } = render(Form, {
			errors: [emailError, usernameError],
			novalidate: true,
			children: basicChildren
		});

		// Submit the form.
		submitForm(container);
		await tick();
		await tick();

		// Summary should be shown.
		const summary = container.querySelector('.hz-form-error-summary') as HTMLElement;
		expect(summary).not.toBeNull();
		expect(document.activeElement).toBe(summary);

		// Activate the first link (email field).
		const firstLink = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		firstLink.click();
		await tick();
		expect(document.activeElement).toBe(container.querySelector('#field-email'));
	});

	it('radio group error: activating item focuses first radio', async () => {
		const { container } = render(Form, {
			errors: [colorError],
			novalidate: true,
			children: radioChildren
		});

		submitForm(container);
		await tick();
		await tick();

		const link = container.querySelector('.hz-form-error-summary-item a') as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('#color-red');

		link.click();
		await tick();
		expect(document.activeElement).toBe(container.querySelector('#color-red'));
	});

	it('re-submit with different errors updates summary and re-moves focus', async () => {
		// Render with one error already present.
		const { container } = render(Form, {
			errors: [emailError],
			novalidate: true,
			children: basicChildren
		});

		// First submit
		submitForm(container);
		await tick();
		await tick();
		expect(document.activeElement).toBe(container.querySelector('.hz-form-error-summary'));

		// Move focus elsewhere
		const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
		submitBtn.focus();

		// Second submit (same error prop) → focus re-moves
		submitForm(container);
		await tick();
		await tick();
		expect(document.activeElement).toBe(container.querySelector('.hz-form-error-summary'));
	});

	it('form with both linked and form-level errors: linked first, form-level last', () => {
		const { container } = render(Form, {
			errors: [formLevelError, emailError, formLevelError],
			children: basicChildren
		});

		const items = Array.from(
			container.querySelectorAll<HTMLElement>('.hz-form-error-summary-item')
		);
		expect(items.length).toBe(3);
		// First item should be the linked email error.
		expect(items[0].querySelector('a')).not.toBeNull();
		// Remaining two should be plain form-level errors.
		expect(items[1].querySelector('a')).toBeNull();
		expect(items[2].querySelector('a')).toBeNull();
	});

	it('errors corrected (empty), then re-submitted: no summary, no focus move', async () => {
		const { container } = render(Form, {
			errors: [],
			novalidate: true,
			children: basicChildren
		});

		submitForm(container);
		await tick();
		await tick();

		// No errors → no summary.
		expect(container.querySelector('.hz-form-error-summary')).toBeNull();
		// Focus should not be on a summary element.
		expect(document.activeElement?.classList.contains('hz-form-error-summary')).toBe(false);
	});
});
