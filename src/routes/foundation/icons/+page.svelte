<script lang="ts">
	import { Stack, TextInput, Virtualizer, Badge } from '$lib';
	import type { Component } from 'svelte';
	import { CORE_ICONS } from '../../../lib/icons/core';
	import { pascalize } from '../../../lib/icons/pascalize';
	import { ICON_NAMES, LUCIDE_VERSION } from '../../../lib/icons/generated/manifest';
	import DemoCheck from '../../../lib/icons/generated/check.svelte';
	import DemoSearch from '../../../lib/icons/generated/search.svelte';

	// R9 — lazy per-glyph loading. This catalog page is the one place in the
	// docs app allowed to reach across the whole generated set; it never
	// eagerly imports the 1,748-component barrel, only this manifest (names +
	// version) plus one glyph at a time as rows scroll into view (or, for the
	// small fixed core set below, on first paint).
	const glyphLoaders = import.meta.glob<{ default: Component }>(
		'../../../lib/icons/generated/*.svelte'
	);

	function loaderFor(name: string) {
		return glyphLoaders[`../../../lib/icons/generated/${name}.svelte`];
	}

	function importLineFor(name: string): string {
		return `import Icon${pascalize(name)} from '@hyzer-labs/ui/icons/${name}';`;
	}

	const coreSet = new Set<string>(CORE_ICONS);
	const allNames = ICON_NAMES as readonly string[];

	let query = $state('');
	let copiedName = $state<string | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return allNames;
		return allNames.filter((name) => name.includes(q));
	});

	// Fixed column count; tiles are percentage-wide (flex: 1 1 0), so the grid
	// never overflows regardless of viewport — narrow screens just get
	// narrower tiles, not a scrollbar.
	const COLUMNS = 4;
	const ROW_HEIGHT = 128;

	const rows = $derived.by(() => {
		const out: string[][] = [];
		for (let i = 0; i < filtered.length; i += COLUMNS) {
			out.push(filtered.slice(i, i + COLUMNS));
		}
		return out;
	});

	async function copyImportLine(name: string) {
		try {
			await navigator.clipboard.writeText(importLineFor(name));
			copiedName = name;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copiedName = null), 2000);
		} catch {
			// Clipboard unavailable (permissions/insecure context) — no-op.
		}
	}
</script>

{#snippet iconTile(name: string)}
	<div class="icon-tile">
		{#await loaderFor(name)() then mod}
			{@const Icon = mod.default}
			<Icon size={22} />
		{/await}
		<span class="icon-name">
			<span class="icon-name-text">Icon{pascalize(name)}</span>
			{#if coreSet.has(name)}<Badge size="sm">core</Badge>{/if}
		</span>
		<div class="icon-import-row">
			<code class="icon-import" title={importLineFor(name)}>{importLineFor(name)}</code>
			<button
				type="button"
				class="icon-copy"
				onclick={() => copyImportLine(name)}
				aria-label={`Copy import line for Icon${pascalize(name)}`}
			>
				{copiedName === name ? 'Copied' : 'Copy'}
			</button>
		</div>
	</div>
{/snippet}

<svelte:head>
	<title>Icons — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Icons</h1>
		<p>
			The full <a href="https://lucide.dev" rel="noreferrer">Lucide</a> set (ISC) ships as generated
			per-icon Svelte components — <strong>{allNames.length} icons</strong>, Lucide v{LUCIDE_VERSION}.
			Every icon accepts <code>size</code>, <code>strokeWidth</code>, and <code>ariaLabel</code>.
			When
			<code>ariaLabel</code> is absent the icon is decorative (<code>aria-hidden="true"</code>);
			when present it is labelled.
		</p>
		<p>
			Import from the barrel (<code>@hyzer-labs/ui/icons</code>) for zero config — bundler
			tree-shaking keeps your app lean. Prefer a deep import (<code
				>@hyzer-labs/ui/icons/&lt;name&gt;</code
			>) to skip the barrel entirely, which keeps a dev server's module graph small. Declare an
			<code>icons: [...]</code>
			list in
			<code>hyzer.config.ts</code> and run <code>hyzer generate</code> to get a curated,
			project-local barrel — see
			<a href="/theming/tokens#config-heading">Tokens &amp; Overrides</a>.
		</p>
		<p class="note">
			No brand marks ship — the 7 hand-drawn Simple Icons marks this library used to vendor were
			removed; every icon-accepting component takes a snippet, so bring your own brand mark (an
			inline SVG, an icon font glyph, or a package like <code>simple-icons</code>) the same way
			you'd pass any of these.
		</p>
	</div>

	<section aria-labelledby="core-heading">
		<h2 id="core-heading">Core icons</h2>
		<p>
			These <strong>{CORE_ICONS.length}</strong> icons — marked
			<Badge size="sm">core</Badge> — ship in every <code>hyzer generate</code> barrel no matter
			what your <code>icons</code> config says, even <code>icons: []</code>. They're the glyphs this
			library's own components render internally (the chevrons, close, menu, search, and friends),
			so trimming your icon vocabulary can never accidentally break a component you're already
			using.
		</p>
		<div class="core-grid">
			{#each CORE_ICONS as name (name)}
				{@render iconTile(name)}
			{/each}
		</div>
	</section>

	<section aria-labelledby="size-heading">
		<h2 id="size-heading">Size &amp; stroke</h2>
		<div class="demo-row">
			<div class="demo-item">
				<DemoCheck size={16} ariaLabel="Check icon at size 16" />
				<code>size=16</code>
			</div>
			<div class="demo-item">
				<DemoCheck size={24} ariaLabel="Check icon at size 24 (default)" />
				<code>size=24 (default)</code>
			</div>
			<div class="demo-item">
				<DemoCheck size={40} ariaLabel="Check icon at size 40" />
				<code>size=40</code>
			</div>
			<div class="demo-item">
				<DemoCheck size={24} strokeWidth={1} ariaLabel="Check icon stroke 1" />
				<code>strokeWidth=1</code>
			</div>
			<div class="demo-item">
				<DemoCheck size={24} strokeWidth={3} ariaLabel="Check icon stroke 3" />
				<code>strokeWidth=3</code>
			</div>
			<div class="demo-item">
				<DemoCheck size={24} class="demo-tinted" ariaLabel="Check icon with a consumer class" />
				<code>class="…"</code>
			</div>
		</div>
	</section>

	<section aria-labelledby="a11y-heading">
		<h2 id="a11y-heading">Decorative vs. labelled</h2>
		<div class="demo-row">
			<div class="demo-item">
				<!-- aria-hidden="true" — decorative -->
				<DemoSearch />
				<span>Decorative (no ariaLabel → aria-hidden)</span>
			</div>
			<div class="demo-item">
				<!-- labelled — carries accessible name -->
				<DemoSearch ariaLabel="Search" />
				<span>Labelled (ariaLabel="Search")</span>
			</div>
		</div>
	</section>

	<section aria-labelledby="catalog-heading">
		<h2 id="catalog-heading">Browse &amp; search</h2>
		<TextInput
			name="icon-search"
			label="Search icons"
			hideLabel
			placeholder="Search icons…"
			bind:value={query}
		/>
		<p class="count" aria-live="polite">
			{filtered.length} of {allNames.length} icons shown
		</p>

		{#if rows.length > 0}
			<Virtualizer items={rows} itemHeight={ROW_HEIGHT} height={480} class="icon-grid">
				{#snippet row(rowItems)}
					<div class="icon-row">
						{#each rowItems as name (name)}
							{@render iconTile(name)}
						{/each}
					</div>
				{/snippet}
			</Virtualizer>
		{:else}
			<p class="empty">No icons match "{query.trim()}".</p>
		{/if}
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-xl, 1.5rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0 0 0.75rem;
	}

	.note {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.demo-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: flex-end;
	}

	.demo-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.demo-item :global(.demo-tinted) {
		color: var(--hz-color-primary, #2563eb);
	}

	.core-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
		gap: 0.75rem;
	}

	.core-grid .icon-tile {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.count {
		margin: 0.5rem 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.empty {
		color: var(--hz-color-text-muted, #6b7280);
	}

	:global(.icon-grid) {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.icon-row {
		display: flex;
		gap: 0.5rem;
		box-sizing: border-box;
		height: 100%;
		padding: 0.5rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.icon-tile {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem;
		text-align: center;
	}

	.icon-name {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-family: var(--hz-font-family-mono, monospace);
		word-break: break-all;
		line-height: var(--hz-line-height-tight, 1.2);
	}

	.icon-import-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		max-width: 100%;
	}

	.icon-import {
		max-width: 8rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--hz-font-size-xs, 0.6875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.icon-copy {
		flex-shrink: 0;
		font-size: var(--hz-font-size-xs, 0.6875rem);
		padding: 0.1rem 0.35rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		background: none;
		color: inherit;
		cursor: pointer;
	}
</style>
