<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutPadding } from '$lib/types';
	import { cx } from '$lib/utils';

	type ContainerMax = 'sm' | 'md' | 'lg' | 'xl' | 'full';

	interface Props {
		max?: ContainerMax;
		padding?: LayoutPadding;
		center?: boolean;
		/**
		 * Escape the parent column and span the nearest inline-size container
		 * (or the viewport when no ancestor sets container-type). Overrides max.
		 */
		breakout?: boolean;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		max = 'lg',
		padding = 'md',
		center = true,
		breakout = false,
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-max, data-padding, data-center, data-breakout) wins over any
	conflicting key a consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-container', className)}
	data-max={max}
	data-padding={padding}
	data-center={center ? '' : undefined}
	data-breakout={breakout ? '' : undefined}
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

	/* padding (both axes) per spacing scale */
	.hz-container[data-padding='none'] {
		padding: 0;
	}
	.hz-container[data-padding='sm'] {
		padding: var(--hz-space-sm, 1rem);
	}
	.hz-container[data-padding='md'] {
		padding: var(--hz-space-md, 2rem);
	}
	.hz-container[data-padding='lg'] {
		padding: var(--hz-space-lg, 4rem);
	}

	/* density distances — shift-aware vars from the tokens.css density block */
	.hz-container[data-padding='near'] {
		padding: var(--hz-space-near, 4rem);
	}
	.hz-container[data-padding='away'] {
		padding: var(--hz-space-away, 8rem);
	}

	/* centering */
	.hz-container[data-center] {
		margin-inline: auto;
	}

	/*
	 * Breakout — escape the parent column and span the nearest inline-size
	 * container (cq units fall back to the small viewport when no ancestor
	 * sets container-type). The default start margin assumes the parent
	 * column is centered within that container; a start-aligned layout sets
	 * --hz-breakout-shift: 0 on an ancestor so the breakout only grows
	 * toward the end edge. Declared last so it beats the max and centering
	 * rules above at equal specificity.
	 */
	.hz-container[data-breakout] {
		width: 100cqw;
		max-width: none;
		margin-inline-start: var(--hz-breakout-shift, calc(50% - 50cqw));
	}
</style>
