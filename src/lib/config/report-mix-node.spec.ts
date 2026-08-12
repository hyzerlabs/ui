/**
 * The same mixes as `report-mix.svelte.spec.ts`, pinned to fixed hexes and run
 * where the CLI actually runs.
 *
 * The browser oracle is the better test — it compares against the engine that
 * has to agree with us — but it only sees what the browser does. One of these
 * cases used to resolve differently in node and in Chromium from the same
 * source, because a float comparison landed either side of a threshold. A
 * browser-only suite passed while `hyzer generate` was wrong. These values
 * were read off the browser once; if node ever drifts from them, that is the
 * divergence worth failing on.
 */

import { describe, expect, it } from 'vitest';
import { resolveColor } from './report.js';

const EMPTY = new Map<string, string>();

const PINNED: [string, string][] = [
	// An achromatic endpoint in every polar space: the case that diverged.
	['color-mix(in hwb, #808080, #b91c1c)', '#9d4e4e'],
	['color-mix(in hwb, #ffffff, #b91c1c)', '#dc8e8e'],
	['color-mix(in hwb, #fefefe, #b91c1c)', '#dc8d8d'],
	['color-mix(in hsl, #808080, #b91c1c)', '#a04a4a'],
	['color-mix(in lch, #808080, #b91c1c)', '#a45a4d'],
	['color-mix(in oklch, #808080, #b91c1c)', '#a35b53'],
	// A negative aligned hue. Deliberately not a pair whose ideal channels land
	// on .5 — there, node and the browser round opposite ways and a pinned byte
	// says nothing.
	['color-mix(in hsl longer hue, hsl(40 55% 35%), hsl(160 45% 65%))', '#9540bf'],
	// Exactly complementary, where the arc turns on the sign alone.
	['color-mix(in hsl shorter hue, #ff0000, #00ffff)', '#80ff00'],
	// One per space family, so a conversion that drifts on this side is caught.
	['color-mix(in oklab, #2563eb, #f59e0b)', '#938ea4'],
	['color-mix(in lab, #2563eb, #f59e0b)', '#b57e8f'],
	['color-mix(in display-p3, #2563eb, #f59e0b)', '#928190'],
	['color-mix(in prophoto-rgb, #2563eb, #f59e0b)', '#b2829a'],
	['color-mix(in rec2020, #2563eb, #f59e0b)', '#a18292'],
	['color-mix(in xyz-d50, #2563eb, #f59e0b)', '#b685ad'],
	['color-mix(in srgb, #b91c1c 14%, #ffffff)', '#f5dfdf']
];

describe('color-mix — pinned, on the runtime the CLI uses', () => {
	it.each(PINNED)('%s', (value, expected) => {
		expect(resolveColor(value, EMPTY)?.hex).toBe(expected);
	});

	it('refuses a space name off Object.prototype rather than throwing', () => {
		for (const name of ['constructor', '__proto__', 'CONSTRUCTOR']) {
			expect(resolveColor(`color-mix(in ${name}, #ffffff, #000000)`, EMPTY)).toBeNull();
		}
	});
});
