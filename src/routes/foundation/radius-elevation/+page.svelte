<script lang="ts">
	import { Stack, Grid } from '$lib';
	import { radius, border, shadow, zIndex } from '$lib/tokens';

	// R7 — derive from token metadata
	const radiusTokens = Object.entries(radius).map(([key, value]) => ({
		key,
		cssVar: `--hz-radius-${key}`,
		value
	}));

	const borderWidthTokens = Object.entries(border.width).map(([key, value]) => ({
		key,
		cssVar: `--hz-border-width-${key}`,
		value
	}));

	const shadowTokens = Object.entries(shadow).map(([key, value]) => ({
		key,
		cssVar: `--hz-shadow-${key}`,
		value
	}));

	const zIndexTokens = Object.entries(zIndex).map(([key, value]) => ({
		key,
		cssVar: `--hz-z-${key}`,
		value
	}));
</script>

<svelte:head>
	<title>Radius & Elevation — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Radius &amp; Elevation</h1>
		<p>Border radius, border width, box shadows, and z-index scale.</p>
	</div>

	<section aria-labelledby="radius-heading">
		<h2 id="radius-heading">Border radius</h2>
		<Grid columns={{ sm: 2, md: 3, lg: 5 }} gap="md">
			{#each radiusTokens as token (token.cssVar)}
				<div class="radius-card">
					<div
						class="radius-box"
						style="border-radius: {token.value}"
						role="img"
						aria-label="border radius {token.value} preview"
					></div>
					<code class="token-name">{token.cssVar}</code>
					<code class="token-val">{token.value}</code>
				</div>
			{/each}
		</Grid>
	</section>

	<section aria-labelledby="border-heading">
		<h2 id="border-heading">Border width</h2>
		<Stack gap="sm">
			{#each borderWidthTokens as token (token.cssVar)}
				<div class="border-row">
					<code class="token-name">{token.cssVar}</code>
					<code class="token-val">{token.value}</code>
					<div
						class="border-preview"
						style="border-bottom-width: {token.value}"
						role="img"
						aria-label="border {token.value} preview"
					></div>
				</div>
			{/each}
		</Stack>
	</section>

	<section aria-labelledby="shadow-heading">
		<h2 id="shadow-heading">Shadows</h2>
		<Grid columns={{ sm: 1, md: 3 }} gap="lg">
			{#each shadowTokens as token (token.cssVar)}
				<div class="shadow-card" style="box-shadow: {token.value}">
					<code class="token-name">{token.cssVar}</code>
				</div>
			{/each}
		</Grid>
	</section>

	<section aria-labelledby="z-heading">
		<h2 id="z-heading">Z-index</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each zIndexTokens as token (token.cssVar)}
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
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.radius-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.radius-box {
		width: 100%;
		height: 4rem;
		background-color: var(--hz-color-primary, #2563eb);
		border: 1px solid var(--hz-color-border, #6b7280);
	}

	.token-name {
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		word-break: break-all;
	}

	.token-val {
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.border-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding-block: 0.5rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.border-preview {
		flex: 1;
		height: 0;
		border-bottom-style: solid;
		border-bottom-color: var(--hz-color-text, #000);
	}

	.shadow-card {
		padding: 1.5rem 1rem;
		border-radius: var(--hz-radius-md, 0.5rem);
		background: var(--hz-color-surface, #fff);
		display: flex;
		align-items: center;
		justify-content: center;
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
