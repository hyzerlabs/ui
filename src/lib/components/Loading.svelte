<script lang="ts">
	import { untrack } from 'svelte';
	import type { Intent } from '$lib/types';
	import { cx } from '$lib/utils';
	import IconLoader from '$lib/icons/generated/loader.svelte';

	// ---------------------------------------------------------------------------
	// Loading (specs/49) — an accessible loading indicator. Fundamentally
	// indeterminate: three variants (spinner/dots/bar) that say "something is
	// happening" without knowing how far along it is. Passing a `value`
	// progressively enhances the `bar` variant into a determinate native
	// <progress value max> — native value semantics for free — AND the
	// `spinner` variant into a determinate circular ring (a static SVG arc,
	// R3). `dots` stays indeterminate-only (Decision 6). Headless: the
	// reference theme (loading.css) paints every hook this component stamps,
	// including the paired --hz-loading-speed / --hz-loading-ease timing hooks
	// and the ring's --hz-loading-ring-width.
	// ---------------------------------------------------------------------------

	type LoadingSize = 'sm' | 'md' | 'lg';
	type LoadingVariant = 'bar' | 'spinner' | 'dots';

	interface Props {
		/** Omitted/undefined/NaN ⇒ indeterminate. */
		value?: number;
		max?: number;
		/** Decision 2: defaults to 'primary', not 'neutral' — a fill is an accent by nature. */
		intent?: Intent;
		size?: LoadingSize;
		variant?: LoadingVariant;
		/** Accessible name. Alternative: aria-label / aria-labelledby via rest. */
		label?: string;
		showValue?: boolean;
		format?: (value: number, max: number) => string;
		class?: string;
		[key: string]: unknown;
	}

	/**
	 * R7: the default percentage formatter. Declared as a named function (not
	 * inline in the destructuring default) so R3's aria-valuetext omission can
	 * compare `format` against this exact reference — telling "the consumer
	 * left format at its default" apart from "a custom format happens to also
	 * read as a percentage".
	 */
	function defaultFormat(value: number, max: number): string {
		return `${Math.round((value / max) * 100)}%`;
	}

	let {
		value,
		max = 100,
		intent = 'primary',
		size = 'md',
		variant = 'bar',
		label,
		showValue = false,
		format = defaultFormat,
		class: className,
		...rest
	}: Props = $props();

	// R6: the alternative accessible-name channel — rest is spread onto the
	// root, but the name has to land on the actual progressbar-role element
	// (the <progress>, the spinner span, or the dots span), so both are read
	// out of rest here and re-applied there.
	const restAriaLabel = $derived(rest['aria-label'] as string | undefined);
	const restAriaLabelledby = $derived(rest['aria-labelledby'] as string | undefined);
	const ariaLabel = $derived(label ?? restAriaLabel);

	// R3/R4/Edge: a non-finite value (undefined or NaN) is indeterminate.
	const hasValue = $derived(typeof value === 'number' && Number.isFinite(value));
	// R2/R3/R5: indeterminate for a missing/NaN value on the bar or spinner
	// (bar → the bare bar, spinner → the spinning glyph), and ALWAYS for dots —
	// it is indeterminate by construction regardless of value (Decision 6). A
	// value on the spinner is now valid (R3): it renders the determinate ring.
	const indeterminate = $derived(variant === 'dots' || !hasValue);
	// R3: negatives clamp to 0, over-max clamps to max.
	const clamped = $derived(hasValue ? Math.min(Math.max(value as number, 0), max) : undefined);

	// R3: aria-valuetext carries human units only for a non-default format or a
	// non-100 max — the default percentage at max=100 lets AT read the native
	// computed percentage instead. Applies to both determinate forms (bar, ring).
	const isCustomFormat = $derived(format !== defaultFormat);
	const valueText = $derived(
		!indeterminate && (isCustomFormat || max !== 100) ? format(clamped as number, max) : undefined
	);

	// R1/R7: the readout renders only for the determinate forms (bar, ring).
	const showReadout = $derived(showValue && !indeterminate);

	// R3: the ring fill's live fraction, written inline (the Slider-fill
	// precedent) — 0 → 100 (empty), max → 0 (full circle), clamped so an
	// over-max value never renders an over-full ring.
	const ringDashoffset = $derived(hasValue ? 100 - ((clamped as number) / max) * 100 : undefined);

	// R6/R5/Edge: dev-only warnings, evaluated once at creation (the Button
	// icon-only precedent) — untrack() opts out of reactive tracking so only
	// the initial prop values are read.
	if (import.meta.env.DEV) {
		untrack(() => {
			if (!ariaLabel && !restAriaLabelledby) {
				console.warn(
					'[hyzer-ui] <Loading>: no accessible name was provided. ' +
						'Pass `label`, `aria-label`, or `aria-labelledby` to satisfy WCAG 4.1.2 Name, Role, Value.'
				);
			}
			if (typeof value === 'number' && Number.isNaN(value)) {
				console.warn('[hyzer-ui] <Loading>: `value` is NaN. Treated as indeterminate.');
			}
			// R5/Decision 6: dots is indeterminate-only — a value on it is
			// ignored. A value on the spinner is now valid (R3, the ring) and
			// does NOT warn.
			if (variant === 'dots' && hasValue) {
				console.warn(
					'[hyzer-ui] <Loading>: variant="dots" is indeterminate-only — `value` is ignored.'
				);
			}
			// R7: showValue only renders a readout in a determinate presentation
			// (the bar or the ring with a value) — warn for any indeterminate
			// presentation (bare bar, spinner glyph, dots).
			if (showValue && (variant === 'dots' || !hasValue)) {
				console.warn(
					'[hyzer-ui] <Loading>: `showValue` has no effect without a `value` (or on variant="dots") — there is no progress to show.'
				);
			}
		});
	}
</script>

<!--
	R1/R2: root is always a div carrying data-intent/data-size/data-variant,
	plus data-indeterminate exactly when there is no value (always for
	spinner/dots). rest spreads first so managed attrs win.
-->
<div
	{...rest}
	class={cx('hz-loading', className)}
	data-intent={intent}
	data-size={size}
	data-variant={variant}
	data-indeterminate={indeterminate ? '' : undefined}
>
	{#if variant === 'bar'}
		<!-- R3/R4: native <progress> carries role/aria-value* for free. Two
		     branches (rather than a single value={hasValue ? clamped : undefined})
		     keep the indeterminate branch from ever emitting a `value` attribute. -->
		{#if hasValue}
			<progress
				class="hz-loading-bar"
				value={clamped}
				{max}
				aria-label={ariaLabel}
				aria-labelledby={restAriaLabelledby}
				aria-valuetext={valueText}
			></progress>
		{:else}
			<progress
				class="hz-loading-bar"
				{max}
				aria-label={ariaLabel}
				aria-labelledby={restAriaLabelledby}
			></progress>
		{/if}
		{#if showReadout}
			<output class="hz-loading-value">{format(clamped as number, max)}</output>
		{/if}
	{:else if variant === 'spinner'}
		{#if hasValue}
			<!-- R3: the determinate ring — a static SVG arc, ARIA on the wrapper
			     (the SVG itself is decorative). No aria-busy: progress is known. -->
			<span
				class="hz-loading-spinner"
				role="progressbar"
				aria-valuemin="0"
				aria-valuemax={max}
				aria-valuenow={clamped}
				aria-valuetext={valueText}
				aria-label={ariaLabel}
				aria-labelledby={restAriaLabelledby}
			>
				<svg class="hz-loading-ring" viewBox="0 0 32 32" role="img" aria-hidden="true">
					<circle class="hz-loading-ring-track" cx="16" cy="16" r="14" pathLength="100" />
					<circle
						class="hz-loading-ring-fill"
						cx="16"
						cy="16"
						r="14"
						pathLength="100"
						style="stroke-dashoffset: {ringDashoffset}"
					/>
				</svg>
				{#if showReadout}
					<span class="hz-loading-value">{format(clamped as number, max)}</span>
				{/if}
			</span>
		{:else}
			<!-- R5: no value — the indeterminate spinning glyph. -->
			<span
				class="hz-loading-spinner"
				role="progressbar"
				aria-busy="true"
				aria-label={ariaLabel}
				aria-labelledby={restAriaLabelledby}
			>
				<IconLoader />
			</span>
		{/if}
	{:else}
		<!-- R5: the ellipsis loader — three decorative dots, no <progress>. -->
		<span
			class="hz-loading-dots"
			role="progressbar"
			aria-busy="true"
			aria-label={ariaLabel}
			aria-labelledby={restAriaLabelledby}
		>
			<span class="hz-loading-dot" aria-hidden="true"></span>
			<span class="hz-loading-dot" aria-hidden="true"></span>
			<span class="hz-loading-dot" aria-hidden="true"></span>
		</span>
	{/if}
</div>

<style>
	/* R8: structure only — the wrapper aligns the bar and the readout in a
	 * row; min-width: 0 lets the bar flex below its intrinsic content size.
	 * width: 100% is scoped to the bar variant only (below) — per the
	 * Responsive Behavior section, the spinner/ring and dots are
	 * intrinsically sized, not stretched to fill their container. */
	.hz-loading {
		display: flex;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	.hz-loading:where([data-variant='bar']) {
		width: 100%;
	}

	.hz-loading-bar {
		flex: 1;
		min-width: 0;
	}

	/* R8: the spinner/ring wrapper is a relatively-positioned inline-flex box
	 * so the ring's centered .hz-loading-value readout (theme-painted) can
	 * absolutely position against it. */
	.hz-loading-spinner {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.hz-loading-dots {
		display: inline-flex;
		align-items: center;
	}
</style>
