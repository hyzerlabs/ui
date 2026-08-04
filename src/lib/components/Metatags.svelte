<script lang="ts">
	/**
	 * Headless document-head tags for one page: <title>, description,
	 * canonical, Open Graph, and a Twitter/X card, from a small set of props.
	 * No config, no context, no SvelteKit import — site-level repetition is
	 * a per-site wrapper the consumer owns.
	 */
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';

	interface Props {
		siteUrl?: string;
		url?: string;
		title?: string;
		siteName?: string;
		titleSeparator?: string;
		description?: string;
		image?: string;
		imageAlt?: string;
		type?: string;
		canonical?: string;
		twitterCard?: 'summary' | 'summary_large_image';
		children?: Snippet;
	}

	let {
		siteUrl,
		url,
		title,
		siteName,
		titleSeparator = ' | ',
		description,
		image,
		imageAlt,
		type = 'website',
		canonical,
		twitterCard,
		children
	}: Props = $props();

	/** A scheme (http/https) or protocol-relative ("//…") value — used verbatim. */
	function isAbsoluteLike(value: string): boolean {
		return /^(https?:)?\/\//.test(value);
	}

	/**
	 * A scheme-less host ("localhost:5173/og.png", "example.com/og.png") —
	 * fails the absolute check above and then resolves as a relative PATH
	 * under siteUrl, producing a well-formed but garbage URL. First segment
	 * with a port, or with a dot followed by more path, is host-shaped.
	 */
	function looksLikeSchemelessHost(value: string): boolean {
		return /^([^/]*:\d+(\/|$)|[^/]*\.[^/]+\/)/.test(value);
	}

	/**
	 * Resolves a root-relative value against `siteUrl` — a missing leading `/`
	 * is added first, so "pricing" and "/pricing" land on the same URL.
	 * `undefined` when `siteUrl` is absent or malformed; never throws.
	 */
	function resolveAgainstSite(value: string): string | undefined {
		if (!siteUrl) return undefined;
		const path = value.startsWith('/') ? value : `/${value}`;
		try {
			return new URL(path, siteUrl).toString();
		} catch {
			return undefined;
		}
	}

	/** One resolution rule shared by `url`, `canonical`, and `image`. */
	function resolveUrlLike(value: string | undefined): string | undefined {
		if (!value) return undefined;
		if (isAbsoluteLike(value)) return value;
		return resolveAgainstSite(value);
	}

	// Title composition: a shared string for <title>, og:title, and
	// twitter:title, so a preview card and a browser tab never disagree.
	const composedTitle = $derived.by(() => {
		if (title && siteName)
			return title === siteName ? title : `${title}${titleSeparator}${siteName}`;
		if (title) return title;
		if (siteName) return siteName;
		return undefined;
	});

	const resolvedUrl = $derived(resolveUrlLike(url));
	const resolvedCanonical = $derived(resolveUrlLike(canonical ?? url));
	const resolvedImage = $derived(resolveUrlLike(image));
	const resolvedTwitterCard = $derived(
		twitterCard ?? (resolvedImage ? 'summary_large_image' : 'summary')
	);

	// Dev-only misuse warnings — computed with untrack so each fires once
	// per instance, never in production, and never change what renders. Shape
	// copied from Image.svelte's precedent.
	if (DEV) {
		if (untrack(() => !!image && !imageAlt)) {
			console.warn(
				'[hyzer-ui] <Metatags>: `image` is set without `imageAlt`. The preview image has no text alternative for anyone whose reader announces the card.'
			);
		}
		if (untrack(() => !title && !siteName)) {
			console.warn(
				'[hyzer-ui] <Metatags>: neither `title` nor `siteName` is set, so no <title> is emitted. This is almost always a mistake.'
			);
		}
		untrack(() => {
			for (const [propName, raw] of [
				['url', url],
				['canonical', canonical],
				['image', image]
			] as const) {
				if (!raw || isAbsoluteLike(raw)) continue;
				if (looksLikeSchemelessHost(raw)) {
					console.warn(
						`[hyzer-ui] <Metatags>: \`${propName}\` ("${raw}") looks like a host without a scheme, so it resolves as a relative path${siteUrl ? ` ("${resolveAgainstSite(raw)}")` : ''}. Add "https://" (or "//") if a full URL was meant.`
					);
					continue;
				}
				if (resolveAgainstSite(raw) !== undefined) continue;
				const reason = siteUrl
					? `\`siteUrl\` ("${siteUrl}") is not a valid URL`
					: 'no `siteUrl` was given';
				console.warn(
					`[hyzer-ui] <Metatags>: \`${propName}\` ("${raw}") is relative but ${reason}, so it could not resolve to an absolute URL. The dependent tag is omitted.`
				);
			}
		});
	}
</script>

<svelte:head>
	{#if composedTitle}
		<title>{composedTitle}</title>
	{/if}
	{#if description}
		<meta name="description" content={description} />
	{/if}
	{#if resolvedCanonical}
		<link rel="canonical" href={resolvedCanonical} />
	{/if}
	<meta property="og:type" content={type} />
	{#if siteName}
		<meta property="og:site_name" content={siteName} />
	{/if}
	{#if composedTitle}
		<meta property="og:title" content={composedTitle} />
	{/if}
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	{#if resolvedUrl}
		<meta property="og:url" content={resolvedUrl} />
	{/if}
	{#if resolvedImage}
		<meta property="og:image" content={resolvedImage} />
		{#if imageAlt}
			<meta property="og:image:alt" content={imageAlt} />
		{/if}
	{/if}
	<meta name="twitter:card" content={resolvedTwitterCard} />
	{#if composedTitle}
		<meta name="twitter:title" content={composedTitle} />
	{/if}
	{#if description}
		<meta name="twitter:description" content={description} />
	{/if}
	{#if resolvedUrl}
		<meta name="twitter:url" content={resolvedUrl} />
	{/if}
	{#if resolvedImage}
		<meta name="twitter:image" content={resolvedImage} />
		{#if imageAlt}
			<meta name="twitter:image:alt" content={imageAlt} />
		{/if}
	{/if}
	{@render children?.()}
</svelte:head>
