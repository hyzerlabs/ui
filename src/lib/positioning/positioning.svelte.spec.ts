import { afterEach, describe, expect, it } from 'vitest';
import { parsePlacement, place, position } from './index.js';
import type { Placement } from '$lib/types';

/**
 * specs/50 R-POS — behavior needs a real DOM (`getBoundingClientRect`,
 * `window.innerWidth`/`innerHeight`) so this runs in the browser ('client')
 * Vitest project.
 */

function makeEl(styles: Partial<CSSStyleDeclaration> = {}): HTMLDivElement {
	const el = document.createElement('div');
	el.setAttribute('data-positioning-spec', '');
	Object.assign(el.style, { position: 'fixed', ...styles });
	document.body.appendChild(el);
	return el;
}

afterEach(() => {
	document.querySelectorAll('[data-positioning-spec]').forEach((el) => el.remove());
});

// ---------------------------------------------------------------------------
// parsePlacement — R-POS-1
// ---------------------------------------------------------------------------

describe('parsePlacement (R-POS-1)', () => {
	it('normalizes every Placement string to { side, align }', () => {
		const cases: [Placement, { side: string; align: string }][] = [
			['top', { side: 'top', align: 'center' }],
			['bottom', { side: 'bottom', align: 'center' }],
			['left', { side: 'left', align: 'center' }],
			['right', { side: 'right', align: 'center' }],
			['top-start', { side: 'top', align: 'start' }],
			['top-end', { side: 'top', align: 'end' }],
			['bottom-start', { side: 'bottom', align: 'start' }],
			['bottom-end', { side: 'bottom', align: 'end' }],
			['left-start', { side: 'left', align: 'start' }],
			['left-end', { side: 'left', align: 'end' }],
			['right-start', { side: 'right', align: 'start' }],
			['right-end', { side: 'right', align: 'end' }]
		];
		for (const [input, expected] of cases) {
			expect(parsePlacement(input)).toEqual(expected);
		}
	});
});

// ---------------------------------------------------------------------------
// place() — R-POS-4 JS measure-and-place fallback
// ---------------------------------------------------------------------------

describe('place() — basic placement + offset (R-POS-4/R-POS-7)', () => {
	it('places bottom-center below the trigger, honoring offset', () => {
		const trigger = makeEl({ top: '200px', left: '200px', width: '100px', height: '40px' });
		const floating = makeEl({ width: '80px', height: '30px' });

		const result = place(trigger, floating, { side: 'bottom', align: 'center', offset: 10 });

		expect(result.side).toBe('bottom');
		const floatingTop = floating.getBoundingClientRect().top;
		expect(Math.round(floatingTop)).toBe(200 + 40 + 10);
	});

	it('places top-center above the trigger, honoring offset', () => {
		const trigger = makeEl({ top: '400px', left: '200px', width: '100px', height: '40px' });
		const floating = makeEl({ width: '80px', height: '30px' });

		place(trigger, floating, { side: 'top', align: 'center', offset: 10 });

		const rect = floating.getBoundingClientRect();
		expect(Math.round(rect.bottom)).toBe(400 - 10);
	});

	it('align: start aligns the floating element flush with the trigger start edge', () => {
		const trigger = makeEl({ top: '200px', left: '150px', width: '100px', height: '40px' });
		const floating = makeEl({ width: '60px', height: '20px' });

		place(trigger, floating, { side: 'bottom', align: 'start', offset: 8 });

		expect(Math.round(floating.getBoundingClientRect().left)).toBe(150);
	});

	it('align: end aligns the floating element flush with the trigger end edge', () => {
		const trigger = makeEl({ top: '200px', left: '150px', width: '100px', height: '40px' });
		const floating = makeEl({ width: '60px', height: '20px' });

		place(trigger, floating, { side: 'bottom', align: 'end', offset: 8 });

		expect(Math.round(floating.getBoundingClientRect().right)).toBe(150 + 100);
	});

	it('applies position: fixed to the floating element', () => {
		const trigger = makeEl({ top: '10px', left: '10px', width: '20px', height: '20px' });
		const floating = makeEl({ width: '20px', height: '20px' });
		place(trigger, floating, { side: 'bottom', align: 'center', offset: 4 });
		expect(floating.style.position).toBe('fixed');
	});
});

describe('place() — flip on overflow (R-POS-4)', () => {
	it('flips top → bottom when the top side lacks room', () => {
		// Trigger pinned near the top of the viewport — no room above it.
		const trigger = makeEl({ top: '4px', left: '200px', width: '100px', height: '20px' });
		const floating = makeEl({ width: '80px', height: '60px' });

		const result = place(trigger, floating, { side: 'top', align: 'center', offset: 8 });

		expect(result.side).toBe('bottom');
		const rect = floating.getBoundingClientRect();
		expect(Math.round(rect.top)).toBe(4 + 20 + 8);
	});

	it('flips bottom → top when the bottom side lacks room', () => {
		const vh = window.innerHeight;
		// Trigger pinned near the bottom of the viewport — no room below it.
		const trigger = makeEl({ top: `${vh - 24}px`, left: '200px', width: '100px', height: '20px' });
		const floating = makeEl({ width: '80px', height: '60px' });

		const result = place(trigger, floating, { side: 'bottom', align: 'center', offset: 8 });

		expect(result.side).toBe('top');
		const rect = floating.getBoundingClientRect();
		expect(Math.round(rect.bottom)).toBe(vh - 24 - 8);
	});

	it('flips left → right when the left side lacks room', () => {
		const trigger = makeEl({ top: '200px', left: '4px', width: '20px', height: '20px' });
		const floating = makeEl({ width: '60px', height: '30px' });

		const result = place(trigger, floating, { side: 'left', align: 'center', offset: 8 });

		expect(result.side).toBe('right');
	});

	it('does not flip when the preferred side already has room', () => {
		const trigger = makeEl({ top: '300px', left: '300px', width: '100px', height: '40px' });
		const floating = makeEl({ width: '60px', height: '30px' });

		const result = place(trigger, floating, { side: 'bottom', align: 'center', offset: 8 });

		expect(result.side).toBe('bottom');
	});
});

describe('place() — shift clamps within the viewport (R-POS-4)', () => {
	it('clamps the cross axis so the floating element stays within a small viewport padding', () => {
		// Trigger pinned at the left edge — a centered floating element wider
		// than the trigger would overflow off the left of the viewport.
		const trigger = makeEl({ top: '200px', left: '0px', width: '10px', height: '20px' });
		const floating = makeEl({ width: '200px', height: '30px' });

		place(trigger, floating, { side: 'bottom', align: 'center', offset: 8, padding: 8 });

		expect(floating.getBoundingClientRect().left).toBeGreaterThanOrEqual(8);
	});

	it('clamps the right edge so a wide floating element does not overflow the viewport', () => {
		const vw = window.innerWidth;
		const trigger = makeEl({ top: '200px', left: `${vw - 10}px`, width: '10px', height: '20px' });
		const floating = makeEl({ width: '200px', height: '30px' });

		place(trigger, floating, { side: 'bottom', align: 'center', offset: 8, padding: 8 });

		const rect = floating.getBoundingClientRect();
		expect(Math.round(rect.right)).toBeLessThanOrEqual(vw - 8 + 1);
	});
});

// ---------------------------------------------------------------------------
// position() — resolved (post-flip) side, both paths (R-THEME-2/R-THEME-3)
// ---------------------------------------------------------------------------

/** Forces the JS fallback (R-POS-4) by making the anchor-positioning probe
 *  fail — the reveal.svelte.spec.ts "substitute the platform dependency"
 *  technique, applied to `CSS.supports`. */
function withForcedJsFallback(run: () => void): void {
	const original = CSS.supports.bind(CSS);
	CSS.supports = ((...args: Parameters<typeof CSS.supports>) => {
		if (typeof args[0] === 'string' && args[0].includes('anchor-name')) return false;
		return original(...args);
	}) as typeof CSS.supports;
	try {
		run();
	} finally {
		CSS.supports = original;
	}
}

describe('position() — resolved side reflects real post-layout geometry, not the request (R-THEME-2)', () => {
	it('anchor path: resolves to the requested side when it fits (no flip)', () => {
		const trigger = makeEl({ top: '300px', left: '300px', width: '100px', height: '40px' });
		const floating = makeEl({ width: '80px', height: '30px' });

		const result = position(trigger, floating, { side: 'bottom', align: 'center', offset: 8 });
		expect(result.side).toBe('bottom');
		result.stop();
	});

	it('anchor path: resolves to the flipped side when the requested side lacks room', () => {
		// Trigger pinned near the top — no room above it, so the native
		// flip-block position-try-fallback (R-POS-3) engages.
		const trigger = makeEl({ top: '4px', left: '200px', width: '100px', height: '20px' });
		const floating = makeEl({ width: '80px', height: '60px' });

		const result = position(trigger, floating, { side: 'top', align: 'center', offset: 8 });
		expect(result.side).toBe('bottom');
		result.stop();
	});

	it('JS-fallback path: resolves to the flipped side, matching place()’s own flip', () => {
		withForcedJsFallback(() => {
			const trigger = makeEl({ top: '4px', left: '200px', width: '100px', height: '20px' });
			const floating = makeEl({ width: '80px', height: '60px' });

			const result = position(trigger, floating, { side: 'top', align: 'center', offset: 8 });
			expect(result.side).toBe('bottom');
			expect(floating.style.position).toBe('fixed');
			result.stop();
		});
	});

	it('JS-fallback path: resolves to the requested side when it fits (no flip)', () => {
		withForcedJsFallback(() => {
			const trigger = makeEl({ top: '300px', left: '300px', width: '100px', height: '40px' });
			const floating = makeEl({ width: '80px', height: '30px' });

			const result = position(trigger, floating, { side: 'bottom', align: 'center', offset: 8 });
			expect(result.side).toBe('bottom');
			result.stop();
		});
	});
});

// ---------------------------------------------------------------------------
// R-POS-6 — logical direction (RTL)
// ---------------------------------------------------------------------------

function makeRtlTrigger(styles: Partial<CSSStyleDeclaration> = {}): HTMLDivElement {
	const el = makeEl(styles);
	el.setAttribute('dir', 'rtl');
	return el;
}

describe('place() — logical direction resolves through the trigger (R-POS-6)', () => {
	// Small, near-origin coordinates — comfortably clear of every viewport
	// edge (the client project's real browser viewport can be as narrow as a
	// mobile size), so only the RTL side-flip is under test here, not an
	// incidental overflow-driven one.
	it('a left placement renders on the physical right under an RTL trigger', () => {
		const trigger = makeRtlTrigger({ top: '100px', left: '50px', width: '60px', height: '40px' });
		const floating = makeEl({ width: '60px', height: '30px' });

		const result = place(trigger, floating, { side: 'left', align: 'center', offset: 8 });

		expect(result.side).toBe('right');
		const rect = floating.getBoundingClientRect();
		expect(Math.round(rect.left)).toBe(50 + 60 + 8);
	});

	it('a right placement renders on the physical left under an RTL trigger', () => {
		const trigger = makeRtlTrigger({ top: '100px', left: '150px', width: '60px', height: '40px' });
		const floating = makeEl({ width: '60px', height: '30px' });

		const result = place(trigger, floating, { side: 'right', align: 'center', offset: 8 });

		expect(result.side).toBe('left');
		const rect = floating.getBoundingClientRect();
		expect(Math.round(rect.right)).toBe(150 - 8);
	});

	it('an LTR trigger is unaffected — left stays physical left', () => {
		const trigger = makeEl({ top: '100px', left: '150px', width: '60px', height: '40px' });
		const floating = makeEl({ width: '60px', height: '30px' });

		const result = place(trigger, floating, { side: 'left', align: 'center', offset: 8 });
		expect(result.side).toBe('left');
	});

	it('start/end alignment flips under RTL for a top/bottom (block-axis) placement', () => {
		const trigger = makeRtlTrigger({ top: '100px', left: '50px', width: '100px', height: '40px' });
		const floatingStart = makeEl({ width: '60px', height: '30px' });
		const startResult = place(trigger, floatingStart, {
			side: 'bottom',
			align: 'start',
			offset: 8
		});
		// RTL: 'start' (inline-start) is the physical RIGHT edge — the
		// resolved (physical) align comes back 'end', and the floating
		// element's right edge aligns with the trigger's right edge.
		expect(startResult.align).toBe('end');
		expect(Math.round(floatingStart.getBoundingClientRect().right)).toBe(50 + 100);
	});

	it('block-axis (top/bottom) flip/shift stay correct under an RTL trigger — direction never touches the block axis', () => {
		// Trigger pinned near the top — no room above it, so it flips to
		// 'bottom', exactly as it would under LTR: `direction` only ever
		// affects the inline (left/right) axis.
		const trigger = makeRtlTrigger({ top: '4px', left: '100px', width: '100px', height: '20px' });
		const floating = makeEl({ width: '80px', height: '60px' });

		const result = place(trigger, floating, { side: 'top', align: 'center', offset: 8 });
		expect(result.side).toBe('bottom');
	});
});

describe('position() — anchor path resolves logical direction through the trigger too (R-POS-6)', () => {
	it('a left placement renders on the physical right under an RTL trigger', () => {
		const trigger = makeRtlTrigger({ top: '100px', left: '50px', width: '60px', height: '40px' });
		const floating = makeEl({ width: '60px', height: '30px' });

		const result = position(trigger, floating, { side: 'left', align: 'center', offset: 8 });
		expect(result.side).toBe('right');
		result.stop();
	});
});
