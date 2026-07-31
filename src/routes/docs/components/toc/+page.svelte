<script lang="ts">
	import { tick } from 'svelte';
	import { Toc } from '$lib';
	import { Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { tocDoc } from '../../../../docs/data/toc.js';
	import Example from '../../../../docs/Example.svelte';

	// -------------------------------------------------------------------------
	// Every demo below renders its OWN scrollable article and points `container`
	// at it — never at the docs page itself, which already has a live Toc rail
	// (the dogfooded shell) that would otherwise pick a fight with these.
	// -------------------------------------------------------------------------

	const basicCode = [
		'<article class="content">',
		'\t<h2>Choosing a disc</h2>',
		'\t<h2>Grip and stance</h2>',
		'\t<h2>Reading the wind</h2>',
		'</article>',
		'',
		'<Toc container=".content" />'
	].join('\n');

	const nestedCode = [
		'<article class="content">',
		'\t<h2>Getting started</h2>',
		'\t<h3>Installation</h3>',
		'\t<h3>Configuration</h3>',
		'\t<h2>Advanced</h2>',
		'\t<h3>Custom themes</h3>',
		'</article>',
		'',
		'<Toc container=".content" levels={[2, 3]} />'
	].join('\n');

	const collapseCode = [
		'<Toc container=".content" breakpoint="md" />',
		'<!-- Below 968px this renders as a disclosure: a title+chevron trigger',
		"     toggling the list. Resize your browser (it's a real @media query,",
		"     not a container query) to see it — the rail's own box is narrow",
		'     regardless of page width, so it is not a usable "mobile" signal. -->'
	].join('\n');

	const activeCode = [
		"let active = $state('');",
		'',
		'<Toc container=".content" bind:active onActive={(id) => console.log(id)} />',
		'<p>Active: {active}</p>'
	].join('\n');

	const excludeCode = [
		'<article class="content">',
		'\t<h2>Course overview</h2>',
		'',
		'\t<aside class="callout">',
		'\t\t<h2>Sidebar note</h2>',
		'\t</aside>',
		'',
		'\t<h2>Signature holes</h2>',
		'',
		'\t<figure class="figure">',
		'\t\t<h2>Figure: elevation map</h2>',
		'\t</figure>',
		'',
		'\t<h2>Getting there</h2>',
		'</article>',
		'',
		'<!-- Pass an array to combine selectors — a heading inside ANY match is',
		'     skipped, so neither embedded region reaches the rail. -->',
		"<Toc container=\".content\" exclude={['.callout', '.figure']} />"
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'nested', label: 'Nested levels' },
		{ id: 'exclude', label: 'Excluded regions' },
		{ id: 'collapse', label: 'Collapse mode' },
		{ id: 'active', label: 'Callback / bindable active' }
	];

	// Toc instances bound per demo, keyed by tab id — refreshed on tab change
	// since inactive Tabs panels stay mounted but hidden (the native
	// [hidden]), and collection skips hidden headings (offsetParent === null).
	// `onChange` fires synchronously, right after the `activeTab` state write
	// and before Svelte flushes it to the DOM's `hidden` attribute — tick()
	// waits for that flush so the just-revealed panel's headings actually
	// measure visible before refresh() re-collects.
	const tocInstances: Record<string, { refresh: () => void } | undefined> = {};

	async function onTabChange() {
		await tick();
		for (const toc of Object.values(tocInstances)) toc?.refresh();
	}

	// State for the active-callback demo.
	let demoActive = $state('');
	let lastFired = $state('');
</script>

<DocPage name="Toc" {...tocDoc}>
	<Tabs items={demoTabs} ariaLabel="Toc demos" defaultTab="basic" onChange={onTabChange}>
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Default <code>levels</code> is <code>[2]</code>, so only h2s. Scroll the article or
						click a link: the active entry tracks the reading position. That is the last heading at
						or above the top quarter of the viewport, pinned to the last entry at the bottom.
					</p>
					<Example code={basicCode}>
						<div class="toc-demo-row">
							<article class="toc-demo-article toc-demo-article--basic">
								<h2>Choosing a disc</h2>
								<p>
									Distance drivers cut through the wind but punish a bad release; putters forgive
									one and go nowhere fast. Most rounds live in between, with a fairway driver or a
									midrange doing the actual work.
								</p>
								<p>
									Plastic matters less than flight numbers early on: speed, glide, turn, fade. Learn
									one disc in each class before buying a bag full of near-duplicates.
								</p>
								<p>
									A new disc flies overstable and settles in as the plastic wears. The "beat-in"
									version of a mold often flies nothing like the fresh one on the shelf.
								</p>
								<p>
									Weight changes flight more than most players expect: a 165g and a 175g version of
									the same mold are, in practice, two different discs.
								</p>
								<h2>Grip and stance</h2>
								<p>
									A fan grip trades power for control; a power grip does the opposite. Neither is
									wrong. The disc does not know which fingers are on the rim, only how fast it is
									spinning when it leaves them.
								</p>
								<p>
									Stagger your feet, load the hips, and let the arm follow. A rushed pull is the
									single most common source of early, weak turnover.
								</p>
								<p>
									Reach back too far and the disc arrives late and flat; reach back too little and
									there's no room left to accelerate through the release.
								</p>
								<p>
									A relaxed grip through the whole pull beats a white-knuckle one at the start.
									Tension in the wrist bleeds spin, and spin is what keeps the disc stable.
								</p>
								<h2>Reading the wind</h2>
								<p>
									A headwind exaggerates turn and fade alike, so understable discs flip over faster
									than expected. A tailwind flattens everything out, and what looked overstable on a
									calm day suddenly holds its line.
								</p>
								<p>
									Crosswinds are the honest test: throw into one on a hyzer line and the disc tells
									you, immediately, whether it's actually as stable as the flight numbers claim.
								</p>
								<p>
									Tree lines break up gusts unevenly. The wind at chest height rarely matches the
									wind the flag at the tee box is reading.
								</p>
							</article>
							<Toc
								bind:this={tocInstances.basic}
								container=".toc-demo-article--basic"
								title="On this article"
							/>
						</div>
					</Example>
				{:else if item.id === 'nested'}
					<p class="tab-note">
						<code>levels=&#123;[2, 3]&#125;</code> collects both, and h3s nest under the nearest preceding
						h2. A stray h3 that comes before any h2 attaches at the top level instead.
					</p>
					<Example code={nestedCode}>
						<div class="toc-demo-row">
							<article class="toc-demo-article toc-demo-article--nested">
								<h2>Getting started</h2>
								<p>Two short sections cover the setup end to end.</p>
								<h3>Installation</h3>
								<p>
									Pull the driver from the bag, check the rim for chips, and confirm the flight
									plate still reads clean. A worn stamp is cosmetic, a worn rim is not.
								</p>
								<p>
									A fresh disc is stiffer than it will ever fly again. The first dozen throws knock
									the edge off a rim that otherwise reads more overstable than intended.
								</p>
								<p>
									Mark it before it goes in the bag. A disc without a name on it is, sooner or
									later, someone else's disc.
								</p>
								<h3>Configuration</h3>
								<p>
									Dial the grip to the disc's dome height, not the other way around. A flatter top
									wants a shallower fan grip than a domey putter does.
								</p>
								<p>
									Rim width changes what a "power grip" even means. A thin-rim driver and a
									chunky-rim midrange do not sit the same way in a fan grip either.
								</p>
								<p>
									Retest the grip after a plastic change. Star and DX wear at different rates, and a
									grip tuned for one goes slick on the other well before it looks worn.
								</p>
								<h2>Advanced</h2>
								<p>Once the fundamentals hold up under pressure, a few things start to matter.</p>
								<h3>Custom themes</h3>
								<p>
									Overstable in the wind, understable in the calm: carrying two versions of the
									"same" disc in different plastics is less redundant than it sounds.
								</p>
								<p>
									A beat-in mid and a brand-new one in the same plastic are, functionally, two
									separate discs worth two separate slots in the bag.
								</p>
								<p>
									The scorecard does not care which version threw the shot, only that the flight
									matched the shot shape the hole actually asked for.
								</p>
							</article>
							<Toc
								bind:this={tocInstances.nested}
								container=".toc-demo-article--nested"
								levels={[2, 3]}
								title="On this article"
							/>
						</div>
					</Example>
				{:else if item.id === 'exclude'}
					<p class="tab-note">
						<code>exclude</code> takes one selector or an array of them. A heading inside any match is
						skipped. Here both the callout and the figure carry their own h2, and neither reaches the
						rail.
					</p>
					<Example code={excludeCode}>
						<div class="toc-demo-row">
							<article class="toc-demo-article toc-demo-article--exclude">
								<h2>Course overview</h2>
								<p>
									An 18-hole wooded course with tight fairways and a back nine that opens onto the
									lakeside. Bring a stable midrange: the gaps reward control over raw distance.
								</p>
								<p>
									Elevation swings on the front nine make several holes play a full club longer than
									their footage suggests.
								</p>
								<aside class="toc-demo-callout">
									<h2>Sidebar note</h2>
									<p>
										This heading lives inside a <code>.toc-demo-callout</code> aside. It is excluded,
										so you won't find it in the rail even though it's a real h2.
									</p>
								</aside>
								<h2>Signature holes</h2>
								<p>
									Hole 7 plays across the water to an island green; hole 14 is the local favorite, a
									blind downhill anhyzer through a corridor of oaks.
								</p>
								<p>
									Most cards are won or lost on the closing stretch, where three straight holes sit
									fully exposed to the prevailing wind.
								</p>
								<figure class="toc-demo-figure">
									<h2>Figure: elevation map</h2>
									<p>
										A second excluded region, this time a <code>.toc-demo-figure</code>. The array
										form skips both in one pass.
									</p>
								</figure>
								<h2>Getting there</h2>
								<p>
									Parking is at the north lot; the first tee is a short walk past the pro shop.
									Weekend mornings fill early, so a tee time is worth reserving.
								</p>
								<p>
									The course shares a trailhead with the county park. Follow the disc-golf signage,
									not the hiking markers, at the first fork.
								</p>
							</article>
							<Toc
								bind:this={tocInstances.exclude}
								container=".toc-demo-article--exclude"
								exclude={['.toc-demo-callout', '.toc-demo-figure']}
								title="On this article"
							/>
						</div>
					</Example>
				{:else if item.id === 'collapse'}
					<p class="tab-note">
						<code>breakpoint="md"</code> collapses the rail into a disclosure below 968px. It is a
						real viewport <code>@media</code> query, because the rail's own box is narrow whatever the
						page width, so it is not a usable "mobile" signal by itself. Resize your browser to see the
						title swap for a trigger button.
					</p>
					<Example code={collapseCode}>
						<div class="toc-demo-row">
							<article class="toc-demo-article toc-demo-article--collapse">
								<h2>Warm-up</h2>
								<p>
									A handful of short putts and a couple of midrange throws. The point is loosening
									up, not maxing out distance before the round starts.
								</p>
								<p>
									Stretch the shoulder before the wrist. A cold rotator cuff on the first tee is how
									a driver ends up thrown flat and low, twenty feet short of the fairway.
								</p>
								<p>
									Walk the first hole before throwing it if the course is unfamiliar. A blind dogleg
									looks nothing like its scorecard description.
								</p>
								<h2>Front nine</h2>
								<p>
									Play the numbers you know, not the throw you saw on a highlight reel. The course
									rewards consistency long before it rewards a hero shot through the gap.
								</p>
								<p>
									A bogey from a safe layup beats a double from a gap that was never really there.
									The scorecard does not record how close it looked.
								</p>
								<p>
									Track misses, not only makes. A putter that consistently misses low is telling you
									something about release height, not luck.
								</p>
								<h2>Back nine</h2>
								<p>
									Fatigue changes form more than it changes intent. The grip loosens first, then the
									follow-through shortens. Both are worth watching for on the closing holes.
								</p>
								<p>
									The last three holes are where a round is actually won or lost, not because
									they're harder, but because that's where the fundamentals start to slip first.
								</p>
								<p>
									A finished round is worth reviewing before the scorecard is forgotten. The same
									three misses tend to repeat until someone actually looks for the pattern.
								</p>
							</article>
							<Toc
								bind:this={tocInstances.collapse}
								container=".toc-demo-article--collapse"
								breakpoint="md"
								title="On this article"
							/>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>bind:active</code> and <code>onActive</code> both track the scroll-spy. Bind it for
						a live readout, or use the callback to react to changes without owning the state.
					</p>
					<Example code={activeCode}>
						<div class="toc-demo-row">
							<article class="toc-demo-article toc-demo-article--active">
								<h2>Overview</h2>
								<p>
									The active id updates as you scroll or click. Both the bound value below and the
									console (via <code>onActive</code>) see every change, and only on change.
								</p>
								<p>
									Scroll position is read live, on every animation frame while scrolling, rather
									than cached at collection time, so late layout shifts cannot leave the readout
									stale.
								</p>
								<p>
									Nothing here is Toc-specific plumbing: <code>bind:active</code> and
									<code>onActive</code> are the bindable prop and change callback, the same shape as any
									other component in the library.
								</p>
								<h2>Details</h2>
								<p>
									Clicking a link sets the active id immediately, ahead of the scroll landing, so
									there's no flash of the previous section while the smooth scroll is still in
									flight.
								</p>
								<p>
									A keyboard user tabbing to a link and pressing Enter gets the identical behavior.
									Activation is not gated on a pointer event.
								</p>
								<p>
									Reduced motion swaps the smooth scroll for an instant jump, but the active-id
									update itself is unaffected either way.
								</p>
								<h2>Summary</h2>
								<p>
									At the bottom of the article the last entry stays active even once its heading has
									scrolled well past the threshold line. That is the same bottom-pin rule the docs
									shell's own rail uses.
								</p>
								<p>
									That rule exists because a short final section would otherwise never cross the
									top-quarter threshold on its own, leaving nothing marked active while the reader
									is squarely inside it.
								</p>
								<p>
									Scroll back up and the active id keeps tracking normally. The bottom-pin only
									applies exactly at the bottom of the scrollable range.
								</p>
							</article>
							<Toc
								bind:this={tocInstances.active}
								container=".toc-demo-article--active"
								title="On this article"
								bind:active={demoActive}
								onActive={(id) => (lastFired = id)}
							/>
						</div>
						<p class="tab-note toc-readout" aria-live="polite">
							Active: <code>{demoActive || '(none)'}</code> · last onActive:
							<code>{lastFired || '(none)'}</code>
						</p>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	/* Each article is its own bounded, scrollable region — a real (if small)
	 * "reading pane" rather than the whole page. The scroll-spy listens on
	 * `window` with capture: true, which catches a nested region's 'scroll'
	 * too (getBoundingClientRect() is viewport-relative regardless of which
	 * ancestor actually scrolled), so this works the same as page-level
	 * scrolling would. */
	.toc-demo-row {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
	}

	.toc-demo-article {
		flex: 1;
		min-width: 0;
		max-height: 16rem;
		overflow-y: auto;
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 1.5rem 1rem;
	}

	/* Generous block spacing on every item — the box is short (16rem), so
	 * without room between headings the whole article could fit in one
	 * screenful and there would be nothing to actually scroll through to see
	 * the active entry change. */
	.toc-demo-article :global(h2) {
		font-size: var(--hz-font-size-base, 1rem);
		padding-block: 1.5rem;
		margin: 0;
	}

	.toc-demo-article :global(h3) {
		font-size: var(--hz-font-size-sm, 0.875rem);
		padding-block: 1rem;
		margin: 0;
	}

	.toc-demo-article :global(p) {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
		padding-block: 0.5rem;
		margin: 0;
	}

	/* The two excluded regions in the Exclude demo — visually set apart so it's
	 * clear the skipped headings are real headings inside distinct blocks. */
	.toc-demo-callout,
	.toc-demo-figure {
		margin: 0.75rem 0;
		padding: 0.25rem 0.75rem;
		border-inline-start: 3px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		background-color: color-mix(in srgb, var(--hz-intent-neutral, #6b7280) 6%, transparent);
	}

	.toc-demo-row :global(.hz-toc) {
		flex: 0 0 10rem;
	}

	.toc-readout {
		margin-top: 1rem;
	}
</style>
