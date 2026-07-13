<script lang="ts">
	import { Stack, Grid } from '$lib';
	import * as icons from '$lib/icons';

	// R8 — all 21 icon exports; filter out non-component exports (like IconProps type)
	const iconEntries = Object.entries(icons).filter(
		([name, value]) => name.startsWith('Icon') && typeof value === 'function'
	) as [string, typeof icons.IconChevronDown][];
</script>

<svelte:head>
	<title>Icons — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Icons</h1>
		<p>
			21 icons exported from <code>$lib/icons</code>. UI icons use Lucide (ISC); brand icons use
			Simple Icons (CC0). Each accepts <code>size</code>, <code>strokeWidth</code>, and
			<code>ariaLabel</code> props. When <code>ariaLabel</code> is absent the icon is decorative (<code
				>aria-hidden="true"</code
			>); when present it is labelled.
		</p>
	</div>

	<section aria-labelledby="size-heading">
		<h2 id="size-heading">Size &amp; stroke</h2>
		<div class="demo-row">
			<div class="demo-item">
				<icons.IconCheck size={16} ariaLabel="Check icon at size 16" />
				<code>size=16</code>
			</div>
			<div class="demo-item">
				<icons.IconCheck size={24} ariaLabel="Check icon at size 24 (default)" />
				<code>size=24 (default)</code>
			</div>
			<div class="demo-item">
				<icons.IconCheck size={40} ariaLabel="Check icon at size 40" />
				<code>size=40</code>
			</div>
			<div class="demo-item">
				<icons.IconCheck size={24} strokeWidth={1} ariaLabel="Check icon stroke 1" />
				<code>strokeWidth=1</code>
			</div>
			<div class="demo-item">
				<icons.IconCheck size={24} strokeWidth={3} ariaLabel="Check icon stroke 3" />
				<code>strokeWidth=3</code>
			</div>
		</div>
	</section>

	<section aria-labelledby="a11y-heading">
		<h2 id="a11y-heading">Decorative vs. labelled</h2>
		<div class="demo-row">
			<div class="demo-item">
				<!-- aria-hidden="true" — decorative -->
				<icons.IconSearch />
				<span>Decorative (no ariaLabel → aria-hidden)</span>
			</div>
			<div class="demo-item">
				<!-- labelled — carries accessible name -->
				<icons.IconSearch ariaLabel="Search" />
				<span>Labelled (ariaLabel="Search")</span>
			</div>
		</div>
	</section>

	<section aria-labelledby="all-heading">
		<h2 id="all-heading">All icons ({iconEntries.length})</h2>
		<!-- R8 — icon export name is visible text associated with each icon -->
		<Grid columns={{ base: 2, sm: 3, md: 5 }} gap="sm">
			{#each iconEntries as [name, IconComponent] (name)}
				<div class="icon-tile">
					<!-- R8 — decorative in grid context; name is visible text below -->
					<IconComponent size={24} />
					<span class="icon-label">{name}</span>
				</div>
			{/each}
		</Grid>
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

	.icon-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.5rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		text-align: center;
	}

	.icon-label {
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-family: var(--hz-font-family-mono, monospace);
		word-break: break-all;
		line-height: var(--hz-line-height-tight, 1.2);
	}
</style>
