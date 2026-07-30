<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Slider, Stack, Cluster } from '$lib';

	/**
	 * A width-adjustable demo frame for width-responsive components, built from
	 * the library: `Stack` owns the vertical rhythm, `Cluster` lays out the
	 * control row, and `Slider` drives the width. The box is borderless and unpadded
	 * so its width IS the component's width — demos must not put padded or
	 * bordered wrappers between the box and the component, or the readout
	 * drifts from what the component measures.
	 */
	interface Props {
		/** Starting box width in px. */
		initial?: number;
		min?: number;
		max?: number;
		/** Optional annotation appended to the px readout, e.g. the active breakpoint. */
		describe?: (width: number) => string;
		children: Snippet;
	}

	let { initial = 720, min = 320, max = 1400, describe, children }: Props = $props();

	// `initial` is deliberately captured once as the starting width.
	// svelte-ignore state_referenced_locally
	let width = $state(initial);
	// clientWidth of the borderless, paddingless box = the true component width.
	let measured = $state(0);
</script>

<Stack gap="sm">
	<Cluster gap="md" align="end">
		<div class="rd-slider">
			<Slider name="demo-width" label="Demo width" {min} {max} unit="px" bind:value={width} />
		</div>
		{#if describe}
			<p class="rd-readout" aria-live="polite">{describe(measured || width)}</p>
		{/if}
	</Cluster>
	<div class="rd-scroll">
		<div
			class="rd-box"
			bind:clientWidth={measured}
			style="width: {width}px; min-width: {min}px; max-width: {max}px"
		>
			{@render children()}
		</div>
	</div>
</Stack>

<style>
	.rd-slider {
		flex: 0 1 22rem;
		min-width: 16rem;
	}

	/* Cluster's align="end" lines this up with the slider's own baseline. */
	.rd-readout {
		margin: 0;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	/* Widths beyond the available column stay reachable: scroll, not clip. */
	.rd-scroll {
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	/*
	 * The box is deliberately borderless and unpadded so its clientWidth is
	 * exactly the width the child component's container queries measure; the
	 * outline marks the edge without affecting it.
	 */
	.rd-box {
		outline: 1px dashed var(--hz-color-border, #6b7280);
		outline-offset: 2px;
		border-radius: 1px;
	}
</style>
