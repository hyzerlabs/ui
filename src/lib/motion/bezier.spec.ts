import { describe, expect, it } from 'vitest';
import { cubicBezier, parseCubicBezier } from './bezier.js';

/**
 * Motion-R2 — the evaluator's core mathematical contract: f(0) === 0,
 * f(1) === 1, and it matches independently-computed sample points for the
 * library's three curves within ε ≤ 0.001. (A second, browser-driven check
 * in bezier.svelte.spec.ts additionally validates against the real CSS
 * engine's own cubic-bezier() output — this file's spot values were
 * computed by an independent bisection solve, not this module's own code,
 * so a shared algorithmic bug in both wouldn't hide here either.)
 */
describe('cubicBezier (R2)', () => {
	it('f(0) === 0 and f(1) === 1 for every curve', () => {
		for (const [x1, y1, x2, y2] of [
			[0.2, 0, 0, 1],
			[0.4, 0, 1, 1],
			[0, 0, 0.2, 1]
		] as const) {
			const ease = cubicBezier(x1, y1, x2, y2);
			expect(ease(0)).toBeCloseTo(0, 6);
			expect(ease(1)).toBeCloseTo(1, 6);
		}
	});

	it('clamps outside [0, 1] rather than extrapolating', () => {
		const ease = cubicBezier(0.2, 0, 0, 1);
		expect(ease(-0.5)).toBe(0);
		expect(ease(1.5)).toBe(1);
	});

	it('the linear shortcut (x1 === y1 && x2 === y2) is the identity function', () => {
		const linear = cubicBezier(0.3, 0.3, 0.7, 0.7);
		for (const x of [0, 0.1, 0.42, 0.5, 0.83, 1]) {
			expect(linear(x)).toBeCloseTo(x, 9);
		}
	});

	it('rejects x1/x2 outside [0, 1] (an invalid CSS timing function)', () => {
		expect(() => cubicBezier(1.5, 0, 0, 1)).toThrow();
		expect(() => cubicBezier(0.2, 0, -0.5, 1)).toThrow();
	});

	// Motion-R2: sample points, ε ≤ 0.001 — reference values from an
	// independent bisection solve (see module doc above), not this file's
	// own cubicBezier.
	it('matches independently-computed samples of --hz-ease-standard (cubic-bezier(0.2, 0, 0, 1))', () => {
		const ease = cubicBezier(0.2, 0, 0, 1);
		const samples: [number, number][] = [
			[0.1, 0.15625],
			[0.25, 0.60722],
			[0.5, 0.877834],
			[0.75, 0.97548],
			[0.9, 0.996459]
		];
		for (const [x, expected] of samples) {
			expect(Math.abs(ease(x) - expected)).toBeLessThanOrEqual(0.001);
		}
	});

	it('matches independently-computed samples of --hz-ease-in (cubic-bezier(0.4, 0, 1, 1))', () => {
		const ease = cubicBezier(0.4, 0, 1, 1);
		const samples: [number, number][] = [
			[0.1, 0.018373],
			[0.25, 0.098627],
			[0.5, 0.324815],
			[0.75, 0.630085],
			[0.9, 0.84375]
		];
		for (const [x, expected] of samples) {
			expect(Math.abs(ease(x) - expected)).toBeLessThanOrEqual(0.001);
		}
	});

	it('matches independently-computed samples of --hz-ease-out (cubic-bezier(0, 0, 0.2, 1))', () => {
		const ease = cubicBezier(0, 0, 0.2, 1);
		const samples: [number, number][] = [
			[0.1, 0.303848],
			[0.25, 0.577573],
			[0.5, 0.839245],
			[0.75, 0.964216],
			[0.9, 0.994601]
		];
		for (const [x, expected] of samples) {
			expect(Math.abs(ease(x) - expected)).toBeLessThanOrEqual(0.001);
		}
	});
});

describe('parseCubicBezier (R2)', () => {
	it('parses the four control-point numbers out of a cubic-bezier() string', () => {
		expect(parseCubicBezier('cubic-bezier(0.2, 0, 0, 1)')).toEqual([0.2, 0, 0, 1]);
		expect(parseCubicBezier('cubic-bezier(0.4,0,1,1)')).toEqual([0.4, 0, 1, 1]);
	});

	it('handles negative control-point coordinates (valid for y1/y2, e.g. a slight overshoot)', () => {
		expect(parseCubicBezier('cubic-bezier(0.34, -0.5, 0.64, 1.2)')).toEqual([
			0.34, -0.5, 0.64, 1.2
		]);
	});

	it('throws on a non-cubic-bezier string', () => {
		expect(() => parseCubicBezier('ease-in-out')).toThrow();
		expect(() => parseCubicBezier('linear')).toThrow();
	});
});
