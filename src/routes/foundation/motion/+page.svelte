<script lang="ts">
	import { tick } from 'svelte';
	import { Stack, Tabs } from '$lib';
	import { motion } from '$lib/tokens';
	import {
		fade as hzFade,
		fly as hzFly,
		slide as hzSlide,
		scale as hzScale,
		revealGroup,
		viewTransition,
		easingCss,
		parseCubicBezier,
		type RevealGroupOptions
	} from '$lib/motion';
	import Example from '../../../docs/Example.svelte';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	// R7 — derive from token metadata (unchanged from the prior page).
	const durationTokens = Object.entries(motion.duration).map(([key, value]) => ({
		key,
		cssVar: `--hz-duration-${key}`,
		value
	}));

	const easeTokens = Object.entries(motion.ease).map(([key, value]) => ({
		key,
		cssVar: `--hz-ease-${key}`,
		value
	}));

	// -------------------------------------------------------------------------
	// Fixed duration demo — the half-travel bug fix. The dot is absolutely
	// positioned inside the track and animates `left` as a percentage of the
	// TRACK'S OWN width (see the .demo-dot / .demo-dot-moved rules below) —
	// never a fixed rem/vw offset — so it reaches the track's far edge at
	// every viewport size, not only wide ones.
	// -------------------------------------------------------------------------
	let durationDemoAnimated = $state(false);

	// -------------------------------------------------------------------------
	// Easing comparison — the three curves at the same duration, plus a
	// plotted curve shape per easing (control points read straight off
	// easingCss via parseCubicBezier — never hand-copied).
	// -------------------------------------------------------------------------
	let easingDemoAnimated = $state(false);
	// Deliberately not a token — this section is about comparing curve
	// *shapes*, not exercising a specific duration token, so a slower,
	// easier-to-see fixed duration reads better than durations.base (250ms).
	const EASING_DEMO_DURATION = 1100;

	const easingCurves = [
		{ key: 'standard', cssVar: '--hz-ease-standard', css: easingCss.standard },
		{ key: 'in', cssVar: '--hz-ease-in', css: easingCss.in },
		{ key: 'out', cssVar: '--hz-ease-out', css: easingCss.out }
	];

	/** A 100x100 viewBox path for a cubic-bezier curve's progress-over-time
	 * shape (x: time, y: progress, SVG y flipped since it grows downward). */
	function curvePath(cssBezier: string): string {
		const [x1, y1, x2, y2] = parseCubicBezier(cssBezier);
		const p1 = `${(x1 * 100).toFixed(2)},${(100 - y1 * 100).toFixed(2)}`;
		const p2 = `${(x2 * 100).toFixed(2)},${(100 - y2 * 100).toFixed(2)}`;
		return `M0,100 C${p1} ${p2} 100,0`;
	}

	// -------------------------------------------------------------------------
	// Transition demos — toggle-driven fade/fly/slide/scale using the R3
	// helpers. One sub-tab per transition; each toggles its own demo box.
	// -------------------------------------------------------------------------
	const transitionTabs = [
		{ id: 'fade', label: 'Fade' },
		{ id: 'fly', label: 'Fly' },
		{ id: 'slide', label: 'Slide' },
		{ id: 'scale', label: 'Scale' }
	];

	let transitionVisible = $state<Record<string, boolean>>({
		fade: true,
		fly: true,
		slide: true,
		scale: true
	});

	function toggleTransition(id: string) {
		transitionVisible[id] = !transitionVisible[id];
	}

	function transitionCode(id: string): string {
		return [
			'- import { ' + id + " } from 'svelte/transition';",
			'+ import { ' + id + " } from '@hyzer-labs/ui/motion';",
			'',
			`{#if visible}`,
			`\t<div transition:${id}>Content</div>`,
			`{/if}`,
			'',
			'<!-- Same params/semantics as the original — duration/easing now',
			'     default to the --hz-duration-* / --hz-ease-* tokens, and',
			'     collapse to duration: 0 under prefers-reduced-motion unless',
			'     you pass { essential: true }. -->'
		].join('\n');
	}

	const essentialCode = [
		"import { fly } from '@hyzer-labs/ui/motion';",
		'',
		'<!-- A focus-guiding movement carries meaning — opt it out of the',
		'     reduced-motion collapse rather than losing the cue entirely. -->',
		'<div transition:fly={{ y: -24, essential: true }}>Jumped to top</div>'
	].join('\n');

	// -------------------------------------------------------------------------
	// Reveal demo — a horizontal strip of cards, staggered by DOM order.
	// Scroll it into view to trigger the entrance, or press Replay to re-run
	// it (revealGroup defaults to once: true, so re-mounting via {#key} is
	// how this demo replays on demand).
	// -------------------------------------------------------------------------
	const revealCards = ['Backhand', 'Forehand', 'Overhand', 'Tomahawk', 'Grenade', 'Thumber'];

	let replayKey = $state(0);
	function replayReveal() {
		replayKey += 1;
	}

	// Entrance variants — `effect` picks the animation style for the whole
	// group (amendment 2026-07-22), mirroring the transition family 1:1:
	// the four tabs here correspond to the four transition demos above
	// (fade/fly/slide/scale), each on the same 160ms stagger.
	const revealModes: {
		id: string;
		label: string;
		options: RevealGroupOptions;
		args: string;
	}[] = [
		{
			id: 'fade',
			label: 'Fade',
			options: { effect: 'fade', stagger: 160 },
			args: "{ effect: 'fade', stagger: 160 }"
		},
		{
			id: 'fly',
			label: 'Fly',
			options: { stagger: 160 },
			args: '{ stagger: 160 }'
		},
		{
			id: 'slide',
			label: 'Slide',
			options: { effect: 'slide', stagger: 160 },
			args: "{ effect: 'slide', stagger: 160 }"
		},
		{
			id: 'scale',
			label: 'Scale',
			options: { effect: 'scale', stagger: 160 },
			args: "{ effect: 'scale', stagger: 160 }"
		}
	];
	const revealModeById = (id: string) => revealModes.find((m) => m.id === id) ?? revealModes[0];

	const revealCode = (id: string) =>
		[
			"import { revealGroup } from '@hyzer-labs/ui/motion';",
			'',
			`<div class="strip" {@attach revealGroup(${revealModeById(id).args})}>`,
			'\t{#each cards as card}',
			'\t\t<div class="card">{card}</div>',
			'\t{/each}',
			'</div>'
		].join('\n');

	// -------------------------------------------------------------------------
	// View transition — a same-page demo (grid/list layout swap) so it works
	// regardless of routing; falls back to an instant swap with no error on
	// browsers without document.startViewTransition.
	// -------------------------------------------------------------------------
	let layout = $state<'grid' | 'list'>('grid');

	function swapLayout() {
		const next = layout === 'grid' ? 'list' : 'grid';
		viewTransition(async () => {
			layout = next;
			await tick();
		});
	}

	const viewTransitionCode = [
		"import { viewTransition } from '@hyzer-labs/ui/motion';",
		'',
		'function swapLayout() {',
		'\tviewTransition(async () => {',
		'\t\tlayout = layout === "grid" ? "list" : "grid";',
		'\t\tawait tick();',
		'\t});',
		'}',
		'',
		'<!-- Unsupported browsers and reduced motion run the update directly',
		'     — an instant swap, no error, no branch needed at the call site. -->'
	].join('\n');

	const onNavigateCode = [
		"import { onNavigate } from '$app/navigation';",
		'',
		'onNavigate((navigation) => {',
		'\tif (!document.startViewTransition) return;',
		'\treturn new Promise((resolve) => {',
		'\t\tdocument.startViewTransition(async () => {',
		'\t\t\tresolve();',
		'\t\t\tawait navigation.complete;',
		'\t\t});',
		'\t});',
		'});'
	].join('\n');
</script>

<svelte:head>
	<title>Motion — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Motion</h1>
		<p class="doc-description">
			Duration and easing tokens, plus <code>@hyzer-labs/ui/motion</code> — token-bridged
			transitions, JS easing evaluators, a scroll-reveal attachment, and a view-transition helper.
			Every helper in the module is reduced-motion-aware by default: it collapses automatically, and
			a <code>{'{ essential: true }'}</code> option opts a specific instance out when the motion
			carries meaning rather than decoration. See
			<a href="#reduced-motion-heading">Reduced motion</a> below.
		</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="duration-heading"
	>
		<h2 id="duration-heading">Duration tokens</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each durationTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="ease-heading"
	>
		<h2 id="ease-heading">Easing tokens</h2>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each easeTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="duration-demo-heading"
	>
		<h2 id="duration-demo-heading">Duration demo</h2>
		<p>
			Each bar animates with a different duration token (standard easing). The dot is positioned
			with an inset-based <code>left</code>, computed as a percentage of the track's own width — it
			reaches the far end of the track at every viewport size, not only wide ones.
		</p>
		<button
			type="button"
			class="demo-trigger"
			onclick={() => (durationDemoAnimated = !durationDemoAnimated)}
		>
			{durationDemoAnimated ? 'Reset' : 'Animate'}
		</button>
		<Stack gap="sm">
			{#each durationTokens as token (token.cssVar)}
				<div class="demo-row">
					<code class="token-name">{token.cssVar}</code>
					<div class="demo-track">
						<div
							class="demo-dot"
							class:demo-dot-moved={durationDemoAnimated}
							style="transition-duration: var({token.cssVar}, {token.value})"
						></div>
					</div>
				</div>
			{/each}
		</Stack>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="easing-comparison-heading"
	>
		<h2 id="easing-comparison-heading">Easing comparison</h2>
		<p>
			The same {EASING_DEMO_DURATION}ms duration, three curves. <code>standard</code> is the house
			default for everything else in the theme (hover/focus state changes);
			<code>out</code>
			decelerates into place — the default this module picks for directional entrances (<code
				>fly</code
			>, <code>scale</code>); <code>in</code> accelerates away, the mirror for exits.
		</p>
		<button
			type="button"
			class="demo-trigger"
			onclick={() => (easingDemoAnimated = !easingDemoAnimated)}
		>
			{easingDemoAnimated ? 'Reset' : 'Animate'}
		</button>
		<Stack gap="sm">
			{#each easingCurves as curve (curve.cssVar)}
				<div class="demo-row">
					<code class="token-name">{curve.cssVar}</code>
					<div class="demo-track">
						<div
							class="demo-dot"
							class:demo-dot-moved={easingDemoAnimated}
							style="transition-duration: {EASING_DEMO_DURATION}ms; transition-timing-function: var({curve.cssVar}, {curve.css})"
						></div>
					</div>
				</div>
			{/each}
		</Stack>
		<div class="curve-plots">
			{#each easingCurves as curve (curve.cssVar)}
				<figure class="curve-plot">
					<svg viewBox="0 0 100 100" role="img" aria-labelledby="curve-title-{curve.key}">
						<title id="curve-title-{curve.key}">
							{curve.cssVar} plotted as progress over time
						</title>
						<line x1="0" y1="100" x2="100" y2="100" class="curve-axis" />
						<line x1="0" y1="0" x2="0" y2="100" class="curve-axis" />
						<path d={curvePath(curve.css)} class="curve-path" />
					</svg>
					<figcaption>{curve.key}</figcaption>
				</figure>
			{/each}
		</div>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="transitions-heading"
	>
		<h2 id="transitions-heading">Transitions</h2>
		<p class="tab-note">
			Drop-in replacements for <code>svelte/transition</code>'s <code>fade</code>/<code>fly</code
			>/<code>slide</code>/<code>scale</code> — same params, same return shape. The only change is the
			import line; duration and easing now default to the tokens above.
		</p>
		<Tabs items={transitionTabs} ariaLabel="Transition demos" defaultTab="fade">
			{#snippet panel(item)}
				<div class="tab-content">
					<Example code={transitionCode(item.id)}>
						<button type="button" class="demo-trigger" onclick={() => toggleTransition(item.id)}>
							{transitionVisible[item.id] ? 'Hide' : 'Show'}
						</button>
						<div class="transition-stage">
							{#if item.id === 'fade'}
								{#if transitionVisible.fade}
									<div class="transition-box" transition:hzFade>Fade</div>
								{/if}
							{:else if item.id === 'fly'}
								{#if transitionVisible.fly}
									<div class="transition-box" transition:hzFly={{ y: 24 }}>Fly</div>
								{/if}
							{:else if item.id === 'slide'}
								{#if transitionVisible.slide}
									<div class="transition-box" transition:hzSlide>Slide</div>
								{/if}
							{:else if transitionVisible.scale}
								<div class="transition-box" transition:hzScale>Scale</div>
							{/if}
						</div>
					</Example>
				</div>
			{/snippet}
		</Tabs>
		<p class="tab-note">
			A specific instance can opt out of the reduced-motion collapse when the motion itself carries
			meaning:
		</p>
		<CodeBlock code={essentialCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="reveal-heading"
	>
		<h2 id="reveal-heading">Scroll reveal</h2>
		<p class="tab-note">
			<code>revealGroup</code> hides a container's children on the client only (SSR and no-JS readers
			always see the content), then plays a staggered WAAPI entrance the first time the container intersects
			the viewport. Scroll this card strip into view, or press Replay.
		</p>
		<p class="tab-note">
			<code>effect</code> picks the animation style for the whole group and mirrors the transition
			family above 1:1 — <code>fade</code>, <code>fly</code> (the default), <code>slide</code>,
			<code>scale</code> — while <code>stagger</code> offsets each child by DOM order.
			<code>fly</code> steers by its <code>x</code>/<code>y</code> offsets: positive <code>y</code>
			rises from below (the default, <code>y: 16</code>), negative <code>y</code> drops from above,
			<code>x</code> travels in from the side. <code>slide</code> expands from the center line of
			<code>axis</code> without moving the box, and <code>scale</code> grows from
			<code>start</code>.
		</p>
		<Tabs
			items={revealModes.map((m) => ({ id: m.id, label: m.label }))}
			ariaLabel="Reveal entrance"
			defaultTab="fade"
		>
			{#snippet panel(item)}
				<div class="tab-content">
					<Example code={revealCode(item.id)}>
						<button type="button" class="demo-trigger" onclick={replayReveal}>Replay</button>
						{#key `${replayKey}-${item.id}`}
							<div class="reveal-strip" {@attach revealGroup(revealModeById(item.id).options)}>
								{#each revealCards as card (card)}
									<div class="reveal-card">{card}</div>
								{/each}
							</div>
						{/key}
					</Example>
				</div>
			{/snippet}
		</Tabs>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="view-transition-heading"
	>
		<h2 id="view-transition-heading">View transitions</h2>
		<p class="tab-note">
			<code>viewTransition(update)</code> wraps <code>document.startViewTransition</code> —
			unsupported browsers and reduced motion run <code>update()</code> directly instead, an instant swap
			with the exact same return shape either way. This demo swaps a local layout state (not a page navigation),
			so it works the same regardless of routing.
		</p>
		<Example code={viewTransitionCode}>
			<button type="button" class="demo-trigger" onclick={swapLayout}>
				Switch to {layout === 'grid' ? 'list' : 'grid'} layout
			</button>
			<div class="layout-demo" class:layout-demo--list={layout === 'list'}>
				{#each ['Ace', 'Birdie', 'Eagle', 'Bogey'] as label (label)}
					<div class="layout-demo-item">{label}</div>
				{/each}
			</div>
		</Example>
		<p class="tab-note">
			For real page-navigation cross-fades, SvelteKit's <code>onNavigate</code> is the integration point
			— three lines, and it doesn't even need this helper (the DOM update it wraps is the navigation itself):
		</p>
		<CodeBlock code={onNavigateCode} />
		<p class="note">
			The reference theme adds no default <code>::view-transition-*</code> styling — the browser's own
			root cross-fade is already a sensible default. Customizing it is consumer CSS, on the same tokens
			as everything else:
		</p>
		<CodeBlock
			code={[
				'::view-transition-old(root),',
				'::view-transition-new(root) {',
				'\tanimation-duration: var(--hz-duration-base);',
				'\tanimation-timing-function: var(--hz-ease-standard);',
				'}'
			].join('\n')}
		/>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="reduced-motion-heading"
	>
		<h2 id="reduced-motion-heading">Reduced motion</h2>
		<p>
			Every helper in <code>@hyzer-labs/ui/motion</code> collapses automatically under
			<code>prefers-reduced-motion: reduce</code>
			— transitions run at <code>duration: 0</code>, <code>reveal</code>/<code>revealGroup</code>
			show their content immediately with no hidden state ever applied, and
			<code>viewTransition</code> runs its update directly instead of starting a real transition.
			Pass <code>{'{ essential: true }'}</code> on any of them to play the full animation anyway — reserve
			it for motion that carries meaning (a focus-guiding movement, for example), not decoration. The
			state is read fresh on every call, so a preference change mid-session is honored on the very next
			transition/reveal/view-transition — no reload needed.
		</p>
		<p>
			This is the script-side counterpart to the reference theme's own
			<code>@media (prefers-reduced-motion: reduce)</code> collapse on its CSS transitions — that stays
			exactly as-is; this module doesn't replace it, it extends the same default to script-driven motion.
		</p>
		<p>
			Override <code>--hz-duration-*</code> or <code>--hz-ease-*</code> with a plain CSS custom
			property, or set <code>motion</code> in the <code>hyzer</code> config; see
			<a href="/theming/tokens">Theming &rarr; Tokens &amp; Overrides</a>.
		</p>
	</Stack>
</Stack>

<style>
	/* Margin zeroed — every top-level p on this page is a direct child of a
	 * .doc-section Stack (gap="away", data-density-shift), which now owns the
	 * rhythm; nested paragraphs (.tab-note, inside Example/.tab-content) keep
	 * their own more-specific overrides, unaffected. */
	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.note {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.token-table-wrapper {
		overflow-x: auto;
	}

	.token-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.token-table th,
	.token-table td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.demo-trigger {
		margin-bottom: 1rem;
		padding: 0.375rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	/* The duration-demo and easing-comparison sections use this button as a
	 * direct child of the .doc-section Stack (gap="away", data-density-shift),
	 * which already provides the space below it — zero the margin there. The
	 * transitions/reveal/view-transition sections' triggers live inside
	 * Example, unaffected, and keep the margin above. */
	:global(.doc-section) > .demo-trigger {
		margin-bottom: 0;
	}

	.demo-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.token-name {
		min-width: 12rem;
	}

	/* The half-travel bug fix: the track is the positioning context and the
	 * dot animates `left` as a percentage of the TRACK'S OWN width — never a
	 * fixed rem/vw offset — so it reaches the far edge at every viewport
	 * size. See .demo-dot / .demo-dot-moved below. */
	.demo-track {
		position: relative;
		flex: 1;
		min-width: 8rem;
		height: 1.5rem;
		padding: 0.25rem;
		border-radius: var(--hz-radius-full, 9999px);
		background-color: color-mix(in srgb, var(--hz-color-gray, #6b7280) 12%, transparent);
	}

	.demo-dot {
		position: absolute;
		top: 50%;
		left: 0.25rem;
		width: 1rem;
		height: 1rem;
		transform: translateY(-50%);
		border-radius: var(--hz-radius-full, 9999px);
		background-color: var(--hz-color-primary, #2563eb);
		transition-property: left;
		transition-timing-function: var(--hz-ease-standard, ease);
	}

	/* 100% resolves against the track's own (padding-box) width — subtract
	 * the dot's diameter plus the same 0.25rem inset the resting state uses,
	 * so the dot ends flush against the track's far inner edge, symmetric
	 * with where it starts. */
	.demo-dot-moved {
		left: calc(100% - 1.25rem);
	}

	@media (prefers-reduced-motion: reduce) {
		.demo-dot {
			transition-duration: 0.01ms !important;
		}
	}

	/* Margin zeroed — direct child of the easing-comparison section Stack
	 * (gap="away", data-density-shift), which now owns the space above it. */
	.curve-plots {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.curve-plot {
		margin: 0;
		width: 8rem;
	}

	.curve-plot svg {
		width: 100%;
		height: 8rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
		background-color: color-mix(in srgb, var(--hz-color-gray, #6b7280) 6%, transparent);
	}

	.curve-axis {
		stroke: var(--hz-color-border, #6b7280);
		stroke-width: 1;
	}

	.curve-path {
		fill: none;
		stroke: var(--hz-color-primary, #2563eb);
		stroke-width: 3;
	}

	.curve-plot figcaption {
		margin-top: 0.375rem;
		text-align: center;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.transition-stage {
		display: flex;
		align-items: center;
		min-height: 4rem;
	}

	.transition-box {
		padding: 0.75rem 1.5rem;
		border-radius: var(--hz-radius-md, 0.5rem);
		background-color: var(--hz-color-primary, #2563eb);
		color: var(--hz-color-surface, #fff);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.reveal-strip {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		/* The entrance offsets (±16px y) animate inside this block padding;
		   overflow-y hidden keeps the strip from growing a vertical
		   scrollbar mid-animation. */
		overflow-y: hidden;
		padding: 1.25rem 0.25rem;
	}

	.reveal-card {
		flex: 0 0 8rem;
		padding: 1.5rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background-color: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-color-gray, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
		text-align: center;
		font-weight: var(--hz-font-weight-medium, 500);
	}

	.layout-demo {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	.layout-demo--list {
		grid-template-columns: 1fr;
	}

	.layout-demo-item {
		padding: 0.75rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background-color: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-color-gray, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
	}
</style>
