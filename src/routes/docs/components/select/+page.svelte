<script lang="ts">
	import { Select, Tabs, Stack, Alert } from '$lib';
	import type { SelectOption } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { selectDoc } from '../../../../docs/data/select.js';
	import Example from '../../../../docs/Example.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	const putters: SelectOption[] = [
		{ value: 'aviar', label: 'Aviar' },
		{ value: 'luna', label: 'Luna' },
		{ value: 'judge', label: 'Judge' },
		{ value: 'zone', label: 'Zone (out of stock)', disabled: true }
	];

	const bag: SelectOption[] = [
		{
			group: 'Drivers',
			options: [
				{ value: 'destroyer', label: 'Destroyer' },
				{ value: 'wraith', label: 'Wraith' }
			]
		},
		{
			group: 'Midranges',
			options: [
				{ value: 'buzzz', label: 'Buzzz' },
				{ value: 'roc3', label: 'Roc3' }
			]
		},
		{
			group: 'Putters',
			options: [
				{ value: 'aviar', label: 'Aviar' },
				{ value: 'luna', label: 'Luna' }
			]
		}
	];

	let putter = $state('');

	const basicCode = [
		'const putters: SelectOption[] = [',
		"\t{ value: 'aviar', label: 'Aviar' },",
		"\t{ value: 'luna', label: 'Luna' },",
		"\t{ value: 'judge', label: 'Judge' },",
		"\t{ value: 'zone', label: 'Zone (out of stock)', disabled: true }",
		'];',
		'',
		'<Select name="putter" label="Putter" options={putters} bind:value={putter} placeholder="Pick a putter" />'
	].join('\n');

	const groupsCode = [
		'const bag: SelectOption[] = [',
		"\t{ group: 'Drivers', options: [{ value: 'destroyer', label: 'Destroyer' }, …] },",
		"\t{ group: 'Midranges', options: [{ value: 'buzzz', label: 'Buzzz' }, …] },",
		"\t{ group: 'Putters', options: [{ value: 'aviar', label: 'Aviar' }, …] }",
		'];',
		'',
		'<Select name="disc" label="Disc" options={bag} placeholder="Pick a disc" />'
	].join('\n');

	const tees: SelectOption[] = [
		{ value: 'short', label: 'Short tees' },
		{ value: 'long', label: 'Long tees' }
	];

	const divisions: SelectOption[] = [
		{ value: 'mpo', label: 'MPO' },
		{ value: 'fpo', label: 'FPO' },
		{ value: 'ma1', label: 'MA1' },
		{ value: 'ma2', label: 'MA2' }
	];

	const statesCode = [
		'<Select',
		'\tname="tees"',
		'\tlabel="Tee position"',
		'\toptions={tees}',
		'\tdescription="Long tees add roughly 1,200 feet to the round."',
		'/>',
		'',
		'<Select name="division" label="Division" options={divisions} error="Pick a division to register." />',
		'<Select name="division2" label="Division" options={divisions} required />',
		'<Select name="card" label="Card" options={cards} disabled />'
	].join('\n');

	// Select-R7: live Multiple demo — bound to a string[], with a form
	// showing FormData.getAll returning each selected value.
	const discOptions: SelectOption[] = [
		{ value: 'destroyer', label: 'Destroyer' },
		{ value: 'wraith', label: 'Wraith' },
		{ value: 'buzzz', label: 'Buzzz' },
		{ value: 'roc3', label: 'Roc3' }
	];
	let selectedDiscs = $state<string[]>(['destroyer']);
	let submittedDiscs = $state<string[]>([]);

	function onMultipleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submittedDiscs = new FormData(e.target as HTMLFormElement).getAll('discs-demo') as string[];
	}

	const multipleCode = [
		'let discs = $state<string[]>([]);',
		'',
		'<form onsubmit={handleSubmit}>',
		'\t<Select name="discs-demo" label="Discs" options={discOptions} multiple bind:value={discs} />',
		'\t<button type="submit">Submit</button>',
		'</form>',
		'',
		'// handleSubmit reads: new FormData(form).getAll("discs-demo")'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'groups', label: 'Option groups' },
		{ id: 'multiple', label: 'Multiple' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="Select" {...selectDoc}>
	<Alert intent="info" title="Select vs Combobox">
		{#snippet icon()}<IconInfo />{/snippet}
		Reach for <code>Select</code> when your option set is small and static — single-select, or
		multi-select via the native <code>multiple</code> attribute. When there are many options (where
		filtering or virtualization helps) or you need search / type-to-filter, use
		<a href="/docs/components/combobox">Combobox</a> instead — it's the multi-select, filterable member
		of the field family.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Select demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						The placeholder is a disabled leading option — it can't be re-selected once a real
						choice is made. Disabled options stay visible but inert.
					</p>
					<Example code={basicCode}>
						<div class="demo-col">
							<Select
								name="putter-demo"
								label="Putter"
								options={putters}
								bind:value={putter}
								placeholder="Pick a putter"
							/>
						</div>
					</Example>
				{:else if item.id === 'groups'}
					<p class="tab-note">
						An entry with <code>group</code> renders an <code>&lt;optgroup&gt;</code>. Flat options
						and groups can mix in the same array; everything renders in array order.
					</p>
					<Example code={groupsCode}>
						<div class="demo-col">
							<Select name="disc-demo" label="Disc" options={bag} placeholder="Pick a disc" />
						</div>
					</Example>
				{:else if item.id === 'multiple'}
					<p class="tab-note">
						The <code>multiple</code> prop renders the native <code>multiple</code> attribute and
						switches <code>value</code> to a <code>string[]</code> — there is no placeholder option
						in this mode. The single <code>&lt;select multiple&gt;</code> element submits repeated
						<code>name</code> values; <code>new FormData(form).getAll(name)</code> returns each selected
						value in option order.
					</p>
					<Example code={multipleCode}>
						<div class="demo-col">
							<form onsubmit={onMultipleSubmit}>
								<Stack gap="sm">
									<Select
										name="discs-demo"
										label="Discs"
										options={discOptions}
										multiple
										bind:value={selectedDiscs}
									/>
									<button type="submit">Submit</button>
								</Stack>
							</form>
							<p class="tab-note">Bound value: {selectedDiscs.join(', ') || '(none)'}</p>
							{#if submittedDiscs.length > 0}
								<p class="tab-note">
									FormData.getAll("discs-demo") → {submittedDiscs.join(', ')}
								</p>
							{/if}
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the field — both
						chain into <code>aria-describedby</code>. Error and disabled are also field states: the
						wrapper's <code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<div class="demo-col">
							<Stack gap="md">
								<Select
									name="tees-demo"
									label="Tee position"
									options={tees}
									description="Long tees add roughly 1,200 feet to the round."
								/>
								<Select
									name="division-error-demo"
									label="Division"
									options={divisions}
									error="Pick a division to register."
								/>
								<Select name="required-demo" label="Division" options={divisions} required />
								<Select name="disabled-demo" label="Card" options={tees} disabled />
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
