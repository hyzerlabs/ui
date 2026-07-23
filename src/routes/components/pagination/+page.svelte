<script lang="ts">
	import { Pagination, Tabs, Stack, Slider } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import { paginationDoc } from '../../../docs/data/pagination.js';
	import Example from '../../../docs/Example.svelte';

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

<DocPage name="Pagination" {...paginationDoc}>
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
