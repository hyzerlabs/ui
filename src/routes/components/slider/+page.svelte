<script lang="ts">
	import { Slider, Tabs, Stack, Cluster } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import { sliderDoc } from '../../../docs/data/slider.js';
	import Example from '../../../docs/Example.svelte';

	let distance = $state(350);

	const basicCode = $derived(
		[
			`let distance = $state(${distance});`,
			'',
			'<Slider name="distance" label="Longest throw" min={0} max={700} unit="ft" bind:value={distance} />'
		].join('\n')
	);

	let weight = $state(172.5);

	const stepCode = $derived(
		[
			`let weight = $state(${weight});`,
			'',
			'<Slider name="weight" label="Disc weight" min={160} max={175} step={0.5} unit="g" bind:value={weight} />'
		].join('\n')
	);

	const noInputCode =
		'<Slider name="wind" label="Wind strength" min={0} max={10} value={4} showInput={false} />';

	const statesCode = [
		'<Slider',
		'\tname="rating"',
		'\tlabel="Target rating"',
		'\tmin={700}',
		'\tmax={1100}',
		'\tstep={5}',
		'\tdescription="Round ratings run roughly 700–1100."',
		'/>',
		'',
		'<Slider name="stack" label="Discs in your bag" max={30} error="You need at least one disc." />',
		'<Slider name="entry" label="Entry fee split" required />',
		'<Slider name="locked" label="Course length (locked)" min={4000} max={12000} value={7245} unit="ft" disabled />',
		'',
		'<!-- vertical: description/error keep their place in the field scaffold -->',
		'<Slider name="apex" label="Apex height" max={30} unit="m" orientation="vertical" description="Peak height of the throw." />',
		'<Slider name="angle" label="Release angle" max={45} unit="°" orientation="vertical" error="Pick an angle." />'
	].join('\n');

	const ticksCode = [
		'<Slider',
		'\tname="speed"',
		'\tlabel="Disc speed"',
		'\tmin={1}',
		'\tmax={14}',
		'\tticks={[',
		"\t\t{ value: 1, label: 'putter' },",
		"\t\t{ value: 5, label: 'mid' },",
		"\t\t{ value: 9, label: 'fairway' },",
		"\t\t{ value: 12, label: 'distance' }",
		'\t]}',
		'/>'
	].join('\n');

	const verticalCode = [
		'<Cluster gap="lg">',
		'\t<Slider',
		'\t\tname="elevation"',
		'\t\tlabel="Elevation"',
		'\t\tmin={0}',
		'\t\tmax={2000}',
		'\t\tunit="ft"',
		'\t\torientation="vertical"',
		'\t\tticks={[',
		"\t\t\t{ value: 0, label: 'sea level' },",
		"\t\t\t{ value: 1000, label: 'ridge' },",
		"\t\t\t{ value: 2000, label: 'peak' }",
		'\t\t]}',
		'\t/>',
		'\t<Slider',
		'\t\tname="elevation-start"',
		'\t\tlabel="Elevation (input above)"',
		'\t\tmin={0}',
		'\t\tmax={2000}',
		'\t\tunit="ft"',
		'\t\torientation="vertical"',
		'\t\tinputPosition="start"',
		'\t/>',
		'</Cluster>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'step', label: 'Step' },
		{ id: 'ticks', label: 'Ticks' },
		{ id: 'no-input', label: 'Slider only' },
		{ id: 'vertical', label: 'Vertical' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="Slider" {...sliderDoc}>
	<Tabs items={demoTabs} ariaLabel="Slider demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Drag for coarse control, type for precision: the number field commits on blur/Enter,
						clamped to the range — try typing <code>900</code>.
					</p>
					<Example code={basicCode}>
						<div class="demo-col">
							<Slider
								name="distance-demo"
								label="Longest throw"
								min={0}
								max={700}
								unit="ft"
								bind:value={distance}
							/>
						</div>
					</Example>
				{:else if item.id === 'step'}
					<p class="tab-note">
						<code>step</code> applies to both inputs: the arrows step by it, and a typed value snaps
						to the step grid anchored at <code>min</code>. Here it's <code>step={'{0.5}'}</code>, so
						type <code>172.3</code> and it commits as <code>172.5</code>.
					</p>
					<Example code={stepCode}>
						<div class="demo-col">
							<Slider
								name="weight-demo"
								label="Disc weight"
								min={160}
								max={175}
								step={0.5}
								unit="g"
								bind:value={weight}
							/>
						</div>
					</Example>
				{:else if item.id === 'ticks'}
					<p class="tab-note">
						Ticks are visual marks, not detents — stepping stays on the <code>step</code> grid. Bare
						numbers make unlabeled marks; <code>{'{ value, label }'}</code> adds the caption. For a
						min–max interval instead of a single value, see
						<a href="/components/range-slider">RangeSlider</a> — it shares this ticks API.
					</p>
					<Example code={ticksCode}>
						<div class="demo-col">
							<Slider
								name="speed-demo"
								label="Disc speed"
								min={1}
								max={14}
								ticks={[
									{ value: 1, label: 'putter' },
									{ value: 5, label: 'mid' },
									{ value: 9, label: 'fairway' },
									{ value: 12, label: 'distance' }
								]}
							/>
						</div>
					</Example>
				{:else if item.id === 'no-input'}
					<p class="tab-note">
						<code>showInput={'{false}'}</code> swaps the number field for a read-only readout — the value
						stays visible for coarse-only settings, and the range itself keeps full keyboard support.
					</p>
					<Example code={noInputCode}>
						<div class="demo-col">
							<Slider
								name="wind-demo"
								label="Wind strength"
								min={0}
								max={10}
								value={4}
								showInput={false}
							/>
						</div>
					</Example>
				{:else if item.id === 'vertical'}
					<p class="tab-note">
						<code>orientation="vertical"</code> switches the track to a native
						<code>writing-mode: vertical-lr</code> range — bottom-up, so Up/Right arrows still
						increase toward <code>max</code>. Ticks and labels sit beside the track. The track's
						block length comes from <code>--hz-slider-length</code> (default <code>12rem</code>), so
						a vertical slider never grows the page unbounded.
						<code>inputPosition</code> is logical on both axes: <code>"end"</code> (default) puts
						the number field below the track, <code>"start"</code> puts it above. Placing several
						vertical sliders side by side is up to you — this demo wraps them in
						<a href="/components/cluster">Cluster</a>.
					</p>
					<Example code={verticalCode}>
						<div class="demo-col vertical-demo">
							<Cluster gap="lg">
								<Slider
									name="elevation-demo"
									label="Elevation"
									min={0}
									max={2000}
									unit="ft"
									orientation="vertical"
									ticks={[
										{ value: 0, label: 'sea level' },
										{ value: 1000, label: 'ridge' },
										{ value: 2000, label: 'peak' }
									]}
								/>
								<Slider
									name="elevation-start-demo"
									label="Elevation (input above)"
									min={0}
									max={2000}
									unit="ft"
									orientation="vertical"
									inputPosition="start"
								/>
							</Cluster>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the range — both
						chain into <code>aria-describedby</code>. Error and disabled are also field states: the
						wrapper's <code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<div class="demo-col">
							<Stack gap="md">
								<Slider
									name="rating-demo"
									label="Target rating"
									min={700}
									max={1100}
									step={5}
									description="Round ratings run roughly 700–1100."
								/>
								<Slider
									name="stack-demo"
									label="Discs in your bag"
									max={30}
									error="You need at least one disc."
								/>
								<Slider name="required-demo" label="Entry fee split" required />
								<Slider
									name="disabled-demo"
									label="Course length (locked)"
									min={4000}
									max={12000}
									value={7245}
									unit="ft"
									disabled
								/>
								<Cluster gap="lg" align="start">
									<Slider
										name="apex-demo"
										label="Apex height"
										max={30}
										unit="m"
										orientation="vertical"
										description="Peak height of the throw."
									/>
									<Slider
										name="angle-demo"
										label="Release angle"
										max={45}
										unit="°"
										orientation="vertical"
										error="Pick an angle."
									/>
								</Cluster>
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.demo-col {
		max-width: 28rem;
	}

	/* Field-R1 gives every field a full-width block root — expected, since a
	 * vertical Slider is still a block Field (Vert-R8). Side-by-side layout
	 * is the author's job, so this demo shrinks the roots to their content. */
	.vertical-demo :global(.hz-field--slider) {
		width: auto;
	}
</style>
