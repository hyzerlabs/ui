<script lang="ts">
	import {
		Alert,
		Container,
		HorizontalScroll,
		Parallax,
		ParallaxLayer,
		RadioGroup,
		Tabs,
		Toggle
	} from '$lib';
	import IconInfo from '$lib/icons/generated/info.svelte';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { horizontalScrollDoc } from '../../../../docs/data/horizontal-scroll.js';
	import Example from '../../../../docs/Example.svelte';

	// Token-based panel identity — four registered intents, cycled, so panel
	// boundaries and the horizontal travel are unmistakable while scrolling
	// (no same-colored empty panels reading as "nothing is happening").
	const PANEL_INTENTS = ['primary', 'secondary', 'info', 'warning'] as const;
	function panelBg(i: number): string {
		const intent = PANEL_INTENTS[i % PANEL_INTENTS.length];
		return `color-mix(in srgb, var(--hz-intent-${intent}, #2563eb) 55%, var(--hz-color-surface, #fff))`;
	}
	const PANEL_COUNT = 4;
	const panels = Array.from({ length: PANEL_COUNT }, (_, i) => i);

	// Opening demo — wheel is on by default, so a plain <HorizontalScroll>
	// already answers to a mouse wheel, touch, trackpad, the scrollbar, and the
	// keyboard, with nothing switched on.
	const scrollCode = [
		'<HorizontalScroll>',
		'\t<section>Panel one</section>',
		'\t<section>Panel two</section>',
		'\t<section>Panel three</section>',
		'\t<section>Panel four</section>',
		'</HorizontalScroll>',
		'',
		'<!-- wheel is on by default: a plain mouse wheel already moves this',
		'     sideways, and it hands off to the page at either end -->'
	].join('\n');

	const nativeOnlyCode = [
		'<HorizontalScroll wheel={false}>',
		'\t…panels…',
		'</HorizontalScroll>'
	].join('\n');

	// Panel width & gap — reactive demo (the Parallax page's RadioGroup +
	// $derived.by code fence idiom): one control, live preview and code fence
	// together.
	const widthOptions = [
		{ value: '100%', label: '100% — one panel per screen (default)' },
		{ value: '70%', label: '70% — the next panel peeks in' },
		{ value: 'auto', label: 'auto — sized to its own content' }
	];
	let demoWidth = $state<'100%' | '70%' | 'auto'>('100%');
	let demoGap = $state(false);
	const widthCode = $derived.by(() =>
		[
			'<HorizontalScroll',
			`\tstyle="--hz-horizontal-scroll-panel-width: ${demoWidth};${
				demoGap ? ' --hz-horizontal-scroll-gap: 1rem;' : ''
			}"`,
			'>',
			'\t…panels…',
			'</HorizontalScroll>'
		].join('\n')
	);

	const snapCode = [
		'<HorizontalScroll>       <!-- free-flowing, the default -->',
		'\t…panels…',
		'</HorizontalScroll>',
		'',
		'<HorizontalScroll snap>  <!-- snaps to each panel start -->',
		'\t…panels…',
		'</HorizontalScroll>'
	].join('\n');

	const withParallaxCode = [
		'<HorizontalScroll>',
		'\t<!-- panel one: two circles start far apart, near the top and bottom,',
		'\t     and opposing y (cross-axis) travel brings them together as you',
		'\t     scroll right -->',
		'\t<Parallax axis="x" class="panel">',
		'\t\t<ParallaxLayer y="16rem">…top, drifts down…</ParallaxLayer>',
		'\t\t<ParallaxLayer y="-16rem">…bottom, drifts up…</ParallaxLayer>',
		'\t\t<Container><h3>Panel one</h3></Container>',
		'\t</Parallax>',
		'\t<!-- panel two: classic speed-difference drift — staggered layers,',
		'\t     same-axis x travel at different magnitudes -->',
		'\t<Parallax axis="x" class="panel">',
		'\t\t<ParallaxLayer x="4rem">…</ParallaxLayer>',
		'\t\t<ParallaxLayer x="9rem">…</ParallaxLayer>',
		'\t\t<ParallaxLayer x="16rem">…</ParallaxLayer>',
		'\t</Parallax>',
		'\t<Parallax axis="x" class="panel">…</Parallax>',
		'</HorizontalScroll>'
	].join('\n');

	const demoTabs = [
		{ id: 'scroll', label: 'Scroll it' },
		{ id: 'width', label: 'Panel width & gap' },
		{ id: 'snap', label: 'Snapping' },
		{ id: 'native', label: 'Native-only' },
		{ id: 'parallax', label: 'With Parallax' }
	];
</script>

<DocPage name="HorizontalScroll" {...horizontalScrollDoc}>
	<p class="tab-note">
		Every demo below sets <code>--hz-horizontal-scroll-height</code> to a small height with a page
		class, so it scrolls in place instead of taking over the viewport the way a real full-page shell
		would. There's no separate demo box here: what you're looking at
		<strong>is</strong> the component, at any height you give it.
	</p>
	<p class="tab-note">
		The scrollbar stays on purpose. At rest it is the only sign that the shell scrolls sideways, and
		it gives a pointer path to anyone who cannot drag or use a wheel. There's no prop to hide it,
		but your own <code>scrollbar-width: thin</code> will slim it. If a shell like this is your
		page's main content, give it <code>role="region"</code> and a label, or use
		<code>as="main"</code>: a plain scroll region only needs to be a tab stop for keyboard access,
		but a landmark needs both a role and a name. A panel that needs to scroll vertically should be
		its own scroller, since this shell only ever moves sideways.
	</p>
	<Tabs items={demoTabs} ariaLabel="HorizontalScroll demos" defaultTab="scroll">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'scroll'}
					<p class="tab-note">
						A panel is any direct child. There's no <code>Panel</code> subcomponent and no wrapper
						element. <code>wheel</code> is on by default, so a plain mouse wheel already moves the shell
						sideways with nothing switched on. Try it below, along with the scrollbar, a two-finger trackpad
						pan, a touch swipe, or tabbing in and pressing an arrow key. Then keep wheeling once you reach
						the last panel: the shell hands the wheel back, and this page keeps scrolling underneath you.
					</p>
					<Example code={scrollCode}>
						<HorizontalScroll class="demo-hscroll demo-hscroll--bounded">
							{#each panels as i (i)}
								<section class="demo-panel" style="background: {panelBg(i)}">
									<h3>Panel {i + 1}</h3>
								</section>
							{/each}
						</HorizontalScroll>
					</Example>
				{:else if item.id === 'width'}
					<p class="tab-note">
						One custom property controls how much of the shell each panel fills. <code>100%</code>
						gives one panel per screen. A smaller value like <code>70%</code> leaves the next panel
						peeking in, a hint that there's more. <code>auto</code> sizes each panel to its own
						content instead of to the shell. <code>--hz-horizontal-scroll-gap</code> adds space between
						panels, and you can set both per breakpoint in your own class.
					</p>
					<Example code={widthCode}>
						<div class="width-demo">
							<RadioGroup
								name="hscroll-panel-width"
								label="--hz-horizontal-scroll-panel-width"
								orientation="horizontal"
								options={widthOptions}
								bind:value={demoWidth}
							/>
							<Toggle name="hscroll-gap" label="Add a 1rem gap" bind:checked={demoGap} />
							<HorizontalScroll
								class="demo-hscroll demo-hscroll--bounded"
								style="--hz-horizontal-scroll-panel-width: {demoWidth}; --hz-horizontal-scroll-gap: {demoGap
									? '1rem'
									: '0'};"
							>
								{#each panels as i (i)}
									<div
										class="demo-panel"
										class:demo-panel--auto={demoWidth === 'auto'}
										style="background: {panelBg(i)}"
									>
										<h3>Panel {i + 1}</h3>
									</div>
								{/each}
							</HorizontalScroll>
						</div>
					</Example>
				{:else if item.id === 'snap'}
					<p class="tab-note">
						Free-flowing scrolling is the default here, on purpose. Unlike the carousel rail's small
						cards, these panels are viewport-sized and meant to be <em>read</em> while they move, so
						snapping every panel into place would fight each partial gesture. Turn <code>snap</code> on
						when you want panels to land cleanly instead. Compare the two below.
					</p>
					<Example code={snapCode}>
						<div class="snap-compare">
							<div>
								<p class="snap-label">Free-flowing (default)</p>
								<HorizontalScroll class="demo-hscroll demo-hscroll--bounded demo-hscroll--half">
									{#each panels as i (i)}
										<div class="demo-panel" style="background: {panelBg(i)}">
											<h3>Panel {i + 1}</h3>
										</div>
									{/each}
								</HorizontalScroll>
							</div>
							<div>
								<p class="snap-label"><code>snap</code></p>
								<HorizontalScroll
									snap
									class="demo-hscroll demo-hscroll--bounded demo-hscroll--half"
								>
									{#each panels as i (i)}
										<div class="demo-panel" style="background: {panelBg(i)}">
											<h3>Panel {i + 1}</h3>
										</div>
									{/each}
								</HorizontalScroll>
							</div>
						</div>
					</Example>
					<p class="tab-note">
						Want exactly one panel per gesture, even on a fast flick? The component does not set
						that, so add <code>scroll-snap-stop: always</code> to your own panel class. Without it, a
						fast swipe can sail straight past a snap point.
					</p>
				{:else if item.id === 'native'}
					<p class="tab-note">
						Set <code>wheel</code> to <code>false</code> and the mouse wheel scrolls the page again, same
						as any other block. The shell then answers only to touch, trackpad panning, the scrollbar,
						and the keyboard. Pinch-zoom, shift+wheel, and a trackpad's own horizontal pan are left alone
						either way, wheel on or off. If a panel scrolls vertically on its own (a long list, an overflowing
						card), an enabled remap defers to it: wheeling over that inner scroller scrolls it first,
						and the shell takes over only once the inner one reaches its end in that direction.
					</p>
					<Example code={nativeOnlyCode}>
						<HorizontalScroll
							wheel={false}
							class="demo-hscroll demo-hscroll--bounded demo-hscroll--half"
						>
							{#each panels as i (i)}
								<div class="demo-panel" style="background: {panelBg(i)}">
									<h3>Panel {i + 1}</h3>
								</div>
							{/each}
						</HorizontalScroll>
					</Example>
				{:else}
					<p class="tab-note">
						A <code>Parallax</code> band works as a panel: it gets its height from flex stretch, so
						it needs no <code>min-height</code>, unlike a band in normal page flow. Each one also
						needs
						<code>axis="x"</code>, because the shell never scrolls vertically and a band left on the
						default <code>axis="y"</code> would sit still. In panel one the circles start far apart,
						near the top and bottom, and opposing <code>y</code> (cross-axis) travel brings them
						together as you scroll. In panel two the shapes start staggered, and <code>x</code>
						travel at different distances drifts them at different speeds. The motion rules are the same
						here: layers stop drifting for visitors who ask for less motion, while scrolling the shell
						itself always works.
					</p>
					<Alert intent="info">
						{#snippet icon()}<IconInfo />{/snippet}
						Layer travel, depth, and tuning live on the
						<a href="/docs/components/parallax">Parallax</a> page.
					</Alert>
					<Example code={withParallaxCode}>
						<HorizontalScroll class="demo-hscroll demo-hscroll--bounded">
							<Parallax axis="x" class="demo-panel-band">
								<ParallaxLayer y="16rem" class="demo-layer">
									<div class="demo-blob demo-blob--a demo-spread demo-spread--top"></div>
								</ParallaxLayer>
								<ParallaxLayer y="-16rem" class="demo-layer">
									<div class="demo-blob demo-blob--b demo-spread demo-spread--bottom"></div>
								</ParallaxLayer>
								<Container class="demo-copy"><h3>Panel one</h3></Container>
							</Parallax>
							<Parallax axis="x" class="demo-panel-band">
								<ParallaxLayer x="4rem" class="demo-layer">
									<div class="demo-depth demo-depth--back"></div>
								</ParallaxLayer>
								<ParallaxLayer x="9rem" class="demo-layer">
									<div class="demo-depth demo-depth--mid"></div>
								</ParallaxLayer>
								<ParallaxLayer x="16rem" class="demo-layer">
									<div class="demo-depth demo-depth--front"></div>
								</ParallaxLayer>
								<Container class="demo-copy"><h3>Panel two</h3></Container>
							</Parallax>
							<Parallax axis="x" class="demo-panel-band">
								<ParallaxLayer x="6rem" class="demo-layer">
									<div class="demo-depth demo-depth--back"></div>
								</ParallaxLayer>
								<Container class="demo-copy"><h3>Panel three</h3></Container>
							</Parallax>
						</HorizontalScroll>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	/*
	 * HorizontalScroll is a child component, so a class handed to it via its
	 * `class` prop needs :global() — Svelte can't see it land on a literal
	 * element in this template (the Split.svelte.spec.ts `.pad-frame`
	 * precedent, reused on the Parallax docs page too).
	 */
	:global(.demo-hscroll) {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	:global(.demo-hscroll--bounded) {
		--hz-horizontal-scroll-height: 20rem;
	}

	:global(.demo-hscroll--half) {
		--hz-horizontal-scroll-height: 14rem;
	}

	.demo-panel {
		position: relative;
		display: flex;
		align-items: flex-end;
		padding: 1.5rem;
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.demo-panel--auto {
		inline-size: 16rem;
		flex: 0 0 auto;
	}

	.width-demo,
	.snap-compare {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.snap-label {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Parallax used as a panel — no min-height (flex stretch gives it full
	 * height), unlike every .demo-band on the Parallax page's own demos. */
	:global(.demo-panel-band) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.demo-layer) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

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

	/* Panel one: both circles start apart, near the top and bottom (overriding
	 * left/right above — same single-class specificity, source order
	 * decides), offset toward the far side of the panel rather than
	 * dead-center. Their opposing y travel brings them together as the panel
	 * scrolls by. */
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

	.demo-depth {
		position: absolute;
		border-radius: var(--hz-radius-lg, 0.75rem);
		box-shadow: 0 0.5rem 1.5rem color-mix(in srgb, black 35%, transparent);
		width: 8rem;
		height: 8rem;
	}

	/* Panel two's staggered trio — distinct positions so the different x
	 * travel magnitudes read as depth, not an overlapping deck. */
	.demo-depth--back {
		left: 12%;
		top: 55%;
		background: color-mix(in srgb, var(--hz-intent-info, #0ea5e9) 75%, transparent);
	}

	.demo-depth--mid {
		left: 42%;
		top: 25%;
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 80%, transparent);
	}

	.demo-depth--front {
		left: 68%;
		top: 50%;
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 90%, transparent);
	}
</style>
