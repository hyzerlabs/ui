<script lang="ts">
	interface Props {
		/** Accessible label. When absent the icon is hidden from assistive technology. */
		ariaLabel?: string;
		/** Icon size in px (applied to both width and height). Default: 24. */
		size?: number;
	}

	let { ariaLabel, size = 24 }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={ariaLabel ? undefined : 'true'}
	aria-label={ariaLabel}
	role={ariaLabel ? 'img' : undefined}
>
	<polyline points="6 9 12 15 18 9" />
</svg>
