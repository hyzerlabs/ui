<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';
	import { cx } from '$lib/utils';

	interface Props {
		/**
		 * The brand name. The accessible name of the SVG (non-decorative), the
		 * visible text when there is no `svg`, and the thing a consumer's config
		 * already carries.
		 */
		name: string;
		/**
		 * Raw SVG markup, rendered verbatim through `{@html}`. **Trusted
		 * consumer-controlled static content only** — a `?raw` import or a
		 * build-time constant, never user input or a fetched third-party string.
		 * Logo performs no sanitization. Absent (or whitespace-only) renders
		 * `name` as text instead.
		 */
		svg?: string;
		/**
		 * An alternative way to supply the mark: an `<svg>` written directly as
		 * markup instead of a string prop. Sized correctly only after mount (the
		 * markup can't be introspected during SSR) — reach for `svg` instead when
		 * server-rendered sizing matters. If both are given, `svg` wins.
		 */
		children?: Snippet;
		/**
		 * Per-logo multiplier applied on top of the normalized width — the
		 * optical-weight knob. A positive multiplier, typically 0.7-1.3.
		 */
		scale?: number;
		/** Per-logo `filter: brightness()` nudge. Stamped inline only when != 1. */
		brightness?: number;
		/** The surrounding text already names the brand: hides the mark from AT. */
		decorative?: boolean;
		/** Recolor the mark to one color via `fill: var(--hz-logo-color, currentColor)`. */
		monochrome?: boolean;
		class?: string;
		style?: string;
		[key: string]: unknown;
	}

	let {
		name,
		svg,
		children,
		scale = 1,
		brightness = 1,
		decorative = false,
		monochrome = true,
		class: className,
		style: styleProp,
		...rest
	}: Props = $props();

	/** The internal normalization exponent — not a prop. */
	const EXPONENT = 0.4;

	/** `svg` is present, not just whitespace. */
	const hasSvg = $derived(typeof svg === 'string' && svg.trim().length > 0);
	/** A `children` snippet was passed (the alternative SVG source). */
	const hasChildren = $derived(typeof children === 'function');
	/** `children` renders only when there is no `svg` — `svg` wins on conflict. */
	const childrenBranch = $derived(!hasSvg && hasChildren);
	/** Either source is present — the a11y branch and the "not fallback" test. */
	const hasMark = $derived(hasSvg || hasChildren);

	/** Just the opening `<svg …>` tag, so a child element's own width/height/
	 *  viewBox never gets picked up by the attribute scan below. */
	function openTag(markup: string): string {
		const match = markup.match(/<svg\b[^>]*>/i);
		return match ? match[0] : markup;
	}

	function isPositiveFinite(n: number): boolean {
		return Number.isFinite(n) && n > 0;
	}

	/** The leading number of a `width`/`height` attribute; `undefined` when the
	 *  attribute is absent or its unit is `%` (a percentage carries no ratio). */
	function leadingNumberAttr(tag: string, attr: 'width' | 'height'): number | undefined {
		const match = tag.match(
			new RegExp(
				`(?:^|\\s)${attr}\\s*=\\s*["']\\s*(-?[0-9]*\\.?[0-9]+)\\s*([a-zA-Z%]*)\\s*["']`,
				'i'
			)
		);
		if (!match) return undefined;
		if (match[2] === '%') return undefined;
		const n = Number(match[1]);
		return Number.isFinite(n) ? n : undefined;
	}

	/**
	 * A pure string parse (never DOMParser/an element, so it runs
	 * identically during SSR): viewBox's 3rd/4th numbers, then width/height's
	 * leading numbers, then a 1x1 square. Each tier is tried only when the
	 * previous one is entirely absent; an invalid result at whichever tier
	 * matched falls straight to 1x1 rather than trying the next tier.
	 */
	function measure(markup: string): { width: number; height: number } {
		const tag = openTag(markup);
		const SQUARE = { width: 1, height: 1 };

		if (/\bviewBox\s*=/i.test(tag)) {
			const vb = tag.match(/\bviewBox\s*=\s*["']([^"']*)["']/i);
			if (vb) {
				const nums = vb[1]
					.trim()
					.split(/[\s,]+/)
					.filter(Boolean)
					.map(Number);
				if (nums.length === 4) {
					const [, , width, height] = nums;
					if (isPositiveFinite(width) && isPositiveFinite(height)) {
						return { width, height };
					}
				}
			}
			return SQUARE;
		}

		if (/(?:^|\s)width\s*=/i.test(tag) && /(?:^|\s)height\s*=/i.test(tag)) {
			const width = leadingNumberAttr(tag, 'width');
			const height = leadingNumberAttr(tag, 'height');
			if (
				width !== undefined &&
				height !== undefined &&
				isPositiveFinite(width) &&
				isPositiveFinite(height)
			) {
				return { width, height };
			}
			return SQUARE;
		}

		return SQUARE;
	}

	/** The leading number of a raw attribute value; `undefined` when its unit
	 *  is `%` (a percentage carries no ratio) — the children-branch counterpart
	 *  to `leadingNumberAttr` above, operating on a real attribute string
	 *  rather than a regex match against markup. */
	function parseLeadingNumber(value: string): number | undefined {
		const match = value.trim().match(/^(-?[0-9]*\.?[0-9]+)\s*([a-zA-Z%]*)$/);
		if (!match) return undefined;
		if (match[2] === '%') return undefined;
		const n = Number(match[1]);
		return Number.isFinite(n) ? n : undefined;
	}

	/** The same precedence/validation as `measure()`, for a mounted element's
	 *  real attributes rather than a markup string (the `children` branch). */
	function dimsFromAttrs(
		viewBox: string | null,
		width: string | null,
		height: string | null
	): { width: number; height: number } {
		const SQUARE = { width: 1, height: 1 };

		if (viewBox !== null) {
			const nums = viewBox
				.trim()
				.split(/[\s,]+/)
				.filter(Boolean)
				.map(Number);
			if (nums.length === 4) {
				const [, , w, h] = nums;
				if (isPositiveFinite(w) && isPositiveFinite(h)) return { width: w, height: h };
			}
			return SQUARE;
		}

		if (width !== null && height !== null) {
			const w = parseLeadingNumber(width);
			const h = parseLeadingNumber(height);
			if (w !== undefined && h !== undefined && isPositiveFinite(w) && isPositiveFinite(h)) {
				return { width: w, height: h };
			}
			return SQUARE;
		}

		return SQUARE;
	}

	/** Set once the children-branch attachment below has measured the mounted
	 *  `<svg>`. `undefined` before mount, so the structural CSS's own
	 *  `var(--hz-logo-ratio, 1)` fallback holds the box at ratio 1 / factor 1
	 *  until then — SSR and first paint stay a plain square, then the mark
	 *  takes its true proportions at hydration. */
	let measuredDims: { width: number; height: number } | undefined = $state(undefined);

	/**
	 * A snippet can't be introspected during SSR, so the children branch reads
	 * the mounted `<svg>`'s `viewBox`/`width`/`height` **attributes** once —
	 * an attribute read, never a layout measurement — with the same
	 * precedence and validation as the string parse above.
	 */
	function measureChildrenSvg(node: Element): void {
		const svgEl = node.querySelector('svg');
		if (!svgEl) return;
		measuredDims = dimsFromAttrs(
			svgEl.getAttribute('viewBox'),
			svgEl.getAttribute('width'),
			svgEl.getAttribute('height')
		);
	}

	const dims = $derived(
		hasSvg ? measure(svg as string) : childrenBranch ? measuredDims : undefined
	);
	const ratio = $derived(dims ? dims.width / dims.height : undefined);
	/** Rounded to 4 decimal places. */
	const widthFactor = $derived(
		ratio !== undefined ? Math.round(ratio ** EXPONENT * scale * 10000) / 10000 : undefined
	);

	// Consumer `style` is appended after the managed custom properties, so a
	// consumer declaration wins on any collision.
	const rootStyle = $derived.by(() => {
		const parts: string[] = [];
		if (ratio !== undefined && widthFactor !== undefined) {
			parts.push(`--hz-logo-ratio: ${ratio}`);
			parts.push(`--hz-logo-width-factor: ${widthFactor}`);
		}
		if (brightness !== 1) {
			parts.push(`--hz-logo-brightness: ${brightness}`);
		}
		if (styleProp) {
			parts.push(styleProp);
		}
		return parts.length ? parts.join('; ') : undefined;
	});

	// role="img" + aria-label in either mark branch, and only when
	// not decorative — an aria-hidden element with a name is a contradiction,
	// and the fallback's visible text is already the accessible name.
	const roleValue = $derived(hasMark && !decorative ? 'img' : undefined);
	const ariaLabelValue = $derived(hasMark && !decorative ? name : undefined);

	// Two dev-only smell detectors + a trust-boundary warning, each
	// fired once at creation — the Image.svelte placeholder-blur precedent
	// (DEV + untrack, never in production, never blocking).
	if (DEV) {
		untrack(() => {
			if ((!name || !name.trim()) && !decorative) {
				console.warn(
					'[hyzer-ui] <Logo>: `name` is missing or whitespace-only and `decorative` is false, ' +
						'so the logo has no accessible name (WCAG 4.1.2). Pass `name` or set `decorative={true}`.'
				);
			}
			if (hasSvg && hasChildren) {
				console.warn(
					'[hyzer-ui] <Logo>: both `svg` and `children` were given. `svg` wins; remove one.'
				);
			}
			if (svg) {
				if (/<script/i.test(svg) || /(?:^|\s)on[a-z]+\s*=/i.test(svg)) {
					console.warn(
						'[hyzer-ui] <Logo>: the `svg` string contains `<script` or an `on<event>=` attribute. ' +
							'Logo does not sanitize its input — this is not a security control, just a smell ' +
							'detector — so `svg` must be a trusted, consumer-controlled static asset.'
					);
				}
				if (svg.trim().length > 0 && !/<svg/i.test(svg)) {
					console.warn(
						'[hyzer-ui] <Logo>: the `svg` string does not look like SVG markup (no `<svg` found). ' +
							'Did you pass a URL or a stringified module object instead of a `?raw` import?'
					);
				}
			}
		});
	}
</script>

<!--
	{...rest} spreads first so every subsequently-listed attribute (class,
	data-fallback, data-monochrome, role, aria-hidden, aria-label) wins over
	anything a consumer accidentally passes through rest — including a rest
	aria-labelledby, which the documented `decorative` + adjacent-text pattern
	replaces. `style` is a named prop (not part of rest), merged into
	rootStyle above so a consumer's declaration is appended, not dropped.
-->
<span
	{...rest}
	class={cx('hz-logo', className)}
	data-fallback={hasMark ? undefined : ''}
	data-monochrome={monochrome ? '' : undefined}
	style={rootStyle}
	role={roleValue}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={ariaLabelValue}
	{@attach childrenBranch ? measureChildrenSvg : undefined}
>
	{#if hasSvg}
		<!-- svg is a trust boundary by design: a trusted, consumer-
		     controlled static asset only, never sanitized. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html svg}
	{:else if childrenBranch}
		{@render children?.()}
	{:else}
		<span class="hz-logo-text">{name}</span>
	{/if}
</span>

<style>
	/* Structural only — colour and typography live in the theme. */
	.hz-logo {
		display: inline-block;
		inline-size: calc(var(--hz-logo-size, 4rem) * var(--hz-logo-width-factor, 1));
		aspect-ratio: var(--hz-logo-ratio, 1);
		max-inline-size: 100%;
	}

	/* Fallback (no svg): a text-sized box, not the normalized geometry. */
	.hz-logo[data-fallback] {
		inline-size: auto;
		aspect-ratio: auto;
	}

	/* The injected SVG fills the sized box regardless of its own width/height
	 * attributes, so the box's aspect-ratio is what actually renders. */
	.hz-logo :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
