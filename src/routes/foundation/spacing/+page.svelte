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

<Stack gap="away">
	<div class="doc-intro">
		<h1>Spacing &amp; Sizing</h1>
		<p class="doc-description">Three sizing systems, each answering a different question:</p>
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
				<code>Container</code> and drive the <code>Grid</code>/<code>Split</code> container-query thresholds.
			</li>
		</ul>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="space-heading"
	>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="density-heading"
	>
		<h2 id="density-heading">Density spacing</h2>
		<p>
			An alternate spacing model, adapted from
			<a
				href="https://blog.damato.design/posts/complementary-space/"
				target="_blank"
				rel="noreferrer">Complementary Space</a
			>: instead of picking from a scale, use two distances — <code>--hz-space-near</code> between
			related things and
			<code>--hz-space-away</code> between unrelated things. Both derive from the
			<code>--hz-density</code> grid unit ({density.unit}), so overriding one custom property
			retunes every distance on the page.
		</p>
		<p class="tab-note">
			Adding <code>data-density-shift</code> to an ancestor tightens both distances one level, so nested
			regions read denser without introducing new spacing values. Three levels of shift is the floor.
			The near multipliers walk the 1-2-5-10 ladder, so a shifted region's away always equals its parent's
			near.
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
			<code>padding="near"</code>; each nested region adds one <code>data-density-shift</code> and the
			whole hierarchy tightens on its own.
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
			On a fresh top-level page (shift 0) this composition reads: sections apart at <code>away</code
			>
			= 8rem; heading, cards, and card padding sharing <code>near</code> at one shift = 2rem; the
			title/description/tags rhythm at two shifts = 0.8rem; and the tag gaps at three shifts =
			0.4rem — the numbers in the code below. This docs shell and the section around this demo are
			already two shifts deep, so embedded here the demo's own shifts push straight past the floor:
			sections still sit apart at this page's <code>away</code> (2rem, unshifted), but heading,
			cards, title/description/tags, and tag gaps all land on the same <code>near</code> = 0.4rem floor
			— a live example of the "three levels is the floor" rule above.
		</p>

		<h3>Usage</h3>
		<p class="tab-note">As it would render starting from a fresh top-level page:</p>
		<CodeBlock code={densityUsage} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="width-heading"
	>
		<h2 id="width-heading">Width / breakpoint tokens</h2>
		<p>
			Overriding these tokens retunes <code>Container</code> max-widths, <code>Split</code>'s
			<code>stackBelow</code> threshold, and <code>Grid</code>'s fluid
			<code>{'{ min }'}</code> mode — they all resolve via <code>var()</code>. The one exception is
			<code>Grid</code>'s band breakpoints (base/sm/md/lg): they mirror these values but remain
			literal system constants, because CSS cannot read custom properties inside media or container
			queries.
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
		<p class="override-note">
			Override the spacing scale, the density unit, or a width token with a plain CSS custom
			property, or set <code>space</code>, <code>density</code>, and <code>width</code> in the
			<code>hyzer</code> config; see
			<a href="/theming/tokens">Theming &rarr; Tokens &amp; Overrides</a>.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="axes-heading"
	>
		<h2 id="axes-heading">Logical axes</h2>
		<p>
			Where a component takes spacing per axis — the layout primitives'
			<code>paddingInline</code> and <code>paddingBlock</code> props — the names are the CSS logical
			properties they set, not physical <code>x</code>/<code>y</code>. The inline axis runs along
			the line of text; the block axis runs across it. That keeps the props correct in every writing
			mode: in RTL layouts the inline axis flips with the text, and in vertical writing modes it
			runs top-to-bottom, where a physical &ldquo;x&rdquo; would pad the wrong edges.
		</p>
		<p class="tab-note">
			The library's own CSS follows the same rule — centering is <code>margin-inline: auto</code>,
			gutters are <code>padding-inline</code> — so each prop maps 1:1 onto the property it drives.
			<code>padding</code> remains the both-axes shorthand; the per-axis longhands win where set.
		</p>
	</Stack>
</Stack>

<style>
	/* Margins zeroed — h3/p (including the former .override-note, now plain
	 * p) on this page are direct children of a .doc-section Stack (gap="away",
	 * data-density-shift), which now owns the rhythm. The live density demo
	 * below (.density-demo and its nested Stacks) is untouched — that's the
	 * density system's own worked example, not the page-level scaffold this
	 * refactor targets. */
	h3 {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.25rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0;
	}

	.system-list {
		margin: 0.5rem 0 0;
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
		background-color: var(--hz-intent-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		min-width: 2px;
		max-width: 100%;
	}

	/* Margin zeroed — direct child of the density-heading section Stack
	 * (gap="away", data-density-shift), which now owns the space around it. */
	.density-demo {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: var(--hz-space-near, 4rem);
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
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-intent-primary, #2563eb);
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
