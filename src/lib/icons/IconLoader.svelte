<script lang="ts">
	// Source: Lucide (ISC) — https://lucide.dev/icons/loader
	import type { IconProps } from './types.js';
	import { cx } from '$lib/utils';

	let { size = 24, strokeWidth = 2, class: className, ariaLabel, ...rest }: IconProps = $props();

	const decorative = $derived(!ariaLabel);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	fill="none"
	stroke="currentColor"
	{...rest}
	class={cx('hz-icon', className)}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={decorative ? 'true' : undefined}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : ariaLabel}
>
	<path d="M21 12a9 9 0 1 1-6.219-8.56" />
</svg>
