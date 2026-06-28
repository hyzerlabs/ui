<script lang="ts">
	import { Stack } from '$lib';
	import { space, width } from '$lib/tokens';

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

	<section aria-labelledby="width-heading">
		<h2 id="width-heading">Width / breakpoint tokens</h2>
		<p>
			These values back the <code>Container</code> max-width variants. Component
			<code>@media</code> thresholds remain literal values — CSS cannot read custom properties inside
			media queries.
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
