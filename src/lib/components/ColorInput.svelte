<script lang="ts">
	import type { FieldBase } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';

	interface Props extends FieldBase {
		value?: string;
		showInput?: boolean;
		inputLabel?: string;
		/** The underlying color `<input>` element — `bind:element` for focus/shortcuts. */
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
		value = $bindable('#000000'),
		showInput = true,
		inputLabel = `${label} (hex value)`,
		element = $bindable(),
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

	// hex field commits on change — accept #rgb/#rrggbb (optional #,
	// any case), normalize to lowercase #rrggbb; anything else restores.
	function commitHex(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(el.value.trim());
		if (!match) {
			el.value = value;
			return;
		}
		let hex = match[1].toLowerCase();
		if (hex.length === 3) {
			hex = hex
				.split('')
				.map((c) => c + c)
				.join('');
		}
		value = `#${hex}`;
		el.value = value;
	}
</script>

<!--
	swatch (the native color input) plus the exact-entry hex field —
	the Slider precedent: the field has no name, its own aria-label, and
	commits validated values on change. No aria-required — a color
	input always holds a value.
	{...rest} spread first so managed attrs win.
-->
{#snippet control()}
	<div class="hz-color-row">
		<input
			{...rest}
			bind:this={element}
			type="color"
			class="hz-color"
			id={inputId}
			{name}
			{disabled}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		/>

		{#if showInput}
			<input
				type="text"
				class="hz-color-hex"
				{disabled}
				{value}
				maxlength={7}
				spellcheck="false"
				aria-label={inputLabel}
				onchange={commitHex}
			/>
		{:else}
			<!-- the value stays visible without the field; aria-hidden
			     because the color input's own value is what assistive tech reads. -->
			<span class="hz-color-value" aria-hidden="true">{value}</span>
		{/if}
	</div>
{/snippet}

<!-- root class is cx('hz-field', 'hz-field--color', className). -->
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
	class={cx('hz-field', 'hz-field--color', className)}
	{control}
/>

<style>
	/* one flex line — swatch and hex field side by side. */
	.hz-color-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	.hz-color {
		cursor: pointer;
	}

	.hz-color:disabled {
		cursor: not-allowed;
	}
</style>
