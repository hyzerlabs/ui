<script lang="ts">
	import type { FieldBase, SelectOption } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';

	interface Props extends FieldBase {
		options: SelectOption[];
		value?: string;
		placeholder?: string;
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
		options,
		value = $bindable(''),
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
	Select-R1: native <select> inside Field scaffold; bind:value two-way.
	Select-R2: leading placeholder <option value="" disabled selected>.
	Select-R3: flat options and optgroups rendered in array order.
	Forms-R2: {...rest} spread first so managed attrs win.
-->
{#snippet control()}
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
	</select>
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
	/* Full width at all breakpoints. */
	select {
		display: block;
		width: 100%;
	}
</style>
