/**
 * The full-reference `hyzer.config.ts` — the complete option surface
 * (src/lib/config/schema.ts) with every group commented out, so it is a
 * valid, empty config exactly as written (`defineConfig({})`); uncommenting
 * any one line, or all of them, stays valid too (verified against
 * resolveConfig). One source of truth for `hyzer init` and the docs
 * Config & CLI page.
 */
export const CONFIG_TEMPLATE = `import { defineConfig } from '@hyzer-labs/ui/config';

export default defineConfig({
	// output: 'src/styles/tokens.css', // where \`hyzer generate\` writes the sheet

	// tokens: {                            // the DEFAULT theme (the :root block)
	// 	palette: {                          // raw hues (--hz-palette-*); ramps welcome
	// 		primary: '#0f766e',
	// 		brandRed: { 500: '#ef4444', 900: '#7f1d1d' }
	// 	},
	// 	color: { border: '#94a3b8' },       // structural role tokens (--hz-color-*)
	// 	intent: { fairway: 'var(--hz-palette-primary)' }, // remap or add intents (--hz-intent-*)
	// 	space: { xs: '0.375rem' },          // the fixed margin/gap scale (--hz-space-*)
	// 	width: { md: '960px' },             // layout max-widths (--hz-width-*)
	// 	typography: {
	// 		fontSize: { base: '1.05rem' },    // --hz-font-size-*
	// 		fontFamily: { sans: "'Inter', system-ui, sans-serif" }, // --hz-font-family-*
	// 		fontWeight: { semibold: '650' },  // --hz-font-weight-*
	// 		lineHeight: { base: '1.6' }       // --hz-line-height-*
	// 	},
	// 	radius: { md: '0.625rem' },         // corner radii (--hz-radius-*)
	// 	border: { width: { thin: '1.5px' } }, // border widths (--hz-border-width-*)
	// 	shadow: { md: '0 10px 15px -3px rgb(0 0 0 / 0.15)' }, // elevation (--hz-shadow-*)
	// 	zIndex: { modal: '1200' },          // stacking order (--hz-z-*)
	// 	motion: {
	// 		duration: { base: '350ms' },      // --hz-duration-*
	// 		ease: { standard: 'ease-out' }    // --hz-ease-*
	// 	},
	// 	density: { unit: '0.5rem' }         // the --hz-density grid unit (near/away cascade)
	// },

	// themes: {                            // variants that override the default,
	//                                     // one block per data-theme="<name>"
	// 	dark: {                            // [data-theme="dark"]
	// 		palette: { primary: '#2dd4bf' },  // hue overrides for dark
	// 		color: { surface: '#020617' },    // role overrides for dark
	// 		intent: { fairway: '#a3e635' }    // intent remaps for dark only
	// 	},
	// 	ocean: { palette: { primary: '#0ea5e9' } } // any name you like
	// },

	// icons: ['plus', 'trash-2', 'settings'], // trims the generated icons.ts barrel

	// utilities: true // opt in to hyzer-utilities.css (or { output: 'styles/hyzer-utilities.css' })
});
`;
