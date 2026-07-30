<script lang="ts">
	import type { FieldBase, SliderTick } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';

	interface Props extends FieldBase {
		min?: number;
		max?: number;
		step?: number;
		value?: number;
		showInput?: boolean;
		ticks?: SliderTick[];
		unit?: string;
		inputLabel?: string;
		/** Default 'horizontal'; every horizontal behavior is unchanged. */
		orientation?: 'horizontal' | 'vertical';
		/** Logical, both axes; default 'end' (today's trailing layout). */
		inputPosition?: 'start' | 'end';
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
		min = 0,
		max = 100,
		step = 1,
		value = $bindable(min),
		showInput = true,
		ticks,
		unit,
		inputLabel = `${label} (exact value)`,
		orientation = 'horizontal',
		inputPosition = 'end',
		class: className,
		...rest
	}: Props = $props();

	// Field-R1: derive one stable uid base per instance.
	const _uid = uid('hz');
	const inputId = `hz-input-${_uid}`;
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;

	// Field-R6: aria-describedby chains desc then error; omit when neither present.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// Slider-R1: widest value the field can hold (bounds formatted at the
	// step's precision) — exposed as --hz-slider-chars so the theme can size
	// the number field / readout to fit instead of guessing.
	const decimals = $derived(step % 1 === 0 ? 0 : (String(step).split('.')[1]?.length ?? 0));
	const chars = $derived(Math.max(min.toFixed(decimals).length, max.toFixed(decimals).length));

	// Fill-R1: live thumb position as a 0–1 fraction for the theme's fill.
	const fillFraction = $derived(
		max === min ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)))
	);

	// Ticks-R1: normalize; entries outside [min, max] are skipped, not clamped.
	const tickList = $derived(
		(ticks ?? [])
			.map((t) => (typeof t === 'number' ? { value: t, label: undefined } : t))
			.filter((t) => t.value >= min && t.value <= max)
	);
	const tickFraction = (v: number) => (max === min ? 0 : (v - min) / (max - min));

	// Slider-R3: number-field commits on change — parse, snap to the step grid
	// anchored at min, clamp to [min, max]; empty/NaN restores the display.
	function commitNumber(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const parsed = Number(el.value);
		if (el.value === '' || Number.isNaN(parsed)) {
			el.value = String(value);
			return;
		}
		const snapped = Math.round((parsed - min) / step) * step + min;
		// Strip float noise from the snap arithmetic (e.g. 0.1 steps).
		value = Number(Math.min(max, Math.max(min, snapped)).toFixed(6));
		el.value = String(value);
	}
</script>

<!--
	Slider-R1: hz-slider-row with the range as the labeled, named, primary
	control; the number input is an exact-entry affordance — no name, own
	aria-label. Slider-R2: bind:value (numeric) on the range; the number field
	displays it one-way and commits via change (Slider-R3).
	Forms-R2: {...rest} spread first on the range so managed attrs win.
-->
{#snippet control()}
	<div
		class="hz-slider-row"
		data-orientation={orientation}
		data-input-position={inputPosition}
		data-has-input={showInput ? '' : undefined}
		data-has-ticks={tickList.length > 0 ? '' : undefined}
		style:--hz-slider-chars={chars}
		style:--hz-slider-fill={fillFraction}
	>
		<div class="hz-slider-track">
			<input
				{...rest}
				type="range"
				class="hz-slider"
				id={inputId}
				{name}
				{min}
				{max}
				{step}
				{disabled}
				bind:value
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
			/>

			<!-- Ticks-R1: decorative marks; the range announces the real value. -->
			{#if tickList.length > 0}
				<div class="hz-slider-ticks" aria-hidden="true">
					{#each tickList as tick (tick.value)}
						<span class="hz-slider-tick" style:--hz-tick-pos={tickFraction(tick.value)}>
							{#if tick.label}<span class="hz-slider-tick-label">{tick.label}</span>{/if}
						</span>
					{/each}
				</div>
			{/if}
		</div>

		{#if showInput}
			<input
				type="number"
				class="hz-slider-number"
				{min}
				{max}
				{step}
				{disabled}
				value={String(value)}
				aria-label={inputLabel}
				onchange={commitNumber}
			/>
		{:else}
			<!-- Slider-R1: the value stays visible without the input; aria-hidden
			     because the range itself announces it. -->
			<span class="hz-slider-value" aria-hidden="true">{value}</span>
		{/if}

		{#if unit}
			<span class="hz-slider-unit" aria-hidden="true">{unit}</span>
		{/if}
	</div>
{/snippet}

<!-- Forms-R1: root class is cx('hz-field', 'hz-field--slider', className). -->
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
	class={cx('hz-field', 'hz-field--slider', className)}
	{control}
/>

<style>
	/* Slider-R8: one flex line — the track flexes, number/unit keep intrinsic
	 * width. The track wrapper is the positioning host for ticks (and the
	 * painted track in RangeSlider). */
	.hz-slider-row {
		display: flex;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	.hz-slider-track {
		position: relative;
	}

	.hz-slider {
		display: block;
	}

	/*
	 * Vert-R1/R2: horizontal keeps the current structural rules verbatim,
	 * just scoped behind the (always-stamped) attribute — width stays
	 * component-owned here so the track always fills the row's available
	 * space; in vertical the cross-axis size becomes a theme concern instead
	 * (the rotated analogue of --hz-slider-track-height), so it is
	 * deliberately NOT set below.
	 */
	.hz-slider-row[data-orientation='horizontal'] {
		flex-direction: row;
	}

	.hz-slider-row[data-orientation='horizontal'] .hz-slider-track {
		flex: 1;
		min-width: 0;
	}

	.hz-slider-row[data-orientation='horizontal'] .hz-slider {
		width: 100%;
	}

	/*
	 * Vert-R2: native vertical mechanism — writing-mode + direction: rtl on
	 * the range (bottom-up growth), the row switches to a column, and the
	 * track gets a fixed block length (the vertical analogue of horizontal's
	 * flex: 1) with its inline size collapsed to the thumb thickness.
	 */
	.hz-slider-row[data-orientation='vertical'] {
		flex-direction: column;
	}

	.hz-slider-row[data-orientation='vertical'] .hz-slider-track {
		flex: 0 0 auto;
		block-size: var(--hz-slider-length, 12rem);
		inline-size: var(--hz-slider-thumb-size, 1.125rem);
	}

	.hz-slider-row[data-orientation='vertical'] .hz-slider {
		writing-mode: vertical-lr;
		direction: rtl;
		height: 100%;
	}

	/*
	 * Vert-R3: input position is logical on both axes — reordering the track
	 * via `order` works identically whether the row is a flex row or column,
	 * so one rule covers all four orientation × inputPosition combinations.
	 */
	.hz-slider-row[data-input-position='start'] .hz-slider-track {
		order: 2;
	}
</style>
