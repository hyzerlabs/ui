<script lang="ts">
	import { Alert, Tabs, Stack, Button } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The alert body.' },
		{
			name: 'title',
			type: 'string | Snippet',
			default: '—',
			note: 'Optional heading; labels the alert via aria-labelledby.'
		},
		{ name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '2' },
		{
			name: 'intent',
			type: "'neutral' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info'",
			default: "'neutral'",
			note: 'See Foundation → Colors & Intent.'
		},
		{
			name: 'rounded',
			type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
			default: "'md'",
			note: 'The shared Rounded scale — 1:1 with the --hz-radius-* tokens.'
		},
		{ name: 'icon', type: 'Snippet', default: '—', note: 'Decorative; rendered aria-hidden.' },
		{
			name: 'onDismiss',
			type: '() => void',
			default: '—',
			note: 'Renders the dismiss button. Visibility is your state — the Alert never hides itself.'
		},
		{ name: 'dismissLabel', type: 'string', default: "'Dismiss'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-alert class.' }
	];

	const intents = [
		'neutral',
		'primary',
		'secondary',
		'danger',
		'warning',
		'success',
		'info'
	] as const;

	const intentContent: Record<(typeof intents)[number], { title: string; body: string }> = {
		neutral: { title: 'Course note', body: 'Hole 7 tee pads were resurfaced this week.' },
		primary: { title: 'League night', body: 'Tags round starts at 5:30pm on Thursday.' },
		secondary: { title: 'Doubles signup', body: 'Random-draw doubles opens 30 minutes early.' },
		danger: { title: 'Course closed', body: 'Lightning in the area — clear the course now.' },
		warning: { title: 'High winds', body: 'Gusts over 30mph expected after 2pm.' },
		success: { title: 'Round saved', body: 'Your scorecard was synced to the league.' },
		info: { title: 'Cart friendly', body: 'The back nine is paved end to end.' }
	};

	const intentsCode = [
		'<Alert title="Course note">Hole 7 tee pads were resurfaced this week.</Alert>',
		'<Alert intent="danger" title="Course closed">Lightning in the area — clear the course now.</Alert>',
		'<Alert intent="warning" title="High winds">Gusts over 30mph expected after 2pm.</Alert>',
		'<Alert intent="success" title="Round saved">Your scorecard was synced to the league.</Alert>'
	].join('\n');

	// Dismissible demo — consumer-owned visibility, like Badge chips.
	let weatherVisible = $state(true);

	const dismissCode = $derived(
		[
			`let weatherVisible = $state(${weatherVisible});`,
			'',
			'{#if weatherVisible}',
			'\t<Alert',
			'\t\tintent="warning"',
			'\t\ttitle="High winds"',
			'\t\tdismissLabel="Dismiss weather notice"',
			'\t\tonDismiss={() => (weatherVisible = false)}',
			'\t>',
			'\t\tGusts over 30mph expected after 2pm — expect flippy discs to flip more.',
			'\t</Alert>',
			'{/if}'
		].join('\n')
	);

	// Dynamic announcement demo — role is opt-in, passed via rest.
	let saved = $state(false);

	const announceCode = [
		'let saved = $state(false);',
		'',
		'<Button onclick={save}>Save round</Button>',
		'',
		'{#if saved}',
		'\t<!-- role="status" = polite announcement; use role="alert" sparingly -->',
		'\t<Alert intent="success" role="status">Round saved to the league.</Alert>',
		'{/if}'
	].join('\n');

	const demoTabs = [
		{ id: 'intents', label: 'Intents' },
		{ id: 'dismiss', label: 'Dismissible' },
		{ id: 'announce', label: 'Dynamic announcement' }
	];
</script>

<DocPage
	name="Alert"
	description="An inline feedback banner on the shared intent scale, with an optional heading and dismiss button — announcement semantics are opt-in, and the Form error summary is one of these."
	importLine={'import {Alert} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="A statically rendered Alert is plain content — no role, no live region; the optional `title` names it via `aria-labelledby`. For alerts inserted after load, pass `role=&quot;status&quot;` (polite) or `role=&quot;alert&quot;` (assertive, sparingly) via the rest props — a live role on static content is dead weight, so it is never a default. The dismiss button is a real labelled `<button>`; dismissal is your state change, so consider where focus should land. There is deliberately no Toast component — timed self-dismissing overlays fail WCAG 2.2.1 and routinely escape announcement; an inline Alert with `role=&quot;status&quot;` covers the need accessibly."
>
	<Tabs items={demoTabs} ariaLabel="Alert demos" defaultTab="intents">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'intents'}
					<p class="tab-note">
						The <a href="/foundation/colors#intent">intent vocabulary</a> plus the
						<code>neutral</code> default. The Form error summary renders as
						<code>intent="danger"</code> automatically.
					</p>
					<Example code={intentsCode}>
						<Stack gap="sm">
							{#each intents as intent (intent)}
								<Alert
									intent={intent === 'neutral' ? undefined : intent}
									title={intentContent[intent].title}
									headingLevel={3}
								>
									{intentContent[intent].body}
								</Alert>
							{/each}
						</Stack>
					</Example>
				{:else if item.id === 'dismiss'}
					<p class="tab-note">
						Same contract as Badge chips: <code>onDismiss</code> renders the button, you own the
						visibility state. Give the button a specific <code>dismissLabel</code>.
					</p>
					<Example code={dismissCode}>
						{#if weatherVisible}
							<Alert
								intent="warning"
								title="High winds"
								headingLevel={3}
								dismissLabel="Dismiss weather notice"
								onDismiss={() => (weatherVisible = false)}
							>
								Gusts over 30mph expected after 2pm — expect flippy discs to flip more.
							</Alert>
						{:else}
							<p class="dismissed-note">
								Notice dismissed.
								<button type="button" class="restore" onclick={() => (weatherVisible = true)}>
									Restore it
								</button>
							</p>
						{/if}
					</Example>
				{:else}
					<p class="tab-note">
						Announcement is opt-in: an Alert rendered with the page is just content, but one
						inserted after an action should carry <code>role="status"</code> so screen readers hear it.
						Click the button — the alert appears and announces politely.
					</p>
					<Example code={announceCode}>
						<Stack gap="sm">
							<div>
								<Button onclick={() => (saved = !saved)}>
									{saved ? 'Unsave round' : 'Save round'}
								</Button>
							</div>
							{#if saved}
								<Alert intent="success" role="status">Round saved to the league.</Alert>
							{/if}
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.dismissed-note {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.restore {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		color: var(--hz-color-primary, #2563eb);
		text-decoration: underline;
		cursor: pointer;
	}
</style>
