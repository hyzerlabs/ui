<script lang="ts">
	import { Textarea, Tabs, Stack } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { textareaDoc } from '../../../../docs/data/textarea.js';
	import Example from '../../../../docs/Example.svelte';

	let notes = $state('');

	const basicCode = [
		"let notes = $state('');",
		'',
		'<Textarea name="notes" label="Round notes" bind:value={notes} />'
	].join('\n');

	const resizeValues = ['vertical', 'none', 'both', 'auto'] as const;

	function resizeCode(value: (typeof resizeValues)[number]): string {
		return value === 'vertical'
			? '<Textarea name="review" label="Course review" />'
			: `<Textarea name="review" label="Course review" resize="${value}" />`;
	}

	const statesCode = [
		'<Textarea',
		'\tname="review"',
		'\tlabel="Course review"',
		'\tdescription="What should first-timers know? Up to 500 characters."',
		'\tmaxlength={500}',
		'/>',
		'',
		'<Textarea name="feedback" label="Feedback" error="Feedback can\'t be empty." />',
		'<Textarea name="incident" label="What happened?" required />',
		'<Textarea name="closed" label="Course conditions" disabled value="Hole 7 flooded after the storm." />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'resize', label: 'Resize' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="Textarea" {...textareaDoc}>
	<Tabs items={demoTabs} ariaLabel="Textarea demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<div class="demo-col">
							<Textarea name="notes-demo" label="Round notes" bind:value={notes} />
						</div>
					</Example>
				{:else if item.id === 'resize'}
					<p class="tab-note">
						The default <code>vertical</code> grows with content as you type, and keeps the native
						drag handle as a manual override. <code>auto</code> grows without a handle. Growth uses
						CSS <code>field-sizing: content</code> where supported, with a JavaScript height-sync
						fallback elsewhere, and <code>rows</code> sets the minimum height. <code>none</code> and
						<code>both</code> are fixed height with the matching handle.
					</p>
					<Tabs
						items={resizeValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Resize value"
						defaultTab="vertical"
					>
						{#snippet panel(rItem)}
							{@const value = rItem.id as (typeof resizeValues)[number]}
							<div class="inner-tab">
								<Example code={resizeCode(value)}>
									<div class="demo-col">
										<Textarea
											name="resize-{value}-demo"
											label="Course review"
											resize={value}
											placeholder={value === 'auto'
												? 'Type a few lines — the field grows with you…'
												: undefined}
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the field: both chain
						into <code>aria-describedby</code>. Error and disabled are also field states. The
						wrapper's <code>data-state</code> reflects them, and error wins.
					</p>
					<Example code={statesCode}>
						<div class="demo-col">
							<Stack gap="md">
								<Textarea
									name="review-demo"
									label="Course review"
									description="What should first-timers know? Up to 500 characters."
									maxlength={500}
								/>
								<Textarea name="feedback-demo" label="Feedback" error="Feedback can't be empty." />
								<Textarea name="required-demo" label="What happened?" required />
								<Textarea
									name="disabled-demo"
									label="Course conditions"
									disabled
									value="Hole 7 flooded after the storm."
								/>
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
