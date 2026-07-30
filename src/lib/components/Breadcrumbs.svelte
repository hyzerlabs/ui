<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BreadcrumbItem } from '$lib/types';
	import { cx } from '$lib/utils';
	import Link from './Link.svelte';
	import IconChevronRight from '$lib/icons/generated/chevron-right.svelte';

	interface Props {
		items: BreadcrumbItem[];
		ariaLabel?: string;
		/** Replaces the chevron rendered between items. */
		separator?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let { items, ariaLabel = 'Breadcrumb', separator, class: className, ...rest }: Props = $props();
</script>

<!--
	APG breadcrumb: a nav landmark wrapping an ordered list. The last item is
	the current page — aria-current="page" is applied automatically unless the
	item sets its own ariaCurrent; without an href it renders as plain text.
	Separators are decorative (aria-hidden).
-->
<nav {...rest} class={cx('hz-breadcrumbs', className)} aria-label={ariaLabel}>
	<ol>
		{#each items as item, i (i)}
			{@const last = i === items.length - 1}
			<li>
				{#if item.href}
					<Link
						href={item.href}
						variant="nav"
						external={item.external}
						ariaCurrent={item.ariaCurrent ?? (last ? 'page' : undefined)}
					>
						{item.label}
					</Link>
				{:else}
					<!-- The href-less item honors its own ariaCurrent too. It is usually
					     the current page, so this is the branch the override matters on. -->
					<span
						class="hz-breadcrumbs-current"
						aria-current={item.ariaCurrent ?? (last ? 'page' : undefined)}
					>
						{item.label}
					</span>
				{/if}
				{#if !last}
					<span class="hz-breadcrumbs-separator" aria-hidden="true">
						{#if separator}{@render separator()}{:else}<IconChevronRight />{/if}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	/* Cluster-style wrapping row; each li carries its own trailing separator
	 * so a wrapped line never starts with one. */
	.hz-breadcrumbs ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
	}

	.hz-breadcrumbs li {
		display: flex;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
	}

	.hz-breadcrumbs-separator {
		display: inline-flex;
		align-items: center;
	}
</style>
