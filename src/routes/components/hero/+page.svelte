<script lang="ts">
	import { Hero, Button, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'layout', type: "'center' | 'split' | 'overlay'", default: "'center'" },
		{ name: 'height', type: "'auto' | 'screen' | 'half'", default: "'auto'" },
		{ name: 'align', type: "'start' | 'center' | 'end'", default: "'center'" },
		{
			name: 'reverseOnMobile',
			type: 'boolean',
			default: 'false',
			note: 'Split layout only: media renders above content below 968px.'
		},
		{ name: 'headingLevel', type: '1 | 2 | 3 | 4 | 5 | 6', default: '1' },
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			note: 'Accessible name when no title is provided.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-hero class.' },
		{
			name: 'eyebrow',
			type: 'string | Snippet',
			default: '—',
			note: 'String for plain text; snippet for inner markup.'
		},
		{ name: 'title', type: 'string | Snippet', default: '—' },
		{ name: 'subtitle', type: 'string | Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' },
		{
			name: 'media',
			type: 'Snippet',
			default: '—',
			note: 'Beside/below content in center/split; becomes the background in overlay.'
		}
	];

	const layouts = ['center', 'split', 'overlay'] as const;
	const heights = ['auto', 'half', 'screen'] as const;
	const aligns = ['start', 'center', 'end'] as const;

	const demoTabs = [
		{ id: 'layout', label: 'Layout' },
		{ id: 'height', label: 'Height' },
		{ id: 'align', label: 'Align' },
		{ id: 'reverse', label: 'Reverse on mobile' }
	];

	// Example-code builders — derived from the selected sub-tab so the code
	// pane updates live with the demo. headingLevel={2} keeps the docs page's
	// heading hierarchy intact (the shell owns the h1).
	function layoutCode(layout: string): string {
		if (layout === 'split') {
			return [
				'<!-- Text slots take strings — or snippets when you need inner markup -->',
				'<Hero layout="split" subtitle="Content on one side, media on the other." headingLevel={2}>',
				'\t{#snippet title()}Split hero with <em>styled</em> media{/snippet}',
				'\t{#snippet actions()}<Button>Get started</Button>{/snippet}',
				'\t{#snippet media()}<img src="…" alt="…" />{/snippet}',
				'</Hero>'
			].join('\n');
		}
		if (layout === 'overlay') {
			return [
				'<!-- In overlay, media becomes the full-bleed background -->',
				'<Hero',
				'\tlayout="overlay"',
				'\ttitle="Overlay hero"',
				'\tsubtitle="Content sits on top of the media background."',
				'\theadingLevel={2}',
				'>',
				'\t{#snippet media()}<img src="…" alt="" />{/snippet}',
				'</Hero>'
			].join('\n');
		}
		return [
			'<Hero',
			'\teyebrow="What\'s new"',
			'\ttitle="Headless components for Svelte 5"',
			'\tsubtitle="Ships behavior, structure, and accessibility — not visual opinions."',
			'\theadingLevel={2}',
			'>',
			'\t{#snippet actions()}',
			'\t\t<Button>Get started</Button>',
			'\t\t<Button variant="outline">Learn more</Button>',
			'\t{/snippet}',
			'</Hero>'
		].join('\n');
	}

	function heightCode(height: string): string {
		return [
			height === 'auto' ? '<Hero' : `<Hero height="${height}"`,
			`\ttitle={'height="${height}"'}`,
			'\tsubtitle="auto hugs content; half is 50vh; screen is 100vh."',
			'\theadingLevel={2}',
			'/>'
		].join('\n');
	}

	function alignCode(align: string): string {
		return [
			align === 'center' ? '<Hero' : `<Hero align="${align}"`,
			`\ttitle={'align="${align}"'}`,
			'\tsubtitle="Controls content alignment in the center layout."',
			'\theadingLevel={2}',
			'>',
			'\t{#snippet actions()}<Button>Action</Button>{/snippet}',
			'</Hero>'
		].join('\n');
	}

	const reverseCode = [
		'<Hero',
		'\tlayout="split"',
		'\treverseOnMobile',
		'\ttitle="Reversed below 968px"',
		'\tsubtitle="Media renders above the content on small screens."',
		'\theadingLevel={2}',
		'>',
		'\t{#snippet media()}<img src="…" alt="…" />{/snippet}',
		'</Hero>'
	].join('\n');
</script>

<DocPage
	name="Hero"
	description="A section component for page heroes supporting center, split, and overlay layouts. Text slots accept plain strings or snippets; in the overlay layout, media becomes the full-bleed background."
	importLine={'import {Hero} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Hero renders a `<section>` with `aria-labelledby` pointing to the title element, or `aria-label` when no title is provided. Use `headingLevel` to keep the page heading hierarchy correct — the docs shell sets the h1, so hero titles inside a page should typically be level 2."
>
	<p class="demo-note">
		Hero is headless — the dashed outline below is docs scaffolding so its bounds are visible.
	</p>
	<Tabs items={demoTabs} ariaLabel="Hero demos" defaultTab="layout">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'layout'}
					<Tabs
						items={layouts.map((l) => ({ id: l, label: l }))}
						ariaLabel="Hero layout"
						defaultTab="center"
					>
						{#snippet panel(lItem)}
							<div class="inner-tab">
								<Example code={layoutCode(lItem.id)}>
									<div class="demo-hero-wrap">
										{#if lItem.id === 'center'}
											<Hero
												eyebrow="What's new"
												title="Headless components for Svelte 5"
												subtitle="Ships behavior, structure, and accessibility — not visual opinions."
												headingLevel={2}
											>
												{#snippet actions()}
													<Button>Get started</Button>
													<Button variant="outline">Learn more</Button>
												{/snippet}
											</Hero>
										{:else if lItem.id === 'split'}
											<Hero
												layout="split"
												subtitle="Content on one side, media on the other."
												headingLevel={2}
											>
												{#snippet title()}Split hero with <em>styled</em> media{/snippet}
												{#snippet actions()}<Button>Get started</Button>{/snippet}
												{#snippet media()}
													<div class="media-block" role="img" aria-label="Media placeholder"></div>
												{/snippet}
											</Hero>
										{:else}
											<Hero
												layout="overlay"
												title="Overlay hero"
												subtitle="Content sits on top of the media background."
												headingLevel={2}
											>
												{#snippet media()}<div class="bg-block" aria-hidden="true"></div>{/snippet}
											</Hero>
										{/if}
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'height'}
					<p class="tab-note">
						Heights are viewport-relative: <code>half</code> is 50vh and <code>screen</code> is 100vh,
						so those demos grow well beyond the content.
					</p>
					<Tabs
						items={heights.map((h) => ({ id: h, label: h }))}
						ariaLabel="Hero height"
						defaultTab="auto"
					>
						{#snippet panel(hItem)}
							<div class="inner-tab">
								<Example code={heightCode(hItem.id)}>
									<div class="demo-hero-wrap">
										<Hero
											height={hItem.id as (typeof heights)[number]}
											title={`height="${hItem.id}"`}
											subtitle="auto hugs content; half is 50vh; screen is 100vh."
											headingLevel={2}
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'align'}
					<Tabs
						items={aligns.map((a) => ({ id: a, label: a }))}
						ariaLabel="Hero align"
						defaultTab="center"
					>
						{#snippet panel(aItem)}
							<div class="inner-tab">
								<Example code={alignCode(aItem.id)}>
									<div class="demo-hero-wrap">
										<Hero
											align={aItem.id as (typeof aligns)[number]}
											title={`align="${aItem.id}"`}
											subtitle="Controls content alignment in the center layout."
											headingLevel={2}
										>
											{#snippet actions()}<Button>Action</Button>{/snippet}
										</Hero>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						Only affects the split layout below 968px — narrow the window to see the media block
						move above the content.
					</p>
					<Example code={reverseCode}>
						<div class="demo-hero-wrap">
							<Hero
								layout="split"
								reverseOnMobile
								title="Reversed below 968px"
								subtitle="Media renders above the content on small screens."
								headingLevel={2}
							>
								{#snippet media()}
									<div class="media-block" role="img" aria-label="Media placeholder"></div>
								{/snippet}
							</Hero>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.inner-tab {
		padding-top: 0.5rem;
	}
	.demo-note,
	.tab-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.demo-note {
		margin-bottom: 0.5rem;
	}
	.tab-note code {
		font-family: var(--hz-font-family-mono, monospace);
	}
	.demo-hero-wrap {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow: hidden;
	}
	.media-block {
		width: 100%;
		min-height: 12rem;
		background: var(--hz-color-gray, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}
	.bg-block {
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--hz-color-primary, #2563eb) 18%, var(--hz-color-surface, #fff)),
			color-mix(in srgb, var(--hz-color-secondary, #7c3aed) 18%, var(--hz-color-surface, #fff))
		);
	}
</style>
