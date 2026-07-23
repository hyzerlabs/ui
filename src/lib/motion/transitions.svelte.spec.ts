import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Motion-R3 — transitions call `svelte/transition`'s originals underneath
 * (which read `getComputedStyle`), so this file needs a real DOM — it runs
 * in the browser ('client') Vitest project, unlike the plain-Node
 * `.spec.ts` files elsewhere in this module.
 *
 * `svelte/motion` is mocked so `prefersReducedMotion.current` is a plain,
 * test-controlled boolean rather than a real (and here, un-toggleable)
 * `matchMedia` query — this is what lets a single test flip the OS
 * preference mid-session and assert the *next* call honors it.
 */
const motionState = { current: false };
vi.mock('svelte/motion', () => ({
	prefersReducedMotion: motionState
}));

const { fade, fly, slide, scale, durations, easeStandard, easeOut } = await import('$lib/motion');

function makeEl(): HTMLDivElement {
	const el = document.createElement('div');
	el.style.opacity = '1';
	document.body.appendChild(el);
	return el;
}

afterEach(() => {
	motionState.current = false;
	document.querySelectorAll('[data-transitions-spec]').forEach((el) => el.remove());
});

describe('defaults (R3)', () => {
	it('fade defaults to durations.fast and easeStandard', () => {
		const el = makeEl();
		const config = fade(el, {});
		expect(config.duration).toBe(durations.fast);
		expect(config.easing).toBe(easeStandard);
	});

	it('fly, slide, and scale default to durations.base', () => {
		const el = makeEl();
		expect(fly(el, {}).duration).toBe(durations.base);
		expect(slide(el, {}).duration).toBe(durations.base);
		expect(scale(el, {}).duration).toBe(durations.base);
	});

	it('fly and scale default to easeOut ("enter-ish" — a directional/spatial displacement)', () => {
		const el = makeEl();
		expect(fly(el, {}).easing).toBe(easeOut);
		expect(scale(el, {}).easing).toBe(easeOut);
	});

	it('slide defaults to easeStandard (a mechanical height/width reveal, not a spatial entrance)', () => {
		const el = makeEl();
		expect(slide(el, {}).easing).toBe(easeStandard);
	});
});

describe('override passthrough (R3)', () => {
	it('every param is overridable — duration, easing, and the transition-specific ones', () => {
		const el = makeEl();
		const customEasing = (t: number) => t;
		const fadeConfig = fade(el, { duration: 999, easing: customEasing });
		expect(fadeConfig.duration).toBe(999);
		expect(fadeConfig.easing).toBe(customEasing);

		const flyConfig = fly(el, { x: 40, y: -10, duration: 500 });
		expect(flyConfig.duration).toBe(500);

		const slideConfig = slide(el, { axis: 'x' });
		expect(slideConfig).toBeTruthy();

		const scaleConfig = scale(el, { start: 0.5, opacity: 0.2 });
		expect(scaleConfig).toBeTruthy();
	});
});

describe('reduced-motion collapse + essential opt-out (R3)', () => {
	it('collapses duration to 0 under reduced motion', () => {
		motionState.current = true;
		const el = makeEl();
		expect(fade(el, {}).duration).toBe(0);
		expect(fly(el, {}).duration).toBe(0);
		expect(slide(el, {}).duration).toBe(0);
		expect(scale(el, {}).duration).toBe(0);
	});

	it('essential: true plays the full duration even under reduced motion', () => {
		motionState.current = true;
		const el = makeEl();
		expect(fade(el, { essential: true }).duration).toBe(durations.fast);
		expect(fly(el, { duration: 300, essential: true }).duration).toBe(300);
	});

	it('reduced-motion state is read at call time, not cached — a mid-session OS flip is honored on the next call', () => {
		const el = makeEl();
		expect(fade(el, {}).duration).toBe(durations.fast);

		motionState.current = true;
		expect(fade(el, {}).duration).toBe(0);

		motionState.current = false;
		expect(fade(el, {}).duration).toBe(durations.fast);
	});

	it('an explicit duration: 0 is respected regardless of reduced-motion state (no minimum imposed)', () => {
		const el = makeEl();
		motionState.current = false;
		expect(fade(el, { duration: 0 }).duration).toBe(0);
		motionState.current = true;
		expect(fade(el, { duration: 0 }).duration).toBe(0);
	});
});
