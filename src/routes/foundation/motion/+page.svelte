<script lang="ts">
	import { Stack } from '$lib';
	import { motion } from '$lib/tokens';

	// R7 — derive from token metadata
	const durationTokens = Object.entries(motion.duration).map(([key, value]) => ({
		key,
		cssVar: `--hz-duration-${key}`,
		value
	}));

	const easeTokens = Object.entries(motion.ease).map(([key, value]) => ({
		key,
		cssVar: `--hz-ease-${key}`,
		value
	}));

	// Demo state — one shared toggle animates every swatch so the timing
	// differences are visible side by side.
	let animated = $state(false);
</script>

<svelte:head>
	<title>Motion — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Motion</h1>
		<p>
			Duration and easing tokens for transitions and animations. Consumers are responsible for
			honoring <code>prefers-reduced-motion</code>; the reference theme collapses its own
			transitions automatically.
		</p>
	</div>

	<section aria-labelledby="duration-heading">
		<h2 id="duration-heading">Duration tokens</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each durationTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section aria-labelledby="ease-heading">
		<h2 id="ease-heading">Easing tokens</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each easeTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section aria-labelledby="demo-heading">
		<h2 id="demo-heading">Live demo</h2>
		<p>Each bar animates with a different duration token (standard easing).</p>
		<button type="button" class="demo-trigger" onclick={() => (animated = !animated)}>
			{animated ? 'Reset' : 'Animate'}
		</button>
		<Stack gap="sm">
			{#each durationTokens as token (token.cssVar)}
				<div class="demo-row">
					<code class="token-name">{token.cssVar}</code>
					<div class="demo-track">
						<div
							class="demo-dot"
							class:demo-dot-moved={animated}
							style="transition-duration: var({token.cssVar}, {token.value})"
						></div>
					</div>
				</div>
			{/each}
		</Stack>
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

	.demo-trigger {
		margin-bottom: 1rem;
		padding: 0.375rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.demo-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.token-name {
		min-width: 12rem;
	}

	.demo-track {
		flex: 1;
		min-width: 8rem;
		padding: 0.25rem;
		border-radius: var(--hz-radius-full, 9999px);
		background-color: color-mix(in srgb, var(--hz-color-gray, #6b7280) 12%, transparent);
		overflow: hidden;
	}

	.demo-dot {
		width: 1rem;
		height: 1rem;
		border-radius: var(--hz-radius-full, 9999px);
		background-color: var(--hz-color-primary, #2563eb);
		transition-property: transform;
		transition-timing-function: var(--hz-ease-standard, ease);
	}

	.demo-dot-moved {
		transform: translateX(calc(100% + min(14rem, 40vw)));
	}

	@media (prefers-reduced-motion: reduce) {
		.demo-dot {
			transition-duration: 0.01ms !important;
		}
	}
</style>
