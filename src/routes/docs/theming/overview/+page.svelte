<script lang="ts">
	import { Stack, CodeBlock } from '$lib';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const importStack = [
		'/* Each line is optional. Every tier works without the ones below it. */',
		"@import '@hyzer-labs/ui/reset.css';     /* structural reset (@layer hz-reset) */",
		"@import '@hyzer-labs/ui/tokens.css';    /* the --hz-* custom properties */",
		"@import '@hyzer-labs/ui/theme';         /* the reference theme (@layer hz-theme) */",
		"@import '@hyzer-labs/ui/utilities.css'; /* opt-in utility classes (unlayered) */",
		"@import './your-overrides.css';         /* unlayered: always wins */"
	].join('\n');

	const layerCode = [
		'/* Pinned by both reset.css and theme.css, so import order never matters: */',
		'@layer hz-reset, hz-theme;',
		'',
		'/* Your stylesheet is UNLAYERED. Unlayered CSS beats every @layer rule.',
		'   So any selector you write overrides the theme with no specificity',
		'   fight, even a bare class: */',
		'.my-quiet-button {',
		'\tbackground: transparent;',
		'}'
	].join('\n');
</script>

<svelte:head>
	<title>Theming Overview — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro title="Theming" />

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
							>Structure, behavior, ARIA, and keyboard support. Stable <code>hz-*</code> classes and
							<code>data-*</code> hooks, plus native element defaults. No appearance opinions.</td
						>
					</tr>
					<tr>
						<td>Reset</td>
						<td><code>reset.css</code></td>
						<td>A structural-only reset in <code>@layer hz-reset</code>. No colors, no fonts.</td>
					</tr>
					<tr>
						<td>Tokens</td>
						<td><code>tokens.css</code></td>
						<td
							>The <code>--hz-*</code> custom properties: palette, roles, intents, type, spacing,
							radius, motion. They are generated from one schema. See
							<a href="/docs/theming/tokens">Tokens &amp; Overrides</a>.</td
						>
					</tr>
					<tr>
						<td>Reference theme</td>
						<td><code>theme</code></td>
						<td
							>A full, token-driven look for every component, in
							<code>@layer hz-theme</code>. It is the styled starting point this site runs on. You
							can take single components from it via <code>theme/components/*.css</code>.</td
						>
					</tr>
					<tr>
						<td>Utilities</td>
						<td><code>utilities.css</code></td>
						<td
							>Single-property helper classes built from tokens: text-color roles and intents, plus
							logical margins. Use them for one-off spots. They are opt-in, imported like the theme,
							and cost you nothing if you skip them. See
							<a href="/docs/foundation/utilities">Utilities</a>.</td
						>
					</tr>
					<tr>
						<td>Your overrides</td>
						<td>your CSS / <code>hyzer.config.ts</code></td>
						<td
							>Token overrides in plain CSS, generated sheets from the
							<code>hyzer</code> CLI, or component-level styling on the
							<code>hz-*</code> hooks. See <a href="/docs/theming/examples">Example Themes</a>.</td
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
		<h2 id="layers-heading">How the cascade layers work</h2>
		<p>
			Every reference-theme rule lives in the <code>hz-theme</code> cascade layer. Each rule is
			wrapped in <code>:where()</code>, so it stays at single-class specificity. Your stylesheet is
			unlayered, and unlayered CSS always beats layered CSS. You will never need
			<code>!important</code>, a copy of the theme's selector, or specificity math to override it.
		</p>
		<CodeBlock code={layerCode} />
		<p>
			Every component also takes a <code>class</code> prop, merged onto the same element as its
			<code>hz-*</code> root class. Class order in the attribute has no effect on the cascade. Your rule
			wins because your stylesheet is unlayered and the theme is not.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="elements-heading"
	>
		<h2 id="elements-heading">What the theme paints before you write a class</h2>
		<p>
			Importing the reference theme styles a handful of bare elements, with no class of yours
			involved. That is the whole list:
		</p>
		<ul class="note-list">
			<li>
				<code>body</code> takes the <code>surface</code> and <code>text</code> roles, the sans font stack,
				and the base line height.
			</li>
			<li>
				<code>:focus-visible</code> gets a two-pixel <code>primary</code> outline at a two-pixel offset.
			</li>
			<li>
				A bare <code>&lt;a&gt;</code> takes <code>primary</code>, and <code>:visited</code> takes
				<code>secondary</code>. Browser blue and purple fail on a dark surface. That is why this
				rule lives in the theme rather than the reset.
			</li>
			<li>
				<code>&lt;kbd&gt;</code> renders as a key: mono font, muted text on the muted surface, a
				thin border, and a small radius. Press <kbd>Escape</kbd> to see one.
			</li>
			<li>
				<code>.sr-only</code> hides content visually while leaving it for screen readers. Components emit
				this class, so the theme has to ship the rule.
			</li>
		</ul>
		<p>
			Each of these except <code>.sr-only</code> is wrapped in <code>:where()</code>, so it sits at
			zero specificity. Any class of yours wins, and any element you style yourself is untouched.
			<code>.sr-only</code> is unlayered on purpose, so a consumer layer that reorders the cascade cannot
			accidentally reveal hidden text.
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
							>Override <code>--hz-*</code> tokens in plain CSS or a generated sheet. See
							<a href="/docs/theming/tokens">Tokens &amp; Overrides</a>.</td
						>
					</tr>
					<tr>
						<td>Dark mode, or any named theme</td>
						<td
							>Use the <code>data-theme</code> hook. Override hues at the palette layer and
							everything chains through. Dark is one named theme, and you can define as many as you
							like. The attribute works on any element, not just <code>&lt;html&gt;</code>. See
							<a href="/docs/theming/sections">Section themes</a>.</td
						>
					</tr>
					<tr>
						<td>Restyle one component, keep the rest</td>
						<td
							>Write unlayered CSS against its <code>hz-*</code> class and <code>data-*</code>
							hooks, or use the
							<code>class</code> prop. See
							<a href="/docs/theming/components">Styling Components</a>.</td
						>
					</tr>
					<tr>
						<td>A different look entirely</td>
						<td
							>Skip the reference theme and style the headless hooks from scratch. The tokens still
							help, but nothing requires them.</td
						>
					</tr>
					<tr>
						<td>Verify a palette still meets WCAG</td>
						<td
							>Use the exported contrast utilities and the CLI's report. See
							<a href="/docs/foundation/contrast">Contrast &amp; Accessibility</a>.</td
						>
					</tr>
				</tbody>
			</table>
		</div>
		<p>
			Where a rule lives decides whether it needs <code>:global()</code>. A stylesheet you import
			never does, because Svelte only scopes styles inside a component's
			<code>&lt;style&gt;</code> block. A rule in your own component's
			<code>&lt;style&gt;</code> block does need it for a class you passed to a library component.
			That class lands on markup the component renders, so an unwrapped selector is pruned as
			unused. Custom-property hooks need no selector at all: set them on any ancestor and they
			inherit through the boundary. <a href="/docs/theming/components">Styling Components</a> walks through
			all three.
		</p>
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
