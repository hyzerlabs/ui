import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CommandPalette, { type CommandItem } from './CommandPalette.svelte';

const items: CommandItem[] = [
	{ label: 'Toggle', href: '/docs/components/toggle', context: 'Components · Forms' },
	{ label: 'Button', href: '/docs/components/button', context: 'Components · Common' },
	{ label: 'Textarea', href: '/docs/components/textarea', context: 'Components · Forms' },
	{ label: 'Colors & Intent', href: '/docs/foundation/colors', context: 'Foundation' }
];

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function parts(container: HTMLElement) {
	return {
		input: container.querySelector<HTMLInputElement>('.cmd-input')!,
		options: () => Array.from(container.querySelectorAll<HTMLElement>('.cmd-option')),
		list: () => container.querySelector('[role="listbox"]'),
		empty: () => container.querySelector('.cmd-empty')
	};
}

async function type(input: HTMLInputElement, value: string) {
	input.focus();
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await tick();
}

function key(input: HTMLInputElement, k: string, mods: Partial<KeyboardEventInit> = {}) {
	input.dispatchEvent(
		new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...mods })
	);
}

describe('CommandPalette', () => {
	it('is a combobox controlling a listbox', () => {
		const { container } = render(CommandPalette, { items, onSelect: vi.fn() });
		const { input } = parts(container);
		expect(input.getAttribute('role')).toBe('combobox');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.hasAttribute('aria-controls')).toBe(true);
	});

	it('typing filters to matching pages by label or context', async () => {
		const { container } = render(CommandPalette, { items, onSelect: vi.fn() });
		const { input, options } = parts(container);
		await type(input, 'toggle');
		expect(options().map((o) => o.querySelector('.cmd-option-label')?.textContent)).toEqual([
			'Toggle'
		]);

		// Context matches too: "forms" finds every Forms page.
		await type(input, 'forms');
		expect(options().map((o) => o.querySelector('.cmd-option-label')?.textContent)).toEqual([
			'Toggle',
			'Textarea'
		]);
	});

	it('expands and wires aria-activedescendant while showing results', async () => {
		const { container } = render(CommandPalette, { items, onSelect: vi.fn() });
		const { input, options } = parts(container);
		await type(input, 'to');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		const active = options().find((o) => o.hasAttribute('data-active'))!;
		expect(input.getAttribute('aria-activedescendant')).toBe(active.id);
	});

	it('ArrowDown moves the active option (wrapping); Enter selects it', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { items, onSelect });
		const { input, options } = parts(container);
		await type(input, 'forms'); // Toggle, Textarea
		key(input, 'ArrowDown');
		await tick();
		expect(options()[1].hasAttribute('data-active')).toBe(true);
		key(input, 'Enter');
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/textarea');
	});

	it('Enter with no navigation yet picks the first result', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { items, onSelect });
		const { input } = parts(container);
		await type(input, 'toggle');
		key(input, 'Enter');
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/toggle');
	});

	it('clicking a result selects it', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { items, onSelect });
		const { input, options } = parts(container);
		await type(input, 'button');
		options()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/button');
	});

	it('Escape clears the query, then closes; selecting clears too', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { items, onSelect });
		const { input, list } = parts(container);
		await type(input, 'toggle');
		expect(list()).not.toBeNull();
		key(input, 'Escape');
		await tick();
		expect(input.value).toBe('');
		expect(list()).toBeNull();
	});

	it('shows an empty state when nothing matches', async () => {
		const { container } = render(CommandPalette, { items, onSelect: vi.fn() });
		const { input, empty, options } = parts(container);
		await type(input, 'zzzznope');
		expect(options()).toHaveLength(0);
		expect(empty()?.textContent).toContain('No matches');
	});

	it('Cmd/Ctrl+K focuses the search from anywhere', async () => {
		const { container } = render(CommandPalette, { items, onSelect: vi.fn() });
		const { input } = parts(container);
		expect(document.activeElement).not.toBe(input);
		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true })
		);
		await tick();
		expect(document.activeElement).toBe(input);
	});
});

describe('CommandPalette — modal mode', () => {
	const opts = { items, onSelect: vi.fn(), mode: 'modal' as const };

	function trigger(container: HTMLElement) {
		return container.querySelector<HTMLButtonElement>('.cmd-trigger')!;
	}
	function dialog(container: HTMLElement) {
		return container.querySelector('[role="dialog"]');
	}

	it('the trigger opens a dialog and focuses the field', async () => {
		const { container } = render(CommandPalette, opts);
		expect(dialog(container)).toBeNull();
		trigger(container).click();
		await tick();
		expect(dialog(container)).not.toBeNull();
		expect(document.activeElement).toBe(parts(container).input);
	});

	it('Cmd/Ctrl+K opens the modal', async () => {
		const { container } = render(CommandPalette, opts);
		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true })
		);
		await tick();
		expect(dialog(container)).not.toBeNull();
	});

	it('Escape (empty query) and backdrop click both close the modal', async () => {
		const { container } = render(CommandPalette, opts);
		trigger(container).click();
		await tick();
		key(parts(container).input, 'Escape');
		await tick();
		expect(dialog(container)).toBeNull();

		trigger(container).click();
		await tick();
		container
			.querySelector<HTMLElement>('.cmd-backdrop')!
			.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		expect(dialog(container)).toBeNull();
	});

	it('selecting a result navigates and closes the modal', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { ...opts, onSelect });
		trigger(container).click();
		await tick();
		await type(parts(container).input, 'toggle');
		key(parts(container).input, 'Enter');
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/toggle');
		expect(dialog(container)).toBeNull();
	});
});
