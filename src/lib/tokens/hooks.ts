/**
 * @hyzer-labs/ui token engine — the per-component theme-hook vocabulary.
 *
 * Every entry below is a custom property the reference theme declares
 * directly on a component's own class — or, for the few hooks the theme
 * declares on a descendant part instead, that part's class — because an
 * element's own declaration always beats one it only inherits, so a config
 * value has to land on that same class to reach it. For a hook the theme
 * declares at `:root`, or never declares at all, `on` is the `ROOT`
 * sentinel instead: root is what reaches every read site through
 * inheritance without out-ranking an ancestor's own override of the same
 * property (see `ROOT`'s comment). `hyzer generate` reads this list to emit
 * `tokens.components` as one rule per `on` (`config/generate.ts`) — a class
 * selector, or the sheet's own root selector for `ROOT` rows — so a config
 * value lands exactly where the component actually reads it.
 *
 * Authored, not generated — held equal to `src/docs/hooks.ts`'s curation by
 * `src/docs/hooks.spec.ts` rather than mirrored from it (a second generated
 * file, and a second drift test, for data that changes a few times a year).
 * The docs module owns the prose describing what a hook does; this module
 * owns the emission order and the declaring element. The dependency runs
 * docs → lib, never the reverse — never import `src/docs/*` here.
 *
 * `--hz-button-glow` is Terminal-only (`theme/examples/terminal/components/
 * button.css`) — the reference theme never declares it, and it is not a
 * documented `props` row in `src/docs/hooks.ts`. It fails both admission
 * tests (`hooks.spec.ts`'s set-equality gate, and "does the reference theme
 * declare it") and is deliberately left out.
 */

export interface ComponentHook {
	/** Full custom-property name. */
	name: string;
	/**
	 * The class the hook must be DECLARED on for a config value to reach it —
	 * or the sentinel `ROOT`, for a hook the reference theme declares at
	 * `:root` or nowhere at all. See `ROOT`'s own comment for why root, not a
	 * component class, is correct for those.
	 */
	on: string;
}

/**
 * Sentinel `on` value. Emitting a config value for one of these hooks lands
 * it at the SHEET'S root selector (`config/generate.ts`'s `selector`, ordinarily
 * `:root`) rather than on the component's own class.
 *
 * Two cases share this sentinel, for the same reason:
 *
 *   - `--hz-logo-size` — the reference theme declares this one AT `:root`
 *     itself (`theme/components/media.css`), deliberately: it lets a wall
 *     container's own `--hz-logo-size` override shadow it for every logo
 *     inside, an ancestor-override pattern only inheritance can do.
 *   - Every other row below — the theme never declares these at all; a
 *     component reads them with a literal `var(..., fallback)` and nothing
 *     ever sets them.
 *
 * Both land on the same rule: an element's OWN declaration always beats one
 * it merely inherits, so a rule emitted directly on the component class
 * (`:where(.hz-logo) { --hz-logo-size: … }`) would out-rank — and so defeat
 * — the exact ancestor override the theme declares this hook at root to
 * preserve. Root reaches every read site through inheritance regardless, and
 * it costs nothing here: none of these hooks is ever declared ON the
 * component class for a config value to need to out-rank.
 */
export const ROOT = 'root';

/**
 * One row per config-reachable hook, ordered by component (docs order); a
 * component with several hooks keeps the order its own `props` table uses.
 */
export const componentHooks: readonly ComponentHook[] = [
	// Never declared in the reference theme (read-only, literal fallback) — see ROOT.
	{ name: '--hz-footer-col-min', on: ROOT },

	{ name: '--hz-logo-size', on: ROOT },
	// Never declared in the reference theme (read-only, literal fallback) — see ROOT.
	{ name: '--hz-logo-brightness', on: ROOT },
	{ name: '--hz-logo-color', on: ROOT },

	// Declared on .hz-slider-row (field.css) — Slider and RangeSlider both
	// read it there — not on the compound hz-field/hz-field--slider root.
	{ name: '--hz-slider-track-height', on: 'hz-slider-row' },
	{ name: '--hz-slider-thumb-size', on: 'hz-slider-row' },
	{ name: '--hz-slider-length', on: 'hz-slider-row' },

	// Declared on input.hz-toggle, the input itself, not on the compound
	// hz-field hz-field--toggle root — see the Toggle theme-hooks warning.
	{ name: '--hz-toggle-width', on: 'hz-toggle' },
	{ name: '--hz-toggle-height', on: 'hz-toggle' },

	{ name: '--hz-alert-tint', on: 'hz-alert' },
	{ name: '--hz-alert-border-width', on: 'hz-alert' },

	{ name: '--hz-badge-tint', on: 'hz-badge' },

	{ name: '--hz-banner-bg', on: 'hz-banner' },
	{ name: '--hz-banner-fg', on: 'hz-banner' },
	{ name: '--hz-banner-padding-block', on: 'hz-banner' },
	{ name: '--hz-banner-padding-inline', on: 'hz-banner' },

	{ name: '--hz-blockquote-border-width', on: 'hz-blockquote' },
	// Never declared in the reference theme (read-only, literal fallback) — see ROOT.
	{ name: '--hz-blockquote-font-size', on: ROOT },

	{ name: '--hz-button-accent', on: 'hz-button' },
	{ name: '--hz-button-on-accent', on: 'hz-button' },
	{ name: '--hz-button-tint', on: 'hz-button' },

	{ name: '--hz-code-block-bg', on: 'hz-code-block' },
	{ name: '--hz-code-block-padding', on: 'hz-code-block' },
	{ name: '--hz-code-block-fade-height', on: 'hz-code-block' },

	// Never declared in the reference theme (read-only, literal fallback) — see ROOT.
	{ name: '--hz-card-media-size', on: ROOT },

	// Dot size is declared on .hz-carousel-dot itself (carousel.css) — a
	// part, like the slider and toggle hooks above. The other four carousel
	// hooks are never declared in the reference theme (read-only, literal
	// fallbacks) — see ROOT.
	{ name: '--hz-carousel-dot-size', on: 'hz-carousel-dot' },
	{ name: '--hz-carousel-focus-min-height', on: ROOT },
	{ name: '--hz-carousel-item-width', on: ROOT },
	{ name: '--hz-carousel-gap', on: ROOT },
	{ name: '--hz-carousel-rail-inset', on: ROOT },

	// Never declared in the reference theme (read-only, literal fallback) — see ROOT.
	{ name: '--hz-modal-width', on: ROOT },

	{ name: '--hz-loading-fill', on: 'hz-loading' },
	{ name: '--hz-loading-track', on: 'hz-loading' },
	{ name: '--hz-loading-size', on: 'hz-loading' },
	{ name: '--hz-loading-ring-width', on: 'hz-loading' },
	{ name: '--hz-loading-speed', on: 'hz-loading' },
	{ name: '--hz-loading-ease', on: 'hz-loading' },
	{ name: '--hz-loading-pulse-width', on: 'hz-loading' },

	{ name: '--hz-skeleton-color', on: 'hz-skeleton' },
	{ name: '--hz-skeleton-highlight', on: 'hz-skeleton' },
	{ name: '--hz-skeleton-speed', on: 'hz-skeleton' }
];
