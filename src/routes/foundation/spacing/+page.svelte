<script lang="ts">
	import { Cluster, Stack } from '$lib';
	import { space, width, density } from '$lib/tokens';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	// R7 — derive from token metadata
	const spaceTokens = Object.entries(space).map(([key, value]) => ({
		key,
		cssVar: `--hz-space-${key}`,
		value
	}));

	const widthTokens = Object.entries(width).map(([key, value]) => ({
		key,
		cssVar: `--hz-width-${key}`,
		value
	}));

	// Density levels — resolve each multiplier against the grid unit for display
	const densityUnit = parseFloat(density.unit);
	const densityLevels = density.levels.map((level, depth) => ({
		depth,
		near: `${level.near} × = ${(densityUnit * level.near).toFixed(1).replace(/\.0$/, '')}rem`,
		away: `${level.away} × = ${(densityUnit * level.away).toFixed(1).replace(/\.0$/, '')}rem`
	}));

	// Mirrors the live demo below — every distance is gap/padding="near" or
	// "away"; only the data-density-shift nesting changes.
	const densityUsage = `<Stack gap="away">                           <!-- sections: away = 8rem -->
	<Stack gap="near" data-density-shift>       <!-- section: 1 shift → near = 2rem -->
		<h2>Projects</h2>
		<Cluster gap="near" align="stretch">
			<Stack padding="near">                   <!-- card inherits the shift: 2rem -->
				<Stack gap="near" data-density-shift>   <!-- card rhythm: 2 shifts → 0.8rem -->
					<h3>Flight Tracker</h3>
					<p>Round scoring and disc flight stats.</p>
					<Cluster gap="near" data-density-shift> <!-- tags: 3 shifts → 0.4rem -->
						<span>svelte</span>
						<span>supabase</span>
						<span>pwa</span>
					</Cluster>
				</Stack>
			</Stack>
			<!-- … more cards … -->
		</Cluster>
	</Stack>

	<Stack gap="near" data-density-shift>
		<h2>Archive</h2>
		<p>Retired experiments live here.</p>
	</Stack>
</Stack>`;
</script>

<svelte:head>
	<title>Spacing & Sizing — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Spacing &amp; Sizing</h1>
		<p>Three sizing systems, each answering a different question:</p>
		<ul class="system-list">
			<li>
				<strong>Spacing scale</strong> — fixed steps (<code>--hz-space-xs</code> …
				<code>xl</code>) for explicit, context-independent distances; they back the component
				defaults.
			</li>
			<li>
				<strong>Density spacing</strong> — two context-aware distances (<code>near</code> /
				<code>away</code>) derived from one grid unit that automatically tighten as content nests.
				Use these for page rhythm instead of picking steps by hand.
			</li>
			<li>
				<strong>Breakpoint widths</strong> — the <code>--hz-width-sm…xl</code> tokens that cap
				<code>Container</code> and drive the <code>Grid</code>/<code>Split</code> container-query
				thresholds.
			</li>
		</ul>
	</div>

	<section aria-labelledby="space-heading">
		<h2 id="space-heading">Spacing tokens</h2>
		<Stack gap="sm">
			{#each spaceTokens as token (token.cssVar)}
				<div class="space-row">
					<code class="token-name">{token.cssVar}</code>
					<code class="token-val">{token.value}</code>
					<div class="space-bar-wrap">
						<div
							class="space-bar"
							style="width: {token.value === '0' ? '2px' : token.value}"
							role="img"
							aria-label="{token.value} spacing bar"
						></div>
					</div>
				</div>
			{/each}
		</Stack>
	</section>

	<section aria-labelledby="density-heading">
		<h2 id="density-heading">Density spacing</h2>
		<p>
			An alternate spacing model, adapted from
			<a href="https://blog.damato.design/posts/complementary-space/">Complementary Space</a>:
			instead of picking from a
			scale, use two distances — <code>--hz-space-near</code> between related things and
			<code>--hz-space-away</code> between unrelated things. Both derive from the
			<code>--hz-density</code> grid unit ({density.unit}), so overriding one custom property
			retunes every distance on the page.
		</p>
		<p class="tab-note">
			Adding <code>data-density-shift</code> to an ancestor tightens both distances one level, so
			nested regions read denser without introducing new spacing values. Three levels of shift is
			the floor. The near multipliers walk the 1-2-5-10 ladder, so a shifted region's away always
			equals its parent's near.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Shift depth</th>
						<th scope="col"><code>--hz-space-near</code></th>
						<th scope="col"><code>--hz-space-away</code></th>
					</tr>
				</thead>
				<tbody>
					{#each densityLevels as level (level.depth)}
						<tr>
							<td>{level.depth === 0 ? 'none (body)' : `${level.depth} × data-density-shift`}</td>
							<td><code>{level.near}</code></td>
							<td><code>{level.away}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<h3 id="density-demo-heading">Live demo</h3>
		<p>
			A real composition built from Stack and Cluster — page, sections, cards, tag rows. Every
			distance is <code>gap="near"</code>, <code>gap="away"</code>, or
			<code>padding="near"</code>; each nested region adds one <code>data-density-shift</code> and
			the whole hierarchy tightens on its own.
		</p>
		<div class="density-demo" aria-labelledby="density-demo-heading">
			<Stack gap="away">
				<Stack gap="near" data-density-shift>
					<p class="demo-heading">Projects</p>
					<Cluster gap="near" align="stretch">
						{#each [{ title: 'Flight Tracker', desc: 'Round scoring and disc flight stats for every throw.', tags: ['svelte', 'supabase', 'pwa'] }, { title: 'Course Atlas', desc: 'Community-maintained maps of local courses.', tags: ['sveltekit', 'maplibre'] }] as project (project.title)}
							<Stack padding="near" class="density-card">
								<Stack gap="near" data-density-shift>
									<p class="card-title">{project.title}</p>
									<p class="card-desc">{project.desc}</p>
									<Cluster gap="near" data-density-shift>
										{#each project.tags as tag (tag)}
											<span class="demo-chip">{tag}</span>
										{/each}
									</Cluster>
								</Stack>
							</Stack>
						{/each}
					</Cluster>
				</Stack>
				<Stack gap="near" data-density-shift>
					<p class="demo-heading">Archive</p>
					<p class="card-desc">Retired experiments live here.</p>
				</Stack>
			</Stack>
		</div>
		<p class="tab-note">
			Sections sit 8rem apart (<code>away</code>, no shift). Each section is one shift, so its
			heading, cards, and the card padding all share <code>near</code> = 2rem; the
			title/description/tags rhythm is <code>near</code> at two shifts = 0.8rem; the tag gaps are
			<code>near</code> at three shifts = 0.4rem.
		</p>

		<h3>Usage</h3>
		<CodeBlock code={densityUsage} />
	</section>

	<section aria-labelledby="width-heading">
		<h2 id="width-heading">Width / breakpoint tokens</h2>
		<p>
			These values back the <code>Container</code> max-width variants and the
			<code>Grid</code>/<code>Split</code> container-query breakpoints (sm/md/lg). Component
			<code>@media</code>/<code>@container</code> thresholds remain literal values — CSS cannot read
			custom properties inside media or container queries.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each widthTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
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

	h3 {
		margin: 1.5rem 0 0.5rem;
		font-size: var(--hz-font-size-lg, 1.25rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0 0 1rem;
	}

	.system-list {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.space-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding-block: 0.375rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.token-name {
		min-width: 12rem;
	}

	.token-val {
		min-width: 4rem;
		color: var(--hz-color-text-muted, #6b7280);
	}

	.space-bar-wrap {
		flex: 1;
		min-width: 0;
	}

	.space-bar {
		height: 1rem;
		background-color: var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		min-width: 2px;
		max-width: 100%;
	}

	.tab-note {
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.density-demo {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: var(--hz-space-near, 4rem);
		margin-bottom: 1rem;
	}

	.demo-heading {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	:global(.density-card) {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		flex: 1 1 16rem;
	}

	.card-title {
		margin: 0;
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.card-desc {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.demo-chip {
		padding: 0.125rem 0.625rem;
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-full, 9999px);
		font-size: var(--hz-font-size-sm, 0.875rem);
		white-space: nowrap;
	}

	.token-table-wrapper {
		overflow-x: auto;
	}

	.token-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.token-table th,
	.token-table td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}
</style>
