<script lang="ts">
	import { Stack, Tabs } from '$lib';
	import { typography } from '$lib/tokens';
	import Example from '../../../docs/Example.svelte';

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

	const lineHeights = Object.entries(typography.lineHeight).map(([key, value]) => ({
		key,
		cssVar: `--hz-line-height-${key}`,
		value
	}));

	const familyLabels: Record<string, string> = {
		sans: 'Sans',
		serif: 'Serif',
		mono: 'Mono'
	};

	const familyNotes: Record<string, string> = {
		sans: 'The default UI face — the reference theme sets it on the page, so every component inherits it. A system stack; no webfont ships.',
		serif:
			'An editorial face for long-form prose and display moments. No component references it by default — opt in per element.',
		mono: 'Code and tabular data — docs code blocks and readouts resolve through it.'
	};

	const familyTabs = fontFamilies.map((f) => ({ id: f.key, label: familyLabels[f.key] ?? f.key }));
	const weightTabs = fontWeights.map((w) => ({ id: w.key, label: w.key }));

	const familyValue = (key: string) => fontFamilies.find((f) => f.key === key)?.value ?? 'inherit';
	const weightValue = (key: string) => fontWeights.find((w) => w.key === key)?.value ?? '400';

	function familyCode(family: string, weight: string): string {
		return [
			'.round-recap {',
			`\tfont-family: var(--hz-font-family-${family});`,
			`\tfont-weight: var(--hz-font-weight-${weight});`,
			'}'
		].join('\n');
	}

	const specimen = 'The quick brown fox jumps over the lazy dog';

	const lineHeightSample =
		'Wind pushed the drive wide on seventeen, but a smooth forehand upshot and a confident putt saved par from the rough.';
</script>

<svelte:head>
	<title>Typography — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Typography</h1>
		<p>Three font families, a six-step type scale, four weights, and three line heights.</p>
	</div>

	<section aria-labelledby="families-heading">
		<h2 id="families-heading">Font families</h2>
		<p>
			Each family is a system stack — nothing is downloaded. Pick a family and a weight to see the
			full type scale rendered in it.
		</p>
		<Tabs items={familyTabs} ariaLabel="Font family" defaultTab="sans">
			{#snippet panel(fItem)}
				<div class="tab-content">
					<p class="tab-note">
						<code>--hz-font-family-{fItem.id}</code> — {familyNotes[fItem.id]}
					</p>
					<Tabs items={weightTabs} ariaLabel="Font weight" defaultTab="normal">
						{#snippet panel(wItem)}
							<div class="inner-tab">
								<Example code={familyCode(fItem.id, wItem.id)}>
									<div class="specimen-list">
										{#each fontSizes as size (size.cssVar)}
											<div class="specimen-row">
												<code class="specimen-label">{size.key} · {size.value}</code>
												<span
													class="specimen-text"
													style="font-family: {familyValue(fItem.id)}; font-weight: {weightValue(
														wItem.id
													)}; font-size: {size.value};"
												>
													{specimen}
												</span>
											</div>
										{/each}
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				</div>
			{/snippet}
		</Tabs>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Stack</th>
					</tr>
				</thead>
				<tbody>
					{#each fontFamilies as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

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

	<section aria-labelledby="line-heights-heading">
		<h2 id="line-heights-heading">Line heights</h2>
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
					{#each lineHeights as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
							<td>
								<p class="line-height-sample" style="line-height: {token.value};">
									{lineHeightSample}
								</p>
							</td>
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

	section > p {
		margin-bottom: 1rem;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.specimen-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.specimen-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.specimen-row:last-child {
		padding-bottom: 0;
		border-bottom: none;
	}

	.specimen-label {
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.specimen-text {
		line-height: var(--hz-line-height-tight, 1.2);
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
		margin-top: 1rem;
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
		vertical-align: top;
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.line-height-sample {
		max-width: 28rem;
		font-size: var(--hz-font-size-base, 1rem);
	}
</style>
