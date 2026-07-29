<script lang="ts">
	import { RadioGroup, Tabs, Stack } from '$lib';
	import type { FormOption } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { radioGroupDoc } from '../../../../docs/data/radio-group.js';
	import Example from '../../../../docs/Example.svelte';

	const stabilities: FormOption[] = [
		{ value: 'understable', label: 'Understable' },
		{ value: 'stable', label: 'Stable' },
		{ value: 'overstable', label: 'Overstable' },
		{ value: 'flippy', label: 'Roller-only (unavailable)', disabled: true }
	];

	const teePositions: FormOption[] = [
		{ value: 'short', label: 'Short' },
		{ value: 'long', label: 'Long' }
	];

	const divisions: FormOption[] = [
		{ value: 'mpo', label: 'MPO' },
		{ value: 'fpo', label: 'FPO' },
		{ value: 'ma1', label: 'MA1' },
		{ value: 'ma2', label: 'MA2' }
	];

	let stability = $state('');

	const basicCode = [
		'const stabilities: FormOption[] = [',
		"\t{ value: 'understable', label: 'Understable' },",
		"\t{ value: 'stable', label: 'Stable' },",
		"\t{ value: 'overstable', label: 'Overstable' },",
		"\t{ value: 'flippy', label: 'Roller-only (unavailable)', disabled: true }",
		'];',
		'',
		'<RadioGroup name="stability" label="Disc stability" options={stabilities} bind:value={stability} />'
	].join('\n');

	const orientationCode =
		'<RadioGroup name="tees" label="Tee position" options={teePositions} orientation="horizontal" />';

	const statesCode = [
		'<RadioGroup',
		'\tname="division"',
		'\tlabel="Division"',
		'\toptions={divisions}',
		'\tdescription="You can move up a division later, but not down."',
		'/>',
		'',
		'<RadioGroup name="tees" label="Tee position" options={teePositions} error="Pick a tee position." />',
		'<RadioGroup name="division2" label="Division" options={divisions} required />',
		'<RadioGroup name="closed" label="Tee position (course closed)" options={teePositions} disabled />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'orientation', label: 'Orientation' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="RadioGroup" {...radioGroupDoc}>
	<Tabs items={demoTabs} ariaLabel="RadioGroup demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<RadioGroup
							name="stability-demo"
							label="Disc stability"
							options={stabilities}
							bind:value={stability}
						/>
					</Example>
				{:else if item.id === 'orientation'}
					<p class="tab-note">
						<code>orientation="horizontal"</code> lays the options out in a wrapping row — best for two
						or three short labels.
					</p>
					<Example code={orientationCode}>
						<RadioGroup
							name="tees-demo"
							label="Tee position"
							options={teePositions}
							orientation="horizontal"
						/>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the group — both
						chain into <code>aria-describedby</code> on the radiogroup container. Error and disabled
						are also field states: the fieldset's <code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<Stack gap="md">
							<RadioGroup
								name="division-demo"
								label="Division"
								options={divisions}
								description="You can move up a division later, but not down."
							/>
							<RadioGroup
								name="tees-error-demo"
								label="Tee position"
								options={teePositions}
								error="Pick a tee position."
							/>
							<RadioGroup name="required-demo" label="Division" options={divisions} required />
							<RadioGroup
								name="disabled-demo"
								label="Tee position (course closed)"
								options={teePositions}
								disabled
							/>
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
