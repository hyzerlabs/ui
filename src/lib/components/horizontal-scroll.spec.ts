/**
 * specs/60 R6/R11/R12 — source-text pins for things a computed style cannot
 * show or that would be brittle to assert via layout.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS = join(process.cwd(), 'src/lib/components');
const THEME = join(process.cwd(), 'src/lib/theme');

/** Strips block comments before scanning (reducedMotion.spec.ts / parallax.spec.ts precedent). */
function readSource(relPath: string): string {
	const raw = readFileSync(join(COMPONENTS, relPath), 'utf8');
	return raw.replace(/\/\*[\s\S]*?\*\//g, (comment) => ' '.repeat(comment.length));
}

const source = readSource('HorizontalScroll.svelte');

describe('HorizontalScroll-R6 — overscroll-behavior fail condition', () => {
	it('declares overscroll-behavior-x and never a bare overscroll-behavior: or overscroll-behavior-y:', () => {
		expect(source).toContain('overscroll-behavior-x');
		expect(source).not.toMatch(/overscroll-behavior:/);
		expect(source).not.toMatch(/overscroll-behavior-y:/);
	});
});

describe('HorizontalScroll-R5/R11 — the wheel listener', () => {
	it('is registered with addEventListener and an explicit { passive: false }', () => {
		expect(source).toContain("addEventListener('wheel', onWheel, { passive: false })");
	});

	it('is removed in the same effect (cleanup), so it never outlives wheel={false}', () => {
		expect(source).toContain("removeEventListener('wheel', onWheel)");
	});
});

describe('HorizontalScroll-R4 — no CSS scroll-behavior: smooth', () => {
	it('the stylesheet never sets scroll-behavior: smooth (58 R8 — it would also animate focus scroll-into-view and browser scroll restoration)', () => {
		expect(source).not.toContain('scroll-behavior: smooth');
	});
});

describe('HorizontalScroll-R9 — zero-JS motion pins carried from the Layout family', () => {
	it('reads reduced motion via the guarded call-time matchMedia shape, not a bare import', () => {
		// The Home/End jump's behavior read is the only matchMedia use — and it
		// must be call-time (inside the keydown handler), never module scope.
		expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
	});
});

describe('HorizontalScroll-R12 — no theme sheet', () => {
	it('src/lib/theme/components/horizontal-scroll.css does not exist', () => {
		expect(existsSync(join(THEME, 'components/horizontal-scroll.css'))).toBe(false);
	});

	it('theme.css does not reference one', () => {
		const themeCss = readFileSync(join(THEME, 'theme.css'), 'utf8');
		expect(themeCss).not.toContain('horizontal-scroll');
	});
});
