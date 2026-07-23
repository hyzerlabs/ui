<script lang="ts">
	import { Stack, Tabs } from '$lib';
	import { typography } from '$lib/tokens';
	import Example from '../../../docs/Example.svelte';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	// Bring-your-own-fonts recipe — a webfont import plus one token override.
	const customFontCode = [
		'/* app.css — after the library sheets */',
		"@import '@fontsource-variable/inter';",
		'',
		':root {',
		"\t--hz-font-family-sans: 'Inter Variable', system-ui, sans-serif;",
		'}'
	].join('\n');

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

	// The serif and mono stacks resolve to system faces that commonly ship
	// only regular and bold (Georgia, Menlo, Consolas…); 500/600 snap to the
	// nearest available weight and render as duplicates of those two. Only
	// sans (system-ui) reliably carries the full range, so the other
	// families demo only the weights that actually render distinctly.
	const weightTabsFor = (family: string) =>
		fontWeights
			.filter((w) => family === 'sans' || w.key === 'normal' || w.key === 'bold')
			.map((w) => ({ id: w.key, label: w.key }));

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

<Stack gap="away">
	<div class="doc-intro">
		<h1>Typography</h1>
		<p class="doc-description">
			Three font families, a six-step type scale, four weights, and three line heights.
		</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="families-heading"
	>
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
					{#if fItem.id !== 'sans'}
						<p class="tab-note">
							Only <code>normal</code> and <code>bold</code> are shown — the system faces this stack
							resolves to ship those two weights, so <code>medium</code> and
							<code>semibold</code> would snap to the nearest available and render as duplicates.
						</p>
					{/if}
					<Tabs items={weightTabsFor(fItem.id)} ariaLabel="Font weight" defaultTab="normal">
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="scale-heading"
	>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="weights-heading"
	>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="line-heights-heading"
	>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="custom-fonts-heading"
	>
		<h2 id="custom-fonts-heading">Using your own fonts</h2>
		<p>
			Every family, size, weight, and line height is a plain CSS custom property — override one
			directly, or set <code>typography</code> in the <code>hyzer</code> config; see
			<a href="/theming/tokens">Theming &rarr; Tokens &amp; Overrides</a>.
		</p>

		<p>Load a webfont and point the family token at it, and every component follows:</p>
		<CodeBlock code={customFontCode} />
	</Stack>
</Stack>

<style>
	p {
		margin: 0;
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

	/* Margin zeroed — always a direct child of a .doc-section Stack
	 * (gap="away", data-density-shift), which now owns the space above it. */
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
