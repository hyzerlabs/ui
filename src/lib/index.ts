/**
 * @hyzer-labs/ui — components barrel (the "." export entry).
 * Re-exports all public components from src/lib/components/, plus the
 * form error mapping helper and the WCAG contrast utilities
 * (also available from ./utils).
 */
export * from './components/index.js';
/**
 * The intent vocabulary. Re-exported for convenience — but note that
 * AUGMENTING IntentRegistry must target the declaring module
 * (`@hyzer-labs/ui/types`), since TypeScript merges an interface only into
 * the module that declares it, not one that re-exports it.
 */
export type { Intent, IntentRegistry } from './types/index.js';
export { toFormErrors, type FormErrorsInput } from './utils/form.js';
export { lightboxGroup } from './attachments/lightboxGroup.js';
export { theme } from './attachments/theme.js';
export { tooltip } from './attachments/tooltip.js';
export {
	hexToRgb,
	rgbToHex,
	mixSrgb,
	relativeLuminance,
	contrastRatio,
	gradeContrast,
	bestLevel,
	bestLevelLarge,
	type Rgb,
	type ContrastGrade,
	type ContrastLevel,
	type LargeContrastLevel
} from './utils/contrast.js';
