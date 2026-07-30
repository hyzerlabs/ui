<script lang="ts">
	import type { FieldBase } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';

	interface Props extends FieldBase {
		value?: string;
		rows?: number;
		resize?: 'none' | 'vertical' | 'both' | 'auto';
		maxlength?: number;
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
		value = $bindable(''),
		rows = 3,
		resize = 'vertical',
		maxlength,
		class: className,
		...rest
	}: Props = $props();

	// derive one stable uid base per instance.
	const _uid = uid('hz');
	const inputId = `hz-input-${_uid}`;
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;

	// aria-describedby chain.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// bind:this for the auto-resize JS fallback.
	let textareaEl: HTMLTextAreaElement | null = $state(null);

	// 'vertical' (default) and 'auto' both grow with content —
	// field-sizing: content is the primary mechanism ('vertical' keeps the
	// drag handle as a manual override). When the browser lacks support, a
	// JS height-sync fallback is used.
	$effect(() => {
		if (resize !== 'auto' && resize !== 'vertical') return;
		if (!textareaEl) return;

		// Feature-detect field-sizing support.
		if (CSS.supports('field-sizing', 'content')) return;

		// Sync height to content (initial value + on input).
		function syncHeight() {
			if (!textareaEl) return;
			textareaEl.style.height = 'auto';
			textareaEl.style.height = `${textareaEl.scrollHeight}px`;
		}

		// Initial sync.
		syncHeight();

		textareaEl.addEventListener('input', syncHeight);
		return () => textareaEl?.removeEventListener('input', syncHeight);
	});
</script>

<!--
	textarea inside Field scaffold.
	data-resize reflects the resize prop; CSS maps it to behavior.
	{...rest} spread first so managed attrs win.
-->
{#snippet control()}
	<textarea
		{...rest}
		bind:this={textareaEl}
		id={inputId}
		{name}
		{rows}
		{maxlength}
		data-resize={resize}
		style:--hz-textarea-rows={rows}
		{disabled}
		aria-required={required ? 'true' : undefined}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		bind:value></textarea>
{/snippet}

<!-- root class is cx('hz-field', className). -->
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
	class={cx('hz-field', className)}
	{control}
/>

<style>
	/* resize mapping via data-resize attribute. */
	textarea[data-resize='none'] {
		resize: none;
	}

	/* field-sizing makes the browser ignore `rows`, so the element exposes
	 * --hz-textarea-rows and the theme keeps rows as the minimum height. */
	textarea[data-resize='vertical'] {
		resize: vertical;
		field-sizing: content;
	}

	textarea[data-resize='both'] {
		resize: both;
	}

	textarea[data-resize='auto'] {
		resize: none;
		field-sizing: content;
	}

	/* Full width at all breakpoints. */
	textarea {
		display: block;
		width: 100%;
	}
</style>
