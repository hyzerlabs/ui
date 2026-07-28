import { describe, it, expect, afterEach } from 'vitest';
import '../tokens/tokens.css';
import './components/alert.css';
import './components/badge.css';
import './components/button.css';
import { softTints } from '../config/index.js';

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
