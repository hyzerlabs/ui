<script lang="ts">
	/**
	 * The landing page, the most-viewed dogfood on the site, so it is built
	 * from library components and nothing else. No docs shell: this page is
	 * full-bleed, with its own header and skip link.
	 */
	import {
		Hero,
		Container,
		Stack,
		Grid,
		Card,
		Button,
		Badge,
		CodeBlock,
		Split,
		Metatags
	} from '$lib';
	import SiteChrome from '../docs/SiteChrome.svelte';
	import SizeTable from '../docs/SizeTable.svelte';
	import WhereNext from '../docs/WhereNext.svelte';
	import { gettingStartedStep, nextSteps } from '../docs/nextSteps';

	const usageSvelteCode = [
		'<script>',
		"\timport { Card, Badge, Button } from '@hyzer-labs/ui';",
		'</' + 'script>',
		'',
		'<Card padding="sm" class="conditions">',
		'\t<strong>Maple Hill</strong>',
		'\t<span class="muted">18 holes · open at dawn</span>',
		'\t<Badge intent="success">Greens fast</Badge>',
		'\t<Badge intent="warning">Wind picking up</Badge>',
		'\t{#snippet actions()}',
		'\t\t<Button size="sm">Book a tee time</Button>',
		'\t{/snippet}',
		'</Card>',
		'',
		'<' + 'style>',
		'\t/* The class prop lands on the component root, but Svelte scopes',
		'\t   selectors to elements in your own markup, so target it with',
		'\t   :global. */',
		'\t:global(.conditions) {',
		'\t\tbackground: var(--hz-color-surface-muted);',
		'\t\tmax-inline-size: 24rem;',
		'\t}',
		'',
		'\t.muted {',
		'\t\tdisplay: block;',
		'\t\tcolor: var(--hz-color-text-muted);',
		'\t\tmargin-block-end: 0.75rem;',
		'\t}',
		'</' + 'style>'
	].join('\n');

	// The Philosophy commitments, as headlines only. /docs/philosophy carries
	// the argument for each. Landing pages get scanned, not read.
	// Each card links to its own section of the Philosophy page, which is
	// what earns the cards their hover treatment: they are real links.
	const commitments = [
		{
			title: 'Accessibility first',
			href: '/docs/philosophy#a11y-heading',
			body: 'Every component ships its WAI-ARIA pattern in full: roles, keyboard, focus. Restyling cannot turn it off.'
		},
		{
			title: 'Headless structure, overridable',
			href: '/docs/philosophy#headless-heading',
			body: 'The hz-* classes and data-* hooks hand you the styling; snippets hand you the markup. Both are documented API.'
		},
		{
			title: 'Theming is opt-in, one tier at a time',
			href: '/docs/philosophy#theming-heading',
			body: 'Tokens, the reference theme, your own overrides, or a generated sheet. Stop at any tier.'
		},
		{
			title: 'No bloat',
			href: '/docs/philosophy#bloat-heading',
			body: 'Components carry structural CSS and nothing else. Svelte is the only peer dependency, and nothing extra reaches your production bundle.'
		},
		{
			title: 'Plain language, for you and your agents',
			href: '/docs/philosophy#plain-heading',
			body: "A component's labels, error messages and empty states are part of its design. We write them short and skip the jargon."
		}
	];

	// The styles the package deliberately does not bundle. Same tier-one
	// snippet Getting Started opens with, marked optional in both places.
	const themeImportCode = [
		"@import '@hyzer-labs/ui/tokens.css';",
		"@import '@hyzer-labs/ui/theme';",
		"@import '@hyzer-labs/ui/utilities.css'; /* optional */"
	].join('\n');

	// The same onward links Getting Started and the error page offer, so the
	// three entry points into the docs stay in step.
	const sections = [gettingStartedStep, ...nextSteps];
</script>

<!-- No image prop: the site ships no og image yet, so the summary card is
     correct until it does. No siteName either. The title alone already carries
     the site name ("@hyzer-labs/ui — …"), and title always composes before
     siteName, so adding siteName here would append a second "@hyzer-labs/ui"
     and change the <title> text this page has to keep unchanged. -->
<Metatags
	siteUrl="https://design.hyzer.sh"
	url="/"
	title="@hyzer-labs/ui — Headless Svelte 5 component library"
	description="A headless, accessible Svelte 5 component library. It ships structure, behavior, and flexibility."
/>

<SiteChrome>
	<main id="main-content" tabindex="-1">
		<Hero
			layout="center"
			align="center"
			height="half"
			class="home-hero"
			eyebrow="@hyzer-labs/ui"
			title="Components that ship behavior, not opinions"
			subtitle="Accessible, headless components for Svelte 5. Style them yourself, or keep the reference theme."
		>
			{#snippet actions()}
				<Button href="/docs">Get started</Button>
				<Button href="/docs/components/button" variant="ghost" intent="neutral">
					Browse components
				</Button>
			{/snippet}
		</Hero>

		<div class="band band-warning">
			<Container max="lg" padding="lg">
				<Stack as="section" gap="md" aria-labelledby="commitments-heading">
					<h2 id="commitments-heading">What this library commits to</h2>
					<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
						{#each commitments as c (c.title)}
							<Card
								class="hz-card--outlined expressive-card"
								href={c.href}
								ariaLabel={c.title}
								padding="md"
							>
								<h3 class="hz-card-title">{c.title}</h3>
								<p class="card-body">{c.body}</p>
							</Card>
						{/each}
					</Grid>
				</Stack>
			</Container>
		</div>

		<div class="band band-striped">
			<Container max="lg" padding="lg">
				<Stack as="section" gap="md" aria-labelledby="weight-heading">
					<h2 id="weight-heading">What it weighs</h2>
					<!-- Card gives the table the same padded frame the commitment cards
					     above it use, so the numbers do not sit flush against the page.
					     Its opaque surface also keeps the table legible over the band's
					     stripes. -->
					<Card class="hz-card--outlined weight-card" padding="md" rounded="md">
						<SizeTable />
					</Card>
				</Stack>
			</Container>
		</div>

		<Container max="lg" padding="lg">
			<Stack as="section" gap="md" aria-labelledby="install-heading">
				<h2 id="install-heading">Install</h2>
				<!-- Two titled halves: the package, then the styles it deliberately
				     does not bundle. Same tier-one CSS snippet Getting Started opens
				     with, so the two entry points stay in step. -->
				<Grid columns={{ sm: 1, md: 2 }} gap="md">
					<CodeBlock title="Terminal" code="pnpm add @hyzer-labs/ui" />
					<CodeBlock title="src/app.css" language="css" code={themeImportCode} />
				</Grid>
				<ul class="note-list">
					<li><strong>Svelte</strong> 5.32 or newer.</li>
					<li><strong>Node</strong> 22.18 or newer. Only the <code>hyzer</code> CLI needs it.</li>
					<li><strong>TypeScript</strong> is optional. Types ship with the package.</li>
					<li><strong>SvelteKit</strong> is optional. The library imports nothing from Kit.</li>
				</ul>

				<p class="band-lead">
					Then import a component and render it. The code below is a whole file. Beside it is that
					same file, rendered with the reference theme.
				</p>
				<Split fraction="2/3" gap="md" stackBelow="md">
					<CodeBlock code={usageSvelteCode} />
					<!-- The rendered result of exactly the code beside it. -->
					<div class="proof-render">
						<Card padding="sm" class="conditions">
							<strong>Maple Hill</strong>
							<span class="muted">18 holes · open at dawn</span>
							<Badge intent="success">Greens fast</Badge>
							<Badge intent="warning">Wind picking up</Badge>
							{#snippet actions()}
								<Button size="sm">Book a tee time</Button>
							{/snippet}
						</Card>
					</div>
				</Split>
			</Stack>
		</Container>

		<div class="band band-bold band-triangles">
			<Container max="lg" padding="lg">
				<WhereNext items={sections} title="Browse the docs" id="sections-heading" />
			</Container>
		</div>
	</main>
</SiteChrome>

<style>
	h2 {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.card-body,
	.band-lead {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
		line-height: var(--hz-line-height-base, 1.5);
	}

	/* Muted opening surface so the hero, the plain install section, and the
	   striped band each read as their own field. Styled through Hero's class
	   prop. */
	:global(.home-hero.hz-hero) {
		background: var(--hz-color-surface-muted, #f3f4f6);
	}

	/* Full-bleed section bands. The wrapper carries the background; the
	   Container inside keeps centering the content as before. */
	.band-striped {
		/* Solid info intent under the diagonal stripes, matching the page's
		   other intent bands; the stripes and borders pull toward the black
		   anchor the same way the card frames do. */
		background-color: color-mix(
			in srgb,
			var(--hz-intent-secondary, #7c3aed) 90%,
			var(--hz-color-black, #000)
		);
		background-image: repeating-linear-gradient(
			-45deg,
			transparent 0 12px,
			color-mix(in srgb, var(--hz-color-black, #000) 22%, transparent) 12px 14px
		);
		border-block: 1px solid
			color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 65%, var(--hz-color-black, #000));
	}

	/* An opaque surface so the size table reads over the stripes. */
	.band-striped :global(.weight-card) {
		background: var(--hz-color-surface, #fff);
	}

	/* On narrow screens the band gutter, card padding, and table padding
	   compound until the stacked rows have no room. Tighten the outer two;
	   the stacked table keeps the space that matters. */
	@media (max-width: 640px) {
		.band-striped :global(.hz-container) {
			padding-inline: 0.75rem;
		}

		.band-striped :global(.weight-card) {
			padding: 0.5rem;
		}

		/* The tightened band gutter pulls this heading out of line with the
		   other sections' titles; restore the shared alignment. Only needed
		   while the mobile gutter override above is active. */
		.band-striped h2 {
			margin-inline-start: var(--hz-space-lg, 4rem);
		}
	}

	/* Solid intent bands, no softening. On-fill text is the surface role,
	   not white, so it flips with the mode and stays readable on the fill in
	   both: the solid Banner's own pairing. Cards inside keep an opaque
	   muted surface so their text roles hold. */
	.band-bold {
		background-color: var(--hz-intent-info, #0891b2);
		--card-frame: color-mix(
			in srgb,
			var(--hz-intent-info, #0891b2) 65%,
			var(--hz-color-black, #000)
		);
	}

	/* The dark palette lightens primary and secondary toward each other, so
	   the band and the primary footer blur together. Deepen the band's
	   secondary against the dark surface to keep them apart; both dark
	   entries (explicit choice, system default) get the same rule. */
	:global([data-theme='dark']) .band-bold {
		background-color: color-mix(
			in srgb,
			var(--hz-intent-info, #0891b2) 55%,
			var(--hz-color-surface, #000)
		);
		--card-frame: var(--hz-intent-info, #0891b2);
	}

	/* The deepened dark band is too dark for the surface-role (black) on-fill
	   text; the text role (near-white) clears AA against it in dark. */
	:global([data-theme='dark']) .band-bold :global(h2) {
		color: var(--hz-color-text, #fff);
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme])) .band-bold {
			background-color: color-mix(
				in srgb,
				var(--hz-intent-info, #0891b2) 55%,
				var(--hz-color-surface, #000)
			);
			--card-frame: var(--hz-intent-info, #0891b2);
		}

		:global(:root:not([data-theme])) .band-bold :global(h2) {
			color: var(--hz-color-text, #fff);
		}
	}

	/* A light triangle tessellation (the classic four-gradient zigzag) off
	   the border role, faint enough that normal text roles keep working.
	   Flips with the mode through the border role itself. */
	.band-triangles {
		/* A right-triangle lattice: square grid plus one diagonal, with every
		   line running edge to edge so tiles connect into one continuous
		   geometric pattern instead of repeated stamps. Same SVG technique and
		   transparent-black ink as the wave band. */
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M0 0 H32 M0 0 V32 M32 0 L0 32' fill='none' stroke='rgba(0,0,0,0.22)' stroke-width='1.5'/%3E%3C/svg%3E");
		background-size: 32px 32px;
	}

	.band-warning {
		background-color: var(--hz-intent-warning, #d97706);
		/* Sine-wave texture, inked in transparent black so it reads as a
		   shade darker than the fill in both modes. Inline SVG because CSS
		   gradients cannot draw a true sine curve. */
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='28' viewBox='0 0 48 28'%3E%3Cpath d='M0 14 Q12 4 24 14 T48 14' fill='none' stroke='rgba(0,0,0,0.12)' stroke-width='2'/%3E%3C/svg%3E");
		background-size: 48px 28px;
		/* The card frames borrow the intent they sit on, pulled toward the
		   black anchor so the frame separates from the band instead of
		   melting into it. Pages with no band fall back to the text role. */
		--card-frame: color-mix(
			in srgb,
			var(--hz-intent-warning, #d97706) 65%,
			var(--hz-color-black, #000)
		);
	}

	.band-bold :global(h2),
	.band-striped :global(h2),
	.band-warning :global(h2) {
		color: var(--hz-color-surface, #fff);
	}

	.band-bold :global(.hz-card),
	.band-warning :global(.hz-card) {
		background: var(--hz-color-surface-muted, #f3f4f6);
	}

	/* The loud expressive-card frame lives in src/docs/chrome.css, shared
	   with the "Where to go next" cards. Styled through Card's class prop;
	   the radius deliberately replaces the rounded prop, which has no
	   per-corner form. */

	/* The live half of the install example: the code beside it, rendered with
	   the reference theme this site runs. Mirrors the fence's own rules. */
	.proof-render {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1.5rem;
		background: var(--hz-color-surface, #fff);
	}

	.muted {
		display: block;
		color: var(--hz-color-text-muted, #6b7280);
		margin-block-end: 0.75rem;
	}

	/* Mirrors the fence's own rules, so the two halves stay in step. */
	.proof-render :global(.hz-card.conditions) {
		background: var(--hz-color-surface-muted, #f3f4f6);
		max-inline-size: 24rem;
	}
</style>
