/**
 * The styling contract, per component — spec 31 R9.
 *
 * Every component page renders its slice as a Theme hooks table, and
 * /theming/components rolls the custom properties up across all of them. One
 * source, so a hook is described in exactly one place.
 *
 * ## Why this is authored rather than generated
 *
 * Neither source of truth can produce this list honestly:
 *
 * - Components stamp things that aren't a promise. `data-index` (Virtualizer)
 *   is a JS↔DOM correlation key no CSS selects; `--hz-grid-cols*` are written
 *   inline by Grid from its `columns` prop. Extracting every attribute would
 *   publish those as contract and freeze them by accident.
 * - The reference theme isn't the whole surface. Container, Stack, Cluster,
 *   Grid and Split have no sheet at all; Toggle's knobs live in field.css,
 *   not a toggle.css. And `--hz-breakout-shift` / `--hz-footer-col-min` are
 *   never declared anywhere — they exist only as `var(--x, fallback)` reads.
 *
 * The bar for "not contract" is high, though: anything stamped 1:1 from a
 * public prop IS contract, even when it looks incidental. Plumbing means the
 * consumer can't meaningfully set it, or the value is derived state the
 * component owns. When in doubt, document it.
 *
 * So curation decides what's contract. `hooks.spec.ts` decides whether the
 * curation is true: it holds every row here against the real source and fails
 * on a documented hook that doesn't exist or a theme hook nobody documented.
 */

/** One row of a hook table. */
export interface HookRow {
	name: string;
	/** The vocabulary — enumerated values, or the shape a custom property takes. */
	values: string;
	/** What it does. Sentence case, no trailing period for fragments. */
	note: string;
}

/** A component's full styling contract. */
export interface ComponentHooks {
	/** The stable root class, without the leading dot. */
	root: string;
	/** `data-*` hooks — the variant/state vocabulary. */
	attrs?: HookRow[];
	/** Custom properties a consumer is invited to override. */
	props?: HookRow[];
	/** Extra classes the contract includes (child parts, theme conventions). */
	parts?: HookRow[];
	/**
	 * A prose caution rendered as an `Alert intent="warning"` above the hooks
	 * table, for the rare component whose theme treatment isn't a plain
	 * `@layer hz-theme` override — e.g. Toggle, whose track/thumb rules are
	 * deliberately unlayered. Backtick segments render as inline `<code>`
	 * (same convention as `a11yNote`). Most components have no entry.
	 */
	warning?: string;
}

/**
 * Custom properties the reference theme DECLARES that are deliberately not
 * contract, so hooks.spec.ts can tell "intentionally private" apart from
 * "someone forgot to document it". Scoped to what the drift check actually
 * sees: names declared in src/lib/theme/**.
 *
 * The theme marks its real knobs with an `Override hooks:` / `documented hook`
 * comment at the declaration site. That convention is the discriminator — a
 * declared `--hz-*` with no such label is a derivation, not an invitation.
 */
export const INTERNAL_HOOKS: Record<string, string> = {
	'--hz-field-ring':
		'Internal — one focus-ring recipe DRYed across the field controls. Unlabelled at its declaration (field.css), unlike every advertised knob; retune the ring through the focus/primary tokens instead.'
};

// Not listed here, and deliberately:
//
// - `--hz-width-sm/md/lg/xl` are global tokens (tokens/tokens.css), read —
//   never written — by Container and Split. Split's spec covers a consumer
//   overriding --hz-width-sm to retune when the split stacks. They belong to
//   the token scale, so Foundation documents them, not a component table.
// - `--hz-grid-cols*`, `--hz-grid-min`, `--hz-textarea-rows`, `--hz-slider-
//   chars`, `--hz-slider-fill*`, `--hz-tick-pos` are JS→CSS channels written
//   inline by their components, carrying values CSS cannot compute (a live
//   fraction, a normalized tick list). They never appear in theme CSS, so the
//   drift check never sees them; they are internal by construction.
// - Loading's determinate ring writes its `.hz-loading-ring-fill` inline
//   `stroke-dashoffset` (the live value/max fraction) directly as an SVG
//   attribute style, not a `--hz-*` custom property — the same JS→CSS
//   live-value precedent as `--hz-slider-fill*` above (specs/49 R3).
// - `--_c`, `--_bs`, `--_bw`, `--_threshold`, `--_chars`, `--_loading-rm-scale`
//   are private by the underscore convention and never match the --hz-* scan.
//   `--_loading-rm-scale` is Loading's reduced-motion slow multiplier (1
//   normally, 2 under `prefers-reduced-motion: reduce`, specs/49 Decision 9) —
//   deliberately not a public hook (Out of Scope, specs/49).

/**
 * The field family's shared contract. Every member carries a .hz-field root
 * with this state hook and these four parts, so they're defined once and
 * spread in rather than restated twelve times.
 */
const FIELD_STATE: HookRow[] = [
	{
		name: 'data-state',
		values: "'default' | 'error' | 'disabled'",
		note: 'The universal field state hook, on the root. Precedence is fixed: error beats disabled.'
	}
];

const FIELD_PARTS: HookRow[] = [
	{ name: '.hz-field-label', values: 'child element', note: 'The label.' },
	{ name: '.hz-field-required', values: 'child element', note: 'The required marker.' },
	{ name: '.hz-field-description', values: 'child element', note: 'The hint text.' },
	{ name: '.hz-field-error', values: 'child element', note: 'The error message.' }
];

/** Slider and RangeSlider share their geometry knobs. */
const SLIDER_PROPS: HookRow[] = [
	{
		name: '--hz-slider-track-height',
		values: '<length> — default 0.375rem',
		note: 'Track thickness.'
	},
	{
		name: '--hz-slider-thumb-size',
		values: '<length> — default 1.125rem',
		note: 'Thumb width and height. The fill edge tracks the thumb centre, so the fill and ticks stay aligned at any size.'
	},
	{
		name: '--hz-slider-length',
		values: '<length> — default 12rem',
		note: "The track's block length in vertical orientation. Ignored in horizontal, where the track flexes to fill the row instead."
	}
];

/**
 * Keyed by component name — matches the manifest's page labels.
 *
 * Global tokens (`--hz-space-*`, `--hz-width-*`, `--hz-color-*`) are NOT
 * listed as component hooks even though the components read them. They belong
 * to the token scale and are documented on Foundation; repeating them per
 * component would bury each component's own knobs in shared noise.
 */
export const hooks: Record<string, ComponentHooks> = {
	// ---------------------------------------------------------------- Layout
	Container: {
		root: 'hz-container',
		attrs: [
			{
				name: 'data-max',
				values: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
				note: 'Selects which --hz-width-* token caps the column. Default lg.'
			},
			{
				name: 'data-padding',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Padding on both axes. Default md.'
			},
			{
				name: 'data-center',
				values: 'present when centered',
				note: 'Applies margin-inline: auto. Present by default.'
			},
			{
				name: 'data-breakout',
				values: 'present when breaking out',
				note: 'Escapes the column to span the nearest inline-size container.'
			}
		],
		props: [
			{
				name: '--hz-breakout-shift',
				values: '<length> — default calc(50% - 50cqw)',
				note: 'Breakout alignment offset. The default assumes a centered column; set it to 0 in a start-aligned layout so the bleed only grows rightward.'
			}
		]
	},
	Stack: {
		root: 'hz-stack',
		attrs: [
			{
				name: 'data-gap',
				values: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'near' | 'away'",
				note: 'Row gap. Default md. The only layout gap scale with an xl rung.'
			},
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
				note: 'align-items. Default stretch.'
			},
			{
				name: 'data-padding',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Padding on both axes. Default none.'
			}
		]
	},
	Cluster: {
		root: 'hz-cluster',
		attrs: [
			{
				name: 'data-gap',
				values: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Gap between items. Default sm.'
			},
			{
				name: 'data-justify',
				values: "'start' | 'center' | 'end' | 'between' | 'around'",
				note: 'justify-content. Default start.'
			},
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
				note: 'align-items. Default center.'
			},
			{
				name: 'data-wrap',
				values: 'present when wrapping',
				note: 'Present by default; its absence is styled too (:not([data-wrap]) sets nowrap).'
			},
			{
				name: 'data-padding',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Padding on both axes. Default none.'
			}
		]
	},
	Grid: {
		root: 'hz-grid',
		attrs: [
			{
				name: 'data-gap',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Track gap. Default md.'
			},
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
				note: 'align-items. Default stretch.'
			},
			{
				name: 'data-padding',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Padding, applied to the root so container queries measure the space the tracks actually get. Default none.'
			},
			{
				name: 'data-fluid',
				values: 'present in fluid mode',
				note: 'Read-only: present when columns is {min}. Target it to style fluid grids apart from banded ones — the mode is set by the prop, not the attribute.'
			}
		],
		parts: [
			{
				name: '.hz-grid-layout',
				values: 'child element',
				note: 'The real grid. The root is a size container only (an element cannot container-query itself), so track and gap rules live here.'
			}
		]
	},
	Split: {
		root: 'hz-split',
		attrs: [
			{
				name: 'data-fraction',
				values: "'1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'auto'",
				note: 'Ratio of the two columns above the stack threshold. Default 1/2.'
			},
			{
				name: 'data-gap',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Gap between the columns. Default md.'
			},
			{
				name: 'data-reverse',
				values: 'present when reversed',
				note: 'Visual-only swap via order — DOM and focus order are preserved.'
			},
			{
				name: 'data-stack-below',
				values: "'sm' | 'md' | 'lg'",
				note: 'Picks which --hz-width-* token the stack threshold resolves through, so overriding that token retunes when the split stacks. Default sm.'
			},
			{
				name: 'data-padding',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Padding, applied to the root. Default none.'
			}
		],
		parts: [
			{
				name: '.hz-split-layout',
				values: 'child element',
				note: 'The flex row. Carries the gap; the fraction and order rules reach your two children through it.'
			}
		]
	},
	Virtualizer: {
		root: 'hz-virtualizer',
		parts: [
			{
				name: '.hz-virtualizer-sizer',
				values: 'child element',
				note: 'Full-height spacer that gives the scroller its scroll range.'
			},
			{
				name: '.hz-virtualizer-window',
				values: 'child element',
				note: 'The translated window holding the rendered rows.'
			},
			{
				name: '.hz-virtualizer-row',
				values: 'child element',
				note: 'Per-row wrapper. Also load-bearing at runtime — measured mode queries it — so it is stable by contract, not just by convention.'
			}
		]
	},

	// ------------------------------------------------------------ Navigation
	Nav: {
		root: 'hz-nav',
		attrs: [
			{
				name: 'data-orientation',
				values: "'horizontal' | 'vertical'",
				note: 'Selects the layout mode — a horizontal row with popover dropdown panels, or a sidebar column with inline nested disclosure sections. Default horizontal.'
			},
			{
				name: 'data-state',
				values: "'open' | 'closed'",
				note: 'On .hz-nav-panel — the dropdown/disclosure open/closed vocabulary to animate against.'
			}
		],
		parts: [
			{
				name: '.hz-nav-links',
				values: 'child element',
				note: 'The link list — a row (horizontal) or a column (vertical).'
			},
			{
				name: '.hz-nav-dropdown',
				values: 'child element',
				note: 'The list item wrapping a submenu.'
			},
			{
				name: '.hz-nav-trigger',
				values: 'child element',
				note: 'The label-only section toggle (no href).'
			},
			{
				name: '.hz-nav-chevron',
				values: 'child element',
				note: 'The separate chevron button when the item is both a link and a toggle.'
			},
			{
				name: '.hz-nav-panel',
				values: 'child element',
				note: 'The submenu list — a popover when horizontal, an inline section when vertical.'
			},
			{
				name: '.hz-nav-heading',
				values: 'child element',
				note: 'A group label inside a panel: static text, no focus stop.'
			}
		]
	},
	Header: {
		root: 'hz-header',
		attrs: [
			{
				name: 'data-variant',
				values: "'default' | 'transparent'",
				note: 'Bar surface treatment. Default default.'
			},
			{
				name: 'data-bordered',
				values: 'present when bordered',
				note: 'Bottom hairline. Composes with any variant.'
			},
			{ name: 'data-sticky', values: 'present when sticky', note: 'Sticks the bar to the top.' },
			{
				name: 'data-mobile-breakpoint',
				values: "'sm' | 'md' | 'lg' | 'none'",
				note: 'Which width collapses the bar into the drawer. none never collapses. Default md.'
			},
			{
				name: 'data-state',
				values: "'open' | 'closed'",
				note: 'On .hz-header-drawer — the drawer open/closed vocabulary to animate against.'
			}
		],
		parts: [
			{
				name: '.hz-header-inner',
				values: 'child element',
				note: 'The flex bar; owns its padding.'
			},
			{ name: '.hz-header-brand', values: 'child element', note: 'Wrapper for the brand snippet.' },
			{
				name: '.hz-header-actions',
				values: 'child element',
				note: 'Wrapper for the actions snippet (in the bar). Below the mobile breakpoint, an auto inline-start margin pins it to the end, next to the hamburger — override margin-inline-start on this class (e.g. via a descendant selector off your own class prop) for centering or any other placement.'
			},
			{ name: '.hz-header-toggle', values: 'child element', note: 'The hamburger button.' },
			{ name: '.hz-header-drawer', values: 'child element', note: 'The mobile drawer.' },
			{
				name: '.hz-header-drawer-actions',
				values: 'child element',
				note: 'The actions repeated inside the drawer.'
			}
		]
	},
	Breadcrumbs: {
		root: 'hz-breadcrumbs',
		attrs: [
			{
				name: '[aria-current]',
				values: "'page'",
				note: 'Not a data hook — Breadcrumbs stamps no data-*. The last crumb carries aria-current, and that is the only state selector on offer.'
			}
		],
		parts: [
			{
				name: '.hz-breadcrumbs-current',
				values: 'child element',
				note: 'The final crumb when it has no href (plain text rather than a link).'
			},
			{
				name: '.hz-breadcrumbs-separator',
				values: 'child element',
				note: 'The aria-hidden separator wrapper; sizes its icon to 1em.'
			}
		]
	},
	Pagination: {
		root: 'hz-pagination',
		parts: [
			{ name: '.hz-pagination-list', values: 'child element', note: 'The row of page controls.' },
			{
				name: '.hz-pagination-page',
				values: 'on a Button',
				note: 'Rides through Button’s class prop, so it lands on a .hz-button — target it accordingly. Tabular numerals and a min-width keep the row from jittering.'
			},
			{
				name: '.hz-pagination-prev',
				values: 'on a Button',
				note: 'Previous control. Also a .hz-button.'
			},
			{
				name: '.hz-pagination-next',
				values: 'on a Button',
				note: 'Next control. Also a .hz-button.'
			},
			{
				name: '.hz-pagination-ellipsis',
				values: 'child element',
				note: 'The aria-hidden gap marker.'
			}
		]
	},
	Footer: {
		root: 'hz-footer',
		attrs: [
			{
				name: 'data-variant',
				values: "'default' | 'minimal'",
				note: 'minimal drops the padding and goes transparent. Default default.'
			},
			{
				name: 'data-bordered',
				values: 'present when bordered',
				note: 'Top hairline. A prop, not a variant — it composes with either surface.'
			}
		],
		props: [
			{
				name: '--hz-footer-col-min',
				values: '<length> — default 12rem',
				note: 'Minimum column width for the auto-fit link grid: how narrow a column may get before the row reflows. No media queries involved — this is the whole knob.'
			}
		],
		parts: [
			{ name: '.hz-footer-logo', values: 'child element', note: 'Wrapper for the logo snippet.' },
			{
				name: '.hz-footer-columns',
				values: 'on a Grid',
				note: 'Rides through Grid’s class prop. The auto-fit override hangs off it — and lands on .hz-grid-layout, since that is where Grid does its layout.'
			},
			{ name: '.hz-footer-column', values: 'child element', note: 'One column’s nav landmark.' },
			{ name: '.hz-footer-heading', values: 'child element', note: 'A column heading.' },
			{
				name: '.hz-footer-social',
				values: 'child element',
				note: 'Wrapper for the social snippet.'
			},
			{ name: '.hz-footer-bottom', values: 'child element', note: 'The bottom bar.' }
		]
	},
	Toc: {
		root: 'hz-toc',
		attrs: [
			{
				name: 'data-breakpoint',
				values: "'sm' | 'md' | 'lg' | 'none'",
				note: 'Which width the rail collapses below into a disclosure. none (default) never collapses. A real @media breakpoint, not a container query — the rail’s own box is typically narrow regardless of page width.'
			},
			{
				name: 'data-collapsed',
				values: 'present while the mobile disclosure is closed',
				note: 'Only stamped when data-breakpoint is not none. Absent once the panel opens, and inert above the breakpoint, where the panel is always shown.'
			},
			{
				name: '[aria-current]',
				values: "'location'",
				note: 'On .hz-toc-link — the scroll-spy’s active entry. Not a data-* hook.'
			},
			{
				name: 'data-level (on .hz-toc-link)',
				values: '<number> — the collected heading level (2, 3, …)',
				note: 'Per-entry, not root-level — drives the indent.'
			}
		],
		parts: [
			{ name: '.hz-toc-title', values: 'child element', note: 'The plain (non-heading) title.' },
			{
				name: '.hz-toc-trigger',
				values: 'child element',
				note: 'The mobile disclosure button (title + chevron). Always rendered, shown only below the breakpoint — the theme swaps it in for .hz-toc-title by data-breakpoint and the viewport, the Header toggle precedent.'
			},
			{
				name: '.hz-toc-panel',
				values: 'child element',
				note: 'Wraps the list; what the trigger shows/hides below the breakpoint.'
			},
			{
				name: '.hz-toc-list',
				values: 'child element',
				note: 'A nested <ul>, one per level below the top.'
			},
			{
				name: '.hz-toc-link',
				values: 'child element',
				note: 'One entry.'
			}
		]
	},

	// ----------------------------------------------------------------- Media
	Image: {
		root: 'hz-image',
		attrs: [
			{
				name: 'data-state',
				values: "'loading' | 'loaded' | 'error'",
				note: 'The load lifecycle. Read-only — the component owns it. Drives the placeholder crossfade and the error surface.'
			},
			{
				name: 'data-fit',
				values: "'cover' | 'contain' | 'fill' | 'none'",
				note: 'object-fit on the inner img. Default cover.'
			},
			{
				name: 'data-rounded',
				values: "present | 'sm' | 'md' | 'lg' | 'full'",
				note: 'Corner radius. Bare presence (from rounded={true}) means md.'
			},
			{
				name: 'data-aspect-ratio',
				values: "'auto' | '1/1' | '4/3' | '16/9' | '21/9' | any ratio",
				note: 'Mirrors the prop; the ratio itself lands as an inline style. The union is open — the listed values are documentation, not a limit.'
			},
			{
				name: 'data-placeholder',
				values: "'blur' | 'color'",
				note: "Absent when there is no placeholder — you cannot select [data-placeholder='none']. blur without placeholderSrc degrades to none."
			},
			{ name: 'data-loading', values: "'lazy' | 'eager'", note: 'Mirrors the loading prop.' },
			{
				name: 'data-picture',
				values: 'present in picture mode',
				note: 'Present when sources are supplied.'
			}
		],
		props: [
			{
				name: '--hz-image-placeholder-blur',
				values: '<length> — default 20px',
				note: 'Blur radius on the low-res placeholder.'
			},
			{
				name: '--hz-image-fade-duration',
				values: '<time> — default 0.3s',
				note: 'Placeholder crossfade duration. Read at both ends of the fade, so the two stay locked together.'
			}
		],
		parts: [
			{
				name: '.hz-image__img',
				values: 'child element',
				note: 'The real img. Note the BEM double underscore — Image and Video use it; the rest of the library uses a single dash.'
			},
			{
				name: '.hz-image__placeholder',
				values: 'child element',
				note: 'The decorative low-res image that fades out.'
			},
			{
				name: '.hz-image__picture',
				values: 'child element',
				note: 'The <picture> element. display: contents, so it adds no box.'
			}
		]
	},
	Lightbox: {
		root: 'hz-lightbox-triggers',
		attrs: [
			{
				name: 'data-state',
				values: "'open' | 'closed'",
				note: 'On the viewer dialog, mirroring the bindable open prop. Visibility itself runs off the native [open] attribute — this is the hook to animate against.'
			},
			{
				name: 'data-gallery',
				values: 'present with more than one item',
				note: 'On the viewer dialog. Drives the fixed gallery stage sizing that a single item skips (it hugs its media instead).'
			},
			{
				name: 'data-lightbox-trigger',
				values: 'present on a grouped trigger',
				note: 'Set by the lightboxGroup attachment rather than the component. Its only styling is a zoom-in cursor.'
			}
		],
		parts: [
			{
				name: '.hz-lightbox-trigger',
				values: 'child element',
				note: 'A thumbnail button. Also the root class when you supply your own children.'
			},
			{ name: '.hz-lightbox-thumb', values: 'child element', note: 'The thumbnail image.' },
			{
				name: '.hz-lightbox-thumb-label',
				values: 'child element',
				note: 'Fallback chip when no thumbnail resolves.'
			},
			{
				name: '.hz-lightbox-badge',
				values: 'child element',
				note: 'The play marker on video items.'
			},
			{
				name: '.hz-lightbox',
				values: 'the viewer dialog',
				note: 'The overlay itself. It takes no class prop, so this name is unconditionally stable.'
			},
			{ name: '.hz-lightbox-close', values: 'child element', note: 'The close control.' },
			{
				name: '.hz-lightbox-carousel',
				values: 'on the embedded Carousel',
				note: 'Multi-item viewers only — see Carousel for its own parts underneath.'
			},
			{
				name: '.hz-lightbox-figure',
				values: 'child element',
				note: 'The figure wrapping each item.'
			},
			{ name: '.hz-lightbox-caption', values: 'child element', note: 'The caption.' },
			{
				name: '.hz-lightbox-img',
				values: "on an Image's wrapper",
				note: 'Rides through Image’s class prop — so it names a div, not an img. Reach the picture itself through .hz-lightbox-img .hz-image__img.'
			},
			{
				name: '.hz-lightbox-video',
				values: 'child element',
				note: 'The wrapper around a video item’s Video.'
			}
		]
	},
	Video: {
		root: 'hz-video',
		attrs: [
			{
				name: 'data-provider',
				values: "'youtube' | 'vimeo' | 'native'",
				note: 'Detected from src. Styling hook for provider-specific chrome.'
			},
			{
				name: 'data-aspect-ratio',
				values: "'16/9' | '4/3' | '1/1' | '9/16'",
				note: 'Mirrors the prop; the ratio lands as an inline style. Closed union — unlike Image, there is no auto. Default 16/9.'
			},
			{
				name: 'data-state',
				values: "'idle' | 'playing' | 'paused' | 'ended'",
				note: 'Read-only playback state. Native embeds only — a YouTube or Vimeo iframe stays idle, because the provider owns those controls.'
			}
		],
		parts: [
			{
				name: '.hz-video__el',
				values: 'child element',
				note: 'The player — the iframe or the native video, whichever the src resolved to. One class across all three branches, so it fills the ratio box either way.'
			}
		]
	},

	// ----------------------------------------------------------------- Forms
	//
	// The field family shares one contract: a .hz-field root carrying
	// data-state, and the hz-field-label / -required / -description / -error
	// parts. Rather than repeat those five rows twelve times, FIELD_STATE and
	// FIELD_PARTS below are spread into each member, and each entry adds only
	// what is its own.
	Form: {
		root: 'hz-form',
		attrs: [
			{
				name: 'data-state',
				values: "'error' | absent",
				note: 'Present once the summary has errors. Two-state, unlike the field family’s three — a form is never disabled.'
			}
		],
		parts: [
			{
				name: '.hz-form-error-summary',
				values: 'on an Alert',
				note: 'The summary box — an Alert underneath. Load-bearing beyond styling: the focus-on-submit path queries this class.'
			},
			{ name: '.hz-form-error-list', values: 'child element', note: 'The list of errors.' },
			{
				name: '.hz-form-error-summary-item',
				values: 'child element',
				note: 'One error row, including its jump link.'
			}
		]
	},
	TextInput: {
		root: 'hz-field',
		attrs: [
			...FIELD_STATE,
			{
				name: 'data-has-prefix',
				values: 'present when a prefix is set',
				note: 'On .hz-input-wrapper. The reference theme ships no rule for it — it exists so you can, e.g., retune padding when an affix is present.'
			},
			{
				name: 'data-has-suffix',
				values: 'present when a suffix is set',
				note: 'On .hz-input-wrapper. Same: yours to use.'
			}
		],
		parts: [
			...FIELD_PARTS,
			{
				name: '.hz-input-wrapper',
				values: 'child element',
				note: 'The bordered box. It carries the border, so prefix and suffix sit inside it.'
			},
			{ name: '.hz-input-prefix', values: 'child element', note: 'The leading affix.' },
			{ name: '.hz-input-suffix', values: 'child element', note: 'The trailing affix.' }
		]
	},
	Textarea: {
		root: 'hz-field',
		attrs: [
			...FIELD_STATE,
			{
				name: 'data-resize',
				values: "'none' | 'vertical' | 'both' | 'auto'",
				note: 'On the textarea. Default vertical; auto uses field-sizing: content.'
			}
		],
		parts: [...FIELD_PARTS]
	},
	Select: {
		root: 'hz-field',
		attrs: [...FIELD_STATE],
		parts: [...FIELD_PARTS]
	},
	Combobox: {
		root: 'hz-field hz-combobox',
		attrs: [
			...FIELD_STATE,
			{
				name: 'data-open',
				values: 'present while the popup is open',
				note: 'On the root. Rotates the toggle chevron and gates the popup.'
			},
			{
				name: 'data-active',
				values: 'present on the active option',
				note: 'Virtual focus — the highlighted option. Real focus stays in the input.'
			},
			{
				name: 'data-selected',
				values: 'present on selected options',
				note: 'Selected options; the theme adds a checkmark.'
			},
			{
				name: 'data-disabled',
				values: 'present on disabled options',
				note: 'Per-option. Disabled options stay focusable (aria-disabled, not the native attribute).'
			}
		],
		parts: [
			...FIELD_PARTS,
			{
				name: '.hz-combobox-control',
				values: 'child element',
				note: 'The bordered row holding the input, chips, and toggle.'
			},
			{ name: '.hz-combobox-input', values: 'child element', note: 'The text input.' },
			{ name: '.hz-combobox-toggle', values: 'child element', note: 'The chevron button.' },
			{ name: '.hz-combobox-popup', values: 'child element', note: 'The floating panel.' },
			{ name: '.hz-combobox-listbox', values: 'child element', note: 'The option list.' },
			{ name: '.hz-combobox-option', values: 'child element', note: 'One option.' },
			{ name: '.hz-combobox-empty', values: 'child element', note: 'The no-results message.' }
		]
	},
	FileUpload: {
		root: 'hz-field hz-file-upload',
		attrs: [
			...FIELD_STATE,
			{
				name: 'data-dropzone',
				values: 'present in dropzone mode',
				note: 'On the root. The reference theme discriminates the two modes by targeting the parts instead, so this one is yours.'
			},
			{
				name: 'data-dragover',
				values: 'present while dragging over',
				note: 'On .hz-file-dropzone. Backed by a depth counter, so it survives dragging across child elements.'
			}
		],
		parts: [
			...FIELD_PARTS,
			{ name: '.hz-file-control', values: 'child element', note: 'The box in basic mode.' },
			{ name: '.hz-file-dropzone', values: 'child element', note: 'The box in dropzone mode.' },
			{ name: '.hz-file-dropzone-text', values: 'child element', note: 'The dropzone prompt.' },
			{ name: '.hz-file-button', values: 'child element', note: 'The browse button.' },
			{ name: '.hz-file-list', values: 'child element', note: 'The selected-file list.' },
			{ name: '.hz-file-item', values: 'child element', note: 'One file row.' },
			{ name: '.hz-file-name', values: 'child element', note: 'The file name.' },
			{ name: '.hz-file-size', values: 'child element', note: 'The formatted size.' },
			{
				name: '.hz-file-remove',
				values: 'child element',
				note: 'The per-file remove button. Also load-bearing: focus placement after a removal queries it.'
			}
		]
	},
	Checkbox: {
		root: 'hz-field hz-field--checkbox',
		attrs: [
			...FIELD_STATE,
			{
				name: ':checked / :indeterminate',
				values: 'native pseudo-classes',
				note: 'Checkbox stamps no attribute for either — style the native pseudo-classes. (indeterminate is set as a DOM property, so only :indeterminate sees it.)'
			}
		],
		parts: [...FIELD_PARTS]
	},
	RadioGroup: {
		root: 'hz-field hz-field--radio-group',
		attrs: [
			...FIELD_STATE,
			{
				name: 'data-orientation',
				values: "'horizontal' | 'vertical'",
				note: 'Default vertical. The root is a fieldset and the label is its legend.'
			}
		],
		parts: [
			...FIELD_PARTS,
			{ name: '.hz-radio-options', values: 'child element', note: 'The radiogroup container.' },
			{ name: '.hz-radio-option', values: 'child element', note: 'One option row.' }
		]
	},
	Slider: {
		root: 'hz-field hz-field--slider',
		attrs: [
			...FIELD_STATE,
			{
				name: 'data-has-ticks',
				values: 'present when ticks render',
				note: 'On .hz-slider-row; reserves room for the tick strip. Reflects the normalized list — out-of-range ticks are dropped — so it is not derivable from the prop.'
			},
			{
				name: 'data-has-input',
				values: 'present when the number field shows',
				note: 'On .hz-slider-row. The reference theme targets the parts instead, so this one is yours.'
			},
			{
				name: 'data-orientation',
				values: "'horizontal' | 'vertical'",
				note: 'On .hz-slider-row; always present. Drives the writing-mode-based vertical mechanism and the theme rotation (fill, ticks). Default horizontal.'
			},
			{
				name: 'data-input-position',
				values: "'start' | 'end'",
				note: 'On .hz-slider-row; always present. Logical on both axes — reorders the track vs. the number field/readout. Default end.'
			}
		],
		props: [...SLIDER_PROPS],
		parts: [
			...FIELD_PARTS,
			{ name: '.hz-slider-row', values: 'child element', note: 'The track-and-readout row.' },
			{ name: '.hz-slider-track', values: 'child element', note: 'The painted track.' },
			{
				name: '.hz-slider',
				values: 'the range input',
				note: 'The native input carrying the thumb.'
			},
			{ name: '.hz-slider-ticks', values: 'child element', note: 'The tick strip.' },
			{ name: '.hz-slider-tick', values: 'child element', note: 'One tick.' },
			{ name: '.hz-slider-tick-label', values: 'child element', note: 'A tick’s label.' },
			{ name: '.hz-slider-number', values: 'child element', note: 'The editable number field.' },
			{ name: '.hz-slider-value', values: 'child element', note: 'The read-only readout.' },
			{ name: '.hz-slider-unit', values: 'child element', note: 'The unit suffix.' }
		]
	},
	RangeSlider: {
		root: 'hz-field hz-field--slider hz-field--slider-range',
		attrs: [
			...FIELD_STATE,
			{
				name: 'data-has-ticks',
				values: 'present when ticks render',
				note: 'On .hz-slider-row, as on Slider.'
			},
			{
				name: 'data-has-input',
				values: 'present when the number fields show',
				note: 'On .hz-slider-row. Unstyled by the reference theme.'
			},
			{
				name: 'data-orientation',
				values: "'horizontal' | 'vertical'",
				note: 'On .hz-slider-row; always present, as on Slider. Both ranges pick up writing-mode: vertical-lr; direction: rtl.'
			},
			{
				name: 'data-input-position',
				values: "'start' | 'end'",
				note: 'On .hz-slider-row; always present, as on Slider. The min–max pair stays one inline cluster, reordered as a unit.'
			}
		],
		props: [...SLIDER_PROPS],
		parts: [
			...FIELD_PARTS,
			{ name: '.hz-slider-row', values: 'child element', note: 'The track-and-readout row.' },
			{
				name: '.hz-slider-track',
				values: 'child element',
				note: 'Paints the track and the between-thumbs fill.'
			},
			{
				name: '.hz-slider-min',
				values: 'the lower range input',
				note: 'Carries .hz-slider too.'
			},
			{ name: '.hz-slider-max', values: 'the upper range input', note: 'Carries .hz-slider too.' },
			{
				name: '.hz-slider-inputs',
				values: 'child element',
				note: 'Wraps the number-field pair (or the readout) so it stays one inline cluster regardless of orientation.'
			},
			{ name: '.hz-slider-number-min', values: 'child element', note: 'The lower number field.' },
			{ name: '.hz-slider-number-max', values: 'child element', note: 'The upper number field.' },
			{ name: '.hz-slider-sep', values: 'child element', note: 'The dash between the readouts.' },
			{ name: '.hz-slider-ticks', values: 'child element', note: 'The tick strip.' }
		]
	},
	ColorInput: {
		root: 'hz-field hz-field--color',
		attrs: [...FIELD_STATE],
		props: [
			{
				name: '--hz-color-swatch-size',
				values: '<length> — default 2rem',
				note: 'The swatch height; its width follows at 1.5×, so the 3:2 shape is fixed. Declared on input.hz-color — set it there or deeper, not on the .hz-field root, or the local declaration wins over your inherited value.'
			}
		],
		parts: [
			...FIELD_PARTS,
			{ name: '.hz-color-row', values: 'child element', note: 'The swatch-and-readout row.' },
			{ name: '.hz-color', values: 'the color input', note: 'The native swatch.' },
			{ name: '.hz-color-hex', values: 'child element', note: 'The editable hex field.' },
			{ name: '.hz-color-value', values: 'child element', note: 'The read-only hex readout.' }
		]
	},
	Toggle: {
		root: 'hz-field hz-field--toggle',
		warning:
			"`.hz-field--toggle input.hz-toggle` — the track and thumb — is the one rule in the reference theme shipped outside `@layer hz-theme`, on purpose: headless, Toggle is a bare native checkbox, so this rule needs to out-rank the component's own scoped structural reset unconditionally, and a layer can only lose to an unlayered rule regardless of specificity. It sits at a raw `(0,2,1)` specificity. A normal override written inside a layer — or even an unlayered rule that ties on specificity and loses on source order — silently does nothing; the toggle keeps its default look with no error. To win reliably, give your override enough specificity to clear `(0,2,1)` outright, e.g. by scoping it under your own theme's root class: `.your-theme .hz-field--toggle input.hz-toggle { … }`. See the Terminal example theme for a worked example (`theme/examples/terminal/components/toggle.css`), which does exactly this. The same applies to the `--hz-toggle-width` / `--hz-toggle-height` custom properties below — they're declared directly on that selector, so setting them from a lower-specificity or losing rule never reaches the element.",
		attrs: [
			// Toggle is the one place data-state means two different things at two
			// levels, so both rows name their element rather than the bare attr.
			{
				name: 'data-state (on the root)',
				values: "'default' | 'error' | 'disabled'",
				note: 'The universal field state hook, as on every field. Precedence is fixed: error beats disabled.'
			},
			{
				name: 'data-state (on input.hz-toggle)',
				values: "'on' | 'off'",
				note: 'A second data-state nested inside the root’s, with a disjoint vocabulary — this is the stable hook for the track and thumb. It exists rather than relying on :checked because the toggle rules must win the specificity fight described above, and an attribute selector composes into them cleanly.'
			}
		],
		props: [
			{
				name: '--hz-toggle-width',
				values: '<length> — default 2.5rem',
				note: 'Track width, and the distance the thumb travels.'
			},
			{
				name: '--hz-toggle-height',
				values: '<length> — default 1.5rem',
				note: 'Track height. The thumb derives from it (height minus a 2px inset all round), so there is no separate thumb knob — and the travel stays correct under any override.'
			}
		],
		parts: [
			...FIELD_PARTS,
			{
				name: '.hz-toggle',
				values: 'the checkbox input',
				note: 'The track. Its ::before is the thumb, so the thumb has no class of its own.'
			}
		]
	},

	// ---------------------------------------------------------------- Common
	Alert: {
		root: 'hz-alert',
		attrs: [
			{
				name: 'data-intent',
				values: "'neutral' | any registered intent",
				note: 'Drives the accent bar, tint, and title colour. Spans the intent registry, so an intent you register lands here too.'
			},
			{
				name: 'data-rounded',
				values: "'none' | 'sm' | 'md' | 'lg' | 'full'",
				note: '1:1 with the --hz-radius-* scale. Default md.'
			},
			{
				name: 'data-dismissible',
				values: 'present when dismissible',
				note: 'Marks the dismissible form. Always stamped so you can target it, though the reference theme ships no rule for it.'
			}
		],
		props: [
			{
				name: '--hz-alert-tint',
				values: '<percentage> — 10% light, 22% dark',
				note: 'How strongly the intent colour mixes into the surface. Retuning it means re-checking the soft pairings on Contrast & Accessibility.'
			},
			{
				name: '--hz-alert-border-width',
				values: '<length> — default var(--hz-border-width-heavy)',
				note: 'Thickness of the inline-start accent bar. Defaults to the heaviest border-width token; override with any length or a lighter token.'
			}
		],
		parts: [
			{ name: '.hz-alert-icon', values: 'child element', note: 'The intent icon.' },
			{ name: '.hz-alert-body', values: 'child element', note: 'Title and content wrapper.' },
			{
				name: '.hz-alert-title',
				values: 'child element',
				note: 'The heading, at your headingLevel.'
			},
			{ name: '.hz-alert-content', values: 'child element', note: 'The message body.' },
			{ name: '.hz-alert-dismiss', values: 'child element', note: 'The dismiss button.' }
		]
	},
	Badge: {
		root: 'hz-badge',
		attrs: [
			{
				name: 'data-intent',
				values: "'neutral' | any registered intent",
				note: 'Spans the intent registry.'
			},
			{ name: 'data-variant', values: "'soft' | 'solid' | 'outline'", note: 'Default soft.' },
			{
				name: 'data-size',
				values: "'sm' | 'md'",
				note: 'Two rungs only, unlike Button. Default md.'
			},
			{
				name: 'data-rounded',
				values: "'none' | 'sm' | 'md' | 'lg' | 'full'",
				note: 'Default full — the pill.'
			},
			{
				name: 'data-dismissible',
				values: 'present when dismissible',
				note: 'Marks the chip form. Always stamped so you can target it.'
			}
		],
		props: [
			{
				name: '--hz-badge-tint',
				values: '<percentage> — 14% light, 28% dark',
				note: 'Soft-variant background tint strength.'
			}
		],
		parts: [{ name: '.hz-badge-dismiss', values: 'child element', note: 'The remove button.' }]
	},
	Banner: {
		root: 'hz-banner',
		attrs: [
			{
				name: 'data-intent',
				values: "'neutral' | any registered intent",
				note: 'Drives the solid fill via --hz-banner-bg; spans the intent registry.'
			},
			{
				name: 'data-pin',
				values: "'top' | 'bottom'",
				note: 'Present only when pinned; sticks the bar to that edge via position: sticky.'
			},
			{
				name: 'data-dismissible',
				values: 'present when dismissible',
				note: 'Present only when onDismiss is set — target it to style the dismissible form.'
			}
		],
		props: [
			{
				name: '--hz-banner-bg',
				values: '<color> — default var(--hz-intent-neutral)',
				note: "The solid fill, switched per intent — override to restyle every intent's bar."
			},
			{
				name: '--hz-banner-fg',
				values: '<color> — default var(--hz-color-surface)',
				note: 'On-fill text colour, the surface role so it flips with the mode and keeps text ≥ 4.5:1 in both.'
			},
			{
				name: '--hz-banner-padding-block',
				values: '<length> — default 1.5rem',
				note: 'Vertical padding of the bar.'
			},
			{
				name: '--hz-banner-padding-inline',
				values: '<length> — default 2.5rem',
				note: 'Horizontal padding of the bar.'
			}
		],
		parts: [
			{ name: '.hz-banner-icon', values: 'child element', note: 'The decorative leading icon.' },
			{ name: '.hz-banner-content', values: 'child element', note: 'The message body.' },
			{ name: '.hz-banner-actions', values: 'child element', note: 'The trailing actions slot.' },
			{ name: '.hz-banner-dismiss', values: 'child element', note: 'The dismiss button.' },
			{
				name: '.hz-banner-title',
				values: 'opt-in class',
				note: 'Banner never emits this — put it on your own lead element (strong, a heading) and it goes block-level semibold, stacking over the body copy. The .hz-card-title convention.'
			}
		]
	},
	Blockquote: {
		root: 'hz-blockquote',
		attrs: [
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end'",
				note: 'Aligns the attribution row only — the quote body is deliberately left alone. Default start.'
			},
			{
				name: 'data-intent',
				values: 'any registered intent',
				note: 'Present only when intent is set. Colors only the accent line (border-inline-start) — no intent leaves the accent line at its default border color.'
			},
			{
				name: 'data-intent-scope',
				values: "'line' | 'full'",
				note: 'Present only when intent is set (mirrors data-intent — meaningless without an intent to scope). line (default) matches data-intent alone; full also colors the quote text. The attribution row is never affected.'
			}
		],
		props: [
			{
				name: '--hz-blockquote-border-width',
				values: '<length> — default var(--hz-border-width-heavy)',
				note: 'Thickness of the inline-start accent line. Defaults to the heaviest border-width token; override with any length or a lighter token. The attribution row indent tracks it automatically.'
			}
		],
		parts: [
			{
				name: '.hz-blockquote-quote',
				values: 'child element',
				note: 'The quote itself, carrying the accent bar.'
			},
			{
				name: '.hz-blockquote-attribution',
				values: 'child element',
				note: 'The attribution line.'
			},
			{ name: '.hz-blockquote-cite', values: 'child element', note: 'The cite element.' }
		]
	},
	Button: {
		root: 'hz-button',
		attrs: [
			{
				name: 'data-variant',
				values: "'solid' | 'outline' | 'ghost' | 'soft'",
				note: 'Default solid.'
			},
			{
				name: 'data-intent',
				values: "'neutral' | any registered intent",
				note: 'The full vocabulary, not a hand-picked subset — register an intent and Button stamps it. Sets --hz-button-accent.'
			},
			{
				name: 'data-size',
				values: "'sm' | 'md' | 'lg' | 'full'",
				note: 'Default md. full fills its container at the md height/padding — not combinable with sm/lg.'
			},
			{
				name: 'data-state',
				values: "'disabled' | 'loading' | absent",
				note: 'Absent when interactive — every hover and active rule is gated on :not([data-state]), so styling a state cannot be undone by a hover. disabled wins over loading.'
			},
			{
				name: 'data-icon-only',
				values: 'present when icon-only',
				note: 'Derived: an icon with no children. Renders the circle form.'
			}
		],
		props: [
			{
				name: '--hz-button-accent',
				values: '<color> — default var(--hz-intent-primary)',
				note: 'The accent every variant derives from. Override it to restyle solid, outline, ghost, and soft at once — and it is how you wire up an intent you registered yourself.'
			},
			{
				name: '--hz-button-on-accent',
				values: '<color> — default var(--hz-color-surface)',
				note: 'Text colour on a solid fill. The surface role rather than white, so it flips with the mode and keeps solid text ≥ 4.5:1 in both.'
			},
			{
				name: '--hz-button-tint',
				values: '<percentage> — 14% light, 28% dark',
				note: 'Soft-variant background tint strength — the same recipe and hook pattern as --hz-badge-tint.'
			}
		]
	},
	CodeBlock: {
		root: 'hz-code-block',
		attrs: [
			{
				name: 'data-language',
				values: '<string> — present when language is set',
				note: 'Mirrors the language prop; the default code also carries language-<value> for client autoloaders, and the header shows a matching tag.'
			},
			{
				name: 'data-has-title',
				values: 'present when title is set',
				note: 'Marks the titled form. Independent of data-language — the header can render from either.'
			},
			{
				name: 'data-highlighted',
				values: 'present when the children escape hatch is used',
				note: "Marks a block whose code node is consumer-supplied pre-highlighted markup (R19). Target it to drop the default code-surface fill and let a build-time highlighter's own background sit cleanly."
			},
			{
				name: 'data-collapsible',
				values: 'present when the listing exceeds collapsedLines',
				note: 'Reflects effective behaviour, not the raw prop — a short listing never gets the toggle, so this is absent for it.'
			},
			{
				name: 'data-line-numbers',
				values: 'present when lineNumbers is on',
				note: 'Marks the gutter form.'
			}
		],
		props: [
			{
				name: '--hz-code-block-bg',
				values: '<color> — default var(--hz-color-surface-muted)',
				note: "The code surface fill; the collapse fade fades into it. Suppressed under data-highlighted so a build-time highlighter's own background shows."
			},
			{
				name: '--hz-code-block-padding',
				values: '<length> — default 1rem',
				note: 'Padding inside the code region (pre) — reaches a consumer-supplied pre too.'
			},
			{
				name: '--hz-code-block-fade-height',
				values: '<length> — default 3rem',
				note: 'Height of the collapse fade over the clamped edge.'
			}
		],
		parts: [
			{
				name: '.hz-code-block-header',
				values: 'child element',
				note: 'The header bar; present when title or language is set.'
			},
			{ name: '.hz-code-block-title', values: 'child element', note: 'The filename/label text.' },
			{
				name: '.hz-code-block-lang',
				values: 'child element',
				note: 'The non-interactive language tag; present only when language is set.'
			},
			{
				name: '.hz-code-block-clip',
				values: 'child element',
				note: 'The code region — the collapsible viewport, focusable when it renders the default code node.'
			},
			{
				name: '.hz-code-block-gutter',
				values: 'child element',
				note: 'The aria-hidden, non-selectable line-number column; present only with lineNumbers.'
			},
			{
				name: '.hz-code-block-copy',
				values: 'on a Button',
				note: 'Rides through Button’s class prop, so it also carries .hz-button and its data-attrs.'
			},
			{
				name: '.hz-code-block-expand',
				values: 'on a Button',
				note: 'The Show-more/less toggle; also a .hz-button.'
			},
			{
				name: 'code.language-<language>',
				values: 'on the default inner code',
				note: 'The class a client autoloader targets; present only when language is set and the children escape hatch is not used. Not an hz-owned class.'
			}
		]
	},
	Link: {
		root: 'hz-link',
		attrs: [
			{
				name: 'data-variant',
				values: "'default' | 'subtle' | 'nav'",
				note: 'Its own union, not the shared Variant. subtle inherits colour; nav is quiet until hover or aria-current. No size hook by design — a link inherits its surrounding text size.'
			},
			{
				name: '[aria-current]',
				values: "'page' | 'step' | 'true'",
				note: 'Load-bearing for styling, not just semantics: the active nav-link rule is [data-variant="nav"][aria-current].'
			},
			{
				name: 'data-external',
				values: 'present on external links',
				note: 'Accompanies target="_blank" and the visually-hidden "opens in new tab" hint. The reference theme styles the glyph instead, so this one is yours.'
			}
		],
		parts: [
			{
				name: '.hz-link-external-icon',
				values: 'child element',
				note: 'The auto-rendered external glyph. Absent when you supply your own iconEnd.'
			}
		]
	},
	Card: {
		root: 'hz-card',
		attrs: [
			{
				name: 'data-padding',
				values: "'none' | 'sm' | 'md' | 'lg'",
				note: 'Lands on .hz-card-content, not the root — which is how media bleeds edge-to-edge while text stays inset. Default md.'
			},
			{
				name: 'data-rounded',
				values: "'none' | 'sm' | 'md' | 'lg'",
				note: 'No full rung, unlike the shared Rounded scale. Default md.'
			},
			{
				name: 'data-horizontal',
				values: 'present when horizontal',
				note: 'Media beside content above 640px.'
			},
			{
				name: 'data-clickable',
				values: 'present when href is set',
				note: 'The whole card becomes a target; the theme hangs its hover affordances off this together with a treatment class.'
			},
			{
				name: 'data-media-position',
				values: "'start' | 'end'",
				note: 'Mirrors the prop. The effect is DOM order, not CSS order — so reading order and visual order cannot disagree.'
			}
		],
		props: [
			{
				name: '--hz-card-media-size',
				values: '<length|percentage> — default 40%',
				note: 'The media track in horizontal mode; media fills it. Never declared, so set it yourself on .hz-card or an ancestor.'
			}
		],
		parts: [
			{
				name: '.hz-card--outlined',
				values: 'opt-in class',
				note: 'A theme treatment, not a prop: pass it via class. Card ships no variant prop because the look is the theme’s call, not the API’s.'
			},
			{
				name: '.hz-card--elevated',
				values: 'opt-in class',
				note: 'The shadow treatment. Same deal.'
			},
			{
				name: '.hz-card-title',
				values: 'opt-in class',
				note: 'Card never emits this — you bring the heading element at whatever level the page needs, and the class only styles it. Headings aren’t load-bearing for Card the way they are for Modal or Accordion, so this never became API.'
			},
			{ name: '.hz-card-media', values: 'child element', note: 'The media wrapper.' },
			{ name: '.hz-card-content', values: 'child element', note: 'The padded region.' },
			{ name: '.hz-card-body', values: 'child element', note: 'The default slot wrapper.' },
			{ name: '.hz-card-actions', values: 'child element', note: 'The actions row.' },
			{
				name: '.hz-card-link',
				values: 'child element',
				note: 'The overlay anchor, present only when clickable.'
			}
		]
	},
	Divider: {
		root: 'hz-divider',
		attrs: [
			{
				name: 'data-variant',
				values: "'solid' | 'dashed' | 'dotted'",
				note: 'Line style. Default solid.'
			},
			{
				name: 'data-spacing',
				values: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
				note: 'Block margin from the space scale. near and away are the density distances, so dividers respond to a density shift like the layout family. Default md.'
			},
			{
				name: 'data-line-width',
				values: "'thin' | 'thick'",
				note: '1:1 with --hz-border-width-thin/-thick.'
			},
			{
				name: 'data-labeled',
				values: 'present on the labelled form',
				note: 'The labelled form is a div with rules; the plain form is a bare hr. The theme tells them apart by element (hr.hz-divider vs div.hz-divider), so match that if you restyle.'
			}
		],
		parts: [
			{
				name: '.hz-divider-label',
				values: 'child element',
				note: 'The label. Its flanking lines are ::before/::after, so they are not separately targetable.'
			}
		]
	},
	Dropdown: {
		root: 'hz-dropdown',
		attrs: [
			{
				name: 'data-open',
				values: 'present while open',
				note: 'Hides the closed menu and rotates the chevron.'
			},
			{
				name: 'data-side',
				values: "'bottom' | 'top'",
				note: 'On .hz-dropdown-menu — the resolved side, bottom unless flipped for lack of room below. See Positioning for the caret recipe.'
			},
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end'",
				note: 'On .hz-dropdown-menu — which edge the menu hangs from (or centered), RTL-aware.'
			},
			{
				name: 'data-danger',
				values: 'present on danger items',
				note: 'Per-item. The label text carries the meaning too — colour alone never does.'
			},
			{
				name: 'data-disabled',
				values: 'present on disabled items',
				note: 'Per-item. Items stay focusable (aria-disabled, not the native attribute), so the disabled state is still discoverable.'
			}
		],
		parts: [
			{
				name: '.hz-dropdown-trigger',
				values: 'on a Button',
				note: 'Merged onto the composed Button, so the trigger carries .hz-button and its full data-attr set as well.'
			},
			{ name: '.hz-dropdown-menu', values: 'child element', note: 'The menu surface.' },
			{
				name: '.hz-dropdown-item',
				values: 'child element',
				note: 'One item. There is no data-active — the active item is real DOM focus, so style :focus / :focus-visible.'
			},
			{ name: '.hz-dropdown-item-icon', values: 'child element', note: 'An item’s icon slot.' },
			{ name: '.hz-dropdown-separator', values: 'child element', note: 'A separator row.' }
		]
	},
	Carousel: {
		root: 'hz-carousel',
		attrs: [
			{
				name: 'data-active',
				values: 'present on the active slide and dot',
				note: 'On .hz-carousel-slide and .hz-carousel-dot. Off-screen slides carry inert instead — they are clipped by the viewport, not hidden — so target :not([inert]) for the visible one.'
			},
			{
				name: 'data-dragging',
				values: 'present while a drag is underway',
				note: 'On .hz-carousel-track. The settle transition is suppressed while it is present so the track follows the pointer 1:1; a grab/grabbing cursor pairs with it.'
			},
			{
				name: 'data-controls',
				values: "'visible' | 'focus'",
				note: "On the root, always stamped, both values. Presentation only: the controls markup is identical either way. focus visually hides the whole control row until :hover/:focus-within reveals it together — the row stays in the DOM, in the a11y tree, and fully operable throughout (the WCAG 2.5.7 non-dragging alternative to drag). Default 'visible'."
			},
			{
				name: 'data-seamless',
				values: 'present only when seamless && loop',
				note: 'On the root. Absent when seamless is set without loop — an inert no-op — so the hook reflects effective behavior, never advertising a wrap that cannot happen.'
			},
			{
				name: 'data-clone',
				values: 'present on a wrap-settle clone slide',
				note: 'On .hz-carousel-slide. Rendered only mid-wrap, seamless loop, a distance-1 boundary crossing (drag, buttons, an adjacent-wrap dot, or arrow keys) — an inert, aria-hidden copy of the opposite-end slide the track settles into before silently resetting to the real target. Never counted in count, "{n} of {total}", or the dot rail; never focusable.'
			}
		],
		props: [
			{
				name: '--hz-carousel-dot-size',
				values: '<length> — default 0.5rem',
				note: 'Dot diameter (the painted size; the tap target is larger). Declared on .hz-carousel-dot itself, so set it there — declaring it on .hz-carousel will not reach, since the local declaration beats your inherited value.'
			},
			{
				name: '--hz-carousel-focus-min-height',
				values: '<length> — default 12rem',
				note: "Minimum height of .hz-carousel-viewport, data-controls='focus' only. The revealed control row is an absolutely positioned overlay with no reserved layout space, so on a short carousel it can cover most of the slide — this keeps slide content clear of the row regardless of the slide's own height. data-controls='visible' needs no reserved space (its row sits in normal flow below the viewport) and is unaffected."
			}
		],
		parts: [
			{
				name: '.hz-carousel-viewport',
				values: 'child element',
				note: 'The clip window and live region.'
			},
			{
				name: '.hz-carousel-track',
				values: 'child element',
				note: 'The sliding row of slides. Its transform is an inline style; the transition and the drag cursor live here.'
			},
			{
				name: '.hz-carousel-slide',
				values: 'child element',
				note: 'One slide; off-screen ones are inert.'
			},
			{ name: '.hz-carousel-controls', values: 'child element', note: 'The control row.' },
			{
				name: '.hz-carousel-prev',
				values: 'on a Button',
				note: 'Previous control; also a .hz-button. Its ::before carries the 44px touch target.'
			},
			{
				name: '.hz-carousel-next',
				values: 'on a Button',
				note: 'Next control; also a .hz-button. Its ::before carries the 44px touch target.'
			},
			{ name: '.hz-carousel-dots', values: 'child element', note: 'The dot rail.' },
			{
				name: '.hz-carousel-dot',
				values: 'child element',
				note: 'One dot. Its ::before is a transparent tap target larger than the painted dot.'
			},
			{ name: '.hz-carousel-status', values: 'child element', note: 'The "1 / 3" counter.' }
		]
	},
	Hero: {
		root: 'hz-hero',
		attrs: [
			{
				name: 'data-layout',
				values: "'center' | 'split' | 'overlay'",
				note: 'In overlay the media becomes the background. split composes Split underneath, so .hz-split-layout is in reach. Default center.'
			},
			{
				name: 'data-height',
				values: "'auto' | 'screen' | 'half'",
				note: 'Uses dvh where supported. Default auto.'
			},
			{ name: 'data-align', values: "'start' | 'center' | 'end'", note: 'Default center.' },
			{
				name: 'data-reverse-on-mobile',
				values: 'present when reversed',
				note: 'Split layout only: wraps the media above the content on narrow screens.'
			}
		],
		parts: [
			{
				name: '.hz-hero-background',
				values: 'child element',
				note: 'The full-bleed media, overlay layout only.'
			},
			{ name: '.hz-hero-content', values: 'child element', note: 'The text column.' },
			{ name: '.hz-hero-eyebrow', values: 'child element', note: 'The eyebrow line.' },
			{
				name: '.hz-hero-title',
				values: 'child element',
				note: 'The heading, at your headingLevel.'
			},
			{ name: '.hz-hero-subtitle', values: 'child element', note: 'The subtitle, capped at 60ch.' },
			{ name: '.hz-hero-actions', values: 'child element', note: 'The actions row.' },
			{
				name: '.hz-hero-media',
				values: 'child element',
				note: 'The media wrapper in center and split layouts.'
			}
		]
	},
	Modal: {
		root: 'hz-modal',
		attrs: [
			{
				name: 'data-size',
				values: "'sm' | 'md' | 'lg' | 'full'",
				note: 'full goes edge-to-edge and drops the radius. Default md.'
			},
			{
				name: 'data-state',
				values: "'open' | 'closed'",
				note: 'Mirrors the open prop. Visibility itself runs off the native [open] attribute that showModal() sets — this is the hook to animate against.'
			},
			{
				name: 'data-modal-close',
				values: 'present on the close button',
				note: 'Load-bearing beyond styling: focus management queries it to keep the close button out of the first-focus candidates. Renaming it breaks focus order, not just looks.'
			}
		],
		props: [
			{
				name: '--hz-modal-width',
				values: '<length> — 30/40/52rem by size',
				note: 'One name across all three sizes: it overrides whichever size is active. data-size="full" ignores it.'
			}
		],
		parts: [
			{ name: '.hz-modal-header', values: 'child element', note: 'Always rendered.' },
			{
				name: '.hz-modal-title',
				values: 'child element',
				note: 'Always an h2 — Modal has no headingLevel prop, because the dialog is its own document section.'
			},
			{ name: '.hz-modal-description', values: 'child element', note: 'The optional description.' },
			{
				name: '.hz-modal-body',
				values: 'child element',
				note: 'Always rendered, so the scroll region stays stable even when empty.'
			},
			{ name: '.hz-modal-footer', values: 'child element', note: 'Present only with actions.' },
			{ name: '::backdrop', values: 'pseudo-element', note: 'The native dialog backdrop.' }
		]
	},
	Tooltip: {
		root: 'hz-tooltip',
		attrs: [
			{
				name: 'data-state',
				values: "'open' | 'closed'",
				note: 'Drives visibility (inline display, not the theme) — the hook to animate the entrance/exit against.'
			},
			{
				name: 'data-placement',
				values: 'Placement',
				note: 'The requested placement string, e.g. "top" or "bottom-start" — mirrors the placement option verbatim.'
			},
			{
				name: 'data-side',
				values: "'top' | 'bottom' | 'left' | 'right'",
				note: 'The resolved, physical side — after any overflow flip and RTL resolution. See Positioning for the caret recipe.'
			},
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end'",
				note: 'The resolved cross-axis alignment (RTL-aware for a top/bottom placement).'
			}
		],
		props: [
			{
				name: '--hz-z-tooltip',
				values: '<number> — default 150',
				note: 'Matters mainly on the non-top-layer fallback path (older browsers) — a real top-layer tooltip stacks above everything regardless of z-index.'
			}
		]
	},
	Popover: {
		root: 'hz-popover',
		attrs: [
			{
				name: 'data-open',
				values: 'present while open',
				note: 'On the root — the Dropdown parity hook.'
			},
			{
				name: 'data-state (panel)',
				values: "'open' | 'closed'",
				note: 'On .hz-popover-panel — mirrors the open prop; the hook to animate the entrance against.'
			},
			{
				name: 'data-placement',
				values: 'Placement',
				note: 'On .hz-popover-panel — the requested placement string, e.g. "bottom-start".'
			},
			{
				name: 'data-side',
				values: "'top' | 'bottom' | 'left' | 'right'",
				note: 'On .hz-popover-panel — the resolved, physical side. See Positioning for the caret recipe.'
			},
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end'",
				note: 'On .hz-popover-panel — the resolved cross-axis alignment (RTL-aware for a top/bottom placement).'
			}
		],
		props: [
			{
				name: '--hz-z-popover',
				values: '<number> — default 200',
				note: 'Matters mainly on the non-top-layer fallback path (older browsers) — a real top-layer panel stacks above everything regardless of z-index.'
			}
		],
		parts: [
			{
				name: '.hz-popover-trigger',
				values: 'on a Button',
				note: 'Merged onto the default composed Button trigger — absent when the `trigger` snippet escape hatch is used instead, since that renders your own element.'
			},
			{ name: '.hz-popover-panel', values: 'child element', note: 'The disclosure panel surface.' },
			{
				name: '.hz-popover-content',
				values: 'child element',
				note: 'The scroll container inside the panel — the panel itself stays overflow-visible so a caret you draw can protrude. See Positioning for the recipe.'
			}
		]
	},
	Accordion: {
		root: 'hz-accordion',
		attrs: [
			{
				name: 'data-state',
				values: "'open' | 'closed'",
				note: 'On .hz-accordion-item; rotates the icon.'
			},
			{
				name: 'data-type',
				values: "'single' | 'multiple'",
				note: 'Mirrors the prop. The behaviour is native <details> grouping, not CSS, so nothing in the theme reads this — it is yours.'
			},
			{
				name: '[aria-disabled]',
				values: "'true'",
				note: 'Disabled styling hangs off aria-disabled on .hz-accordion-trigger — not off the data-disabled that also appears on the item. Tabs does the opposite; match the component you are styling.'
			}
		],
		parts: [
			{ name: '.hz-accordion-item', values: 'child element', note: 'The <details> element.' },
			{ name: '.hz-accordion-trigger', values: 'child element', note: 'The <summary>.' },
			{
				name: '.hz-accordion-heading',
				values: 'child element',
				note: 'The heading inside the summary, at your headingLevel.'
			},
			{ name: '.hz-accordion-icon', values: 'child element', note: 'The disclosure chevron.' },
			{
				name: '.hz-accordion-panel',
				values: 'child element',
				note: 'The content. The component ships no display/height/overflow on it on purpose, so it is free for you to animate.'
			}
		]
	},
	Tabs: {
		root: 'hz-tabs',
		attrs: [
			{
				name: 'data-orientation',
				values: "'horizontal' | 'vertical'",
				note: 'Vertical moves the list border and the active indicator to the inline edge. Default horizontal.'
			},
			{
				name: 'data-state',
				values: "'active' | 'inactive'",
				note: 'On .hz-tabs-trigger. The panel carries it too, but its visibility runs off the native hidden attribute.'
			},
			{
				name: 'data-disabled',
				values: 'present on disabled tabs',
				note: 'On .hz-tabs-trigger. Disabled tabs stay focusable (aria-disabled, not the native attribute).'
			}
		],
		parts: [
			{
				name: '.hz-tabs-list',
				values: 'child element',
				note: 'The tablist. Scrolls horizontally.'
			},
			{
				name: '.hz-tabs-trigger',
				values: 'child element',
				note: 'One tab. The theme owns the whole button reset here, so an unthemed Tabs renders native buttons. The active indicator is an inset box-shadow, deliberately: the list scrolls, and any overlap trick that adds layout size produces a phantom scrollbar. Keep that property if you restyle it.'
			},
			{ name: '.hz-tabs-panel', values: 'child element', note: 'One panel.' }
		]
	},
	Table: {
		root: 'hz-table hz-table-wrap',
		attrs: [
			{
				name: 'data-sticky',
				values: 'present when stickyHeader',
				note: 'On .hz-table-wrap. Pins thead against the wrap’s own scroll — cap the wrap’s max-height (e.g. via your own class through Table’s `class` prop, which lands on the wrap) to see it scroll.'
			},
			{
				name: 'data-stack',
				values: "'sm' | 'md' | 'lg'",
				note: "On .hz-table-wrap. Mirrors the stack prop — stacked below the named --hz-width-* threshold, a real table at/above it. Absent (default): never stacks. 'sm' (640px) is the recommended default — genuinely narrow viewports only."
			},
			{
				name: 'data-selected',
				values: 'present on a selected row',
				note: 'On tbody tr. Pairs with aria-selected="true" — both present only when selected.'
			},
			{
				name: 'data-align',
				values: "'start' | 'center' | 'end'",
				note: 'On th/td, mirroring a column’s align. Logical values, so start/end flip under RTL with no extra rule.'
			},
			{
				name: 'aria-sort',
				values: "'ascending' | 'descending'",
				note: 'Not a data-* hook, but load-bearing for styling the active-column indicator: present only on the sorted column’s th, never on the others.'
			}
		],
		parts: [
			{
				name: '.hz-table-sort',
				values: 'child element',
				note: 'The sort trigger — a real button wrapping a sortable column’s header text, with the active-column chevron alongside it.'
			},
			{
				name: '.hz-table-empty',
				values: 'child element',
				note: 'The full-width cell rendered when items is empty and not loading.'
			},
			{
				name: '.hz-table-skeleton',
				values: 'child element',
				note: 'A loading placeholder row — on tbody tr; aria-hidden, so it never reaches assistive tech.'
			},
			{
				name: '.hz-table--striped',
				values: 'opt-in class',
				note: 'Zebra striping. Pass it via class — like Card’s treatment classes, this is a theme look, not a prop.'
			}
		]
	},
	Loading: {
		root: 'hz-loading',
		attrs: [
			{
				name: 'data-intent',
				values: "'primary' | any registered intent",
				note: 'Drives the fill via --hz-loading-fill for every variant/mode (bar, ring, spinner, dots). Spans the intent registry. Default primary — a fill is an accent by nature, unlike Badge/Banner’s neutral default.'
			},
			{
				name: 'data-size',
				values: "'sm' | 'md' | 'lg'",
				note: 'Bar thickness, spinner/ring diameter, and dot size. Default md.'
			},
			{
				name: 'data-variant',
				values: "'bar' | 'spinner' | 'ring' | 'dots'",
				note: 'Default bar. spinner and dots are indeterminate-only — a value passed to either is ignored (dev-warn). ring is the sole home of circular progress: determinate with a value (a static arc), indeterminate without one (a rotating, arc-length-pulsing loader).'
			},
			{
				name: 'data-indeterminate',
				values: 'present when there is no value',
				note: 'Present whenever value is absent/NaN on bar or ring, and always for spinner and dots (both indeterminate-only by construction). :not([data-indeterminate]) selects a determinate form — the linear bar or the (value-bearing) circular ring.'
			}
		],
		props: [
			{
				name: '--hz-loading-fill',
				values: '<color> — default var(--hz-intent-primary)',
				note: 'The filled portion — the bar fill, the ring arc, the spinner stroke, and the dot color — switched per intent.'
			},
			{
				name: '--hz-loading-track',
				values: '<color>',
				note: 'The unfilled track / unfilled ring.'
			},
			{
				name: '--hz-loading-size',
				values: '<length> — defaulted per data-size',
				note: 'Bar thickness for the bar; spinner-glyph / ring diameter for the spinner and ring; dot diameter for dots — each defaulted per data-size.'
			},
			{
				name: '--hz-loading-ring-width',
				values: '<length> — default calc(var(--hz-loading-size) / 8)',
				note: 'The ring’s stroke width (both the determinate static arc and the indeterminate rotating/pulsing arc), scaled off --hz-loading-size so it stays proportional to the ring diameter. Applied with vector-effect: non-scaling-stroke so it stays a true length under the SVG viewBox scale.'
			},
			{
				name: '--hz-loading-speed',
				values: '<time> — default calc(var(--hz-duration-base) * 6) ≈ 2.4s',
				note: 'Base duration of the indeterminate animations: the spinner rotation, the dots cycle, and the indeterminate ring’s rotation + arc-length pulse all run at exactly this; the bar sweep runs at 1.6x it. Anchored to the --hz-duration-* scale rather than a bare token, since that scale is tuned for one-shot transitions, not continuous loops. Under reduced motion the effective duration is slowed (≈2x, ≈4.8s), never zeroed — indeterminate Loading keeps animating (the deliberate exception; contrast Skeleton). The determinate bar/ring are static, so this hook is moot for them.'
			},
			{
				name: '--hz-loading-ease',
				values: '<timing-function> — default var(--hz-ease-standard)',
				note: 'Easing of the dots cycle and the indeterminate ring’s arc-length pulse — both reverse in place rather than travel, so an ease reads cleanly. The spinner spin, the ring’s rotation, and the bar sweep are always linear, independent of this hook — an eased rotation or looping sweep reads as stuttering (it slows to a stop and restarts each cycle).'
			},
			{
				name: '--hz-loading-pulse-width',
				values: '<percentage> — default 150%',
				note: "Width of the indeterminate bar's moving highlight (its “pulse”) as a percentage of the bar's own width. Wider reads softer and more ambient — the peak stays a point at the band center, so a wide value fades gently over a long distance. Values up to ~200% keep the loop seamless. Affects the indeterminate bar only (unrelated to the ring's own arc-length pulse)."
			}
		],
		parts: [
			{
				name: '.hz-loading-bar',
				values: 'the native <progress>',
				note: 'The bar variant’s real progressbar.'
			},
			{
				name: '.hz-loading-value',
				values: 'child element',
				note: 'The formatted readout, present only with showValue on a determinate form (the bar, inline; the ring, centered). Never present on the indeterminate ring.'
			},
			{
				name: '.hz-loading-spinner',
				values: 'child element',
				note: 'The spinner-variant wrapper — role="progressbar" aria-busy="true". Wraps the indeterminate IconLoader glyph. spinner is indeterminate-only; see ring for determinate circular progress.'
			},
			{
				name: '.hz-loading-ring-wrapper',
				values: 'child element',
				note: 'The ring-variant wrapper — role="progressbar". Carries aria-busy="true" around the indeterminate rotating/pulsing arc, or aria-valuemin/max/now (no aria-busy) around the determinate static arc.'
			},
			{
				name: '.hz-loading-ring',
				values: 'child element',
				note: 'The ring’s SVG — a static arc when determinate, a continuously rotating arc-length-pulsing loop when indeterminate. role="img" aria-hidden="true" (the wrapper carries the ARIA).'
			},
			{
				name: '.hz-loading-ring-track',
				values: 'child element',
				note: 'The ring’s unfilled circle.'
			},
			{
				name: '.hz-loading-ring-fill',
				values: 'child element',
				note: 'The ring’s arc circle. stroke-dasharray is a theme hook; for a determinate ring the live stroke-dashoffset fraction is written inline by the component (the Slider-fill precedent), not a documented hook. An indeterminate ring instead animates this circle’s rotation and dash length entirely in the theme.'
			},
			{
				name: '.hz-loading-dots',
				values: 'child element',
				note: 'The ellipsis-loader wrapper — role="progressbar" aria-busy="true". Adds no new custom-property hooks: reuses --hz-loading-fill, --hz-loading-size, --hz-loading-speed, and --hz-loading-ease.'
			},
			{ name: '.hz-loading-dot', values: 'child element', note: 'One of the dots’ three spans.' }
		]
	},
	Skeleton: {
		root: 'hz-skeleton',
		attrs: [
			{
				name: 'data-variant',
				values: "'text' | 'circle' | 'rect' | 'block'",
				note: 'Default text.'
			},
			{
				name: 'data-animation',
				values: "'shimmer' | 'pulse' | 'none'",
				note: 'Default shimmer. Collapses to a static block (same as none) under prefers-reduced-motion: reduce.'
			},
			{
				name: 'data-rounded',
				values: "'none' | 'sm' | 'md' | 'lg' | 'full'",
				note: '1:1 with the --hz-radius-* scale. circle forces full regardless of the rounded prop.'
			}
		],
		props: [
			{
				name: '--hz-skeleton-color',
				values: '<color>',
				note: 'The base block color. Strengthened in dark (the Badge --hz-badge-tint precedent).'
			},
			{
				name: '--hz-skeleton-highlight',
				values: '<color>',
				note: 'The shimmer sweep color.'
			},
			{
				name: '--hz-skeleton-speed',
				values: '<time> — default 1.4s',
				note: 'The shimmer/pulse animation cycle.'
			}
		],
		parts: [
			{
				name: '.hz-skeleton-line',
				values: 'child element',
				note: 'One bar in a multi-line text skeleton (variant="text", lines > 1).'
			}
		]
	}
};

// Not listed above, and deliberately: Skeleton's `width`/`height` (and
// `lastLineWidth`) are per-instance inline styles, not theme hooks — CSS
// cannot compute an arbitrary consumer dimension, the Grid --hz-grid-cols*
// precedent.
