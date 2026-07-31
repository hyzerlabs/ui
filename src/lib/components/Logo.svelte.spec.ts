import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet, tick } from 'svelte';
import Logo from './Logo.svelte';
// Logo-R7 recipe pin — loaded so the resolved geometry test reflects the
// actual reference theme, the Skeleton.svelte.spec.ts precedent.
import '../tokens/tokens.css';
import '../theme/components/media.css';

function getLogo(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-logo') as HTMLElement;
}

function silenceWarn(): ReturnType<typeof vi.spyOn> {
	return vi.spyOn(console, 'warn').mockImplementation(() => {});
}

// Deliberately varied demo marks — the worked reference values from the spec.
const wideSvg = '<svg viewBox="0 0 120 40"><rect width="120" height="40" /></svg>';
const wideCommaSvg = '<svg viewBox="0,0,40,120"><rect width="40" height="120" /></svg>';
const squareSvg = '<svg viewBox="0 0 64 64"><rect width="64" height="64" /></svg>';
const widthHeightSvg = '<svg width="200" height="50"><rect width="200" height="50" /></svg>';
const bothSvg = '<svg viewBox="0 0 120 40" width="999" height="999"></svg>';
const percentSvg = '<svg width="100%" height="100%"></svg>';
const noDimsSvg = '<svg><rect /></svg>';
const zeroViewBoxSvg = '<svg viewBox="0 0 0 0"></svg>';
const malformedViewBoxSvg = '<svg viewBox="a b c d"></svg>';
const shortViewBoxSvg = '<svg viewBox="0 0 10"></svg>';

// ---------------------------------------------------------------------------
// Logo-R1 — Structure
// ---------------------------------------------------------------------------

describe('Logo-R1 — structure', () => {
	it('root is a span.hz-logo', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg });
		const el = getLogo(container);
		expect(el.tagName).toBe('SPAN');
		expect(el.classList.contains('hz-logo')).toBe(true);
	});

	it('with svg, the injected <svg> is present in the DOM', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg });
		expect(getLogo(container).querySelector('svg')).not.toBeNull();
	});

	it('data-monochrome present by default', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg });
		expect(getLogo(container).hasAttribute('data-monochrome')).toBe(true);
	});

	it('data-monochrome absent with monochrome={false}', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg, monochrome: false });
		expect(getLogo(container).hasAttribute('data-monochrome')).toBe(false);
	});

	it('data-fallback absent in the SVG branch', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg });
		expect(getLogo(container).hasAttribute('data-fallback')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Logo-R2/R3 — Measurement + math (the load-bearing assertions)
// ---------------------------------------------------------------------------

describe('Logo-R2/R3 — measurement + math', () => {
	function ratioAndFactor(container: HTMLElement): { ratio: number; factor: number } {
		const el = getLogo(container);
		return {
			ratio: parseFloat(el.style.getPropertyValue('--hz-logo-ratio')),
			factor: parseFloat(el.style.getPropertyValue('--hz-logo-width-factor'))
		};
	}

	it('viewBox="0 0 120 40" → ratio 3, factor 1.5518', () => {
		const { container } = render(Logo, { name: 'Acme', svg: wideSvg });
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(3, 4);
		expect(factor).toBeCloseTo(1.5518, 4);
	});

	it('viewBox="0,0,40,120" (comma-separated) → ratio 0.3333, factor 0.6444', () => {
		const { container } = render(Logo, { name: 'Acme', svg: wideCommaSvg });
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(0.3333, 4);
		expect(factor).toBeCloseTo(0.6444, 4);
	});

	it('viewBox="0 0 64 64" → ratio 1, factor 1', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg });
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(1, 4);
		expect(factor).toBeCloseTo(1, 4);
	});

	it('width="200" height="50" with no viewBox → ratio 4, factor 1.7411', () => {
		const { container } = render(Logo, { name: 'Acme', svg: widthHeightSvg });
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(4, 4);
		expect(factor).toBeCloseTo(1.7411, 4);
	});

	it('both viewBox and width/height present → the viewBox values win', () => {
		const { container } = render(Logo, { name: 'Acme', svg: bothSvg });
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(3, 4);
		expect(factor).toBeCloseTo(1.5518, 4);
	});

	it('width="100%" height="100%" → ratio 1, factor 1 (percentages carry no ratio)', () => {
		const { container } = render(Logo, { name: 'Acme', svg: percentSvg });
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(1, 4);
		expect(factor).toBeCloseTo(1, 4);
	});

	it('no viewBox/dimensions → ratio 1, factor 1', () => {
		const { container } = render(Logo, { name: 'Acme', svg: noDimsSvg });
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(1, 4);
		expect(factor).toBeCloseTo(1, 4);
	});

	it.each([
		['viewBox="0 0 0 0"', zeroViewBoxSvg],
		['viewBox="a b c d"', malformedViewBoxSvg],
		['viewBox="0 0 10"', shortViewBoxSvg]
	])('malformed %s → ratio 1, factor 1, no NaN/Infinity in the style', (_label, svg) => {
		const { container } = render(Logo, { name: 'Acme', svg });
		const el = getLogo(container);
		const { ratio, factor } = ratioAndFactor(container);
		expect(ratio).toBeCloseTo(1, 4);
		expect(factor).toBeCloseTo(1, 4);
		expect(el.style.cssText).not.toContain('NaN');
		expect(el.style.cssText).not.toContain('Infinity');
	});
});

// ---------------------------------------------------------------------------
// Logo-R3 — scale
// ---------------------------------------------------------------------------

describe('Logo-R3 — scale', () => {
	it('scale={0.5} on the 3:1 mark halves the factor and leaves the ratio unchanged', () => {
		const { container } = render(Logo, { name: 'Acme', svg: wideSvg, scale: 0.5 });
		const el = getLogo(container);
		expect(parseFloat(el.style.getPropertyValue('--hz-logo-ratio'))).toBeCloseTo(3, 4);
		expect(parseFloat(el.style.getPropertyValue('--hz-logo-width-factor'))).toBeCloseTo(0.7759, 4);
	});
});

// ---------------------------------------------------------------------------
// Logo-R1/Decision 6 — brightness
// ---------------------------------------------------------------------------

describe('Logo-R1/Decision 6 — brightness', () => {
	it('brightness={0.9} stamps --hz-logo-brightness inline (SVG branch)', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg, brightness: 0.9 });
		expect(getLogo(container).style.getPropertyValue('--hz-logo-brightness')).toBe('0.9');
	});

	it('brightness={0.9} stamps --hz-logo-brightness inline (fallback branch)', () => {
		const { container } = render(Logo, { name: 'Acme', brightness: 0.9 });
		expect(getLogo(container).style.getPropertyValue('--hz-logo-brightness')).toBe('0.9');
	});

	it('the default brightness (1) stamps nothing', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg });
		expect(getLogo(container).style.getPropertyValue('--hz-logo-brightness')).toBe('');
		expect(getLogo(container).style.cssText).not.toContain('--hz-logo-brightness');
	});
});

// ---------------------------------------------------------------------------
// Logo-R3/R7 — Resolved geometry, the one end-to-end pin
// ---------------------------------------------------------------------------

describe('Logo-R3/R7 — resolved geometry', () => {
	it('with --hz-logo-size: 100px, a 3:1 logo resolves to ≈155.18 x 51.7px', () => {
		const { container } = render(Logo, { name: 'Acme', svg: wideSvg });
		const el = getLogo(container);
		el.style.setProperty('--hz-logo-size', '100px');
		const computed = getComputedStyle(el);
		expect(parseFloat(computed.width)).toBeCloseTo(155.18, 0);
		expect(parseFloat(computed.height)).toBeCloseTo(51.7, 0);
	});

	// A1 — the theme declares --hz-logo-size at :root scope (not on .hz-logo
	// itself), specifically so an ancestor wrapper's override shadows it. The
	// pin above sets the property inline on the logo and would pass even if
	// the theme declared the default directly on .hz-logo — this is the case
	// that regression actually needs.
	it('--hz-logo-size set on an ancestor wrapper (not the logo itself) still scales it', () => {
		const wrapper = document.createElement('div');
		wrapper.style.setProperty('--hz-logo-size', '100px');
		document.body.appendChild(wrapper);
		render(Logo, { target: wrapper, props: { name: 'Acme', svg: wideSvg } });
		const el = getLogo(wrapper);
		const computed = getComputedStyle(el);
		expect(parseFloat(computed.width)).toBeCloseTo(155.18, 0);
		expect(parseFloat(computed.height)).toBeCloseTo(51.7, 0);
		wrapper.remove();
	});
});

// ---------------------------------------------------------------------------
// Logo-R4 — Accessible name
// ---------------------------------------------------------------------------

describe('Logo-R4 — accessible name', () => {
	it('SVG branch: role="img" and aria-label equal to name, no aria-hidden', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg });
		const el = getLogo(container);
		expect(el.getAttribute('role')).toBe('img');
		expect(el.getAttribute('aria-label')).toBe('Acme');
		expect(el.hasAttribute('aria-hidden')).toBe(false);
	});

	it('decorative: aria-hidden="true", no role, no aria-label', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg, decorative: true });
		const el = getLogo(container);
		expect(el.getAttribute('aria-hidden')).toBe('true');
		expect(el.hasAttribute('role')).toBe(false);
		expect(el.hasAttribute('aria-label')).toBe(false);
	});

	it('a rest aria-labelledby does not displace the managed aria-label', () => {
		const { container } = render(Logo, {
			name: 'Acme',
			svg: squareSvg,
			'aria-labelledby': 'external-label'
		} as Record<string, unknown>);
		expect(getLogo(container).getAttribute('aria-label')).toBe('Acme');
	});
});

// ---------------------------------------------------------------------------
// Logo-R6 — Text fallback
// ---------------------------------------------------------------------------

describe('Logo-R6 — text fallback', () => {
	it('no svg → data-fallback, .hz-logo-text with the name, no role="img"', () => {
		const { container } = render(Logo, { name: 'Soylent' });
		const el = getLogo(container);
		expect(el.hasAttribute('data-fallback')).toBe(true);
		const text = el.querySelector('.hz-logo-text');
		expect(text).not.toBeNull();
		expect(text?.textContent).toBe('Soylent');
		expect(el.hasAttribute('role')).toBe(false);
	});

	it('no svg → no --hz-logo-ratio/--hz-logo-width-factor, computed aspect-ratio is auto', () => {
		const { container } = render(Logo, { name: 'Soylent' });
		const el = getLogo(container);
		expect(el.style.getPropertyValue('--hz-logo-ratio')).toBe('');
		expect(el.style.getPropertyValue('--hz-logo-width-factor')).toBe('');
		expect(getComputedStyle(el).aspectRatio).toBe('auto');
	});

	it('empty string svg is treated as absent → the text fallback', () => {
		const { container } = render(Logo, { name: 'Soylent', svg: '' });
		expect(getLogo(container).hasAttribute('data-fallback')).toBe(true);
	});

	it('whitespace-only svg is treated as absent → the text fallback', () => {
		const { container } = render(Logo, { name: 'Soylent', svg: '   \n  ' });
		expect(getLogo(container).hasAttribute('data-fallback')).toBe(true);
	});

	it('decorative in the fallback branch still yields aria-hidden="true"', () => {
		const { container } = render(Logo, { name: 'Soylent', decorative: true });
		const el = getLogo(container);
		expect(el.getAttribute('aria-hidden')).toBe('true');
		expect(el.hasAttribute('role')).toBe(false);
		expect(el.hasAttribute('aria-label')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Logo-R5 — Dev warnings
// ---------------------------------------------------------------------------

describe('Logo-R5 — dev warnings', () => {
	it('warns once for an empty name without decorative', () => {
		const warnSpy = silenceWarn();
		render(Logo, { name: '', svg: squareSvg });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		warnSpy.mockRestore();
	});

	it('warns once for a whitespace-only name without decorative', () => {
		const warnSpy = silenceWarn();
		render(Logo, { name: '   ', svg: squareSvg });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		warnSpy.mockRestore();
	});

	it('does not warn for an empty name when decorative', () => {
		const warnSpy = silenceWarn();
		render(Logo, { name: '', svg: squareSvg, decorative: true });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('warns once for an svg containing <script', () => {
		const warnSpy = silenceWarn();
		render(Logo, { name: 'Acme', svg: '<svg><script>alert(1)</script></svg>' });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		warnSpy.mockRestore();
	});

	it('warns once for an svg containing onload=', () => {
		const warnSpy = silenceWarn();
		render(Logo, { name: 'Acme', svg: '<svg onload="alert(1)"></svg>' });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		warnSpy.mockRestore();
	});

	it('warns once for an svg with no <svg substring (e.g. a URL)', () => {
		const warnSpy = silenceWarn();
		render(Logo, { name: 'Acme', svg: 'https://example.com/logo.svg' });
		expect(warnSpy).toHaveBeenCalledTimes(1);
		warnSpy.mockRestore();
	});

	it('still renders when a warning fires', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Logo, { name: 'Acme', svg: 'not-svg-markup' });
		expect(getLogo(container)).not.toBeNull();
		warnSpy.mockRestore();
	});

	it('does not warn for a well-formed logo', () => {
		const warnSpy = silenceWarn();
		render(Logo, { name: 'Acme', svg: squareSvg });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Logo-R10/A2 — children as an alternative SVG source
// ---------------------------------------------------------------------------

describe('Logo-R10/A2 — children', () => {
	function wideChildrenSnippet() {
		return createRawSnippet(() => ({
			render: () => '<svg viewBox="0 0 120 40"><rect width="120" height="40" /></svg>'
		}));
	}

	it('renders the snippet SVG inside span.hz-logo', () => {
		const { container } = render(Logo, { name: 'Acme', children: wideChildrenSnippet() });
		const el = getLogo(container);
		expect(el.querySelector('svg')).not.toBeNull();
	});

	it('no data-fallback in the children branch', () => {
		const { container } = render(Logo, { name: 'Acme', children: wideChildrenSnippet() });
		expect(getLogo(container).hasAttribute('data-fallback')).toBe(false);
	});

	it('after mount, the two custom properties match the reference values for the snippet viewBox', async () => {
		const { container } = render(Logo, { name: 'Acme', children: wideChildrenSnippet() });
		await tick();
		const el = getLogo(container);
		expect(parseFloat(el.style.getPropertyValue('--hz-logo-ratio'))).toBeCloseTo(3, 4);
		expect(parseFloat(el.style.getPropertyValue('--hz-logo-width-factor'))).toBeCloseTo(1.5518, 4);
	});

	it('scale multiplies the measured factor', async () => {
		const { container } = render(Logo, {
			name: 'Acme',
			children: wideChildrenSnippet(),
			scale: 0.5
		});
		await tick();
		const el = getLogo(container);
		expect(parseFloat(el.style.getPropertyValue('--hz-logo-width-factor'))).toBeCloseTo(0.7759, 4);
	});

	it('a both-sources conflict warns once and renders the svg prop, not the snippet', async () => {
		const warnSpy = silenceWarn();
		const { container } = render(Logo, {
			name: 'Acme',
			svg: squareSvg,
			children: wideChildrenSnippet()
		});
		await tick();
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0][0]).toContain('both `svg` and `children`');
		const el = getLogo(container);
		// squareSvg (1:1), not the wide snippet's 3:1 svg.
		expect(parseFloat(el.style.getPropertyValue('--hz-logo-ratio'))).toBeCloseTo(1, 4);
		warnSpy.mockRestore();
	});

	it('decorative behaves as in the svg-prop branch', () => {
		const { container } = render(Logo, {
			name: 'Acme',
			children: wideChildrenSnippet(),
			decorative: true
		});
		const el = getLogo(container);
		expect(el.getAttribute('aria-hidden')).toBe('true');
		expect(el.hasAttribute('role')).toBe(false);
		expect(el.hasAttribute('aria-label')).toBe(false);
	});

	it('non-decorative gets role="img" and aria-label as in the svg-prop branch', () => {
		const { container } = render(Logo, { name: 'Acme', children: wideChildrenSnippet() });
		const el = getLogo(container);
		expect(el.getAttribute('role')).toBe('img');
		expect(el.getAttribute('aria-label')).toBe('Acme');
	});

	it('monochrome behaves as in the svg-prop branch', () => {
		const { container } = render(Logo, { name: 'Acme', children: wideChildrenSnippet() });
		expect(getLogo(container).hasAttribute('data-monochrome')).toBe(true);
	});

	it('monochrome={false} behaves as in the svg-prop branch', () => {
		const { container } = render(Logo, {
			name: 'Acme',
			children: wideChildrenSnippet(),
			monochrome: false
		});
		expect(getLogo(container).hasAttribute('data-monochrome')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Class / rest
// ---------------------------------------------------------------------------

describe('Logo — class / rest', () => {
	it('class merges after hz-logo', () => {
		const { container } = render(Logo, { name: 'Acme', svg: squareSvg, class: 'brand-mark' });
		const el = getLogo(container);
		expect(el.classList.contains('hz-logo')).toBe(true);
		expect(el.classList.contains('brand-mark')).toBe(true);
	});

	it('an arbitrary rest attribute forwards to the root', () => {
		const { container } = render(Logo, {
			name: 'Acme',
			svg: squareSvg,
			'data-testid': 'brand-logo'
		} as Record<string, unknown>);
		expect(getLogo(container).getAttribute('data-testid')).toBe('brand-logo');
	});

	it('a colliding managed attribute (role) wins over rest', () => {
		const { container } = render(Logo, {
			name: 'Acme',
			svg: squareSvg,
			role: 'banner'
		} as Record<string, unknown>);
		expect(getLogo(container).getAttribute('role')).toBe('img');
	});

	it('a consumer style merges with the managed style, consumer appended so consumer wins', () => {
		const { container } = render(Logo, {
			name: 'Acme',
			svg: wideSvg,
			style: 'color: red'
		} as Record<string, unknown>);
		const el = getLogo(container);
		expect(el.style.color).toBe('red');
		expect(el.style.getPropertyValue('--hz-logo-ratio')).not.toBe('');
	});
});
