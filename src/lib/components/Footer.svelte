<script lang="ts">
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';
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

	// a blank title degrades the column below: the title is the landmark's
	// accessible name, and aria-label="" is a nameless `navigation` landmark.
	function blankTitle(title: string): boolean {
		return title.trim() === '';
	}

	$effect(() => {
		if (!DEV) return;

		// footer links are a flat list — `children` is ignored, and silence
		// would hide the misuse. One warning per render pass, first offender.
		const offender = columns.flatMap((c) => c.links).find((l) => l.children !== undefined);
		if (offender) {
			console.warn(
				`[hz-footer] Footer links are a flat list — \`children\` on "${offender.label}" was ` +
					'ignored. For navigation with expandable sections, use <Nav orientation="vertical"> instead.'
			);
		}

		const blankIdx = columns.findIndex((c) => blankTitle(c.title));
		if (blankIdx !== -1) {
			console.warn(
				`[hz-footer] Column ${blankIdx} has a blank title. The title names the column's ` +
					'navigation landmark, so the column rendered without one — give every column a title.'
			);
		}
	});
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-variant, data-bordered) wins over any conflicting key a
	consumer passes through rest.
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

	{#snippet columnLinks(column: FooterColumn)}
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
	{/snippet}

	<Grid class="hz-footer-columns">
		{#each columns as column, ci (ci)}
			{#if blankTitle(column.title)}
				<!-- no <nav>, no heading — a nameless landmark and an empty
				     heading are both worse than neither. Links stay intact. -->
				<div class="hz-footer-column">
					{@render columnLinks(column)}
				</div>
			{:else}
				<nav class="hz-footer-column" aria-label={column.title}>
					<svelte:element this={`h${headingLevel}`} class="hz-footer-heading">
						{column.title}
					</svelte:element>
					{@render columnLinks(column)}
				</nav>
			{/if}
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
	 * Override Grid's track template with an auto-fit layout so columns
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
