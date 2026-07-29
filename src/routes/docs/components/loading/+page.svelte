<script lang="ts">
	import { Loading, Tabs, Stack, Cluster } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { loadingDoc } from '../../../../docs/data/loading.js';
	import Example from '../../../../docs/Example.svelte';

	const sizes = ['sm', 'md', 'lg'] as const;
	const intents = [
		'neutral',
		'primary',
		'secondary',
		'danger',
		'warning',
		'success',
		'info'
	] as const;

	// ------------------------------------------------------------------
	// Demo 1 — variants: the base indeterminate presentations, plus ring's
	// determinate arc (R17, amended 2026-07-27 — the spinner/ring split).
	// ------------------------------------------------------------------

	const variantsCode = [
		'<Loading label="Loading results" />                    <!-- variant="bar" (default), indeterminate -->',
		'<Loading variant="spinner" label="Saving" />            <!-- indeterminate spin -->',
		'<Loading variant="ring" label="Loading" size="lg" />    <!-- indeterminate: a rotating, pulsing arc -->',
		'<Loading variant="ring" value={62} label="Uploading" showValue size="lg" /> <!-- determinate: a static arc -->',
		'<Loading variant="dots" label="Loading" />'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 2 — progressive enhancement: a `value` turns the bar AND the
	// ring determinate, side by side (R3/R17, amended).
	// ------------------------------------------------------------------

	let uploadValue = $state(62);

	const enhancementCode = $derived(
		[
			`let value = $state(${uploadValue});`,
			'',
			'<Loading {value} label="Uploading photos" showValue />                   <!-- linear bar -->',
			'<Loading variant="ring" {value} label="Uploading photos" showValue size="lg" /> <!-- circular ring -->'
		].join('\n')
	);

	// ------------------------------------------------------------------
	// Demo 3 — non-percentage units via a custom `format`, linear and
	// circular (R17, amended).
	// ------------------------------------------------------------------

	const formatCode = [
		'<Loading',
		'\tvalue={3}',
		'\tmax={5}',
		'\tlabel="Import"',
		'\tformat={(v, max) => `${v} of ${max} files`}',
		'\tshowValue',
		'/>',
		'',
		'<!-- the ring has far less room, so a shorter format reads better centered inside it -->',
		'<Loading',
		'\tvariant="ring"',
		'\tvalue={3}',
		'\tmax={5}',
		'\tlabel="Import"',
		'\tformat={(v, max) => `${v}/${max}`}',
		'\tshowValue',
		'\tsize="lg"',
		'/>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 4 — timing: the --hz-loading-speed (duration) + --hz-loading-pulse-width
	// (the bar highlight's width) hooks, live. Both the bar sweep and the spinner
	// rotation stay linear regardless (Decisions 7/8) — only the duration and the
	// bar's pulse width are tunable here. Pulse width affects the bar only.
	// ------------------------------------------------------------------

	let speedMs = $state(2400);
	let pulseWidth = $state(150);

	// Written per-instance (not on a wrapping ancestor): loading.css declares
	// --hz-loading-speed/-pulse-width directly on .hz-loading itself (the R8
	// default), and a directly-matching declaration always wins over a value
	// that would otherwise inherit down from an ancestor — so a style set on a
	// wrapping <div> around several <Loading>s is silently shadowed by their own
	// default. Passing `style` straight to each <Loading> lands it on the
	// component's own root (via ...rest), where it is real inline style and
	// wins outright.
	const timingStyle = $derived(
		`--hz-loading-speed: ${speedMs}ms; --hz-loading-pulse-width: ${pulseWidth}%;`
	);

	const timingCode = $derived(
		[
			`const style = '--hz-loading-speed: ${speedMs}ms; --hz-loading-pulse-width: ${pulseWidth}%;';`,
			'',
			'<Loading variant="bar" {style} label="Loading results" />  <!-- pulse width tunes the bar highlight -->',
			'<Loading variant="spinner" {style} label="Saving" />  <!-- spin stays linear -->',
			'<Loading variant="ring" {style} label="Loading" />  <!-- rotation stays linear; the arc-length pulse follows speed -->',
			'<Loading variant="dots" {style} label="Loading" />'
		].join('\n')
	);

	// ------------------------------------------------------------------
	// Demo 5 — intents: every registered intent, shown as its own row of
	// [spinner] [ring] [bar] [dots] — one color at a time, across the whole
	// variant family, rather than one variant across every color.
	// ------------------------------------------------------------------

	function intentRowCode(intent: (typeof intents)[number]): string {
		return [
			`<Loading variant="spinner" intent="${intent}" label="${intent}, spinner" />`,
			`<Loading variant="ring" intent="${intent}" label="${intent}, ring" />`,
			`<Loading variant="bar" intent="${intent}" label="${intent}, bar" />`,
			`<Loading variant="dots" intent="${intent}" label="${intent}, dots" />`
		].join('\n');
	}

	const intentsCode = intents
		.map((intent) => `<!-- ${intent} -->\n${intentRowCode(intent)}`)
		.join('\n\n');

	// ------------------------------------------------------------------
	// Demo 6 — sizes: every size, shown as its own row of
	// [spinner] [ring] [bar] [dots] — the same "one setting, every variant"
	// treatment as the intents demo above.
	// ------------------------------------------------------------------

	function sizeRowCode(size: (typeof sizes)[number]): string {
		return [
			`<Loading variant="spinner" size="${size}" label="Loading, ${size}, spinner" />`,
			`<Loading variant="ring" size="${size}" label="Loading, ${size}, ring" />`,
			`<Loading variant="bar" size="${size}" label="Loading, ${size}, bar" />`,
			`<Loading variant="dots" size="${size}" label="Loading, ${size}, dots" />`
		].join('\n');
	}

	const sizesCode = sizes.map((size) => `<!-- ${size} -->\n${sizeRowCode(size)}`).join('\n\n');

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'enhancement', label: 'Progressive enhancement' },
		{ id: 'format', label: 'Custom format' },
		{ id: 'intents', label: 'Intents' },
		{ id: 'sizes', label: 'Sizes' },
		{ id: 'timing', label: 'Timing' }
	];
</script>

<DocPage name="Loading" {...loadingDoc}>
	<Tabs items={demoTabs} ariaLabel="Loading demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<p class="tab-note">
						Loading is indeterminate unless you give it a value. <code>bar</code> (the default),
						<code>spinner</code>
						(the same <code>IconLoader</code> glyph Button's loading state renders),
						<code>ring</code>
						(a rotating loader whose arc grows and shrinks), and <code>dots</code> (a three-dot
						ellipsis loader) all say "something is happening" with no value attached. Add a
						<code>value</code>
						and <code>ring</code> becomes a
						<strong>determinate circular arc</strong>: static, shown here alongside its
						indeterminate spin. <code>spinner</code> and <code>dots</code> stay indeterminate only,
						so a
						<code>value</code> passed to either is ignored (dev-warn).
					</p>
					<Example code={variantsCode}>
						<Stack gap="md">
							<Loading label="Loading results" />
							<Loading variant="spinner" label="Saving" />
							<Loading variant="ring" label="Loading" size="lg" />
							<Loading variant="ring" value={62} label="Uploading" showValue size="lg" />
							<Loading variant="dots" label="Loading" />
						</Stack>
					</Example>
				{:else if item.id === 'enhancement'}
					<p class="tab-note">
						Passing a <code>value</code> turns the <code>bar</code> into a determinate native
						<code>&lt;progress value max&gt;</code>, and the
						<code>ring</code>
						into an SVG arc that fills to <code>value / max</code>. <code>showValue</code> renders a
						formatted readout: inline beside the bar, centered inside the ring. That same string
						feeds
						<code>aria-valuetext</code>
						when a custom <code>format</code> or a <code>max</code> other than 100 is in play.
					</p>
					<Example code={enhancementCode}>
						<Stack gap="md">
							<Cluster gap="lg" align="center">
								<Loading value={uploadValue} label="Uploading photos" showValue />
								<Loading
									variant="ring"
									value={uploadValue}
									label="Uploading photos"
									showValue
									size="lg"
								/>
							</Cluster>
							<input
								type="range"
								min="0"
								max="100"
								bind:value={uploadValue}
								aria-label="Adjust the demo upload progress"
							/>
						</Stack>
					</Example>
				{:else if item.id === 'format'}
					<p class="tab-note">
						<code>format</code> feeds both the visible readout and <code>aria-valuetext</code>. Pass
						one for any non-percentage unit, on either the linear bar or the circular ring.
					</p>
					<Example code={formatCode}>
						<Cluster gap="lg" align="center">
							<Loading
								value={3}
								max={5}
								label="Import"
								format={(v, max) => `${v} of ${max} files`}
								showValue
							/>
							<Loading
								variant="ring"
								value={3}
								max={5}
								label="Import"
								format={(v, max) => `${v}/${max}`}
								showValue
								size="lg"
							/>
						</Cluster>
					</Example>
				{:else if item.id === 'intents'}
					<p class="tab-note">
						Every intent, each on its own row of <code>spinner</code>, <code>ring</code>,
						<code>bar</code>, and <code>dots</code>. <code>--hz-loading-fill</code> changes colour
						and nothing else, and it reaches every variant alike. <code>intent</code> defaults to
						<code>primary</code> rather than <code>neutral</code>, since a fill reads as an accent.
					</p>
					<Example code={intentsCode}>
						<Stack gap="sm">
							{#each intents as intent (intent)}
								<Cluster gap="md" align="center">
									<Loading variant="spinner" {intent} label="{intent}, spinner" />
									<Loading variant="ring" {intent} label="{intent}, ring" />
									<div class="bar-cell">
										<Loading variant="bar" {intent} label="{intent}, bar" />
									</div>
									<Loading variant="dots" {intent} label="{intent}, dots" />
								</Cluster>
							{/each}
						</Stack>
					</Example>
				{:else if item.id === 'sizes'}
					<p class="tab-note">
						Every size, each on its own row of <code>spinner</code>, <code>ring</code>,
						<code>bar</code>, and <code>dots</code>. <code>--hz-loading-size</code> sizes every
						variant from
						<code>data-size</code>.
					</p>
					<Example code={sizesCode}>
						<Stack gap="sm">
							{#each sizes as size (size)}
								<Cluster gap="md" align="center">
									<Loading variant="spinner" {size} label="Loading, {size}, spinner" />
									<Loading variant="ring" {size} label="Loading, {size}, ring" />
									<div class="bar-cell">
										<Loading variant="bar" {size} label="Loading, {size}, bar" />
									</div>
									<Loading variant="dots" {size} label="Loading, {size}, dots" />
								</Cluster>
							{/each}
						</Stack>
					</Example>
				{:else}
					<p class="tab-note">
						<code>--hz-loading-speed</code> sets how long one cycle takes.
						<code>--hz-loading-pulse-width</code> sets the width of the bar's moving highlight (a
						percentage of the bar, default 150%; bar only), and wider reads softer. Rotation always
						runs at a constant rate, because an eased loop stalls and lurches on every cycle. The
						ring's growing arc and the dots do follow <code>--hz-loading-ease</code>.
					</p>
					<p class="tab-note">
						With reduced motion on, Loading slows to about half speed instead of freezing, because a
						paused loader looks finished. The bar also trades its sweep for a pulse in place.
						Skeleton, which only decorates, goes fully still.
					</p>
					<Example code={timingCode}>
						<Stack gap="md">
							<Cluster gap="md" align="center">
								<label class="timing-control">
									Speed
									<input
										type="range"
										min="200"
										max="4800"
										step="100"
										bind:value={speedMs}
										aria-label="Loading speed in milliseconds"
									/>
									<span class="timing-readout">{speedMs}ms</span>
								</label>
								<label class="timing-control">
									Pulse width
									<input
										type="range"
										min="40"
										max="200"
										step="10"
										bind:value={pulseWidth}
										aria-label="Loading bar pulse width as a percentage of the bar width"
									/>
									<span class="timing-readout">{pulseWidth}%</span>
								</label>
							</Cluster>
							<Stack gap="md">
								<Loading variant="bar" style={timingStyle} label="Loading results" />
								<Loading variant="spinner" style={timingStyle} label="Saving" />
								<Loading variant="ring" style={timingStyle} label="Loading" />
								<Loading variant="dots" style={timingStyle} label="Loading" />
							</Stack>
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.bar-cell {
		width: 8rem;
	}

	.tab-content :global(input[type='range']) {
		width: 100%;
	}

	.timing-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.timing-control :global(input[type='range']) {
		width: 10rem;
	}

	.timing-readout {
		min-width: 3.5rem;
		font-variant-numeric: tabular-nums;
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
