<script lang="ts">
	// Source: Simple Icons (CC0) — https://simpleicons.org/?q=rss
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
		d="M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.301 3.29C1.47 24 0 22.526 0 20.71s1.475-3.294 3.291-3.295zM15.909 24h-4.665c0-6.169-5.075-11.245-11.244-11.245V8.09c8.727 0 15.909 7.184 15.909 15.91z"
	/>
</svg>
