<script lang="ts">
	import { RangeSlider, Tabs, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Base name — the thumbs submit as {name}-min and {name}-max.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Rendered as the fieldset legend; sr-only with hideLabel.'
		},
		{ name: 'min', type: 'number', default: '0' },
		{ name: 'max', type: 'number', default: '100' },
		{ name: 'step', type: 'number', default: '1' },
		{ name: 'valueMin', type: 'number', default: 'min', note: 'Bindable. The lower thumb.' },
		{ name: 'valueMax', type: 'number', default: 'max', note: 'Bindable. The upper thumb.' },
		{
			name: 'showInput',
			type: 'boolean',
			default: 'true',
			note: 'Renders the pair of exact-entry number fields.'
		},
		{
			name: 'ticks',
			type: 'SliderTick[]',
			default: '—',
			note: 'Decorative marks under the track. See SliderTick below.'
		},
		{
			name: 'unit',
			type: 'string',
			default: '—',
			note: 'One visual suffix after the pair; rendered aria-hidden.'
		},
		{
			name: 'minThumbLabel',
			type: 'string',
			default: '`${label} (minimum)`',
			note: 'Accessible name for the lower thumb (and its number field).'
		},
		{
			name: 'maxThumbLabel',
			type: 'string',
			default: '`${label} (maximum)`',
			note: 'Accessible name for the upper thumb (and its number field).'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the legend.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false', note: 'Legend indicator only.' },
		{ name: 'disabled', type: 'boolean', default: 'false', note: 'Disables all four inputs.' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--slider hz-field--slider-range classes.'
		}
	];

	const sliderTickType: PropRow[] = [
		{
			name: 'value',
			type: 'number',
			default: '—',
			note: 'Required. A bare number is shorthand for an unlabeled tick. Out-of-range ticks are skipped.'
		},
		{ name: 'label', type: 'string', default: '—', note: 'Small text under the mark.' }
	];

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

<DocPage
	name="RangeSlider"
	description="A dual-thumb slider selecting a min–max interval on one track, with paired number fields for exact entry — thumbs can meet but never cross."
	importLine={'import {RangeSlider} from "@hyzer-labs/ui"'}
	{props}
	types={[{ name: 'SliderTick', props: sliderTickType }]}
	a11yNote="The group is a `<fieldset>` whose `label` renders as the `<legend>`. Each thumb is a real range input with its own accessible name (`minThumbLabel`/`maxThumbLabel`) and native slider semantics — Tab reaches both, arrow keys step them, and a thumb dragged past its partner clamps rather than crossing. The number fields carry derived accessible names and never submit; the two thumbs submit as the base `name` plus `-min`/`-max` suffixes. `description` and `error` chain into `aria-describedby` on both ranges; ticks, the separator, and the readout are decorative and `aria-hidden`."
	a11yLinks={[
		{
			label: 'APG Slider (Multi-Thumb) pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/'
		},
		{
			label: 'MDN: <input type="range">',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range'
		}
	]}
>
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
