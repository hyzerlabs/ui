<script lang="ts">
	import { Pagination, Tabs, Stack, Slider } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'count', type: 'number', default: '—', note: 'Required. Total pages.' },
		{ name: 'page', type: 'number', default: '1', note: 'Bindable. 1-based.' },
		{
			name: 'siblings',
			type: 'number',
			default: '1',
			note: 'Pages shown on each side of the current page.'
		},
		{ name: 'boundaries', type: 'number', default: '1', note: 'Pages pinned at each end.' },
		{
			name: 'href',
			type: '(page: number) => string',
			default: '—',
			note: 'Link mode: items render as real anchors; omit for button mode.'
		},
		{ name: 'onchange', type: '(page: number) => void', default: '—' },
		{ name: 'ariaLabel', type: 'string', default: "'Pagination'", note: 'Names the landmark.' },
		{ name: 'prevLabel', type: 'string', default: "'Previous page'" },
		{ name: 'nextLabel', type: 'string', default: "'Next page'" },
		{
			name: 'pageLabel',
			type: '(page: number) => string',
			default: '`Page ${page}`',
			note: 'Accessible name per page item.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-pagination class.' }
	];

	let page = $state(1);

	const basicCode = $derived(
		[
			`let page = $state(${page});`,
			'',
			'<Pagination count={10} bind:page onchange={loadPage} />'
		].join('\n')
	);

	let truncPage = $state(21);
	let siblings = $state(1);
	let boundaries = $state(1);

	const truncCode = $derived(
		[
			`<Pagination count={42} page={${truncPage}} siblings={${siblings}} boundaries={${boundaries}} />`
		].join('\n')
	);

	const linkCode = [
		'<!-- Real anchors — works without JS, middle-click, copy link. -->',
		'<Pagination',
		'\tcount={8}',
		'\tpage={pageFromUrl}',
		'\thref={(p) => `?page=${p}`}',
		'\tariaLabel="Course results"',
		'/>'
	].join('\n');

	let linkPage = $state(3);

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'truncation', label: 'Truncation' },
		{ id: 'links', label: 'Link mode' }
	];
</script>

<DocPage
	name="Pagination"
	description="A navigation landmark of page controls — previous/next, boundary and sibling windows with ellipsis truncation, and button or real-link modes."
	importLine={'import {Pagination} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Pagination renders a `<nav>` landmark named by `ariaLabel` — give it a distinct name when a page hosts several. Every control is a `Button`, so the current item carries `aria-current=&quot;page&quot;`, page items get full accessible names via `pageLabel` (&quot;Page 7&quot;, not a bare number), and ellipses are decorative. In link mode everything is a real `<a>`; at the ends the previous/next controls render as disabled Buttons without an `href` — a link can't be disabled, and a dead link announcing itself helps no one. Tab order is native; there are no roving-focus tricks."
>
	<Tabs items={demoTabs} ariaLabel="Pagination demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Button mode: <code>page</code> is bindable, <code>onchange</code> fires on every move, and
						the ends disable natively. Clicking the current page is a no-op.
					</p>
					<Example code={basicCode}>
						<Pagination count={10} bind:page />
					</Example>
				{:else if item.id === 'truncation'}
					<p class="tab-note">
						<code>boundaries</code> pages stay pinned at the ends and <code>siblings</code> flank the
						current page; a gap is elided only when it spans two or more pages, and the item count stays
						constant while paging — drag the knobs and page around.
					</p>
					<Example code={truncCode}>
						<Stack gap="md">
							<Pagination count={42} bind:page={truncPage} {siblings} {boundaries} />
							<div class="knobs">
								<Slider
									name="siblings-demo"
									label="siblings"
									min={0}
									max={3}
									bind:value={siblings}
								/>
								<Slider
									name="boundaries-demo"
									label="boundaries"
									min={0}
									max={3}
									bind:value={boundaries}
								/>
							</div>
						</Stack>
					</Example>
				{:else}
					<p class="tab-note">
						With <code>href</code>, every item is a real anchor and the component navigates nothing
						— drive <code>page</code> from the URL. Demo links are inert <code>#</code> hrefs so
						this page stays put; real apps return <code>?page=n</code> URLs like the sample.
					</p>
					<Example code={linkCode}>
						<Pagination
							count={8}
							page={linkPage}
							href={() => '#'}
							ariaLabel="Course results"
							onchange={(p) => (linkPage = p)}
						/>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.knobs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 18rem));
		gap: 1rem;
	}
</style>
