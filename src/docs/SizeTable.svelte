<script lang="ts">
	/**
	 * The measured size tables, shared by the landing page and Philosophy.
	 *
	 * Every number comes from `sizes.ts`, which `pnpm run gen:sizes` writes by
	 * measuring the published files. Nothing here is typed by hand, so the claim
	 * and the package cannot drift apart.
	 *
	 * `variant="browser"` shows only what a visitor downloads, which is the
	 * honest figure for a page-weight claim. `variant="full"` adds the install
	 * breakdown, where most of the bytes are declarations, unminified source and
	 * the icon set: real, but never a per-page cost.
	 */
	import { Table } from '$lib';
	import type { TableColumn } from '$lib/types';
	import {
		browserItems,
		browserTotal,
		installParts,
		installTotal,
		runtimeDependencies,
		peerDependencies,
		formatBytes,
		type SizeRow
	} from './sizes';

	interface Props {
		variant?: 'browser' | 'full';
	}

	let { variant = 'browser' }: Props = $props();

	interface Row {
		id: string;
		label: string;
		gzip: string;
		raw: string;
		note?: string;
	}

	const toRow = (r: SizeRow): Row => ({
		id: r.label,
		label: r.label,
		gzip: formatBytes(r.gzip),
		raw: formatBytes(r.raw),
		note: r.note
	});

	const browserColumns: TableColumn<Row>[] = [
		{ key: 'label', header: 'Piece' },
		{ key: 'gzip', header: 'Gzipped', align: 'end' },
		{ key: 'raw', header: 'Uncompressed', align: 'end' },
		{ key: 'note', header: 'Notes' }
	];

	// Each row is that piece alone, with the total last, so a reader adding two
	// tiers can do the arithmetic themselves.
	const browserRows = [...browserItems.map(toRow), { ...toRow(browserTotal), note: undefined }];
	const installRows = [
		...installParts.map(toRow),
		{ ...toRow({ label: 'Everything published', raw: installTotal, gzip: 0 }), gzip: '' }
	];

	const installColumns: TableColumn<Row>[] = [
		{ key: 'label', header: 'Part of the install' },
		{ key: 'raw', header: 'On disk', align: 'end' },
		{ key: 'note', header: 'Reaches a browser?' }
	];
</script>

<div class="size-tables">
	<div class="docs-table">
		<!-- bordered={false}: the card or page section around these tables draws
		     the edges already. -->
		<Table
			items={browserRows}
			columns={browserColumns}
			bordered={false}
			caption="What a visitor downloads, piece by piece"
		/>
	</div>
	<p class="size-note">
		The JavaScript row is every component bundled and minified, with Svelte left out as the peer
		dependency it is. It is a ceiling, not a cost: import three components and you ship a fraction
		of it. The stylesheet rows are exact, because you import those sheets whole.
		<strong>{runtimeDependencies} runtime dependencies</strong>, with
		{peerDependencies.join(' and ')} as the only peer.
	</p>

	{#if variant === 'full'}
		<div class="docs-table">
			<Table
				items={installRows}
				columns={installColumns}
				bordered={false}
				caption="What npm unpacks, by part"
			/>
		</div>
		<p class="size-note">
			Most of the install never reaches a browser: type declarations, unminified source for your
			bundler to tree-shake, one component per icon so you can take a glyph without the set, and a
			CLI that only runs at build time.
		</p>
	{/if}
</div>

<style>
	.size-tables {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-sm, 1rem);
	}

	.size-note {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
		line-height: var(--hz-line-height-base, 1.5);
	}
</style>
