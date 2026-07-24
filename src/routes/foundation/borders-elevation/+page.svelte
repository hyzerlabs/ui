<script lang="ts">
	import { Stack, Grid, Alert } from '$lib';
	import { radius, border, shadow, zIndex } from '$lib/tokens';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	// The dark-mode demo treatment, spelled out as copyable consumer CSS —
	// the cards above run exactly this (lift + soft halo, token shadow
	// kept in the stack).
	const darkElevationCode = [
		'/* Dark mode: convey depth by lifting the surface and adding a',
		'   soft halo — the token shadow stays as a secondary cue. */',
		"[data-theme='dark'] .card {",
		'\tbackground: color-mix(in srgb, var(--hz-intent-neutral) 14%, var(--hz-color-surface));',
		'\tborder: 1px solid color-mix(in srgb, var(--hz-intent-neutral) 30%, transparent);',
		'\tbox-shadow:',
		'\t\tvar(--hz-shadow-md),',
		'\t\t0 0 30px rgb(255 255 255 / 17%);',
		'}'
	].join('\n');

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
	<title>Borders & Elevation — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Borders &amp; Elevation</h1>
		<p class="doc-description">Border radius, border width, box shadows, and z-index scale.</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="radius-heading"
	>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="border-heading"
	>
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
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="shadow-heading"
	>
		<h2 id="shadow-heading">Shadows</h2>
		<Alert
			intent="warning"
			title="Never let elevation carry meaning by itself"
			headingLevel={3}
			class="shadow-alert"
		>
			"The elevated one is selected" is invisible to anyone who can't perceive the shadow — pair
			elevation with a state the theme also announces (<code>aria-selected</code>, a border, an
			icon).
		</Alert>
		<Grid columns={{ sm: 1, md: 3 }} gap="lg">
			{#each shadowTokens as token, i (token.cssVar)}
				<!-- The shadow rides a var (not inline box-shadow) so the dark rule
				     below can compose with it. --_lift/--_glow-* drive the dark
				     treatment: surface lightening per level plus a soft halo, with
				     the token shadow kept as a secondary cue — the hybrid the user
				     picked over pure-glow (2026-07-22). -->
				<div
					class="shadow-card"
					style="--_shadow: {token.value}; --_lift: {8 + i * 6}; --_glow-r: {16 +
						i * 14}px; --_glow-a: {10 + i * 7}%"
				>
					<code class="token-name">{token.cssVar}</code>
				</div>
			{/each}
		</Grid>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each shadowTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="tab-note">
			Token values are identical in both modes — what changes under the dark toggle is the demo
			treatment above: shadows lose contrast over dark surfaces, so the cards lift their surface and
			gain a soft halo instead (see Accessibility below). The treatment as consumer CSS:
		</p>
		<CodeBlock code={darkElevationCode} />
	</Stack>

	<Stack as="section" gap="away" data-density-shift class="doc-section" aria-labelledby="z-heading">
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
		<p class="override-note">
			Override radius, border width, shadow, or z-index tokens with a plain CSS custom property, or
			set <code>radius</code>, <code>border</code>, <code>shadow</code>, and <code>zIndex</code> in
			the <code>hyzer</code> config; see
			<a href="/theming/tokens">Theming &rarr; Tokens &amp; Overrides</a>.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="a11y-heading"
	>
		<h2 id="a11y-heading">Accessibility</h2>
		<p>
			Elevation communicates stacking: what floats above what. Reach for it on genuinely layered
			surfaces — dropdowns, dialogs, sticky headers, cards over a page — and keep the scale's order
			honest: a modal casts more than a card.
		</p>
		<ul>
			<li>
				A shadow is decoration, never a boundary. Low-opacity shadows fail the 3:1 non-text contrast
				minimum (WCAG 1.4.11), so anything interactive still needs a border, a background change, or
				spacing to mark its edge — and forced-colors mode removes shadows entirely.
			</li>
			<li>
				Over dark surfaces black shadows lose contrast — dark UIs convey depth by lightening the
				elevated surface, optionally with a soft halo (the shadow cards above do both under the dark
				toggle, keeping the token shadow as a secondary cue). A glow alone is a weak boundary — the
				card interior matches the page — and a brand-tinted glow collides with the focus ring's
				color language, so keep halos neutral and subordinate to the surface change. The tokens stay
				identical in both modes; the treatment is the theme's call.
			</li>
			<li>
				Stacking is visual only — <code>z-index</code> never reorders the DOM, so reading and focus order
				are untouched by elevation. The tiers still carry focus consequences: a bar pinned on the sticky
				tier can cover a focused element that scrolls beneath it (WCAG 2.4.11 — keep pinned bars short),
				and layers that appear on hover or focus (the dropdown and popover tiers) must be dismissible,
				hoverable, and persistent per WCAG 1.4.13.
			</li>
		</ul>
		<p class="a11y-refs">
			References:
			<a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
				>WCAG 1.4.11 Non-text Contrast</a
			>
			·
			<a href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html"
				>WCAG 1.4.1 Use of Color</a
			>
			·
			<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors"
				>MDN: forced-colors</a
			>
			·
			<a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html"
				>WCAG 2.4.11 Focus Not Obscured</a
			>
			·
			<a href="https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html"
				>WCAG 1.4.13 Content on Hover or Focus</a
			>
		</p>
	</Stack>
</Stack>

<style>
	/* Margin zeroed — every top-level p on this page (including the former
	 * .override-note) is a direct child of a .doc-section Stack (gap="away",
	 * data-density-shift), which now owns the rhythm. */
	p {
		margin: 0;
	}

	/* Breathing room between the alert and the shadow cards — the lg card's
	   dark-mode halo reaches ~2.5rem, so anything closer reads as the glow
	   bleeding into the alert. The section Stack's own gap="away" already
	   contributes 2rem here; this tops it up to the required 2.5rem instead
	   of stacking a full 2.5rem on top of it. */
	:global(.shadow-alert) {
		margin-bottom: 0.5rem;
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
		background-color: var(--hz-intent-primary, #2563eb);
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
		box-shadow: var(--_shadow);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Dark-mode elevation, hybrid treatment: the black shadows lose
	   contrast over a dark page, so each card lifts its surface by its
	   level (--_lift), gains a faint edge, and adds a soft white halo
	   that grows with the level (--_glow-*) — the token shadow stays in
	   the stack as a secondary cue. */
	:global([data-theme='dark']) .shadow-card {
		background: color-mix(
			in srgb,
			var(--hz-intent-neutral, #9ca3af) calc(var(--_lift, 8) * 1%),
			var(--hz-color-surface, #000)
		);
		border: 1px solid color-mix(in srgb, var(--hz-intent-neutral, #9ca3af) 30%, transparent);
		box-shadow:
			var(--_shadow),
			0 0 var(--_glow-r, 12px) rgb(255 255 255 / var(--_glow-a, 8%));
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
