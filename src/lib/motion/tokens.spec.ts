import { describe, expect, it } from 'vitest';
import { motion } from '../tokens/index.js';
import { durations, easingCss, easeStandard, easeIn, easeOut } from './tokens.js';
import { cubicBezier, parseCubicBezier } from './bezier.js';

/**
 * Motion-R2 — parity spec: `durations` and `easingCss` are *derived from*
 * `$lib/tokens`'s `motion` metadata at import time, not hand-copied
 * constants — this fails the moment the two diverge, whichever one
 * changes.
 */
describe('durations mirrors $lib/tokens motion.duration (R2 parity)', () => {
	it('every duration equals the token metadata, parsed to a ms number', () => {
		expect(durations.fast).toBe(Number.parseFloat(motion.duration.fast));
		expect(durations.base).toBe(Number.parseFloat(motion.duration.base));
		expect(durations.slow).toBe(Number.parseFloat(motion.duration.slow));
	});

	it('matches the spec-documented values (specs/39 R2)', () => {
		expect(durations).toEqual({ fast: 250, base: 400, slow: 550 });
	});
});

describe('easingCss mirrors $lib/tokens motion.ease (R2 parity)', () => {
	it('every CSS easing string is the exact token metadata string', () => {
		expect(easingCss.standard).toBe(motion.ease.standard);
		expect(easingCss.in).toBe(motion.ease.in);
		expect(easingCss.out).toBe(motion.ease.out);
	});
});

describe('easeStandard/easeIn/easeOut are built from the same token strings (R2 parity)', () => {
	it('each evaluator matches a fresh cubicBezier() built from the parsed token string', () => {
		const cases: [(t: number) => number, string][] = [
			[easeStandard, motion.ease.standard],
			[easeIn, motion.ease.in],
			[easeOut, motion.ease.out]
		];
		for (const [evaluator, cssString] of cases) {
			const reference = cubicBezier(...parseCubicBezier(cssString));
			for (const x of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
				expect(evaluator(x)).toBeCloseTo(reference(x), 9);
			}
		}
	});

	it('f(0) === 0 and f(1) === 1 for every mirror (R2)', () => {
		for (const evaluator of [easeStandard, easeIn, easeOut]) {
			expect(evaluator(0)).toBeCloseTo(0, 6);
			expect(evaluator(1)).toBeCloseTo(1, 6);
		}
	});
});
