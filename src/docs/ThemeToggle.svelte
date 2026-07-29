<script lang="ts">
	/**
	 * The light/dark toggle, extracted because three places render it: the
	 * landing header, the docs mobile topbar, and the docs sidebar header.
	 *
	 * Dogfooded: the icon-only Button form (no children + iconStart). The
	 * colors page's Dark mode section documents this exact pattern.
	 */
	import { Button } from '$lib';
	import IconSun from '$lib/icons/generated/sun.svelte';
	import IconMoon from '$lib/icons/generated/moon.svelte';
	import { isDark, toggleTheme } from './theme.svelte.js';
</script>

<Button
	variant="ghost"
	intent="neutral"
	ariaLabel={isDark() ? 'Switch to light theme' : 'Switch to dark theme'}
	aria-pressed={isDark()}
	onclick={toggleTheme}
>
	{#snippet iconStart()}
		{#if isDark()}<IconSun />{:else}<IconMoon />{/if}
	{/snippet}
</Button>
