<script lang="ts">
	import { Stack, Grid } from '$lib';
	import { color } from '$lib/tokens';

	// R7 — derive palette and role tokens from metadata; never hardcoded

	type ColorEntry = { key: string; cssVar: string; value: string };

	/**
	 * Convert a camelCase key to kebab-case for CSS var construction.
	 * e.g. "textMuted" → "text-muted"
	 */
	function toKebab(s: string): string {
		return s.replace(/([A-Z])/g, '-$1').toLowerCase();
	}

	/** Extract string-valued entries (skip the nested `theme` object). */
	function colorEntries(obj: Record<string, unknown>, prefix: string): ColorEntry[] {
		return Object.entries(obj)
			.filter(([, v]) => typeof v === 'string')
			.map(([key, value]) => ({
				key,
				cssVar: `${prefix}-${toKebab(key)}`,
				value: value as string
			}));
	}

	const paletteTokens = colorEntries(
		Object.fromEntries(
			Object.entries(color).filter(
				([, v]) => typeof v === 'string' && (v as string).startsWith('#')
			)
		),
		'--hz-color'
	);

	const roleTokens = colorEntries(
		Object.fromEntries(
			Object.entries(color).filter(
				([, v]) => typeof v === 'string' && (v as string).startsWith('var(')
			)
		),
		'--hz-color'
	);

	const darkTokens: ColorEntry[] = Object.entries(color.theme.dark).map(([key, value]) => ({
		key,
		cssVar: `--hz-color-${toKebab(key)}`,
		value
	}));
</script>

<svelte:head>
	<title>Colors — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Colors</h1>
		<p>
			A two-layer color model: a fixed palette (Layer 1) of single-value colors and a small set of
			semantic role tokens (Layer 2) that reference the palette via <code>var()</code>.
		</p>
	</div>

	<section aria-labelledby="palette-heading">
		<h2 id="palette-heading">Palette tokens</h2>
		<p>These tokens ship fixed values. Override them to retheme the entire palette at once.</p>
		<Grid columns={{ sm: 2, md: 3, lg: 4 }} gap="sm">
			{#each paletteTokens as token (token.cssVar)}
				<div class="color-card">
					<div
						class="swatch"
						style="background-color: {token.value}"
						role="img"
						aria-label="{token.value} color swatch"
					></div>
					<div class="color-meta">
						<code class="var-name">{token.cssVar}</code>
						<code class="var-value">{token.value}</code>
					</div>
				</div>
			{/each}
		</Grid>
	</section>

	<section aria-labelledby="roles-heading">
		<h2 id="roles-heading">Semantic role tokens (light)</h2>
		<p>
			These tokens reference the palette via <code>var()</code>. They are the single indirection
			point a theme overrides — not the raw palette values.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Light value</th>
						<th scope="col">Swatch</th>
					</tr>
				</thead>
				<tbody>
					{#each roleTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
							<td>
								<div
									class="swatch swatch-sm"
									style="background-color: {token.value}"
									role="img"
									aria-label="color swatch"
								></div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section aria-labelledby="dark-heading">
		<h2 id="dark-heading">Dark theme overrides</h2>
		<p>
			Only <code>--hz-color-surface</code> and <code>--hz-color-text</code> flip in
			<code>[data-theme="dark"]</code>. All palette tokens and other roles remain unchanged.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Dark value</th>
					</tr>
				</thead>
				<tbody>
					{#each darkTokens as token (token.cssVar)}
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
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-xl, 1.5rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0 0 1rem;
	}

	.color-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.swatch {
		width: 100%;
		height: 4rem;
		border-radius: var(--hz-radius-md, 0.5rem);
		border: 1px solid var(--hz-color-border, #6b7280);
	}

	.swatch-sm {
		width: 2rem;
		height: 1.5rem;
	}

	.color-meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.var-name {
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		word-break: break-all;
	}

	.var-value {
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
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
		vertical-align: middle;
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}
</style>
