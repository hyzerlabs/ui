<script lang="ts">
	import { Tabs, CodeBlock, Alert } from '$lib';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { metatagsDoc } from '../../../../docs/data/metatags.js';

	// ------------------------------------------------------------------
	// Demo 1 — a minimal call, direct on one page
	// ------------------------------------------------------------------

	const minimalCode = [
		'<Metatags',
		'\tsiteUrl="https://example.com"',
		'\tsiteName="Example"',
		'\turl="/pricing"',
		'\ttitle="Pricing"',
		'\tdescription="Three plans, no seat minimums."',
		'/>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 2 — the per-site wrapper (the centrepiece)
	// ------------------------------------------------------------------

	const wrapperCode = [
		'<!-- src/lib/Seo.svelte — in YOUR app, not this library -->',
		'<script lang="ts">',
		"\timport { page } from '$app/state';",
		"\timport { Metatags } from '@hyzer-labs/ui';",
		"\timport type { ComponentProps } from 'svelte';",
		"\tlet props: Omit<ComponentProps<typeof Metatags>, 'siteUrl' | 'siteName' | 'url'> = $props();",
		'</' + 'script>',
		'',
		'<Metatags',
		'\tsiteUrl="https://example.com"',
		'\tsiteName="Example"',
		'\turl={page.url.pathname}',
		'\timage="/og/default.png"',
		'\timageAlt="Example"',
		'\t{...props}',
		'/>'
	].join('\n');

	const wrapperUsageCode = [
		'<!-- any +page.svelte -->',
		'<Seo title="Pricing" description="Three plans, no seat minimums." />'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 2b — across pages and layouts
	// ------------------------------------------------------------------

	const loadFunctionCode = [
		'// src/routes/blog/[slug]/+page.ts',
		'export async function load({ params }) {',
		'\tconst post = await getPost(params.slug);',
		'\treturn { title: post.title, description: post.excerpt };',
		'}'
	].join('\n');

	const rootLayoutCode = [
		'<!-- src/routes/+layout.svelte -->',
		'<script lang="ts">',
		"\timport { page } from '$app/state';",
		"\timport { Metatags } from '@hyzer-labs/ui';",
		'\tlet { children } = $props();',
		'</' + 'script>',
		'',
		'<Metatags',
		'\tsiteUrl="https://example.com"',
		'\tsiteName="Example"',
		'\turl={page.url.pathname}',
		'\ttitle={page.data.title}',
		'\tdescription={page.data.description}',
		'/>',
		'',
		'{@render children()}'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 3 — a dynamic page (type="article", a per-page image)
	// ------------------------------------------------------------------

	const dynamicCode = [
		'<Seo',
		'\ttype="article"',
		'\ttitle={post.title}',
		'\tdescription={post.excerpt}',
		'\timage={`/og.png?message=${encodeURIComponent(post.title)}`}',
		'\timageAlt={post.title}',
		'/>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 4 — the children escape hatch
	// ------------------------------------------------------------------

	const childrenCode = [
		'<Metatags {...base}>',
		'\t<meta name="robots" content="noindex" />',
		'\t<meta name="twitter:site" content="@example" />',
		'</Metatags>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 5 — the emitted head markup for the minimal call above
	// ------------------------------------------------------------------

	const emittedCode = [
		'<title>Pricing | Example</title>',
		'<meta name="description" content="Three plans, no seat minimums.">',
		'<link rel="canonical" href="https://example.com/pricing">',
		'<meta property="og:type" content="website">',
		'<meta property="og:site_name" content="Example">',
		'<meta property="og:title" content="Pricing | Example">',
		'<meta property="og:description" content="Three plans, no seat minimums.">',
		'<meta property="og:url" content="https://example.com/pricing">',
		'<meta name="twitter:card" content="summary">',
		'<meta name="twitter:title" content="Pricing | Example">',
		'<meta name="twitter:description" content="Three plans, no seat minimums.">',
		'<meta name="twitter:url" content="https://example.com/pricing">'
	].join('\n');

	const demoTabs = [
		{ id: 'minimal', label: 'Minimal call' },
		{ id: 'wrapper', label: 'Per-site wrapper' },
		{ id: 'layouts', label: 'Across pages and layouts' },
		{ id: 'dynamic', label: 'Dynamic page' },
		{ id: 'children', label: 'Extra tags' },
		{ id: 'emitted', label: 'Emitted markup' }
	];
</script>

<DocPage name="Metatags" {...metatagsDoc}>
	<p class="doc-note">
		This component renders nothing visible. Its whole output is a <code>&lt;svelte:head&gt;</code>
		block, and rendering it here would put a second <code>&lt;title&gt;</code> into this site's own
		head, so there is no live preview. Every example below is the exact source, and the last tab
		shows what it emits. It takes no <code>class</code> prop and forwards no other attributes, because
		it renders no element to put them on.
	</p>
	<Tabs items={demoTabs} ariaLabel="Metatags demos" defaultTab="minimal">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'minimal'}
					<p class="tab-note">
						Every prop arrives directly on the page that needs it. With no <code>image</code>, the
						card falls back to <code>twitter:card="summary"</code> and Metatags emits no image tags.
					</p>
					<CodeBlock code={minimalCode} />
				{:else if item.id === 'wrapper'}
					<p class="tab-note">
						Site-level values (<code>siteUrl</code>, <code>siteName</code>, a default
						<code>image</code>) live once in a small wrapper you own, not in this library. That
						keeps the library framework-agnostic: <code>$app/state</code> is a SvelteKit import, so
						it belongs in your app. <code>url</code> comes from <code>page.url.pathname</code>, and
						every other prop forwards straight through. The rest of this page assumes this pattern.
					</p>
					<CodeBlock code={wrapperCode} title="src/lib/Seo.svelte" language="svelte" />
					<CodeBlock code={wrapperUsageCode} language="svelte" />
				{:else if item.id === 'layouts'}
					<p class="tab-note">
						The usual pattern needs nothing special: every page renders <code>&lt;Metatags&gt;</code
						>
						(or your <code>Seo</code> wrapper) with that page's own values, like every other example
						on this page. When you navigate in the browser, SvelteKit swaps the page and Svelte's
						own
						<code>&lt;svelte:head&gt;</code> reconciliation replaces the previous tag set with the new
						one. There is nothing to clean up by hand.
					</p>
					<p class="tab-note">
						The alternative is rendering it exactly once, in the root layout, fed by each page's own
						<code>load</code> function through <code>page.data</code>. A page returns whatever
						changes:
					</p>
					<CodeBlock code={loadFunctionCode} language="ts" />
					<p class="tab-note">and the layout merges those values with the site defaults:</p>
					<CodeBlock code={rootLayoutCode} language="svelte" />
					<Alert intent="warning" title="Render it in one place, not both">
						{#snippet icon()}<IconTriangleAlert />{/snippet}
						Rendering <code>&lt;Metatags&gt;</code> in the root layout <em>and</em> in an individual page
						ships two full tag sets in the server-rendered HTML. Crawlers are the real audience for these
						tags, and a crawler reads that raw HTML and typically keeps only the first occurrence of a
						given tag. So the "override" you see while clicking around in a browser is a client-side illusion,
						not what search engines and link unfurlers get. Pick one location per site.
					</Alert>
				{:else if item.id === 'dynamic'}
					<p class="tab-note">
						A per-page <code>type</code> and a per-page <code>image</code>, built with an og-image
						endpoint's own <code>?message=</code> parameter. That query string is the endpoint's contract
						rather than a Metatags prop, so it stays one line at the call site. Percent-encode the value:
						a raw space makes the URL invalid, and Slack then drops the preview image with no error.
					</p>
					<CodeBlock code={dynamicCode} language="svelte" />
				{:else if item.id === 'children'}
					<p class="tab-note">
						Anything this component does not emit goes in the default snippet, rendered last inside
						the same head block: <code>twitter:site</code>, <code>robots</code>,
						<code>article:published_time</code>, JSON-LD in a
						<code>&lt;script type="application/ld+json"&gt;</code>. Use it for tags this component
						does not manage, not to override the ones it does. A snippet that also sets
						<code>og:title</code> ships two <code>og:title</code> tags.
					</p>
					<CodeBlock code={childrenCode} language="svelte" />
				{:else}
					<p class="tab-note">
						Exactly what the "Minimal call" tab renders into <code>&lt;head&gt;</code>, in order:
						title, description, canonical, Open Graph, then the X (Twitter) card.
					</p>
					<CodeBlock code={emittedCode} language="html" />
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.doc-note {
		margin: 0 0 1rem;
		color: var(--hz-color-text-muted, #6b7280);
	}

	.tab-note {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}
</style>
