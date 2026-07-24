<script lang="ts">
	/**
	 * A shop listing page composed entirely from the library.
	 *
	 * It imports only public exports. The filters are live — Select,
	 * Checkbox, and RangeSlider drive a derived list that the Grid and
	 * Pagination render — so the page demonstrates form controls as state
	 * sources, not just as visuals. Product art is generated SVG data URIs so
	 * the sample stays self-contained.
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
	import type { BreadcrumbItem, FormOption } from '$lib/types';

	interface Disc {
		name: string;
		type: string;
		price: number;
		bg: string;
		fg: string;
	}

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '#' },
		{ label: 'Shop', href: '#' },
		{ label: 'Discs' }
	];

	const discs: Disc[] = [
		{ name: 'Voyager', type: 'Distance driver', price: 19.99, bg: '1e3a8a', fg: '60a5fa' },
		{ name: 'Meridian', type: 'Fairway driver', price: 17.99, bg: '14532d', fg: '4ade80' },
		{ name: 'Keystone', type: 'Putter', price: 12.99, bg: '7c2d12', fg: 'fb923c' },
		{ name: 'Drift', type: 'Midrange', price: 15.99, bg: '581c87', fg: 'c084fc' },
		{ name: 'Summit', type: 'Distance driver', price: 21.99, bg: '164e63', fg: '22d3ee' },
		{ name: 'Cairn', type: 'Putter', price: 10.99, bg: '3f3f46', fg: 'a1a1aa' },
		{ name: 'Tributary', type: 'Fairway driver', price: 16.99, bg: '1e40af', fg: '93c5fd' },
		{ name: 'Basin', type: 'Midrange', price: 14.99, bg: '713f12', fg: 'facc15' },
		{ name: 'Apex', type: 'Distance driver', price: 23.99, bg: '7f1d1d', fg: 'f87171' },
		{ name: 'Harbor', type: 'Putter', price: 11.99, bg: '134e4a', fg: '2dd4bf' },
		{ name: 'Ridgeline', type: 'Fairway driver', price: 18.99, bg: '4c1d95', fg: 'a78bfa' },
		{ name: 'Alluvium', type: 'Midrange', price: 13.99, bg: '831843', fg: 'f472b6' }
	];

	// Self-contained product art — a real shop would serve photos here.
	function discArt(disc: Disc): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E` +
			`%3Crect width='640' height='480' fill='%23${disc.bg}'/%3E` +
			`%3Ccircle cx='320' cy='240' r='150' fill='%23${disc.fg}'/%3E` +
			`%3Ccircle cx='320' cy='240' r='104' fill='none' stroke='%23ffffff' stroke-opacity='0.4' stroke-width='6'/%3E` +
			`%3C/svg%3E`
		);
	}

	const types = ['Distance driver', 'Fairway driver', 'Midrange', 'Putter'];

	const sortOptions: FormOption[] = [
		{ value: 'featured', label: 'Featured' },
		{ value: 'price-asc', label: 'Price: low to high' },
		{ value: 'price-desc', label: 'Price: high to low' },
		{ value: 'name', label: 'Name (A–Z)' }
	];

	const PRICE_MIN = 8;
	const PRICE_MAX = 25;
	const PER_PAGE = 6;

	let sort = $state('featured');
	let checkedTypes = $state<Record<string, boolean>>(
		Object.fromEntries(types.map((t) => [t, false]))
	);
	let priceMin = $state(PRICE_MIN);
	let priceMax = $state(PRICE_MAX);
	let page = $state(1);

	const filtered = $derived.by(() => {
		const activeTypes = types.filter((t) => checkedTypes[t]);
		const matches = discs.filter(
			(d) =>
				(activeTypes.length === 0 || activeTypes.includes(d.type)) &&
				d.price >= priceMin &&
				d.price <= priceMax
		);
		if (sort === 'price-asc') return [...matches].sort((a, b) => a.price - b.price);
		if (sort === 'price-desc') return [...matches].sort((a, b) => b.price - a.price);
		if (sort === 'name') return [...matches].sort((a, b) => a.name.localeCompare(b.name));
		return matches;
	});

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
		priceMin = PRICE_MIN;
		priceMax = PRICE_MAX;
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

				<RangeSlider
					name="price"
					label="Price ($)"
					min={PRICE_MIN}
					max={PRICE_MAX}
					step={1}
					bind:valueMin={priceMin}
					bind:valueMax={priceMax}
				/>

				<Button variant="ghost" size="sm" onclick={resetFilters}>Reset filters</Button>
			</Stack>
		</aside>

		<section aria-label="Results">
			<Stack gap="md">
				{#if visible.length > 0}
					<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
						{#each visible as disc (disc.name)}
							<Card class="hz-card--outlined" padding="md" rounded="md">
								{#snippet media()}
									<Image src={discArt(disc)} alt="{disc.name} disc" aspectRatio="4/3" fit="cover" />
								{/snippet}
								<Stack gap="xs">
									<Cluster gap="sm" justify="between" align="center">
										<h3 class="card-title">{disc.name}</h3>
										<Badge variant="outline" size="sm">{disc.type}</Badge>
									</Cluster>
									<p class="price">${disc.price.toFixed(2)}</p>
								</Stack>
								{#snippet actions()}
									<Button variant="ghost" size="sm">Add to cart</Button>
								{/snippet}
							</Card>
						{/each}
					</Grid>
				{:else}
					<div class="empty">
						<Stack gap="sm" align="center">
							<p>Nothing in that range — try widening the price or clearing a type.</p>
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
