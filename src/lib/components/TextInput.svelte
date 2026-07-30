<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { FieldBase } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';

	interface Props extends FieldBase {
		type?:
			| 'text'
			| 'email'
			| 'password'
			| 'tel'
			| 'url'
			| 'search'
			| 'number'
			| 'date'
			| 'time'
			| 'datetime-local';
		value?: string;
		placeholder?: string;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		maxlength?: number;
		pattern?: string;
		inputmode?: HTMLInputAttributes['inputmode'];
		prefix?: Snippet;
		suffix?: Snippet;
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
		type = 'text',
		value = $bindable(''),
		placeholder,
		autocomplete,
		maxlength,
		pattern,
		inputmode,
		prefix,
		suffix,
		class: className,
		...rest
	}: Props = $props();

	// derive one stable uid base per instance.
	const _uid = uid('hz');
	const inputId = `hz-input-${_uid}`;
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;

	// aria-describedby chains desc then error; omit when neither present.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);
</script>

<!--
	hz-input-wrapper with optional prefix/suffix spans.
	data-has-prefix / data-has-suffix present when snippet provided.
	{...rest} spread first so managed attrs win.
-->
{#snippet control()}
	<div
		class="hz-input-wrapper"
		data-has-prefix={prefix ? '' : undefined}
		data-has-suffix={suffix ? '' : undefined}
	>
		{#if prefix}
			<span class="hz-input-prefix" aria-hidden="true">{@render prefix()}</span>
		{/if}

		<input
			{...rest}
			id={inputId}
			{name}
			{type}
			bind:value
			{placeholder}
			{autocomplete}
			{maxlength}
			{pattern}
			{inputmode}
			{disabled}
			aria-required={required ? 'true' : undefined}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		/>

		{#if suffix}
			<span class="hz-input-suffix" aria-hidden="true">{@render suffix()}</span>
		{/if}
	</div>
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
	/* wrapper is a flex row so prefix, input, suffix align. */
	.hz-input-wrapper {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	/* Input fills the remaining width inside the wrapper. */
	.hz-input-wrapper input {
		flex: 1;
		min-width: 0;
	}
</style>
