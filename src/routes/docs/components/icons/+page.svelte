<script lang="ts">
	import { Stack, Tabs, TextInput, Virtualizer, Badge, Slider, CodeBlock } from '$lib';
	import Example from '../../../../docs/Example.svelte';
	import type { Component } from 'svelte';
	import { CORE_ICONS } from '../../../../lib/icons/core';
	import { pascalize } from '../../../../lib/icons/pascalize';
	import { ICON_NAMES, LUCIDE_VERSION } from '../../../../lib/icons/generated/manifest';
	import DemoCheck from '../../../../lib/icons/generated/check.svelte';
	import DemoSearch from '../../../../lib/icons/generated/search.svelte';
	import DemoSettings from '../../../../lib/icons/generated/settings.svelte';
	import DemoRocket from '../../../../lib/icons/generated/rocket.svelte';
	import DemoSparkles from '../../../../lib/icons/generated/sparkles.svelte';
	import DemoOctagonAlert from '../../../../lib/icons/generated/octagon-alert.svelte';
	import DemoTriangleAlert from '../../../../lib/icons/generated/triangle-alert.svelte';
	import DemoCircleCheck from '../../../../lib/icons/generated/circle-check.svelte';
	import DemoInfo from '../../../../lib/icons/generated/info.svelte';
	import PropsTable from '../../../../docs/PropsTable.svelte';
	import { iconsDoc } from '../../../../docs/data/icons';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	// Lazy per-glyph loading. This catalog page is the one place in the
	// docs app allowed to reach across the whole generated set; it never
	// eagerly imports the 1,748-component barrel, only this manifest (names +
	// version) plus one glyph at a time as rows scroll into view (or, for the
	// small fixed core set below, on first paint).
	const glyphLoaders = import.meta.glob<{ default: Component }>(
		'../../../../lib/icons/generated/*.svelte'
	);

	function loaderFor(name: string) {
		return glyphLoaders[`../../../../lib/icons/generated/${name}.svelte`];
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

	// Interactive size/stroke demo — sliders drive the icon and the code
	// fence together.
	let demoSize = $state(24);
	let demoStroke = $state(2);
	const sizeStrokeCode = $derived(`<IconCheck size={${demoSize}} strokeWidth={${demoStroke}} />`);

	// One glyph per intent — different icons on purpose, to show how cheap
	// per-context glyph + color pairing is with deep imports.
	const intentGlyphs = [
		{ intent: 'neutral', icon: DemoSettings, name: 'IconSettings' },
		{ intent: 'primary', icon: DemoRocket, name: 'IconRocket' },
		{ intent: 'secondary', icon: DemoSparkles, name: 'IconSparkles' },
		{ intent: 'danger', icon: DemoOctagonAlert, name: 'IconOctagonAlert' },
		{ intent: 'warning', icon: DemoTriangleAlert, name: 'IconTriangleAlert' },
		{ intent: 'success', icon: DemoCircleCheck, name: 'IconCircleCheck' },
		{ intent: 'info', icon: DemoInfo, name: 'IconInfo' }
	] as const;

	const intentCode = [
		...intentGlyphs.map((g) => `<${g.name} intent="${g.intent}" />`),
		'',
		'<!-- or bring your own class -->',
		'<IconCheck class="my-tint" />'
	].join('\n');

	const importCode = [
		"import { IconCheck } from '@hyzer-labs/ui/icons';",
		'',
		'// or skip the barrel with a deep import',
		"import IconCheck from '@hyzer-labs/ui/icons/check';"
	].join('\n');

	const a11yCode = [
		'<IconSearch />                    <!-- no ariaLabel: decorative, aria-hidden="true" -->',
		'<IconSearch ariaLabel="Search" /> <!-- labeled: carries an accessible name -->'
	].join('\n');

	const demoTabs = [
		{ id: 'size', label: 'Size & stroke' },
		{ id: 'intent', label: 'Intent' },
		{ id: 'a11y', label: 'Decorative vs. labeled' }
	];

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
		</span>
		{#if coreSet.has(name)}<Badge size="sm" intent="primary">core</Badge>{/if}
		<button
			type="button"
			class="icon-copy"
			title={importLineFor(name)}
			onclick={() => copyImportLine(name)}
			aria-label={`Copy import line for Icon${pascalize(name)}`}
		>
			{copiedName === name ? 'Copied' : 'Copy import'}
		</button>
	</div>
{/snippet}

<svelte:head>
	<title>Icons — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			The full <a href="https://lucide.dev" target="_blank" rel="noreferrer">Lucide</a> set (ISC)
			ships as generated per-icon Svelte components: <strong>{allNames.length} icons</strong> from
			Lucide v{LUCIDE_VERSION}. Each one is decorative by default, and labeled when you pass
			<code>ariaLabel</code>.
		{/snippet}
	</DocIntro>

	<p class="doc-note">
		Brand marks are not included. Every icon-accepting component takes a snippet, so bring your own:
		an inline SVG, an icon font glyph, or a package like <code>simple-icons</code>. You pass one of
		those the same way you pass a Lucide icon.
	</p>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="import-heading"
	>
		<h2 id="import-heading">Import</h2>
		<p>
			Import from the barrel (<code>@hyzer-labs/ui/icons</code>) for zero config: your bundler
			tree-shakes the rest away. Use a deep import (<code>@hyzer-labs/ui/icons/&lt;name&gt;</code>)
			to skip the barrel, which keeps a dev server's module graph small. Or declare an
			<code>icons: [...]</code>
			list in
			<code>hyzer.config.ts</code> and run <code>hyzer generate</code> for a curated, project-local
			barrel. See
			<a href="/docs/foundation/config#icons-config-heading">Config &amp; CLI</a>.
		</p>
		<CodeBlock code={importCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="demo-heading"
	>
		<h2 id="demo-heading">Demo</h2>
		<Tabs items={demoTabs} ariaLabel="Icon demos" defaultTab="size">
			{#snippet panel(item)}
				<!-- gap="near": the Intent and a11y panels stack a note above their
				     Example, and neither carries spacing of its own. -->
				<Stack class="tab-content" gap="near">
					{#if item.id === 'size'}
						<Example code={sizeStrokeCode}>
							<div class="size-demo">
								<div class="size-demo-controls">
									<Slider
										name="icon-size"
										label="size"
										min={12}
										max={64}
										step={4}
										bind:value={demoSize}
									/>
									<Slider
										name="icon-stroke"
										label="strokeWidth"
										min={0.5}
										max={4}
										step={0.5}
										bind:value={demoStroke}
									/>
								</div>
								<div class="size-demo-preview">
									<DemoCheck
										size={demoSize}
										strokeWidth={demoStroke}
										ariaLabel="Check icon preview"
									/>
								</div>
							</div>
						</Example>
					{:else if item.id === 'intent'}
						<p class="tab-note">
							<code>intent</code> colors the glyph from the shared vocabulary (<code
								>color: var(--hz-intent-*)</code
							>). See
							<a href="/docs/foundation/colors#intent">Foundation &rarr; Colors &amp; Intent</a>.
							<code>class</code> is a separate hook, yours to style.
						</p>
						<Example code={intentCode}>
							<div class="demo-row">
								{#each intentGlyphs as g (g.intent)}
									<div class="demo-item">
										<g.icon intent={g.intent} size={32} />
										<code>{g.intent}</code>
									</div>
								{/each}
								<div class="demo-item">
									<DemoCheck class="demo-tinted" size={32} />
									<code>class="…"</code>
								</div>
							</div>
						</Example>
					{:else}
						<p class="tab-note">
							Without <code>ariaLabel</code>, an icon is decorative: it gets
							<code>aria-hidden="true"</code>, and assistive tech skips it. With one, the svg
							carries an accessible name.
						</p>
						<Example code={a11yCode}>
							<div class="demo-row">
								<div class="demo-item">
									<DemoSearch />
									<span>Decorative (no ariaLabel → aria-hidden)</span>
								</div>
								<div class="demo-item">
									<DemoSearch ariaLabel="Search" />
									<span>Labeled (ariaLabel="Search")</span>
								</div>
							</div>
						</Example>
					{/if}
				</Stack>
			{/snippet}
		</Tabs>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="props-heading"
	>
		<h2 id="props-heading">Props</h2>
		<p>
			Every icon in the library shares the same interface. Anything else you pass goes straight to
			the
			<code>svg</code> root.
		</p>
		<PropsTable label="Icon props" props={iconsDoc.props ?? []} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="core-heading"
	>
		<h2 id="core-heading">Core icons</h2>
		<p>
			These <strong>{CORE_ICONS.length}</strong> icons, marked
			<Badge size="sm" intent="primary">core</Badge>, ship in every <code>hyzer generate</code>
			barrel no matter what your <code>icons</code> config says, even <code>icons: []</code>. They
			are the glyphs this library's own components render internally: the chevrons, close, menu,
			search, and so on. Trimming your icon vocabulary can never break a component you are already
			using.
		</p>
		<div class="core-grid">
			{#each CORE_ICONS as name (name)}
				{@render iconTile(name)}
			{/each}
		</div>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="catalog-heading"
	>
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
			<Virtualizer items={rows} itemHeight={ROW_HEIGHT} height={768} class="icon-grid">
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
	</Stack>
</Stack>

<style>
	/* Margin zeroed — top-level p's directly inside a .doc-section Stack
	 * (gap="away", data-density-shift) let the gap own the rhythm; .doc-intro's
	 * own p's (doc-description, .note) are nested inside that wrapper div, not
	 * the section Stacks, and keep their own margins (docs.css / this file). */
	p {
		margin: 0;
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
		color: var(--hz-intent-primary, #2563eb);
	}

	.core-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
		gap: 0.75rem;
	}

	.size-demo {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.size-demo-controls {
		flex: 1;
		min-width: 14rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.size-demo-preview {
		flex: 0 0 6rem;
		min-height: 6rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Margin zeroed — direct child of the catalog section Stack (gap="away",
	 * data-density-shift), which now owns the space around it. */
	.count {
		margin: 0;
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
