<script lang="ts">
	import { Blockquote, Tabs, Select, RadioGroup } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { blockquoteDoc } from '../../../../docs/data/blockquote.js';
	import Example from '../../../../docs/Example.svelte';

	const quoteOnlyCode = [
		'<Blockquote>',
		'\tThrow flat, trust the fade: the disc does the work on a hyzer line.',
		'</Blockquote>'
	].join('\n');

	const attributedCode = [
		'<Blockquote cite="Paige Pierce">',
		"\tPractice putting from 15 feet more than anything else. That's where",
		'\trounds are won.',
		'</Blockquote>'
	].join('\n');

	const sourcedCode = [
		'<Blockquote cite="PDGA Rules Committee" citeUrl="https://www.pdga.com/rules">',
		'\tA thrown disc that comes to rest above the playing surface, in a tree',
		'\tfor example, is treated as if it came to rest on the ground.',
		'</Blockquote>'
	].join('\n');

	const alignValues = ['start', 'center', 'end'] as const;

	const intents = [
		'primary',
		'secondary',
		'danger',
		'warning',
		'success',
		'info',
		'neutral'
	] as const;

	const intentQuotes: Record<(typeof intents)[number], { text: string; cite: string }> = {
		primary: {
			text: 'A flick release generates more spin than most players ever use.',
			cite: 'Simon Lizotte'
		},
		secondary: {
			text: 'Doubles rewards the partner who plays the smart layup, not the hero shot.',
			cite: 'Valerie Mandujano'
		},
		danger: {
			text: 'Out-of-bounds lines are part of the hole: plan your line around them, not through them.',
			cite: 'PDGA Rules Committee'
		},
		warning: {
			text: 'In the wind, take twenty percent off every throw before you even pick a line.',
			cite: 'Catrina Allen'
		},
		success: {
			text: 'The putt you practiced a thousand times is the one that goes in on Sunday.',
			cite: 'Paul McBeth'
		},
		info: {
			text: 'Most courses post their layout at the first tee. Read it before you throw one disc.',
			cite: 'Course signage'
		},
		neutral: {
			text: 'A round is eighteen separate decisions, not one long throw.',
			cite: 'Des Reading'
		}
	};

	const intentSelectOptions = intents.map((intent) => ({ value: intent, label: intent }));
	const scopeOptions = [
		{ value: 'line', label: 'Accent line only' },
		{ value: 'full', label: 'Line + text' }
	];

	// Interactive intent demo — a Select (intent) and a RadioGroup
	// (intentScope) drive the live Blockquote and its derived code fence
	// together (icons page's slider-driven-fence pattern, using
	// selects/radios instead of sliders).
	let demoIntent = $state<(typeof intents)[number]>('primary');
	let demoScope = $state<'line' | 'full'>('line');

	const intentDemoCode = $derived.by(() => {
		const q = intentQuotes[demoIntent];
		const scopeAttr = demoScope === 'full' ? ' intentScope="full"' : '';
		return [
			`<Blockquote intent="${demoIntent}"${scopeAttr} cite="${q.cite}">`,
			`\t${q.text}`,
			'</Blockquote>'
		].join('\n');
	});

	const longQuote =
		'The course doesn’t care how far you throw. It cares where the disc stops. ' +
		'After twelve titles I can tell you the short game decides more rounds than ' +
		'any 500-foot drive ever will: the upshots you place under the basket and ' +
		'the putts you grind in practice are the strokes that hold up on Sunday.';

	function alignedCode(align: (typeof alignValues)[number]): string {
		const alignAttr = align === 'start' ? '' : ` align="${align}"`;
		return [
			`<Blockquote cite="Ken Climo"${alignAttr}>`,
			'\tThe course doesn’t care how far you throw. It cares where the disc',
			'\tstops. After twelve titles I can tell you the short game decides more',
			'\trounds than any 500-foot drive ever will: the upshots you place under',
			'\tthe basket and the putts you grind in practice are the strokes that',
			'\thold up on Sunday.',
			'</Blockquote>'
		].join('\n');
	}

	const demoTabs = [
		{ id: 'quote-only', label: 'Quote only' },
		{ id: 'attributed', label: 'With attribution' },
		{ id: 'sourced', label: 'With source URL' },
		{ id: 'aligned', label: 'Attribution alignment' },
		{ id: 'intent', label: 'Intent' }
	];
</script>

<DocPage name="Blockquote" {...blockquoteDoc}>
	<Tabs items={demoTabs} ariaLabel="Blockquote demos" defaultTab="quote-only">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'quote-only'}
					<p class="tab-note">
						With no <code>cite</code>, the figure wraps a bare quote and no
						<code>&lt;figcaption&gt;</code> renders.
					</p>
					<Example code={quoteOnlyCode}>
						<Blockquote>
							Throw flat, trust the fade: the disc does the work on a hyzer line.
						</Blockquote>
					</Example>
				{:else if item.id === 'attributed'}
					<p class="tab-note">
						<code>cite</code> renders a visible attribution in a <code>&lt;figcaption&gt;</code>
						after the quote. Naming a person here is the widely accepted convention.
					</p>
					<Example code={attributedCode}>
						<Blockquote cite="Paige Pierce">
							Practice putting from 15 feet more than anything else. That's where rounds are won.
						</Blockquote>
					</Example>
				{:else if item.id === 'sourced'}
					<p class="tab-note">
						<code>citeUrl</code> sets the machine-readable <code>cite</code> attribute on the inner
						<code>&lt;blockquote&gt;</code>, and it's never rendered as visible text.
					</p>
					<Example code={sourcedCode}>
						<Blockquote cite="PDGA Rules Committee" citeUrl="https://www.pdga.com/rules">
							A thrown disc that comes to rest above the playing surface, in a tree for example, is
							treated as if it came to rest on the ground.
						</Blockquote>
					</Example>
				{:else if item.id === 'aligned'}
					<p class="tab-note">
						<code>align</code> moves the attribution row: <code>start</code> (default),
						<code>center</code>, or <code>end</code>. The quote body stays put.
					</p>
					<Tabs
						items={alignValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Attribution alignment"
						defaultTab="start"
					>
						{#snippet panel(alignItem)}
							{@const align = alignItem.id as (typeof alignValues)[number]}
							<div class="inner-tab">
								<Example code={alignedCode(align)}>
									<Blockquote cite="Ken Climo" {align}>
										{longQuote}
									</Blockquote>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						<code>intent</code> colors the accent line (<code>border-inline-start</code>). The
						<code>intentScope</code> control below opts the quote text into the same color, and the
						attribution row stays muted either way. Leaving <code>intent</code> unset keeps the
						default look. See the <a href="/docs/foundation/colors#intent">intent vocabulary</a>.
					</p>
					<Example code={intentDemoCode}>
						<div class="intent-demo">
							<div class="intent-demo-controls">
								<Select
									name="blockquote-intent"
									label="intent"
									options={intentSelectOptions}
									bind:value={demoIntent}
								/>
								<RadioGroup
									name="blockquote-intent-scope"
									label="intentScope"
									orientation="horizontal"
									options={scopeOptions}
									bind:value={demoScope}
								/>
							</div>
							<Blockquote
								intent={demoIntent}
								intentScope={demoScope}
								cite={intentQuotes[demoIntent].cite}
							>
								{intentQuotes[demoIntent].text}
							</Blockquote>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.intent-demo {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.intent-demo-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: flex-start;
	}

	.intent-demo-controls > :global(*) {
		flex: 1 1 12rem;
	}
</style>
