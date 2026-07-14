<script lang="ts">
	import { Carousel, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'T[]',
			default: '—',
			note: 'Required. Generic — each item renders via the slide snippet.'
		},
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			note: 'Required. Names the carousel region.'
		},
		{ name: 'index', type: 'number (bindable)', default: '0' },
		{
			name: 'loop',
			type: 'boolean',
			default: 'false',
			note: 'Wrap from the last slide to the first and back.'
		},
		{
			name: 'indicator',
			type: "'counter' | 'dots'",
			default: "'counter'",
			note: 'The "1 / 3" counter, or clickable slide-picker dots.'
		},
		{ name: 'prevLabel', type: 'string', default: "'Previous slide'" },
		{ name: 'nextLabel', type: 'string', default: "'Next slide'" },
		{
			name: 'slideLabel',
			type: '(item, index) => string',
			default: '—',
			note: 'Accessible name per slide; defaults to "{n} of {total}".'
		},
		{
			name: 'dotLabel',
			type: '(index, count) => string',
			default: '—',
			note: 'Accessible name per dot; defaults to "Go to slide {n} of {total}".'
		},
		{ name: 'onchange', type: '(index: number) => void', default: '—' },
		{
			name: 'slide',
			type: 'Snippet<[T, number]>',
			default: '—',
			note: 'Required. Renders one slide.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-carousel class.' }
	];

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
		'\t\t<blockquote>{quote.text}</blockquote>',
		'\t\t<cite>{quote.who}</cite>',
		'\t{/snippet}',
		'</Carousel>'
	].join('\n');

	const loopCode = [
		'<!-- loop: wraps in both directions, controls never disable -->',
		'<Carousel items={quotes} loop ariaLabel="Customer quotes" />'
	].join('\n');

	const dotsCode = '<Carousel items={quotes} indicator="dots" ariaLabel="Customer quotes" />';

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'dots', label: 'Dots' },
		{ id: 'loop', label: 'Loop' }
	];
</script>

<DocPage
	name="Carousel"
	description="An accessible, manually-rotated carousel: labelled slides, previous/next controls, arrow-key steering, and a live region announcing changes. No auto-rotation, by design."
	importLine={'import {Carousel} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Follows the APG grouped-carousel pattern: the region and each slide carry `aria-roledescription`, slides are named ('2 of 5'-style by default, customizable via `slideLabel`), and because there is no auto-rotation the viewport is an `aria-live=&quot;polite&quot;` region — slide changes announce themselves. Arrow keys, Home, and End steer while focus is inside the carousel."
>
	<Tabs items={demoTabs} ariaLabel="Carousel demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<Carousel items={quotes} ariaLabel="Customer quotes">
							{#snippet slide(quote)}
								<blockquote class="quote">{quote.text}</blockquote>
								<cite class="who">{quote.who}</cite>
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
								<blockquote class="quote">{quote.text}</blockquote>
								<cite class="who">{quote.who}</cite>
							{/snippet}
						</Carousel>
					</Example>
				{:else}
					<p class="tab-note">
						Without <code>loop</code> the controls disable at the ends; with it, navigation wraps both
						ways.
					</p>
					<Example code={loopCode}>
						<Carousel items={quotes} loop ariaLabel="Customer quotes (looping)">
							{#snippet slide(quote)}
								<blockquote class="quote">{quote.text}</blockquote>
								<cite class="who">{quote.who}</cite>
							{/snippet}
						</Carousel>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.quote {
		margin: 0 0 0.5rem;
		padding: 1.25rem 1.5rem 0.25rem;
		font-size: var(--hz-font-size-lg, 1.4rem);
		text-align: center;
	}
	.who {
		display: block;
		text-align: center;
		font-style: normal;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
