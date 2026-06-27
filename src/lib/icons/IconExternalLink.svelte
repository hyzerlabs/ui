<script lang="ts">
	// Source: Lucide (ISC) — https://lucide.dev/icons/external-link
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
	<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
	<polyline points="15 3 21 3 21 9" />
	<line x1="10" y1="14" x2="21" y2="3" />
</svg>
