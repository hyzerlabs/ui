/**
 * @hyzer-labs/ui — form error mapping (Form-R11).
 * Reshapes common validation-error payloads — SvelteKit ActionData records and
 * zod's flattened shape — into the FormError[] the Form summary consumes.
 * Pure mapping: no validation, never throws.
 */
import type { FormError } from '$lib/types';

/** zod-flattened shape: `z.flattenError(error)` (v4) / `error.flatten()` (v3). */
interface FlattenedErrors {
	formErrors: string[];
	fieldErrors: Record<string, string[] | undefined>;
}

export type FormErrorsInput =
	| FormError[]
	| Record<string, string | string[] | undefined>
	| FlattenedErrors
	| null
	| undefined;

function isFlattened(input: object): input is FlattenedErrors {
	const candidate = input as Partial<FlattenedErrors>;
	return (
		Array.isArray(candidate.formErrors) &&
		typeof candidate.fieldErrors === 'object' &&
		candidate.fieldErrors !== null
	);
}

/**
 * Map a validation payload to FormError[].
 * - `null`/`undefined` → `[]`
 * - `FormError[]` → passed through unchanged
 * - zod-flattened → one entry per field (first message), then `formErrors`
 *   as form-level entries (`name: ''`)
 * - plain record → one entry per key; `string[]` values use the first message
 */
export function toFormErrors(input: FormErrorsInput): FormError[] {
	if (!input) return [];
	if (Array.isArray(input)) return input;

	const out: FormError[] = [];

	if (isFlattened(input)) {
		for (const [name, messages] of Object.entries(input.fieldErrors)) {
			if (messages && messages.length > 0) out.push({ name, message: messages[0] });
		}
		for (const message of input.formErrors) out.push({ name: '', message });
		return out;
	}

	for (const [name, value] of Object.entries(input)) {
		const message = Array.isArray(value) ? value[0] : value;
		if (message) out.push({ name, message });
	}
	return out;
}
