<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	type LinkVariant = 'default' | 'subtle' | 'nav';
	type LinkSize = 'sm' | 'md' | 'lg';

	interface Props {
		href: string;
		external?: boolean;
		variant?: LinkVariant;
		size?: LinkSize;
		ariaCurrent?: 'page' | 'step' | 'true';
		ariaLabel?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
		iconStart?: Snippet;
		iconEnd?: Snippet;
		[key: string]: unknown;
	}

	let {
		href,
		external = false,
		variant = 'default',
		size = 'md',
		ariaCurrent,
		ariaLabel,
		class: className,
		onclick,
		children,
		iconStart,
		iconEnd,
		...rest
	}: Props = $props();

	// R12: dev-only warning for icon-only usage without an accessible name.
	// untrack() opts out of reactive tracking — we intentionally read only the
	// initial prop values to warn once at component creation time.
	if (import.meta.env.DEV) {
		if (untrack(() => !children && (iconStart || iconEnd) && !ariaLabel)) {
			console.warn(
				'[hyzer-ui] <Link>: icon-only usage detected without an `ariaLabel` prop. ' +
					'Add ariaLabel to satisfy WCAG 4.1.2 Name, Role, Value.'
			);
		}
	}
</script>

<!--
	R13: {…rest} is spread first so that every subsequently-listed attribute
	(class, href, data-variant, data-size, data-external, target, rel,
	aria-current, aria-label) is applied after and wins over any conflicting
	key that a consumer accidentally passes through rest.
-->
<a
	{...rest}
	class={cx('hz-link', className)}
	{href}
	data-variant={variant}
	data-size={size}
	data-external={external ? '' : undefined}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	aria-current={ariaCurrent}
	aria-label={ariaLabel}
	{onclick}
>
	{#if iconStart}{@render iconStart()}{/if}
	{#if children}{@render children()}{/if}
	{#if iconEnd}{@render iconEnd()}{/if}
	{#if external}<span class="sr-only">(opens in new tab)</span>{/if}
</a>
