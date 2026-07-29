<script lang="ts">
	/**
	 * A marketing landing page composed entirely from the library.
	 *
	 * It imports only public exports and reaches for no docs-site helpers. The
	 * one concession to living inside the docs frame is that its own
	 * nav/footer links are bare `#`: readers browse the sample rather than
	 * navigating away from it.
	 *
	 * Below the "Popular this week" grid, the page runs a second, marketing-
	 * style Hero slice (overlay layout, full-bleed gradient background) as a
	 * mid-page break, then a row of stat cards, then closes with a contact
	 * CTA. That is the rhythm a real landing page follows: browse, promo,
	 * proof, contact.
	 */
	import { Header, Hero, Container, Grid, Stack, Cluster, Card, Badge, Button, Footer } from '$lib';
	import { revealGroup } from '$lib/motion';
	import type { NavItem, FooterColumn } from '$lib/types';

	const navItems: NavItem[] = [
		{ label: 'Courses', href: '#' },
		{ label: 'Leagues', href: '#' },
		{ label: 'Shop', href: '#' },
		{ label: 'About', href: '#' }
	];

	const courses = [
		{
			name: 'Maple Hill',
			location: 'Leicester, MA',
			holes: 18,
			par: 60,
			tag: 'Championship',
			blurb:
				'Wooded technical lines with elevation on the back nine. The Hill is a rite of passage.'
		},
		{
			name: 'Blue Ribbon Pines',
			location: 'East Bethel, MN',
			holes: 18,
			par: 61,
			tag: 'Wooded',
			blurb: 'Tight pine corridors that reward a repeatable hyzer and punish everything else.'
		},
		{
			name: 'Milo McIver',
			location: 'Estacada, OR',
			holes: 18,
			par: 58,
			tag: 'Open',
			blurb: 'Riverside meadow holes with long open bombs and a distance-friendly front nine.'
		},
		{
			name: 'Flip City',
			location: 'Shelby, MI',
			holes: 18,
			par: 63,
			tag: 'Technical',
			blurb: 'Hand-built and technical all the way through. Bring your patience and a putter.'
		},
		{
			name: 'Fox Run Meadows',
			location: 'Kansas City, MO',
			holes: 18,
			par: 57,
			tag: 'Mixed',
			blurb: 'Rolling meadow with just enough trees to make the lines feel earned.'
		},
		{
			name: 'Idlewild',
			location: 'Burlington, KY',
			holes: 18,
			par: 65,
			tag: 'Championship',
			blurb: 'Long, wooded, and unforgiving. Widely rated among the hardest layouts in the country.'
		}
	];

	const stats = [
		{ value: '8,400+', label: 'Courses mapped' },
		{ value: '1.6M', label: 'Rounds logged this year' },
		{ value: '62', label: 'Countries with active leagues' },
		{ value: '4.3', label: 'Average course rating out of 5' }
	];

	const footerColumns: FooterColumn[] = [
		{
			title: 'Play',
			links: [
				{ label: 'Find a course', href: '#' },
				{ label: 'Leagues', href: '#' },
				{ label: 'Tournaments', href: '#' }
			]
		},
		{
			title: 'Learn',
			links: [
				{ label: 'Beginner guide', href: '#' },
				{ label: 'Disc selection', href: '#' },
				{ label: 'Rules', href: '#' }
			]
		},
		{
			title: 'Company',
			links: [
				{ label: 'About', href: '#' },
				{ label: 'Careers', href: '#' },
				{ label: 'Contact', href: '#' }
			]
		}
	];
</script>

<!-- The sample's own header. Its nav's label distinguishes it from the docs
     sidebar nav it renders inside. Nested landmarks need distinct names. -->
<!-- mobileBreakpoint="sm": four short links and one button fit in the bar well
     below the md default of 968px, so the bar keeps its full width down to
     640px instead of collapsing to a menu button while there is room to
     spare. -->
<Header items={navItems} ariaLabel="Sample site navigation" bordered mobileBreakpoint="sm">
	{#snippet brand()}
		<strong>Hyzer</strong>
	{/snippet}
	{#snippet actions()}
		<Button intent="primary" size="sm">Find a course</Button>
	{/snippet}
</Header>

<!-- headingLevel=2: the route's own h1 is the page title, so the sample's top
     heading sits a level below it rather than competing for the document's h1. -->
<Hero
	headingLevel={2}
	eyebrow="Over 8,000 courses"
	title="Find your next round."
	subtitle="Course conditions, league schedules, and tee times, for players who'd rather be throwing than planning."
>
	{#snippet actions()}
		<Cluster gap="sm" justify="center">
			<Button intent="primary" size="lg">Browse courses</Button>
			<Button variant="outline" size="lg">Join a league</Button>
		</Cluster>
	{/snippet}
</Hero>

<Container padding="lg">
	<Stack gap="lg">
		<Stack gap="xs">
			<h3>Popular this week</h3>
			<p class="muted">Courses players are logging the most rounds on right now.</p>
		</Stack>

		<!-- The cards rise in as the grid scrolls into view, one after another.
		     revealGroup puts a single observer on the grid rather than one per
		     card, and it does nothing at all under prefers-reduced-motion. -->
		<Grid
			columns={{ sm: 1, md: 2, lg: 3 }}
			gap="md"
			{@attach revealGroup({ effect: 'fly', stagger: 80 })}
		>
			{#each courses as course (course.name)}
				<Card class="hz-card--outlined" padding="md" rounded="md">
					<Stack gap="sm">
						<Cluster gap="sm" justify="between" align="center">
							<h4 class="card-title">{course.name}</h4>
							<!-- The tag text carries the meaning; the color only reinforces it. -->
							<Badge size="sm">{course.tag}</Badge>
						</Cluster>
						<p class="muted">{course.location}</p>
						<p>{course.blurb}</p>
						<Cluster gap="sm">
							<Badge variant="outline" size="sm">{course.holes} holes</Badge>
							<Badge variant="outline" size="sm">Par {course.par}</Badge>
						</Cluster>
					</Stack>
					{#snippet actions()}
						<Button variant="ghost" size="sm">View course</Button>
					{/snippet}
				</Card>
			{/each}
		</Grid>
	</Stack>
</Container>

<!-- A second, marketing-style Hero. It takes a full-bleed gradient background
     from the overlay layout instead of the top Hero's plain surface, breaking
     up the page the way a real landing page's mid-page promo banner would. -->
<Hero
	layout="overlay"
	headingLevel={2}
	eyebrow="Fall league registration"
	title="Six-week leagues. No experience required."
	subtitle="Card up with players at your skill level and play the same course every week this fall. Divisions run from beginner to advanced."
>
	{#snippet media()}
		<div class="promo-media" aria-hidden="true"></div>
	{/snippet}
	{#snippet actions()}
		<Cluster gap="sm" justify="center">
			<Button intent="primary" size="lg">Find a league</Button>
			<Button variant="outline" size="lg">See how leagues work</Button>
		</Cluster>
	{/snippet}
</Hero>

<Container padding="lg">
	<Stack gap="lg">
		<Stack gap="xs">
			<h3>Hyzer by the numbers</h3>
			<p class="muted">A snapshot of the community logging rounds through the app.</p>
		</Stack>

		<Grid
			columns={{ sm: 1, md: 2, lg: 4 }}
			gap="md"
			{@attach revealGroup({ effect: 'fly', stagger: 80 })}
		>
			{#each stats as stat (stat.label)}
				<Card class="hz-card--outlined" padding="lg" rounded="md">
					<Stack gap="xs">
						<span class="stat-number">{stat.value}</span>
						<span class="stat-label muted">{stat.label}</span>
					</Stack>
				</Card>
			{/each}
		</Grid>
	</Stack>
</Container>

<Container padding="lg">
	<Stack gap="sm" align="center" class="contact-cta">
		<h3>Have a course to add, or a question about leagues?</h3>
		<p class="muted">Our team answers every message within a business day.</p>
		<Button intent="primary" size="lg">Contact us</Button>
	</Stack>
</Container>

<Footer columns={footerColumns} headingLevel={3} bordered>
	{#snippet logo()}
		<Stack gap="xs">
			<strong>Hyzer</strong>
			<span class="muted">Throw more. Plan less.</span>
		</Stack>
	{/snippet}
	{#snippet bottom()}
		<span class="muted">&copy; 2026 Hyzer Labs (a sample composition).</span>
	{/snippet}
</Footer>

<style>
	h3 {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.card-title {
		margin: 0;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0;
	}

	.muted {
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	/* Marketing-slice Hero background: a bolder gradient than the Hero docs
	 * page's own demo swatch, but still mixed toward the surface color so the
	 * default (unstyled) hero text keeps its normal contrast on top of it. */
	.promo-media {
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--hz-intent-primary, #2563eb) 30%, var(--hz-color-surface, #fff)),
			color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 30%, var(--hz-color-surface, #fff))
		);
	}

	.stat-number {
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
		line-height: var(--hz-line-height-tight, 1.2);
	}

	.stat-label {
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	/* .contact-cta lands on Stack's rendered root, not a literal element in
	 * this file, so the ancestor segment has to be marked :global. h3 and p
	 * stay literal children here and keep their normal scoping. */
	:global(.contact-cta) h3,
	:global(.contact-cta) p {
		text-align: center;
	}

	:global(.contact-cta) p {
		max-width: 42ch;
	}
</style>
