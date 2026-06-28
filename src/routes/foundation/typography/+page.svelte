<script lang="ts">
	import { Stack } from '$lib';
	import { typography } from '$lib/tokens';

	// R7 — derive from token metadata
	const fontSizes = Object.entries(typography.fontSize).map(([key, value]) => ({
		key,
		cssVar: `--hz-font-size-${key}`,
		value
	}));

	const fontWeights = Object.entries(typography.fontWeight).map(([key, value]) => ({
		key,
		cssVar: `--hz-font-weight-${key}`,
		value
	}));

	const fontFamilies = Object.entries(typography.fontFamily).map(([key, value]) => ({
		key,
		cssVar: `--hz-font-family-${key}`,
		value
	}));
</script>

<svelte:head>
	<title>Typography — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Typography</h1>
		<p>Five-step type scale, font families, and weights.</p>
	</div>

	<section aria-labelledby="scale-heading">
		<h2 id="scale-heading">Font size scale</h2>
		<Stack gap="sm">
			{#each fontSizes as token (token.cssVar)}
				<div class="scale-row">
					<code class="token-name">{token.cssVar}</code>
					<span class="token-val">{token.value}</span>
					<span class="preview" style="font-size: {token.value};">The quick brown fox</span>
				</div>
			{/each}
		</Stack>
	</section>

	<section aria-labelledby="weights-heading">
		<h2 id="weights-heading">Font weights</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
						<th scope="col">Preview</th>
					</tr>
				</thead>
				<tbody>
					{#each fontWeights as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
							<td style="font-weight: {token.value};">Typography preview</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section aria-labelledby="families-heading">
		<h2 id="families-heading">Font families</h2>
		<Stack gap="md">
			{#each fontFamilies as token (token.cssVar)}
				<div>
					<code class="token-name">{token.cssVar}</code>
					<p class="family-preview" style="font-family: {token.value};">
						The quick brown fox jumps over the lazy dog. 0123456789
					</p>
				</div>
			{/each}
		</Stack>
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.scale-row {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.token-name {
		min-width: 14rem;
		flex-shrink: 0;
	}

	.token-val {
		min-width: 4rem;
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.preview {
		flex: 1;
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

	.family-preview {
		margin: 0.5rem 0 0;
		font-size: var(--hz-font-size-base, 1rem);
	}
</style>
