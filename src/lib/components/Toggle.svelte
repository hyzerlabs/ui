<script lang="ts">
	import type { FieldBase } from '$lib/types';
	import { cx, uid } from '$lib/utils';

	interface Props extends FieldBase {
		checked?: boolean;
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
		value,
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

	// Field-R1: error wins over disabled wins over default.
	const dataState = $derived(error ? 'error' : disabled ? 'disabled' : 'default');
</script>

<!--
	Toggle-R1: hz-field hz-field--toggle root; a NATIVE CHECKBOX exposed as a
	switch (role="switch"), then label (label-after, like Checkbox). Being a
	real form control it submits name/value and resolves via form.elements.
	The native checked state carries on/off semantics — no manual aria-checked.
	Toggle-R2: bind:checked two-way; data-state="on"|"off" mirrors checked as
	the stable styling hook (track/thumb visuals are the theme's job).
	Toggle-R3: aria-describedby, aria-invalid, native disabled.
	Forms-R2: {...rest} spread first on the input so managed attrs win.
-->
<div class={cx('hz-field', 'hz-field--toggle', className)} data-state={dataState}>
	<input
		{...rest}
		type="checkbox"
		role="switch"
		class="hz-toggle"
		id={inputId}
		{name}
		{value}
		{disabled}
		bind:checked
		data-state={checked ? 'on' : 'off'}
		aria-describedby={describedBy}
		aria-invalid={error ? 'true' : undefined}
		aria-required={required ? 'true' : undefined}
	/>

	<!-- Field-R2: label always in DOM; sr-only when hideLabel. -->
	<label class={cx('hz-field-label', hideLabel && 'sr-only')} for={inputId}>
		{label}
		{#if required}<span aria-hidden="true" class="hz-field-required">*</span>{/if}
	</label>

	<!-- Field-R4: description when non-empty. -->
	{#if description}
		<p class="hz-field-description" id={descId}>{description}</p>
	{/if}

	<!-- Field-R5: error when non-empty. -->
	{#if error}
		<p class="hz-field-error" id={errorId} role="alert">{error}</p>
	{/if}
</div>

<style>
	/* Toggle-R1: input then label as an inline flex row. */
	.hz-field--toggle {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--hz-space-xs, 0.5rem);
	}

	/* Description and error break to a new row. */
	.hz-field--toggle .hz-field-description,
	.hz-field--toggle .hz-field-error {
		flex-basis: 100%;
	}

	/* Headless: the native checkbox stays visible and functional; the theme
	 * replaces it with the track/thumb visual (appearance: none + ::before). */
	.hz-toggle {
		cursor: pointer;
	}

	.hz-toggle:disabled {
		cursor: not-allowed;
	}
</style>
