/**
 * @hyzer-labs/ui — components barrel (the "." export entry).
 * Re-exports all public components from src/lib/components/, plus the
 * form error mapping helper (Form-R11) and the WCAG contrast utilities
 * (also available from ./utils).
 */
export * from './components/index.js';
export { toFormErrors, type FormErrorsInput } from './utils/form.js';
export { lightboxGroup } from './attachments/lightboxGroup.js';
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
