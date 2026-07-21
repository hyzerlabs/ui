<script lang="ts">
	/**
	 * A marketing landing page composed entirely from the library.
	 *
	 * This is consumer code: it imports only public exports and reaches for no
	 * docs-site helpers. The one concession to living inside the docs frame is
	 * that its own nav/footer links are bare `#` — readers browse the sample,
	 * they don't navigate away from it.
	 */
	import { Header, Hero, Container, Grid, Stack, Cluster, Card, Badge, Button, Footer } from '$lib';
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
			blurb:
				'Hand-built, relentlessly technical, and beloved for it. Bring your patience and a putter.'
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
     sidebar nav it renders inside — nested landmarks need distinct names. -->
<Header items={navItems} ariaLabel="Sample site navigation" bordered>
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
	subtitle="Course conditions, league schedules, and tee times — for players who'd rather be throwing than planning."
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

		<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
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

<Footer columns={footerColumns} headingLevel={3} bordered>
	{#snippet logo()}
		<Stack gap="xs">
			<strong>Hyzer</strong>
			<span class="muted">Throw more. Plan less.</span>
		</Stack>
	{/snippet}
	{#snippet bottom()}
		<span class="muted">&copy; 2026 Hyzer Labs — a sample composition.</span>
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
</style>
