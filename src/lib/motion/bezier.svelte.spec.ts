import { describe, expect, it, afterEach } from 'vitest';
import { cubicBezier } from './bezier.js';
import { easingCss } from './tokens.js';

/**
 * Motion-R2 — validates the JS evaluator against the real CSS engine's own
 * cubic-bezier() output: a WAAPI animation is paused and scrubbed to known
 * `currentTime` fractions, and the browser-computed style at each point is
 * compared to `cubicBezier(...)`'s output for the same curve. This is the
 * browser doing the reference math, not a second copy of this module's own
 * algorithm.
 */

function makeEl(): HTMLDivElement {
	const el = document.createElement('div');
	el.style.position = 'absolute';
	el.style.opacity = '0';
	document.body.appendChild(el);
	return el;
}

afterEach(() => {
	document.querySelectorAll('[data-bezier-spec]').forEach((el) => el.remove());
});

async function sample(cssEasing: string, duration: number, atMs: number): Promise<number> {
	const el = makeEl();
	el.setAttribute('data-bezier-spec', '');
	const animation = el.animate([{ opacity: 0 }, { opacity: 1 }], {
		duration,
		easing: cssEasing,
		fill: 'both'
	});
	animation.pause();
	animation.currentTime = atMs;
	// Let the pause + scrub commit before reading computed style.
	await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
	const value = Number(getComputedStyle(el).opacity);
	animation.cancel();
	return value;
}

describe('cubicBezier matches the browser CSS engine (R2)', () => {
	const DURATION = 1000;
	const fractions = [0.1, 0.25, 0.5, 0.75, 0.9];

	it('--hz-ease-standard', async () => {
		const [x1, y1, x2, y2] = [0.2, 0, 0, 1];
		const ease = cubicBezier(x1, y1, x2, y2);
		for (const x of fractions) {
			const browserY = await sample(easingCss.standard, DURATION, x * DURATION);
			expect(Math.abs(ease(x) - browserY)).toBeLessThanOrEqual(0.001);
		}
	});

	it('--hz-ease-in', async () => {
		const [x1, y1, x2, y2] = [0.4, 0, 1, 1];
		const ease = cubicBezier(x1, y1, x2, y2);
		for (const x of fractions) {
			const browserY = await sample(easingCss.in, DURATION, x * DURATION);
			expect(Math.abs(ease(x) - browserY)).toBeLessThanOrEqual(0.001);
		}
	});

	it('--hz-ease-out', async () => {
		const [x1, y1, x2, y2] = [0, 0, 0.2, 1];
		const ease = cubicBezier(x1, y1, x2, y2);
		for (const x of fractions) {
			const browserY = await sample(easingCss.out, DURATION, x * DURATION);
			expect(Math.abs(ease(x) - browserY)).toBeLessThanOrEqual(0.001);
		}
	});
});
