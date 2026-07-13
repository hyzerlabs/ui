<script lang="ts">
	import { Stack } from '$lib';
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

	const densityUsage = `<section class="settings">
	<h2>Settings</h2>
	<div class="group" data-density-shift>
		<h3>Notifications</h3>
		<label data-density-shift>…</label>
	</div>
</section>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-near); /* related: heading ↔ groups */
		padding-block: var(--hz-space-away); /* unrelated: section ↔ page */
	}
	.group,
	.group label {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-near); /* same var, tighter per level */
	}
</style>`;
</script>

<svelte:head>
	<title>Spacing & Sizing — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Spacing &amp; Sizing</h1>
		<p>Spacing scale and breakpoint/width tokens that back component layout defaults.</p>
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
			nested regions read denser without introducing new spacing values. Two levels of shift is the
			floor.
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
			Every box uses the same two variables — <code>gap: var(--hz-space-near)</code> and
			<code>padding: var(--hz-space-away)</code>. Only the nesting changes.
		</p>
		<div class="density-box" aria-labelledby="density-demo-heading">
			<p class="density-label">Depth 0 — near 2rem · away 4rem</p>
			<div class="density-box" data-density-shift>
				<p class="density-label">Depth 1 — near 0.8rem · away 2rem</p>
				<div class="density-box" data-density-shift>
					<p class="density-label">Depth 2 — near 0.4rem · away 0.8rem</p>
					<p class="density-label">Siblings sit one near apart.</p>
				</div>
			</div>
		</div>

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

	.density-box {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-near, 2rem);
		padding: var(--hz-space-away, 4rem);
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.density-label {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
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
