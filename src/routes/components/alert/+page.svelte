<script lang="ts">
	import { Alert, Tabs, Stack, Button } from '$lib';
	import IconCircleCheck from '$lib/icons/generated/circle-check.svelte';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import DocPage from '../../../docs/DocPage.svelte';
	import { alertDoc } from '../../../docs/data/alert.js';
	import Example from '../../../docs/Example.svelte';

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

	// icon is decorative — rendered aria-hidden, so it always pairs with an
	// intent-matched glyph the title/body already name in words.
	const iconCode = [
		'<Alert intent="success" title="Round saved">',
		'\t{#snippet icon()}<IconCircleCheck />{/snippet}',
		'\tYour scorecard was synced to the league.',
		'</Alert>',
		'<Alert intent="danger" title="Course closed">',
		'\t{#snippet icon()}<IconTriangleAlert />{/snippet}',
		'\tLightning in the area — clear the course now.',
		'</Alert>'
	].join('\n');

	const roundedValues = ['none', 'sm', 'md', 'lg', 'full'] as const;

	const roundedCode = roundedValues
		.map((r) => {
			const attr = r === 'md' ? '' : ` rounded="${r}"`;
			const comment = r === 'md' ? ' (default)' : '';
			return `<!-- rounded="${r}"${comment} -->\n<Alert${attr} title="Course note">Hole 7 tee pads were resurfaced this week.</Alert>`;
		})
		.join('\n\n');

	const demoTabs = [
		{ id: 'intents', label: 'Intents' },
		{ id: 'icon', label: 'Icon' },
		{ id: 'rounded', label: 'Rounding' },
		{ id: 'dismiss', label: 'Dismissible' },
		{ id: 'announce', label: 'Dynamic announcement' }
	];
</script>

<DocPage name="Alert" {...alertDoc}>
	<Alert intent="info" title="Alert vs Banner">
		Reach for <code>Alert</code> when the message is soft, inline, and contextual — feedback that
		sits next to the thing it describes. For a full-width, solid, page-level announcement you can
		pin to the top or bottom, use <a href="/components/banner">Banner</a> instead.
	</Alert>
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
				{:else if item.id === 'icon'}
					<p class="tab-note">
						<code>icon</code> is a decorative leading slot — rendered <code>aria-hidden</code>, so
						pair it with an intent-matched glyph the title/body already say in words.
					</p>
					<Example code={iconCode}>
						<Stack gap="sm">
							<Alert intent="success" title="Round saved" headingLevel={3}>
								{#snippet icon()}<IconCircleCheck />{/snippet}
								Your scorecard was synced to the league.
							</Alert>
							<Alert intent="danger" title="Course closed" headingLevel={3}>
								{#snippet icon()}<IconTriangleAlert />{/snippet}
								Lightning in the area — clear the course now.
							</Alert>
						</Stack>
					</Example>
				{:else if item.id === 'rounded'}
					<p class="tab-note">
						The shared <code>Rounded</code> scale — 1:1 with the <code>--hz-radius-*</code> tokens,
						default <code>'md'</code>.
					</p>
					<Example code={roundedCode}>
						<div class="rounded-demo">
							{#each roundedValues as r (r)}
								<div class="rounded-row">
									<span class="rounded-row-label">{r}</span>
									<Alert rounded={r} title="Course note" headingLevel={3}>
										Hole 7 tee pads were resurfaced this week.
									</Alert>
								</div>
							{/each}
						</div>
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
		color: var(--hz-intent-primary, #2563eb);
		text-decoration: underline;
		cursor: pointer;
	}

	/* Button's size-row precedent: a label column beside each value. */
	.rounded-demo {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-sm, 1rem);
	}

	.rounded-row {
		display: grid;
		grid-template-columns: 3rem 1fr;
		align-items: start;
		gap: var(--hz-space-sm, 1rem);
	}

	.rounded-row-label {
		padding-top: 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
