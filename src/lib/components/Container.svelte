<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	type ContainerMax = 'sm' | 'md' | 'lg' | 'xl' | 'full';
	type ContainerPadding = 'none' | 'sm' | 'md' | 'lg';

	interface Props {
		max?: ContainerMax;
		padding?: ContainerPadding;
		center?: boolean;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		max = 'lg',
		padding = 'md',
		center = true,
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-max, data-padding, data-center) wins over any conflicting
	key a consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-container', className)}
	data-max={max}
	data-padding={padding}
	data-center={center ? '' : undefined}
>
	{@render children?.()}
</svelte:element>

<style>
	.hz-container {
		display: block;
	}

	/* max-width per width scale */
	.hz-container[data-max='sm'] {
		max-width: var(--hz-width-sm, 640px);
	}
	.hz-container[data-max='md'] {
		max-width: var(--hz-width-md, 968px);
	}
	.hz-container[data-max='lg'] {
		max-width: var(--hz-width-lg, 1200px);
	}
	.hz-container[data-max='xl'] {
		max-width: var(--hz-width-xl, 1440px);
	}
	.hz-container[data-max='full'] {
		max-width: 100%;
	}

	/* horizontal padding per spacing scale */
	.hz-container[data-padding='none'] {
		padding-inline: 0;
	}
	.hz-container[data-padding='sm'] {
		padding-inline: var(--hz-space-sm, 1rem);
	}
	.hz-container[data-padding='md'] {
		padding-inline: var(--hz-space-md, 2rem);
	}
	.hz-container[data-padding='lg'] {
		padding-inline: var(--hz-space-lg, 4rem);
	}

	/* centering */
	.hz-container[data-center] {
		margin-inline: auto;
	}
</style>
