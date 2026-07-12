<script lang="ts">
	import { Modal, Button, Tabs, Cluster } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'title', type: 'string', default: '—', note: 'Required for accessibility.' },
		{ name: 'open', type: 'boolean', default: 'false', note: '$bindable.' },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'size', type: "'sm' | 'md' | 'lg' | 'full'", default: "'md'" },
		{ name: 'closeOnOverlay', type: 'boolean', default: 'true' },
		{ name: 'closeOnEscape', type: 'boolean', default: 'true' },
		{ name: 'showClose', type: 'boolean', default: 'true' },
		{ name: 'preventScroll', type: 'boolean', default: 'true' },
		{ name: 'closeLabel', type: 'string', default: "'Close dialog'" },
		{ name: 'onclose', type: '() => void', default: '—' },
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' }
	];

	// Edge case: nothing traps focus on page load — modals start closed
	let open1 = $state(false);
	let open2 = $state(false);
	let open3 = $state(false);

	const demoTabs = [
		{ id: 'default', label: 'Default (md)' },
		{ id: 'small', label: 'Small' },
		{ id: 'large', label: 'Large' }
	];
</script>

<DocPage
	name="Modal"
	description="An accessible dialog built on the native <dialog> element with focus trap, Esc-to-close, scroll lock, and configurable sizes."
	importLine={'import {Modal} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Modal uses showModal() for native top-layer focus trapping and backdrop. aria-modal, aria-labelledby, and optional aria-describedby are set automatically. Focus returns to the trigger on close."
>
	<Tabs items={demoTabs} ariaLabel="Modal size" defaultTab="default">
		{#snippet panel(item)}
			<div class="tab-content">
				<p class="hint">No dialog is open on page load. Click the trigger to open.</p>
				{#if item.id === 'default'}
					<Button onclick={() => (open1 = true)}>Open modal</Button>
					<Modal
						bind:open={open1}
						title="Example Modal"
						description="This modal demonstrates the default md size."
					>
						<p>Modal body content goes here. Focus is trapped within the dialog.</p>
						<p>Press <kbd>Esc</kbd> or click the backdrop to close.</p>
						{#snippet actions()}
							<Cluster gap="sm">
								<Button onclick={() => (open1 = false)}>Confirm</Button>
								<Button variant="ghost" onclick={() => (open1 = false)}>Cancel</Button>
							</Cluster>
						{/snippet}
					</Modal>
				{:else if item.id === 'small'}
					<Button variant="outline" onclick={() => (open2 = true)}>Open small modal</Button>
					<Modal bind:open={open2} title="Small Modal" size="sm">
						<p>A smaller dialog variant.</p>
					</Modal>
				{:else}
					<Button variant="outline" onclick={() => (open3 = true)}>Open large modal</Button>
					<Modal bind:open={open3} title="Large Modal" size="lg">
						<p>A larger dialog for more content.</p>
						{#snippet actions()}
							<Button onclick={() => (open3 = false)}>Close</Button>
						{/snippet}
					</Modal>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.hint {
		margin: 0 0 0.75rem;
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
