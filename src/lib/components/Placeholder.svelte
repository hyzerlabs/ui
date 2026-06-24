<script lang="ts">
	/**
	 * Placeholder component — proves the runes toolchain compiles.
	 * This will be replaced by real components in Sprint 1.
	 */
	interface Props {
		/** Display label rendered in the placeholder */
		label?: string;
	}

	let { label = '@hyzer-labs/ui' }: Props = $props();
</script>

<div class="hz-placeholder" data-component="placeholder">
	<span>{label}</span>
</div>
