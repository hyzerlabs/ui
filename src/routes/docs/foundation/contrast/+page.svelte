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
		type LargeContrastLevel,
		CodeBlock
	} from '$lib';
	import type { SelectOption } from '$lib/types';
	import { palette, intent } from '$lib/tokens';
	import { softTints } from '$lib/config';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	// -------------------------------------------------------------------------
	// WCAG 2.x math over the static token metadata — the same contrast
	// utilities the library exports ($lib/utils/contrast). SSR-safe:
	// role/intent indirections are resolved here to concrete hexes per mode —
	// light values on light surfaces, dark companions on dark — including
	// surface-muted's color-mix(). Panels are painted from these resolved
	// hexes (not live tokens) so each panel stays pinned to its mode
	// regardless of the site theme toggle. Raw hues come from the `palette`
	// export (specs/42 R1) — `color` (the role tier) holds indirection
	// strings like `var(--hz-palette-white)`, not hexes.
	// -------------------------------------------------------------------------

	const apiCode = [
		"import { gradeContrast, contrastRatio, mixSrgb } from '@hyzer-labs/ui';",
		"import { palette } from '@hyzer-labs/ui/tokens';",
		'',
		'// Your override for --hz-palette-primary',
		"const brand = '#0f766e';",
		'',
		'gradeContrast(brand, palette.white).aaNormal; // text on surface',
		'gradeContrast(palette.white, brand).aaNormal; // solid button text',
		'',
		'// On surface-muted — the same 6% color-mix the theme derives',
		'contrastRatio(brand, mixSrgb(palette.gray, palette.white, 0.06));'
	].join('\n');

	const paletteTokens = Object.entries(palette)
		.filter(([, v]) => typeof v === 'string' && (v as string).startsWith('#'))
		.map(([key, value]) => ({ key, cssVar: `--hz-palette-${key}`, value: value as string }));

	// The dark-mode companions the palette overrides in dark — the same hues,
	// lightened (black/white have none, so they're absent here). Offered
	// alongside the base palette so a pairing can be checked in either mode.
	const darkPaletteTokens = Object.entries(palette.theme.dark)
		.filter(([, v]) => typeof v === 'string' && (v as string).startsWith('#'))
		.map(([key, value]) => ({ key, value: value as string }));

	/** Resolve an intent target like `var(--hz-palette-gray)` to its palette hex. */
	function intentHex(target: string): string {
		const key = target.match(/--hz-palette-([a-z]+)/)?.[1] ?? 'gray';
		return (palette as Record<string, unknown>)[key] as string;
	}

	/**
	 * What an intent resolves to in dark mode: intents are pure chains, so
	 * the answer is simply the dark palette companion of its target hue
	 * (palette.theme.dark), falling back to the light value for hues the dark
	 * block leaves alone (black/white).
	 */
	function intentDarkHex(target: string): string {
		const paletteKey = target.match(/--hz-palette-([a-z]+)/)?.[1] ?? 'gray';
		return (palette.theme.dark as Record<string, string>)[paletteKey] ?? intentHex(target);
	}

	// Every token the theme paints text with, resolved per mode. text-muted
	// chains through gray, which lightens in dark mode.
	const textTokens = [
		{ key: 'text', light: palette.black, dark: palette.white },
		{ key: 'text-muted', light: palette.gray, dark: palette.theme.dark.gray },
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
		{ key: 'surface-light', label: 'surface · light', mode: 'light' as const, hex: palette.white },
		{
			key: 'surface-muted-light',
			label: 'surface-muted · light',
			mode: 'light' as const,
			hex: mixSrgb(palette.gray, palette.white, 0.06)
		},
		{ key: 'surface-dark', label: 'surface · dark', mode: 'dark' as const, hex: palette.black },
		{
			key: 'surface-muted-dark',
			label: 'surface-muted · dark',
			mode: 'dark' as const,
			// The dark muted surface mixes the DARK gray companion over black.
			hex: mixSrgb(palette.theme.dark.gray, palette.black, 0.25)
		}
	];

	const surfaceTabs = surfaces.map((s) => ({ id: s.key, label: s.label }));
	const surfaceByKey = (key: string) => surfaces.find((s) => s.key === key) ?? surfaces[0];

	// The demo panels are deliberately mode-PINNED (painted from static
	// hexes), but which panel you land on should match the mode you're in —
	// a dark-mode reader shouldn't open onto a wall of white. Mirror the
	// layout's resolution order (R9): an explicit stored choice wins, else
	// the system preference. SSR/prerender renders the light default and
	// hydration reconciles.
	const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('hz-theme') : null;
	const prefersDark = storedTheme
		? storedTheme === 'dark'
		: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

	/** The value a text token resolves to on a given surface's mode. */
	function onSurface(token: { light: string; dark: string }, mode: 'light' | 'dark'): string {
		return mode === 'light' ? token.light : token.dark;
	}

	/** The result pill is painted from the panel's PINNED mode, not the live
	 * site theme — otherwise a dark panel shows a jarring white pill (and a
	 * light panel a black one) whenever the site is toggled the other way. */
	function metaStyle(mode: 'light' | 'dark'): string {
		return mode === 'dark'
			? `background-color: ${palette.black}; color: ${palette.white};`
			: `background-color: ${palette.white}; color: ${palette.black};`;
	}

	const requirements = [
		{ level: 'WCAG AA', normal: '4.5:1', large: '3:1' },
		{ level: 'WCAG AAA', normal: '7:1', large: '4.5:1' },
		{ level: 'Section 508', normal: '4.5:1', large: '3:1' }
	];

	// --- Soft intent surfaces — the Badge/Alert reference-theme recipes -------

	/** Tint fraction → whole-percent display (0.14 * 100 is 14.000…002). */
	const pct = (fraction: number) => Math.round(fraction * 100);

	function softRecipe(c: string, mode: 'light' | 'dark') {
		const surface = mode === 'light' ? palette.white : palette.black;
		const text = mode === 'light' ? palette.black : palette.white;
		const tints = softTints[mode];
		return {
			badgeBg: mixSrgb(c, surface, tints.badgeBg),
			badgeText: mixSrgb(c, text, softTints.badgeText),
			alertBg: mixSrgb(c, surface, tints.alertBg),
			alertTitle: mixSrgb(c, text, softTints.alertTitle),
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
		...darkPaletteTokens.map(
			(t) =>
				[`palette-dark:${t.key}`, { label: `${t.key} · dark`, hex: t.value }] as [
					string,
					{ label: string; hex: string }
				]
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
		['text-muted-dark', { label: 'text-muted · dark', hex: palette.theme.dark.gray }],
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
			group: 'Palette · dark overrides',
			options: darkPaletteTokens.map((t) => ({
				value: `palette-dark:${t.key}`,
				label: `${t.key} · dark · ${t.value}`
			}))
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
				{ value: 'text-muted-dark', label: `text-muted · dark · ${palette.theme.dark.gray}` },
				...surfaces.map((s) => ({ value: s.key, label: `${s.label} · ${s.hex}` }))
			]
		}
	];

	// Seeded from the persisted mode like the demo tabs above: a dark-mode
	// reader starts from the dark primary-on-surface pairing.
	let fg = $state(prefersDark ? 'intent-dark:primary' : 'primary');
	let bg = $state(prefersDark ? 'surface-dark' : 'surface-light');

	const fgHex = $derived(swatchMap.get(fg)?.hex ?? palette.black);
	const bgHex = $derived(swatchMap.get(bg)?.hex ?? palette.white);
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

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			Every ratio on this page is computed live from the
			<a href="/docs/foundation/colors">token metadata</a>, per mode, with the same
			<a href="#api-heading">functions the library ships</a> — so if your theme overrides the palette,
			you can run the identical WCAG check on it.
		{/snippet}
	</DocIntro>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="requirements-heading"
	>
		<h2 id="requirements-heading">Requirements</h2>
		<p>
			WCAG 2.1 grades text contrast by ratio and text size — large text is at least 24px, or 18.66px
			bold. Section 508 incorporates WCAG 2.0 AA, so an AA pass at a given size is also a 508 pass.
		</p>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="checker-heading"
	>
		<h2 id="checker-heading">Pairing checker</h2>
		<p>
			Pick any two tokens — palette or intent roles in either mode, or resolved surface roles — and
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
			<p class="legend-caption">How to read the ratio and grades:</p>
			<dl class="legend">
				<div class="legend-item">
					<dt>Relative luminance</dt>
					<dd>
						Perceived brightness on a 0 (black) to 1 (white) scale — the two values the contrast
						ratio is computed from.
					</dd>
				</div>
				<div class="legend-item">
					<dt>
						<Badge intent="success" size="sm">Pass</Badge>
						<Badge intent="danger" size="sm">Fail</Badge>
					</dt>
					<dd>
						In the table above, each row is graded on its own: <strong>Pass</strong> meets that
						requirement's minimum ratio, <strong>Fail</strong> does not. A pairing can pass AA and still
						fail the stricter AAA on the next row.
					</dd>
				</div>
				<div class="legend-item">
					<dt>
						<Badge intent="success" size="sm">AAA</Badge>
						<Badge intent="success" size="sm">AA</Badge>
						<Badge intent="warning" size="sm">AA Large</Badge>
					</dt>
					<dd>
						In the sections below, a badge names the <em>highest</em> grade a pairing reaches, one
						per text size (16px and 24px):
						<strong>AAA</strong> (at least 7:1 normal, 4.5:1 large), <strong>AA</strong> (4.5:1
						normal, 3:1 large), or <strong>AA Large</strong> (clears 3:1 — large text only). A ratio
						under 3:1 reaches no grade and shows a red <strong>Fail</strong>.
					</dd>
				</div>
			</dl>
		</div>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="text-surfaces-heading"
	>
		<h2 id="text-surfaces-heading">Text on surfaces</h2>
		<p>
			Every token the theme paints text with — the semantic text roles and all seven intents — on
			both surface roles, in both modes, at normal (16px) and large (24px) sizes. Each panel uses
			the values that mode actually resolves: the palette on light surfaces, the dark companions (<code
				>[data-theme="dark"]</code
			>) on dark ones.
		</p>
		<Tabs
			items={surfaceTabs}
			ariaLabel="Background surface"
			defaultTab={prefersDark ? 'surface-dark' : 'surface-light'}
		>
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
								<span class="situ-meta" style={metaStyle(surface.mode)}>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="solid-heading"
	>
		<h2 id="solid-heading">Solid intent backgrounds</h2>
		<p>
			The solid <code>Button</code> and <code>Badge</code> case. The reference theme paints solid
			text with
			<code>--hz-color-surface</code> — white in light mode, black in dark — because the dark companions
			are lighter than the surfaces they sit on.
		</p>
		<Grid columns={{ sm: 1, md: 2, lg: 2 }} gap="sm">
			{#each intents as row (row.key)}
				<div class="intent-tile">
					{#each ['light', 'dark'] as const as mode (mode)}
						{@const bgIntent = mode === 'light' ? row.light : row.dark}
						{@const onColor = mode === 'light' ? palette.white : palette.black}
						{@const ratio = contrastRatio(onColor, bgIntent)}
						<div class="solid-block" style="background-color: {bgIntent};">
							<span class="situ-lines" style="color: {onColor};">
								<span class="situ-normal">{situSentence}</span>
								<span class="situ-large">{situLarge}</span>
							</span>
							<span class="situ-meta" style={metaStyle(mode)}>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="soft-heading"
	>
		<h2 id="soft-heading">Soft intent surfaces (Alert &amp; Badge)</h2>
		<p>
			The reference theme derives these surfaces with <code>color-mix()</code>: backgrounds mix
			{pct(softTints.light.alertBg)}–{pct(softTints.light.badgeBg)}% of the intent color into the
			surface in light mode and {pct(softTints.dark.alertBg)}–{pct(softTints.dark.badgeBg)}% in dark
			(weak tints barely read as color on a dark surface); text mixes
			{pct(softTints.badgeText)}–{pct(softTints.alertTitle)}% toward the text role in both modes.
			Tune the background strength with the <code>--hz-alert-tint</code> and
			<code>--hz-badge-tint</code>
			<a href="/docs/theming/components#hook-props-heading">hooks</a>. Everything below is that
			derivation over the mode's resolved values — proof the tints hold contrast, not only the raw
			hues.
		</p>
		<Tabs
			items={modeTabs}
			ariaLabel="Soft surface mode"
			defaultTab={prefersDark ? 'dark' : 'light'}
		>
			{#snippet panel(mItem)}
				{@const mode = mItem.id as 'light' | 'dark'}
				{@const pageBg = mode === 'light' ? palette.white : palette.black}
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
								<span class="situ-meta" style={metaStyle(mode)}>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="api-heading"
	>
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
		<p>
			For the full override workflow — plain-CSS recipes and the <code>hyzer</code> CLI, whose
			generate step runs this same report over your config — see
			<a href="/docs/theming/tokens">Theming → Tokens &amp; Overrides</a>.
		</p>
	</Stack>

	<p class="a11y-refs">
		References:
		<a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
			>WCAG 2.2: 1.4.3 Contrast (Minimum)</a
		>
		·
		<a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html"
			>WCAG 2.2: 1.4.6 Contrast (Enhanced)</a
		>
		·
		<a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
			>WCAG 2.2: 1.4.11 Non-text Contrast</a
		>
		·
		<a href="https://www.w3.org/TR/wai-aria-1.2/">WAI-ARIA 1.2</a>
		·
		<a href="https://www.w3.org/WAI/ARIA/apg/">ARIA APG</a>
		·
		<a href="https://www.section508.gov/">Section 508</a>
	</p>
</Stack>

<style>
	/* Margin zeroed — every top-level p on this page is a direct child of a
	 * .doc-section Stack (gap="away", data-density-shift), which now owns the
	 * rhythm; nested paragraphs (.checker-preview, .ratio-readout, .tab-note …)
	 * keep their own more-specific overrides below/in docs.css, unaffected. */
	p {
		margin: 0;
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

	.legend-caption {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.legend {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.legend-item {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		flex-wrap: wrap;
	}

	.legend-item dt {
		flex: 0 0 7rem;
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.legend-item dd {
		margin: 0;
		flex: 1;
		min-width: 12rem;
		color: var(--hz-color-text-muted, #6b7280);
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
		/* Background/color are set inline per the panel's PINNED mode (metaStyle)
		 * so the pill never reads as a light box on a dark panel. */
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

	.token-table-wrapper {
		overflow-x: auto;
		margin-top: 1rem;
	}

	/* Direct child of a .doc-section Stack (gap="away", data-density-shift)
	 * already provides this space (requirements/text-surfaces sections); the
	 * nested instance inside .checker below keeps its margin — that flex
	 * block's own gap predates this refactor and isn't a .doc-section child. */
	:global(.doc-section) > .token-table-wrapper {
		margin-top: 0;
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
