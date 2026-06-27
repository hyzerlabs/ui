<script lang="ts">
	// Source: Lucide (ISC) — https://lucide.dev/icons/search
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
	<circle cx="11" cy="11" r="8" />
	<line x1="21" y1="21" x2="16.65" y2="16.65" />
</svg>
