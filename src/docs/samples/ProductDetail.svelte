<script lang="ts">
	/**
	 * A product detail page composed entirely from the library.
	 *
	 * It imports only public exports. The buy panel is
	 * live — the plastic RadioGroup drives the derived price, the Carousel
	 * pages through colorways, and "Add to cart" raises a dismissible success
	 * Alert. The active carousel slide is a lightboxGroup trigger — click it
	 * (or Tab to it and press Enter/Space) to open the full-size viewer at
	 * that colorway, still able to page through every colorway inside it.
	 * Product art is generated SVG data URIs so the sample stays
	 * self-contained.
	 *
	 * Media area — vertical thumbnail strip beside the main carousel, the
	 * classic PDP composition: `activeIndex` is bound both ways to
	 * `Carousel`'s own `index` prop, so a thumb click pages the carousel and
	 * dragging/paging the carousel updates the active thumb, via one shared
	 * value — no extra wiring. Thumbs are real `<button>`s, so
	 * `lightboxGroup`'s own interactive-ancestor exclusion (it never
	 * enhances an `<img>` inside an `<a>`/`<button>`) keeps them out of the
	 * gallery automatically: the main slide stays the one obvious
	 * open-the-viewer affordance, exactly as before.
	 */
	import {
		Breadcrumbs,
		Stack,
		Cluster,
		Split,
		Carousel,
		Image,
		Badge,
		Button,
		Alert,
		RadioGroup,
		Select,
		Accordion,
		Divider,
		lightboxGroup
	} from '$lib';
	import type { BreadcrumbItem, FormOption } from '$lib/types';

	interface Colorway {
		id: string;
		label: string;
		bg: string;
		fg: string;
	}

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '#' },
		{ label: 'Shop', href: '#' },
		{ label: 'Distance drivers', href: '#' },
		{ label: 'Voyager' }
	];

	const colorways: Colorway[] = [
		{ id: 'cosmic', label: 'Cosmic blue', bg: '1e3a8a', fg: '60a5fa' },
		{ id: 'ember', label: 'Ember orange', bg: '7c2d12', fg: 'fb923c' },
		{ id: 'meadow', label: 'Meadow green', bg: '14532d', fg: '4ade80' }
	];

	// Self-contained product art — a real shop would serve photos here.
	function discArt(colorway: Colorway): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E` +
			`%3Crect width='800' height='600' fill='%23${colorway.bg}'/%3E` +
			`%3Ccircle cx='400' cy='300' r='200' fill='%23${colorway.fg}'/%3E` +
			`%3Ccircle cx='400' cy='300' r='140' fill='none' stroke='%23ffffff' stroke-opacity='0.4' stroke-width='8'/%3E` +
			`%3C/svg%3E`
		);
	}

	// Asset-URL swap point: real photography will land at
	// static/media/products/voyager-<id>.jpg. Every render call site below
	// reads PRODUCT_MEDIA[colorway.id], never a raw URL, so pointing this map
	// at real files later is a constants-only change — nothing else in this
	// sample touches image URLs.
	const PRODUCT_MEDIA: Record<string, string> = Object.fromEntries(
		colorways.map((c) => [c.id, discArt(c)])
	);

	const flight = [
		{ label: 'Speed', value: '12' },
		{ label: 'Glide', value: '5' },
		{ label: 'Turn', value: '-1' },
		{ label: 'Fade', value: '3' }
	];

	const plasticPrices: Record<string, number> = { base: 14.99, pro: 17.99, champion: 19.99 };

	const plastics: FormOption[] = [
		{ value: 'base', label: 'Base — $14.99' },
		{ value: 'pro', label: 'Pro — $17.99' },
		{ value: 'champion', label: 'Champion — $19.99' }
	];

	const weights: FormOption[] = ['165', '168', '170', '173', '175'].map((w) => ({
		value: w,
		label: `${w} g`
	}));

	let plastic = $state('champion');
	let weight = $state('173');
	let added = $state(false);
	// Bound both ways to Carousel's own `index` — a thumb click sets it
	// (paging the carousel), and dragging/paging the carousel updates it
	// right back (moving the active thumb). One value, one direction of
	// truth either way.
	let activeIndex = $state(0);

	const price = $derived(plasticPrices[plastic]);
	const plasticLabel = $derived(
		plastics.find((p) => p.value === plastic)?.label.split(' — ')[0] ?? plastic
	);

	const sections = [
		{ id: 'description', title: 'Description' },
		{ id: 'specs', title: 'Specs' },
		{ id: 'shipping', title: 'Shipping & returns' }
	];
</script>

<Stack gap="lg" padding="lg">
	<Breadcrumbs items={breadcrumbs} ariaLabel="Shop breadcrumbs" />

	<Split fraction="1/2" gap="lg" stackBelow="md">
		<!-- lightboxGroup enhances the carousel's own rendered <img> in place —
		     no separate Lightbox component. Off-screen slides are inert (native
		     browser behavior, not this attachment), so only the active slide is
		     actually clickable/focusable; every colorway still joins the shared
		     gallery, so the viewer pages across all of them. The thumb strip
		     lives inside the same attached container, but each thumb's <img> is
		     wrapped in a <button> — lightboxGroup structurally excludes any
		     media with an interactive ancestor, so the thumbs never become
		     second triggers; they only ever drive `activeIndex`. -->
		<div class="pdp-media" {@attach lightboxGroup({ dialogLabel: 'Voyager colorways' })}>
			<div class="pdp-thumbs" role="group" aria-label="Choose a colorway">
				{#each colorways as colorway, i (colorway.id)}
					<button
						type="button"
						class="pdp-thumb"
						aria-current={i === activeIndex ? 'true' : undefined}
						aria-label={colorway.label}
						onclick={() => (activeIndex = i)}
					>
						<img src={PRODUCT_MEDIA[colorway.id]} alt="" />
					</button>
				{/each}
			</div>

			<div class="pdp-carousel">
				<Carousel
					items={colorways}
					ariaLabel="Voyager colorways"
					loop
					bind:index={activeIndex}
					slideLabel={(colorway) => colorway.label}
				>
					{#snippet slide(colorway)}
						<Image
							src={PRODUCT_MEDIA[colorway.id]}
							alt="Voyager in {colorway.label}"
							aspectRatio="4/3"
							fit="cover"
							rounded="md"
						/>
					{/snippet}
				</Carousel>
			</div>
		</div>

		<Stack gap="md">
			<Stack gap="xs">
				<p class="eyebrow">Hyzer Labs Originals</p>
				<h2>Voyager</h2>
				<Cluster gap="sm">
					{#each flight as f (f.label)}
						<Badge variant="outline" size="sm">{f.label} {f.value}</Badge>
					{/each}
				</Cluster>
			</Stack>

			<p class="price">${price.toFixed(2)}</p>

			<p class="muted">
				A workhorse distance driver with a long, controllable flight and a dependable finish.
				Predictable enough for hyzer lines off the tee, stable enough to hold a headwind.
			</p>

			<RadioGroup name="plastic" label="Plastic" options={plastics} bind:value={plastic} />

			<Select name="weight" label="Weight" options={weights} bind:value={weight} />

			<Cluster gap="sm">
				<Button intent="primary" size="lg" onclick={() => (added = true)}>Add to cart</Button>
				<Button variant="outline" size="lg">Add to wishlist</Button>
			</Cluster>

			{#if added}
				<Alert
					intent="success"
					title="Added to cart"
					headingLevel={3}
					onDismiss={() => (added = false)}
				>
					Voyager — {plasticLabel}, {weight} g.
				</Alert>
			{/if}
		</Stack>
	</Split>

	<Divider spacing="sm" />

	<Accordion items={sections} type="single" defaultOpen="description" headingLevel={3}>
		{#snippet panel(section)}
			{#if section.id === 'description'}
				<p>
					The Voyager was tuned for players who want one driver that does it all: full flex lines in
					the woods, big sweeping hyzers in the open, and a flat, late fade that keeps it in the
					fairway. The rim is comfortable for smaller hands, and the flight stays true as the disc
					beats in.
				</p>
			{:else if section.id === 'specs'}
				<ul>
					<li>Diameter: 21.1 cm</li>
					<li>Rim width: 2.2 cm</li>
					<li>Available weights: 165–175 g</li>
					<li>PDGA approved</li>
				</ul>
			{:else}
				<p>
					Free standard shipping on orders over $35. Unthrown discs can be returned within 30 days;
					field-tested discs can be exchanged within 14 days if the flight isn't right for you.
				</p>
			{/if}
		{/snippet}
	</Accordion>
</Stack>

<style>
	/* Mobile-first: the main image on top, the thumb strip a horizontal row
	   below it (column-reverse — DOM order is [thumbs, carousel], so the
	   carousel, last in the DOM, paints first). Above the sm width, it
	   flips to the classic PDP shape: a vertical thumb column on the left,
	   the main image filling the rest on the right. Split's own stackBelow
	   only stacks in DOM order without reversing it, so this bespoke
	   direction flip is hand-rolled — the sm threshold (640px) matches
	   Split's own --hz-width-sm fallback for consistency. */
	.pdp-media {
		display: flex;
		flex-direction: column-reverse;
		gap: 0.75rem;
	}

	.pdp-thumbs {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		overflow-x: auto;
	}

	.pdp-thumb {
		flex: 0 0 auto;
		width: 3.5rem;
		height: 3.5rem;
		padding: 0;
		border: 2px solid transparent;
		border-radius: var(--hz-radius-sm, 0.25rem);
		overflow: hidden;
		cursor: pointer;
		background: none;
	}

	.pdp-thumb[aria-current='true'] {
		border-color: var(--hz-intent-primary, #2563eb);
	}

	.pdp-thumb img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.pdp-carousel {
		min-width: 0;
	}

	@media (min-width: 640px) {
		.pdp-media {
			flex-direction: row;
			align-items: flex-start;
			gap: 1rem;
		}

		.pdp-thumbs {
			flex-direction: column;
			overflow-x: visible;
		}

		.pdp-carousel {
			flex: 1;
		}
	}

	h2 {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	p,
	ul {
		margin: 0;
	}

	ul {
		padding-inline-start: 1.25rem;
	}

	.eyebrow {
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--hz-color-text-muted, #6b7280);
	}

	.price {
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	.muted {
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
