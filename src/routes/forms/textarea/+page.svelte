<script lang="ts">
	import { Textarea, Tabs, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{ name: 'value', type: 'string', default: "''", note: 'Bindable.' },
		{ name: 'rows', type: 'number', default: '3' },
		{
			name: 'resize',
			type: "'none' | 'vertical' | 'both' | 'auto'",
			default: "'vertical'",
			note: "'vertical' and 'auto' grow with content; 'vertical' keeps the drag handle, 'auto' hides it. rows is the minimum height."
		},
		{ name: 'maxlength', type: 'number', default: '—' },
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-field class.' }
	];

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

<DocPage
	name="Textarea"
	description="A labeled multi-line text area with configurable resize behavior — including an auto-grow mode — plus description and inline error."
	importLine={'import {Textarea} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The textarea is associated with its label via `id`/`for`; with `hideLabel` the label stays in the DOM as screen-reader-only text. `description` and `error` chain into `aria-describedby` (description first). `required` sets `aria-required` and an `error` sets `aria-invalid`."
>
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
						The default <code>vertical</code> grows with content as you type <em>and</em> keeps the
						native drag handle as a manual override; <code>auto</code> grows without a handle.
						Growth uses CSS <code>field-sizing: content</code> where supported, with a JS
						height-sync fallback elsewhere, and <code>rows</code> acts as the minimum height.
						<code>none</code> and <code>both</code> are fixed-height with the matching handle.
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
						<code>description</code> and <code>error</code> are announced with the field — both
						chain into <code>aria-describedby</code>. Error and disabled are also field states: the
						wrapper's <code>data-state</code> reflects them, with error winning.
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
