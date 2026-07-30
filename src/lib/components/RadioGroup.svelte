<script lang="ts">
	import type { FieldBase, FormOption } from '$lib/types';
	import { cx, uid } from '$lib/utils';

	interface Props extends FieldBase {
		options: FormOption[];
		value?: string;
		orientation?: 'horizontal' | 'vertical';
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
		orientation = 'vertical',
		class: className,
		...rest
	}: Props = $props();

	// derive one stable uid base per instance.
	const _uid = uid('hz');
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;

	// per-radio IDs keyed by index.
	function radioId(i: number): string {
		return `hz-radio-${_uid}-${i}`;
	}

	// aria-describedby chain.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// error wins over disabled wins over default.
	const dataState = $derived(error ? 'error' : disabled ? 'disabled' : 'default');
</script>

<!--
	<fieldset> as root with hz-field hz-field--radio-group + data-orientation.
	one input+label pair per option keyed by index.
	bind:group on each radio ties them to the shared `value` bindable.
	<legend class="hz-field-label"> (no `for`, legend serves as group label).
	description, error, aria chain inline.
	{...rest} spread first on the fieldset so managed attrs win.
-->
<fieldset
	{...rest}
	class={cx('hz-field', 'hz-field--radio-group', className)}
	data-state={dataState}
	data-orientation={orientation}
>
	<!-- legend always in DOM; sr-only when hideLabel. -->
	<legend class={cx('hz-field-label', hideLabel && 'sr-only')}>
		{label}
		{#if required}<span aria-hidden="true" class="hz-field-required">*</span>{/if}
	</legend>

	<!-- description when non-empty. -->
	{#if description}
		<p class="hz-field-description" id={descId}>{description}</p>
	{/if}

	<!--
		inner role="radiogroup" container carries aria chain.
		aria-describedby + aria-invalid on the radiogroup.
	-->
	<div
		class="hz-radio-options"
		role="radiogroup"
		aria-describedby={describedBy}
		aria-invalid={error ? 'true' : undefined}
		aria-required={required ? 'true' : undefined}
	>
		{#each options as opt, i (i)}
			<div class="hz-radio-option">
				<!--
					native radio; bind:group ties to parent value.
					per-option disabled + group-level disabled.
					arrow-key navigation is native (shared name).
				-->
				<input
					type="radio"
					id={radioId(i)}
					{name}
					value={opt.value}
					disabled={disabled || opt.disabled}
					bind:group={value}
				/>
				<label for={radioId(i)}>{opt.label}</label>
			</div>
		{/each}
	</div>

	<!-- error when non-empty. -->
	{#if error}
		<p class="hz-field-error" id={errorId} role="alert">{error}</p>
	{/if}
</fieldset>

<style>
	/* Reset fieldset border/padding (structural, not visual). */
	.hz-field--radio-group {
		border: none;
		margin: 0;
		padding: 0;
		min-inline-size: 0;
		width: 100%;
	}

	/* options container is flex; direction driven by orientation. */
	.hz-radio-options {
		display: flex;
	}

	.hz-field--radio-group[data-orientation='vertical'] .hz-radio-options {
		flex-direction: column;
	}

	.hz-field--radio-group[data-orientation='horizontal'] .hz-radio-options {
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--hz-space-sm, 1rem);
	}

	/* each option pair as an inline row. */
	.hz-radio-option {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
	}
</style>
