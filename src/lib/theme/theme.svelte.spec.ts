import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import '../tokens/tokens.css';
import './components/alert.css';
import './components/badge.css';
import './components/banner.css';
import './components/blockquote.css';
import './components/button.css';
import './components/loading.css';
import { softTints, generateCss, resolveConfig } from '../config/index.js';

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
