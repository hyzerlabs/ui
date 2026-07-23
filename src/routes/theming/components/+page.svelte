<script lang="ts">
	import { Stack, Card, Cluster } from '$lib';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import Example from '../../../docs/Example.svelte';
	import { hooks } from '../../../docs/hooks';
	import { isSection, manifest, sectionPages } from '../../../docs/manifest';

	// The manifest already maps a component name to its page — re-deriving the
	// slug here would just be a second place to get TextInput → text-input wrong.
	const hrefByComponent = new Map(
		manifest
			.filter(isSection)
			.flatMap(sectionPages)
			.map((p) => [p.label, p.href])
	);

	// spec 31 R10: the roll-up is derived from the same module the component
	// pages read, so this table can't drift from them. Each page owns the
	// detail; this page shows the whole surface at once.
	const customProps = Object.entries(hooks)
		.flatMap(([component, h]) =>
			(h.props ?? []).map((row) => ({
				component,
				...row,
				href: hrefByComponent.get(component)
			}))
		)
		.sort((a, b) => a.name.localeCompare(b.name));

	const hooksCode = [
		'/* Every component exposes a stable root class and data-* hooks for its',
		'   variants and states — style them from your own (unlayered) CSS: */',
		'.hz-button {',
		'\ttext-transform: uppercase;',
		'\tletter-spacing: 0.02em;',
		'}',
		'',
		".hz-button[data-variant='outline'][data-intent='danger'] {",
		'\tborder-style: dashed;',
		'}',
		'',
		'/* State hooks cover the interactive lifecycle: */',
		".hz-field[data-state='error'] input {",
		'\tbackground: #fff5f5;',
		'}'
	].join('\n');

	// The style tags are split so Svelte's parser doesn't mistake the code
	// sample for a real block.
	const classPropCode = [
		'<Button class="cta">Book a tee time</Button>',
		'',
		'<' + 'style>',
		'\t/* Rendered as class="hz-button cta" — your class comes after the',
		'\t   root class and, being unlayered, beats the theme without any',
		'\t   specificity games. Svelte scoping needs :global for children. */',
		'\t:global(.cta) {',
		'\t\tbox-shadow: var(--hz-shadow-md);',
		'\t}',
		'</' + 'style>'
	].join('\n');

	const hookPropsCode = [
		'/* Quieter dark alerts, a chunkier toggle: */',
		"[data-theme='dark'] .hz-alert {",
		'\t--hz-alert-tint: 16%;',
		'}',
		'',
		'.hz-field--toggle input {',
		'\t--hz-toggle-width: 3rem;',
		'\t--hz-toggle-height: 1.75rem;',
		'}'
	].join('\n');

	const treatmentsCode = [
		'<Card class="hz-card--outlined">',
		'\t<h3 class="hz-card-title">Course conditions</h3>',
		'\tFairways dry, greens rolling fast.',
		'</Card>',
		'',
		'<Card class="hz-card--elevated">',
		'\t<h3 class="hz-card-title">Next tee time</h3>',
		'\tSaturday, 8:40 — Maple Hill.',
		'</Card>'
	].join('\n');
</script>

<svelte:head>
	<title>Styling Components — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Styling Components</h1>
		<p class="doc-description">
			Components expose a stable styling contract: an <code>hz-*</code> root class, a
			<code>data-*</code> attribute per variant/state, and a <code>class</code> prop merged after
			the root class. The reference theme styles exactly these hooks — from
			<code>@layer hz-theme</code>, wrapped in <code>:where()</code> so everything stays at single-class
			specificity — which means your unlayered CSS wins by default.
		</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="hooks-heading"
	>
		<h2 id="hooks-heading">Classes and data hooks</h2>
		<p>
			The hooks are part of each component's contract, and every component page lists its own under
			<strong>Theme hooks</strong> — root class, <code>data-*</code> vocabulary, custom properties,
			and the part classes for its children. Variants land as
			<code>data-variant</code>/<code>data-intent</code>/<code>data-size</code>; interactive state
			as <code>data-state</code> and friends — always present, so CSS can target any combination.
		</p>
		<CodeBlock code={hooksCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="class-heading"
	>
		<h2 id="class-heading">The <code>class</code> prop</h2>
		<CodeBlock code={classPropCode} />
		<p class="note">
			One caveat in the other direction: styles inside a component's own
			<code>&lt;style&gt;</code> block are unlayered too — so if you build wrapper components,
			prefer styling the <code>hz-*</code> hooks from stylesheets you control rather than re-declaring
			resets a theme would need to fight.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="hook-props-heading"
	>
		<h2 id="hook-props-heading">Custom-property hooks</h2>
		<p>
			Beyond the tokens, some components expose their own knob as a custom property — override it on
			any selector, per mode if you scope it under <code>[data-theme="dark"]</code>. Every one the
			library ships is below; each component's page carries the same rows alongside its
			<code>data-*</code> and part classes.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Hook</th>
						<th scope="col">Values</th>
						<th scope="col">Component</th>
						<th scope="col">Tunes</th>
					</tr>
				</thead>
				<tbody>
					{#each customProps as row (row.component + row.name)}
						<tr>
							<td><code>{row.name}</code></td>
							<td><code class="values">{row.values}</code></td>
							<td>
								{#if row.href}<a href={row.href}>{row.component}</a>{:else}{row.component}{/if}
							</td>
							<td>{row.note}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<CodeBlock code={hookPropsCode} />
		<p class="note">
			The tint defaults are graded on
			<a href="/foundation/contrast">Contrast &amp; Accessibility</a> — if you retune them, re-check the
			soft pairings there.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="treatments-heading"
	>
		<h2 id="treatments-heading">Theme conventions: Card treatments &amp; titles</h2>
		<p>
			Some looks are deliberately theme classes rather than component props — Card's surface
			treatments (<code>hz-card--outlined</code>, <code>hz-card--elevated</code>) live only in the
			reference theme, and <code>hz-card-title</code> is an opt-in convention: bring your own heading
			element at whatever level the page needs, the class only styles it. Headings aren't load-bearing
			for Card the way they are for Modal or Accordion, so they never became API.
		</p>
		<Example code={treatmentsCode}>
			<Cluster gap="md" align="stretch">
				<Card class="hz-card--outlined">
					<h3 class="hz-card-title">Course conditions</h3>
					Fairways dry, greens rolling fast.
				</Card>
				<Card class="hz-card--elevated">
					<h3 class="hz-card-title">Next tee time</h3>
					Saturday, 8:40 — Maple Hill.
				</Card>
			</Cluster>
		</Example>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="headless-heading"
	>
		<h2 id="headless-heading">Going fully headless</h2>
		<p>
			Skip the reference theme and the same hooks are your blank canvas — components render as
			functional native elements with no appearance opinions. Keep <code>tokens.css</code> for the
			custom properties (component fallbacks match the token values exactly, so adding it later
			changes nothing), and cherry-pick any reference sheet you do want:
			<code>@hyzer-labs/ui/theme/components/button.css</code>.
		</p>
		<p>
			For complete restyles, start from an example:
			<a href="/theming/examples">Example Themes</a> shows two full token-override sheets and the configs
			that generate them.
		</p>
	</Stack>
</Stack>

<style>
	/* Margins zeroed below — every <p>, CodeBlock, Example, and
	 * .token-table-wrapper is a direct child of either .doc-intro or a
	 * .doc-section Stack (gap="away", data-density-shift), which owns the
	 * space between them. */
	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	code.values {
		color: var(--hz-intent-primary, #2563eb);
	}

	:global(.doc-section .hz-card) {
		max-width: 18rem;
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

	.note {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
