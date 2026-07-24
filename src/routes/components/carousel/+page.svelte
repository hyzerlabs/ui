<script lang="ts">
	import { Carousel, Blockquote, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import { carouselDoc } from '../../../docs/data/carousel.js';
	import Example from '../../../docs/Example.svelte';

	const quotes = [
		{
			text: 'The density spacing sold me — one prop, correct rhythm everywhere.',
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
		'<Carousel items={quotes} loop ariaLabel="Customer quotes" />'
	].join('\n');

	const dotsCode = '<Carousel items={quotes} indicator="dots" ariaLabel="Customer quotes" />';

	const dragCode = [
		'<!-- controls="focus": the row is hidden until hover/focus reveals it -->',
		'<!-- seamless: every ±1 loop wrap settles through a clone, never a -->',
		'<!-- backward sweep through the row -->',
		'<Carousel',
		'\tdraggable',
		'\tloop',
		'\tseamless',
		'\tcontrols="focus"',
		'\tariaLabel="Customer quotes (drag)"',
		'/>'
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
		'\t.minimal-carousel .hz-carousel-controls {',
		'\t\tgap: 0.5rem;',
		'\t}',
		'',
		'\t/* Hidden until :focus-visible — still in the DOM, in the tab order,',
		'\t   and Enter/Space-operable throughout; never display/visibility/',
		'\t   aria-hidden/inert. */',
		'\t.minimal-carousel .hz-carousel-prev,',
		'\t.minimal-carousel .hz-carousel-next {',
		'\t\topacity: 0;',
		'\t}',
		'',
		'\t.minimal-carousel .hz-carousel-prev:focus-visible,',
		'\t.minimal-carousel .hz-carousel-next:focus-visible {',
		'\t\topacity: 1;',
		'\t}',
		'',
		'\t.minimal-carousel .hz-carousel-dots {',
		'\t\tflex: 1;',
		'\t\tgap: 0.25rem;',
		'\t}',
		'',
		'\t.minimal-carousel .hz-carousel-dot {',
		'\t\twidth: auto;',
		'\t\tflex: 1;',
		'\t\theight: 3px;',
		'\t\tborder-radius: var(--hz-radius-full);',
		'\t\tscale: 1;',
		'\t\tbackground-color: var(--hz-color-border);',
		'\t}',
		'',
		'\t.minimal-carousel .hz-carousel-dot[data-active] {',
		'\t\tscale: 1;',
		'\t\tbackground-color: var(--hz-intent-primary);',
		'\t}',
		'</' + 'style>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'dots', label: 'Dots' },
		{ id: 'loop', label: 'Loop' },
		{ id: 'drag', label: 'Drag' },
		{ id: 'minimal', label: 'Minimal controls' }
	];
</script>

<DocPage name="Carousel" {...carouselDoc}>
	<p class="demo-note">
		The slide-track settle animation honors <code>--hz-duration-*</code> / <code>--hz-ease-*</code>
		— see <a href="/foundation/motion">Motion</a> for the token values and the
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
						<code>indicator="dots"</code> swaps the counter for clickable slide pickers — each dot
						is a labelled button (<code>aria-current</code> marks the active slide), and position changes
						still announce through the live region, so screen readers keep the "n of total" information
						either way.
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
						Without <code>loop</code> the controls disable at the ends; with it, navigation wraps both
						ways — including a drag flicked past the first or last slide.
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
						fully operable — hidden only visually until <code>:hover</code>/<code
							>:focus-within</code
						>
						reveals the whole row together (Tab into the carousel, or hover it with a mouse). This is
						the WCAG 2.5.7 non-dragging alternative to the drag gesture: never
						<code>display</code>,
						<code>visibility</code>, <code>aria-hidden</code>, or <code>inert</code>, so it stays
						reachable by keyboard and screen readers regardless of the visual reveal.
						<code>seamless</code> makes every wrap — a drag flicked past the last slide, the buttons,
						the dots, or the arrow keys — settle forward through a hidden clone instead of sweeping backward
						through the row.
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
				{:else}
					<p class="tab-note">
						A theme example, not a new prop: a plain consumer class restyles the dots into flat
						segments of a thin progress trackline (the current slide's segment colored
						<code>--hz-intent-primary</code>) and hides the chevrons until they receive keyboard
						focus. The chevrons stay in the DOM, in the tab order, and Enter/Space-operable
						throughout — never <code>display</code>, <code>visibility</code>,
						<code>aria-hidden</code>, or <code>inert</code> — the same a11y posture
						<code>controls="focus"</code> ships (see the Drag tab), applied here to the two controls
						individually so the trackline itself stays always visible. Every color comes from
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

	/* Minimal-controls restyle (specs/40 tweak batch): every class here
	 * targets DOM rendered by the child Carousel, not this page's own
	 * template, so both the outer class and the theme's part classes need
	 * :global() (Lightbox's .gallery-strip/.hz-lightbox-trigger precedent). */
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
</style>
