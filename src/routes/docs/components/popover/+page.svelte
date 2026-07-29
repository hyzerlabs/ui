<script lang="ts">
	import { Popover, Checkbox, Button, Stack, Tabs, Cluster, Alert } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { popoverDoc } from '../../../../docs/data/popover.js';
	import Example from '../../../../docs/Example.svelte';
	import IconSettings from '$lib/icons/generated/settings.svelte';
	import IconUser from '$lib/icons/generated/user.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// ------------------------------------------------------------------
	// Basic — a settings/filter popover with interactive fields.
	// ------------------------------------------------------------------

	let showFinished = $state(true);
	let showUpcoming = $state(true);

	const basicCode = [
		'let showFinished = $state(true);',
		'let showUpcoming = $state(true);',
		'',
		'<Popover triggerLabel="Filters">',
		'\t{#snippet triggerIcon()}<IconSettings />{/snippet}',
		'\t<Stack gap="sm">',
		'\t\t<Checkbox name="finished" label="Finished rounds" bind:checked={showFinished} />',
		'\t\t<Checkbox name="upcoming" label="Upcoming tee times" bind:checked={showUpcoming} />',
		'\t</Stack>',
		'</Popover>'
	].join('\n');

	// ------------------------------------------------------------------
	// Placement + alignment.
	// ------------------------------------------------------------------

	// The eight placements around an empty center cell — the Tooltip page's
	// ring layout. A `null` marks the empty cell: keeps left/right on the
	// middle row and bottom-* together on their own row.
	const placements = [
		'top-start',
		'top',
		'top-end',
		'left',
		null,
		'right',
		'bottom-start',
		'bottom',
		'bottom-end'
	] as const;

	const placementCode = [
		'<Popover triggerLabel="bottom-start" placement="bottom-start"><p>Panel content</p></Popover>',
		"<!-- …one per placement: a side ('top' | 'bottom' | 'left' | 'right'),",
		"     optionally suffixed -start or -end, e.g. 'top-end' -->"
	].join('\n');

	// ------------------------------------------------------------------
	// A custom trigger (the escape hatch).
	// ------------------------------------------------------------------

	const customTriggerCode = [
		'<Popover placement="bottom-end">',
		'\t{#snippet trigger(attrs)}',
		'\t\t<Button {...attrs} variant="ghost">',
		'\t\t\t{#snippet iconStart()}<IconUser />{/snippet}',
		'\t\t\tAccount',
		'\t\t</Button>',
		'\t{/snippet}',
		'\t<p>Panel content</p>',
		'</Popover>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'placement', label: 'Placement & alignment' },
		{ id: 'custom-trigger', label: 'Custom trigger' },
		{ id: 'not-a-modal', label: 'Not a modal' }
	];
</script>

<DocPage name="Popover" {...popoverDoc}>
	<Tabs items={demoTabs} ariaLabel="Popover demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Click the trigger to open the panel. Controls inside work normally, and <kbd>Tab</kbd>
						moves through them and back out again, with no focus trap. Click outside, or press
						<kbd>Escape</kbd>, to close.
					</p>
					<Example code={basicCode}>
						<Popover triggerLabel="Filters">
							{#snippet triggerIcon()}<IconSettings />{/snippet}
							<Stack gap="sm">
								<Checkbox name="finished" label="Finished rounds" bind:checked={showFinished} />
								<Checkbox name="upcoming" label="Upcoming tee times" bind:checked={showUpcoming} />
							</Stack>
						</Popover>
					</Example>
				{:else if item.id === 'placement'}
					<p class="tab-note">
						<code>placement</code> combines a side with a start/end/center alignment. It flips automatically
						if the preferred side would overflow the viewport.
					</p>
					<Example code={placementCode}>
						<div class="placement-grid">
							{#each placements as p (p ?? 'empty')}
								{#if p === null}
									<div class="placement-grid-empty" aria-hidden="true"></div>
								{:else}
									<Popover triggerLabel={p} placement={p}>
										<p class="panel-demo-text">Panel content</p>
									</Popover>
								{/if}
							{/each}
						</div>
					</Example>
				{:else if item.id === 'custom-trigger'}
					<Stack gap="away">
						<div>
							<p class="tab-note">
								The <code>trigger</code> snippet is an escape hatch: it hands you an attrs bag to
								spread onto any element. Here that is a ghost-variant <code>Button</code> with its own
								icon and label, in place of the default trigger.
							</p>
							<Example code={customTriggerCode}>
								<Popover placement="bottom-end">
									{#snippet trigger(attrs)}
										<Button {...attrs} variant="ghost">
											{#snippet iconStart()}<IconUser />{/snippet}
											Account
										</Button>
									{/snippet}
									<p class="panel-demo-text">Panel content</p>
								</Popover>
							</Example>
						</div>
					</Stack>
				{:else}
					<Stack gap="sm">
						<Alert intent="info" title="Popover vs Modal vs Dropdown">
							{#snippet icon()}<IconInfo />{/snippet}
							Popover is a non-modal <strong>disclosure</strong>: no <code>aria-modal</code>, no
							focus trap, no backdrop. The page behind it stays interactive. Need a focus-trapped
							dialog that takes over the screen? Use <a href="/docs/components/modal">Modal</a>.
							Need a menu of actions with roving keyboard focus? Use
							<a href="/docs/components/dropdown">Dropdown</a>.
						</Alert>
						<Cluster gap="sm" align="center">
							<Popover triggerLabel="Open popover">
								<p class="panel-demo-text">You can still use the page behind this panel.</p>
							</Popover>
						</Cluster>
					</Stack>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content :global(.doc-example) {
		overflow: visible;
	}

	.placement-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2.5rem 1rem;
		justify-items: center;
		padding: 2rem 1rem;
	}

	.panel-demo-text {
		margin: 0;
		max-width: 16rem;
	}
</style>
