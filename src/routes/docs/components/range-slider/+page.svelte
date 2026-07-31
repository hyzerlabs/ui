<script lang="ts">
	import { RangeSlider, Tabs, Stack, Cluster } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { rangeSliderDoc } from '../../../../docs/data/range-slider.js';
	import Example from '../../../../docs/Example.svelte';

	let lengthMin = $state(200);
	let lengthMax = $state(450);

	const basicCode = $derived(
		[
			`let lengthMin = $state(${lengthMin});`,
			`let lengthMax = $state(${lengthMax});`,
			'',
			'<RangeSlider',
			'\tname="length"',
			'\tlabel="Hole length"',
			'\tmin={100}',
			'\tmax={900}',
			'\tunit="ft"',
			'\tbind:valueMin={lengthMin}',
			'\tbind:valueMax={lengthMax}',
			'/>'
		].join('\n')
	);

	const ticksCode = [
		'<RangeSlider',
		'\tname="length"',
		'\tlabel="Hole length"',
		'\tmin={100}',
		'\tmax={900}',
		'\tunit="ft"',
		'\tticks={[',
		"\t\t{ value: 300, label: 'par 3' },",
		"\t\t{ value: 550, label: 'par 4' },",
		"\t\t{ value: 800, label: 'par 5' }",
		'\t]}',
		'/>'
	].join('\n');

	const readoutCode =
		'<RangeSlider name="rating" label="Rating band" min={700} max={1100} step={5} valueMin={850} valueMax={975} showInput={false} />';

	const statesCode = [
		'<RangeSlider',
		'\tname="weight"',
		'\tlabel="Disc weight range"',
		'\tmin={150}',
		'\tmax={180}',
		'\tunit="g"',
		'\tdescription="Most players bag 165–175 g drivers."',
		'/>',
		'',
		'<RangeSlider name="par" label="Par range" max={6} error="Pick a par range to filter holes." />',
		'<RangeSlider name="entry" label="Entry fee split" required />',
		'<RangeSlider name="locked" label="Course length filter (locked)" min={3000} max={12000} valueMin={5000} valueMax={9000} unit="ft" disabled />',
		'',
		'<!-- vertical: description/error keep their place in the field scaffold -->',
		'<RangeSlider name="window" label="Flight window" max={30} unit="m" orientation="vertical" description="Ceiling and floor of the flight." />',
		'<RangeSlider name="angles" label="Angle window" max={45} unit="°" orientation="vertical" error="Pick an angle window." />'
	].join('\n');

	const verticalCode = [
		'<Cluster gap="lg">',
		'\t<RangeSlider',
		'\t\tname="hole-length-vertical"',
		'\t\tlabel="Hole length (vertical)"',
		'\t\tmin={100}',
		'\t\tmax={900}',
		'\t\tunit="ft"',
		'\t\torientation="vertical"',
		'\t\tticks={[',
		"\t\t\t{ value: 300, label: 'par 3' },",
		"\t\t\t{ value: 550, label: 'par 4' },",
		"\t\t\t{ value: 800, label: 'par 5' }",
		'\t\t]}',
		'\t/>',
		'\t<RangeSlider',
		'\t\tname="hole-length-vertical-start"',
		'\t\tlabel="Hole length (vertical, input above)"',
		'\t\tmin={100}',
		'\t\tmax={900}',
		'\t\tunit="ft"',
		'\t\torientation="vertical"',
		'\t\tinputPosition="start"',
		'\t/>',
		'</Cluster>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'ticks', label: 'Ticks' },
		{ id: 'readout', label: 'Slider only' },
		{ id: 'vertical', label: 'Vertical' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="RangeSlider" {...rangeSliderDoc}>
	<Tabs items={demoTabs} ariaLabel="RangeSlider demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Two thumbs, one track, and the fill spans the selected interval. Drag a thumb past its
						partner and it clamps: the pair can meet but never cross. Typing in a number field
						clamps the same way, against the partner's value.
					</p>
					<Example code={basicCode}>
						<div class="demo-col">
							<RangeSlider
								name="length-demo"
								label="Hole length"
								min={100}
								max={900}
								unit="ft"
								bind:valueMin={lengthMin}
								bind:valueMax={lengthMax}
							/>
						</div>
					</Example>
				{:else if item.id === 'ticks'}
					<p class="tab-note">
						Same ticks API as <a href="/docs/components/slider">Slider</a>: visual marks only, with
						no snapping.
					</p>
					<Example code={ticksCode}>
						<div class="demo-col">
							<RangeSlider
								name="length-ticks-demo"
								label="Hole length"
								min={100}
								max={900}
								unit="ft"
								ticks={[
									{ value: 300, label: 'par 3' },
									{ value: 550, label: 'par 4' },
									{ value: 800, label: 'par 5' }
								]}
							/>
						</div>
					</Example>
				{:else if item.id === 'readout'}
					<p class="tab-note">
						<code>showInput={'{false}'}</code> swaps the field pair for a single read-only
						<code>min–max</code> readout.
					</p>
					<Example code={readoutCode}>
						<div class="demo-col">
							<RangeSlider
								name="rating-demo"
								label="Rating band"
								min={700}
								max={1100}
								step={5}
								valueMin={850}
								valueMax={975}
								showInput={false}
							/>
						</div>
					</Example>
				{:else if item.id === 'vertical'}
					<p class="tab-note">
						<code>orientation="vertical"</code> switches both ranges to a native
						<code>writing-mode: vertical-lr</code> track. It grows bottom-up, so Up and Right arrows
						still increase toward <code>max</code> on either thumb. The track's block length comes
						from <code>--hz-slider-length</code> (default <code>12rem</code>), so it never grows the
						page unbounded.
					</p>
					<p class="tab-note">
						The two exact-entry fields stay one inline cluster, separated by a dash. They sit above
						or below the track (per <code>inputPosition</code>) rather than stacking to mirror the
						thumbs. This demo wraps two sliders side by side in
						<a href="/docs/components/cluster">Cluster</a>.
					</p>
					<Example code={verticalCode}>
						<div class="demo-col vertical-demo">
							<Cluster gap="lg">
								<RangeSlider
									name="hole-length-vertical-demo"
									label="Hole length (vertical)"
									min={100}
									max={900}
									unit="ft"
									orientation="vertical"
									ticks={[
										{ value: 300, label: 'par 3' },
										{ value: 550, label: 'par 4' },
										{ value: 800, label: 'par 5' }
									]}
								/>
								<RangeSlider
									name="hole-length-vertical-start-demo"
									label="Hole length (vertical, input above)"
									min={100}
									max={900}
									unit="ft"
									orientation="vertical"
									inputPosition="start"
								/>
							</Cluster>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with each thumb: both
						chain into <code>aria-describedby</code> on both ranges. Error and disabled are also
						field states. The fieldset's <code>data-state</code> reflects them, and error wins.
					</p>
					<Example code={statesCode}>
						<div class="demo-col">
							<Stack gap="md">
								<RangeSlider
									name="weight-demo"
									label="Disc weight range"
									min={150}
									max={180}
									unit="g"
									description="Most players bag 165–175 g drivers."
								/>
								<RangeSlider
									name="par-demo"
									label="Par range"
									max={6}
									error="Pick a par range to filter holes."
								/>
								<RangeSlider name="required-demo" label="Entry fee split" required />
								<RangeSlider
									name="disabled-demo"
									label="Course length filter (locked)"
									min={3000}
									max={12000}
									valueMin={5000}
									valueMax={9000}
									unit="ft"
									disabled
								/>
								<Cluster gap="lg" align="start">
									<RangeSlider
										name="window-demo"
										label="Flight window"
										max={30}
										unit="m"
										orientation="vertical"
										description="Ceiling and floor of the flight."
									/>
									<RangeSlider
										name="angles-demo"
										label="Angle window"
										max={45}
										unit="°"
										orientation="vertical"
										error="Pick an angle window."
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
		max-width: 30rem;
	}

	/* The field scaffold gives every field a full-width block root, expected since a
	 * vertical RangeSlider is still a block Field. Side-by-side
	 * layout is the author's job, so this demo shrinks the roots to content. */
	.vertical-demo :global(.hz-field--slider) {
		width: auto;
	}
</style>
