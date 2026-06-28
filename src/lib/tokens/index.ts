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
	// Layer 1 — Palette (single value each, no ramps)
	primary: '#2563eb',
	secondary: '#7c3aed',
	success: '#16a34a',
	warning: '#d97706',
	error: '#dc2626',
	info: '#0891b2',
	black: '#000000',
	white: '#ffffff',
	gray: '#6b7280',

	// Layer 2 — Semantic roles (indirection via var())
	surface: 'var(--hz-color-white)',
	text: 'var(--hz-color-black)',
	textMuted: 'var(--hz-color-gray)',
	border: 'var(--hz-color-gray)',

	// Dark-theme override map — only surface and text flip (R5)
	theme: {
		dark: {
			surface: 'var(--hz-color-black)',
			text: 'var(--hz-color-white)'
		}
	}
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
// Typography — five font-size steps (R6)
// ---------------------------------------------------------------------------

export const typography = {
	fontSize: {
		sm: '0.875rem',
		base: '1rem',
		lg: '1.4rem',
		xl: '1.65rem',
		'2xl': '2.75rem'
	},
	fontFamily: {
		sans: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
		mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
	},
	fontWeight: {
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700'
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
	modal: '1100'
} as const;
