<script lang="ts">
	import { Alert, Banner, Container, Tabs, Stack, Link, CodeBlock } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { bannerDoc } from '../../../../docs/data/banner.js';
	import Example from '../../../../docs/Example.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	const intents = [
		'neutral',
		'primary',
		'secondary',
		'danger',
		'warning',
		'success',
		'info'
	] as const;

	const intentMessages: Record<(typeof intents)[number], string> = {
		neutral: 'Course note: hole 7 tee pads were resurfaced this week.',
		primary: 'League night: tags round starts at 5:30pm on Thursday.',
		secondary: 'Doubles signup: random-draw doubles opens 30 minutes early.',
		danger: 'Course closed — lightning in the area, clear the course now.',
		warning: 'High winds: gusts over 30mph expected after 2pm.',
		success: 'Round saved — your scorecard was synced to the league.',
		info: 'Cart friendly: the back nine is paved end to end.'
	};

	const intentsCode = intents
		.map((intent) => {
			const attr = intent === 'neutral' ? '' : ` intent="${intent}"`;
			return `<Banner${attr}>${intentMessages[intent]}</Banner>`;
		})
		.join('\n');

	// Dismissible demo — consumer-owned visibility, like Alert/Badge.
	let noticeVisible = $state(true);

	const dismissCode = $derived(
		[
			`let noticeVisible = $state(${noticeVisible});`,
			'',
			'{#if noticeVisible}',
			'\t<Banner',
			'\t\tintent="warning"',
			'\t\tdismissLabel="Dismiss maintenance notice"',
			'\t\tonDismiss={() => (noticeVisible = false)}',
			'\t>',
			'\t\tScheduled maintenance tonight from 11pm–1am.',
			'\t</Banner>',
			'{/if}'
		].join('\n')
	);

	const actionsCode = [
		'<Banner intent="primary">',
		'\tNew season pricing is live.',
		'\t{#snippet actions()}<Link href="#">Learn more</Link>{/snippet}',
		'</Banner>'
	].join('\n');

	const richCode = [
		'<Banner intent="info">',
		'\t<strong class="hz-banner-title">Winter league registration is open</strong>',
		'\tSign up by November 1 — rounds move to 10am starts after the time change.',
		"\t{#snippet actions()}<Link href='#'>Register</Link>{/snippet}",
		'</Banner>'
	].join('\n');

	const pinnedCode = [
		'<div class="scroll-wrap">',
		'\t<Banner pin="top" intent="danger">Course closed — lightning in the area.</Banner>',
		'\t<!-- …scrollable page content… -->',
		'</div>',
		'',
		'/* your CSS */',
		'.scroll-wrap { max-height: 12rem; overflow-y: auto; }'
	].join('\n');

	const dontShowAgainCode = [
		"let dismissed = $state(localStorage.getItem('promo-dismissed') === 'true');",
		'',
		'function dismiss() {',
		'\tdismissed = true;',
		"\tlocalStorage.setItem('promo-dismissed', 'true');",
		'}',
		'',
		'{#if !dismissed}',
		'\t<Banner intent="primary" onDismiss={dismiss}>',
		'\t\tFree shipping this weekend only.',
		'\t</Banner>',
		'{/if}'
	].join('\n');

	const demoTabs = [
		{ id: 'intents', label: 'Intents' },
		{ id: 'dismissible', label: 'Dismissible' },
		{ id: 'actions', label: 'With actions' },
		{ id: 'rich', label: 'Rich content' },
		{ id: 'pinned', label: 'Pinned' },
		{ id: 'dont-show-again', label: "Don't show again" }
	];
</script>

<DocPage name="Banner" {...bannerDoc}>
	<Alert intent="info" title="Banner vs Alert">
		{#snippet icon()}<IconInfo />{/snippet}
		Use <code>Banner</code> for a solid, full-width announcement at page level: maintenance notices,
		promos, outage bars. You can pin it to an edge. When the message is inline and sits next to the
		thing it describes, use <a href="/docs/components/alert">Alert</a> instead.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Banner demos" defaultTab="intents">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'intents'}
					<p class="tab-note">
						The <a href="/docs/foundation/colors#intent">intent vocabulary</a>, using a solid fill
						instead of the tint Alert uses.
					</p>
					<Container breakout padding="none">
						<Example code={intentsCode}>
							<Stack gap="xs">
								{#each intents as intent (intent)}
									<Banner intent={intent === 'neutral' ? undefined : intent}>
										{intentMessages[intent]}
									</Banner>
								{/each}
							</Stack>
						</Example>
					</Container>
				{:else if item.id === 'dismissible'}
					<p class="tab-note">
						Same contract as Alert and Badge: <code>onDismiss</code> renders the button, you own the
						visibility state. Give the button a specific <code>dismissLabel</code>.
					</p>
					<Container breakout padding="none">
						<Example code={dismissCode}>
							{#if noticeVisible}
								<Banner
									intent="warning"
									dismissLabel="Dismiss maintenance notice"
									onDismiss={() => (noticeVisible = false)}
								>
									Scheduled maintenance tonight from 11pm–1am.
								</Banner>
							{:else}
								<p class="dismissed-note">
									Notice dismissed.
									<button type="button" class="restore" onclick={() => (noticeVisible = true)}>
										Restore it
									</button>
								</p>
							{/if}
						</Example>
					</Container>
				{:else if item.id === 'actions'}
					<p class="tab-note">
						The <code>actions</code> snippet is a trailing slot for a <code>Link</code> or
						<code>Button</code>. Both are retargeted onto the bar's own foreground/background pair,
						so they stay legible against the intent fill.
					</p>
					<Container breakout padding="none">
						<Example code={actionsCode}>
							<Banner intent="primary">
								New season pricing is live.
								{#snippet actions()}
									<Link href="#">Learn more</Link>
								{/snippet}
							</Banner>
						</Example>
					</Container>
				{:else if item.id === 'rich'}
					<p class="tab-note">
						<code>children</code> is a plain snippet, so any markup is allowed. For a
						heading-and-body bar, put the opt-in <code>hz-banner-title</code> theme class on your
						own lead element, the same convention as <code>hz-card-title</code>. The class goes
						block-level, so the lead stacks over the body copy with no wrapper markup, while the
						icon, actions, and dismiss cells keep their places on the row.
					</p>
					<Container breakout padding="none">
						<Example code={richCode}>
							<Banner intent="info">
								<strong class="hz-banner-title">Winter league registration is open</strong>
								Sign up by November 1 — rounds move to 10am starts after the time change.
								{#snippet actions()}
									<Link href="#">Register</Link>
								{/snippet}
							</Banner>
						</Example>
					</Container>
				{:else if item.id === 'pinned'}
					<p class="tab-note">
						<code>pin="top"</code> and <code>pin="bottom"</code> stick the bar to that edge of its scroll
						container, in flow, so nothing beneath it is overlapped. Scroll the box below to see it stay
						put.
					</p>
					<p class="tab-note">
						Keep pinned banners short. A bar that grows tall can cover a focused element that
						scrolls under it (<a
							href="https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html"
							>WCAG 2.4.11</a
						>). Give in-page anchor targets a <code>scroll-margin-block-start</code>/<code
							>-end</code
						>
						equal to the banner height so they clear it.
					</p>
					<p class="tab-note">
						For viewport-fixed behavior instead of in-flow sticky, pass your own <code>class</code>
						with <code>position: fixed</code>. That is a CSS override rather than a prop.
					</p>
					<Container breakout padding="none">
						<Example code={pinnedCode}>
							<div class="scroll-wrap">
								<Banner pin="top" intent="danger">Course closed — lightning in the area.</Banner>
								<div class="scroll-filler">
									<p>Scroll to see the banner stay pinned to the top of this box…</p>
									<p>It never overlaps this text — sticky keeps it in flow.</p>
									<p>Keep scrolling.</p>
									<p>Still here.</p>
									<p>The bottom of the scrollable region.</p>
								</div>
							</div>
						</Example>
					</Container>
				{:else}
					<p class="tab-note">
						Persisting a dismissal is your logic. Banner only fires <code>onDismiss</code>: it keeps
						no dismissed state of its own and ships no localStorage handling. A typical pattern:
					</p>
					<CodeBlock code={dontShowAgainCode} />
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
	.scroll-wrap {
		max-height: 12rem;
		overflow-y: auto;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}
	.scroll-filler {
		padding: 1rem;
	}
	.scroll-filler p {
		margin: 0 0 3rem;
	}
	.scroll-filler p:last-child {
		margin-bottom: 0;
	}
</style>
