<script lang="ts">
	/**
	 * The landing page — the most-viewed dogfood on the site, so it is built
	 * from library components and nothing else. No docs shell: this page is
	 * full-bleed, with its own header and skip link.
	 */
	import { Hero, Container, Stack, Grid, Card, Button, Badge, Image, CodeBlock, Split } from '$lib';
	import SiteChrome from '../docs/SiteChrome.svelte';
	import SizeTable from '../docs/SizeTable.svelte';
	import WhereNext from '../docs/WhereNext.svelte';
	import { gettingStartedStep, nextSteps } from '../docs/nextSteps';

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

	// The same onward links Getting Started and the error page offer, so the
	// three entry points into the docs stay in step.
	const sections = [gettingStartedStep, ...nextSteps];
</script>

<svelte:head>
	<title>@hyzer-labs/ui — Headless Svelte 5 component library</title>
	<meta
		name="description"
		content="A headless, accessible Svelte 5 component library. It ships behavior, structure, and accessibility, but no visual opinions."
	/>
</svelte:head>

<SiteChrome>
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
			<Stack as="section" gap="md" aria-labelledby="weight-heading">
				<h2 id="weight-heading">What it weighs</h2>
				<!-- Card gives the table the same padded frame the commitment cards
				     above it use, so the numbers do not sit flush against the page. -->
				<Card class="hz-card--outlined" padding="md" rounded="md">
					<SizeTable />
				</Card>
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
			<WhereNext items={sections} title="Browse the docs" id="sections-heading" />
		</Container>
	</main>
</SiteChrome>

<style>
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
</style>
