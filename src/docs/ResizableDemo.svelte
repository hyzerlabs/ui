<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A width-adjustable demo frame for width-responsive components, driven
	 * by the slider or the exact px field. The box is borderless and unpadded
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

	let box = $state<HTMLElement>();
	// clientWidth of the borderless, paddingless box = the component width.
	let measured = $state(0);

	function setWidth(raw: string) {
		const value = Math.round(Math.min(max, Math.max(min, Number(raw) || min)));
		if (box) box.style.width = `${value}px`;
	}
</script>

<div class="rd">
	<div class="rd-controls">
		<label class="rd-label">
			Demo width
			<input
				type="range"
				{min}
				{max}
				value={measured || initial}
				oninput={(e) => setWidth(e.currentTarget.value)}
			/>
		</label>
		<label class="rd-label rd-exact">
			<span class="sr-only">Demo width in pixels</span>
			<input
				type="number"
				{min}
				{max}
				value={measured || initial}
				onchange={(e) => setWidth(e.currentTarget.value)}
			/>
			px
		</label>
		{#if describe}
			<p class="rd-readout" aria-live="polite">{describe(measured || initial)}</p>
		{/if}
	</div>
	<div class="rd-scroll">
		<div
			class="rd-box"
			bind:this={box}
			bind:clientWidth={measured}
			style="width: {initial}px; min-width: {min}px; max-width: {max}px"
		>
			{@render children()}
		</div>
	</div>
</div>

<style>
	.rd-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.rd-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.rd-label input[type='range'] {
		width: 12rem;
	}

	.rd-exact input {
		width: 4.5rem;
		padding: 0.125rem 0.375rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		background: transparent;
		color: inherit;
		font: inherit;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.rd-readout {
		margin: 0;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	/* Widths beyond the available column stay reachable — scroll, not clip. */
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
