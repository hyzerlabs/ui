/**
 * GENERATED FILE - do not edit by hand. Run `pnpm gen:tokens`
 * (scripts/gen-config-defaults.ts renders this from src/lib/tokens/index.ts).
 *
 * The two commented, defaults-only blocks config-template.js splices into
 * the full-reference hyzer.config.ts: every default value tokens.css and
 * its dark block declare, one group per line comment, no per-token prose.
 */

export const CONFIG_TOKEN_DEFAULTS = `	// tokens: {
	// 	palette: {  // raw hues (--hz-palette-*); single values or ramps
	// 		primary: '#2563eb',
	// 		secondary: '#7c3aed',
	// 		success: '#15803d',
	// 		warning: '#b45309',
	// 		danger: '#b91c1c',
	// 		info: '#0e7490',
	// 		black: '#000000',
	// 		white: '#ffffff',
	// 		gray: '#6b7280'
	// 	},
	// 	color: {  // role colors (--hz-color-*)
	// 		surface: 'var(--hz-palette-white)',
	// 		surfaceMuted: 'color-mix(in srgb, var(--hz-palette-gray) 6%, var(--hz-color-surface))',
	// 		text: 'var(--hz-palette-black)',
	// 		textMuted: 'var(--hz-palette-gray)',
	// 		border: 'var(--hz-palette-gray)',
	// 		black: 'var(--hz-palette-black)',
	// 		white: 'var(--hz-palette-white)'
	// 	},
	// 	intent: {  // remap or add intents (--hz-intent-*)
	// 		neutral: 'var(--hz-palette-gray)',
	// 		primary: 'var(--hz-palette-primary)',
	// 		secondary: 'var(--hz-palette-secondary)',
	// 		danger: 'var(--hz-palette-danger)',
	// 		warning: 'var(--hz-palette-warning)',
	// 		success: 'var(--hz-palette-success)',
	// 		info: 'var(--hz-palette-info)'
	// 	},
	// 	typography: {  // the type scale; each group below names the tokens it drives
	// 		fontSize: {  // --hz-font-size-*
	// 			sm: '0.875rem',
	// 			base: '1rem',
	// 			lg: '1.4rem',
	// 			xl: '1.65rem',
	// 			'2xl': '2.75rem',
	// 			'3xl': '3.5rem'
	// 		},
	// 		fontFamily: {  // --hz-font-family-*
	// 			sans: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
	// 			serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
	// 			mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
	// 		},
	// 		fontWeight: {  // --hz-font-weight-*
	// 			normal: '400',
	// 			medium: '500',
	// 			semibold: '600',
	// 			bold: '700'
	// 		},
	// 		lineHeight: {  // --hz-line-height-*
	// 			tight: '1.2',
	// 			base: '1.5',
	// 			loose: '1.75'
	// 		}
	// 	},
	// 	space: {  // the fixed margin/gap scale (--hz-space-*)
	// 		none: '0',
	// 		xs: '0.5rem',
	// 		sm: '1rem',
	// 		md: '2rem',
	// 		lg: '4rem',
	// 		xl: '8rem'
	// 	},
	// 	density: {  // the --hz-density grid unit, plus a fallback for each ladder rung
	// 		unit: '0.4rem',
	// 		ladder: {  // --hz-density-ladder-depth-1..4; these are fallbacks, so a rung you declare in CSS wins
	// 			depth1: 'calc(var(--hz-density) * 10)',
	// 			depth2: 'calc(var(--hz-density) * 5)',
	// 			depth3: 'calc(var(--hz-density) * 2)',
	// 			depth4: 'calc(var(--hz-density) * 1)'
	// 		}
	// 	},
	// 	width: {  // layout max-widths (--hz-width-*)
	// 		sm: '640px',
	// 		md: '968px',
	// 		lg: '1200px',
	// 		xl: '1440px',
	// 		full: '100%'
	// 	},
	// 	radius: {  // corner radii (--hz-radius-*)
	// 		none: '0',
	// 		sm: '0.25rem',
	// 		md: '0.5rem',
	// 		lg: '1rem',
	// 		full: '9999px'
	// 	},
	// 	border: {  // border widths (--hz-border-width-*)
	// 		width: {
	// 			thin: '1px',
	// 			thick: '2px',
	// 			heavy: '6px'
	// 		}
	// 	},
	// 	shadow: {  // elevation (--hz-shadow-*)
	// 		sm: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	// 		md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
	// 		lg: '0 20px 25px -5px rgb(0 0 0 / 0.18), 0 8px 10px -6px rgb(0 0 0 / 0.18)'
	// 	},
	// 	zIndex: {  // stacking order (--hz-z-*)
	// 		base: '0',
	// 		raised: '1',
	// 		dropdown: '10',
	// 		sticky: '100',
	// 		tooltip: '150',
	// 		popover: '200',
	// 		overlay: '1000',
	// 		modal: '1100'
	// 	},
	// 	motion: {  // duration and easing (--hz-duration-*, --hz-ease-*)
	// 		duration: {  // --hz-duration-*
	// 			fast: '250ms',
	// 			base: '400ms',
	// 			slow: '550ms'
	// 		},
	// 		ease: {  // --hz-ease-*
	// 			standard: 'cubic-bezier(0.2, 0, 0, 1)',
	// 			in: 'cubic-bezier(0.4, 0, 1, 1)',
	// 			out: 'cubic-bezier(0, 0, 0.2, 1)'
	// 		}
	// 	},
	// 	// components: { buttonAccent: 'var(--hz-intent-secondary)', badgeTint: '20%' },
	// 	// Per-component hooks, camelCased, with no --hz- prefix. They have
	// 	// no defaults, so none are listed above. Full list:
	// 	// https://design.hyzer.sh/docs/theming/components
	// },`;

export const CONFIG_DARK_DEFAULTS = `	// themes: {
	// 	dark: {  // [data-theme="dark"]
	// 		palette: {  // --hz-palette-*
	// 			primary: '#60a5fa',
	// 			secondary: '#a78bfa',
	// 			danger: '#f87171',
	// 			warning: '#fbbf24',
	// 			success: '#4ade80',
	// 			info: '#22d3ee',
	// 			gray: '#9ca3af'
	// 		},
	// 		color: {  // --hz-color-*
	// 			surface: 'var(--hz-palette-black)',
	// 			surfaceMuted: 'color-mix(in srgb, var(--hz-palette-gray) 25%, var(--hz-color-surface))',
	// 			text: 'var(--hz-palette-white)'
	// 		}
	// 	},
	// },`;
