<script lang="ts">
	/**
	 * The landing page — the most-viewed dogfood on the site, so it is built
	 * from library components and nothing else. No docs shell: this page is
	 * full-bleed, with its own header and skip link.
	 */
	import { Hero, Stack, Grid, Card, Cluster, Button, Badge, Image, CodeBlock, Footer } from '$lib';
	import { isSection, manifest, sectionPages, type ManifestSection } from '../docs/manifest';
	import ThemeToggle from '../docs/ThemeToggle.svelte';

	// Demo avatar — a labeled SVG data-URI per the placeholder-asset
	// convention. The fence shows the realistic `import avatar from …` form.
	const AVATAR =
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%232563eb'/%3E%3Ctext x='20' y='26' text-anchor='middle' font-family='sans-serif' font-size='16' fill='white'%3ESJ%3C/text%3E%3C/svg%3E";

	const usageSvelteCode = [
		'<script>',
		"\timport { Card, Badge, Image } from '@hyzer-labs/ui';",
		"\timport avatar from './avatar.jpg';",
		'</' + 'script>',
		'',
		'<Card horizontal class="player">',
		'\t{#snippet media()}',
		'\t\t<Image src={avatar} alt="" rounded="full" />',
		'\t{/snippet}',
		'\t<strong>Sam Jensen</strong>',
		'\t<span class="muted">Leicester, MA</span>',
		'\t{#snippet actions()}<Badge intent="success">1024 rated</Badge>{/snippet}',
		'</Card>'
	].join('\n');

	// The four Philosophy commitments, as headlines only — /docs/philosophy
	// carries the argument for each. Landing pages get scanned, not read.
	const commitments = [
		{
			title: 'Accessibility is prioritized',
			body: 'Every component ships the ARIA roles, keyboard interactions, and focus management of its WAI-ARIA pattern by default.'
		},
		{
			title: 'Headless, overridable through snippets',
			body: 'Structure and per-item content are yours to shape — without forking the component.'
		},
		{
			title: 'Theming via classes and data-* hooks',
			body: 'Components ship structural CSS and stable hooks; every visual decision lives in a theme layer you control.'
		},
		{
			title: 'Plain language is part of accessibility',
			body: 'The words a component ships by default — labels, errors, empty states — are as much a part of its design as the markup.'
		}
	];

	const sections = manifest
		.filter((e): e is ManifestSection => isSection(e))
		.map((section) => ({ label: section.label, pages: sectionPages(section) }));
</script>

<svelte:head>
	<title>@hyzer-labs/ui — Headless Svelte 5 component library</title>
	<meta
		name="description"
		content="A headless, accessible Svelte 5 component library. Ships behavior, structure, and accessibility — not visual opinions."
	/>
</svelte:head>

<a class="skip-to-content" href="#main-content">Skip to content</a>

<header class="site-header">
	<span class="site-logo">@hyzer-labs/ui</span>
	<Cluster gap="sm" align="center">
		<a class="site-link" href="/docs">Docs</a>
		<a class="site-link" href="/docs/components/button">Components</a>
		<a class="site-link" href="https://github.com/hyzerlabs/ui">GitHub</a>
		<ThemeToggle />
	</Cluster>
</header>

<main id="main-content" tabindex="-1">
	<Hero
		layout="split"
		align="center"
		eyebrow="Svelte 5"
		title="Components that ship behavior, not opinions"
		subtitle="Accessible, headless Svelte 5 components with a token engine that grades its own contrast. Style them however you like — or don't, and take the reference theme."
	>
		{#snippet actions()}
			<Button href="/docs">Get started</Button>
			<Button href="/docs/components/button" variant="ghost" intent="neutral">
				Browse components
			</Button>
		{/snippet}
		{#snippet media()}
			<div class="hero-proof">
				<CodeBlock code={usageSvelteCode} />
				<!-- The rendered result of exactly the code above it. -->
				<div class="hero-render">
					<Card horizontal class="player">
						{#snippet media()}
							<Image src={AVATAR} alt="" rounded="full" />
						{/snippet}
						<strong>Sam Jensen</strong>
						<span class="muted">Leicester, MA</span>
						{#snippet actions()}<Badge intent="success">1024 rated</Badge>{/snippet}
					</Card>
				</div>
			</div>
		{/snippet}
	</Hero>

	<Stack as="section" class="band" gap="md" aria-labelledby="commitments-heading">
		<h2 id="commitments-heading">What it commits to</h2>
		<Grid columns={{ sm: 1, md: 2 }} gap="md">
			{#each commitments as c (c.title)}
				<Card class="hz-card--outlined" padding="md" rounded="md">
					<h3 class="card-title">{c.title}</h3>
					<p class="card-body">{c.body}</p>
				</Card>
			{/each}
		</Grid>
		<p><a href="/docs/philosophy">Read the philosophy &rarr;</a></p>
	</Stack>

	<Stack as="section" class="band" gap="md" aria-labelledby="install-heading">
		<h2 id="install-heading">Install</h2>
		<CodeBlock code="pnpm add @hyzer-labs/ui" />
		<ul class="note-list">
			<li><strong>Svelte</strong> 5.32 or newer.</li>
			<li><strong>Node</strong> 22.18 or newer — only the <code>hyzer</code> CLI needs it.</li>
			<li><strong>TypeScript</strong> is optional — types ship with the package.</li>
			<li><strong>SvelteKit</strong> is optional — the library imports nothing from Kit.</li>
		</ul>
	</Stack>

	<Stack as="section" class="band" gap="md" aria-labelledby="sections-heading">
		<h2 id="sections-heading">Browse the docs</h2>
		<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
			{#each sections as section (section.label)}
				<Card class="hz-card--outlined" padding="md" rounded="md">
					<!-- Sections have no cover pages — the card opens the first page. -->
					<a href={section.pages[0].href} class="section-link">
						<h3 class="card-title">{section.label}</h3>
						<p class="section-count">
							{section.pages.length} page{section.pages.length !== 1 ? 's' : ''}
						</p>
						<ul class="section-pages" aria-label="{section.label} pages">
							{#each section.pages.slice(0, 4) as p (p.href)}
								<li>{p.label}</li>
							{/each}
							{#if section.pages.length > 4}
								<li>+{section.pages.length - 4} more</li>
							{/if}
						</ul>
					</a>
				</Card>
			{/each}
		</Grid>
	</Stack>
</main>

<Footer
	columns={[
		{
			title: 'Docs',
			links: [
				{ label: 'Getting Started', href: '/docs' },
				{ label: 'Philosophy', href: '/docs/philosophy' },
				{ label: 'Agents', href: '/docs/agents' },
				{ label: 'Theming', href: '/docs/theming/overview' }
			]
		},
		{
			title: 'Project',
			links: [
				{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui' },
				{ label: 'npm', href: 'https://www.npmjs.com/package/@hyzer-labs/ui' }
			]
		}
	]}
>
	{#snippet bottom()}
		<span>&copy; {new Date().getFullYear()} Hyzer Labs — MIT License</span>
	{/snippet}
</Footer>

<style>
	.skip-to-content {
		position: absolute;
		top: -100%;
		left: 0;
		z-index: 9999;
		padding: 0.5rem 1rem;
		background: var(--hz-color-text, #000);
		color: var(--hz-color-surface, #fff);
		text-decoration: none;
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.skip-to-content:focus-visible {
		top: 0;
	}

	.site-header {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		padding: 1rem clamp(1rem, 5vw, 4rem);
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.site-logo {
		font-family: var(--hz-font-family-mono, monospace);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.site-link {
		color: inherit;
		text-decoration: none;
	}

	.site-link:hover {
		text-decoration: underline;
	}

	/* `band` is passed to Stack as a class prop, so it lands on Stack's root —
	   outside this component's style scope. Scoping through `main`, which IS
	   in this file, keeps the rule from leaking site-wide. */
	main :global(.band) {
		padding: var(--hz-space-lg, 4rem) clamp(1rem, 5vw, 4rem);
		max-width: 72rem;
		margin-inline: auto;
	}

	h2 {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.card-title {
		margin: 0 0 0.35rem;
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.card-body,
	.section-count {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.section-count {
		margin-bottom: 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	/* The live half of the hero — the code above, rendered with the reference
	 * theme this site runs. Mirrors the fence's own .muted/.player rules. */
	.hero-proof {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.hero-render {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1.5rem;
	}

	.muted {
		display: block;
		color: var(--hz-color-text-muted, #6b7280);
	}

	.hero-render :global(.hz-card.player) {
		background: var(--hz-color-surface-muted, #f3f4f6);
	}

	.section-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.section-pages {
		margin: 0;
		padding-left: 1.25rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
