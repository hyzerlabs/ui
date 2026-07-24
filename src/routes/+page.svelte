<script lang="ts">
	import { Stack, Grid, Card, Split, Badge, Image } from '$lib';

	// Demo avatar — a labeled SVG data-URI per the placeholder-asset
	// convention. The fence shows the realistic `import avatar from …` form.
	const AVATAR =
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%232563eb'/%3E%3Ctext x='20' y='26' text-anchor='middle' font-family='sans-serif' font-size='16' fill='white'%3ESJ%3C/text%3E%3C/svg%3E";
	import CodeBlock from '../docs/CodeBlock.svelte';
	import { isSection, manifest, sectionPages, type ManifestSection } from '../docs/manifest';

	const installCode = 'pnpm add @hyzer-labs/ui';

	const usageCssCode = [
		'/* app.css — tokens first, then the optional reference theme */',
		"@import '@hyzer-labs/ui/tokens.css';",
		"@import '@hyzer-labs/ui/theme';",
		'',
		'/* Your own classes override the theme — merged after hz-* classes. */',
		'.player {',
		'\tbackground: var(--hz-color-surface-muted);',
		'}'
	].join('\n');

	// The style tag literals are split so Svelte's parser (and svelte-check's
	// extraction) doesn't mistake them for this component's own blocks.
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
		'</Card>',
		'',
		'<' + 'style>',
		'\t.muted {',
		'\t\tdisplay: block;',
		'\t\tcolor: var(--hz-color-text-muted);',
		'\t}',
		'</' + 'style>'
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
		<ul class="note-list">
			<li><strong>Svelte</strong> 5.7 or newer. Form's SvelteKit enhance attachment needs 5.32.</li>
			<li><strong>Node</strong> 22.18 or newer. Only the <code>hyzer</code> CLI needs it.</li>
			<li><strong>TypeScript</strong> is optional — types ship with the package.</li>
			<li><strong>SvelteKit</strong> is optional — the library imports nothing from Kit.</li>
		</ul>
	</section>

	<section aria-labelledby="usage-heading">
		<h2 id="usage-heading">Usage</h2>
		<p class="usage-note">
			Step one: install, import, go. Components work out of the box with the token sheet alone — the
			reference theme, the utilities sheet, and your own theme are layers you add when you want
			them. <a href="/getting-started">Getting Started</a> walks all three tiers.
		</p>
		<Split gap="md" fraction="2/3" stackBelow="sm">
			<div>
				<CodeBlock code={usageCssCode} />
				<CodeBlock code={usageSvelteCode} />
			</div>
			<!-- The rendered result of exactly the code on the left (the fence's
			     avatar import becomes a placeholder data-URI here). -->
			<div class="usage-render">
				<Card horizontal class="player">
					{#snippet media()}
						<Image src={AVATAR} alt="" rounded="full" />
					{/snippet}
					<strong>Sam Jensen</strong>
					<span class="muted">Leicester, MA</span>
					{#snippet actions()}<Badge intent="success">1024 rated</Badge>{/snippet}
				</Card>
			</div>
		</Split>
	</section>

	<section aria-labelledby="philosophy-heading">
		<h2 id="philosophy-heading">Philosophy</h2>
		<p class="philosophy-lead">
			Four commitments shape every component, from the smallest button to the largest data table:
		</p>
		<ul class="philosophy-list">
			<li>
				<strong>Accessibility is prioritized.</strong> Each component ships the ARIA roles, keyboard interactions,
				and focus management of its WAI-ARIA pattern by default — not bolted on afterward.
			</li>
			<li>
				<strong>Headless components can be overridden via snippets.</strong> Structure and per-item
				content are yours to shape — pass a <code>children</code> or per-item snippet and render your
				own markup without forking the component.
			</li>
			<li>
				<strong>Theming is via classes and data-* attributes.</strong> Components ship only
				structural CSS plus stable <code>hz-*</code> classes and <code>data-*</code>/<code
					>aria-*</code
				> hooks — all visual chrome lives in the theme layer, keyed on those hooks.
			</li>
			<li>
				<strong>Plain language is part of accessibility.</strong> The words a component ships by
				default — labels, error messages, empty states — are as much a part of its design as the
				markup. We write short sentences and skip jargon, and every default string follows the same
				rule: say the plain thing. <code>Form</code>'s error summary is one example — its default
				title counts the errors and says so in plain words, "There is a problem" for one, "There are
				3 problems" for three, not a vague fragment like "Errors detected."
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

	/* .note-list ships in the docs example sheet; this page's sections are
	 * plain (no Stack gap), so restore the breathing room locally — same
	 * for the two-file Usage example's stacked code blocks. */
	:global(.note-list) {
		margin-top: 0.75rem;
	}

	section :global(.code-block + .code-block) {
		margin-top: 0.75rem;
	}

	/* The live half of the Usage split — the code on the left, rendered
	 * with the reference theme this site runs. The .avatar/.muted rules
	 * mirror the fence's own <style> block exactly. */
	.usage-render {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1.5rem;
		align-self: start;
	}

	.muted {
		display: block;
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Mirrors the fence's app.css .player rule — a global class, since a
	 * scoped selector can't reach a component's root. */
	.usage-render :global(.hz-card.player) {
		background: var(--hz-color-surface-muted, #f3f4f6);
	}

	.usage-note,
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
