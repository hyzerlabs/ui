<script lang="ts">
	import { Carousel, Card, Blockquote, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { carouselDoc } from '../../../../docs/data/carousel.js';
	import Example from '../../../../docs/Example.svelte';

	const products = [
		'Alpine',
		'Cascade',
		'Delta',
		'Ember',
		'Fjord',
		'Grove',
		'Harbor',
		'Ivy',
		'Juniper',
		'Kestrel'
	];

	const quotes = [
		{
			text: 'The density spacing sold me: one prop, correct rhythm everywhere.',
			who: 'Beta user'
		},
		{
			text: 'Headless plus a real reference theme is exactly the right split.',
			who: 'Design lead'
		},
		{
			text: 'The container-query grid removed a whole breakpoint spreadsheet.',
			who: 'Frontend dev'
		}
	];

	const basicCode = [
		'<Carousel items={quotes} ariaLabel="Customer quotes">',
		'\t{#snippet slide(quote)}',
		'\t\t<Blockquote cite={quote.who}>{quote.text}</Blockquote>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	const loopCode = [
		'<!-- loop: wraps in both directions, controls never disable -->',
		'<Carousel items={quotes} loop ariaLabel="Customer quotes">',
		'\t{#snippet slide(quote)}',
		'\t\t<Blockquote cite={quote.who}>{quote.text}</Blockquote>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	const dotsCode = [
		'<Carousel items={quotes} indicator="dots" ariaLabel="Customer quotes">',
		'\t{#snippet slide(quote)}',
		'\t\t<Blockquote cite={quote.who}>{quote.text}</Blockquote>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	const dragCode = [
		'<!-- controls="focus": the row is hidden until hover/focus reveals it -->',
		'<!-- seamless: every ±1 loop wrap settles through a clone, never a -->',
		'<!-- backward sweep through the row -->',
		'<Carousel',
		'\tdraggable',
		'\tloop',
		'\tseamless',
		'\tcontrols="focus"',
		'\titems={quotes}',
		'\tariaLabel="Customer quotes (drag)"',
		'>',
		'\t{#snippet slide(quote)}',
		'\t\t<Blockquote cite={quote.who}>{quote.text}</Blockquote>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	// Minimal-controls restyle (theme example): dots become flat segments of a
	// thin progress trackline via a plain consumer class — no new component
	// API. Chevrons stay in the DOM and fully operable (never display/
	// visibility/aria-hidden/inert) but are visually hidden until they
	// receive keyboard focus, the same a11y posture controls="focus" already
	// ships, applied here to two individual controls instead of the whole row.
	const minimalCode = [
		'<Carousel',
		'\titems={quotes}',
		'\tindicator="dots"',
		'\tariaLabel="Customer quotes"',
		'\tclass="minimal-carousel"',
		'>',
		'\t{#snippet slide(quote)}',
		'\t\t<Blockquote cite={quote.who}>{quote.text}</Blockquote>',
		'\t{/snippet}',
		'</Carousel>',
		'',
		'<' + 'style>',
		'\t:global(.minimal-carousel .hz-carousel-controls) {',
		'\t\tgap: 0.5rem;',
		'\t}',
		'',
		'\t/* Hidden until :focus-visible: still in the DOM, in the tab order,',
		'\t   and Enter/Space-operable throughout; never display/visibility/',
		'\t   aria-hidden/inert. */',
		'\t:global(.minimal-carousel .hz-carousel-prev),',
		'\t:global(.minimal-carousel .hz-carousel-next) {',
		'\t\topacity: 0;',
		'\t}',
		'',
		'\t:global(.minimal-carousel .hz-carousel-prev:focus-visible),',
		'\t:global(.minimal-carousel .hz-carousel-next:focus-visible) {',
		'\t\topacity: 1;',
		'\t}',
		'',
		'\t:global(.minimal-carousel .hz-carousel-dots) {',
		'\t\tflex: 1;',
		'\t\tgap: 0.25rem;',
		'\t}',
		'',
		'\t:global(.minimal-carousel .hz-carousel-dot) {',
		'\t\twidth: auto;',
		'\t\tflex: 1;',
		'\t\theight: 3px;',
		'\t\tborder-radius: var(--hz-radius-full);',
		'\t\tscale: 1;',
		'\t\tbackground-color: var(--hz-color-border);',
		'\t}',
		'',
		'\t:global(.minimal-carousel .hz-carousel-dot[data-active]) {',
		'\t\tscale: 1;',
		'\t\tbackground-color: var(--hz-intent-primary);',
		'\t}',
		'</' + 'style>'
	].join('\n');

	const railBasicCode = [
		'<Carousel items={products} layout="rail" ariaLabel="Featured products">',
		'\t{#snippet slide(product)}',
		'\t\t<Card>{product}</Card>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	const railSizingCode = [
		'<!-- A plain value: every card is 12rem wide, with a wider gap. -->',
		'<Carousel',
		'\titems={products}',
		'\tlayout="rail"',
		'\tariaLabel="Featured products"',
		'\tclass="rail-fixed-width"',
		'>',
		'\t{#snippet slide(product)}',
		'\t\t<Card>{product}</Card>',
		'\t{/snippet}',
		'</Carousel>',
		'',
		'<' + 'style>',
		'\t:global(.rail-fixed-width) {',
		'\t\t--hz-carousel-item-width: 12rem;',
		'\t\t--hz-carousel-gap: 1.5rem;',
		'\t}',
		'</' + 'style>'
	].join('\n');

	const railExactThreeCode = [
		'<!-- Exactly three visible, whatever the container width. -->',
		'<Carousel',
		'\titems={products}',
		'\tlayout="rail"',
		'\tariaLabel="Featured products"',
		'\tclass="rail-exactly-three"',
		'>',
		'\t{#snippet slide(product)}',
		'\t\t<Card>{product}</Card>',
		'\t{/snippet}',
		'</Carousel>',
		'',
		'<' + 'style>',
		'\t:global(.rail-exactly-three) {',
		'\t\t--hz-carousel-item-width: calc((100% - 2 * 1rem) / 3);',
		'\t}',
		'</' + 'style>'
	].join('\n');

	const railFreeScrollCode = [
		'<Carousel items={products} layout="rail" snap={false} ariaLabel="Featured products">',
		'\t{#snippet slide(product)}',
		'\t\t<Card>{product}</Card>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	const railLoopCode = [
		'<Carousel items={products} layout="rail" loop snap={false} ariaLabel="Featured products">',
		'\t{#snippet slide(product)}',
		'\t\t<Card>{product}</Card>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'dots', label: 'Dots' },
		{ id: 'loop', label: 'Loop' },
		{ id: 'drag', label: 'Drag' },
		{ id: 'minimal', label: 'Minimal controls' },
		{ id: 'rail', label: 'Rail' }
	];
</script>

<DocPage name="Carousel" {...carouselDoc}>
	<p class="demo-note">
		The slide-track settle animation honors <code>--hz-duration-*</code> / <code>--hz-ease-*</code>.
		See <a href="/docs/foundation/motion">Motion</a> for the token values and the
		<code>@hyzer-labs/ui/motion</code> script-side helpers built on them.
	</p>
	<Tabs items={demoTabs} ariaLabel="Carousel demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<Carousel items={quotes} ariaLabel="Customer quotes">
							{#snippet slide(quote)}
								<Blockquote cite={quote.who}>{quote.text}</Blockquote>
							{/snippet}
						</Carousel>
					</Example>
				{:else if item.id === 'dots'}
					<p class="tab-note">
						<code>indicator="dots"</code> swaps the counter for clickable slide pickers. Each dot is
						a labeled button, and <code>aria-current</code> marks the active slide. Position changes still
						announce through the live region, so screen readers keep the "n of total" information either
						way.
					</p>
					<Example code={dotsCode}>
						<Carousel items={quotes} indicator="dots" ariaLabel="Customer quotes (dots)">
							{#snippet slide(quote)}
								<Blockquote cite={quote.who}>{quote.text}</Blockquote>
							{/snippet}
						</Carousel>
					</Example>
				{:else if item.id === 'loop'}
					<p class="tab-note">
						Without <code>loop</code> the controls disable at the ends. With it, navigation wraps both
						ways, including a drag flicked past the first or last slide.
					</p>
					<Example code={loopCode}>
						<Carousel items={quotes} loop ariaLabel="Customer quotes (looping)">
							{#snippet slide(quote)}
								<Blockquote cite={quote.who}>{quote.text}</Blockquote>
							{/snippet}
						</Carousel>
					</Example>
				{:else if item.id === 'drag'}
					<p class="tab-note">
						<code>controls="focus"</code> keeps the prev/next buttons and indicator in the DOM and
						fully operable. They are hidden only visually, until <code>:hover</code> or
						<code>:focus-within</code>
						reveals the whole row together (Tab into the carousel, or hover it with a mouse). That is
						the WCAG 2.5.7 non-dragging alternative to the drag gesture. The row never uses
						<code>display</code>, <code>visibility</code>, <code>aria-hidden</code>, or
						<code>inert</code>, so it stays reachable by keyboard and screen readers whatever the
						visual reveal does.
					</p>
					<p class="tab-note">
						<code>seamless</code> makes every wrap settle forward through a hidden clone instead of sweeping
						backward through the row. That covers a drag flicked past the last slide, the buttons, the
						dots, and the arrow keys.
					</p>
					<Example code={dragCode}>
						<Carousel
							items={quotes}
							draggable
							loop
							seamless
							controls="focus"
							ariaLabel="Customer quotes (drag)"
						>
							{#snippet slide(quote)}
								<Blockquote cite={quote.who}>{quote.text}</Blockquote>
							{/snippet}
						</Carousel>
					</Example>
				{:else if item.id === 'minimal'}
					<p class="tab-note">
						This is a theme example done with CSS alone, not a new prop. A plain consumer class
						restyles the dots into flat segments of a thin progress trackline, with the current
						slide's segment colored <code>--hz-intent-primary</code>, and hides the chevrons until
						they receive keyboard focus.
					</p>
					<p class="tab-note">
						The chevrons stay in the DOM, in the tab order, and Enter/Space-operable throughout:
						never
						<code>display</code>, <code>visibility</code>, <code>aria-hidden</code>, or
						<code>inert</code>. That is the same accessibility treatment
						<code>controls="focus"</code> ships (see the Drag tab), applied here to the two controls
						individually so the trackline itself stays visible. Every color comes from
						<code>--hz-color-*</code>/<code>--hz-intent-*</code> tokens.
					</p>
					<Example code={minimalCode}>
						<Carousel
							items={quotes}
							indicator="dots"
							ariaLabel="Customer quotes (minimal controls)"
							class="minimal-carousel"
						>
							{#snippet slide(quote)}
								<Blockquote cite={quote.who}>{quote.text}</Blockquote>
							{/snippet}
						</Carousel>
					</Example>
				{:else}
					<p class="tab-note">
						<code>layout="rail"</code> swaps the sliding track for a real horizontally-scrolling row with
						several cards visible at once — a storefront shelf rather than a single slide. The browser
						drives it: touch, trackpad, wheel, the scrollbar, and the arrow keys all scroll it natively,
						and a mouse can drag it too. The prev/next buttons page it by one screenful. There is no dots/counter
						indicator in this layout, since several items are visible at the same time.
					</p>
					<Example code={railBasicCode}>
						<Carousel items={products} layout="rail" ariaLabel="Featured products (rail)">
							{#snippet slide(product)}
								<Card>{product}</Card>
							{/snippet}
						</Carousel>
					</Example>
					<p class="tab-note">
						Control how many cards show at once with <code>--hz-carousel-item-width</code> — set a
						plain length, or a <code>calc()</code> for an exact count regardless of the container's
						width. <code>--hz-carousel-gap</code> sets the space between cards.
					</p>
					<Example code={railSizingCode}>
						<Carousel
							items={products}
							layout="rail"
							ariaLabel="Featured products (fixed card width)"
							class="rail-fixed-width"
						>
							{#snippet slide(product)}
								<Card>{product}</Card>
							{/snippet}
						</Carousel>
					</Example>
					<Example code={railExactThreeCode}>
						<Carousel
							items={products}
							layout="rail"
							ariaLabel="Featured products (exactly three)"
							class="rail-exactly-three"
						>
							{#snippet slide(product)}
								<Card>{product}</Card>
							{/snippet}
						</Carousel>
					</Example>
					<p class="tab-note">
						<code>snap</code> (the default) snaps the row to a card's start as you scroll or drag. Turn
						it off for free, continuous scrolling that stops wherever you release it.
					</p>
					<Example code={railFreeScrollCode}>
						<Carousel
							items={products}
							layout="rail"
							snap={false}
							ariaLabel="Featured products (free scrolling)"
						>
							{#snippet slide(product)}
								<Card>{product}</Card>
							{/snippet}
						</Carousel>
					</Example>
					<p class="tab-note">
						<code>loop</code> in a rail wraps the row continuously in either direction — scroll or drag
						past either end and it carries on rather than stopping. A looping row also hides its scrollbar,
						since there's no real start or end for it to point to — the row still scrolls with touch,
						trackpad, wheel, the keyboard, and a mouse drag exactly as before. The cards that briefly
						appear wrapped around at either edge become clickable again as soon as the row finishes scrolling
						onto them.
					</p>
					<Example code={railLoopCode}>
						<Carousel
							items={products}
							layout="rail"
							loop
							snap={false}
							ariaLabel="Featured products (looping)"
						>
							{#snippet slide(product)}
								<Card>{product}</Card>
							{/snippet}
						</Carousel>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.demo-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Minimal-controls restyle: every class here targets DOM rendered by the
	 * child Carousel, not this page's own template, so both the outer class
	 * and the theme's part classes need :global() (Lightbox's
	 * .gallery-strip/.hz-lightbox-trigger precedent). */
	:global(.minimal-carousel) :global(.hz-carousel-controls) {
		gap: 0.5rem;
	}

	:global(.minimal-carousel) :global(.hz-carousel-prev),
	:global(.minimal-carousel) :global(.hz-carousel-next) {
		opacity: 0;
	}

	:global(.minimal-carousel) :global(.hz-carousel-prev):focus-visible,
	:global(.minimal-carousel) :global(.hz-carousel-next):focus-visible {
		opacity: 1;
	}

	:global(.minimal-carousel) :global(.hz-carousel-dots) {
		flex: 1;
		gap: 0.25rem;
	}

	:global(.minimal-carousel) :global(.hz-carousel-dot) {
		width: auto;
		flex: 1;
		height: 3px;
		border-radius: var(--hz-radius-full, 9999px);
		scale: 1;
		background-color: var(--hz-color-border, #d1d5db);
	}

	:global(.minimal-carousel .hz-carousel-dot[data-active]) {
		scale: 1;
		background-color: var(--hz-intent-primary, #2563eb);
	}

	/* Rail sizing demos: --hz-carousel-item-width/--hz-carousel-gap are the
	 * component's own theme hooks, set here on the wrapping class the same way
	 * a consumer would. */
	:global(.rail-fixed-width) {
		--hz-carousel-item-width: 12rem;
		--hz-carousel-gap: 1.5rem;
	}

	:global(.rail-exactly-three) {
		--hz-carousel-item-width: calc((100% - 2 * 1rem) / 3);
	}
</style>
