<script lang="ts">
	import {
		Stack,
		Cluster,
		Grid,
		Badge,
		Select,
		Tabs,
		contrastRatio,
		relativeLuminance,
		gradeContrast,
		bestLevel,
		bestLevelLarge,
		mixSrgb,
		type ContrastLevel,
		type LargeContrastLevel
	} from '$lib';
	import type { SelectOption } from '$lib/types';
	import { color, intent } from '$lib/tokens';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	// -------------------------------------------------------------------------
	// WCAG 2.x math over the static token metadata — the same contrast
	// utilities the library exports ($lib/utils/contrast). SSR-safe:
	// role/intent indirections are resolved here to concrete hexes per mode —
	// light values on light surfaces, dark companions on dark — including
	// surface-muted's color-mix(). Panels are painted from these resolved
	// hexes (not live tokens) so each panel stays pinned to its mode
	// regardless of the site theme toggle.
	// -------------------------------------------------------------------------

	const apiCode = [
		"import { gradeContrast, contrastRatio, mixSrgb } from '@hyzer-labs/ui';",
		"import { color } from '@hyzer-labs/ui/tokens';",
		'',
		'// Your override for --hz-color-primary',
		"const brand = '#0f766e';",
		'',
		'gradeContrast(brand, color.white).aaNormal; // text on surface',
		'gradeContrast(color.white, brand).aaNormal; // solid button text',
		'',
		'// On surface-muted — the same 6% color-mix the theme derives',
		'contrastRatio(brand, mixSrgb(color.gray, color.white, 0.06));'
	].join('\n');

	const paletteTokens = Object.entries(color)
		.filter(([, v]) => typeof v === 'string' && (v as string).startsWith('#'))
		.map(([key, value]) => ({ key, cssVar: `--hz-color-${key}`, value: value as string }));

	/** Resolve an intent target like `var(--hz-color-gray)` to its palette hex. */
	function intentHex(target: string): string {
		const key = target.match(/--hz-color-([a-z]+)/)?.[1] ?? 'gray';
		return (color as Record<string, unknown>)[key] as string;
	}

	/**
	 * What an intent resolves to in dark mode: intents are pure chains, so
	 * the answer is simply the dark palette companion of its target hue
	 * (color.theme.dark), falling back to the light value for hues the dark
	 * block leaves alone (black/white).
	 */
	function intentDarkHex(target: string): string {
		const paletteKey = target.match(/--hz-color-([a-z]+)/)?.[1] ?? 'gray';
		return (color.theme.dark as Record<string, string>)[paletteKey] ?? intentHex(target);
	}

	// Every token the theme paints text with, resolved per mode. text-muted
	// chains through gray, which lightens in dark mode.
	const textTokens = [
		{ key: 'text', light: color.black, dark: color.white },
		{ key: 'text-muted', light: color.gray, dark: color.theme.dark.gray },
		...Object.entries(intent).map(([k, target]) => ({
			key: `intent-${k}`,
			light: intentHex(target),
			dark: intentDarkHex(target)
		}))
	];

	const intents = Object.entries(intent).map(([key, target]) => ({
		key,
		light: intentHex(target),
		dark: intentDarkHex(target)
	}));

	// The four backgrounds text actually sits on: both surface roles, both modes.
	const surfaces = [
		{ key: 'surface-light', label: 'surface · light', mode: 'light' as const, hex: color.white },
		{
			key: 'surface-muted-light',
			label: 'surface-muted · light',
			mode: 'light' as const,
			hex: mixSrgb(color.gray, color.white, 0.06)
		},
		{ key: 'surface-dark', label: 'surface · dark', mode: 'dark' as const, hex: color.black },
		{
			key: 'surface-muted-dark',
			label: 'surface-muted · dark',
			mode: 'dark' as const,
			// The dark muted surface mixes the DARK gray companion over black.
			hex: mixSrgb(color.theme.dark.gray, color.black, 0.25)
		}
	];

	const surfaceTabs = surfaces.map((s) => ({ id: s.key, label: s.label }));
	const surfaceByKey = (key: string) => surfaces.find((s) => s.key === key) ?? surfaces[0];

	/** The value a text token resolves to on a given surface's mode. */
	function onSurface(token: { light: string; dark: string }, mode: 'light' | 'dark'): string {
		return mode === 'light' ? token.light : token.dark;
	}

	const requirements = [
		{ level: 'WCAG AA', normal: '4.5:1', large: '3:1' },
		{ level: 'WCAG AAA', normal: '7:1', large: '4.5:1' },
		{ level: 'Section 508', normal: '4.5:1', large: '3:1' }
	];

	// --- Soft intent surfaces — the Badge/Alert reference-theme recipes -------

	function softRecipe(c: string, mode: 'light' | 'dark') {
		const surface = mode === 'light' ? color.white : color.black;
		const text = mode === 'light' ? color.black : color.white;
		return {
			badgeBg: mixSrgb(c, surface, 0.14),
			badgeText: mixSrgb(c, text, 0.65),
			alertBg: mixSrgb(c, surface, 0.1),
			alertTitle: mixSrgb(c, text, 0.7),
			alertBody: text
		};
	}

	const modeTabs = [
		{ id: 'light', label: 'Light' },
		{ id: 'dark', label: 'Dark' }
	];

	// --- Pairing checker ------------------------------------------------------

	const swatchMap = new Map<string, { label: string; hex: string }>([
		...paletteTokens.map(
			(t) => [t.key, { label: t.key, hex: t.value }] as [string, { label: string; hex: string }]
		),
		...intents.map(
			(i) =>
				[`intent:${i.key}`, { label: `intent-${i.key}`, hex: i.light }] as [
					string,
					{ label: string; hex: string }
				]
		),
		...intents.map(
			(i) =>
				[`intent-dark:${i.key}`, { label: `intent-${i.key} · dark`, hex: i.dark }] as [
					string,
					{ label: string; hex: string }
				]
		),
		['text-muted-dark', { label: 'text-muted · dark', hex: color.theme.dark.gray }],
		...surfaces.map(
			(s) => [s.key, { label: s.label, hex: s.hex }] as [string, { label: string; hex: string }]
		)
	]);

	const swatchOptions: SelectOption[] = [
		{
			group: 'Palette',
			options: paletteTokens.map((t) => ({ value: t.key, label: `${t.key} · ${t.value}` }))
		},
		{
			group: 'Intent roles · light',
			options: intents.map((i) => ({
				value: `intent:${i.key}`,
				label: `intent-${i.key} · ${i.light}`
			}))
		},
		{
			group: 'Intent roles · dark',
			options: intents.map((i) => ({
				value: `intent-dark:${i.key}`,
				label: `intent-${i.key} · ${i.dark}`
			}))
		},
		{
			group: 'Text & surface roles (resolved)',
			options: [
				{ value: 'text-muted-dark', label: `text-muted · dark · ${color.theme.dark.gray}` },
				...surfaces.map((s) => ({ value: s.key, label: `${s.label} · ${s.hex}` }))
			]
		}
	];

	let fg = $state('primary');
	let bg = $state('surface-light');

	const fgHex = $derived(swatchMap.get(fg)?.hex ?? color.black);
	const bgHex = $derived(swatchMap.get(bg)?.hex ?? color.white);
	const grade = $derived(gradeContrast(fgHex, bgHex));

	const checks = $derived([
		{ label: 'WCAG AA — normal text', min: '4.5:1', pass: grade.aaNormal },
		{ label: 'WCAG AAA — normal text', min: '7:1', pass: grade.aaaNormal },
		{ label: 'WCAG AA — large text', min: '3:1', pass: grade.aaLarge },
		{ label: 'WCAG AAA — large text', min: '4.5:1', pass: grade.aaaLarge },
		{ label: 'Section 508 — normal text', min: '4.5:1', pass: grade.aaNormal },
		{ label: 'Section 508 — large text', min: '3:1', pass: grade.aaLarge }
	]);

	function levelIntent(
		level: ContrastLevel | LargeContrastLevel
	): 'success' | 'warning' | 'danger' {
		return level === 'Fail' ? 'danger' : level === 'AA Large' ? 'warning' : 'success';
	}

	const situSentence = 'A smooth backhand hyzer flares left and drops in the circle.';
	const situLarge = 'Par saves win rounds.';
</script>

<svelte:head>
	<title>Contrast & Accessibility — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Contrast &amp; Accessibility</h1>
		<p>
			WCAG 2.1 grades text contrast by ratio and text size — large text is at least 24px, or 18.66px
			bold. Section 508 incorporates WCAG 2.0 AA, so an AA pass at the given size is also a 508
			pass. Every ratio on this page is computed from the
			<a href="/foundation/colors">token metadata</a>, resolved per mode — light values on light
			surfaces, the dark companions on dark — and the same math runs in CI, so a palette change that
			breaks AA fails the build. The functions themselves
			<a href="#api-heading">ship in the library</a>, so a theme that overrides the palette can run
			the same checks.
		</p>
	</div>

	<section aria-labelledby="requirements-heading">
		<h2 id="requirements-heading">Requirements</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Level</th>
						<th scope="col">Normal text</th>
						<th scope="col">Large text</th>
					</tr>
				</thead>
				<tbody>
					{#each requirements as req (req.level)}
						<tr>
							<td>{req.level}</td>
							<td><code>{req.normal}</code></td>
							<td><code>{req.large}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section aria-labelledby="checker-heading">
		<h2 id="checker-heading">Pairing checker</h2>
		<p>
			Pick any two tokens — palette, intent roles in either mode, or resolved surface roles — and
			read the ratio and pass/fail grades live.
		</p>
		<div class="checker">
			<Cluster gap="sm">
				<Select name="contrast-fg" label="Foreground" options={swatchOptions} bind:value={fg} />
				<Select name="contrast-bg" label="Background" options={swatchOptions} bind:value={bg} />
			</Cluster>
			<div class="checker-preview" style="background-color: {bgHex}; color: {fgHex};">
				<p class="sample-normal">Normal text — a birdie putt from the circle's edge. (16px)</p>
				<p class="sample-large">Large text — par saves win rounds. (24px)</p>
			</div>
			<p class="ratio-readout">
				Contrast ratio <strong>{grade.ratio.toFixed(2)}:1</strong>
				<span class="lum-readout">
					· relative luminance {relativeLuminance(fgHex).toFixed(3)} on {relativeLuminance(
						bgHex
					).toFixed(3)}
				</span>
			</p>
			<div class="token-table-wrapper">
				<table class="token-table">
					<thead>
						<tr>
							<th scope="col">Requirement</th>
							<th scope="col">Minimum</th>
							<th scope="col">Result</th>
						</tr>
					</thead>
					<tbody>
						{#each checks as check (check.label)}
							<tr>
								<td>{check.label}</td>
								<td><code>{check.min}</code></td>
								<td>
									<Badge intent={check.pass ? 'success' : 'danger'} size="sm">
										{check.pass ? 'Pass' : 'Fail'}
									</Badge>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<section aria-labelledby="text-surfaces-heading">
		<h2 id="text-surfaces-heading">Text on surfaces</h2>
		<p>
			Every token the theme paints text with — the semantic text roles and all seven intents — on
			both surface roles, in both modes, at normal (16px) and large (24px) sizes. Each panel uses
			the values that mode actually resolves: the palette on light surfaces, the dark companions (<code
				>[data-theme="dark"]</code
			>) on dark ones.
		</p>
		<Tabs items={surfaceTabs} ariaLabel="Background surface" defaultTab="surface-light">
			{#snippet panel(item)}
				{@const surface = surfaceByKey(item.id)}
				<div class="tab-content">
					<p class="tab-note">
						Rendered on <code>{surface.label}</code> ({surface.hex}) with the {surface.mode}-mode
						token values.
					</p>
					<div class="situ-panel" style="background-color: {surface.hex};">
						{#each textTokens as token (token.key)}
							{@const hex = onSurface(token, surface.mode)}
							{@const ratio = contrastRatio(hex, surface.hex)}
							<div class="situ-row">
								<span class="situ-lines" style="color: {hex};">
									<span class="situ-normal">{situSentence}</span>
									<span class="situ-large">{situLarge}</span>
								</span>
								<span class="situ-meta">
									<code>{token.key}</code>
									<span class="cell-ratio">{ratio.toFixed(2)}</span>
									<Badge intent={levelIntent(bestLevel(ratio))} size="sm"
										>16px {bestLevel(ratio)}</Badge
									>
									<Badge intent={levelIntent(bestLevelLarge(ratio))} size="sm"
										>24px {bestLevelLarge(ratio)}</Badge
									>
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/snippet}
		</Tabs>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token (light / dark)</th>
						{#each surfaces as surface (surface.key)}
							<th scope="col">{surface.label}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each textTokens as token (token.key)}
						<tr>
							<th scope="row" class="matrix-row-head">
								<code>{token.key}</code>
								<span class="row-hexes">
									<span
										class="swatch-dot"
										style="background-color: {token.light}"
										aria-hidden="true"
									></span><code>{token.light}</code>
									·
									<span class="swatch-dot" style="background-color: {token.dark}" aria-hidden="true"
									></span><code>{token.dark}</code>
								</span>
							</th>
							{#each surfaces as surface (surface.key)}
								{@const ratio = contrastRatio(onSurface(token, surface.mode), surface.hex)}
								<td>
									<span class="cell-ratio">{ratio.toFixed(2)}</span>
									<Badge intent={levelIntent(bestLevel(ratio))} size="sm">{bestLevel(ratio)}</Badge>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section aria-labelledby="solid-heading">
		<h2 id="solid-heading">Solid intent backgrounds</h2>
		<p>
			The solid Button and Badge case. The reference theme paints solid text with
			<code>--hz-color-surface</code> — white in light mode, black in dark — because the dark companions
			are lighter than the surfaces they sit on.
		</p>
		<Grid columns={{ sm: 1, md: 2, lg: 2 }} gap="sm">
			{#each intents as row (row.key)}
				<div class="intent-tile">
					{#each ['light', 'dark'] as const as mode (mode)}
						{@const bgIntent = mode === 'light' ? row.light : row.dark}
						{@const onColor = mode === 'light' ? color.white : color.black}
						{@const ratio = contrastRatio(onColor, bgIntent)}
						<div class="solid-block" style="background-color: {bgIntent};">
							<span class="situ-lines" style="color: {onColor};">
								<span class="situ-normal">{situSentence}</span>
								<span class="situ-large">{situLarge}</span>
							</span>
							<span class="situ-meta">
								<code>{row.key}</code>
								{mode}
								<span class="cell-ratio">{ratio.toFixed(2)}</span>
								<Badge intent={levelIntent(bestLevel(ratio))} size="sm"
									>16px {bestLevel(ratio)}</Badge
								>
								<Badge intent={levelIntent(bestLevelLarge(ratio))} size="sm"
									>24px {bestLevelLarge(ratio)}</Badge
								>
							</span>
						</div>
					{/each}
				</div>
			{/each}
		</Grid>
	</section>

	<section aria-labelledby="soft-heading">
		<h2 id="soft-heading">Soft intent surfaces (Alert &amp; Badge)</h2>
		<p>
			The tinted recipes the reference theme derives with <code>color-mix()</code>: soft Badge
			paints its background at 14% intent over surface and its text at 65% intent toward the text
			role; Alert uses 10% for the banner and 70% for the title, with body text on the plain text
			role. The same derivation runs here over the mode's resolved values — proof the tints hold
			contrast, not just the raw hues.
		</p>
		<Tabs items={modeTabs} ariaLabel="Soft surface mode" defaultTab="light">
			{#snippet panel(mItem)}
				{@const mode = mItem.id as 'light' | 'dark'}
				{@const pageBg = mode === 'light' ? color.white : color.black}
				<div class="tab-content">
					<div class="situ-panel" style="background-color: {pageBg};">
						{#each intents as row (row.key)}
							{@const c = mode === 'light' ? row.light : row.dark}
							{@const soft = softRecipe(c, mode)}
							{@const badgeRatio = contrastRatio(soft.badgeText, soft.badgeBg)}
							{@const titleRatio = contrastRatio(soft.alertTitle, soft.alertBg)}
							{@const bodyRatio = contrastRatio(soft.alertBody, soft.alertBg)}
							<div class="soft-row">
								<span
									class="soft-chip"
									style="background-color: {soft.badgeBg}; color: {soft.badgeText};"
								>
									{row.key}
								</span>
								<div
									class="soft-alert"
									style="background-color: {soft.alertBg}; border-color: {c};"
								>
									<span class="soft-alert-title" style="color: {soft.alertTitle};"
										>Course update</span
									>
									<span class="soft-alert-body" style="color: {soft.alertBody};"
										>{situSentence}</span
									>
								</div>
								<span class="situ-meta">
									<span class="cell-ratio">chip {badgeRatio.toFixed(2)}</span>
									<Badge intent={levelIntent(bestLevel(badgeRatio))} size="sm"
										>{bestLevel(badgeRatio)}</Badge
									>
									<span class="cell-ratio">title {titleRatio.toFixed(2)}</span>
									<Badge intent={levelIntent(bestLevel(titleRatio))} size="sm"
										>{bestLevel(titleRatio)}</Badge
									>
									<span class="cell-ratio">body {bodyRatio.toFixed(2)}</span>
									<Badge intent={levelIntent(bestLevel(bodyRatio))} size="sm"
										>{bestLevel(bodyRatio)}</Badge
									>
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/snippet}
		</Tabs>
	</section>

	<section aria-labelledby="api-heading">
		<h2 id="api-heading">Check your own palette</h2>
		<p>
			The math behind this page is part of the library — <code>hexToRgb</code>,
			<code>rgbToHex</code>, <code>mixSrgb</code>, <code>relativeLuminance</code>,
			<code>contrastRatio</code>, <code>gradeContrast</code>, <code>bestLevel</code>, and
			<code>bestLevelLarge</code>, exported from the package root and
			<code>@hyzer-labs/ui/utils</code>. Pure functions over hex strings (no DOM, SSR-safe), with
			the token metadata importable from <code>@hyzer-labs/ui/tokens</code>. If your theme overrides
			the palette, assert your pairings in a unit test the same way this library does:
		</p>
		<CodeBlock code={apiCode} />
	</section>

	<section aria-labelledby="resources-heading">
		<h2 id="resources-heading">Resources</h2>
		<ul class="resource-list">
			<li>
				<a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
					>WCAG 2.2 — 1.4.3 Contrast (Minimum)</a
				>
				— the AA text-contrast requirement this page grades against.
			</li>
			<li>
				<a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html"
					>WCAG 2.2 — 1.4.6 Contrast (Enhanced)</a
				>
				— the AAA thresholds.
			</li>
			<li>
				<a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
					>WCAG 2.2 — 1.4.11 Non-text Contrast</a
				>
				— the 3:1 floor for UI component boundaries (borders, focus rings).
			</li>
			<li>
				<a href="https://www.w3.org/TR/wai-aria-1.2/">WAI-ARIA 1.2</a> — roles, states, and properties
				the components implement.
			</li>
			<li>
				<a href="https://www.w3.org/WAI/ARIA/apg/">WAI-ARIA Authoring Practices Guide (APG)</a> — the
				interaction patterns; each component page links its pattern from the accessibility note.
			</li>
			<li>
				<a href="https://www.section508.gov/">Section 508</a> — the U.S. standard; incorporates WCAG 2.0
				AA.
			</li>
		</ul>
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0 0 1rem;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.checker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.checker-preview {
		padding: 1rem 1.25rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.checker-preview p {
		margin: 0;
	}

	.sample-normal {
		font-size: 1rem;
	}

	.sample-large {
		font-size: 1.5rem;
	}

	.ratio-readout {
		margin: 0;
	}

	.lum-readout {
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	/* In-situ demos — real text painted on the real background. The meta pill
	 * keeps its own surface so it stays readable over any painted color. */
	.situ-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.situ-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.situ-lines {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 12rem;
		flex: 1;
	}

	.situ-normal {
		font-size: 1rem;
	}

	.situ-large {
		font-size: 1.5rem;
		line-height: var(--hz-line-height-tight, 1.2);
	}

	.situ-meta {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-self: center;
		width: fit-content;
		padding: 0.125rem 0.5rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
		background-color: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #000);
		border: 1px solid var(--hz-color-border, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.intent-tile {
		display: flex;
		flex-direction: column;
		border-radius: var(--hz-radius-md, 0.5rem);
		border: 1px solid var(--hz-color-border, #6b7280);
		overflow: hidden;
	}

	.solid-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
	}

	/* Soft-recipe rows: a badge-shaped chip + an alert-shaped strip. */
	.soft-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.soft-chip {
		padding: 0.125rem 0.5rem;
		border-radius: var(--hz-radius-full, 9999px);
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-medium, 500);
		white-space: nowrap;
	}

	.soft-alert {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 14rem;
		padding: 0.5rem 0.75rem;
		border-inline-start: 3px solid;
		border-radius: var(--hz-radius-md, 0.5rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.soft-alert-title {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.matrix-row-head {
		white-space: nowrap;
	}

	.row-hexes {
		display: block;
		font-weight: var(--hz-font-weight-normal, 400);
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.swatch-dot {
		display: inline-block;
		width: 0.875rem;
		height: 0.875rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		vertical-align: -0.125em;
		margin-right: 0.25rem;
	}

	.cell-ratio {
		display: inline-block;
		min-width: 3.25rem;
		font-variant-numeric: tabular-nums;
	}

	.resource-list {
		margin: 0;
		padding-inline-start: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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
		vertical-align: middle;
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}
</style>
