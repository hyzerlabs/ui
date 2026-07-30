<script lang="ts">
	import { Stack, Select, Alert, Button, CodeBlock } from '$lib';
	import { typography } from '$lib/tokens';
	import IconInfo from '$lib/icons/generated/info.svelte';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	// Bring-your-own-fonts recipe — a webfont import plus one token override.
	const customFontCode = [
		'/* app.css, after the library sheets */',
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
		sans: 'The default UI face. The reference theme sets it on the page, so every component inherits it. A system stack; no webfont ships.',
		serif:
			'An editorial face for long-form prose and display moments. No component references it by default, so opt in per element.',
		mono: 'Code and tabular data. Docs code blocks and readouts resolve through it.'
	};

	const familyOptions = fontFamilies.map((f) => ({
		value: f.key,
		label: familyLabels[f.key] ?? f.key
	}));

	// Live demo state: pick a family + weight and the specimen re-renders in place.
	let family = $state('sans');
	let weight = $state('normal');

	// The serif and mono stacks resolve to system faces that commonly ship only
	// regular and bold (Georgia, Menlo, Consolas…); 500/600 would snap to the
	// nearest available and render as duplicates. Only sans (system-ui) reliably
	// carries the full range, so medium/semibold are disabled for the others.
	const limitedFamily = $derived(family !== 'sans');
	const weightOptions = $derived(
		fontWeights.map((w) => ({
			value: w.key,
			label: `${w.key} · ${w.value}`,
			disabled: limitedFamily && w.key !== 'normal' && w.key !== 'bold'
		}))
	);

	// Switching to a limited family while a non-shipping weight is selected snaps
	// to bold, so the specimen never silently renders a duplicate weight.
	$effect(() => {
		if (limitedFamily && weight !== 'normal' && weight !== 'bold') weight = 'bold';
	});

	const familyValue = (key: string) => fontFamilies.find((f) => f.key === key)?.value ?? 'inherit';
	const weightValue = (key: string) => fontWeights.find((w) => w.key === key)?.value ?? '400';

	// Example system faces per family — these match each stack in the table
	// above, so the note never lists a serif/mono mix.
	const familyExampleFaces: Record<string, string> = {
		serif: 'Georgia, Times New Roman',
		mono: 'Menlo, Consolas'
	};

	// Per-row copy: the exact CSS for the current family + weight at that row's size.
	let copiedKey = $state<string | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	function rowCss(sizeKey: string): string {
		return [
			`font-family: var(--hz-font-family-${family});`,
			`font-weight: var(--hz-font-weight-${weight});`,
			`font-size: var(--hz-font-size-${sizeKey});`
		].join('\n');
	}

	async function copyRow(sizeKey: string) {
		try {
			await navigator.clipboard.writeText(rowCss(sizeKey));
			copiedKey = sizeKey;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copiedKey = null), 2000);
		} catch {
			// Clipboard unavailable — no-op.
		}
	}

	const specimen = 'The quick brown fox jumps over the lazy dog';

	const lineHeightSample =
		'Wind pushed the drive wide on seventeen, but a smooth forehand upshot and a confident putt saved par from the rough.';
</script>

<svelte:head>
	<title>Typography — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro />

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="families-heading"
	>
		<h2 id="families-heading">Font families</h2>
		<p>
			Each family is a system stack, so nothing is downloaded. Pick a family and weight and the full
			type scale re-renders below in place.
		</p>
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
		<div class="type-demo">
			<div class="type-controls">
				<Select name="type-family" label="Family" options={familyOptions} bind:value={family} />
				<Select name="type-weight" label="Weight" options={weightOptions} bind:value={weight} />
			</div>
			{#if limitedFamily}
				<Alert intent="info" title="Only normal and bold ship for this family" headingLevel={3}>
					{#snippet icon()}<IconInfo />{/snippet}
					The <code>{familyLabels[family]}</code> stack resolves to system faces that carry only
					<code>normal</code> and <code>bold</code> ({familyExampleFaces[family]}…), so
					<code>medium</code> and <code>semibold</code> are disabled here: they would snap to the nearest
					available weight and render as duplicates.
				</Alert>
			{/if}
			<p class="type-family-note">
				<code>--hz-font-family-{family}</code>: {familyNotes[family]}
			</p>
			<div class="specimen-list">
				{#each fontSizes as size (size.cssVar)}
					<div class="specimen-row">
						<div class="specimen-head">
							<code class="specimen-label">{size.key} · {size.value}</code>
							<Button
								variant="outline"
								intent="neutral"
								size="sm"
								onclick={() => copyRow(size.key)}
							>
								{copiedKey === size.key ? 'Copied' : 'Copy CSS'}
							</Button>
						</div>
						<span
							class="specimen-text"
							style="font-family: {familyValue(family)}; font-weight: {weightValue(
								weight
							)}; font-size: {size.value};"
						>
							{specimen}
						</span>
					</div>
				{/each}
			</div>
			<span class="sr-only" aria-live="polite">{copiedKey ? 'Copied styles to clipboard' : ''}</span
			>
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
			Every family, size, weight, and line height is a plain CSS custom property. Override one
			directly, or set <code>typography</code> in the <code>hyzer</code> config; see
			<a href="/docs/theming/tokens">Theming &rarr; Tokens &amp; Overrides</a>.
		</p>

		<p>Load a webfont, point the family token at it, and every component follows:</p>
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

	.type-demo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.type-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 1.5rem;
		align-items: end;
	}

	.type-controls > :global(*) {
		flex: 1 1 10rem;
	}

	.type-family-note {
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.specimen-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
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
