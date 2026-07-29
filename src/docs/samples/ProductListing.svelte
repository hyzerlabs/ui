<script lang="ts">
	/**
	 * A shop listing page composed entirely from the library.
	 *
	 * It imports only public exports. The filters are live: Select, Checkbox,
	 * and RangeSlider drive a derived list, and the Grid and Pagination render
	 * that list. The form controls hold the page state; they are not just
	 * visuals. Product art is generated SVG data URIs so the sample stays
	 * self-contained.
	 */
	import {
		Breadcrumbs,
		Stack,
		Cluster,
		Split,
		Grid,
		Card,
		Image,
		Badge,
		Button,
		Select,
		Checkbox,
		RangeSlider,
		Pagination
	} from '$lib';
	import type { BreadcrumbItem, FormOption, Intent } from '$lib/types';

	interface Disc {
		name: string;
		type: string;
		/** Speed, glide, turn, fade: the four numbers stamped on every disc. */
		flight: [number, number, number, number];
		/** Shop-picked. The Featured sort floats these to the top of the list. */
		featured: boolean;
		price: number;
		/** Set when the disc is on sale. The list price stays in `price`, so a
		 *  card can show both and the shopper sees what they are saving. */
		salePrice?: number;
		bg: string;
		fg: string;
	}

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '#' },
		{ label: 'Shop', href: '#' },
		{ label: 'Discs' }
	];

	// The catalog is generated rather than typed out: 48 names dealt round-robin
	// across the four disc types, with flight numbers and prices drawn from the
	// range each type really sells in. A fixed seed makes it deterministic, so
	// the server and the client render the same shop.
	const NAMES = `
		Voyager, Meridian, Keystone, Drift, Summit, Cairn, Tributary, Basin,
		Apex, Harbor, Ridgeline, Alluvium, Corsair, Vanguard, Longbow, Trebuchet,
		Slipstream, Cannonade, Frontier, Thunderhead, Windward, Switchback, Cutbank,
		Sightline, Understory, Kestrel, Threadneedle, Foothill, Quarry, Meander,
		Oxbow, Headwater, Culvert, Ferrous, Tussock, Lowland, Gravel Bar, Anchorage,
		Chalkline, Deadstop, Lantern, Bedrock, Nightjar, Threshold, Waypoint,
		Rimshot, Chainbreak, Cadence
	`
		.split(',')
		.map((n) => n.trim());

	type Range = [min: number, max: number];

	// Per type: the [min, max] each of its four flight numbers and its price
	// fall in. A putter never gets a speed 14, a driver never costs $9.
	const TYPE_SPECS: {
		type: string;
		speed: Range;
		glide: Range;
		turn: Range;
		fade: Range;
		price: Range;
	}[] = [
		{
			type: 'Distance driver',
			speed: [11, 14],
			glide: [4, 6],
			turn: [-3, 0],
			fade: [2, 4],
			price: [18, 25]
		},
		{
			type: 'Fairway driver',
			speed: [6, 9],
			glide: [4, 6],
			turn: [-3, 1],
			fade: [1, 3],
			price: [15, 20]
		},
		{
			type: 'Midrange',
			speed: [4, 5],
			glide: [3, 6],
			turn: [-2, 1],
			fade: [0, 3],
			price: [12, 17]
		},
		{ type: 'Putter', speed: [2, 3], glide: [2, 5], turn: [-1, 1], fade: [0, 2], price: [9, 14] }
	];

	// Cycled across the catalog so neighbouring cards never share a colorway.
	const COLORWAYS: [bg: string, fg: string][] = [
		['1e3a8a', '60a5fa'],
		['14532d', '4ade80'],
		['7c2d12', 'fb923c'],
		['581c87', 'c084fc'],
		['164e63', '22d3ee'],
		['3f3f46', 'a1a1aa'],
		['713f12', 'facc15'],
		['7f1d1d', 'f87171'],
		['134e4a', '2dd4bf'],
		['4c1d95', 'a78bfa'],
		['831843', 'f472b6'],
		['365314', 'bef264']
	];

	// Deterministic PRNG (mulberry32). A fixed seed keeps the server and client
	// output identical, unlike Math.random(), which would mismatch on hydrate.
	function mulberry32(seed: number): () => number {
		let a = seed;
		return () => {
			a |= 0;
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	const rand = mulberry32(20260729);
	const between = ([min, max]: Range) => min + Math.floor(rand() * (max - min + 1));

	const discs: Disc[] = NAMES.map((name, i) => {
		const spec = TYPE_SPECS[i % TYPE_SPECS.length];
		const [bg, fg] = COLORWAYS[i % COLORWAYS.length];
		const price = between(spec.price) - 0.01;
		// Every fifth disc is marked down about a fifth, landing on a .x9 price,
		// and every sixth is a shop pick. Both are just flags on the row: a real
		// shop would carry them in its catalog.
		const onSale = i % 5 === 2;
		return {
			name,
			type: spec.type,
			featured: i % 6 === 1,
			flight: [between(spec.speed), between(spec.glide), between(spec.turn), between(spec.fade)],
			price,
			salePrice: onSale ? Math.round(price * 0.8) - 0.01 : undefined,
			bg,
			fg
		};
	});

	// What a shopper actually pays. Filtering and sorting both read this, so a
	// sale price is a real price everywhere and not just a decoration on the
	// card: a $16.99 disc marked down to $12.99 sorts and filters as $12.99.
	const paid = (disc: Disc) => disc.salePrice ?? disc.price;

	// Generated product art, so this file needs no asset files to run. Swap in
	// your own photography wherever discArt is called: imported files, a static
	// path, or a CDN URL.
	function discArt(disc: Disc): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E` +
			`%3Crect width='640' height='480' fill='%23${disc.bg}'/%3E` +
			`%3Ccircle cx='320' cy='240' r='150' fill='%23${disc.fg}'/%3E` +
			`%3Ccircle cx='320' cy='240' r='104' fill='none' stroke='%23ffffff' stroke-opacity='0.4' stroke-width='6'/%3E` +
			`%3C/svg%3E`
		);
	}

	// The filter list and the catalog read the same source, so a new type is
	// one entry in TYPE_SPECS rather than two lists to keep in step.
	const types = TYPE_SPECS.map((spec) => spec.type);

	const flightKeys = ['speed', 'glide', 'turn', 'fade'] as const;
	const flightLabels = ['Speed', 'Glide', 'Turn', 'Fade'];

	// One intent per flight number, so the same number wears the same color on
	// every card. Position and the filter labels carry the meaning; the color
	// only reinforces it, which is the rule for any color-coded set.
	const flightIntents: Intent[] = ['primary', 'info', 'secondary', 'warning'];

	// The sliders span whatever the catalog actually holds, read back out of
	// the type table rather than typed again here.
	const FLIGHT_BOUNDS: Range[] = flightKeys.map((key) => [
		Math.min(...TYPE_SPECS.map((spec) => spec[key][0])),
		Math.max(...TYPE_SPECS.map((spec) => spec[key][1]))
	]);

	const sortOptions: FormOption[] = [
		{ value: 'featured', label: 'Featured' },
		{ value: 'price-asc', label: 'Price: low to high' },
		{ value: 'price-desc', label: 'Price: high to low' },
		{ value: 'name', label: 'Name (A–Z)' }
	];

	const PRICE_MIN = 8;
	const PRICE_MAX = 25;
	// Nine per page fills the three-column grid exactly, so a full page is
	// three even rows rather than a ragged last one.
	const PER_PAGE = 9;

	let sort = $state('featured');
	let checkedTypes = $state<Record<string, boolean>>(
		Object.fromEntries(types.map((t) => [t, false]))
	);
	let saleOnly = $state(false);
	let priceMin = $state(PRICE_MIN);
	let priceMax = $state(PRICE_MAX);
	// One [min, max] pair per flight number, in the same order as the chips.
	let flightRanges = $state(FLIGHT_BOUNDS.map(([min, max]) => ({ min, max })));
	let page = $state(1);

	const filtered = $derived.by(() => {
		const activeTypes = types.filter((t) => checkedTypes[t]);
		const matches = discs.filter(
			(d) =>
				(activeTypes.length === 0 || activeTypes.includes(d.type)) &&
				(!saleOnly || d.salePrice !== undefined) &&
				paid(d) >= priceMin &&
				paid(d) <= priceMax &&
				d.flight.every((n, i) => n >= flightRanges[i].min && n <= flightRanges[i].max)
		);
		if (sort === 'price-asc') return [...matches].sort((a, b) => paid(a) - paid(b));
		if (sort === 'price-desc') return [...matches].sort((a, b) => paid(b) - paid(a));
		if (sort === 'name') return [...matches].sort((a, b) => a.name.localeCompare(b.name));
		// Shop picks first. Array.sort is stable, so everything else keeps the
		// catalog order behind them.
		return [...matches].sort((a, b) => Number(b.featured) - Number(a.featured));
	});

	const saleCount = discs.filter((d) => d.salePrice !== undefined).length;

	const pageCount = $derived(Math.max(1, Math.ceil(filtered.length / PER_PAGE)));

	// Keep the page in range as filters shrink the list.
	$effect(() => {
		if (page > pageCount) page = 1;
	});

	const visible = $derived(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));

	const showingFrom = $derived(filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1);
	const showingTo = $derived(Math.min(page * PER_PAGE, filtered.length));

	function resetFilters() {
		sort = 'featured';
		checkedTypes = Object.fromEntries(types.map((t) => [t, false]));
		saleOnly = false;
		priceMin = PRICE_MIN;
		priceMax = PRICE_MAX;
		flightRanges = FLIGHT_BOUNDS.map(([min, max]) => ({ min, max }));
	}
</script>

<Stack gap="lg" padding="lg">
	<Stack gap="sm">
		<Breadcrumbs items={breadcrumbs} ariaLabel="Shop breadcrumbs" />
		<h2>Discs</h2>
		<p class="muted" aria-live="polite">
			{#if filtered.length === 0}
				No discs match the current filters.
			{:else}
				Showing {showingFrom}–{showingTo} of {filtered.length} discs.
			{/if}
		</p>
	</Stack>

	<Split fraction="1/4" gap="lg" stackBelow="md">
		<aside aria-label="Filters">
			<Stack gap="md">
				<Select name="sort" label="Sort by" options={sortOptions} bind:value={sort} />

				<fieldset>
					<legend>Disc type</legend>
					<Stack gap="xs">
						{#each types as t (t)}
							<Checkbox name="type-filter" value={t} label={t} bind:checked={checkedTypes[t]} />
						{/each}
					</Stack>
				</fieldset>

				<Checkbox name="sale-filter" label="On sale ({saleCount})" bind:checked={saleOnly} />

				<RangeSlider
					name="price"
					label="Price ($)"
					min={PRICE_MIN}
					max={PRICE_MAX}
					step={1}
					bind:valueMin={priceMin}
					bind:valueMax={priceMax}
				/>

				<!-- The chips on a card are bare numbers by design; these sliders are
				     where each one is named. -->
				<fieldset>
					<legend>Flight numbers</legend>
					<Stack gap="sm">
						{#each flightLabels as label, i (label)}
							<div class="flight-filter" style="--chip: var(--hz-intent-{flightIntents[i]})">
								<RangeSlider
									name={flightKeys[i]}
									{label}
									min={FLIGHT_BOUNDS[i][0]}
									max={FLIGHT_BOUNDS[i][1]}
									step={1}
									bind:valueMin={flightRanges[i].min}
									bind:valueMax={flightRanges[i].max}
								/>
							</div>
						{/each}
					</Stack>
				</fieldset>

				<Button variant="ghost" size="sm" onclick={resetFilters}>Reset filters</Button>
			</Stack>
		</aside>

		<section aria-label="Results">
			<Stack gap="md">
				{#if visible.length > 0}
					<!-- Three across at every width, so a page is always three even rows
					     of three. A real shop would step down on narrow screens; this one
					     holds the shape because the page-size math is the point. -->
					<Grid columns={3} gap="md">
						{#each visible as disc (disc.name)}
							<Card class="hz-card--outlined disc-card" padding="md" rounded="md">
								{#snippet media()}
									<!-- alt="": the heading below carries the name and the eyebrow
								     carries the type, so a description here repeats what a
								     screen reader has already read. -->
									<Image src={discArt(disc)} alt="" aspectRatio="4/3" fit="cover" />
								{/snippet}
								<Stack gap="xs">
									<p class="eyebrow">{disc.type}</p>
									<h3 class="card-title">{disc.name}</h3>
									<!-- The flags get their own row rather than sharing one with the
									     type: "Fairway driver" plus two badges does not fit a third of
									     the grid, and wrapping them made ragged cards. -->
									{#if disc.featured || disc.salePrice !== undefined}
										<Cluster gap="xs" align="center">
											{#if disc.featured}
												<Badge intent="success" size="sm">Featured</Badge>
											{/if}
											{#if disc.salePrice !== undefined}
												<Badge intent="danger" size="sm">Sale</Badge>
											{/if}
										</Cluster>
									{/if}
									<!-- The four numbers as they are stamped on a disc, one chip each.
									     Bare digits mean nothing without their order, so the labelled
									     reading is what a screen reader gets. -->
									<div>
										<span class="sr-only">
											{flightLabels.map((label, i) => `${label} ${disc.flight[i]}`).join(', ')}.
										</span>
										<Cluster gap="xs" aria-hidden="true">
											{#each disc.flight as value, i (i)}
												<Badge intent={flightIntents[i]} size="sm">{value}</Badge>
											{/each}
										</Cluster>
									</div>
									{#if disc.salePrice !== undefined}
										<p class="price">
											${disc.salePrice.toFixed(2)}
											<!-- The list price is struck through for sighted readers and
											     labelled for everyone else: line-through carries no meaning
											     in the accessibility tree on its own. -->
											<s class="was">
												<span class="sr-only">Was</span>
												${disc.price.toFixed(2)}
											</s>
										</p>
									{:else}
										<p class="price">${disc.price.toFixed(2)}</p>
									{/if}
								</Stack>
								{#snippet actions()}
									<Button variant="soft" size="sm">Add to cart</Button>
								{/snippet}
							</Card>
						{/each}
					</Grid>
				{:else}
					<div class="empty">
						<Stack gap="sm" align="center">
							<p>Nothing matches those filters. Try a wider price range, or clear a disc type.</p>
							<Button variant="outline" size="sm" onclick={resetFilters}>Reset filters</Button>
						</Stack>
					</div>
				{/if}

				{#if pageCount > 1}
					<Cluster justify="center">
						<Pagination count={pageCount} bind:page ariaLabel="Product pages" />
					</Cluster>
				{/if}
			</Stack>
		</section>
	</Split>
</Stack>

<style>
	h2 {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-bold, 700);
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

	.price {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	/* A dot in the same color that number's chip wears on every card, so the
	   labelled slider and the bare chip are obviously the same thing. The
	   label is rendered by RangeSlider, hence :global. */
	.flight-filter :global(.hz-field-label)::before {
		content: '';
		display: inline-block;
		width: 0.6rem;
		height: 0.6rem;
		margin-inline-end: 0.4rem;
		border-radius: 50%;
		background: var(--chip);
	}

	.eyebrow {
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Cards in a row are as tall as the tallest one (Grid stretches them), so
	   the buy button is pushed to the bottom of the content column rather than
	   floating right under a one-line name. The whole row's buttons then sit on
	   one line. `:global` because these parts are rendered by Card, not by this
	   file, and .disc-card is this file's own class on Card's root. */
	:global(.disc-card),
	:global(.disc-card .hz-card-content) {
		height: 100%;
	}

	:global(.disc-card .hz-card-content) {
		display: flex;
		flex-direction: column;
	}

	/* auto pins the button to the bottom of a stretched card; the padding keeps
	   it off the price on the short cards, where auto resolves to nothing. */
	:global(.disc-card .hz-card-actions) {
		margin-block-start: auto;
		padding-block-start: 0.75rem;
	}

	.was {
		margin-inline-start: 0.4rem;
		font-weight: var(--hz-font-weight-normal, 400);
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: none;
	}

	legend {
		padding: 0;
		margin-bottom: 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.empty {
		padding: 3rem 1rem;
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		text-align: center;
	}
</style>
