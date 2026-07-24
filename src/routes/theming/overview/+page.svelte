<script lang="ts">
	import { Stack } from '$lib';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	const importStack = [
		'/* Each line is optional — every tier works without the ones below it. */',
		"@import '@hyzer-labs/ui/reset.css';     /* structural reset (@layer hz-reset) */",
		"@import '@hyzer-labs/ui/tokens.css';    /* the --hz-* custom properties */",
		"@import '@hyzer-labs/ui/theme';         /* the reference theme (@layer hz-theme) */",
		"@import '@hyzer-labs/ui/utilities.css'; /* optional: opt-in utility classes (unlayered) */",
		"@import './your-overrides.css';         /* unlayered — always wins */"
	].join('\n');

	const layerCode = [
		'/* Pinned by both reset.css and theme.css, so import order never matters: */',
		'@layer hz-reset, hz-theme;',
		'',
		'/* Your stylesheet is UNLAYERED. Unlayered CSS beats every @layer rule,',
		'   so any selector you write overrides the theme without specificity',
		'   fights — even a bare class: */',
		'.my-quiet-button {',
		'\tbackground: transparent;',
		'}'
	].join('\n');
</script>

<svelte:head>
	<title>Theming Overview — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Theming</h1>
		<p class="doc-description">
			The components are headless: they ship structure, behavior, and accessibility — the library
			makes those choices so you don't have to — and every visual decision is yours to keep,
			override, or replace. Styling arrives in opt-in tiers, each importable on its own.
		</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="tiers-heading"
	>
		<h2 id="tiers-heading">The tiers</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Tier</th>
						<th scope="col">Import</th>
						<th scope="col">What it gives you</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Headless components</td>
						<td><code>@hyzer-labs/ui</code></td>
						<td
							>Structure, behavior, ARIA, keyboard support. Stable <code>hz-*</code> classes and
							<code>data-*</code> hooks; native element defaults, no appearance opinions.</td
						>
					</tr>
					<tr>
						<td>Reset</td>
						<td><code>reset.css</code></td>
						<td>A structural-only reset in <code>@layer hz-reset</code> — no colors, no fonts.</td>
					</tr>
					<tr>
						<td>Tokens</td>
						<td><code>tokens.css</code></td>
						<td
							>The <code>--hz-*</code> custom properties: palette, roles, intents, type, spacing,
							radius, motion. Generated from one schema — see
							<a href="/theming/tokens">Tokens &amp; Overrides</a>.</td
						>
					</tr>
					<tr>
						<td>Reference theme</td>
						<td><code>theme</code></td>
						<td
							>A complete, token-driven look for every component in
							<code>@layer hz-theme</code> — the styled starting point this site runs on.
							Cherry-pick per component via <code>theme/components/*.css</code>.</td
						>
					</tr>
					<tr>
						<td>Utilities</td>
						<td><code>utilities.css</code></td>
						<td
							>Token-derived, single-property helper classes — text-color roles/intents and logical
							margins — for ad-hoc spots. Opt-in: imported like the theme, and free if you don't.
							See <a href="/foundation/utilities">Utilities</a>.</td
						>
					</tr>
					<tr>
						<td>Your overrides</td>
						<td>your CSS / <code>hyzer.config.ts</code></td>
						<td
							>Token overrides in plain CSS, generated sheets via the
							<code>hyzer</code> CLI, or component-level styling on the
							<code>hz-*</code> hooks — see <a href="/theming/examples">Example Themes</a>.</td
						>
					</tr>
				</tbody>
			</table>
		</div>
		<CodeBlock code={importStack} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="layers-heading"
	>
		<h2 id="layers-heading">The cascade-layer contract</h2>
		<p>
			Every reference-theme rule lives in the <code>hz-theme</code> cascade layer, wrapped in
			<code>:where()</code> so it stays at single-class specificity. Your stylesheet is unlayered,
			and unlayered CSS always beats layered CSS — so overriding the theme never requires
			<code>!important</code>, matching the theme's selectors, or specificity arithmetic.
		</p>
		<CodeBlock code={layerCode} />
		<p>
			The <code>class</code> prop on every component is merged <em>after</em> the component's
			<code>hz-*</code> root class, so your class lands on the element ready to win.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="where-heading"
	>
		<h2 id="where-heading">Where to override what</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Goal</th>
						<th scope="col">Mechanism</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Retheme colors, type, spacing, radius everywhere</td>
						<td
							>Override <code>--hz-*</code> tokens — plain CSS or a generated sheet.
							<a href="/theming/tokens">Tokens &amp; Overrides</a>.</td
						>
					</tr>
					<tr>
						<td>Dark mode (or any second mode)</td>
						<td
							>The <code>[data-theme="dark"]</code> hook — override hues at the palette layer and everything
							chains through.</td
						>
					</tr>
					<tr>
						<td>Restyle one component, keep the rest</td>
						<td
							>Unlayered CSS on its <code>hz-*</code> class and <code>data-*</code> hooks, or the
							<code>class</code> prop. <a href="/theming/components">Styling Components</a>.</td
						>
					</tr>
					<tr>
						<td>A different look entirely</td>
						<td
							>Skip the reference theme; style the headless hooks from scratch — the tokens still
							help, but nothing requires them.</td
						>
					</tr>
					<tr>
						<td>Verify a palette still meets WCAG</td>
						<td
							>The exported contrast utilities and the CLI's report —
							<a href="/foundation/contrast">Contrast &amp; Accessibility</a>.</td
						>
					</tr>
				</tbody>
			</table>
		</div>
	</Stack>
</Stack>

<style>
	/* Margins zeroed below — every <p>, CodeBlock, and .token-table-wrapper
	 * is now a direct child of either .doc-intro or a .doc-section Stack
	 * (gap="away", data-density-shift), which owns the space between them. */
	p {
		margin: 0;
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
		vertical-align: top;
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}
</style>
