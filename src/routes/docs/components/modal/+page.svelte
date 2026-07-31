<script lang="ts">
	import { Modal, Button, Tabs, Cluster } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { modalDoc } from '../../../../docs/data/modal.js';
	import Example from '../../../../docs/Example.svelte';

	const sizes = ['sm', 'md', 'lg', 'full'] as const;
	type Size = (typeof sizes)[number];

	// Edge case: nothing traps focus on page load — modals start closed.
	const sizeOpen = $state<Record<Size, boolean>>({
		sm: false,
		md: false,
		lg: false,
		full: false
	});
	let dismissOpen = $state(false);
	let closeCtrlOpen = $state(false);
	let eventsOpen = $state(false);
	let closedCount = $state(0);

	const demoTabs = [
		{ id: 'sizes', label: 'Sizes' },
		{ id: 'dismissal', label: 'Dismissal' },
		{ id: 'close-control', label: 'Close control' },
		{ id: 'onclose', label: 'onclose' }
	];

	// Example-code builders — derived from the selected sub-tab so the code
	// pane updates live with the demo.
	function sizeCode(size: string): string {
		return [
			'<Button onclick={() => (open = true)}>Open modal</Button>',
			'',
			size === 'md'
				? '<Modal bind:open title="Example modal" description="Optional description line.">'
				: `<Modal bind:open size="${size}" title="Example modal" description="Optional description line.">`,
			'\t<p>Modal body content. Focus is trapped while open.</p>',
			'\t{#snippet actions()}',
			'\t\t<Button onclick={() => (open = false)}>Confirm</Button>',
			'\t\t<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>',
			'\t{/snippet}',
			'</Modal>'
		].join('\n');
	}

	const dismissalCode = [
		'<!-- Opting out of overlay-click dismissal; Esc always closes -->',
		'<Modal bind:open closeOnOverlay={false} title="Confirm delete">',
		'\t<p>Stray backdrop clicks are ignored; Esc still works.</p>',
		'\t{#snippet actions()}',
		'\t\t<Button intent="danger" onclick={confirm}>Delete</Button>',
		'\t\t<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>',
		'\t{/snippet}',
		'</Modal>'
	].join('\n');

	const closeControlCode = [
		'<!-- Hide the built-in ✕; or relabel it via closeLabel -->',
		'<Modal bind:open showClose={false} title="No close button">',
		'\t<p>Dismissal happens through the footer action instead.</p>',
		'\t{#snippet actions()}',
		'\t\t<Button onclick={() => (open = false)}>Done</Button>',
		'\t{/snippet}',
		'</Modal>'
	].join('\n');

	const oncloseCode = [
		'<Modal bind:open onclose={() => (closedCount += 1)} title="Track dismissals">',
		'\t<p>onclose fires once per dismissal, any path: ✕, Esc, overlay, or actions.</p>',
		'</Modal>'
	].join('\n');
</script>

<DocPage name="Modal" {...modalDoc}>
	<p class="demo-note">No dialog is open on page load. Click a trigger to open one.</p>
	<p class="demo-note">
		The open and close animation honors <code>--hz-duration-*</code> and
		<code>--hz-ease-*</code>. See
		<a href="/docs/foundation/motion">Motion</a> for the token values, and for the script-side
		<code>@hyzer-labs/ui/motion</code> helpers built on them.
	</p>
	<Tabs items={demoTabs} ariaLabel="Modal demos" defaultTab="sizes">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'sizes'}
					<Tabs
						items={sizes.map((s) => ({ id: s, label: s }))}
						ariaLabel="Modal size"
						defaultTab="md"
					>
						{#snippet panel(sItem)}
							<div class="inner-tab">
								<Example code={sizeCode(sItem.id)}>
									<Button onclick={() => (sizeOpen[sItem.id as Size] = true)}>
										{sItem.id === 'md' ? 'Open modal' : `Open ${sItem.id} modal`}
									</Button>
									<Modal
										bind:open={sizeOpen[sItem.id as Size]}
										size={sItem.id as Size}
										title="Example modal"
										description="Optional description line."
									>
										<p>Modal body content. Focus is trapped while open.</p>
										<p>Press <kbd>Esc</kbd> or click the backdrop to close.</p>
										{#snippet actions()}
											<Cluster gap="sm">
												<Button onclick={() => (sizeOpen[sItem.id as Size] = false)}>Confirm</Button
												>
												<Button
													variant="ghost"
													onclick={() => (sizeOpen[sItem.id as Size] = false)}
												>
													Cancel
												</Button>
											</Cluster>
										{/snippet}
									</Modal>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'dismissal'}
					<p class="tab-note">
						<code>closeOnOverlay={'{false}'}</code> ignores backdrop clicks, which helps when a stray
						click would discard work. There is deliberately no Esc opt-out: the WAI-ARIA dialog pattern
						requires Escape to dismiss.
					</p>
					<Example code={dismissalCode}>
						<Button onclick={() => (dismissOpen = true)}>Open sticky modal</Button>
						<Modal bind:open={dismissOpen} closeOnOverlay={false} title="Confirm delete">
							<p>Backdrop clicks are ignored; <kbd>Esc</kbd> and the buttons still close.</p>
							{#snippet actions()}
								<Cluster gap="sm">
									<Button intent="danger" onclick={() => (dismissOpen = false)}>Delete</Button>
									<Button variant="ghost" onclick={() => (dismissOpen = false)}>Cancel</Button>
								</Cluster>
							{/snippet}
						</Modal>
					</Example>
				{:else if item.id === 'close-control'}
					<Example code={closeControlCode}>
						<Button onclick={() => (closeCtrlOpen = true)}>Open without ✕</Button>
						<Modal bind:open={closeCtrlOpen} showClose={false} title="No close button">
							<p>Dismissal happens through the footer action instead.</p>
							{#snippet actions()}
								<Button onclick={() => (closeCtrlOpen = false)}>Done</Button>
							{/snippet}
						</Modal>
					</Example>
				{:else}
					<Example code={oncloseCode}>
						<Cluster gap="sm" align="center">
							<Button onclick={() => (eventsOpen = true)}>Open modal</Button>
							<span class="closed-count" aria-live="polite">
								Closed {closedCount}
								{closedCount === 1 ? 'time' : 'times'}
							</span>
						</Cluster>
						<Modal
							bind:open={eventsOpen}
							onclose={() => (closedCount += 1)}
							title="Track dismissals"
						>
							<p>onclose fires once per dismissal, any path: ✕, Esc, overlay, or actions.</p>
						</Modal>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.demo-note {
		margin-bottom: 0.5rem;
	}
	.closed-count {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	p {
		margin: 0 0 0.75rem;
	}
	kbd {
		font-family: var(--hz-font-family-mono, monospace);
		padding: 0.1em 0.3em;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: 3px;
		font-size: 0.875em;
	}
</style>
