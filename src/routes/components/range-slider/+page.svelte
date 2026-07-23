<script lang="ts">
	import { RangeSlider, Tabs, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import { rangeSliderDoc } from '../../../docs/data/range-slider.js';
	import Example from '../../../docs/Example.svelte';

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
		'<RangeSlider name="locked" label="Course length filter (locked)" min={3000} max={12000} valueMin={5000} valueMax={9000} unit="ft" disabled />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'ticks', label: 'Ticks' },
		{ id: 'readout', label: 'Slider only' },
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
						partner: it clamps — the pair can meet but never cross. The number fields commit with
						the partner as the effective bound.
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
					<p class="tab-note">Same ticks API as Slider — visual marks, not detents.</p>
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
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with each thumb — both
						chain into <code>aria-describedby</code> on both ranges. Error and disabled are also
						field states: the fieldset's <code>data-state</code> reflects them, with error winning.
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
</style>
