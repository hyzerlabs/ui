import { describe, expect, it } from 'vitest';
import {
	parsePlacement,
	place,
	position,
	supportsAnchorPositioning,
	supportsPopoverApi
} from './index.js';
import { applyAnchorPosition } from './anchor.js';
import { trackPosition } from './place.js';

/**
 * specs/50 R-POS-6 — SSR / pre-hydration. This file runs in the 'server'
 * Vitest project (environment: 'node', no DOM globals) — `document`/
 * `window`/`CSS` are genuinely undefined here, exercising the real guards
 * rather than a mock (the reveal.spec.ts precedent).
 */
describe('SSR / pre-hydration (R-POS-6 — no throw; inert)', () => {
	it('module imports without `document`/`window`/`CSS`', () => {
		expect(typeof document).toBe('undefined');
		expect(typeof window).toBe('undefined');
		expect(typeof CSS).toBe('undefined');
	});

	it('parsePlacement() works with no DOM — pure string parsing', () => {
		expect(parsePlacement('top')).toEqual({ side: 'top', align: 'center' });
		expect(parsePlacement('bottom-start')).toEqual({ side: 'bottom', align: 'start' });
	});

	it('supportsPopoverApi() returns false without `HTMLElement`', () => {
		expect(supportsPopoverApi()).toBe(false);
	});

	it('supportsAnchorPositioning() returns false without `CSS`', () => {
		expect(supportsAnchorPositioning()).toBe(false);
	});

	it('place() no-ops and returns the unresolved input without `window`', () => {
		const result = place({} as Element, {} as HTMLElement, {
			side: 'top',
			align: 'center',
			offset: 8
		});
		expect(result).toEqual({ side: 'top', align: 'center' });
	});

	it('trackPosition() returns a no-op cleanup without `document`', () => {
		const stop = trackPosition({} as Element, {} as HTMLElement, {
			side: 'top',
			align: 'center',
			offset: 8
		});
		expect(typeof stop).toBe('function');
		expect(() => stop()).not.toThrow();
	});

	it('applyAnchorPosition() returns a no-op cleanup without `document`', () => {
		const stop = applyAnchorPosition({} as Element, {} as HTMLElement, {
			side: 'top',
			align: 'center',
			offset: 8
		});
		expect(typeof stop).toBe('function');
		expect(() => stop()).not.toThrow();
	});

	it('position() returns a no-op cleanup and the unresolved input side/align without `document`', () => {
		const result = position({} as Element, {} as HTMLElement, {
			side: 'top',
			align: 'center',
			offset: 8
		});
		expect(typeof result.stop).toBe('function');
		expect(() => result.stop()).not.toThrow();
		expect(result.side).toBe('top');
		expect(result.align).toBe('center');
	});
});
