import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { FormOption } from '$lib/types';
import Combobox from './Combobox.svelte';

// ---------------------------------------------------------------------------
// Sample options
// ---------------------------------------------------------------------------

const opts: FormOption[] = [
	{ value: 'a', label: 'Aviar' },
	{ value: 'b', label: 'Buzzz' },
	{ value: 'c', label: 'Cyclone', disabled: true },
	{ value: 'd', label: 'Destroyer' }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInput(container: Element): HTMLInputElement {
	return container.querySelector('input[role="combobox"]') as HTMLInputElement;
}

function getToggle(container: Element): HTMLButtonElement {
	return container.querySelector('.hz-combobox-toggle') as HTMLButtonElement;
}

function getOptionEls(container: Element): HTMLLIElement[] {
	return Array.from(container.querySelectorAll('li[role="option"]'));
}

function getHiddenInputs(container: Element): HTMLInputElement[] {
	return Array.from(container.querySelectorAll('input[type="hidden"]'));
}

function getChips(container: Element): HTMLElement[] {
	return Array.from(container.querySelectorAll('.hz-combobox-control > .hz-badge'));
}

function getChipDismissButtons(container: Element): HTMLButtonElement[] {
	return Array.from(
		container.querySelectorAll('.hz-combobox-control > .hz-badge .hz-badge-dismiss')
	);
}

/** Fire a KeyboardEvent on an element and return it (for defaultPrevented checks). */
function fireKey(
	el: EventTarget,
	key: string,
	extra: EventInit & { altKey?: boolean; shiftKey?: boolean } = {}
): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
	el.dispatchEvent(event);
	return event;
}

/**
 * Dispatch a synthetic keydown and wait for Svelte to flush the resulting
 * state change to the DOM (a raw `dispatchEvent` is synchronous, but
 * reactive attribute updates land on a later microtask).
 */
async function pressKey(
	el: EventTarget,
	key: string,
	extra: EventInit & { altKey?: boolean; shiftKey?: boolean } = {}
): Promise<KeyboardEvent> {
	const event = fireKey(el, key, extra);
	await tick();
	return event;
}

/** Fire a native click event directly (bypasses Playwright's actionability
 *  checks, which refuse aria-disabled elements and occluded targets). */
function nativeClick(el: Element): void {
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

/** Move focus to a throwaway, always-clickable-position button outside the
 *  combobox, then clean it up — triggers real blur/focusout on the input. */
async function blurOutside(): Promise<void> {
	const btn = document.createElement('button');
	btn.textContent = 'outside';
	btn.style.position = 'fixed';
	btn.style.top = '0';
	btn.style.left = '0';
	btn.style.zIndex = '999999';
	document.body.appendChild(btn);
	btn.focus();
	await tick();
	btn.remove();
}

// ---------------------------------------------------------------------------
// Combobox-R1/R2/R3 — Structure & ARIA
// ---------------------------------------------------------------------------

describe('Combobox-R1 — structure & Field scaffold', () => {
	it('root is div.hz-field.hz-combobox with data-state="default"', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const root = container.querySelector('div.hz-field.hz-combobox') as HTMLElement;
		expect(root).not.toBeNull();
		expect(root.getAttribute('data-state')).toBe('default');
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			error: 'Bad',
			disabled: true
		});
		const root = container.querySelector('.hz-combobox') as HTMLElement;
		expect(root.getAttribute('data-state')).toBe('error');
	});

	it('the control row and no hidden inputs render when nothing is selected', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		expect(container.querySelector('.hz-combobox-control')).not.toBeNull();
		expect(getHiddenInputs(container).length).toBe(0);
	});

	it('data-open is absent on the root and control when closed', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		expect(container.querySelector('.hz-combobox')!.hasAttribute('data-open')).toBe(false);
		expect(container.querySelector('.hz-combobox-control')!.hasAttribute('data-open')).toBe(false);
	});

	it('data-open is present on the root and control once opened', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		await userEvent.click(getInput(container));
		expect(container.querySelector('.hz-combobox')!.hasAttribute('data-open')).toBe(true);
		expect(container.querySelector('.hz-combobox-control')!.hasAttribute('data-open')).toBe(true);
	});

	it('the popup is a child of the control (last child)', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const control = container.querySelector('.hz-combobox-control') as HTMLElement;
		const popup = container.querySelector('.hz-combobox-popup') as HTMLElement;
		expect(control.contains(popup)).toBe(true);
		expect(control.lastElementChild).toBe(popup);
	});
});

describe('Combobox-R2 — input ARIA (APG 1.2)', () => {
	it('input carries role="combobox", aria-autocomplete="list", type="text", autocomplete="off"', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		expect(input.getAttribute('role')).toBe('combobox');
		expect(input.getAttribute('aria-autocomplete')).toBe('list');
		expect(input.type).toBe('text');
		expect(input.getAttribute('autocomplete')).toBe('off');
	});

	it('aria-expanded is "false" closed and "true" once opened', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		expect(input.getAttribute('aria-expanded')).toBe('false');
		await userEvent.click(input);
		expect(input.getAttribute('aria-expanded')).toBe('true');
	});

	it('aria-controls points at the listbox id; aria-haspopup="listbox"', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		const listbox = container.querySelector('[role="listbox"]') as HTMLElement;
		expect(input.getAttribute('aria-controls')).toBe(listbox.id);
		expect(input.getAttribute('aria-haspopup')).toBe('listbox');
	});

	it('the visible input has no name attribute (only hidden inputs submit)', () => {
		const { container } = render(Combobox, { name: 'putter', label: 'X', options: opts });
		expect(getInput(container).getAttribute('name')).toBeNull();
	});

	it('aria-activedescendant is omitted while no option is active', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		expect(getInput(container).hasAttribute('aria-activedescendant')).toBe(false);
	});

	it('aria-activedescendant tracks the active option once one is set', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown');
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'))!;
		expect(input.getAttribute('aria-activedescendant')).toBe(active.id);
	});

	it('the input text is only ever the filter query, never a selected label', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a', 'b']
		});
		expect(getInput(container).value).toBe('');
	});
});

describe('Combobox-R3 — listbox & options', () => {
	it('the listbox is named by aria-label={label} and is aria-multiselectable', () => {
		const { container } = render(Combobox, { name: 'x', label: 'Putter', options: opts });
		const listbox = container.querySelector('[role="listbox"]') as HTMLElement;
		expect(listbox.getAttribute('aria-label')).toBe('Putter');
		expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
	});

	it('renders one li[role="option"] per visible option, always in the DOM', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		expect(getOptionEls(container).length).toBe(opts.length);
	});

	it('each option has an id, aria-selected, and data-* hooks reflecting membership in value', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, value: ['b'] });
		const lis = getOptionEls(container);
		lis.forEach((li) => expect(li.id).toMatch(/^hz-opt-/));
		const selected = lis.find((li) => li.textContent?.trim() === 'Buzzz')!;
		expect(selected.getAttribute('aria-selected')).toBe('true');
		expect(selected.hasAttribute('data-selected')).toBe(true);
	});

	it('unselected options carry aria-selected="false" and no data-selected', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, value: ['b'] });
		const other = getOptionEls(container).find((li) => li.textContent?.trim() === 'Aviar')!;
		expect(other.getAttribute('aria-selected')).toBe('false');
		expect(other.hasAttribute('data-selected')).toBe(false);
	});

	it('filtering is not exempted by selection — a selected option can still be filtered out', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, value: ['a'] });
		const input = getInput(container);
		await userEvent.fill(input, 'zzz-no-match-for-a-but-a-is-selected');
		expect(getOptionEls(container).length).toBe(0);
		// the chip still renders even though the option is filtered out of the list
		expect(getChips(container).length).toBe(1);
	});

	it('multiple selected options each show data-selected/aria-selected', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a', 'd']
		});
		const lis = getOptionEls(container);
		const a = lis.find((li) => li.textContent?.trim() === 'Aviar')!;
		const d = lis.find((li) => li.textContent?.trim() === 'Destroyer')!;
		expect(a.hasAttribute('data-selected')).toBe(true);
		expect(d.hasAttribute('data-selected')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Combobox-R4 — Value model & binding
// ---------------------------------------------------------------------------

describe('Combobox-R4 — value model & binding', () => {
	it('one hidden input per selected value, in selection order, carrying name', () => {
		const { container } = render(Combobox, {
			name: 'putter',
			label: 'X',
			options: opts,
			value: ['d', 'a']
		});
		const hidden = getHiddenInputs(container);
		expect(hidden.map((i) => i.value)).toEqual(['d', 'a']);
		hidden.forEach((i) => expect(i.name).toBe('putter'));
	});

	it('a value entry not present in options renders no chip and no hidden input', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a', 'zzz']
		});
		expect(getHiddenInputs(container).length).toBe(1);
		expect(getChips(container).length).toBe(1);
	});

	it('a programmatic value change updates the chips and hidden inputs', async () => {
		const { container, rerender } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a']
		});
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
		await rerender({ value: ['a', 'b'] });
		await tick();
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a', 'b']);
	});
});

// ---------------------------------------------------------------------------
// Combobox-R5 — Chip list
// ---------------------------------------------------------------------------

describe('Combobox-R5 — chip list', () => {
	it('one Badge chip per selected value, in selection order, with an accessible dismiss label', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['d', 'a']
		});
		const chips = getChips(container);
		expect(
			chips.map((c) =>
				c.textContent
					?.trim()
					.replace(/Remove.*/, '')
					.trim()
			)
		).toEqual(['Destroyer', 'Aviar']);
		const buttons = getChipDismissButtons(container);
		expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
			'Remove Destroyer',
			'Remove Aviar'
		]);
	});

	it('dismissing a chip removes the value, fires onchange, and moves focus to the input', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a', 'b'],
			onchange
		});
		const buttons = getChipDismissButtons(container);
		await userEvent.click(buttons[0]); // remove 'a'
		expect(onchange).toHaveBeenCalledWith(['b']);
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['b']);
		expect(document.activeElement).toBe(getInput(container));
	});

	it('dismiss does not change popup open state', async () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a']
		});
		const input = getInput(container);
		await userEvent.click(input); // open
		expect(input.getAttribute('aria-expanded')).toBe('true');
		const buttons = getChipDismissButtons(container);
		await userEvent.click(buttons[0]);
		expect(input.getAttribute('aria-expanded')).toBe('true');
	});

	it('focus moving from the input to a chip dismiss button is "within" the control — no blur reconciliation', async () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a']
		});
		const input = getInput(container);
		await userEvent.click(input);
		await userEvent.fill(input, 'e');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		const chipBtn = getChipDismissButtons(container)[0];
		chipBtn.focus();
		await tick();
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(input.value).toBe('e');
	});

	it('disabled field renders chips without dismiss buttons', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a'],
			disabled: true
		});
		expect(getChips(container).length).toBe(1);
		expect(getChipDismissButtons(container).length).toBe(0);
	});

	it('a selected-but-disabled option still renders a dismissible chip', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['c'] // Cyclone is disabled
		});
		expect(getChips(container).length).toBe(1);
		expect(getChipDismissButtons(container).length).toBe(1);
	});

	it('default chips are data-size="sm"', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, value: ['a'] });
		expect(getChips(container)[0].getAttribute('data-size')).toBe('sm');
	});

	it('chipProps reaches the Badge; component-managed props cannot be displaced', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a'],
			chipProps: { intent: 'primary', rounded: 'md', size: 'md', class: 'foo' }
		});
		const chip = getChips(container)[0];
		expect(chip.getAttribute('data-intent')).toBe('primary');
		expect(chip.getAttribute('data-rounded')).toBe('md');
		expect(chip.getAttribute('data-size')).toBe('md');
		expect(chip.classList.contains('foo')).toBe(true);
		// dismissLabel-style managed props cannot be displaced by chipProps.
		expect(getChipDismissButtons(container)[0].getAttribute('aria-label')).toBe('Remove Aviar');
	});
});

// ---------------------------------------------------------------------------
// Combobox-R6 — Filtering
// ---------------------------------------------------------------------------

describe('Combobox-R6 — filtering', () => {
	it('typing narrows options via case-insensitive substring on the label', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await userEvent.fill(input, 'AVI');
		const labels = getOptionEls(container).map((li) => li.textContent?.trim());
		expect(labels).toEqual(['Aviar']);
	});

	it('a custom filter prop overrides the default matching', async () => {
		const filter = (q: string, o: FormOption) => o.value === q;
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, filter });
		const input = getInput(container);
		await userEvent.fill(input, 'b');
		const labels = getOptionEls(container).map((li) => li.textContent?.trim());
		expect(labels).toEqual(['Buzzz']);
	});

	it('an empty query shows every option unfiltered', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await userEvent.fill(input, 'a');
		await userEvent.fill(input, '');
		expect(getOptionEls(container).length).toBe(opts.length);
	});

	it('active resets to the first enabled visible option on each typing-driven filter change', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await userEvent.fill(input, 'e'); // matches Cyclone (disabled) and Destroyer
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Destroyer');
	});
});

// ---------------------------------------------------------------------------
// Combobox-R8/R9 — Keyboard & virtual focus
// ---------------------------------------------------------------------------

describe('Combobox-R8/R9 — keyboard & virtual focus', () => {
	it('ArrowDown opens the popup with the first enabled option active', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		const event = await pressKey(input, 'ArrowDown');
		expect(event.defaultPrevented).toBe(true);
		expect(input.getAttribute('aria-expanded')).toBe('true');
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Aviar');
	});

	it('ArrowDown moves to the next enabled option, skipping disabled', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // Aviar
		await pressKey(input, 'ArrowDown'); // Buzzz
		await pressKey(input, 'ArrowDown'); // skips Cyclone (disabled) -> Destroyer
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Destroyer');
	});

	it('ArrowDown wraps from the last enabled option to the first', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // Aviar
		await pressKey(input, 'ArrowDown'); // Buzzz
		await pressKey(input, 'ArrowDown'); // Destroyer
		await pressKey(input, 'ArrowDown'); // wraps to Aviar
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Aviar');
	});

	it('ArrowUp opens the popup with the last enabled option active', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowUp');
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Destroyer');
	});

	it('ArrowUp moves to the previous enabled option, wrapping and skipping disabled', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowUp'); // Destroyer
		await pressKey(input, 'ArrowUp'); // skips Cyclone (disabled) -> Buzzz
		await pressKey(input, 'ArrowUp'); // Aviar
		await pressKey(input, 'ArrowUp'); // wraps to Destroyer
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Destroyer');
	});

	it('Alt+ArrowDown opens the popup without moving the active option', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		const event = await pressKey(input, 'ArrowDown', { altKey: true });
		expect(event.defaultPrevented).toBe(true);
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(input.hasAttribute('aria-activedescendant')).toBe(false);
	});

	it('Alt+ArrowUp closes the popup, leaving value and query unchanged', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, value: ['a'] });
		const input = getInput(container);
		await userEvent.fill(input, 'zz');
		await pressKey(input, 'ArrowDown'); // ensure open
		const event = await pressKey(input, 'ArrowUp', { altKey: true });
		expect(event.defaultPrevented).toBe(true);
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.value).toBe('zz');
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
	});

	it('Home/End jump to the first/last enabled option while open', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // open, active = Aviar
		await pressKey(input, 'End');
		let active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Destroyer');
		await pressKey(input, 'Home');
		active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Aviar');
	});

	it('Home/End are native text-cursor behavior while closed (no preventDefault)', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		const homeEvent = await pressKey(input, 'Home');
		expect(homeEvent.defaultPrevented).toBe(false);
		const endEvent = await pressKey(input, 'End');
		expect(endEvent.defaultPrevented).toBe(false);
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('Enter toggles the active option, keeps the popup open, and preventDefaults form submit', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // active = Aviar
		const event = await pressKey(input, 'Enter');
		expect(event.defaultPrevented).toBe(true);
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(input.value).toBe('');
	});

	it('Enter with no active option closes the popup with no change', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown', { altKey: true }); // open, no active
		const event = await pressKey(input, 'Enter');
		expect(event.defaultPrevented).toBe(true);
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(getHiddenInputs(container).length).toBe(0);
	});

	it('Escape while open closes and clears the query; value is unchanged', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, value: ['a'] });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // open
		await userEvent.fill(input, 'zzz');
		await pressKey(input, 'Escape');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.value).toBe('');
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
	});

	it('Escape while closed clears the query text only — never the selections', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a'],
			onchange
		});
		const input = getInput(container);
		await userEvent.fill(input, 'zzz'); // typing opens, query = 'zzz'
		await pressKey(input, 'ArrowUp', { altKey: true }); // closes; value and query unchanged
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.value).toBe('zzz');
		await pressKey(input, 'Escape');
		expect(input.value).toBe('');
		expect(onchange).not.toHaveBeenCalled();
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
	});

	it('Backspace with an empty query removes the last chip and fires onchange', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a', 'b'],
			onchange
		});
		const input = getInput(container);
		input.focus();
		await pressKey(input, 'Backspace');
		expect(onchange).toHaveBeenCalledWith(['a']);
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
	});

	it('Backspace with an empty query and no chips is a no-op', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, onchange });
		const input = getInput(container);
		input.focus();
		await pressKey(input, 'Backspace');
		expect(onchange).not.toHaveBeenCalled();
		expect(getHiddenInputs(container).length).toBe(0);
	});

	it('Backspace with query text present is native editing (no chip removal)', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a'],
			onchange
		});
		const input = getInput(container);
		await userEvent.fill(input, 'ab');
		await userEvent.keyboard('{Backspace}');
		expect(input.value).toBe('a');
		expect(onchange).not.toHaveBeenCalled();
	});

	it('Tab closes the popup without preventDefault', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // open
		const event = await pressKey(input, 'Tab');
		expect(event.defaultPrevented).toBe(false);
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('DOM focus stays on the input throughout a commit', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		input.focus();
		await pressKey(input, 'ArrowDown');
		await pressKey(input, 'Enter');
		expect(document.activeElement).toBe(input);
	});
});

// ---------------------------------------------------------------------------
// Combobox-R4/R10 — Selection & binding
// ---------------------------------------------------------------------------

describe('Combobox-R4/R10 — selection & binding', () => {
	it('clicking an unselected option appends it: value, hidden input, chip, onchange, query clears, popup stays open', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, onchange });
		const input = getInput(container);
		await userEvent.click(input);
		const li = getOptionEls(container).find((el) => el.textContent?.trim() === 'Buzzz')!;
		await userEvent.click(li);
		expect(input.value).toBe('');
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['b']);
		expect(onchange).toHaveBeenCalledWith(['b']);
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(getChips(container).length).toBe(1);
	});

	it('committing an already-selected option removes it (toggle off)', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			value: ['a', 'b'],
			onchange
		});
		const input = getInput(container);
		await userEvent.click(input);
		const li = getOptionEls(container).find((el) => el.textContent?.trim() === 'Buzzz')!;
		await userEvent.click(li);
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
		expect(onchange).toHaveBeenCalledWith(['a']);
		expect(input.getAttribute('aria-expanded')).toBe('true');
	});

	it('the active option follows the just-toggled option after a commit', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await userEvent.click(input);
		const li = getOptionEls(container).find((el) => el.textContent?.trim() === 'Buzzz')!;
		await userEvent.click(li);
		const active = getOptionEls(container).find((el) => el.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Buzzz');
	});

	it('Enter toggles the active option the same way as a click', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, onchange });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // Aviar
		await pressKey(input, 'Enter');
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
		expect(onchange).toHaveBeenCalledWith(['a']);
	});

	it('clicking a disabled option is a no-op', async () => {
		const onchange = vi.fn();
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, onchange });
		const input = getInput(container);
		await userEvent.click(input);
		const li = getOptionEls(container).find((el) => el.textContent?.trim() === 'Cyclone')!;
		nativeClick(li);
		await tick();
		expect(getHiddenInputs(container).length).toBe(0);
		expect(onchange).not.toHaveBeenCalled();
	});

	it('pointer selection keeps DOM focus on the input', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await userEvent.click(input);
		const li = getOptionEls(container).find((el) => el.textContent?.trim() === 'Buzzz')!;
		await userEvent.click(li);
		expect(document.activeElement).toBe(input);
	});

	it('typing a query then blurring without committing clears the query and closes; value/chips untouched', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts, value: ['a'] });
		const input = getInput(container);
		await userEvent.fill(input, 'zzz');
		await blurOutside();
		expect(input.value).toBe('');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(getHiddenInputs(container).map((i) => i.value)).toEqual(['a']);
	});
});

// ---------------------------------------------------------------------------
// Combobox-R11/R13 — Disabled options & empty state
// ---------------------------------------------------------------------------

describe('Combobox-R11 — disabled options', () => {
	it('a disabled option carries aria-disabled and data-disabled', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const li = getOptionEls(container).find((el) => el.textContent?.trim() === 'Cyclone')!;
		expect(li.getAttribute('aria-disabled')).toBe('true');
		expect(li.hasAttribute('data-disabled')).toBe(true);
	});

	it('disabled options are skipped by keyboard navigation', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await pressKey(input, 'ArrowDown'); // Aviar
		await pressKey(input, 'ArrowDown'); // Buzzz
		await pressKey(input, 'ArrowDown'); // Destroyer (Cyclone skipped)
		const active = getOptionEls(container).find((li) => li.hasAttribute('data-active'));
		expect(active?.textContent?.trim()).toBe('Destroyer');
	});
});

describe('Combobox-R13 — empty results', () => {
	it('a filter with no matches renders .hz-combobox-empty and no active descendant', async () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const input = getInput(container);
		await userEvent.fill(input, 'zzz-no-match');
		const empty = container.querySelector('.hz-combobox-empty[role="presentation"]');
		expect(empty).not.toBeNull();
		expect(getOptionEls(container).length).toBe(0);
		expect(input.hasAttribute('aria-activedescendant')).toBe(false);
	});

	it('an empty options array renders the empty state with emptyText', async () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: [],
			emptyText: 'Nothing here'
		});
		await userEvent.click(getInput(container));
		expect(container.querySelector('.hz-combobox-empty')?.textContent).toBe('Nothing here');
	});
});

// ---------------------------------------------------------------------------
// Combobox-R14 — Field states
// ---------------------------------------------------------------------------

describe('Combobox-R14 — field states', () => {
	it('required: aria-required="true" on the input and the visual *', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			required: true
		});
		expect(getInput(container).getAttribute('aria-required')).toBe('true');
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('disabled: native disabled on the input and the toggle, data-state="disabled"', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			disabled: true
		});
		expect(getInput(container).disabled).toBe(true);
		expect(getToggle(container).disabled).toBe(true);
		expect(container.querySelector('.hz-combobox')!.getAttribute('data-state')).toBe('disabled');
	});

	it('error: role="alert" message, aria-invalid, data-state="error" (wins over disabled)', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			error: 'Pick one',
			disabled: true
		});
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(err.getAttribute('role')).toBe('alert');
		expect(getInput(container).getAttribute('aria-invalid')).toBe('true');
		expect(container.querySelector('.hz-combobox')!.getAttribute('data-state')).toBe('error');
		// disabled still applies even though error wins the data-state
		expect(getInput(container).disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Combobox-R18 — Open-state description/error suppression
// ---------------------------------------------------------------------------

describe('Combobox-R18 — description/error suppression while open', () => {
	it('description and error are visibility: hidden while data-open, restored on close', async () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			description: 'Help text',
			error: 'Bad'
		});
		const desc = container.querySelector('.hz-field-description') as HTMLElement;
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(getComputedStyle(desc).visibility).not.toBe('hidden');
		expect(getComputedStyle(err).visibility).not.toBe('hidden');

		const input = getInput(container);
		await userEvent.click(input);
		expect(getComputedStyle(desc).visibility).toBe('hidden');
		expect(getComputedStyle(err).visibility).toBe('hidden');

		await pressKey(input, 'Escape');
		expect(getComputedStyle(desc).visibility).not.toBe('hidden');
		expect(getComputedStyle(err).visibility).not.toBe('hidden');
	});
});

// ---------------------------------------------------------------------------
// Combobox-R15 — class & rest
// ---------------------------------------------------------------------------

describe('Combobox-R15 — class & rest', () => {
	it('no class: root is exactly "hz-field hz-combobox"', () => {
		const { container } = render(Combobox, { name: 'x', label: 'X', options: opts });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-field', 'hz-combobox']);
	});

	it('class="foo" is appended after the base classes', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			class: 'foo'
		});
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('hz-combobox');
		expect(classes).toContain('foo');
	});

	it('a forwarded data-testid and oninput reach the visible input', async () => {
		const oninput = vi.fn();
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			'data-testid': 'my-combobox',
			oninput
		});
		const input = getInput(container);
		expect(input.getAttribute('data-testid')).toBe('my-combobox');
		await userEvent.fill(input, 'a');
		expect(oninput).toHaveBeenCalled();
	});

	it('an attempted role/id override loses to the managed value', () => {
		const { container } = render(Combobox, {
			name: 'x',
			label: 'X',
			options: opts,
			role: 'textbox',
			id: 'hijacked'
		});
		const input = getInput(container);
		expect(input.getAttribute('role')).toBe('combobox');
		expect(input.id).not.toBe('hijacked');
		expect(input.id).toMatch(/^hz-input-/);
	});
});

// ---------------------------------------------------------------------------
// Combobox-R17 — Barrel export
// ---------------------------------------------------------------------------

describe('Combobox-R17 — barrel export', () => {
	it('Combobox is resolvable from $lib and smoke-renders', async () => {
		const { Combobox: C } = await import('$lib');
		expect(C).toBeDefined();
		const { container } = render(C, { name: 'x', label: 'X', options: opts });
		expect(container.querySelector('.hz-combobox')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Integration — native <form>
// ---------------------------------------------------------------------------

describe('Integration — native form participation', () => {
	it('selecting several options renders repeated hidden inputs resolving a RadioNodeList and FormData.getAll', async () => {
		const form = document.createElement('form');
		document.body.appendChild(form);
		const submitBtn = document.createElement('button');
		submitBtn.type = 'submit';
		form.appendChild(submitBtn);

		render(Combobox, { target: form, props: { name: 'putter', label: 'Putter', options: opts } });

		const input = getInput(form);
		await userEvent.click(input);
		let li = getOptionEls(form).find((el) => el.textContent?.trim() === 'Destroyer')!;
		await userEvent.click(li);
		li = getOptionEls(form).find((el) => el.textContent?.trim() === 'Aviar')!;
		await userEvent.click(li);

		const resolved = form.elements.namedItem('putter');
		expect(resolved).toBeInstanceOf(RadioNodeList);
		expect(
			Array.from(resolved as RadioNodeList).map((el) => (el as HTMLInputElement).value)
		).toEqual(['d', 'a']);

		const data = new FormData(form);
		expect(data.getAll('putter')).toEqual(['d', 'a']);
	});

	it('pressing Enter commits without submitting the enclosing form', async () => {
		const form = document.createElement('form');
		document.body.appendChild(form);
		const submit = vi.fn((e: Event) => e.preventDefault());
		form.addEventListener('submit', submit);

		render(Combobox, { target: form, props: { name: 'putter', label: 'Putter', options: opts } });

		const input = getInput(form);
		fireKey(input, 'ArrowDown');
		fireKey(input, 'Enter');

		expect(submit).not.toHaveBeenCalled();
	});
});
