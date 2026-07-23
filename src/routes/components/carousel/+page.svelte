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

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'dots', label: 'Dots' },
		{ id: 'loop', label: 'Loop' },
		{ id: 'drag', label: 'Drag' }
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
				{:else}
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
</style>
