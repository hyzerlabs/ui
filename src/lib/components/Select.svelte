<script lang="ts">
	import type { FieldBase, SelectOption } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';

	interface SelectPropsBase extends FieldBase {
		options: SelectOption[];
		placeholder?: string;
		class?: string;
		[key: string]: unknown;
	}

	/**
	 * Select-R1: discriminated union on `multiple` — the compiler enforces the
	 * multiple ↔ value correspondence at call sites (`<Select multiple
	 * value={['a']} />` type-checks; a `string` there errors).
	 */
	interface SelectSingleProps extends SelectPropsBase {
		multiple?: false;
		value?: string;
	}

	interface SelectMultipleProps extends SelectPropsBase {
		multiple: true;
		value?: string[];
	}

	type Props = SelectSingleProps | SelectMultipleProps;

	let {
		name,
		label,
		description,
		error,
		required = false,
		disabled = false,
		hideLabel = false,
		options,
		// `multiple` is destructured before `value` so the default below can
		// reference it (Select-R1).
		multiple = false,
		value = $bindable(multiple ? [] : ''),
		placeholder = 'Select...',
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
</script>

<!--
	Select-R4: flat options and optgroups rendered in array order, shared by
	both the single and multiple render branches below.
-->
{#snippet optionsList()}
	{#each options as opt, i (i)}
		{#if 'group' in opt}
			<optgroup label={opt.group}>
				{#each opt.options as o, j (j)}
					<option value={o.value} disabled={o.disabled}>{o.label}</option>
				{/each}
			</optgroup>
		{:else}
			<option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
		{/if}
	{/each}
{/snippet}

<!--
	Select-R1: two <select> render branches — one with the literal `multiple`
	attribute (Svelte binds a string[]), one without (Svelte binds a string).
	A single element with a dynamic multiple={…} would break the array
	binding, because Svelte infers select array-binding from the literal
	attribute. Everything else (id/name/disabled/aria/rest/options) is shared.
	Forms-R2: {...rest} spread first so managed attrs win.
-->
{#snippet control()}
	{#if multiple}
		<!-- Select-R2/R3: multiple mode — no placeholder option; size flows via ...rest. -->
		<select
			{...rest}
			id={inputId}
			{name}
			multiple
			bind:value
			{disabled}
			aria-required={required ? 'true' : undefined}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		>
			{@render optionsList()}
		</select>
	{:else}
		<!-- Select-R3: leading placeholder <option value="" disabled selected>. -->
		<select
			{...rest}
			id={inputId}
			{name}
			bind:value
			{disabled}
			aria-required={required ? 'true' : undefined}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		>
			<option value="" disabled selected>{placeholder}</option>
			{@render optionsList()}
		</select>
	{/if}
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
	/* Full width at all breakpoints, single or multiple. */
	select {
		display: block;
		width: 100%;
	}
</style>
