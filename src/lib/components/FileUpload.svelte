<script lang="ts">
	import { tick } from 'svelte';
	import type { FieldBase, FileRejection } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';
	import IconX from '$lib/icons/generated/x.svelte';

	interface Props extends FieldBase {
		files?: File[];
		multiple?: boolean;
		accept?: string;
		maxSize?: number;
		maxFiles?: number;
		dropzone?: boolean;
		buttonText?: string;
		dropzoneText?: string;
		onchange?: (files: File[]) => void;
		onreject?: (rejections: FileRejection[]) => void;
		/** The underlying file `<input>` element — `bind:element` for focus/shortcuts. */
		element?: HTMLInputElement;
		class?: string;
		[key: string]: unknown;
	}

	let {
		name,
		label,
		description,
		error,
		required = false,
		disabled = false,
		hideLabel = false,
		files = $bindable([]),
		multiple = false,
		accept,
		maxSize,
		maxFiles,
		dropzone = false,
		buttonText = 'Browse files',
		dropzoneText = 'Drag and drop files here, or',
		onchange,
		onreject,
		// eslint-disable-next-line no-useless-assignment -- write-only bindable; mirrored from the private ref
		element = $bindable(),
		class: className,
		...rest
	}: Props = $props();

	// derive one stable uid base per instance.
	const _uid = uid('hz');
	const inputId = `hz-input-${_uid}`;
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;
	// live-region + list ids.
	const statusId = `hz-status-${_uid}`;
	const listId = `hz-filelist-${_uid}`;

	// aria-describedby chain.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// ------------------------------------------------------------------
	// Element refs.
	// ------------------------------------------------------------------
	// Internal logic reads this private ref, not `element` — an unbound
	// bindable prop can go stale when the parent swaps its props object;
	// the effect mirrors it out.
	let inputEl = $state<HTMLInputElement | null>(null);
	let buttonEl = $state<HTMLButtonElement | null>(null);
	let listEl = $state<HTMLUListElement | null>(null);

	$effect(() => {
		element = inputEl ?? undefined;
	});

	// dragover depth counter (survives enter/leave on children).
	let dragCounter = $state(0);

	// live-region status text.
	let statusMessage = $state('');

	// ------------------------------------------------------------------
	// Size formatter. SI base-1000 units, integer bytes, one
	// decimal place for KB and above. Locale-agnostic (fixed '.' separator).
	// ------------------------------------------------------------------
	function formatSize(bytes: number): string {
		if (bytes < 1000) return `${Math.round(bytes)} B`;
		const units = ['KB', 'MB', 'GB'];
		let value = bytes / 1000;
		let unitIndex = 0;
		while (value >= 1000 && unitIndex < units.length - 1) {
			value /= 1000;
			unitIndex++;
		}
		return `${value.toFixed(1)} ${units[unitIndex]}`;
	}

	// Stable file identity — name + size + lastModified.
	function fileKey(f: File): string {
		return `${f.name}\0${f.size}\0${f.lastModified}`;
	}

	// ------------------------------------------------------------------
	// Validation. Pure per-file accept/maxSize check, run on
	// every incoming file from both the picker and drop paths.
	// ------------------------------------------------------------------
	function matchesAccept(file: File, acceptList: string): boolean {
		const tokens = acceptList
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		if (tokens.length === 0) return true;
		return tokens.some((token) => {
			if (token.startsWith('.')) {
				return file.name.toLowerCase().endsWith(token.toLowerCase());
			}
			if (token.endsWith('/*')) {
				const type = token.slice(0, -2).toLowerCase();
				return file.type.split('/')[0]?.toLowerCase() === type;
			}
			return file.type.toLowerCase() === token.toLowerCase();
		});
	}

	function validateFile(file: File): FileRejection | null {
		if (accept && !matchesAccept(file, accept)) {
			return { file, reason: 'type', message: `${file.name} is not an accepted file type.` };
		}
		if (maxSize !== undefined && file.size > maxSize) {
			return {
				file,
				reason: 'size',
				message: `${file.name} exceeds the maximum size of ${formatSize(maxSize)}.`
			};
		}
		return null;
	}

	// ------------------------------------------------------------------
	// DataTransfer sync. Keeps the real input's FileList
	// exactly equal to `files` so a plain form POST submits precisely the
	// selected files. Reassigning input.files does not fire `change`.
	// SSR-safe: DataTransfer/File are browser-only globals.
	// ------------------------------------------------------------------
	function syncInput(list: File[]) {
		if (typeof DataTransfer === 'undefined' || !inputEl) return;
		const dt = new DataTransfer();
		for (const f of list) dt.items.add(f);
		inputEl.files = dt.files;
	}

	// Covers programmatic `files` changes (parent rebinds the array) and the
	// initial mount sync (see the SSR note above). Internal mutations below
	// also call syncInput() explicitly and synchronously so rejected files
	// never linger on the native input, even when the accepted model is
	// unchanged (e.g. every incoming file was rejected).
	$effect(() => {
		syncInput(files);
	});

	// announce the outcome of a pick/drop.
	function announceIngest(added: number, rejected: number) {
		const parts: string[] = [];
		if (added > 0) parts.push(`${added} file${added === 1 ? '' : 's'} added`);
		if (rejected > 0) parts.push(`${rejected} file${rejected === 1 ? '' : 's'} rejected`);
		if (parts.length > 0) statusMessage = parts.join(', ');
	}

	// ------------------------------------------------------------------
	// Ingestion pipeline. Shared by the picker
	// (`change`) and drop paths so both validate identically.
	// ------------------------------------------------------------------
	function ingest(incoming: File[]) {
		if (incoming.length === 0) return;

		const rejections: FileRejection[] = [];
		const valid: File[] = [];

		for (const file of incoming) {
			const rejection = validateFile(file);
			if (rejection) rejections.push(rejection);
			else valid.push(file);
		}

		let added = 0;

		if (!multiple) {
			// single mode's cap is inherently 1 — the first
			// valid file replaces `files`; every additional valid file rejects.
			if (valid.length > 0) {
				const [first, ...extra] = valid;
				files = [first];
				added = 1;
				for (const f of extra) {
					rejections.push({
						file: f,
						reason: 'too-many',
						message: `${f.name} was not added — only one file may be selected.`
					});
				}
			}
		} else {
			// de-dupe by identity BEFORE cap accounting — a
			// duplicate consumes no slot and is not a rejection — then fill the
			// remaining slots (cap − files.length) in order.
			const cap = maxFiles ?? Infinity;
			const existingKeys: string[] = files.map(fileKey);
			const next = [...files];
			for (const file of valid) {
				const key = fileKey(file);
				if (existingKeys.includes(key)) continue;
				if (next.length >= cap) {
					rejections.push({
						file,
						reason: 'too-many',
						message: `${file.name} was not added — the ${cap}-file limit has been reached.`
					});
					continue;
				}
				next.push(file);
				existingKeys.push(key);
				added++;
			}
			if (added > 0) files = next;
		}

		// rebuild the input regardless of whether the model
		// changed, so rejected files never linger on the native input's
		// FileList even when `files` itself is unchanged.
		syncInput(files);

		if (added > 0) onchange?.(files);
		if (rejections.length > 0) onreject?.(rejections);
		announceIngest(added, rejections.length);
	}

	// picker-path ingestion.
	function handleInputChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const incoming = target.files ? Array.from(target.files) : [];
		ingest(incoming);
	}

	// the activation button opens the native picker.
	function openPicker() {
		inputEl?.click();
	}

	// ------------------------------------------------------------------
	// Drag-and-drop. No-ops entirely while disabled.
	// ------------------------------------------------------------------
	function onDragEnter(e: DragEvent) {
		if (disabled) return;
		e.preventDefault();
		dragCounter++;
	}

	function onDragOver(e: DragEvent) {
		if (disabled) return;
		e.preventDefault();
	}

	function onDragLeave(e: DragEvent) {
		if (disabled) return;
		e.preventDefault();
		dragCounter = Math.max(0, dragCounter - 1);
	}

	function onDrop(e: DragEvent) {
		if (disabled) return;
		e.preventDefault();
		dragCounter = 0;
		const list = e.dataTransfer?.files;
		const incoming = list ? Array.from(list) : [];
		ingest(incoming);
	}

	// ------------------------------------------------------------------
	// Removal. Splices `files`, re-syncs, announces, and
	// moves focus to a neighbor control so focus never drops to <body>.
	// ------------------------------------------------------------------
	async function removeFile(index: number) {
		const removed = files[index];
		files = files.filter((_, i) => i !== index);
		syncInput(files);
		onchange?.(files);
		statusMessage = `${removed.name} removed`;

		await tick();
		const buttons = listEl
			? Array.from(listEl.querySelectorAll<HTMLButtonElement>('.hz-file-remove'))
			: [];
		if (buttons.length > 0) {
			buttons[Math.min(index, buttons.length - 1)].focus();
		} else if (dropzone) {
			buttonEl?.focus();
		} else {
			inputEl?.focus();
		}
	}
</script>

<!--
	Field scaffold via the control snippet — control region
	(basic input or dropzone), then the removable file list, then the
	live-region status.
	a single real input[type=file] renders in both modes;
	{...rest} spreads first so component-managed attributes win.
-->
{#snippet control()}
	{#if dropzone}
		<!-- drop target + activation button; the native
		     input is visually hidden but remains the submission source of
		     truth. The real operable control is the button
		     below, not this div — drag handlers are a progressive enhancement
		     (WCAG 2.5.7), so no interactive role belongs here. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="hz-file-dropzone"
			data-dragover={dragCounter > 0 ? '' : undefined}
			ondragenter={onDragEnter}
			ondragover={onDragOver}
			ondragleave={onDragLeave}
			ondrop={onDrop}
		>
			<p class="hz-file-dropzone-text">{dropzoneText}</p>
			<button
				type="button"
				class="hz-file-button"
				bind:this={buttonEl}
				{disabled}
				onclick={openPicker}
			>
				{buttonText}
			</button>
			<input
				{...rest}
				bind:this={inputEl}
				id={inputId}
				type="file"
				{name}
				{accept}
				{multiple}
				{disabled}
				class="sr-only"
				tabindex="-1"
				aria-hidden="true"
				aria-required={required ? 'true' : undefined}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				onchange={handleInputChange}
			/>
		</div>
	{:else}
		<!-- basic mode — the visible native input is itself the
		     operable control. -->
		<div class="hz-file-control">
			<input
				{...rest}
				bind:this={inputEl}
				id={inputId}
				type="file"
				{name}
				{accept}
				{multiple}
				{disabled}
				aria-required={required ? 'true' : undefined}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				onchange={handleInputChange}
			/>
		</div>
	{/if}

	<!-- removable file list, rendered only when non-empty. -->
	{#if files.length > 0}
		<ul class="hz-file-list" id={listId} bind:this={listEl}>
			{#each files as file, i (fileKey(file))}
				<li class="hz-file-item">
					<span class="hz-file-name">{file.name}</span>
					<span class="hz-file-size">{formatSize(file.size)}</span>
					{#if !disabled}
						<button
							type="button"
							class="hz-file-remove"
							aria-label={`Remove ${file.name}`}
							onclick={() => removeFile(i)}
						>
							<IconX size={16} />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<!-- separate live status region — not the list made live. -->
	<div class="sr-only" role="status" aria-live="polite" id={statusId}>{statusMessage}</div>
{/snippet}

<!-- root class is cx('hz-field hz-file-upload', className). -->
<Field
	{label}
	{description}
	{error}
	{required}
	{disabled}
	{hideLabel}
	{inputId}
	{descId}
	{errorId}
	dataDropzone={dropzone}
	class={cx('hz-field hz-file-upload', className)}
	{control}
/>

<style>
	/* structural CSS only — no chrome. */

	.hz-file-control {
		display: block;
		width: 100%;
	}

	.hz-file-control input[type='file'] {
		display: block;
		width: 100%;
	}

	.hz-file-dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		width: 100%;
	}

	.hz-file-list {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
	}

	.hz-file-item {
		display: flex;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
	}

	.hz-file-name {
		flex: 1;
		min-width: 0;
	}
</style>
