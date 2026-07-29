<script lang="ts">
	/**
	 * The landing page — the most-viewed dogfood on the site, so it is built
	 * from library components and nothing else. No docs shell: this page is
	 * full-bleed, with its own header and skip link.
	 */
	import {
		Hero,
		Header,
		Container,
		Stack,
		Grid,
		Card,
		Button,
		Badge,
		Image,
		CodeBlock,
		Split,
		Footer
	} from '$lib';
	import { isGrouped, isSection, manifest, type ManifestSection } from '../docs/manifest';
	import ThemeToggle from '../docs/ThemeToggle.svelte';
	import type { Intent, NavItem } from '$lib/types';

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
		'<Card horizontal padding="sm" class="player">',
		'\t{#snippet media()}',
		'\t\t<Image src={avatar} alt="" rounded="full" class="avatar" />',
		'\t{/snippet}',
		'\t<strong>Sam Jensen</strong>',
		'\t<span class="muted">Leicester, MA</span>',
		'\t{#snippet actions()}<Badge intent="success">1024 rated</Badge>{/snippet}',
		'</Card>',
		'',
		'<' + 'style>',
		'\t/* The class prop lands on the component root, so one instance',
		'\t   restyles without a wrapper element. */',
		'\t.player {',
		'\t\tbackground: var(--hz-color-surface-muted);',
		'\t\talign-items: center;',
		'\t\t/* Card stacks below 640px by default. Keep this one a row at',
		'\t\t   every width, with a small avatar track. */',
		'\t\tflex-direction: row;',
		'\t\t--hz-card-media-size: 3.5rem;',
		'\t}',
		'',
		'\t.avatar {',
		'\t\twidth: 3.5rem;',
		'\t}',
		'',
		'\t.muted {',
		'\t\tdisplay: block;',
		'\t\tcolor: var(--hz-color-text-muted);',
		'\t}',
		'</' + 'style>'
	].join('\n');

	// The Philosophy commitments, as headlines only — /docs/philosophy
	// carries the argument for each. Landing pages get scanned, not read.
	const commitments = [
		{
			title: 'Accessibility first',
			body: 'Every component ships the ARIA roles, keyboard interactions, and focus management of its WAI-ARIA pattern by default. You cannot accidentally opt out by restyling.'
		},
		{
			title: 'Headless structure, overridable',
			body: 'Documented hz-* classes and data-* hooks hand you the styling; snippets hand you the markup when styling is not enough. Both are API, not implementation detail.'
		},
		{
			title: 'Theming is opt-in, one tier at a time',
			body: 'Take the tokens, the reference theme, your own overrides, or a generated sheet of your own. Each tier is a superset of the last, and you can stop at any of them.'
		},
		{
			title: 'No bloat',
			body: 'Zero runtime dependencies. Components carry structural CSS and nothing else, and the reset, tokens, theme and utilities are separate imports you opt into.'
		},
		{
			title: 'Plain language, for you and your agents',
			body: 'The words a component ships by default are as much a part of its design as the markup. Prose a person reads without decoding is prose an agent acts on without guessing.'
		}
	];

	const navItems: NavItem[] = [
		{ label: 'Docs', href: '/docs' },
		{ label: 'Components', href: '/docs/components/button' },
		{ label: 'Theming', href: '/docs/theming/overview' },
		{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui' }
	];

	// The full index, ordered for a newcomer: the three narrative bands, then
	// the agent entry points, then one card per component group (48 component
	// links under a single heading reads as a wall). Cards are tinted by
	// intent so the bands are told apart at a glance.
	const sections = manifest.filter((e): e is ManifestSection => isSection(e));
	const named = (label: string) => sections.find((s) => s.label === label);

	const flatPages = (label: string) => {
		const section = named(label);
		return section && !isGrouped(section) ? section.children : [];
	};

	const componentGroups = (() => {
		const section = named('Components');
		return section && isGrouped(section) ? section.groups : [];
	})();

	const cards: {
		label: string;
		intent: Intent;
		pages: { label: string; href: string }[];
	}[] = [
		{ label: 'Foundation', intent: 'primary', pages: flatPages('Foundation') },
		{ label: 'Theming', intent: 'secondary', pages: flatPages('Theming') },
		{
			label: 'Agents',
			intent: 'warning',
			pages: [
				{ label: 'Writing for agents', href: '/docs/agents' },
				{ label: 'llms.txt', href: '/llms.txt' }
			]
		},
		{ label: 'Patterns', intent: 'success', pages: flatPages('Patterns') },
		...componentGroups.map((g) => ({
			label: g.label,
			intent: 'primary' as const,
			pages: g.pages
		}))
	];
</script>

<svelte:head>
	<title>@hyzer-labs/ui — Headless Svelte 5 component library</title>
	<meta
		name="description"
		content="A headless, accessible Svelte 5 component library. It ships behavior, structure, and accessibility, but no visual opinions."
	/>
</svelte:head>

<a class="skip-to-content" href="#main-content">Skip to content</a>

<Header items={navItems} ariaLabel="Site navigation" sticky bordered mobileBreakpoint="sm">
	{#snippet brand()}
		<span class="site-logo">@hyzer-labs/ui</span>
	{/snippet}
	{#snippet actions()}
		<ThemeToggle />
	{/snippet}
</Header>

<main id="main-content" tabindex="-1">
	<Hero
		layout="center"
		align="center"
		eyebrow="Svelte 5"
		title="Components that ship behavior, not opinions"
		subtitle="Accessible, headless Svelte 5 components with a token engine that grades its own contrast. Style them however you like, or skip the styling and take the reference theme."
	>
		{#snippet actions()}
			<Button href="/docs">Get started</Button>
			<Button href="/docs/components/button" variant="ghost" intent="neutral">
				Browse components
			</Button>
		{/snippet}
	</Hero>

	<Container max="lg" padding="lg">
		<Stack as="section" gap="md" aria-labelledby="commitments-heading">
			<h2 id="commitments-heading">What it commits to</h2>
			<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
				{#each commitments as c (c.title)}
					<Card class="hz-card--outlined" padding="md" rounded="md">
						<h3 class="card-title">{c.title}</h3>
						<p class="card-body">{c.body}</p>
					</Card>
				{/each}
			</Grid>
			<p><a href="/docs/philosophy">Read the philosophy &rarr;</a></p>
		</Stack>
	</Container>

	<Container max="lg" padding="lg">
		<Stack as="section" gap="md" aria-labelledby="install-heading">
			<h2 id="install-heading">Install</h2>
			<CodeBlock code="pnpm add @hyzer-labs/ui" />
			<ul class="note-list">
				<li><strong>Svelte</strong> 5.32 or newer.</li>
				<li><strong>Node</strong> 22.18 or newer. Only the <code>hyzer</code> CLI needs it.</li>
				<li><strong>TypeScript</strong> is optional. Types ship with the package.</li>
				<li><strong>SvelteKit</strong> is optional. The library imports nothing from Kit.</li>
			</ul>

			<p class="band-lead">
				Then import a component and render it. This is the whole file, and the result beside it is
				that file running with the reference theme.
			</p>
			<Split fraction="2/3" gap="md" stackBelow="md">
				<CodeBlock code={usageSvelteCode} />
				<!-- The rendered result of exactly the code beside it. -->
				<div class="proof-render">
					<Card horizontal padding="sm" class="player">
						{#snippet media()}
							<Image src={AVATAR} alt="" rounded="full" class="avatar" />
						{/snippet}
						<strong>Sam Jensen</strong>
						<span class="muted">Leicester, MA</span>
						{#snippet actions()}<Badge intent="success">1024 rated</Badge>{/snippet}
					</Card>
				</div>
			</Split>
		</Stack>
	</Container>

	<Container max="lg" padding="lg">
		<Stack as="section" gap="md" aria-labelledby="sections-heading">
			<h2 id="sections-heading">Browse the docs</h2>
			<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
				{#each cards as card (card.label)}
					<Card
						class="index-card"
						style="--accent: var(--hz-intent-{card.intent})"
						padding="md"
						rounded="md"
					>
						<h3 class="card-title">
							{card.label}
							<span class="index-count">{card.pages.length}</span>
						</h3>
						<ul class="index-pages">
							{#each card.pages as p (p.href)}
								<li><a href={p.href}>{p.label}</a></li>
							{/each}
						</ul>
					</Card>
				{/each}
			</Grid>
		</Stack>
	</Container>
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
				{ label: 'npm', href: 'https://www.npmjs.com/package/@hyzer-labs/ui' },
				{ label: 'llms.txt', href: '/llms.txt' }
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

	.site-logo {
		font-family: var(--hz-font-family-mono, monospace);
		font-weight: var(--hz-font-weight-semibold, 600);
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
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.card-body,
	.band-lead {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
		line-height: var(--hz-line-height-base, 1.5);
	}

	/* The live half of the install example — the code beside it, rendered with
	   the reference theme this site runs. Mirrors the fence's own rules. */
	.proof-render {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1.5rem;
	}

	.muted {
		display: block;
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Mirrors the fence's own rules, so the two halves stay in step. */
	.proof-render :global(.hz-card.player) {
		background: var(--hz-color-surface-muted, #f3f4f6);
		align-items: center;
		flex-direction: row;
		--hz-card-media-size: 3.5rem;
	}

	.proof-render :global(.avatar) {
		width: 3.5rem;
	}

	/* Index cards: the card is a container, only the page names are links.
	   Each band takes a soft fill in its own intent, the same mix Alert uses
	   (10% light, 22% dark — a weak tint over a dark surface barely reads as
	   color). Text stays the normal role pair, so contrast is unchanged. */
	:global(.index-card) {
		--tint: 10%;
		background-color: color-mix(in srgb, var(--accent) var(--tint), var(--hz-color-surface, #fff));
		border: var(--hz-border-width-thin, 1px) solid
			color-mix(in srgb, var(--accent) 40%, transparent);
	}

	:global([data-theme='dark'] .index-card) {
		--tint: 22%;
	}

	.index-count {
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-normal, 400);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.index-pages {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--hz-font-size-sm, 0.875rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.index-pages a {
		text-underline-offset: 0.15em;
	}
</style>
