<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';
	import type { Intent, Variant } from '$lib/types';
	import IconLoader from '$lib/icons/generated/loader.svelte';
	import { cx } from '$lib/utils';

	/**
	 * The full intent vocabulary, not a narrower hand-picked list: Button
	 * stamps data-intent and the theme decides what it means, so anything the
	 * IntentRegistry knows about is fair game — including intents a consumer
	 * added themselves.
	 */
	type ButtonIntent = Intent;
	/**
	 * `'full'` renders full width at the `md` height/padding (amended
	 * 2026-07-27) — the `fullWidth` prop is retired in its favor. Trade-off
	 * accepted: full-width is no longer combinable with `sm`/`lg`.
	 */
	type ButtonSize = 'sm' | 'md' | 'lg' | 'full';
	type ButtonType = 'button' | 'submit' | 'reset';

	interface Props {
		variant?: Variant;
		intent?: ButtonIntent;
		size?: ButtonSize;
		disabled?: boolean;
		loading?: boolean;
		loadingLabel?: string;
		href?: string;
		type?: ButtonType;
		ariaLabel?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
		iconStart?: Snippet;
		iconEnd?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		variant = 'solid',
		intent = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		loadingLabel = 'Loading',
		href,
		type = 'button',
		ariaLabel,
		onclick,
		children,
		iconStart,
		iconEnd,
		class: className,
		...rest
	}: Props = $props();

	// Anchor only when href is a non-empty string
	const isAnchor = $derived(typeof href === 'string' && href.length > 0);

	// Icon-only is DERIVED from the established usage pattern (an icon
	// snippet with no children) — no prop; the theme renders the circle form.
	const iconOnly = $derived(!children && !!(iconStart || iconEnd));

	// Disabled takes precedence over loading for data-state
	const dataState = $derived(disabled ? 'disabled' : loading ? 'loading' : undefined);

	// Dev-only warning for icon-only usage without an accessible name.
	// untrack() opts out of reactive tracking — we intentionally read only the
	// initial prop values to warn once at component creation time.
	if (DEV) {
		if (untrack(() => !children && (iconStart || iconEnd) && !ariaLabel)) {
			console.warn(
				'[hyzer-ui] <Button>: icon-only usage detected without an `ariaLabel` prop. ' +
					'Add ariaLabel to satisfy WCAG 4.1.2 Name, Role, Value.'
			);
		}
	}

	// Swallow onclick and prevent navigation when inactive
	function handleClick(e: MouseEvent): void {
		if (disabled || loading) {
			e.preventDefault();
			return;
		}
		onclick?.(e);
	}
</script>

{#if isAnchor}
	<a
		{...rest}
		class={cx('hz-button', className)}
		href={disabled || loading ? undefined : href}
		data-variant={variant}
		data-intent={intent}
		data-size={size}
		data-icon-only={iconOnly ? '' : undefined}
		data-state={dataState}
		aria-disabled={disabled ? 'true' : undefined}
		aria-busy={loading ? 'true' : undefined}
		aria-label={ariaLabel}
		onclick={handleClick}
	>
		{#if iconStart}{@render iconStart()}{/if}
		{#if loading}
			<IconLoader />
			<span class="sr-only">{loadingLabel}</span>
		{/if}
		{#if children}{@render children()}{/if}
		{#if iconEnd}{@render iconEnd()}{/if}
	</a>
{:else}
	<button
		{...rest}
		class={cx('hz-button', className)}
		{type}
		data-variant={variant}
		data-intent={intent}
		data-size={size}
		data-icon-only={iconOnly ? '' : undefined}
		data-state={dataState}
		aria-disabled={disabled ? 'true' : undefined}
		aria-busy={loading ? 'true' : undefined}
		aria-label={ariaLabel}
		onclick={handleClick}
	>
		{#if iconStart}{@render iconStart()}{/if}
		{#if loading}
			<IconLoader />
			<span class="sr-only">{loadingLabel}</span>
		{/if}
		{#if children}{@render children()}{/if}
		{#if iconEnd}{@render iconEnd()}{/if}
	</button>
{/if}
