<script lang="ts">
	// Source: Lucide (ISC) — https://lucide.dev/icons/check
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
	<polyline points="20 6 9 17 4 12" />
</svg>
