<script lang="ts">
	import { Slider, Tabs, Stack } from '$lib';
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

	let weight = $state(175);

	const stepCode = [
		'<Slider name="weight" label="Disc weight" min={150} max={180} unit="g" bind:value={weight} />'
	].join('\n');

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
		'<Slider name="locked" label="Course length (locked)" min={4000} max={12000} value={7245} unit="ft" disabled />'
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

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'step', label: 'Range & step' },
		{ id: 'ticks', label: 'Ticks' },
		{ id: 'no-input', label: 'Slider only' },
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
						<code>step</code> applies to both inputs: arrows step by it, and typed values snap to
						the step grid anchored at <code>min</code> — discs come in whole grams, so type
						<code>174.3</code> and it commits as <code>174</code>.
					</p>
					<Example code={stepCode}>
						<div class="demo-col">
							<Slider
								name="weight-demo"
								label="Disc weight"
								min={150}
								max={180}
								unit="g"
								bind:value={weight}
							/>
						</div>
					</Example>
				{:else if item.id === 'ticks'}
					<p class="tab-note">
						Ticks are visual marks, not detents — stepping stays on the <code>step</code> grid. Bare
						numbers make unlabeled marks; <code>{'{ value, label }'}</code> adds the caption.
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
</style>
