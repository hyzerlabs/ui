<script lang="ts">
	/**
	 * The measured size tables, shared by the landing page and Philosophy.
	 *
	 * Every number comes from `sizes.ts`, which `pnpm run gen:sizes` writes by
	 * measuring the published files. Nothing here is typed by hand, so the claim
	 * and the package cannot drift apart.
	 *
	 */
	import { Table } from '$lib';
	import type { TableColumn } from '$lib/types';
	import {
		browserItems,
		browserTotal,
		runtimeDependencies,
		peerDependencies,
		formatBytes,
		type SizeRow
	} from './sizes';

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
		{ key: 'label', header: 'What you import' },
		{ key: 'gzip', header: 'Download (gzipped)', align: 'end' },
		{ key: 'raw', header: 'Uncompressed', align: 'end' },
		{ key: 'note', header: 'What that includes' }
	];

	// Each row is that piece alone, with the total last, so a reader adding two
	// tiers can do the arithmetic themselves.
	const browserRows = [...browserItems.map(toRow), { ...toRow(browserTotal), note: undefined }];
</script>

<div class="size-tables">
	<div class="docs-table">
		<!-- bordered={false}: the card or page section around these tables draws
		     the edges already. -->
		<Table
			stack="sm"
			items={browserRows}
			columns={browserColumns}
			bordered={false}
			caption="What a visitor downloads, piece by piece"
		/>
	</div>
	<p class="size-note">
		Gzipped is what crosses the network. Uncompressed is what the browser holds once it unzips the
		file.
	</p>
	<p class="size-note">
		The first row is the ceiling for JavaScript, not for the total: you will always add at least the
		token sheet on top of it. Your bundler keeps only the components you import, so three components
		cost a fraction of that row. The reference theme works the same way. You can import one
		component sheet at a time instead of the whole thing. The token, reset and utility figures are
		exact, because you import each of those sheets whole.
	</p>
	<p class="size-note">
		<strong
			>{runtimeDependencies === 1
				? '1 dependency (build-time only)'
				: `${runtimeDependencies} dependencies`}</strong
		>, with
		{peerDependencies.join(' and ')} as the only peer dependency.
	</p>
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
