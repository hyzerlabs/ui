<script lang="ts">
	import { Stack, Card, Cluster, Tabs, Table, CodeBlock } from '$lib';
	import type { TableColumn } from '$lib/types';
	import Example from '../../../../docs/Example.svelte';
	import { hooks } from '../../../../docs/hooks';
	import { isSection, manifest, sectionPages } from '../../../../docs/manifest';
	// ?raw keeps this case study honest — the excerpt below is sliced from the
	// same shipped sheet the Docs tier on /theming/examples imports live, not
	// a hand copy that can drift.
	import docsCss from '$lib/theme/examples/docs/docs.css?raw';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	// The manifest already maps a component name to its page — re-deriving the
	// slug here would just be a second place to get TextInput → text-input wrong.
	const hrefByComponent = new Map(
		manifest
			.filter(isSection)
			.flatMap(sectionPages)
			.map((p) => [p.label, p.href])
	);

	// The roll-up is derived from the same module the component pages read, so
	// this table can't drift from them. Each page owns the detail; this page
	// shows the whole surface at once.
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
		'   variants and states. Style them from your own (unlayered) CSS: */',
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
		'\t/* Rendered as class="hz-button cta". Your class is unlayered, so it',
		'\t   beats the theme with no specificity games. Svelte scoping needs',
		'\t   :global for a class you pass to a component. */',
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
		'\tSaturday, 8:40, Maple Hill.',
		'</Card>'
	].join('\n');

	// The case study: the shipped Docs example theme's one component-hook
	// override (see /theming/examples, the arc's middle tier). Same table
	// rendered twice, once bare and once wrapped in .docs-table, so the
	// unlayered override's win is visible side by side.
	interface HoleRow {
		id: string;
		hole: string;
		par: number;
		distance: string;
	}

	const cascadeTableItems: HoleRow[] = [
		{ id: 'h3', hole: 'Hole 3', par: 3, distance: '285 ft' },
		{ id: 'h7', hole: 'Hole 7', par: 4, distance: '412 ft' },
		{ id: 'h12', hole: 'Hole 12', par: 5, distance: '620 ft' }
	];

	const cascadeTableColumns: TableColumn<HoleRow>[] = [
		{ key: 'hole', header: 'Hole' },
		{ key: 'par', header: 'Par', align: 'end' },
		{ key: 'distance', header: 'Distance', align: 'end' }
	];

	const cascadeViewTabs = [
		{ id: 'demo', label: 'Demo' },
		{ id: 'source', label: 'docs.css excerpt' }
	];

	// The .docs-table rule block only, sliced from the real shipped file —
	// not the whole sheet (that full source lives on the Docs tier of
	// /theming/examples; this page teaches the mechanism, not a second copy
	// of the file).
	const cascadeCssExcerpt = docsCss
		.slice(
			docsCss.indexOf('/*\n * .docs-table: the worked cascade example'),
			docsCss.indexOf(
				'/* ------',
				docsCss.indexOf('/*\n * .docs-table: the worked cascade example')
			)
		)
		.trim();
</script>

<svelte:head>
	<title>Styling Components — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			Components expose a stable styling contract: an <code>hz-*</code> root class, a
			<code>data-*</code> attribute per variant and state, and a <code>class</code> prop merged
			after the root class. The reference theme styles exactly these hooks. It paints them from
			<code>@layer hz-theme</code>, wrapped in <code>:where()</code>, so everything stays at
			single-class specificity and your unlayered CSS wins by default.
		{/snippet}
	</DocIntro>

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
			<strong>Theme hooks</strong>: root class, <code>data-*</code> vocabulary, custom properties,
			and the part classes for its children. Variants land as
			<code>data-variant</code>/<code>data-intent</code>/<code>data-size</code>; interactive state
			as
			<code>data-state</code> and friends.
		</p>
		<p>
			A prop with a default stamps its attribute on every render, so
			<code>[data-variant='solid'][data-size='md']</code> always matches. A prop with no default (an
			unset <code>intent</code>, say) leaves the attribute off entirely, which is what lets
			<code>:not([data-intent])</code> style the plain case.
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
		<p>
			Whether a selector for that class needs <code>:global()</code> depends on where the rule lives,
			not on this library. Styling one component instance has three channels, and only one of them needs
			the wrapper:
		</p>
		<ul class="note-list">
			<li>
				<strong>A stylesheet you import</strong> (your <code>app.css</code>, a theme sheet): plain
				selectors work. Svelte only scopes styles inside a component's
				<code>&lt;style&gt;</code> block, so an imported sheet never needs <code>:global()</code>.
			</li>
			<li>
				<strong>Your own component's <code>&lt;style&gt;</code> block:</strong> wrap the selector in
				<code>:global()</code>
				when the class was passed to a library component. That class lands on markup the component renders.
				Svelte scopes your styles to your own template, so an unwrapped selector is silently pruned as
				unused. This is Svelte's scoping model, common to every Svelte component library. A class on an
				element in your own markup needs no wrapper.
			</li>
			<li>
				<strong>Custom-property hooks</strong> (<code>--hz-*</code>): no selector reaches into the
				component at all. Set them inline, on a wrapper, or on any ancestor, and they inherit
				through the component boundary.
			</li>
		</ul>
		<p class="doc-note">
			One caveat about layering: styles inside a component's own
			<code>&lt;style&gt;</code> block are unlayered too. So if you build wrapper components, prefer
			styling the <code>hz-*</code> hooks from stylesheets you control rather than re-declaring resets
			a theme would need to fight.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="cascade-heading"
	>
		<h2 id="cascade-heading">Case study: <code>.docs-table</code></h2>
		<p>
			The reference theme paints <code>.hz-table</code> from
			<code>@layer hz-theme</code>, wrapped in <code>:where()</code>, so unlayered CSS beats it at
			any specificity: no <code>!important</code>, no mirroring the theme's selectors. The shipped
			Docs example theme (the middle tier on <a href="/docs/theming/examples">Example Themes</a>) is
			built on exactly that: one opt-in wrapper class, <code>.docs-table</code>, and nothing else
			about
			<code>Table</code> changes.
		</p>
		<Tabs items={cascadeViewTabs} ariaLabel=".docs-table demo" defaultTab="demo">
			{#snippet panel(item)}
				<div class="tab-content">
					{#if item.id === 'demo'}
						<Cluster gap="lg" align="start" wrap>
							<div>
								<p class="tab-note">Reference theme, unwrapped</p>
								<Table
									items={cascadeTableItems}
									columns={cascadeTableColumns}
									caption="Course card"
								/>
							</div>
							<div>
								<p class="tab-note">Wrapped in <code>.docs-table</code></p>
								<Table
									items={cascadeTableItems}
									columns={cascadeTableColumns}
									caption="Course card, docs style"
									class="docs-table"
								/>
							</div>
						</Cluster>
					{:else}
						<CodeBlock code={cascadeCssExcerpt} />
					{/if}
				</div>
			{/snippet}
		</Tabs>
		<p class="doc-note">
			Wrap any table in <code>.docs-table</code> and its borders, padding, and header background
			follow this sheet instead, on every property the sheet sets and nothing else. A table with no
			wrapper is left exactly as the reference theme paints it. The excerpt above is sliced from the
			real shipped <code>@hyzer-labs/ui/theme/examples/docs/docs.css</code>. The full sheet, with
			this override in context alongside Ocean and Terminal, is on
			<a href="/docs/theming/examples">Example Themes</a>.
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
			Beyond the tokens, some components expose their own knob as a custom property. Override it on
			any selector, or per theme by scoping it under <code>[data-theme="dark"]</code>. Every one the
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
		<p class="doc-note">
			The tint defaults are graded on
			<a href="/docs/foundation/contrast">Contrast &amp; Accessibility</a>. If you retune them,
			re-check the soft pairings there.
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
			Some looks are deliberately theme classes rather than component props. Card's surface
			treatments (<code>hz-card--outlined</code>, <code>hz-card--elevated</code>) live only in the
			reference theme. <code>hz-card-title</code> is an opt-in convention: bring your own heading element
			at whatever level the page needs, and the class only styles it. Headings are not load-bearing for
			Card the way they are for Modal or Accordion, so they never became API.
		</p>
		<Example code={treatmentsCode}>
			<Cluster gap="md" align="stretch">
				<Card class="hz-card--outlined">
					<h3 class="hz-card-title">Course conditions</h3>
					Fairways dry, greens rolling fast.
				</Card>
				<Card class="hz-card--elevated">
					<h3 class="hz-card-title">Next tee time</h3>
					Saturday, 8:40, Maple Hill.
				</Card>
			</Cluster>
		</Example>
		<p>
			The generated utility sheet and the full catalog of opt-in classes (including
			<code>.hz-card-title</code> and <code>.hz-banner-title</code>) are documented on
			<a href="/docs/foundation/utilities">Foundation &rarr; Utilities</a>.
		</p>
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
			Skip the reference theme and the same hooks are your blank canvas: components render as
			functional native elements with no appearance opinions. Keep <code>tokens.css</code> for the
			custom properties (component fallbacks match the token values exactly, so adding it later
			changes nothing), and cherry-pick any reference sheet you do want:
			<code>@hyzer-labs/ui/theme/components/button.css</code>.
		</p>
		<p>
			For complete restyles, start from an example:
			<a href="/docs/theming/examples">Example Themes</a> shows three of them, and the configs behind
			the two that are generated.
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
</style>
