import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import CodeBlock from './CodeBlock.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE = 'const total = a + b;\nreturn total;';

function getRoot(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-code-block') as HTMLElement;
}

function getClip(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-code-block-clip') as HTMLElement;
}

function getCopyButton(container: HTMLElement): HTMLButtonElement | null {
	return container.querySelector('.hz-code-block-copy') as HTMLButtonElement | null;
}

function getLiveRegion(container: HTMLElement): HTMLElement | null {
	return container.querySelector('[aria-live="polite"]');
}

/** A fake Shiki-shaped block — its own focusable <pre>, one <span class="line">
 *  per source line — for the R19 escape-hatch tests. */
const shikiLike = createRawSnippet(() => ({
	render: () =>
		`<pre class="shiki" tabindex="0" data-testid="shiki-pre"><code><span class="line">const total = a + b;</span><span class="line">return total;</span></code></pre>`
}));

const originalClipboard = (navigator as unknown as { clipboard?: Clipboard }).clipboard;

/** Stubs `navigator.clipboard.writeText`, restored in `afterEach` below. */
function stubClipboard(writeText: (text: string) => Promise<void>): void {
	Object.defineProperty(navigator, 'clipboard', {
		value: { writeText },
		configurable: true
	});
}

afterEach(() => {
	if (originalClipboard) {
		Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
	} else {
		// @ts-expect-error — test-only cleanup of a stubbed global.
		delete navigator.clipboard;
	}
});

function tick(ms = 0): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// render() can't carry every prop's exact literal type through — mirrors the
// Table/Carousel/Toc specs' note.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CB = CodeBlock as any;

// ---------------------------------------------------------------------------
// CodeBlock-R1 — structure
// ---------------------------------------------------------------------------

describe('CodeBlock-R1 — structure', () => {
	it('renders div.hz-code-block wrapping .hz-code-block-clip > pre > code whose text equals `code`', () => {
		const { container } = render(CB, { code: SAMPLE });
		const root = getRoot(container);
		expect(root.tagName.toLowerCase()).toBe('div');
		const clip = getClip(container);
		expect(clip).not.toBeNull();
		const codeEl = clip.querySelector('pre > code') as HTMLElement;
		expect(codeEl.textContent).toBe(SAMPLE);
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R3 — copy button
// ---------------------------------------------------------------------------

describe('CodeBlock-R3 — copy', () => {
	it('renders a copy Button by default; click copies the exact `code` string and flips the label; the live region announces', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		stubClipboard(writeText);
		const { container } = render(CB, { code: SAMPLE });
		const btn = getCopyButton(container)!;
		expect(btn).not.toBeNull();
		expect(btn.textContent?.trim()).toBe('Copy');

		btn.click();
		await tick();

		expect(writeText).toHaveBeenCalledWith(SAMPLE);
		expect(getCopyButton(container)!.textContent?.trim()).toBe('Copied');
		expect(getLiveRegion(container)?.textContent).toBe('Code copied to clipboard');
	});

	it('copyable={false}: no copy button and no live region', () => {
		const { container } = render(CB, { code: SAMPLE, copyable: false });
		expect(getCopyButton(container)).toBeNull();
		expect(getLiveRegion(container)).toBeNull();
	});

	it('a rejected clipboard write is swallowed: the label stays "Copy" and nothing throws', async () => {
		const writeText = vi.fn().mockRejectedValue(new Error('denied'));
		stubClipboard(writeText);
		const { container } = render(CB, { code: SAMPLE });
		const btn = getCopyButton(container)!;

		await expect(async () => {
			btn.click();
			await tick();
		}).not.toThrow();

		expect(getCopyButton(container)!.textContent?.trim()).toBe('Copy');
		expect(getLiveRegion(container)?.textContent).toBe('');
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R19 — pre-highlighted content escape hatch
// ---------------------------------------------------------------------------

describe('CodeBlock-R19 — children escape hatch', () => {
	it('renders the snippet content instead of the default pre/code, and stamps data-highlighted', () => {
		const { container } = render(CB, { code: SAMPLE, children: shikiLike });
		const clip = getClip(container);
		expect(clip.querySelector('[data-testid="shiki-pre"]')).not.toBeNull();
		// The component emits no default <pre><code>{code}</code> of its own —
		// only the consumer's own <pre> (matched above) exists in the clip.
		expect(clip.querySelectorAll('pre')).toHaveLength(1);
		expect(getRoot(container).getAttribute('data-highlighted')).toBe('');
	});

	it("the clip omits its own tabindex so the consumer's focusable <pre> is the only stop", () => {
		const { container } = render(CB, { code: SAMPLE, children: shikiLike });
		expect(getClip(container).hasAttribute('tabindex')).toBe(false);
	});

	it('copy still writes the raw `code` prop, not the injected markup', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		stubClipboard(writeText);
		const { container } = render(CB, { code: SAMPLE, children: shikiLike });
		getCopyButton(container)!.click();
		await tick();
		expect(writeText).toHaveBeenCalledWith(SAMPLE);
	});

	it('with lineNumbers, the gutter still renders 1…lineCount as a sibling of the injected block', () => {
		const { container } = render(CB, { code: SAMPLE, children: shikiLike, lineNumbers: true });
		const gutter = container.querySelector('.hz-code-block-gutter') as HTMLElement;
		expect(gutter.textContent).toBe('1\n2');
		expect(gutter.nextElementSibling?.getAttribute('data-testid')).toBe('shiki-pre');
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R4 — header composition (title × language matrix)
// ---------------------------------------------------------------------------

describe('CodeBlock-R4 — header composition', () => {
	it('title only: header + title, no tag, data-has-title, no data-language, copy trailing in the header', () => {
		const { container } = render(CB, { code: SAMPLE, title: 'app/routes/+page.svelte' });
		const header = container.querySelector('.hz-code-block-header') as HTMLElement;
		expect(header).not.toBeNull();
		expect(header.querySelector('.hz-code-block-title')?.textContent).toBe(
			'app/routes/+page.svelte'
		);
		expect(header.querySelector('.hz-code-block-lang')).toBeNull();
		expect(header.querySelector('.hz-code-block-copy')).not.toBeNull();
		expect(Array.from(header.children).at(-1)).toBe(getCopyButton(container));
		expect(getRoot(container).getAttribute('data-has-title')).toBe('');
		expect(getRoot(container).hasAttribute('data-language')).toBe(false);
	});

	it('language only: header + tag (leading), data-language, no data-has-title, copy trailing in the header', () => {
		const { container } = render(CB, { code: SAMPLE, language: 'css' });
		const header = container.querySelector('.hz-code-block-header') as HTMLElement;
		expect(header).not.toBeNull();
		expect(header.querySelector('.hz-code-block-title')).toBeNull();
		expect(header.querySelector('.hz-code-block-lang')?.textContent).toBe('css');
		expect(header.querySelector('.hz-code-block-copy')).not.toBeNull();
		expect(header.children[0]).toBe(container.querySelector('.hz-code-block-lang'));
		expect(Array.from(header.children).at(-1)).toBe(getCopyButton(container));
		expect(getRoot(container).hasAttribute('data-has-title')).toBe(false);
		expect(getRoot(container).getAttribute('data-language')).toBe('css');
	});

	it('title + language: the chip leads, the title follows, copy trails — both attrs stamped', () => {
		const { container } = render(CB, { code: SAMPLE, title: 'styles.css', language: 'css' });
		const header = container.querySelector('.hz-code-block-header') as HTMLElement;
		const lang = container.querySelector('.hz-code-block-lang');
		const titleEl = container.querySelector('.hz-code-block-title');
		expect(titleEl?.textContent).toBe('styles.css');
		expect(lang?.textContent).toBe('css');
		expect(Array.from(header.children)).toEqual([lang, titleEl, getCopyButton(container)]);
		expect(getRoot(container).getAttribute('data-has-title')).toBe('');
		expect(getRoot(container).getAttribute('data-language')).toBe('css');
	});

	it('neither title nor language: no header; the copy button floats as a direct child of the root', () => {
		const { container } = render(CB, { code: SAMPLE });
		expect(container.querySelector('.hz-code-block-header')).toBeNull();
		const root = getRoot(container);
		const btn = getCopyButton(container)!;
		expect(Array.from(root.children)).toContain(btn);
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R5 — collapse
// ---------------------------------------------------------------------------

describe('CodeBlock-R5 — collapse', () => {
	const longCode = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
	const shortCode = 'line 1\nline 2';

	it('a listing longer than collapsedLines renders the expand toggle, wired for a11y, and data-collapsible', async () => {
		const { container } = render(CB, { code: longCode, collapsible: true, collapsedLines: 16 });
		const root = getRoot(container);
		expect(root.getAttribute('data-collapsible')).toBe('');
		const toggle = container.querySelector('.hz-code-block-expand') as HTMLButtonElement;
		expect(toggle).not.toBeNull();
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(toggle.getAttribute('aria-controls')).toBe(getClip(container).id);

		toggle.click();
		await tick();
		expect(
			(container.querySelector('.hz-code-block-expand') as HTMLElement).getAttribute(
				'aria-expanded'
			)
		).toBe('true');
	});

	it('a listing at or under collapsedLines renders no toggle and no data-collapsible', () => {
		const { container } = render(CB, { code: shortCode, collapsible: true, collapsedLines: 16 });
		expect(getRoot(container).hasAttribute('data-collapsible')).toBe(false);
		expect(container.querySelector('.hz-code-block-expand')).toBeNull();
	});

	it('collapsible={false} never collapses regardless of length', () => {
		const { container } = render(CB, { code: longCode, collapsedLines: 16 });
		expect(getRoot(container).hasAttribute('data-collapsible')).toBe(false);
		expect(container.querySelector('.hz-code-block-expand')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R6 — line numbers
// ---------------------------------------------------------------------------

describe('CodeBlock-R6 — line numbers', () => {
	it('renders an aria-hidden gutter of 1…lineCount, stamps data-line-numbers, and leaves the code node a single text node', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		stubClipboard(writeText);
		const { container } = render(CB, { code: SAMPLE, lineNumbers: true });
		const gutter = container.querySelector('.hz-code-block-gutter') as HTMLElement;
		expect(gutter.getAttribute('aria-hidden')).toBe('true');
		expect(gutter.textContent).toBe('1\n2');
		expect(getRoot(container).getAttribute('data-line-numbers')).toBe('');

		const codeEl = getClip(container).querySelector('pre > code') as HTMLElement;
		expect(codeEl.childNodes).toHaveLength(1);
		expect(codeEl.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
		expect(codeEl.textContent).toBe(SAMPLE);

		getCopyButton(container)!.click();
		await tick();
		expect(writeText).toHaveBeenCalledWith(SAMPLE);
	});

	it('no lineNumbers: no gutter, no data-line-numbers', () => {
		const { container } = render(CB, { code: SAMPLE });
		expect(container.querySelector('.hz-code-block-gutter')).toBeNull();
		expect(getRoot(container).hasAttribute('data-line-numbers')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R7 — language client-autoloader hook
// ---------------------------------------------------------------------------

describe('CodeBlock-R7 — language hook', () => {
	it('stamps class="language-ts" on the default code, data-language on the root, and the header tag; copy still yields raw code', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		stubClipboard(writeText);
		const { container } = render(CB, { code: SAMPLE, language: 'ts' });
		const codeEl = getClip(container).querySelector('pre > code') as HTMLElement;
		expect(codeEl.classList.contains('language-ts')).toBe(true);
		expect(getRoot(container).getAttribute('data-language')).toBe('ts');
		expect(container.querySelector('.hz-code-block-lang')?.textContent).toBe('ts');

		getCopyButton(container)!.click();
		await tick();
		expect(writeText).toHaveBeenCalledWith(SAMPLE);
	});

	it('no language: no class on the default code, no data-language, no tag', () => {
		const { container } = render(CB, { code: SAMPLE });
		const codeEl = getClip(container).querySelector('pre > code') as HTMLElement;
		// Svelte's own scoping hash class rides along regardless (the component
		// has scoped CSS); no `language-*` class is what R7 actually promises.
		expect(Array.from(codeEl.classList).some((c) => c.startsWith('language-'))).toBe(false);
		expect(getRoot(container).hasAttribute('data-language')).toBe(false);
		expect(container.querySelector('.hz-code-block-lang')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R8 — accessibility
// ---------------------------------------------------------------------------

describe('CodeBlock-R8 — accessibility', () => {
	it('the default clip is a focusable, named group', () => {
		const { container } = render(CB, { code: SAMPLE });
		const clip = getClip(container);
		expect(clip.getAttribute('role')).toBe('group');
		expect(clip.getAttribute('tabindex')).toBe('0');
		expect(clip.getAttribute('aria-label')).toBe('Code');
	});

	it('with `title`, the clip is aria-labelledby the title id', () => {
		const { container } = render(CB, { code: SAMPLE, title: 'app.ts' });
		const clip = getClip(container);
		const titleEl = container.querySelector('.hz-code-block-title') as HTMLElement;
		expect(clip.getAttribute('aria-labelledby')).toBe(titleEl.id);
		expect(clip.hasAttribute('aria-label')).toBe(false);
	});

	it('without `title`, aria-label is language-derived when `language` is set', () => {
		const { container } = render(CB, { code: SAMPLE, language: 'python' });
		expect(getClip(container).getAttribute('aria-label')).toBe('python code');
	});

	it('the gutter is aria-hidden and the language tag has no role/tabindex', () => {
		const { container } = render(CB, { code: SAMPLE, language: 'ts', lineNumbers: true });
		expect(
			(container.querySelector('.hz-code-block-gutter') as HTMLElement).getAttribute('aria-hidden')
		).toBe('true');
		const tag = container.querySelector('.hz-code-block-lang') as HTMLElement;
		expect(tag.hasAttribute('role')).toBe(false);
		expect(tag.hasAttribute('tabindex')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// class / rest forwarding
// ---------------------------------------------------------------------------

describe('CodeBlock — class and rest forwarding', () => {
	it('class merges after hz-code-block; a rest attr forwards; a colliding managed attr is won by the component', () => {
		const { container } = render(CB, {
			code: SAMPLE,
			class: 'my-block',
			'data-testid': 'my-code',
			'data-language': 'clobbered'
		} as Record<string, unknown>);
		const root = getRoot(container);
		expect(root.classList.contains('hz-code-block')).toBe(true);
		expect(root.classList.contains('my-block')).toBe(true);
		expect(root.getAttribute('data-testid')).toBe('my-code');
		expect(root.hasAttribute('data-language')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// CodeBlock-R11 — barrel export
// ---------------------------------------------------------------------------

describe('CodeBlock-R11 — barrel export', () => {
	it('resolves from $lib and smoke-renders `.hz-code-block`', async () => {
		const { CodeBlock: C } = await import('$lib');
		expect(C).toBeDefined();
		const { container } = render(C, { code: SAMPLE });
		expect(container.querySelector('.hz-code-block')).not.toBeNull();
	});
});
