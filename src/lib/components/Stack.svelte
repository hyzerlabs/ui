<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	type StackAlign = 'start' | 'center' | 'end' | 'stretch';

	interface Props {
		gap?: StackGap;
		align?: StackAlign;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		gap = 'md',
		align = 'stretch',
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-gap, data-align) wins over any conflicting key a consumer
	accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-stack', className)}
	data-gap={gap}
	data-align={align}
>
	{@render children?.()}
</svelte:element>

<style>
	.hz-stack {
		display: flex;
		flex-direction: column;
	}

	/* gap per spacing scale */
	.hz-stack[data-gap='none'] {
		gap: 0;
	}
	.hz-stack[data-gap='xs'] {
		gap: var(--hz-space-xs, 0.25rem);
	}
	.hz-stack[data-gap='sm'] {
		gap: var(--hz-space-sm, 0.5rem);
	}
	.hz-stack[data-gap='md'] {
		gap: var(--hz-space-md, 1rem);
	}
	.hz-stack[data-gap='lg'] {
		gap: var(--hz-space-lg, 1.5rem);
	}
	.hz-stack[data-gap='xl'] {
		gap: var(--hz-space-xl, 2rem);
	}

	/* align-items per data-align */
	.hz-stack[data-align='start'] {
		align-items: flex-start;
	}
	.hz-stack[data-align='center'] {
		align-items: center;
	}
	.hz-stack[data-align='end'] {
		align-items: flex-end;
	}
	.hz-stack[data-align='stretch'] {
		align-items: stretch;
	}
</style>
