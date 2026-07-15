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
// Color — two-layer model (R3, R4, R5)
// ---------------------------------------------------------------------------

export const color = {
	// Layer 1 — Palette (single value each, no ramps). Status hues tuned
	// 2026-07-14: every intent color ≥ 4.5:1 as text on both light surfaces.
	primary: '#2563eb',
	secondary: '#7c3aed',
	success: '#15803d',
	warning: '#b45309',
	danger: '#b91c1c',
	info: '#0e7490',
	black: '#000000',
	white: '#ffffff',
	gray: '#6b7280',

	// Layer 2 — Semantic roles (indirection via var())
	surface: 'var(--hz-color-white)',
	surfaceMuted: 'color-mix(in srgb, var(--hz-color-gray) 6%, var(--hz-color-surface))',
	text: 'var(--hz-color-black)',
	textMuted: 'var(--hz-color-gray)',
	border: 'var(--hz-color-gray)',

	// Dark-theme override map (R5) — surface/text flip; surface-muted's
	// tint strengthens so it stays visible over black; text-muted and the
	// palette status hues lighten so colored text keeps WCAG AA on both
	// dark surfaces. The brand hues (primary/secondary) never change —
	// their intent roles retarget instead (see `intentDark`).
	theme: {
		dark: {
			surface: 'var(--hz-color-black)',
			surfaceMuted: 'color-mix(in srgb, var(--hz-color-gray) 25%, var(--hz-color-surface))',
			text: 'var(--hz-color-white)',
			textMuted: '#9ca3af',
			danger: '#f87171',
			warning: '#fbbf24',
			success: '#4ade80',
			info: '#22d3ee'
		}
	}
} as const;

// ---------------------------------------------------------------------------
// Intent roles — the component-facing intent vocabulary (--hz-intent-*).
// Same indirection pattern as the semantic roles: override these to
// retarget status colors specifically; override the palette and they follow.
// ---------------------------------------------------------------------------

export const intent = {
	neutral: 'var(--hz-color-gray)',
	primary: 'var(--hz-color-primary)',
	secondary: 'var(--hz-color-secondary)',
	danger: 'var(--hz-color-danger)',
	warning: 'var(--hz-color-warning)',
	success: 'var(--hz-color-success)',
	info: 'var(--hz-color-info)'
} as const;

/**
 * What each intent role RESOLVES to in dark mode (2026-07-14) — every value
 * passes WCAG AA (≥ 4.5:1) as text on both dark surfaces. `danger`/`warning`/
 * `success`/`info` chain through the dark palette overrides in
 * `color.theme.dark`; `neutral`/`primary`/`secondary` are authored intent
 * overrides in the `[data-theme="dark"]` block, because the brand palette
 * hues are constants that never change. Solid on-color flips with the mode:
 * the reference theme paints solid intent text with `--hz-color-surface`.
 */
export const intentDark = {
	neutral: '#9ca3af',
	primary: '#60a5fa',
	secondary: '#a78bfa',
	danger: '#f87171',
	warning: '#fbbf24',
	success: '#4ade80',
	info: '#22d3ee'
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

export const shadow = {
	sm: '0 1px 2px rgb(0 0 0 / 0.05)',
	md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
} as const;

// ---------------------------------------------------------------------------
// Z-index (R6)
// ---------------------------------------------------------------------------

export const zIndex = {
	base: '0',
	dropdown: '10',
	overlay: '1000',
	modal: '1100',
	toast: '1200'
} as const;

// ---------------------------------------------------------------------------
// Motion (R6)
// ---------------------------------------------------------------------------

export const motion = {
	duration: {
		fast: '150ms',
		base: '250ms',
		slow: '400ms'
	},
	ease: {
		standard: 'cubic-bezier(0.2, 0, 0, 1)',
		in: 'cubic-bezier(0.4, 0, 1, 1)',
		out: 'cubic-bezier(0, 0, 0.2, 1)'
	}
} as const;
