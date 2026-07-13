<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A width-adjustable demo frame for container-query components, driven by
	 * the slider. The readout shows the live content width — the exact width
	 * the component's container queries respond to.
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
	// clientWidth of the borderless, paddingless box = the demo content width.
	let measured = $state(0);
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
				oninput={(e) => box && (box.style.width = `${e.currentTarget.value}px`)}
			/>
		</label>
		<p class="rd-readout" aria-live="polite">
			<strong>{measured || initial}px</strong>{describe ? ` — ${describe(measured || initial)}` : ''}
		</p>
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

	.rd-label input {
		width: 12rem;
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
