<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FooterColumn } from '$lib/types';
	import { cx } from '$lib/utils';
	import Link from './Link.svelte';
	import Grid from './Grid.svelte';

	type FooterVariant = 'default' | 'minimal';
	type FooterLinkVariant = 'default' | 'subtle' | 'nav';
	type FooterHeadingLevel = 2 | 3 | 4 | 5 | 6;

	interface Props {
		columns: FooterColumn[];
		variant?: FooterVariant;
		/** Top hairline border — composes with any variant. */
		bordered?: boolean;
		linkVariant?: FooterLinkVariant;
		headingLevel?: FooterHeadingLevel;
		logo?: Snippet;
		social?: Snippet;
		bottom?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		columns,
		variant = 'default',
		bordered = false,
		linkVariant = 'subtle',
		headingLevel = 2,
		logo,
		social,
		bottom,
		class: className,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-variant, data-bordered) wins over any conflicting key a
	consumer passes through rest (R11).
-->
<footer
	{...rest}
	class={cx('hz-footer', className)}
	data-variant={variant}
	data-bordered={bordered ? '' : undefined}
>
	{#if logo}
		<div class="hz-footer-logo">{@render logo()}</div>
	{/if}

	<Grid class="hz-footer-columns">
		{#each columns as column, ci (ci)}
			<nav class="hz-footer-column" aria-label={column.title}>
				<svelte:element this={`h${headingLevel}`} class="hz-footer-heading">
					{column.title}
				</svelte:element>
				<ul role="list">
					{#each column.links as item, li (li)}
						{#if item.href}
							<li>
								<Link
									href={item.href}
									variant={linkVariant}
									external={item.external}
									ariaCurrent={item.ariaCurrent}>{item.label}</Link
								>
							</li>
						{:else}
							<li>{item.label}</li>
						{/if}
					{/each}
				</ul>
			</nav>
		{/each}
	</Grid>

	{#if social}
		<div class="hz-footer-social">{@render social()}</div>
	{/if}

	{#if bottom}
		<div class="hz-footer-bottom">{@render bottom()}</div>
	{/if}
</footer>

<style>
	/*
	 * R8 — Override Grid's track template with an auto-fit layout so columns
	 * stack when narrow and fill available tracks as width grows. No media or
	 * container queries required; --hz-footer-col-min is consumer-tunable.
	 *
	 * Grid does its layout on the inner .hz-grid-layout element (the root is
	 * its size container), so that's the element to override. The scoped
	 * .hz-footer parent gives this rule enough specificity to beat Grid's own
	 * scoped layout rules.
	 */
	.hz-footer :global(.hz-footer-columns > .hz-grid-layout) {
		grid-template-columns: repeat(
			auto-fit,
			minmax(min(100%, var(--hz-footer-col-min, 12rem)), 1fr)
		);
	}
</style>
