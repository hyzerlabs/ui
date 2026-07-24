<script lang="ts">
	/**
	 * A recipe page composed entirely from the library.
	 *
	 * It imports only public exports. The main dish photo is a `Hero`'s own
	 * `split` layout — title/subtitle beside the photo, the same media form
	 * the Hero docs page's split demo uses — rather than a bare `<Image>` at
	 * the top of the page. A short prose intro and the serving/dietary
	 * metadata sit under the hero, before the ingredient list starts. The
	 * ingredient list is a plain, non-sorting Table (the same PropsTable-style
	 * columns config the Table docs page's "No sorting" demo uses — no
	 * `sortable` flag, no sort buttons) placed in a `Split` next to the
	 * technique Video, so a reader can follow the clip with the ingredient
	 * amounts still in view; `Split`'s `stackBelow` collapses the pair to one
	 * column on narrow viewports. The method is step-by-step prose with a
	 * photo along the way.
	 */
	import { Hero, Video, Table, Image, Badge, Divider, Split, Stack, Cluster } from '$lib';
	import type { TableColumn } from '$lib/types';

	interface Ingredient {
		item: string;
		amount: string;
		notes?: string;
	}

	const ingredients: Ingredient[] = [
		{ item: 'Ground beef (85/15)', amount: '2 lb', notes: 'Or plant-based crumbles' },
		{ item: 'Yellow onion, diced', amount: '1 large' },
		{ item: 'Garlic, minced', amount: '3 cloves' },
		{ item: 'Bell peppers, diced', amount: '2' },
		{ item: 'Kidney beans, drained and rinsed', amount: '2 (15 oz) cans' },
		{ item: 'Crushed tomatoes', amount: '2 (28 oz) cans' },
		{ item: 'Chili powder', amount: '2 tbsp' },
		{ item: 'Ground cumin', amount: '1 tbsp' },
		{ item: 'Smoked paprika', amount: '1 tsp' },
		{ item: 'Kosher salt', amount: '1 tsp', notes: 'Plus more to taste' },
		{ item: 'Shredded cheddar', amount: 'For serving', notes: 'Omit for dairy-free' },
		{ item: 'Sliced scallions', amount: 'For serving' }
	];

	// No `sortable` on any column — this is the plain, non-sorting shape (the
	// Table docs page's own "No sorting" demo), not a client/external-sort one.
	const columns: TableColumn<Ingredient>[] = [
		{ key: 'item', header: 'Ingredient' },
		{ key: 'amount', header: 'Amount', align: 'end' },
		{ key: 'notes', header: 'Notes' }
	];

	// Self-contained food photography — a real recipe would serve photos and
	// a filmed clip here. Asset-URL swap point: real media will land at
	// static/media/recipes/league-night-chili-<slot>.{jpg,mp4}. The two
	// render call sites below read RECIPE_MEDIA[key], never a raw URL, so
	// pointing this map at real files later is a constants-only change.
	function foodArt(label: string, bg: string, fg: string): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E` +
			`%3Crect width='800' height='600' fill='%23${bg}'/%3E` +
			`%3Ccircle cx='400' cy='300' r='220' fill='%23${fg}'/%3E` +
			`%3Ctext x='50%25' y='94%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='20' font-family='system-ui'%3E` +
			encodeURIComponent(label) +
			`%3C/text%3E%3C/svg%3E`
		);
	}

	function posterArt(label: string): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%237c2d12'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='22' font-family='system-ui'%3E` +
			encodeURIComponent(label) +
			`%3C/text%3E%3C/svg%3E`
		);
	}

	const RECIPE_MEDIA = {
		finished: foodArt('Finished chili, ready to serve', '7c2d12', 'fb923c'),
		simmering: foodArt('The pot at the 45-minute mark', '78350f', 'fbbf24'),
		videoPoster: posterArt('Building the base — watch')
	};

	// about:blank: no real clip exists yet — the aspect box and poster still
	// render, same convention as the Video docs page's own demos.
	const videoSrc = 'about:blank';
</script>

<Stack gap="away" padding="lg">
	<!-- headingLevel=2: the route's own h1 is the page title, so the sample's
	     top heading sits a level below it rather than competing for the
	     document's h1. layout="split": the finished-dish photo sits beside
	     the title/subtitle instead of stacked above it — Hero's media form
	     for a page that opens on a photograph. -->
	<Hero
		layout="split"
		headingLevel={2}
		title="Leicester League-Night Chili"
		subtitle="A dutch-oven chili built to feed a full card after a wet Sunday round — thick enough to hold a spoon upright, and it only gets better reheated for Monday's leftovers."
	>
		{#snippet media()}
			<Image
				src={RECIPE_MEDIA.finished}
				alt="A bowl of chili topped with shredded cheddar and scallions"
				aspectRatio="4/3"
				fit="cover"
				rounded="md"
			/>
		{/snippet}
	</Hero>

	<Stack gap="sm">
		<Cluster gap="sm">
			<span class="meta">Serves 6</span>
			<span class="meta" aria-hidden="true">·</span>
			<span class="meta">Prep 15 min</span>
			<span class="meta" aria-hidden="true">·</span>
			<span class="meta">Cook 1 hr</span>
		</Cluster>
		<Cluster gap="sm">
			<Badge variant="outline" size="sm">Gluten-free</Badge>
			<Badge variant="outline" size="sm">Freezer-friendly</Badge>
			<Badge variant="outline" size="sm">Dairy-free option</Badge>
		</Cluster>
		<div class="prose">
			<p>
				This one started as a way to feed the whole card after a wet Sunday round at Maple Hill —
				something that could sit on low heat in a crockpot at the clubhouse while the last few
				groups finished up. It's built thick enough to eat standing up with a plastic fork, which,
				on league night, is usually exactly how it gets eaten.
			</p>
			<p>
				It keeps for four days in the fridge and freezes well in individual portions — pack it flat
				in a freezer bag and it thaws in about twenty minutes under hot water, which makes it a
				reasonable answer to "what's for dinner" after a Tuesday doubles round.
			</p>
		</div>
	</Stack>

	<!-- Ingredients and the technique clip side by side, so a reader can check
	     an amount without losing their place in the video. stackBelow="sm"
	     (not the Hero split's own "md") because this Split sits inside the
	     page's own padded column rather than spanning a full breakout — table
	     above video below sm keeps both columns legible without cramming a
	     three-column table into a narrow half. -->
	<Split fraction="1/2" gap="lg" stackBelow="sm">
		<Stack gap="near">
			<h3>Ingredients</h3>
			<Table items={ingredients} {columns} caption="Chili ingredients" />
		</Stack>
		<Stack gap="near">
			<h3>Watch: building the base</h3>
			<Video
				src={videoSrc}
				title="Building the chili base"
				poster={RECIPE_MEDIA.videoPoster}
				aspectRatio="16/9"
			/>
		</Stack>
	</Split>

	<Divider spacing="none" />

	<Stack gap="md">
		<h3>Instructions</h3>
		<ol class="steps">
			<li>
				<strong>Brown the beef.</strong> Heat a large dutch oven over medium-high heat. Add the ground
				beef and cook, breaking it apart with a spoon, until no pink remains, about 8 minutes. Drain the
				excess fat and transfer the beef to a bowl.
			</li>
			<li>
				<strong>Build the aromatics.</strong> In the same pot, add the onion and bell peppers and cook
				until softened, about 5 minutes. Add the garlic and cook until fragrant, about 30 seconds.
			</li>
			<li>
				<strong>Bring it together.</strong> Return the beef to the pot. Stir in the crushed tomatoes,
				kidney beans, chili powder, cumin, smoked paprika, and salt. Bring to a simmer.
			</li>
			<li>
				<strong>Simmer low and slow.</strong> Reduce the heat to low, cover partially, and simmer for
				45 minutes, stirring occasionally, until the chili has thickened and the flavors have melded.
			</li>
			<li>
				<strong>Taste and adjust.</strong> Taste and add more salt if needed. If the chili is thicker
				than you'd like, thin it with a splash of water or broth.
			</li>
			<li>
				<strong>Serve.</strong> Ladle into bowls and top with shredded cheddar and scallions.
			</li>
		</ol>

		<Image
			src={RECIPE_MEDIA.simmering}
			alt="The chili at the 45-minute simmer mark, deep red and thick enough to coat a spoon"
			aspectRatio="4/3"
			fit="cover"
			rounded="md"
		/>
	</Stack>
</Stack>

<style>
	h3 {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0;
	}

	.prose {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.meta {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding-inline-start: 1.25rem;
	}
</style>
