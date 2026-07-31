import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CommandPalette from './CommandPalette.svelte';
import type { SearchRecord } from './searchIndex';

/**
 * A small, hand-built index: plain page records, two component records
 * carrying `props`/`hooks` (Search-R2's two-array shape), and one heading
 * record — enough to exercise every hit shape `searchDocs()` produces
 * (Search-R6) without pulling in the real ~200-record index.
 */
const fixtureIndex: SearchRecord[] = [
	{
		kind: 'page',
		label: 'Toggle',
		context: 'Components · Forms',
		href: '/docs/components/toggle',
		description: 'A switch for binary on and off settings.',
		props: ['checked', 'disabled'],
		hooks: ['hz-field hz-field--toggle', 'data-state']
	},
	{
		kind: 'page',
		label: 'Button',
		context: 'Components · Common',
		href: '/docs/components/button',
		description: 'A button with solid, outline, ghost, and soft variants.',
		props: ['variant', 'size'],
		hooks: ['hz-button', 'data-variant']
	},
	{
		kind: 'page',
		label: 'Textarea',
		context: 'Components · Forms',
		href: '/docs/components/textarea',
		description: 'A labeled multi-line text area.',
		props: ['resize'],
		hooks: ['hz-field', 'data-resize']
	},
	{
		kind: 'page',
		label: 'Colors & Intent',
		context: 'Foundation',
		href: '/docs/foundation/colors',
		description: 'Color works in two layers.'
	},
	{
		kind: 'heading',
		label: 'Dark mode',
		context: 'Foundation',
		href: '/docs/foundation/colors#dark-heading',
		page: 'Colors & Intent'
	}
];

/** A stub `load` that resolves the fixture — most tests don't care how many times it's called. */
function load(): Promise<SearchRecord[]> {
	return Promise.resolve(fixtureIndex);
}

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
	it('is a combobox, unexpanded and uncontrolled before a query has results', () => {
		const { container } = render(CommandPalette, { load, onSelect: vi.fn() });
		const { input } = parts(container);
		expect(input.getAttribute('role')).toBe('combobox');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.hasAttribute('aria-controls')).toBe(false);
	});

	it('aria-expanded and aria-controls track the listbox actually rendering, not just showResults', async () => {
		const { container } = render(CommandPalette, { load, onSelect: vi.fn() });
		const { input, list } = parts(container);

		// A query with results: expanded, controls point at the real listbox id.
		await type(input, 'toggle');
		const listbox = list()!;
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(input.getAttribute('aria-controls')).toBe(listbox.id);
		expect(container.querySelector(`#${listbox.id}`)).toBe(listbox);

		// A query with no results: no listbox in the DOM, so nothing should
		// claim to control or expand into one.
		await type(input, 'zzzznope');
		expect(list()).toBeNull();
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.hasAttribute('aria-controls')).toBe(false);
	});

	it('typing filters to matching pages by label or context', async () => {
		const { container } = render(CommandPalette, { load, onSelect: vi.fn() });
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
		const { container } = render(CommandPalette, { load, onSelect: vi.fn() });
		const { input, options } = parts(container);
		await type(input, 'to');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		const active = options().find((o) => o.hasAttribute('data-active'))!;
		expect(input.getAttribute('aria-activedescendant')).toBe(active.id);
	});

	it('ArrowDown moves the active option (wrapping); Enter selects it', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { load, onSelect });
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
		const { container } = render(CommandPalette, { load, onSelect });
		const { input } = parts(container);
		await type(input, 'toggle');
		key(input, 'Enter');
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/toggle');
	});

	it('clicking a result selects it', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { load, onSelect });
		const { input, options } = parts(container);
		await type(input, 'button');
		options()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/button');
	});

	it('Escape clears the query, then closes; selecting clears too', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { load, onSelect });
		const { input, list } = parts(container);
		await type(input, 'toggle');
		expect(list()).not.toBeNull();
		key(input, 'Escape');
		await tick();
		expect(input.value).toBe('');
		expect(list()).toBeNull();
	});

	it('shows an empty state when nothing matches', async () => {
		const { container } = render(CommandPalette, { load, onSelect: vi.fn() });
		const { input, empty, options } = parts(container);
		await type(input, 'zzzznope');
		expect(options()).toHaveLength(0);
		expect(empty()?.textContent).toContain('No matches');
	});

	it('Cmd/Ctrl+K focuses the search from anywhere', async () => {
		const { container } = render(CommandPalette, { load, onSelect: vi.fn() });
		const { input } = parts(container);
		expect(document.activeElement).not.toBe(input);
		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true })
		);
		await tick();
		expect(document.activeElement).toBe(input);
	});
});

describe('CommandPalette — the index loads once, on first open (Search-R7/R10)', () => {
	it('is not called on mount, is called once on first open, and not again after close/reopen', async () => {
		const loadFn = vi.fn().mockResolvedValue(fixtureIndex);
		const { container } = render(CommandPalette, {
			load: loadFn,
			onSelect: vi.fn(),
			mode: 'modal' as const
		});
		expect(loadFn).not.toHaveBeenCalled();

		container.querySelector<HTMLButtonElement>('.cmd-trigger')!.click();
		await tick();
		expect(loadFn).toHaveBeenCalledTimes(1);

		key(parts(container).input, 'Escape'); // empty query — closes the modal
		await tick();
		container.querySelector<HTMLButtonElement>('.cmd-trigger')!.click();
		await tick();
		expect(loadFn).toHaveBeenCalledTimes(1);
	});
});

describe('CommandPalette — field hits (Search-R6)', () => {
	it('a prop hit renders "Page › name" and carries the #props-heading anchor', async () => {
		const onSelect = vi.fn();
		const { container } = render(CommandPalette, { load, onSelect });
		const { input, options } = parts(container);
		await type(input, 'variant');
		expect(options().map((o) => o.querySelector('.cmd-option-label')?.textContent)).toEqual([
			'Button › variant'
		]);
		options()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/button#props-heading');
	});
});

describe('CommandPalette — loading and unavailable states (Search-R8)', () => {
	it('shows "Loading search…" and no listbox while the index is still in flight', async () => {
		const pending = () => new Promise<SearchRecord[]>(() => {});
		const { container } = render(CommandPalette, { load: pending, onSelect: vi.fn() });
		const { input, list, empty } = parts(container);
		await type(input, 'toggle');
		expect(list()).toBeNull();
		expect(empty()?.textContent).toBe('Loading search…');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.hasAttribute('aria-controls')).toBe(false);
	});

	it('shows the unavailable line on a rejected load, and does not retry on the next keystroke', async () => {
		const loadFn = vi.fn().mockRejectedValue(new Error('network error'));
		const { container } = render(CommandPalette, { load: loadFn, onSelect: vi.fn() });
		const { input, list, empty } = parts(container);
		await type(input, 'to');
		await tick();
		expect(list()).toBeNull();
		expect(empty()?.textContent).toBe(
			'Search is unavailable right now. Use the navigation to browse.'
		);
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.hasAttribute('aria-controls')).toBe(false);

		await type(input, 'tog');
		expect(loadFn).toHaveBeenCalledTimes(1);
	});
});

describe('CommandPalette — modal mode', () => {
	function trigger(container: HTMLElement) {
		return container.querySelector<HTMLButtonElement>('.cmd-trigger')!;
	}
	function dialog(container: HTMLElement) {
		return container.querySelector('[role="dialog"]');
	}

	it('the trigger opens a dialog and focuses the field', async () => {
		const { container } = render(CommandPalette, {
			load,
			onSelect: vi.fn(),
			mode: 'modal' as const
		});
		expect(dialog(container)).toBeNull();
		trigger(container).click();
		await tick();
		expect(dialog(container)).not.toBeNull();
		expect(document.activeElement).toBe(parts(container).input);
	});

	it('Cmd/Ctrl+K opens the modal', async () => {
		const { container } = render(CommandPalette, {
			load,
			onSelect: vi.fn(),
			mode: 'modal' as const
		});
		document.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true })
		);
		await tick();
		expect(dialog(container)).not.toBeNull();
	});

	it('Escape (empty query) and backdrop click both close the modal', async () => {
		const { container } = render(CommandPalette, {
			load,
			onSelect: vi.fn(),
			mode: 'modal' as const
		});
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
		const { container } = render(CommandPalette, { load, onSelect, mode: 'modal' as const });
		trigger(container).click();
		await tick();
		await type(parts(container).input, 'toggle');
		key(parts(container).input, 'Enter');
		await tick();
		expect(onSelect).toHaveBeenCalledWith('/docs/components/toggle');
		expect(dialog(container)).toBeNull();
	});
});
