import { describe, it, expect } from 'vitest';
import {
	hexToRgb,
	rgbToHex,
	mixSrgb,
	relativeLuminance,
	contrastRatio,
	gradeContrast,
	bestLevel,
	bestLevelLarge
} from './contrast';
import { color } from '$lib/tokens';

describe('hexToRgb / rgbToHex', () => {
	it('parses #rrggbb', () => {
		expect(hexToRgb('#2563eb')).toEqual({ r: 0x25, g: 0x63, b: 0xeb });
	});

	it('expands #rgb shorthand', () => {
		expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
	});

	it('round-trips', () => {
		expect(rgbToHex(hexToRgb('#6b7280'))).toBe('#6b7280');
	});
});

describe('mixSrgb — color-mix(in srgb) parity', () => {
	it('weight 1 returns the first color, weight 0 the second', () => {
		expect(mixSrgb('#6b7280', '#ffffff', 1)).toBe('#6b7280');
		expect(mixSrgb('#6b7280', '#ffffff', 0)).toBe('#ffffff');
	});

	it('interpolates channelwise in gamma space', () => {
		// 50% black over white = #808080 (128 = round(0.5*0 + 0.5*255) = 128)
		expect(mixSrgb('#000000', '#ffffff', 0.5)).toBe('#808080');
	});

	it('resolves the light surface-muted role (6% gray over white)', () => {
		// round(0.06*0x6b + 0.94*255) = 246, 0x72→247, 0x80→247
		expect(mixSrgb('#6b7280', '#ffffff', 0.06)).toBe('#f6f7f7');
	});
});

describe('relativeLuminance', () => {
	it('white is 1 and black is 0', () => {
		expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
		expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
	});

	it('mid gray #6b7280 is ≈ 0.167', () => {
		expect(relativeLuminance('#6b7280')).toBeCloseTo(0.167, 2);
	});
});

describe('contrastRatio', () => {
	it('black on white is 21:1', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
	});

	it('is order-independent', () => {
		expect(contrastRatio('#2563eb', '#ffffff')).toBeCloseTo(
			contrastRatio('#ffffff', '#2563eb'),
			10
		);
	});

	it('#767676 on white just passes AA normal (≈ 4.54)', () => {
		expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
	});
});

describe('gradeContrast / bestLevel', () => {
	it('black on white passes everything', () => {
		const g = gradeContrast('#000000', '#ffffff');
		expect(g.aaNormal && g.aaaNormal && g.aaLarge && g.aaaLarge).toBe(true);
		expect(bestLevel(g.ratio)).toBe('AAA');
	});

	it('gray #6b7280 on white passes AA normal but not AAA', () => {
		const g = gradeContrast('#6b7280', '#ffffff');
		expect(g.aaNormal).toBe(true);
		expect(g.aaaNormal).toBe(false);
		expect(bestLevel(g.ratio)).toBe('AA');
	});

	it('a 3.19:1 orange (#d97706) on white is large-text only', () => {
		const g = gradeContrast('#d97706', '#ffffff');
		expect(g.aaNormal).toBe(false);
		expect(g.aaLarge).toBe(true);
		expect(bestLevel(g.ratio)).toBe('AA Large');
	});

	it('white on warning-adjacent light color fails outright', () => {
		expect(bestLevel(contrastRatio('#ffffff', '#f6f7f7'))).toBe('Fail');
	});

	it('thresholds are inclusive', () => {
		expect(bestLevel(7)).toBe('AAA');
		expect(bestLevel(4.5)).toBe('AA');
		expect(bestLevel(3)).toBe('AA Large');
		expect(bestLevel(2.99)).toBe('Fail');
	});

	it('large-text levels shift down one threshold', () => {
		expect(bestLevelLarge(4.5)).toBe('AAA');
		expect(bestLevelLarge(3)).toBe('AA');
		expect(bestLevelLarge(2.99)).toBe('Fail');
	});
});

describe('token compliance (the palette contract)', () => {
	// Mirrors the AA-by-construction posture in specs/15 (2026-07-14): every
	// value the theme uses as text passes ≥ 4.5:1 on both surfaces of its
	// mode. Palettes derive from the token metadata (specs/29 R8) — the
	// thresholds are the contract, the hues travel with the schema.
	const WHITE = color.white;
	const BLACK = color.black;
	const GRAY = color.gray;
	const mutedLight = mixSrgb(GRAY, WHITE, 0.06);
	// In dark mode the muted surface mixes the DARK gray companion.
	const mutedDark = mixSrgb(color.theme.dark.gray, BLACK, 0.25);

	const lightIntents = [
		color.primary,
		color.secondary,
		color.danger,
		color.warning,
		color.success,
		color.info,
		GRAY
	];
	// Dark mode is authored entirely at the palette layer; every intent
	// chains through these companions (neutral through gray).
	const darkIntents = [
		color.theme.dark.primary,
		color.theme.dark.secondary,
		color.theme.dark.danger,
		color.theme.dark.warning,
		color.theme.dark.success,
		color.theme.dark.info,
		color.theme.dark.gray
	];

	it('every light intent passes AA on both light surfaces and under white solid text', () => {
		for (const c of lightIntents) {
			expect(contrastRatio(c, WHITE)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(c, mutedLight)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(WHITE, c)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('every dark intent passes AA on both dark surfaces and under black solid text', () => {
		for (const c of darkIntents) {
			expect(contrastRatio(c, BLACK)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(c, mutedDark)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(BLACK, c)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('the soft Badge/Alert recipes pass AA in both modes (mode-aware tints)', async () => {
		const { softTints } = await import('$lib/config');
		const modes = [
			{ tints: softTints.light, intents: lightIntents, surface: WHITE, text: BLACK },
			{ tints: softTints.dark, intents: darkIntents, surface: BLACK, text: WHITE }
		];
		for (const { tints, intents, surface, text } of modes) {
			for (const c of intents) {
				expect(
					contrastRatio(mixSrgb(c, text, softTints.badgeText), mixSrgb(c, surface, tints.badgeBg))
				).toBeGreaterThanOrEqual(4.5);
				expect(
					contrastRatio(mixSrgb(c, text, softTints.alertTitle), mixSrgb(c, surface, tints.alertBg))
				).toBeGreaterThanOrEqual(4.5);
				expect(contrastRatio(text, mixSrgb(c, surface, tints.alertBg))).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	it('muted text passes AA in both modes', () => {
		expect(contrastRatio(GRAY, WHITE)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(GRAY, mutedLight)).toBeGreaterThanOrEqual(4.5);
		// text-muted chains through gray, which lightens in dark mode.
		expect(contrastRatio(color.theme.dark.gray, BLACK)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(color.theme.dark.gray, mutedDark)).toBeGreaterThanOrEqual(4.5);
	});
});
