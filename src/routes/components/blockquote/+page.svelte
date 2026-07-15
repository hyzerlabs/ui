<script lang="ts">
	import { Blockquote, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The quoted content.' },
		{
			name: 'cite',
			type: 'string | Snippet',
			default: '—',
			note: 'Visible attribution, rendered in a <cite> outside the quote.'
		},
		{
			name: 'citeUrl',
			type: 'string',
			default: '—',
			note: 'Source URL — sets the blockquote cite attribute; never rendered as text.'
		},
		{
			name: 'align',
			type: "'start' | 'center' | 'end'",
			default: "'start'",
			note: 'Aligns the attribution row under the quote; the quote body is untouched.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-blockquote class.' }
	];

	const quoteOnlyCode = [
		'<Blockquote>',
		'\tThrow flat, trust the fade — the disc does the work on a hyzer line.',
		'</Blockquote>'
	].join('\n');

	const attributedCode = [
		'<Blockquote cite="Paige Pierce">',
		'\tPractice putting from 15 feet more than anything else. That’s where',
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

	const longQuote =
		'The course doesn’t care how far you throw — it cares where the disc stops. ' +
		'After twelve titles I can tell you the short game decides more rounds than ' +
		'any 500-foot drive ever will: the upshots you place under the basket and ' +
		'the putts you grind in practice are the strokes that hold up on Sunday.';

	function alignedCode(align: (typeof alignValues)[number]): string {
		const alignAttr = align === 'start' ? '' : ` align="${align}"`;
		return [
			`<Blockquote cite="Ken Climo"${alignAttr}>`,
			'\tThe course doesn’t care how far you throw — it cares where the disc',
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
		{ id: 'aligned', label: 'Attribution alignment' }
	];
</script>

<DocPage
	name="Blockquote"
	description="A semantic quote: a figure wrapping a blockquote, with an optional visible attribution and an optional machine-readable source URL."
	importLine={'import {Blockquote} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The root is always a `<figure>` wrapping a `<blockquote>`; when `cite` is provided, the attribution renders in a `<figcaption><cite>` outside the quote, so screen readers don't announce it as part of the quotation itself. No ARIA is added — the native `figure`/`blockquote`/`figcaption`/`cite` elements carry all the semantics. The decorative em-dash before the attribution is a theme `::before` pseudo-element, so it never enters the accessible name."
	a11yLinks={[
		{
			label: 'MDN: <blockquote>',
			href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote'
		}
	]}
>
	<Tabs items={demoTabs} ariaLabel="Blockquote demos" defaultTab="quote-only">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'quote-only'}
					<p class="tab-note">
						With no <code>cite</code>, the figure wraps a bare quote — no
						<code>&lt;figcaption&gt;</code> renders.
					</p>
					<Example code={quoteOnlyCode}>
						<Blockquote>
							Throw flat, trust the fade — the disc does the work on a hyzer line.
						</Blockquote>
					</Example>
				{:else if item.id === 'attributed'}
					<p class="tab-note">
						<code>cite</code> renders a visible attribution in a <code>&lt;figcaption&gt;</code>
						after the quote — naming a person here is the widely-accepted convention.
					</p>
					<Example code={attributedCode}>
						<Blockquote cite="Paige Pierce">
							Practice putting from 15 feet more than anything else. That's where rounds are won.
						</Blockquote>
					</Example>
				{:else if item.id === 'sourced'}
					<p class="tab-note">
						<code>citeUrl</code> sets the machine-readable <code>cite</code> attribute on the inner
						<code>&lt;blockquote&gt;</code> — it's never rendered as visible text.
					</p>
					<Example code={sourcedCode}>
						<Blockquote cite="PDGA Rules Committee" citeUrl="https://www.pdga.com/rules">
							A thrown disc that comes to rest above the playing surface, in a tree for example, is
							treated as if it came to rest on the ground.
						</Blockquote>
					</Example>
				{:else}
					<p class="tab-note">
						<code>align</code> moves the attribution row — <code>start</code> (default),
						<code>center</code>, or <code>end</code> — while the quote body stays put.
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
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
