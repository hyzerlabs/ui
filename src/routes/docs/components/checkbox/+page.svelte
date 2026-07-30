<script lang="ts">
	import { Checkbox, Tabs, Stack, Alert } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { checkboxDoc } from '../../../../docs/data/checkbox.js';
	import Example from '../../../../docs/Example.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	let ace = $state(false);

	const basicCode = [
		'let ace = $state(false);',
		'',
		'<Checkbox name="ace" label="Hit an ace this round" bind:checked={ace} />'
	].join('\n');

	// Select-all pattern: the parent reflects its children and is never bound —
	// its state is derived, and clicking it rewrites the children.
	let notify = $state({ leagues: true, tournaments: false, courses: false });
	const allOn = $derived(Object.values(notify).every(Boolean));
	const someOn = $derived(Object.values(notify).some(Boolean));

	function setAll(e: Event) {
		const on = (e.currentTarget as HTMLInputElement).checked;
		notify = { leagues: on, tournaments: on, courses: on };
	}

	const indeterminateCode = [
		'let notify = $state({ leagues: true, tournaments: false, courses: false });',
		'const allOn = $derived(Object.values(notify).every(Boolean));',
		'const someOn = $derived(Object.values(notify).some(Boolean));',
		'',
		'<Checkbox',
		'\tname="notify-all"',
		'\tlabel="All notifications"',
		'\tchecked={allOn}',
		'\tindeterminate={someOn && !allOn}',
		'\tonchange={setAll}',
		'/>',
		'<Checkbox name="notify-leagues" label="League nights" bind:checked={notify.leagues} />',
		'<Checkbox name="notify-tournaments" label="Tournaments" bind:checked={notify.tournaments} />',
		'<Checkbox name="notify-courses" label="Course updates" bind:checked={notify.courses} />'
	].join('\n');

	const statesCode = [
		'<Checkbox',
		'\tname="spotter"',
		'\tlabel="I can spot on hole 18"',
		'\tdescription="Spotters watch the water carry and mark landing positions."',
		'/>',
		'',
		'<Checkbox name="waiver" label="Accept the liability waiver" error="You must accept the waiver to play." />',
		'<Checkbox name="rules" label="I\'ve read the tournament rules" required />',
		'<Checkbox name="cart" label="Cart rental (sold out)" disabled />',
		'<Checkbox name="fee" label="Entry fee paid" disabled checked />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'indeterminate', label: 'Indeterminate' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="Checkbox" {...checkboxDoc}>
	<Alert intent="info" title="Checkbox vs Toggle">
		{#snippet icon()}<IconInfo />{/snippet}
		Use <code>Checkbox</code> when selecting from a list, building multi-select membership, or
		driving the indeterminate select-all pattern. For a single on/off setting that reads like a
		switch, use
		<a href="/docs/components/toggle">Toggle</a> instead.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Checkbox demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<Checkbox name="ace-demo" label="Hit an ace this round" bind:checked={ace} />
					</Example>
				{:else if item.id === 'indeterminate'}
					<p class="tab-note">
						<code>indeterminate</code> is visual and announced state only, so <code>checked</code> is
						unaffected. In the select-all pattern the parent is never bound: its state is derived from
						the children, and toggling it rewrites them. Try it live.
					</p>
					<Example code={indeterminateCode}>
						<Stack gap="sm">
							<Checkbox
								name="notify-all-demo"
								label="All notifications"
								checked={allOn}
								indeterminate={someOn && !allOn}
								onchange={setAll}
							/>
							<div class="indent">
								<Stack gap="sm">
									<Checkbox
										name="notify-leagues-demo"
										label="League nights"
										bind:checked={notify.leagues}
									/>
									<Checkbox
										name="notify-tournaments-demo"
										label="Tournaments"
										bind:checked={notify.tournaments}
									/>
									<Checkbox
										name="notify-courses-demo"
										label="Course updates"
										bind:checked={notify.courses}
									/>
								</Stack>
							</div>
						</Stack>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the field: both chain
						into <code>aria-describedby</code>. Error and disabled are also field states, and the
						wrapper's <code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<Stack gap="md">
							<Checkbox
								name="spotter-demo"
								label="I can spot on hole 18"
								description="Spotters watch the water carry and mark landing positions."
							/>
							<Checkbox
								name="waiver-demo"
								label="Accept the liability waiver"
								error="You must accept the waiver to play."
							/>
							<Checkbox name="rules-demo" label="I've read the tournament rules" required />
							<Checkbox name="cart-demo" label="Cart rental (sold out)" disabled />
							<Checkbox name="fee-demo" label="Entry fee paid" disabled checked />
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.indent {
		padding-inline-start: 1.75rem;
	}
</style>
