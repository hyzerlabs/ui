<script lang="ts">
	import type { FieldBase } from '$lib/types';
	import { cx, uid } from '$lib/utils';

	interface Props extends FieldBase {
		checked?: boolean;
		indeterminate?: boolean;
		value?: string;
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
		checked = $bindable(false),
		indeterminate = false,
		value,
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

	// error wins over disabled wins over default.
	const dataState = $derived(error ? 'error' : disabled ? 'disabled' : 'default');

	// bind:this ref to set .indeterminate DOM property.
	let inputEl: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (inputEl) inputEl.indeterminate = indeterminate;
	});
</script>

<!--
	hz-field hz-field--checkbox root; input THEN label (label-after).
	bind:checked two-way.
	.indeterminate set via $effect on the element ref.
	description, error, aria chain inline.
	{...rest} spread first on the input so managed attrs win.
-->
<div class={cx('hz-field', 'hz-field--checkbox', className)} data-state={dataState}>
	<input
		{...rest}
		bind:this={inputEl}
		type="checkbox"
		id={inputId}
		{name}
		{value}
		{disabled}
		bind:checked
		aria-required={required ? 'true' : undefined}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
	/>

	<!-- label always in DOM; sr-only when hideLabel. -->
	<label class={cx('hz-field-label', hideLabel && 'sr-only')} for={inputId}>
		{label}
		{#if required}<span aria-hidden="true" class="hz-field-required">*</span>{/if}
	</label>

	<!-- description when non-empty. -->
	{#if description}
		<p class="hz-field-description" id={descId}>{description}</p>
	{/if}

	<!-- error when non-empty. -->
	{#if error}
		<p class="hz-field-error" id={errorId} role="alert">{error}</p>
	{/if}
</div>

<style>
	/* input then label as an inline flex row. */
	.hz-field--checkbox {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--hz-space-xs, 0.5rem);
	}

	/* Description and error break to a new row below the input+label pair. */
	.hz-field--checkbox .hz-field-description,
	.hz-field--checkbox .hz-field-error {
		flex-basis: 100%;
	}
</style>
