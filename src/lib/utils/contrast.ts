/**
 * WCAG 2.x contrast math over sRGB hex colors. Pure functions over hex
 * strings — no DOM or computed styles, so everything is SSR-safe. Pair with
 * the token metadata from `@hyzer-labs/ui/tokens` to verify a palette
 * override still meets your contrast bar; the docs' Contrast & Accessibility
 * page and the library's own token-compliance test suite run on exactly
 * these functions.
 *
 * Thresholds (WCAG 2.1 §1.4.3 / §1.4.6):
 *   normal text — AA ≥ 4.5, AAA ≥ 7
 *   large text  — AA ≥ 3,   AAA ≥ 4.5
 * Section 508 (2017 refresh) incorporates WCAG 2.0 AA, so a 508 pass is
 * exactly the AA pass for the given text size.
 */

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

/** Parse #rgb or #rrggbb into 0–255 channels. */
export function hexToRgb(hex: string): Rgb {
	const h = hex.replace('#', '');
	const full =
		h.length === 3
			? h
					.split('')
					.map((c) => c + c)
					.join('')
			: h;
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16)
	};
}

export function rgbToHex({ r, g, b }: Rgb): string {
	const c = (n: number) => n.toString(16).padStart(2, '0');
	return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * `color-mix(in srgb, a p%, b)` parity: channelwise interpolation of the
 * gamma-encoded sRGB values. Used to resolve the surface-muted role
 * (gray mixed over surface) to a concrete hex.
 */
export function mixSrgb(a: string, b: string, weightOfA: number): string {
	const A = hexToRgb(a);
	const B = hexToRgb(b);
	const mix = (x: number, y: number) => Math.round(x * weightOfA + y * (1 - weightOfA));
	return rgbToHex({ r: mix(A.r, B.r), g: mix(A.g, B.g), b: mix(A.b, B.b) });
}

/** WCAG relative luminance: 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	const lin = (c: number) => {
		const s = c / 255;
		return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colors: 1 to 21, order-independent. */
export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastGrade {
	ratio: number;
	/** Normal text, ≥ 4.5 — also the Section 508 requirement. */
	aaNormal: boolean;
	/** Normal text, ≥ 7. */
	aaaNormal: boolean;
	/** Large text (≥ 24px, or ≥ 18.66px bold), ≥ 3. */
	aaLarge: boolean;
	/** Large text, ≥ 4.5. */
	aaaLarge: boolean;
}

export function gradeContrast(fg: string, bg: string): ContrastGrade {
	const ratio = contrastRatio(fg, bg);
	return {
		ratio,
		aaNormal: ratio >= 4.5,
		aaaNormal: ratio >= 7,
		aaLarge: ratio >= 3,
		aaaLarge: ratio >= 4.5
	};
}

export type ContrastLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

/** Compact best-passing level for normal text ('AA Large' = large text only). */
export function bestLevel(ratio: number): ContrastLevel {
	if (ratio >= 7) return 'AAA';
	if (ratio >= 4.5) return 'AA';
	if (ratio >= 3) return 'AA Large';
	return 'Fail';
}

export type LargeContrastLevel = 'AAA' | 'AA' | 'Fail';

/** Best-passing level for large text (≥ 24px, or ≥ 18.66px bold). */
export function bestLevelLarge(ratio: number): LargeContrastLevel {
	if (ratio >= 4.5) return 'AAA';
	if (ratio >= 3) return 'AA';
	return 'Fail';
}
