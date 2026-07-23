<script lang="ts">
	import { Stack, Grid, Card } from '$lib';
	import CodeBlock from '../docs/CodeBlock.svelte';
	import { isSection, manifest, sectionPages, type ManifestSection } from '../docs/manifest';

	const installCode = 'pnpm add @hyzer-labs/ui';
	const usageCode = [
		"import { Button, Nav, Form } from '@hyzer-labs/ui';",
		"import '@hyzer-labs/ui/tokens.css';"
	].join('\n');

	// The card grid shows sections only — standalone entries (Introduction)
	// are this page itself. Pages are flattened: the cards preview page names,
	// so Components' group bands don't matter here.
	const sections = manifest
		.filter((e): e is ManifestSection => isSection(e))
		.map((section) => ({ label: section.label, pages: sectionPages(section) }));
</script>

<svelte:head>
	<title>@hyzer-labs/ui — Headless Svelte Component Library</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>@hyzer-labs/ui</h1>
		<p class="lead">
			A headless, accessible Svelte 5 component library. Ships behavior, structure, and
			accessibility — not visual opinions.
		</p>
	</div>

	<section aria-labelledby="install-heading">
		<h2 id="install-heading">Installation</h2>
		<CodeBlock code={installCode} />
	</section>

	<section aria-labelledby="usage-heading">
		<h2 id="usage-heading">Usage</h2>
		<CodeBlock code={usageCode} />
	</section>

	<section aria-labelledby="philosophy-heading">
		<h2 id="philosophy-heading">Philosophy</h2>
		<p class="philosophy-lead">
			Three commitments shape every component, from the smallest button to the largest data table:
		</p>
		<ul class="philosophy-list">
			<li>
				<strong>Accessibility is prioritized.</strong> Each component ships the ARIA roles, keyboard interactions,
				and focus management of its WAI-ARIA pattern by default — not bolted on afterward.
			</li>
			<li>
				<strong>Headless components are easily overridden via snippets.</strong> Structure and
				per-item content are yours to shape — pass a <code>children</code> or per-item snippet and render
				your own markup without forking the component.
			</li>
			<li>
				<strong>Theming is via classes and data-* attributes.</strong> Components ship only
				structural CSS plus stable <code>hz-*</code> classes and <code>data-*</code>/<code
					>aria-*</code
				> hooks — all visual chrome lives in the theme layer, keyed on those hooks.
			</li>
		</ul>
	</section>

	<section aria-labelledby="sections-heading">
		<h2 id="sections-heading">Browse the docs</h2>
		<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
			{#each sections as section (section.label)}
				<Card class="hz-card--outlined" padding="md" rounded="md">
					<!-- Sections have no cover pages — the card opens the first page. -->
					<a href={section.pages[0].href} class="section-link">
						<h3 class="section-title">{section.label}</h3>
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
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2rem);
		font-weight: var(--hz-font-weight-bold, 700);
		line-height: var(--hz-line-height-tight, 1.2);
	}

	.lead {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.25rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

	h2 {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-xl, 1.5rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.philosophy-lead {
		margin: 0 0 0.75rem;
		line-height: var(--hz-line-height-base, 1.5);
	}

	.philosophy-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding-left: 1.25rem;
		line-height: var(--hz-line-height-base, 1.5);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.section-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.section-title {
		margin: 0 0 0.25rem;
		font-size: var(--hz-font-size-lg, 1.25rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.section-count {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.section-pages {
		margin: 0;
		padding-left: 1.25rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.section-pages li {
		line-height: var(--hz-line-height-base, 1.5);
	}
</style>
