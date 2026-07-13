<script lang="ts">
	import { Stack, Grid, Card } from '$lib';
	import { manifest } from '../docs/manifest';
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
		<pre><code>pnpm add @hyzer-labs/ui</code></pre>
	</section>

	<section aria-labelledby="usage-heading">
		<h2 id="usage-heading">Usage</h2>
		<pre><code
				>import {'{ Button, Nav, Form }'} from '@hyzer-labs/ui';
import '@hyzer-labs/ui/tokens.css';</code
			></pre>
	</section>

	<section aria-labelledby="sections-heading">
		<h2 id="sections-heading">Browse the docs</h2>
		<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
			{#each manifest as section (section.label)}
				<Card class="hz-card--outlined" padding="md" rounded="md">
					<!-- Sections have no cover pages — the card opens the first page. -->
					<a href={section.children[0].href} class="section-link">
						<h3 class="section-title">{section.label}</h3>
						<p class="section-count">
							{section.children.length} page{section.children.length !== 1 ? 's' : ''}
						</p>
						<ul class="section-pages" aria-label="{section.label} pages">
							{#each section.children.slice(0, 4) as p (p.href)}
								<li>{p.label}</li>
							{/each}
							{#if section.children.length > 4}
								<li>+{section.children.length - 4} more</li>
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

	pre {
		padding: 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow-x: auto;
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
