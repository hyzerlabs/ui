<script lang="ts">
	import type { FieldBase, SliderTick } from '$lib/types';
	import { cx, uid } from '$lib/utils';

	interface Props extends FieldBase {
		min?: number;
		max?: number;
		step?: number;
		valueMin?: number;
		valueMax?: number;
		showInput?: boolean;
		ticks?: SliderTick[];
		unit?: string;
		minThumbLabel?: string;
		maxThumbLabel?: string;
		/** Default 'horizontal'; every horizontal behavior is unchanged. */
		orientation?: 'horizontal' | 'vertical';
		/** Logical, both axes; default 'end' (today's trailing layout). */
		inputPosition?: 'start' | 'end';
		/** The min-thumb range `<input>` element — `bind:elementMin` for focus/shortcuts. */
		elementMin?: HTMLInputElement;
		/** The max-thumb range `<input>` element — `bind:elementMax` for focus/shortcuts. */
		elementMax?: HTMLInputElement;
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
		valueMin = $bindable(min),
		valueMax = $bindable(max),
		showInput = true,
		ticks,
		unit,
		minThumbLabel = `${label} (minimum)`,
		maxThumbLabel = `${label} (maximum)`,
		orientation = 'horizontal',
		inputPosition = 'end',
		elementMin = $bindable(),
		elementMax = $bindable(),
		class: className,
		...rest
	}: Props = $props();

	// derive one stable uid base per instance.
	const _uid = uid('hz');
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;

	// aria-describedby chain (applied to both ranges).
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// error wins over disabled wins over default.
	const dataState = $derived(error ? 'error' : disabled ? 'disabled' : 'default');

	// widest formatted bound sizes the number fields via the theme.
	const decimals = $derived(step % 1 === 0 ? 0 : (String(step).split('.')[1]?.length ?? 0));
	const chars = $derived(Math.max(min.toFixed(decimals).length, max.toFixed(decimals).length));

	// live thumb positions as 0–1 fractions for the theme's fill.
	const fraction = (v: number) =>
		max === min ? 0 : Math.min(1, Math.max(0, (v - min) / (max - min)));
	const fillStart = $derived(fraction(valueMin));
	const fillEnd = $derived(fraction(valueMax));

	// normalize; entries outside [min, max] are skipped, not clamped.
	const tickList = $derived(
		(ticks ?? [])
			.map((t) => (typeof t === 'number' ? { value: t, label: undefined } : t))
			.filter((t) => t.value >= min && t.value <= max)
	);

	// on exact overlap, raise the thumb with an escape route — past
	// the midpoint only the min thumb can move (leftward), else the max thumb.
	const topThumb = $derived(valueMin === valueMax && valueMin > (min + max) / 2 ? 'min' : 'max');

	// ---------------------------------------------------------------------------
	// thumbs can meet but never cross — the moved thumb clamps at its
	// partner; the partner never moves. No bind: on the thumbs so the clamp and
	// the DOM value stay in lockstep even while a drag keeps pushing past.
	// ---------------------------------------------------------------------------
	function onThumbInput(which: 'min' | 'max') {
		return (e: Event) => {
			const el = e.currentTarget as HTMLInputElement;
			let v = Number(el.value);
			if (which === 'min') {
				v = Math.min(v, valueMax);
				valueMin = v;
			} else {
				v = Math.max(v, valueMin);
				valueMax = v;
			}
			el.value = String(v);
		};
	}

	// the same stepping semantics, with the partner as the effective bound.
	function commitNumber(which: 'min' | 'max') {
		return (e: Event) => {
			const el = e.currentTarget as HTMLInputElement;
			const current = which === 'min' ? valueMin : valueMax;
			const parsed = Number(el.value);
			if (el.value === '' || Number.isNaN(parsed)) {
				el.value = String(current);
				return;
			}
			const snapped = Math.round((parsed - min) / step) * step + min;
			const lo = which === 'min' ? min : valueMin;
			const hi = which === 'min' ? valueMax : max;
			// Strip float noise from the snap arithmetic (e.g. 0.1 steps).
			const next = Number(Math.min(hi, Math.max(lo, snapped)).toFixed(6));
			if (which === 'min') valueMin = next;
			else valueMax = next;
			el.value = String(next);
		};
	}
</script>

<!--
	fieldset/legend root (like RadioGroup — two controls cannot share
	one for/id label); two overlapped native ranges on one visual track, each
	with its own aria-label, then the exact-entry pair.
	{...rest} spread first on the fieldset so managed attrs win.
-->
<fieldset
	{...rest}
	class={cx('hz-field', 'hz-field--slider', 'hz-field--slider-range', className)}
	data-state={dataState}
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

	<div
		class="hz-slider-row"
		data-orientation={orientation}
		data-input-position={inputPosition}
		data-has-input={showInput ? '' : undefined}
		data-has-ticks={tickList.length > 0 ? '' : undefined}
		data-top={topThumb}
		style:--hz-slider-chars={chars}
		style:--hz-slider-fill-start={fillStart}
		style:--hz-slider-fill-end={fillEnd}
	>
		<div class="hz-slider-track">
			<input
				bind:this={elementMin}
				type="range"
				class="hz-slider hz-slider-min"
				name="{name}-min"
				aria-label={minThumbLabel}
				{min}
				{max}
				{step}
				{disabled}
				value={String(valueMin)}
				oninput={onThumbInput('min')}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
			/>
			<input
				bind:this={elementMax}
				type="range"
				class="hz-slider hz-slider-max"
				name="{name}-max"
				aria-label={maxThumbLabel}
				{min}
				{max}
				{step}
				{disabled}
				value={String(valueMax)}
				oninput={onThumbInput('max')}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
			/>

			<!-- decorative marks; the ranges announce the real values. -->
			{#if tickList.length > 0}
				<div class="hz-slider-ticks" aria-hidden="true">
					{#each tickList as tick (tick.value)}
						<span class="hz-slider-tick" style:--hz-tick-pos={fraction(tick.value)}>
							{#if tick.label}<span class="hz-slider-tick-label">{tick.label}</span>{/if}
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<!--
			the min/max exact-entry pair is wrapped in one cluster so it
			stays a single inline "min – max" group, placed above/below the track
			per inputPosition, rather than stacking to mirror the thumbs (RangeSlider
			vertical-only concern — Slider has no pair to cluster).
		-->
		<div class="hz-slider-inputs">
			{#if showInput}
				<input
					type="number"
					class="hz-slider-number hz-slider-number-min"
					{min}
					{max}
					{step}
					{disabled}
					value={String(valueMin)}
					aria-label="{minThumbLabel} (exact value)"
					onchange={commitNumber('min')}
				/>
				<span class="hz-slider-sep" aria-hidden="true">–</span>
				<input
					type="number"
					class="hz-slider-number hz-slider-number-max"
					{min}
					{max}
					{step}
					{disabled}
					value={String(valueMax)}
					aria-label="{maxThumbLabel} (exact value)"
					onchange={commitNumber('max')}
				/>
			{:else}
				<!-- values stay visible; aria-hidden — the ranges announce them. -->
				<span class="hz-slider-value" aria-hidden="true">{valueMin}–{valueMax}</span>
			{/if}
		</div>

		{#if unit}
			<span class="hz-slider-unit" aria-hidden="true">{unit}</span>
		{/if}
	</div>

	<!-- error when non-empty. -->
	{#if error}
		<p class="hz-field-error" id={errorId} role="alert">{error}</p>
	{/if}
</fieldset>

<style>
	/* Structural fieldset reset — the theme owns all visuals. */
	fieldset.hz-field--slider-range {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	/* one flex line — the track flexes; fields/sep/unit intrinsic. */
	.hz-slider-row {
		display: flex;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	.hz-slider-track {
		position: relative;
	}

	/* Headless, the two ranges render as two honest stacked rows — the theme
	 * absolutizes them onto one visual track. */
	.hz-slider {
		display: block;
	}

	/*
	 * the min/max exact-entry pair (or the readout) stays a single
	 * inline "min – max" cluster regardless of the row's own flex-direction —
	 * same gap token as the row so horizontal spacing is byte-identical to
	 * the previous unwrapped siblings.
	 */
	.hz-slider-inputs {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	/*
	 * horizontal keeps the current structural rules verbatim,
	 * just scoped behind the (always-stamped) attribute — width stays
	 * component-owned here so the track always fills the row's available
	 * space; in vertical the cross-axis size becomes a theme concern instead,
	 * so it is deliberately NOT set below (the theme's absolute inset: 0
	 * already fills both axes of the collapsed track regardless).
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
	 * native vertical mechanism, CSS-only over the value logic —
	 * writing-mode + direction: rtl on both stacked ranges (bottom-up growth),
	 * the row switches to a column, and the track gets a fixed block length
	 * with its inline size collapsed to the thumb thickness.
	 */
	.hz-slider-row[data-orientation='vertical'] {
		flex-direction: column;
	}

	.hz-slider-row[data-orientation='vertical'] .hz-slider-track {
		flex: 0 0 auto;
		block-size: var(--hz-slider-length, 12rem);
		inline-size: var(--hz-slider-thumb-size, 1.125rem);
	}

	.hz-slider-row[data-orientation='vertical'] .hz-slider-min,
	.hz-slider-row[data-orientation='vertical'] .hz-slider-max {
		writing-mode: vertical-lr;
		direction: rtl;
	}

	/*
	 * input position is logical on both axes — reordering the track
	 * via `order` works identically whether the row is a flex row or column,
	 * so one rule covers all four orientation × inputPosition combinations.
	 * The input cluster and the unit both stay at the default order, so they
	 * remain adjacent to each other on either side of the track.
	 */
	.hz-slider-row[data-input-position='start'] .hz-slider-track {
		order: 2;
	}
</style>
