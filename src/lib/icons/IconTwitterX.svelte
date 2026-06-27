<script lang="ts">
	// Source: Simple Icons (CC0) — https://simpleicons.org/?q=x
	import type { IconProps } from './types.js';
	import { cx } from '$lib/utils';

	// strokeWidth accepted for interface compatibility; unused on fill-based icons
	let {
		size = 24,
		strokeWidth: _strokeWidth, // eslint-disable-line @typescript-eslint/no-unused-vars
		class: className,
		ariaLabel,
		...rest
	}: IconProps = $props();

	const decorative = $derived(!ariaLabel);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	fill="currentColor"
	{...rest}
	class={cx('hz-icon', className)}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	aria-hidden={decorative ? 'true' : undefined}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : ariaLabel}
>
	<path
		d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.738-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
	/>
</svg>
