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

	// Field-R1: derive one stable uid base per instance.
	const _uid = uid('hz');
	const inputId = `hz-input-${_uid}`;
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;

	// Field-R6: aria-describedby chain.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// Textarea-R3: bind:this for the auto-resize JS fallback.
	let textareaEl: HTMLTextAreaElement | null = $state(null);

	// Textarea-R3: field-sizing: content is the primary auto-grow mechanism.
	// When the browser lacks support, a JS height-sync fallback is used.
	$effect(() => {
		if (resize !== 'auto') return;
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
	Textarea-R1: textarea inside Field scaffold.
	Textarea-R3: data-resize reflects the resize prop; CSS maps it to behavior.
	Forms-R2: {...rest} spread first so managed attrs win.
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
		{disabled}
		aria-required={required ? 'true' : undefined}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		bind:value></textarea>
{/snippet}

<!-- Forms-R1: root class is cx('hz-field', className). -->
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
	/* Textarea-R3: resize mapping via data-resize attribute. */
	textarea[data-resize='none'] {
		resize: none;
	}

	textarea[data-resize='vertical'] {
		resize: vertical;
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
