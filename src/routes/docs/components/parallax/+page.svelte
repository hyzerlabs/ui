<script lang="ts">
	import {
		Alert,
		CodeBlock,
		Container,
		HorizontalScroll,
		Image,
		Parallax,
		ParallaxLayer,
		RadioGroup,
		Tabs
	} from '$lib';
	import IconInfo from '$lib/icons/generated/info.svelte';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { parallaxDoc } from '../../../../docs/data/parallax.js';
	import Example from '../../../../docs/Example.svelte';
	import ScrollStage from '../../../../docs/ScrollStage.svelte';

	// Inline SVG data-URI, so the page ships no binary assets — the Image
	// docs page's `demoSvg` precedent. A gradient rectangle, nothing more.
	function demoSvg(label: string, from: string, to: string, w = 1200, h = 800): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23${from}'/%3E%3Cstop offset='1' stop-color='%23${to}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='${w}' height='${h}' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='36' font-family='system-ui'%3E` +
			encodeURIComponent(label) +
			'%3C/text%3E%3C/svg%3E'
		);
	}

	const heroArt = demoSvg('background layer', '1e3a8a', '6d28d9');

	// Example code blocks show real, page-scroll usage — never the demo
	// stage below (that's docs-only chrome, not part of the component API).
	const heroCode = [
		'<Parallax as="section" style="min-height: 60vh">',
		'\t<ParallaxLayer y="8rem">',
		'\t\t<Image src="/photos/ridge.jpg" alt="" fit="cover" style="width: 100%; height: 100%" />',
		'\t</ParallaxLayer>',
		'\t<Container>',
		'\t\t<h2>Copy sits above the drifting background</h2>',
		'\t</Container>',
		'</Parallax>'
	].join('\n');

	const horizontalCode = [
		'<Parallax style="min-height: 60vh">',
		'\t<ParallaxLayer x="-6rem">…</ParallaxLayer>',
		'\t<ParallaxLayer x="6rem">…</ParallaxLayer>',
		'</Parallax>'
	].join('\n');

	const horizontalScrollingCode = [
		'<HorizontalScroll style="--hz-horizontal-scroll-height: 20rem">',
		'\t<!-- panel one: two circles start far apart, near the top and bottom,',
		'\t     and opposing y (cross-axis) travel brings them together as you',
		'\t     scroll right -->',
		'\t<Parallax axis="x" style="min-height: 100%">',
		'\t\t<ParallaxLayer y="16rem">…top, drifts down…</ParallaxLayer>',
		'\t\t<ParallaxLayer y="-16rem">…bottom, drifts up…</ParallaxLayer>',
		'\t</Parallax>',
		'\t<!-- panel two: classic speed-difference drift — staggered layers,',
		'\t     same-axis x travel at different magnitudes -->',
		'\t<Parallax axis="x" style="min-height: 100%">',
		'\t\t<ParallaxLayer x="4rem">…</ParallaxLayer>',
		'\t\t<ParallaxLayer x="9rem">…</ParallaxLayer>',
		'\t\t<ParallaxLayer x="16rem">…</ParallaxLayer>',
		'\t\t<ParallaxLayer x="22rem">…</ParallaxLayer>',
		'\t</Parallax>',
		'</HorizontalScroll>'
	].join('\n');

	const pageScrollCode = [
		'<!-- no ScrollStage, no wrapper — this band sits in normal page flow -->',
		'<Parallax as="section" style="min-height: 16rem">',
		'\t<ParallaxLayer y="6rem">…</ParallaxLayer>',
		'</Parallax>'
	].join('\n');

	const depthCode = [
		'<Parallax style="min-height: 60vh">',
		'\t<ParallaxLayer y="2rem">…back</ParallaxLayer>',
		'\t<ParallaxLayer y="5rem">…mid</ParallaxLayer>',
		'\t<ParallaxLayer y="10rem">…front</ParallaxLayer>',
		'\t<Container><h2>Copy</h2></Container>',
		'\t<ParallaxLayer y="3rem" z={1}>…drifts in front of the copy</ParallaxLayer>',
		'</Parallax>'
	].join('\n');

	const stickyCode = [
		'<!-- the sticky wrapper is your own CSS, OUTSIDE Parallax — the band',
		'     clips, so a sticky element placed INSIDE it would only stick',
		"     within its own bounds, not the page's -->",
		'<div class="sticky-section">',
		'\t<Parallax as="section" style="min-height: 100vh">',
		'\t\t<ParallaxLayer y="6rem">…</ParallaxLayer>',
		'\t\t<Container><h2>Section one</h2></Container>',
		'\t</Parallax>',
		'</div>',
		'<div class="sticky-section">…section two…</div>',
		'',
		'.sticky-section {',
		'\tposition: sticky;',
		'\ttop: 0;',
		'}'
	].join('\n');

	const tuningBreakpointCode = [
		'/* your own CSS — omit the x/y props so this stylesheet wins */',
		'.hero-art { --hz-parallax-y: 4rem; }',
		'@media (min-width: 968px) {',
		'\t.hero-art { --hz-parallax-y: 12rem; }',
		'}',
		'',
		'<ParallaxLayer class="hero-art">…</ParallaxLayer>'
	].join('\n');

	// Reactive range demo — one stage, one RadioGroup, driving the live
	// layer AND the code fence together (the Blockquote intent-demo /
	// Icons slider-driven-fence pattern: a $state selection, a
	// $derived.by code string, one Example wrapping both the control and
	// the live preview).
	const rangeOptions = [
		{ value: 'cover', label: 'Cover — the whole pass through the viewport (default)' },
		{ value: 'entry', label: "Entry — only while it's entering" },
		{ value: 'exit', label: "Exit — only while it's leaving" },
		{ value: 'contain', label: 'Contain — only while fully inside' }
	];
	let demoRange = $state<'cover' | 'entry' | 'exit' | 'contain'>('cover');
	const rangeDemoCode = $derived.by(
		() => `<ParallaxLayer style="--hz-parallax-range: ${demoRange}">…</ParallaxLayer>`
	);

	const demoTabs = [
		{ id: 'hero', label: 'Hero' },
		{ id: 'horizontal', label: 'Horizontal drift' },
		{ id: 'horizontal-scrolling', label: 'Horizontal scrolling' },
		{ id: 'depth', label: 'Depth' },
		{ id: 'sticky', label: 'Sticky sections' },
		{ id: 'tuning', label: 'Tuning' }
	];
</script>

<DocPage name="Parallax" {...parallaxDoc}>
	<p class="tab-note">
		A band with no in-flow content has no height. Give it one with <code>style</code>, a
		<code>class</code>, or real content, the way every demo below does with
		<code>min-height</code>. Most of the demos below sit in a bounded, scrollable box so they fit on
		this page. Scroll inside that box to see the layers move.
	</p>
	<p class="tab-note">
		That box is part of these docs, not part of how the component works. On an ordinary page, the
		page's own scroll drives the same thing, with no box around it. The band below shows it: it sits
		in normal page flow with nothing wrapping it, so keep scrolling this page and its layer drifts
		right along with it. It has no <code>Example</code> frame either, because that bordered box would
		become a scroll container of its own. That is the mistake the console warning on this page describes,
		a wrapper that quietly becomes the scroll container.
	</p>
	<CodeBlock code={pageScrollCode} />
	<Parallax as="section" class="demo-band demo-band--page-scroll">
		<ParallaxLayer y="6rem" class="demo-layer">
			<div class="demo-depth demo-depth--mid"></div>
		</ParallaxLayer>
		<Container class="demo-copy">
			<p>This band lives in the page's own scroll, with no bounded box and no wrapper around it.</p>
		</Container>
	</Parallax>
	<Tabs items={demoTabs} ariaLabel="Parallax demos" defaultTab="hero">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'hero'}
					<p class="tab-note">
						A slow background layer behind foreground copy. The layer is a plain
						<code>ParallaxLayer</code> holding an <code>Image</code>. The copy is an ordinary
						<code>Container</code> child, so it sets the band's height and sits above the layer by
						default (layers default to <code>z-index: -1</code>). Make the art itself taller than
						the band, the way a real hero background is. The layer's own bleed already covers its
						travel, so a generously tall source image keeps every edge out of sight while it drifts.
					</p>
					<Example code={heroCode}>
						<ScrollStage ariaLabel="Hero parallax demo" topRunway={false}>
							<Parallax as="section" class="demo-band demo-band--hero">
								<ParallaxLayer y="20rem" class="demo-layer">
									<Image src={heroArt} alt="" fit="cover" style="width: 100%; height: 100%;" />
								</ParallaxLayer>
								<Container class="demo-copy">
									<h3>Copy sits above the drifting background</h3>
									<p>The background drifts as you scroll; the copy stays put.</p>
								</Container>
							</Parallax>
						</ScrollStage>
					</Example>
				{:else if item.id === 'horizontal'}
					<p class="tab-note">
						Two layers with opposite <code>x</code> travel drift sideways as the page scrolls
						vertically. This is the effect people usually mean by "horizontal parallax". Travel is a
						distance, not a speed: it sets how far a layer moves over the band's whole pass through
						the viewport. So this is drift <strong>on a vertical scroll</strong>, unlike the next
						tab, where the band's own scroller runs sideways.
					</p>
					<Example code={horizontalCode}>
						<ScrollStage ariaLabel="Horizontal drift demo">
							<Parallax class="demo-band">
								<ParallaxLayer x="-12rem" class="demo-layer">
									<div class="demo-blob demo-blob--a"></div>
								</ParallaxLayer>
								<ParallaxLayer x="12rem" class="demo-layer">
									<div class="demo-blob demo-blob--b"></div>
								</ParallaxLayer>
							</Parallax>
						</ScrollStage>
					</Example>
				{:else if item.id === 'horizontal-scrolling'}
					<p class="tab-note">
						<code>axis</code> picks which axis of the nearest scroller drives the drift:
						<code>axis="x"</code> tracks the band's own horizontal crossing instead of the page's
						vertical scroll. A band used as a panel inside a
						<a href="/docs/components/horizontal-scroll">HorizontalScroll</a> needs
						<code>axis="x"</code>, or its layers sit still, because the shell never scrolls
						vertically. Scroll the box below sideways with the scrollbar, a trackpad, touch, or the
						keyboard to see two effects. In panel one the circles start far apart, near the top and
						bottom, and opposing <code>y</code> (cross-axis) travel brings them together as you
						scroll. In panel two the shapes start staggered, and giving each layer a different
						<code>x</code> travel drifts them at different speeds, the classic depth look.
					</p>
					<Alert intent="info">
						{#snippet icon()}<IconInfo />{/snippet}
						The scrolling shell has its own page:
						<a href="/docs/components/horizontal-scroll">HorizontalScroll</a>.
					</Alert>
					<Example code={horizontalScrollingCode}>
						<HorizontalScroll
							class="demo-hscroll"
							style="--hz-horizontal-scroll-height: 20rem"
							aria-label="Horizontal scrolling with Parallax demo"
							role="group"
						>
							<Parallax axis="x" class="demo-band--hscroll">
								<ParallaxLayer y="16rem" class="demo-layer">
									<div class="demo-blob demo-blob--a demo-spread demo-spread--top"></div>
								</ParallaxLayer>
								<ParallaxLayer y="-16rem" class="demo-layer">
									<div class="demo-blob demo-blob--b demo-spread demo-spread--bottom"></div>
								</ParallaxLayer>
								<Container class="demo-copy">
									<h3>Panel one</h3>
								</Container>
							</Parallax>
							<Parallax axis="x" class="demo-band--hscroll">
								<ParallaxLayer x="4rem" class="demo-layer">
									<div class="demo-depth demo-depth--back"></div>
								</ParallaxLayer>
								<ParallaxLayer x="9rem" class="demo-layer">
									<div class="demo-depth demo-depth--mid"></div>
								</ParallaxLayer>
								<ParallaxLayer x="16rem" class="demo-layer">
									<div class="demo-depth demo-depth--front"></div>
								</ParallaxLayer>
								<ParallaxLayer x="22rem" class="demo-layer">
									<div class="demo-depth demo-depth--overlay"></div>
								</ParallaxLayer>
								<Container class="demo-copy">
									<h3>Panel two</h3>
								</Container>
							</Parallax>
						</HorizontalScroll>
					</Example>
				{:else if item.id === 'depth'}
					<p class="tab-note">
						Three layers with increasing travel read as depth: the layer that feels farthest away
						moves least. A fourth layer sets <code>z</code> to <code>1</code> so it drifts in front of
						the copy instead of behind it, which shows how the stacking order works.
					</p>
					<Example code={depthCode}>
						<ScrollStage ariaLabel="Depth parallax demo">
							<Parallax class="demo-band">
								<ParallaxLayer y="4rem" class="demo-layer">
									<div class="demo-depth demo-depth--back"></div>
								</ParallaxLayer>
								<ParallaxLayer y="9rem" class="demo-layer">
									<div class="demo-depth demo-depth--mid"></div>
								</ParallaxLayer>
								<ParallaxLayer y="16rem" class="demo-layer">
									<div class="demo-depth demo-depth--front"></div>
								</ParallaxLayer>
								<Container class="demo-copy">
									<h3>Copy in the middle of the stack</h3>
								</Container>
								<ParallaxLayer y="7rem" z={1} class="demo-layer">
									<div class="demo-depth demo-depth--overlay"></div>
								</ParallaxLayer>
							</Parallax>
						</ScrollStage>
					</Example>
				{:else if item.id === 'sticky'}
					<p class="tab-note">
						Stacked full-screen sections come from composing, with no extra prop. Put your own
						<code>position: sticky</code> wrapper <strong>outside</strong> each
						<code>Parallax</code> band. The band clips, so a sticky element placed inside it would only
						stick within its own bounds. The box below is already its own scroll container, which also
						shows that the drift tracks whichever scroller is nearest, not only the page.
					</p>
					<Example code={stickyCode}>
						<div class="sticky-demo">
							<div class="sticky-section">
								<Parallax as="section" class="demo-band demo-band--sticky">
									<ParallaxLayer y="6rem" class="demo-layer">
										<div class="demo-depth demo-depth--back"></div>
									</ParallaxLayer>
									<Container class="demo-copy">
										<h3>Section one</h3>
									</Container>
								</Parallax>
							</div>
							<div class="sticky-section">
								<Parallax as="section" class="demo-band demo-band--sticky">
									<ParallaxLayer y="6rem" class="demo-layer">
										<div class="demo-depth demo-depth--mid"></div>
									</ParallaxLayer>
									<Container class="demo-copy">
										<h3>Section two</h3>
									</Container>
								</Parallax>
							</div>
							<div class="sticky-section">
								<Parallax as="section" class="demo-band demo-band--sticky">
									<ParallaxLayer y="6rem" class="demo-layer">
										<div class="demo-depth demo-depth--front"></div>
									</ParallaxLayer>
									<Container class="demo-copy">
										<h3>Section three</h3>
									</Container>
								</Parallax>
							</div>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>--hz-parallax-range</code> narrows which part of the band's pass through the viewport
						the drift is spread over. Pick a range, then scroll the box again to see the difference.
					</p>
					<Example code={rangeDemoCode}>
						<div class="range-demo">
							<RadioGroup
								name="parallax-range"
								label="animation-range"
								orientation="horizontal"
								options={rangeOptions}
								bind:value={demoRange}
							/>
							<ScrollStage ariaLabel="Animation range demo">
								<Parallax class="demo-band demo-band--range">
									<ParallaxLayer
										y="12rem"
										class="demo-layer"
										style="--hz-parallax-range: {demoRange}"
									>
										<div class="demo-depth demo-depth--back"></div>
									</ParallaxLayer>
								</Parallax>
							</ScrollStage>
						</div>
					</Example>
					<p class="tab-note">
						Travel can be tuned as well, set per breakpoint instead of hardcoded. Set
						<code>--hz-parallax-x</code>/<code>--hz-parallax-y</code> in your own class and leave
						the
						<code>x</code>/<code>y</code> props unset. The props write an inline style, which always
						wins over a stylesheet rule, so use one form or the other. On a short viewport a large
						travel reads as jitter and costs battery, so a smaller travel (or none) below your
						<code>md</code> breakpoint is worth doing.
					</p>
					<Example code={tuningBreakpointCode}>
						<ScrollStage ariaLabel="Breakpoint tuning demo">
							<Parallax class="demo-band">
								<ParallaxLayer class="demo-layer tuning-art">
									<div class="demo-depth demo-depth--mid"></div>
								</ParallaxLayer>
							</Parallax>
						</ScrollStage>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	/* Parallax/ParallaxLayer are child components, so a class handed to them
	 * via their `class` prop needs :global() — Svelte can't see it land on a
	 * literal element in this template (the Split.svelte.spec.ts `.pad-frame`
	 * precedent on the Split docs page). Plain elements written directly in
	 * this template (the `.demo-blob`/`.demo-depth` art) stay ordinary scoped
	 * selectors below.
	 */
	:global(.demo-band) {
		min-height: 18rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.demo-band--hero) {
		/* Fills the stage's default height so the hero reads as the top of a
		 * real page, not a section poking out of the muted runway below. */
		min-height: 26rem;
		align-items: flex-end;
	}

	:global(.demo-band--sticky) {
		min-height: 20rem;
	}

	:global(.demo-band--range) {
		min-height: 20rem;
	}

	/* A panel inside HorizontalScroll gets its height from flex stretch — no
	 * min-height needed, unlike every other .demo-band above, which sits in
	 * normal flow and must supply its own. */
	:global(.demo-band--hscroll) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.demo-hscroll) {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	:global(.demo-band--page-scroll) {
		margin-block: 1rem;
	}

	:global(.demo-layer) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* The breakpoint-tuning demo's own hook target — real usage of the
	 * "omit x/y, set the custom property in your own class" pattern the tab
	 * teaches, just louder than the code sample's real-world values so it
	 * reads clearly inside the bounded stage. */
	:global(.tuning-art) {
		--hz-parallax-y: 14rem;
	}

	/* The copy sitting above a layer needs its own contrast — Parallax
	 * contributes no color, so this page's own scrim is what makes the text
	 * readable over the gradient art, not anything the component supplies. */
	:global(.demo-copy) {
		margin-bottom: 1rem;
		padding: 1rem 1.5rem;
		border-radius: var(--hz-radius-md, 0.5rem);
		background: color-mix(in srgb, black 55%, transparent);
		color: white;
		text-align: center;
	}

	.demo-blob {
		position: absolute;
		width: 45%;
		aspect-ratio: 1;
		border-radius: var(--hz-radius-full, 9999px);
		box-shadow: 0 0.5rem 1.5rem color-mix(in srgb, black 35%, transparent);
	}

	.demo-blob--a {
		left: 4%;
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 85%, transparent);
	}

	.demo-blob--b {
		right: 4%;
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 85%, transparent);
	}

	/* Staggered across the band, not concentric — each shape owns its own
	 * spot so the different travel speeds read as separation in motion, with
	 * just enough overlap at the edges to show the stacking order. */
	.demo-depth {
		position: absolute;
		border-radius: var(--hz-radius-lg, 0.75rem);
		box-shadow: 0 0.5rem 1.5rem color-mix(in srgb, black 35%, transparent);
	}

	.demo-depth--back {
		left: 6%;
		top: 12%;
		width: 13rem;
		height: 13rem;
		background: color-mix(in srgb, var(--hz-intent-info, #0ea5e9) 75%, transparent);
	}

	.demo-depth--mid {
		left: 34%;
		top: 32%;
		width: 9rem;
		height: 9rem;
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 80%, transparent);
	}

	.demo-depth--front {
		left: 64%;
		top: 18%;
		width: 5rem;
		height: 5rem;
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 90%, transparent);
	}

	.demo-depth--overlay {
		left: 22%;
		top: 8%;
		width: 4rem;
		height: 4rem;
		background: color-mix(in srgb, var(--hz-intent-warning, #d97706) 95%, transparent);
	}

	/* Panel one: both circles start apart, near the top and bottom (overriding
	 * .demo-blob--a/--b's left/right above — same single-class specificity,
	 * source order here decides), offset toward the far side of the panel
	 * rather than dead-center. Their opposing y travel brings them together
	 * as the panel scrolls by. */
	.demo-spread {
		left: 65%;
		right: auto;
		translate: -50% -50%;
	}

	.demo-spread--top {
		top: 20%;
	}

	.demo-spread--bottom {
		top: 80%;
	}

	.sticky-demo {
		height: 20rem;
		overflow-y: auto;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.sticky-section {
		position: sticky;
		top: 0;
	}

	.range-demo {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
</style>
