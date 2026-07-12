<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Variant } from '$lib/types';
	import { IconLoader } from '$lib/icons';
	import { cx } from '$lib/utils';

	type ButtonIntent = 'primary' | 'secondary' | 'danger';
	type ButtonSize = 'sm' | 'md' | 'lg';
	type ButtonType = 'button' | 'submit' | 'reset';

	interface Props {
		variant?: Variant;
		intent?: ButtonIntent;
		size?: ButtonSize;
		disabled?: boolean;
		loading?: boolean;
		loadingLabel?: string;
		fullWidth?: boolean;
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
		fullWidth = false,
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

	// R8: anchor only when href is a non-empty string
	const isAnchor = $derived(typeof href === 'string' && href.length > 0);

	// R11: disabled takes precedence over loading for data-state
	const dataState = $derived(disabled ? 'disabled' : loading ? 'loading' : undefined);

	// R14: dev-only warning for icon-only usage without an accessible name.
	// untrack() opts out of reactive tracking — we intentionally read only the
	// initial prop values to warn once at component creation time.
	if (import.meta.env.DEV) {
		if (untrack(() => !children && (iconStart || iconEnd) && !ariaLabel)) {
			console.warn(
				'[hyzer-ui] <Button>: icon-only usage detected without an `ariaLabel` prop. ' +
					'Add ariaLabel to satisfy WCAG 4.1.2 Name, Role, Value.'
			);
		}
	}

	// R9/R10/R15: swallow onclick and prevent navigation when inactive
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
		role="button"
		href={disabled || loading ? undefined : href}
		data-variant={variant}
		data-intent={intent}
		data-size={size}
		data-state={dataState}
		data-full-width={fullWidth ? '' : undefined}
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
		data-state={dataState}
		data-full-width={fullWidth ? '' : undefined}
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
