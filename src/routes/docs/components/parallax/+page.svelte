<script lang="ts">
	import { Container, Image, Parallax, ParallaxLayer, RadioGroup, Tabs } from '$lib';
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
		{ id: 'depth', label: 'Depth' },
		{ id: 'sticky', label: 'Sticky sections' },
		{ id: 'tuning', label: 'Tuning' }
	];
</script>

<DocPage name="Parallax" {...parallaxDoc}>
	<p class="tab-note">
		A band with no in-flow content has no height — give it one with <code>style</code>, a
		<code>class</code>, or real content, the way every demo below does with
		<code>min-height</code>. Every stage below is a bounded, scrollable demo box — scroll inside the
		frame to see the layers move; on a real page, the page's own scroll drives this the same way.
	</p>
	<Tabs items={demoTabs} ariaLabel="Parallax demos" defaultTab="hero">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'hero'}
					<p class="tab-note">
						A slow background layer behind foreground copy. The layer is a plain
						<code>ParallaxLayer</code> holding an <code>Image</code>; the copy is an ordinary
						<code>Container</code> child, so it determines the band's height and sits above the
						layer by default (layers default to <code>z-index: -1</code>).
					</p>
					<Example code={heroCode}>
						<ScrollStage>
							<Parallax as="section" class="demo-band demo-band--hero">
								<ParallaxLayer y="16rem" class="demo-layer">
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
						Two layers with opposite <code>x</code> travel drift sideways as the page scrolls vertically
						— the effect people usually mean by "horizontal parallax". Travel is a distance, not a speed:
						it's how far a layer moves over the band's whole pass through the viewport, not how fast.
					</p>
					<Example code={horizontalCode}>
						<ScrollStage>
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
				{:else if item.id === 'depth'}
					<p class="tab-note">
						Three layers with increasing travel read as depth — the farthest-feeling layer moves
						least. A fourth layer sets <code>z</code> to <code>1</code> to drift in front of the copy
						instead of behind it, showing how the stacking order works.
					</p>
					<Example code={depthCode}>
						<ScrollStage>
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
						Stacked full-screen sections are composition, not a feature: your own
						<code>position: sticky</code> wrapper goes <strong>outside</strong> each
						<code>Parallax</code> band, because the band clips — a sticky element placed inside it would
						only stick within its own bounds. This stage is already its own scroll container, which also
						proves the timeline tracks whichever scroller is nearest, not only the page.
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
						Travel is meant to be tuned per breakpoint, not hardcoded. Set
						<code>--hz-parallax-x</code>/<code>--hz-parallax-y</code> in your own class and leave
						the <code>x</code>/<code>y</code> props unset — an inline style always wins over a
						stylesheet rule, so the two forms are mutually exclusive. On a short viewport a large
						travel reads as jitter and costs battery, so a smaller (or zero) travel below your
						<code>md</code> breakpoint is worth doing.
					</p>
					<Example code={tuningBreakpointCode}>
						<ScrollStage>
							<Parallax class="demo-band">
								<ParallaxLayer class="demo-layer tuning-art">
									<div class="demo-depth demo-depth--mid"></div>
								</ParallaxLayer>
							</Parallax>
						</ScrollStage>
					</Example>
					<p class="tab-note">
						<code>--hz-parallax-range</code> narrows which part of the band's pass through the viewport
						the drift is spread over. Pick a range, then rescroll the stage to feel the difference.
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
							<ScrollStage>
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
		align-items: flex-end;
	}

	:global(.demo-band--sticky) {
		min-height: 20rem;
	}

	:global(.demo-band--range) {
		min-height: 20rem;
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
