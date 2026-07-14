/**
 * @hyzer-labs/ui — components barrel (the "." export entry).
 * Re-exports all public components from src/lib/components/, plus the
 * form error mapping helper (Form-R11).
 */
export * from './components/index.js';
export { toFormErrors, type FormErrorsInput } from './utils/form.js';
