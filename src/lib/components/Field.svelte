<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	interface Props {
		label: string;
		description?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		hideLabel?: boolean;
		inputId: string;
		descId: string;
		errorId: string;
		/** Full wrapper class, pre-computed by the parent (e.g. cx('hz-field', className)). */
		class: string;
		/**
		 * Optional `data-open` hook on the root, boolean-presence style.
		 * Combobox-R1: the popup open/closed state needs to surface on the
		 * Field-rendered root div, which no other field family member needs.
		 */
		dataOpen?: boolean;
		/** The actual control (input/textarea/select wrapper). */
		control: Snippet;
	}

	let {
		label,
		description,
		error,
		required = false,
		disabled = false,
		hideLabel = false,
		inputId,
		descId,
		errorId,
		class: wrapperClass,
		dataOpen,
		control
	}: Props = $props();

	// Field-R1: error wins over disabled wins over default.
	const dataState = $derived(error ? 'error' : disabled ? 'disabled' : 'default');
</script>

<!--
	Field-R1: root div carries hz-field + optional variant/consumer classes + data-state.
	Field-R2: label always in DOM; sr-only when hideLabel.
	Field-R3: required * indicator.
	Field-R4: description only when non-empty.
	Field-R5: error only when non-empty; role="alert".
-->
<div class={wrapperClass} data-state={dataState} data-open={dataOpen ? '' : undefined}>
	<label class={cx('hz-field-label', hideLabel && 'sr-only')} for={inputId}>
		{label}
		{#if required}<span aria-hidden="true" class="hz-field-required">*</span>{/if}
	</label>

	{@render control()}

	{#if description}
		<p class="hz-field-description" id={descId}>{description}</p>
	{/if}

	{#if error}
		<p class="hz-field-error" id={errorId} role="alert">{error}</p>
	{/if}
</div>

<style>
	/* Field-R1: full-width block at all breakpoints. */
	:global(.hz-field) {
		display: block;
		width: 100%;
	}

	:global(.hz-field-label) {
		display: block;
	}

	:global(.hz-field-description),
	:global(.hz-field-error) {
		display: block;
	}
</style>
