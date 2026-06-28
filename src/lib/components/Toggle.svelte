<script lang="ts">
	import type { FieldBase } from '$lib/types';
	import { cx, uid } from '$lib/utils';

	interface Props extends FieldBase {
		checked?: boolean;
		class?: string;
		[key: string]: unknown;
	}

	let {
		// `name` is accepted as part of FieldBase but not applied to the button;
		// it passes through rest if provided, going onto the button element (Forms-R2).
		label,
		description,
		error,
		required = false,
		disabled = false,
		hideLabel = false,
		checked = $bindable(false),
		class: className,
		...rest
	}: Props = $props();

	// Field-R1: derive one stable uid base per instance.
	const _uid = uid('hz');
	const labelId = `hz-label-${_uid}`;
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;

	// Field-R6: aria-describedby chain.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// Field-R1: error wins over disabled wins over default.
	const dataState = $derived(error ? 'error' : disabled ? 'disabled' : 'default');

	// Toggle-R2: clicking (and native Enter/Space on button) toggles checked.
	function handleClick() {
		if (!disabled) {
			checked = !checked;
		}
	}
</script>

<!--
	Toggle-R1: hz-field hz-field--toggle root; button role="switch" then label.
	Toggle-R2: aria-checked + data-state reflect checked.
	Toggle-R3: aria-describedby, aria-invalid, native disabled.
	Field-R2: label carries id="hz-label-{uid}" for aria-labelledby on the button.
	Forms-R2: {...rest} spread first on the button so managed attrs win.
-->
<div class={cx('hz-field', 'hz-field--toggle', className)} data-state={dataState}>
	<button
		{...rest}
		type="button"
		role="switch"
		class="hz-toggle"
		aria-labelledby={labelId}
		aria-checked={checked ? 'true' : 'false'}
		data-state={checked ? 'on' : 'off'}
		aria-describedby={describedBy}
		aria-invalid={error ? 'true' : undefined}
		aria-required={required ? 'true' : undefined}
		{disabled}
		onclick={handleClick}
	>
		<span class="hz-toggle-thumb"></span>
	</button>

	<!--
		Field-R2: label always in DOM; id="hz-label-{uid}" for aria-labelledby.
		sr-only class applied when hideLabel.
		svelte-ignore: label intentionally uses aria-labelledby on the button, not for=.
	-->
	<!-- svelte-ignore a11y_label_has_associated_control -->
	<label id={labelId} class={cx('hz-field-label', hideLabel && 'sr-only')}>
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
	/* Toggle-R1: button then label as an inline flex row. */
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

	/* Toggle-R1: button structural reset — no visual opinions. */
	.hz-toggle {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
	}

	.hz-toggle:disabled {
		cursor: not-allowed;
	}

	/* Toggle-R1: thumb is a structural child block. */
	.hz-toggle-thumb {
		display: block;
	}
</style>
