import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import type { FileRejection } from '$lib/types';
import FileUpload from './FileUpload.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A fixed default lastModified so two separately-constructed Files with the
 *  same name/size compare as "the same underlying file" (identity dedupe). */
const DEFAULT_LAST_MODIFIED = 1_700_000_000_000;

function makeFile(name: string, size = 10, type = '', lastModified = DEFAULT_LAST_MODIFIED): File {
	return new File([new Uint8Array(size)], name, { type, lastModified });
}

function getInput(container: Element): HTMLInputElement {
	return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function getButton(container: Element): HTMLButtonElement | null {
	return container.querySelector('.hz-file-button');
}

function getDropzone(container: Element): HTMLElement | null {
	return container.querySelector('.hz-file-dropzone');
}

function getListItems(container: Element): HTMLLIElement[] {
	return Array.from(container.querySelectorAll('.hz-file-item'));
}

function getRemoveButtons(container: Element): HTMLButtonElement[] {
	return Array.from(container.querySelectorAll('.hz-file-remove'));
}

function getStatus(container: Element): HTMLElement {
	return container.querySelector('[role="status"]') as HTMLElement;
}

/** Dispatches a synthetic DragEvent carrying a real DataTransfer, bubbling
 *  so parent listeners (attached on `.hz-file-dropzone`) receive events fired
 *  on child elements — exercising the enter/leave-on-children depth counter. */
function dragEvent(type: string, dataTransfer: DataTransfer): DragEvent {
	return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
}

async function dropFiles(target: Element, files: File[]): Promise<void> {
	const dt = new DataTransfer();
	files.forEach((f) => dt.items.add(f));
	target.dispatchEvent(dragEvent('dragenter', dt));
	target.dispatchEvent(dragEvent('drop', dt));
	await tick();
}

/**
 * Picker-path selection via a manually-built DataTransfer (feasibility note:
 * "building a DataTransfer, dt.items.add(file), assigning input.files =
 * dt.files, and dispatching a change event"), rather than
 * `userEvent.upload` — Playwright's upload serialization does not guarantee
 * `lastModified` fidelity, so identity-dedupe assertions (name + size +
 * lastModified) use this path to keep the exact File object/timestamp.
 */
async function pickFiles(input: HTMLInputElement, files: File[]): Promise<void> {
	const dt = new DataTransfer();
	files.forEach((f) => dt.items.add(f));
	input.files = dt.files;
	input.dispatchEvent(new Event('change', { bubbles: true }));
	await tick();
}

// ---------------------------------------------------------------------------
// FileUpload-R1/R2 — Structure & modes
// ---------------------------------------------------------------------------

describe('FileUpload-R1 — structure & Field scaffold', () => {
	it('root is div.hz-field.hz-file-upload with data-state="default"', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X' });
		const root = container.querySelector('div.hz-field.hz-file-upload') as HTMLElement;
		expect(root).not.toBeNull();
		expect(root.getAttribute('data-state')).toBe('default');
	});

	it('data-dropzone is absent in basic mode and present in dropzone mode', () => {
		const basic = render(FileUpload, { name: 'x', label: 'X' });
		expect(basic.container.querySelector('.hz-file-upload')!.hasAttribute('data-dropzone')).toBe(
			false
		);

		const dz = render(FileUpload, { name: 'y', label: 'Y', dropzone: true });
		expect(dz.container.querySelector('.hz-file-upload')!.hasAttribute('data-dropzone')).toBe(true);
	});

	it('data-state="error" wins over disabled', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			error: 'Bad',
			disabled: true
		});
		expect(container.querySelector('.hz-file-upload')!.getAttribute('data-state')).toBe('error');
	});

	it('no files selected: the file list is absent and files is []', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-file-list')).toBeNull();
		expect(getInput(container).files?.length ?? 0).toBe(0);
	});
});

describe('FileUpload-R2 — native input (basic mode)', () => {
	it('basic mode renders a visible input[type=file] inside .hz-file-control', () => {
		const { container } = render(FileUpload, { name: 'putt', label: 'X', accept: 'image/*' });
		const control = container.querySelector('.hz-file-control') as HTMLElement;
		const input = getInput(container);
		expect(control.contains(input)).toBe(true);
		expect(input.hasAttribute('hidden')).toBe(false);
		expect(input.classList.contains('sr-only')).toBe(false);
		expect(input.name).toBe('putt');
		expect(input.getAttribute('accept')).toBe('image/*');
	});

	it('multiple attribute present only when multiple is true', () => {
		const single = render(FileUpload, { name: 'x', label: 'X' });
		expect(getInput(single.container).hasAttribute('multiple')).toBe(false);

		const multi = render(FileUpload, { name: 'y', label: 'Y', multiple: true });
		expect(getInput(multi.container).hasAttribute('multiple')).toBe(true);
	});

	it('no native required attribute even when required is true', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', required: true });
		expect(getInput(container).hasAttribute('required')).toBe(false);
		expect(getInput(container).getAttribute('aria-required')).toBe('true');
	});

	it('the input carries the Field aria-describedby chain', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			description: 'Help',
			error: 'Bad'
		});
		const input = getInput(container);
		const describedBy = input.getAttribute('aria-describedby')!;
		expect(describedBy).toContain('hz-desc-');
		expect(describedBy).toContain('hz-error-');
	});
});

describe('FileUpload-R2 — native input (dropzone mode)', () => {
	it('dropzone mode renders the input sr-only + aria-hidden + tabindex=-1, plus a real button and .hz-file-dropzone', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', dropzone: true });
		const input = getInput(container);
		expect(input.classList.contains('sr-only')).toBe(true);
		expect(input.getAttribute('aria-hidden')).toBe('true');
		expect(input.getAttribute('tabindex')).toBe('-1');
		expect(getButton(container)).not.toBeNull();
		expect(getDropzone(container)).not.toBeNull();
	});

	it('basic mode renders no .hz-file-button', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X' });
		expect(getButton(container)).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R3/R5/R9 — Picker ingestion & binding
// ---------------------------------------------------------------------------

describe('FileUpload-R3/R5/R9 — picker ingestion & binding', () => {
	it('single mode: selecting one file sets files, renders one row, syncs input.files, fires onchange', async () => {
		const onchange = vi.fn();
		const { container } = render(FileUpload, { name: 'x', label: 'X', onchange });
		const input = getInput(container);
		const file = makeFile('a.png', 100, 'image/png');
		await userEvent.upload(input, file);
		await tick();

		expect(getListItems(container).length).toBe(1);
		expect(onchange).toHaveBeenCalledWith([file]);
		expect(Array.from(input.files ?? []).map((f) => f.name)).toEqual(['a.png']);
	});

	it('single mode: a second pick replaces the first', async () => {
		const onchange = vi.fn();
		const { container } = render(FileUpload, { name: 'x', label: 'X', onchange });
		const input = getInput(container);
		await userEvent.upload(input, makeFile('a.png', 10, 'image/png'));
		await tick();
		const b = makeFile('b.png', 10, 'image/png');
		await userEvent.upload(input, b);
		await tick();

		expect(
			getListItems(container).map((li) => li.querySelector('.hz-file-name')?.textContent)
		).toEqual(['b.png']);
		expect(onchange).toHaveBeenLastCalledWith([b]);
	});

	it('multiple mode: selecting several appends and de-dupes across separate picks', async () => {
		const onchange = vi.fn();
		const { container } = render(FileUpload, { name: 'x', label: 'X', multiple: true, onchange });
		const input = getInput(container);
		const a = makeFile('a.txt', 10);
		const b = makeFile('b.txt', 10);
		await pickFiles(input, [a, b]);
		expect(getListItems(container).length).toBe(2);

		// Re-pick 'a' (same identity) alongside a brand-new 'c' — 'a' de-dupes.
		const aAgain = makeFile('a.txt', 10);
		const c = makeFile('c.txt', 10);
		await pickFiles(input, [aAgain, c]);

		const names = getListItems(container).map(
			(li) => li.querySelector('.hz-file-name')?.textContent
		);
		expect(names).toEqual(['a.txt', 'b.txt', 'c.txt']);
	});

	it('a programmatic files replacement re-renders the list and re-syncs the input without firing onchange', async () => {
		const onchange = vi.fn();
		const file = makeFile('seed.txt', 10);
		const { container, rerender } = render(FileUpload, {
			name: 'x',
			label: 'X',
			multiple: true,
			files: [file],
			onchange
		});
		expect(getListItems(container).length).toBe(1);

		const replacement = makeFile('replaced.txt', 20);
		await rerender({ files: [replacement] });
		await tick();

		expect(
			getListItems(container).map((li) => li.querySelector('.hz-file-name')?.textContent)
		).toEqual(['replaced.txt']);
		expect(Array.from(getInput(container).files ?? []).map((f) => f.name)).toEqual([
			'replaced.txt'
		]);
		// R3: onchange is a component-emitted callback — an external write to the
		// bound array must not re-fire it.
		expect(onchange).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R4 — DataTransfer sync & submission
// ---------------------------------------------------------------------------

describe('FileUpload-R4 — DataTransfer sync & submission', () => {
	it('input.files equals files in order after ingestion', async () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', multiple: true });
		const input = getInput(container);
		const a = makeFile('a.txt', 10);
		const b = makeFile('b.txt', 10);
		await userEvent.upload(input, [a, b]);
		await tick();
		expect(Array.from(input.files ?? []).map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
	});

	it('inside a form, FormData.getAll(name) returns the files and form.elements[name] resolves the single input', async () => {
		const form = document.createElement('form');
		document.body.appendChild(form);
		render(FileUpload, { target: form, props: { name: 'docs', label: 'Docs', multiple: true } });

		const input = getInput(form);
		const a = makeFile('a.txt', 10);
		const b = makeFile('b.txt', 10);
		await userEvent.upload(input, [a, b]);
		await tick();

		const resolved = form.elements.namedItem('docs');
		expect(resolved).toBeInstanceOf(HTMLInputElement);

		const data = new FormData(form);
		expect(data.getAll('docs').map((v) => (v as File).name)).toEqual(['a.txt', 'b.txt']);
		form.remove();
	});

	it('SSR / pre-mount: the Field scaffold and empty list render without a browser-only crash', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-field.hz-file-upload')).not.toBeNull();
		expect(container.querySelector('.hz-file-list')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R6 — Drop path
// ---------------------------------------------------------------------------

describe('FileUpload-R6 — drop path', () => {
	it('a drop ingests files identically to the picker', async () => {
		const onchange = vi.fn();
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			dropzone: true,
			multiple: true,
			onchange
		});
		const zone = getDropzone(container)!;
		const a = makeFile('a.txt', 10);
		await dropFiles(zone, [a]);

		expect(getListItems(container).length).toBe(1);
		expect(onchange).toHaveBeenCalledWith([a]);
	});

	it('dragenter/dragover set data-dragover; the depth counter survives child enter/leave; drop clears it', async () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', dropzone: true });
		const zone = getDropzone(container)!;
		const child = zone.querySelector('.hz-file-dropzone-text') as HTMLElement;
		const dt = new DataTransfer();
		dt.items.add(makeFile('a.txt', 10));

		zone.dispatchEvent(dragEvent('dragenter', dt));
		await tick();
		expect(zone.hasAttribute('data-dragover')).toBe(true);

		// Entering then leaving a child keeps the zone "over" via the depth counter.
		child.dispatchEvent(dragEvent('dragenter', dt));
		await tick();
		child.dispatchEvent(dragEvent('dragleave', dt));
		await tick();
		expect(zone.hasAttribute('data-dragover')).toBe(true);

		zone.dispatchEvent(dragEvent('dragleave', dt));
		await tick();
		expect(zone.hasAttribute('data-dragover')).toBe(false);
	});

	it('drop resets the depth counter to 0', async () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', dropzone: true });
		const zone = getDropzone(container)!;
		await dropFiles(zone, [makeFile('a.txt', 10)]);
		expect(zone.hasAttribute('data-dragover')).toBe(false);
	});

	it('a drop while disabled is a no-op — no data-dragover, no ingestion', async () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			dropzone: true,
			disabled: true
		});
		const zone = getDropzone(container)!;
		const dt = new DataTransfer();
		dt.items.add(makeFile('a.txt', 10));
		zone.dispatchEvent(dragEvent('dragenter', dt));
		await tick();
		expect(zone.hasAttribute('data-dragover')).toBe(false);
		zone.dispatchEvent(dragEvent('drop', dt));
		await tick();
		expect(container.querySelector('.hz-file-list')).toBeNull();
	});

	it('multi-file drop in single mode accepts the first and rejects the rest as too-many', async () => {
		const onreject = vi.fn();
		const { container } = render(FileUpload, { name: 'x', label: 'X', dropzone: true, onreject });
		const zone = getDropzone(container)!;
		const a = makeFile('a.txt', 10);
		const b = makeFile('b.txt', 10);
		const c = makeFile('c.txt', 10);
		await dropFiles(zone, [a, b, c]);

		expect(getListItems(container).length).toBe(1);
		expect(getListItems(container)[0].querySelector('.hz-file-name')?.textContent).toBe('a.txt');
		const rejections = onreject.mock.calls[0][0] as FileRejection[];
		expect(rejections.length).toBe(2);
		expect(rejections.every((r) => r.reason === 'too-many')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R7 — Validation & rejection reporting
// ---------------------------------------------------------------------------

describe('FileUpload-R7 — validation & rejection reporting', () => {
	it('an extension accept mismatch rejects with reason "type"', async () => {
		const onreject = vi.fn();
		const { container } = render(FileUpload, { name: 'x', label: 'X', accept: '.png', onreject });
		await userEvent.upload(getInput(container), makeFile('a.txt', 10, 'text/plain'));
		await tick();
		const rejections = onreject.mock.calls[0][0] as FileRejection[];
		expect(rejections[0].reason).toBe('type');
		expect(getInput(container).files?.length ?? 0).toBe(0);
	});

	it('an exact MIME accept mismatch rejects with reason "type"', async () => {
		const onreject = vi.fn();
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			accept: 'image/png',
			onreject
		});
		await userEvent.upload(getInput(container), makeFile('a.jpg', 10, 'image/jpeg'));
		await tick();
		expect((onreject.mock.calls[0][0] as FileRejection[])[0].reason).toBe('type');
	});

	it('a wildcard MIME accept mismatch rejects with reason "type"; a match passes', async () => {
		const onreject = vi.fn();
		const onchange = vi.fn();
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			accept: 'image/*',
			onreject,
			onchange
		});
		await userEvent.upload(getInput(container), makeFile('a.txt', 10, 'text/plain'));
		await tick();
		expect((onreject.mock.calls[0][0] as FileRejection[])[0].reason).toBe('type');
		expect(onchange).not.toHaveBeenCalled();

		await userEvent.upload(getInput(container), makeFile('a.png', 10, 'image/png'));
		await tick();
		expect(onchange).toHaveBeenCalled();
	});

	it('a file over maxSize rejects with reason "size"', async () => {
		const onreject = vi.fn();
		const { container } = render(FileUpload, { name: 'x', label: 'X', maxSize: 100, onreject });
		await userEvent.upload(getInput(container), makeFile('big.txt', 200));
		await tick();
		expect((onreject.mock.calls[0][0] as FileRejection[])[0].reason).toBe('size');
	});

	it('the size rejection message formats maxSize with the SI base-1000 formatter (1.0 MB, not 976.6 KB)', async () => {
		const onreject = vi.fn();
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			maxSize: 1_000_000,
			onreject
		});
		await userEvent.upload(getInput(container), makeFile('big.txt', 2_000_000));
		await tick();
		expect((onreject.mock.calls[0][0] as FileRejection[])[0].message).toBe(
			'big.txt exceeds the maximum size of 1.0 MB.'
		);
	});

	it('mixed valid + invalid pick ingests the valid file and reports all rejections in one onreject call', async () => {
		const onreject = vi.fn();
		const onchange = vi.fn();
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			multiple: true,
			accept: 'image/*',
			maxSize: 50,
			onreject,
			onchange
		});
		const good = makeFile('ok.png', 10, 'image/png');
		const wrongType = makeFile('bad.txt', 10, 'text/plain');
		const tooBig = makeFile('huge.png', 100, 'image/png');
		await userEvent.upload(getInput(container), [good, wrongType, tooBig]);
		await tick();

		expect(getListItems(container).length).toBe(1);
		expect(onreject).toHaveBeenCalledTimes(1);
		expect((onreject.mock.calls[0][0] as FileRejection[]).length).toBe(2);
	});

	it('the component never sets error itself — a rejection leaves data-state at default', async () => {
		const onreject = vi.fn();
		const { container } = render(FileUpload, { name: 'x', label: 'X', accept: '.png', onreject });
		await userEvent.upload(getInput(container), makeFile('a.txt', 10, 'text/plain'));
		await tick();
		expect(onreject).toHaveBeenCalled();
		expect(container.querySelector('.hz-file-upload')!.getAttribute('data-state')).toBe('default');
		expect(container.querySelector('.hz-field-error')).toBeNull();
	});

	describe('multiple + maxFiles cap accounting', () => {
		it('an over-cap batch fills the remaining slots in order and rejects the excess as too-many', async () => {
			const onreject = vi.fn();
			const { container } = render(FileUpload, {
				name: 'x',
				label: 'X',
				multiple: true,
				maxFiles: 2,
				onreject
			});
			const a = makeFile('a.txt', 10);
			const b = makeFile('b.txt', 10);
			const c = makeFile('c.txt', 10);
			await userEvent.upload(getInput(container), [a, b, c]);
			await tick();

			expect(
				getListItems(container).map((li) => li.querySelector('.hz-file-name')?.textContent)
			).toEqual(['a.txt', 'b.txt']);
			const rejections = onreject.mock.calls[0][0] as FileRejection[];
			expect(rejections.length).toBe(1);
			expect(rejections[0].reason).toBe('too-many');
			expect(rejections[0].file.name).toBe('c.txt');
		});

		it('a pick at the cap rejects all non-duplicate valid files and leaves files unchanged', async () => {
			const seed = makeFile('seed.txt', 10);
			const onreject = vi.fn();
			const onchange = vi.fn();
			const { container } = render(FileUpload, {
				name: 'x',
				label: 'X',
				multiple: true,
				maxFiles: 1,
				files: [seed],
				onreject,
				onchange
			});
			await userEvent.upload(getInput(container), [makeFile('new.txt', 10)]);
			await tick();

			expect(
				getListItems(container).map((li) => li.querySelector('.hz-file-name')?.textContent)
			).toEqual(['seed.txt']);
			expect(onchange).not.toHaveBeenCalled();
			const rejections = onreject.mock.calls[0][0] as FileRejection[];
			expect(rejections[0].reason).toBe('too-many');
		});

		it('a duplicate re-picked at the cap is de-duped, not rejected, and files is unchanged', async () => {
			const seed = makeFile('seed.txt', 10);
			const onreject = vi.fn();
			const onchange = vi.fn();
			const { container } = render(FileUpload, {
				name: 'x',
				label: 'X',
				multiple: true,
				maxFiles: 1,
				files: [seed],
				onreject,
				onchange
			});
			const seedAgain = makeFile('seed.txt', 10);
			await pickFiles(getInput(container), [seedAgain]);

			expect(getListItems(container).length).toBe(1);
			expect(onreject).not.toHaveBeenCalled();
			expect(onchange).not.toHaveBeenCalled();
		});

		it('maxFiles is ignored in single mode', async () => {
			const onchange = vi.fn();
			const { container } = render(FileUpload, {
				name: 'x',
				label: 'X',
				maxFiles: 1,
				onchange
			});
			await userEvent.upload(getInput(container), makeFile('a.txt', 10));
			await tick();
			expect(getListItems(container).length).toBe(1);
			// A second pick still replaces (cap is inherently 1, not governed by maxFiles).
			await userEvent.upload(getInput(container), makeFile('b.txt', 10));
			await tick();
			expect(
				getListItems(container).map((li) => li.querySelector('.hz-file-name')?.textContent)
			).toEqual(['b.txt']);
		});
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R8 — Removable list
// ---------------------------------------------------------------------------

describe('FileUpload-R8 — removable list', () => {
	it('one row per file with name + human-readable size, and a Remove {name} button', async () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			multiple: true,
			files: [makeFile('a.png', 512), makeFile('b.png', 1536)]
		});
		const items = getListItems(container);
		expect(items.length).toBe(2);
		expect(items[0].querySelector('.hz-file-name')?.textContent).toBe('a.png');
		expect(items[0].querySelector('.hz-file-size')?.textContent).toBe('512 B');
		expect(items[1].querySelector('.hz-file-size')?.textContent).toBe('1.5 KB');
		const buttons = getRemoveButtons(container);
		expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
			'Remove a.png',
			'Remove b.png'
		]);
	});

	it('formatSize renders 2.0 MB for a 2,000,000-byte file (SI base-1000)', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			files: [makeFile('big.bin', 2_000_000)]
		});
		expect(getListItems(container)[0].querySelector('.hz-file-size')?.textContent).toBe('2.0 MB');
	});

	it('formatSize renders 1.0 MB for a 1,000,000-byte file (SI base-1000)', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			files: [makeFile('exact.bin', 1_000_000)]
		});
		expect(getListItems(container)[0].querySelector('.hz-file-size')?.textContent).toBe('1.0 MB');
	});

	it('removing a file splices files, re-syncs the input, and fires onchange', async () => {
		const onchange = vi.fn();
		const a = makeFile('a.txt', 10);
		const b = makeFile('b.txt', 10);
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			multiple: true,
			files: [a, b],
			onchange
		});
		const buttons = getRemoveButtons(container);
		await userEvent.click(buttons[0]);
		await tick();

		expect(
			getListItems(container).map((li) => li.querySelector('.hz-file-name')?.textContent)
		).toEqual(['b.txt']);
		expect(onchange).toHaveBeenCalledWith([b]);
		expect(Array.from(getInput(container).files ?? []).map((f) => f.name)).toEqual(['b.txt']);
	});

	it('removing a middle file moves focus to the next remove button', async () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			multiple: true,
			files: [makeFile('a.txt', 10), makeFile('b.txt', 10), makeFile('c.txt', 10)]
		});
		const buttons = getRemoveButtons(container);
		await userEvent.click(buttons[0]); // remove 'a'
		await tick();

		const remaining = getRemoveButtons(container);
		expect(remaining.length).toBe(2);
		expect(document.activeElement).toBe(remaining[0]);
		expect(remaining[0].getAttribute('aria-label')).toBe('Remove b.txt');
	});

	it('removing the last file moves focus to the activation button in dropzone mode', async () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			dropzone: true,
			files: [makeFile('only.txt', 10)]
		});
		const buttons = getRemoveButtons(container);
		await userEvent.click(buttons[0]);
		await tick();

		expect(container.querySelector('.hz-file-list')).toBeNull();
		expect(document.activeElement).toBe(getButton(container));
	});

	it('removing the last file moves focus to the input in basic mode', async () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			files: [makeFile('only.txt', 10)]
		});
		const buttons = getRemoveButtons(container);
		await userEvent.click(buttons[0]);
		await tick();

		expect(document.activeElement).toBe(getInput(container));
	});

	it('disabled renders the list without remove buttons', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			disabled: true,
			files: [makeFile('a.txt', 10)]
		});
		expect(getListItems(container).length).toBe(1);
		expect(getRemoveButtons(container).length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R10 — Activation control (dropzone mode)
// ---------------------------------------------------------------------------

describe('FileUpload-R10 — activation control', () => {
	it('the dropzone button is a real <button>, not a role="button" div', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', dropzone: true });
		const button = getButton(container)!;
		expect(button.tagName).toBe('BUTTON');
		expect(button.getAttribute('type')).toBe('button');
	});

	it('clicking the button calls inputEl.click() to open the native picker', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const { container } = render(FileUpload, { name: 'x', label: 'X', dropzone: true });
		await userEvent.click(getButton(container)!);
		expect(clickSpy).toHaveBeenCalled();
		clickSpy.mockRestore();
	});

	it('disabled disables the activation button', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			dropzone: true,
			disabled: true
		});
		expect(getButton(container)!.disabled).toBe(true);
	});

	it('the default buttonText is "Browse files"; a custom buttonText overrides it', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', dropzone: true });
		expect(getButton(container)!.textContent?.trim()).toBe('Browse files');

		const custom = render(FileUpload, {
			name: 'y',
			label: 'Y',
			dropzone: true,
			buttonText: 'Choose a file'
		});
		expect(getButton(custom.container)!.textContent?.trim()).toBe('Choose a file');
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R11 — Field states
// ---------------------------------------------------------------------------

describe('FileUpload-R11 — field states', () => {
	it('required: aria-required="true" and the visual *, no native required', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', required: true });
		expect(getInput(container).getAttribute('aria-required')).toBe('true');
		expect(getInput(container).hasAttribute('required')).toBe(false);
		expect(container.querySelector('.hz-field-required')).not.toBeNull();
	});

	it('disabled: native disabled on the input and the dropzone button, data-state="disabled"', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			dropzone: true,
			disabled: true
		});
		expect(getInput(container).disabled).toBe(true);
		expect(getButton(container)!.disabled).toBe(true);
		expect(container.querySelector('.hz-file-upload')!.getAttribute('data-state')).toBe('disabled');
	});

	it('error: role="alert" message, aria-invalid, data-state="error" (wins over disabled)', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			error: 'A file is required.',
			disabled: true
		});
		const err = container.querySelector('.hz-field-error') as HTMLElement;
		expect(err.getAttribute('role')).toBe('alert');
		expect(getInput(container).getAttribute('aria-invalid')).toBe('true');
		expect(container.querySelector('.hz-file-upload')!.getAttribute('data-state')).toBe('error');
		expect(getInput(container).disabled).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R16 — Live region
// ---------------------------------------------------------------------------

describe('FileUpload-R16 — live region', () => {
	it('is a role="status" aria-live="polite" region', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X' });
		const status = getStatus(container);
		expect(status.getAttribute('aria-live')).toBe('polite');
		expect(status.classList.contains('sr-only')).toBe(true);
	});

	it('announces additions on picker ingestion', async () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', multiple: true });
		await userEvent.upload(getInput(container), [makeFile('a.txt', 10), makeFile('b.txt', 10)]);
		await tick();
		expect(getStatus(container).textContent).toContain('added');
	});

	it('announces rejections when a pick yields rejected files', async () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', accept: '.png' });
		await userEvent.upload(getInput(container), makeFile('a.txt', 10, 'text/plain'));
		await tick();
		expect(getStatus(container).textContent).toContain('rejected');
	});

	it('announces removal by file name', async () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			files: [makeFile('report.pdf', 10)]
		});
		await userEvent.click(getRemoveButtons(container)[0]);
		await tick();
		expect(getStatus(container).textContent).toContain('report.pdf removed');
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R12 — class & rest
// ---------------------------------------------------------------------------

describe('FileUpload-R12 — class & rest', () => {
	it('no class: root is exactly "hz-field hz-file-upload"', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-field', 'hz-file-upload']);
	});

	it('class="foo" is appended after the base classes', () => {
		const { container } = render(FileUpload, { name: 'x', label: 'X', class: 'foo' });
		const root = container.querySelector('.hz-field') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-field');
		expect(classes).toContain('hz-file-upload');
		expect(classes).toContain('foo');
	});

	it('a forwarded data-testid and oninput reach the native input', async () => {
		const oninput = vi.fn();
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			'data-testid': 'my-upload',
			oninput
		});
		const input = getInput(container);
		expect(input.getAttribute('data-testid')).toBe('my-upload');
		await userEvent.upload(input, makeFile('a.txt', 10));
		expect(oninput).toHaveBeenCalled();
	});

	it('an attempted id/type/accept/class override loses to the managed value', () => {
		const { container } = render(FileUpload, {
			name: 'x',
			label: 'X',
			accept: 'image/*',
			id: 'hijacked',
			type: 'text',
			class: 'not-applied-to-input'
		});
		const input = getInput(container);
		expect(input.id).not.toBe('hijacked');
		expect(input.id).toMatch(/^hz-input-/);
		expect(input.type).toBe('file');
		expect(input.getAttribute('accept')).toBe('image/*');
		expect(input.classList.contains('not-applied-to-input')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// FileUpload-R14 — Barrel export
// ---------------------------------------------------------------------------

describe('FileUpload-R14 — barrel export', () => {
	it('FileUpload is resolvable from $lib and smoke-renders', async () => {
		const { FileUpload: F } = await import('$lib');
		expect(F).toBeDefined();
		const { container } = render(F, { name: 'x', label: 'X' });
		expect(container.querySelector('.hz-file-upload')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Integration — native <form>
// ---------------------------------------------------------------------------

describe('Integration — native form participation', () => {
	it('selecting files then submitting a form includes them via FormData', async () => {
		const form = document.createElement('form');
		document.body.appendChild(form);
		const submitBtn = document.createElement('button');
		submitBtn.type = 'submit';
		form.appendChild(submitBtn);

		render(FileUpload, {
			target: form,
			props: { name: 'attachments', label: 'Attachments', multiple: true }
		});

		const input = getInput(form);
		await userEvent.upload(input, [makeFile('a.txt', 10), makeFile('b.txt', 10)]);
		await tick();

		const data = new FormData(form);
		expect(data.getAll('attachments').map((v) => (v as File).name)).toEqual(['a.txt', 'b.txt']);
		form.remove();
	});
});
