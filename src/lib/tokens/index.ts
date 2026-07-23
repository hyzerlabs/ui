/**
 * @hyzer-labs/ui design token metadata (JS).
 * Each exported object mirrors a group in tokens.css.
 * Keys are camelCase; CSS var names follow --hz-<group>-<key> convention.
 * No window/DOM access — SSR-safe.
 *
 * R7: typed metadata exported alongside tokens.css so tooling and docs
 *     can read token values without parsing CSS.
 */

/** The CSS custom-property prefix used by every token. */
export const prefix = '--hz' as const;

// ---------------------------------------------------------------------------
// Palette — Layer 1: raw hues, single value each, no ramps (specs/42 R1).
// ---------------------------------------------------------------------------

export const palette = {
	// Status hues tuned 2026-07-14: every intent color ≥ 4.5:1 as text on
	// both light surfaces.
	primary: '#2563eb',
	secondary: '#7c3aed',
	success: '#15803d',
	warning: '#b45309',
	danger: '#b91c1c',
	info: '#0e7490',
	black: '#000000',
	white: '#ffffff',
	gray: '#6b7280',

	// Dark-theme companion map (R5, revised 2026-07-15; moved to the palette
	// tier by specs/42 R1) — the two-tier rule: dark mode is authored
	// ENTIRELY at this layer. Every hue lightens to a companion that keeps
	// WCAG AA (≥ 4.5:1) as text on both dark surfaces. Roles and intents are
	// pure var() chains in both modes, so all of Layer 2 follows
	// automatically — text-muted and border track gray, the intents track
	// their hues, and the reference theme paints solid intent text with
	// --hz-color-surface so solids flip too.
	theme: {
		dark: {
			primary: '#60a5fa',
			secondary: '#a78bfa',
			danger: '#f87171',
			warning: '#fbbf24',
			success: '#4ade80',
			info: '#22d3ee',
			gray: '#9ca3af'
		}
	}
} as const;

// ---------------------------------------------------------------------------
// Color — Layer 2: semantic roles (specs/42 R1). Structural roles reference
// the palette namespace via var(); `black`/`white` are mode-invariant alias
// roles (absolute anchors for hover-darkening mixes and on-media controls)
// that deliberately carry no dark override.
// ---------------------------------------------------------------------------

export const color = {
	surface: 'var(--hz-palette-white)',
	surfaceMuted: 'color-mix(in srgb, var(--hz-palette-gray) 6%, var(--hz-color-surface))',
	text: 'var(--hz-palette-black)',
	textMuted: 'var(--hz-palette-gray)',
	border: 'var(--hz-palette-gray)',
	black: 'var(--hz-palette-black)',
	white: 'var(--hz-palette-white)',

	// Dark-theme override map (R5, revised 2026-07-15) — role-tier only.
	// black/white deliberately do NOT appear here: they are mode-invariant
	// absolute anchors.
	theme: {
		dark: {
			surface: 'var(--hz-palette-black)',
			surfaceMuted: 'color-mix(in srgb, var(--hz-palette-gray) 25%, var(--hz-color-surface))',
			text: 'var(--hz-palette-white)'
		}
	}
} as const;

// ---------------------------------------------------------------------------
// Intent roles — the component-facing intent vocabulary (--hz-intent-*).
// A pure indirection surface in BOTH modes: every intent chains through the
// palette, so palette overrides (including the dark companions above) flow
// through automatically. Override an entry to remap one intent to a
// different hue without touching the palette, or add new category tokens
// (--hz-intent-foo) the same way.
// ---------------------------------------------------------------------------

export const intent = {
	neutral: 'var(--hz-palette-gray)',
	primary: 'var(--hz-palette-primary)',
	secondary: 'var(--hz-palette-secondary)',
	danger: 'var(--hz-palette-danger)',
	warning: 'var(--hz-palette-warning)',
	success: 'var(--hz-palette-success)',
	info: 'var(--hz-palette-info)'
} as const;

// ---------------------------------------------------------------------------
// Spacing (R1 — matches component fallbacks exactly)
// ---------------------------------------------------------------------------

export const space = {
	none: '0',
	xs: '0.5rem',
	sm: '1rem',
	md: '2rem',
	lg: '4rem',
	xl: '8rem'
} as const;

// ---------------------------------------------------------------------------
// Density spacing — mirrors the density block in tokens.css.
// Two distances (--hz-space-near / --hz-space-away) derive from one
// --hz-density grid unit; each data-density-shift ancestor drops the
// multipliers one level. Adapted from "Complementary Space":
// https://blog.damato.design/posts/complementary-space/
// ---------------------------------------------------------------------------

export const density = {
	unit: '0.4rem',
	/** Multipliers of --hz-density per data-density-shift nesting depth. */
	levels: [
		{ near: 10, away: 20 },
		{ near: 5, away: 10 },
		{ near: 2, away: 5 },
		{ near: 1, away: 2 }
	]
} as const;

// ---------------------------------------------------------------------------
// Sizing / width (R1 — matches component fallbacks exactly)
// ---------------------------------------------------------------------------

export const width = {
	sm: '640px',
	md: '968px',
	lg: '1200px',
	xl: '1440px',
	full: '100%'
} as const;

// ---------------------------------------------------------------------------
// Typography — six font-size steps (R6)
// ---------------------------------------------------------------------------

export const typography = {
	fontSize: {
		sm: '0.875rem',
		base: '1rem',
		lg: '1.4rem',
		xl: '1.65rem',
		'2xl': '2.75rem',
		'3xl': '3.5rem'
	},
	fontFamily: {
		sans: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
		serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
		mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
	},
	fontWeight: {
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700'
	},
	lineHeight: {
		tight: '1.2',
		base: '1.5',
		loose: '1.75'
	}
} as const;

// ---------------------------------------------------------------------------
// Radius (R6)
// ---------------------------------------------------------------------------

export const radius = {
	none: '0',
	sm: '0.25rem',
	md: '0.5rem',
	lg: '1rem',
	full: '9999px'
} as const;

// ---------------------------------------------------------------------------
// Border width (R6)
// ---------------------------------------------------------------------------

export const border = {
	width: {
		thin: '1px',
		thick: '2px'
	}
} as const;

// ---------------------------------------------------------------------------
// Elevation / shadows (R6)
// ---------------------------------------------------------------------------

// Rescaled bolder 2026-07-22 (user decision, audit): the old sm was barely
// perceptible in either mode, so the scale shifted up — old md → sm, old
// lg → md, and lg is a new step: the md-family halo geometry grown and at
// nearly double the intensity.
export const shadow = {
	sm: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
	lg: '0 20px 25px -5px rgb(0 0 0 / 0.18), 0 8px 10px -6px rgb(0 0 0 / 0.18)'
} as const;

// ---------------------------------------------------------------------------
// Z-index (R6, revised Banner-R13 — specs/41)
// ---------------------------------------------------------------------------

// `toast` retired 2026-07-23 (Banner-R13): no Toast component ships, so the
// tier was dead. `raised` and `sticky` are new: `raised` covers small local
// layering (a bg/content pair, a sticky table cell), `sticky` is the global
// tier a pinned Header/Banner sits at. `popover` covers a floating menu that
// must clear sticky chrome (Nav's dropdown panel) — distinct from the
// in-flow `dropdown` tier Combobox/Dropdown popups already use.
export const zIndex = {
	base: '0',
	raised: '1',
	dropdown: '10',
	sticky: '100',
	popover: '200',
	overlay: '1000',
	modal: '1100'
} as const;

// ---------------------------------------------------------------------------
// Motion (R6)
// ---------------------------------------------------------------------------

export const motion = {
	// Durations bumped 2026-07-22 (user decision, audit): the old scale read
	// too abrupt — every step moved up ~100–150ms.
	duration: {
		fast: '250ms',
		base: '400ms',
		slow: '550ms'
	},
	ease: {
		standard: 'cubic-bezier(0.2, 0, 0, 1)',
		in: 'cubic-bezier(0.4, 0, 1, 1)',
		out: 'cubic-bezier(0, 0, 0.2, 1)'
	}
} as const;
