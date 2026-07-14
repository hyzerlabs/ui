import { describe, expect, it } from 'vitest';
import type { FormError } from '$lib/types';
import { toFormErrors } from './form.js';

describe('Form-R11 — toFormErrors', () => {
	it('null/undefined → []', () => {
		expect(toFormErrors(null)).toEqual([]);
		expect(toFormErrors(undefined)).toEqual([]);
	});

	it('FormError[] passes through unchanged', () => {
		const errors: FormError[] = [{ name: 'email', message: 'Bad email' }];
		expect(toFormErrors(errors)).toBe(errors);
	});

	it('zod-flattened shape → field entries (first message) then form-level entries', () => {
		const flattened = {
			formErrors: ['Signups are closed.'],
			fieldErrors: {
				player: ['Enter your name.', 'Too short.'],
				email: ['Enter a valid email address.'],
				skipped: undefined,
				empty: [] as string[]
			}
		};
		expect(toFormErrors(flattened)).toEqual([
			{ name: 'player', message: 'Enter your name.' },
			{ name: 'email', message: 'Enter a valid email address.' },
			{ name: '', message: 'Signups are closed.' }
		]);
	});

	it('plain record: string, string[], and undefined values', () => {
		expect(
			toFormErrors({
				player: 'Enter your name.',
				email: ['Bad email', 'second message'],
				missing: undefined
			})
		).toEqual([
			{ name: 'player', message: 'Enter your name.' },
			{ name: 'email', message: 'Bad email' }
		]);
	});

	it('empty record → []', () => {
		expect(toFormErrors({})).toEqual([]);
	});

	it('is exported from the package root ($lib)', async () => {
		const mod = await import('$lib');
		expect(mod.toFormErrors).toBe(toFormErrors);
	});
});
