<script lang="ts">
	import type { Snippet } from 'svelte';
	import Stack from '$lib/components/Stack.svelte';
	import PropsTable from './PropsTable.svelte';
	import type { PropRow } from './PropsTable.svelte';
	import ThemeHooks from './ThemeHooks.svelte';
	import { hooks } from './hooks';

	/** A named supporting type (e.g. AccordionItem) shown as its own table under Props. */
	export interface TypeTable {
		name: string;
		props: PropRow[];
	}

	/** An external reference shown under the a11y note (APG pattern, MDN page). */
	export interface A11yLink {
		label: string;
		href: string;
	}

	interface Props {
		name: string;
		description: string;
		importLine: string;
		props?: PropRow[];
		/** Supporting item/option types rendered as sub-tables in the Props section. */
		types?: TypeTable[];
		/** Backtick-wrapped segments render as inline <code>, e.g. "sets `aria-busy`". */
		a11yNote?: string;
		/** APG pattern / MDN reference links rendered after the a11y note. */
		a11yLinks?: A11yLink[];
		children?: Snippet;
	}

	let {
		name,
		description,
		importLine,
		props = [],
		types = [],
		a11yNote,
		a11yLinks = [],
		children
	}: Props = $props();

	// spec 31 R9: a page's hook table is looked up by component name rather
	// than passed in — hooks.ts is keyed the same way, so the section appears
	// wherever there's an entry and there's no per-page wiring to drift.
	// hooks.spec.ts enforces that every component page has one.
	const componentHooks = $derived(hooks[name]);
</script>

<svelte:head>
	<title>{name} — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="sm">
	<div class="doc-intro">
		<h1>{name}</h1>
		<p class="doc-description">{description}</p>
	</div>

	<section aria-labelledby="import-heading" class="doc-section">
		<h2 id="import-heading">Import</h2>
		<pre><code>{importLine}</code></pre>
	</section>

	<section aria-labelledby="demo-heading" class="doc-section">
		<h2 id="demo-heading">Demo</h2>
		{#if children}
			{@render children()}
		{/if}
	</section>

	{#if props.length > 0}
		<section aria-labelledby="props-heading" class="doc-section">
			<h2 id="props-heading">Props</h2>
			<PropsTable {props} />
			{#each types as t (t.name)}
				<h3 class="type-heading"><code>{t.name}</code></h3>
				<PropsTable props={t.props} />
			{/each}
		</section>
	{/if}

	{#if componentHooks}
		<section aria-labelledby="hooks-heading" class="doc-section">
			<h2 id="hooks-heading">Theme hooks</h2>
			<p class="hooks-intro">
				What this component promises your CSS. The reference theme styles exactly these — from
				<code>@layer hz-theme</code>, so your unlayered rules win. See
				<a href="/theming/components">Styling Components</a> for the how.
			</p>
			<ThemeHooks hooks={componentHooks} />
		</section>
	{/if}

	{#if a11yNote}
		<section aria-labelledby="a11y-heading" class="doc-section">
			<h2 id="a11y-heading">Accessibility</h2>
			<p>
				<!-- Backtick-split: odd segments are inline code. -->
				{#each a11yNote.split('`') as segment, i (i)}{#if i % 2 === 1}<code>{segment}</code
						>{:else}{segment}{/if}{/each}
			</p>
			{#if a11yLinks.length > 0}
				<p class="a11y-refs">
					References:
					{#each a11yLinks as link, i (link.href)}{#if i > 0}
							·
						{/if}<a href={link.href}>{link.label}</a>{/each}
				</p>
			{/if}
		</section>
	{/if}
</Stack>

<style>
	.doc-intro h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
		line-height: var(--hz-line-height-tight, 1.2);
	}

	.doc-description {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.4rem);
		color: var(--hz-color-text, inherit);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.doc-section h2 {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.type-heading {
		margin: 1.5rem 0 0.75rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.a11y-refs {
		margin: 0.75rem 0 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.hooks-intro {
		margin: 0 0 1rem;
	}

	pre {
		padding: 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow-x: auto;
		background: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-color-gray, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
