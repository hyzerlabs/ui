import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import '../tokens/tokens.css';
import './components/alert.css';
import './components/badge.css';
import './components/banner.css';
import './components/blockquote.css';
import './components/button.css';
import './components/loading.css';
import { softTints, generateCss, resolveConfig } from '../config/index.js';
import { density } from '../tokens/index.js';

/**
 * Pins the reference theme's soft-tint CSS to the engine's softTints model
 * (src/lib/config/report.ts) — the contrast report, compliance suite, and
 * docs derive from the model, so the two must never drift.
 */

function mount(className: string, attrs: Record<string, string>): HTMLElement {
	const el = document.createElement('div');
	el.className = className;
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
	document.body.appendChild(el);
	return el;
}

function resolveColor(varExpression: string): string {
	const probe = document.createElement('div');
	probe.style.cssText = `color: ${varExpression}`;
	document.body.appendChild(probe);
	const resolved = getComputedStyle(probe).color;
	document.body.removeChild(probe);
	return resolved;
}

const pct = (fraction: number) => `${fraction * 100}%`;

afterEach(() => {
	document.documentElement.removeAttribute('data-theme');
	document.body.replaceChildren();
});

describe.each(['light', 'dark'] as const)('soft tints match the softTints model (%s)', (mode) => {
	const setMode = () => {
		if (mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
	};

	it('Alert background mixes the intent at the modeled strength', () => {
		setMode();
		const alert = mount('hz-alert', { 'data-intent': 'danger' });
		expect(getComputedStyle(alert).backgroundColor).toBe(
			resolveColor(
				`color-mix(in srgb, var(--hz-intent-danger) ${pct(softTints[mode].alertBg)}, var(--hz-color-surface))`
			)
		);
	});

	it('soft Badge background and text mix at the modeled strengths', () => {
		setMode();
		const badge = mount('hz-badge', { 'data-intent': 'warning', 'data-variant': 'soft' });
		const style = getComputedStyle(badge);
		expect(style.backgroundColor).toBe(
			resolveColor(
				`color-mix(in srgb, var(--hz-intent-warning) ${pct(softTints[mode].badgeBg)}, var(--hz-color-surface))`
			)
		);
		expect(style.color).toBe(
			resolveColor(
				`color-mix(in srgb, var(--hz-intent-warning) ${pct(softTints.badgeText)}, var(--hz-color-text))`
			)
		);
	});

	// specs/01 amendment 2026-07-27 — Button's `soft` variant reuses the
	// Badge soft recipe verbatim (same softTints.badgeBg/badgeText model, via
	// its own --hz-button-tint hook), so it must pin to the identical math.
	it('soft Button background and text mix at the modeled strengths', () => {
		setMode();
		const button = mount('hz-button', { 'data-intent': 'warning', 'data-variant': 'soft' });
		const style = getComputedStyle(button);
		expect(style.backgroundColor).toBe(
			resolveColor(
				`color-mix(in srgb, var(--hz-intent-warning) ${pct(softTints[mode].badgeBg)}, var(--hz-color-surface))`
			)
		);
		expect(style.color).toBe(
			resolveColor(
				`color-mix(in srgb, var(--hz-intent-warning) ${pct(softTints.badgeText)}, var(--hz-color-text))`
			)
		);
	});
});

// ---------------------------------------------------------------------------
// R11 (specs/64) — density ladder rungs: near/away resolve identically to the
// pre-refactor calc()s with nothing overridden, a rung override retunes the
// two places it backs (its own depth's near, the next-deeper depth's away),
// and the existing scoped --hz-density behavior survives the refactor.
// ---------------------------------------------------------------------------

/**
 * Builds a `[data-density-shift]` chain matching `densityBlock()`'s selector
 * for `depth` (1-based) under `root` (default `document.body`, matching the
 * literal `body` depth-1 selector — a non-body root only makes sense for
 * depth >= 2, since depth 1's own selector is `body` itself). Returns the
 * deepest element: `depth` 1 returns `root` unchanged (zero
 * `[data-density-shift]` ancestors).
 */
function shiftChain(depth: number, root: HTMLElement = document.body): HTMLElement {
	let target = root;
	for (let i = 0; i < depth - 1; i++) {
		const el = document.createElement('div');
		el.setAttribute('data-density-shift', '');
		target.appendChild(el);
		target = el;
	}
	return target;
}

/**
 * Resolves a CSS length expression against `parent`'s own cascade — a probe
 * CHILD, so an inherited custom property declared on `parent` itself
 * resolves the same way a real descendant's would (the `resolveColor`
 * precedent above, for lengths instead of colors — custom properties compute
 * to their unsubstituted text, so `width: var(...)` is what actually forces
 * substitution).
 */
function resolveLength(varExpression: string, parent: HTMLElement): number {
	const probe = document.createElement('div');
	probe.style.cssText = `width: ${varExpression}`;
	parent.appendChild(probe);
	const px = parseFloat(getComputedStyle(probe).width);
	parent.removeChild(probe);
	return px;
}

describe('R11 — density ladder rungs', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it('nothing overridden: near/away match the pre-refactor calc() at every depth', () => {
		density.levels.forEach((level, i) => {
			const depth = i + 1;
			const target = shiftChain(depth);
			const near = resolveLength('var(--hz-space-near)', target);
			const away = resolveLength('var(--hz-space-away)', target);
			const expectedNear = resolveLength(`calc(var(--hz-density) * ${level.near})`, target);
			const expectedAway = resolveLength(`calc(var(--hz-density) * ${level.away})`, target);
			expect(near, `depth ${depth} near`).toBeCloseTo(expectedNear, 1);
			expect(away, `depth ${depth} away`).toBeCloseTo(expectedAway, 1);
		});
	});

	it("a depth-2 rung override on a wrapper retunes depth 2's near AND depth 3's away, and leaves an identical tree outside it untouched", () => {
		const wrapper = document.createElement('div');
		document.body.appendChild(wrapper);
		wrapper.style.setProperty('--hz-density-ladder-depth-2', '3px');

		const depth2Inside = shiftChain(2, wrapper);
		const depth3Inside = shiftChain(3, wrapper);
		expect(resolveLength('var(--hz-space-near)', depth2Inside)).toBeCloseTo(3, 1);
		expect(resolveLength('var(--hz-space-away)', depth3Inside)).toBeCloseTo(3, 1);

		// Every other distance inside the wrapper is untouched.
		expect(resolveLength('var(--hz-space-away)', depth2Inside)).toBeCloseTo(
			resolveLength('calc(var(--hz-density) * 10)', depth2Inside),
			1
		);
		expect(resolveLength('var(--hz-space-near)', depth3Inside)).toBeCloseTo(
			resolveLength('calc(var(--hz-density) * 2)', depth3Inside),
			1
		);

		// Outside the wrapper, an identical chain is untouched.
		const depth2Outside = shiftChain(2);
		expect(resolveLength('var(--hz-space-near)', depth2Outside)).toBeCloseTo(
			resolveLength('calc(var(--hz-density) * 5)', depth2Outside),
			1
		);
	});

	it('--hz-density: 1px on a wrapper still retunes every shift level inside it (the scoped-unit behavior the fallback form preserves)', () => {
		const wrapper = document.createElement('div');
		document.body.appendChild(wrapper);
		wrapper.style.setProperty('--hz-density', '1px');

		density.levels.forEach((level, i) => {
			const depth = i + 1;
			// Depth 1's selector is the literal `body`, unreachable from a wrapper.
			if (depth === 1) return;
			const target = shiftChain(depth, wrapper);
			const near = resolveLength('var(--hz-space-near)', target);
			const expectedNear = resolveLength(`calc(var(--hz-density) * ${level.near})`, target);
			expect(near, `depth ${depth} near`).toBeCloseTo(expectedNear, 1);
		});
	});
});

// ---------------------------------------------------------------------------
// Custom intent wiring — a config-registered intent switches the reference
// theme's --_c hook (specs/62), so it paints identically to a built-in given
// the same value, everywhere a built-in does.
// ---------------------------------------------------------------------------

function mountChild(parent: HTMLElement, className: string): HTMLElement {
	const el = document.createElement('div');
	el.className = className;
	parent.appendChild(el);
	return el;
}

describe('custom intent wiring — a registered intent works everywhere a built-in does', () => {
	// The fairway intent is given the SAME value as the built-in `danger`, so
	// every component's computed color for the two must be pixel-identical.
	const customIntentCss = generateCss(
		resolveConfig({ tokens: { intent: { fairway: '#b91c1c' } } }),
		{
			mode: 'overrides'
		}
	);
	let styleEl: HTMLStyleElement;

	beforeAll(() => {
		styleEl = document.createElement('style');
		styleEl.textContent = customIntentCss;
		document.head.appendChild(styleEl);
	});

	afterAll(() => {
		document.head.removeChild(styleEl);
	});

	interface Row {
		name: string;
		paint: (intent: string) => string;
	}

	const rows: Row[] = [
		{
			name: 'Badge',
			paint: (intent) =>
				getComputedStyle(mount('hz-badge', { 'data-intent': intent, 'data-variant': 'solid' }))
					.backgroundColor
		},
		{
			name: 'Alert',
			paint: (intent) =>
				getComputedStyle(mount('hz-alert', { 'data-intent': intent })).backgroundColor
		},
		{
			name: 'Banner',
			paint: (intent) =>
				getComputedStyle(mount('hz-banner', { 'data-intent': intent })).backgroundColor
		},
		{
			name: 'Button',
			paint: (intent) =>
				getComputedStyle(mount('hz-button', { 'data-intent': intent, 'data-variant': 'solid' }))
					.backgroundColor
		},
		{
			name: 'Blockquote',
			paint: (intent) => {
				const root = mount('hz-blockquote', { 'data-intent': intent });
				const quote = mountChild(root, 'hz-blockquote-quote');
				return getComputedStyle(quote).borderInlineStartColor;
			}
		},
		{
			name: 'Loading',
			paint: (intent) => {
				const root = mount('hz-loading', { 'data-intent': intent });
				const dot = mountChild(root, 'hz-loading-dot');
				return getComputedStyle(dot).backgroundColor;
			}
		}
	];

	it.each(rows)(
		'$name paints an identical color for the custom intent as for the built-in it copies',
		({ paint }) => {
			const builtIn = paint('danger');
			document.body.replaceChildren();
			const custom = paint('fairway');
			expect(custom).toBe(builtIn);
		}
	);

	it('a plain Badge (no data-intent) inside a data-intent wrapper stays neutral — no inheritance leak', () => {
		const wrapper = mount('data-intent-wrapper', { 'data-intent': 'fairway' });
		const badge = mountChild(wrapper, 'hz-badge');
		badge.setAttribute('data-variant', 'solid');
		const neutral = resolveColor('var(--hz-intent-neutral)');
		expect(getComputedStyle(badge).backgroundColor).toBe(neutral);
	});
});

// ---------------------------------------------------------------------------
// R5 — Banner's nested-Button retarget actually applies (:is(.hz-button),
// not :where(.hz-button)): a Button inside a Banner paints in the banner's
// fg/bg pair, custom and built-in intents alike.
// ---------------------------------------------------------------------------

describe('Banner + nested Button — the fg/bg retarget wins', () => {
	it('a solid Button inside a Banner computes background-color equal to the banner fg resolution', () => {
		const banner = mount('hz-banner', {});
		const bannerFg = getComputedStyle(banner).color;
		const button = mountChild(banner, 'hz-button');
		button.setAttribute('data-variant', 'solid');
		expect(getComputedStyle(button).backgroundColor).toBe(bannerFg);
	});

	it('a solid Button mounted alone does NOT paint the banner fg/bg pair', () => {
		const banner = mount('hz-banner', {});
		const bannerFg = getComputedStyle(banner).color;
		document.body.replaceChildren();

		const button = mount('hz-button', { 'data-variant': 'solid' });
		expect(getComputedStyle(button).backgroundColor).not.toBe(bannerFg);
	});

	it('a Button inside a Banner with a custom intent still paints the banner fg/bg pair, not its own intent', () => {
		const customIntentCss = generateCss(
			resolveConfig({ tokens: { intent: { fairway: '#b91c1c' } } }),
			{ mode: 'overrides' }
		);
		const styleEl = document.createElement('style');
		styleEl.textContent = customIntentCss;
		document.head.appendChild(styleEl);

		const banner = mount('hz-banner', {});
		const bannerFg = getComputedStyle(banner).color;
		const button = mountChild(banner, 'hz-button');
		button.setAttribute('data-variant', 'solid');
		button.setAttribute('data-intent', 'fairway');
		expect(getComputedStyle(button).backgroundColor).toBe(bannerFg);

		document.head.removeChild(styleEl);
	});
});
