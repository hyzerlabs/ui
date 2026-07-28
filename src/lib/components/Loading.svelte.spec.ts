import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { cdp } from 'vitest/browser';
import Loading from './Loading.svelte';
// Loading-R8 recipe pin — the reference theme must be loaded so the
// computed --hz-loading-fill/-speed/-ease reflect the actual reference theme.
import '../tokens/tokens.css';
import '../theme/components/loading.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLoading(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-loading') as HTMLElement;
}

function silenceWarn(): ReturnType<typeof vi.spyOn> {
	return vi.spyOn(console, 'warn').mockImplementation(() => {});
}

// R8/R9 — every test that forces prefers-reduced-motion via the real CDP
// media emulation resets it in afterEach, so the forced state never leaks
// into another test (in this file or, since the browser session persists
// across files, any other .svelte.spec.ts).
afterEach(async () => {
	await cdp().send('Emulation.setEmulatedMedia', { media: 'screen', features: [] });
});

async function forceReducedMotion(): Promise<void> {
	await cdp().send('Emulation.setEmulatedMedia', {
		media: 'screen',
		features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
	});
}

// ---------------------------------------------------------------------------
// Loading-R1/R2 — Structure and data hooks
// ---------------------------------------------------------------------------

describe('Loading-R1/R2 — structure and data hooks', () => {
	it('defaults: primary / md / bar, data-indeterminate present with no value', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Loading, { label: 'Loading' });
		const root = getLoading(container);
		expect(root.getAttribute('data-intent')).toBe('primary');
		expect(root.getAttribute('data-size')).toBe('md');
		expect(root.getAttribute('data-variant')).toBe('bar');
		expect(root.hasAttribute('data-indeterminate')).toBe(true);
		warnSpy.mockRestore();
	});

	it('data-indeterminate is absent for a determinate bar', () => {
		const { container } = render(Loading, { value: 50, label: 'Loading' });
		expect(getLoading(container).hasAttribute('data-indeterminate')).toBe(false);
	});

	it('every intent value reflects into data-intent', () => {
		for (const intent of [
			'neutral',
			'primary',
			'secondary',
			'danger',
			'warning',
			'success',
			'info'
		] as const) {
			const { container } = render(Loading, { intent, value: 10, label: 'Loading' });
			expect(getLoading(container).getAttribute('data-intent')).toBe(intent);
		}
	});

	it('size and variant reflect into their data attributes', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Loading, { size: 'lg', variant: 'spinner', label: 'Loading' });
		const root = getLoading(container);
		expect(root.getAttribute('data-size')).toBe('lg');
		expect(root.getAttribute('data-variant')).toBe('spinner');
		warnSpy.mockRestore();
	});

	it('bar variant renders a native <progress class="hz-loading-bar">', () => {
		const { container } = render(Loading, { value: 40, label: 'Loading' });
		const bar = getLoading(container).querySelector('progress.hz-loading-bar');
		expect(bar).not.toBeNull();
		expect(bar?.tagName.toLowerCase()).toBe('progress');
	});

	it('spinner variant renders .hz-loading-spinner[role=progressbar][aria-busy] with IconLoader, no <progress>', () => {
		const { container } = render(Loading, { variant: 'spinner', label: 'Saving' });
		const root = getLoading(container);
		const spinner = root.querySelector('.hz-loading-spinner');
		expect(spinner?.getAttribute('role')).toBe('progressbar');
		expect(spinner?.getAttribute('aria-busy')).toBe('true');
		expect(spinner?.querySelector('svg.hz-icon')).not.toBeNull();
		expect(root.querySelector('progress')).toBeNull();
	});

	it('dots variant renders .hz-loading-dots[role=progressbar][aria-busy] with three aria-hidden dots, no <progress>', () => {
		const { container } = render(Loading, { variant: 'dots', label: 'Loading' });
		const root = getLoading(container);
		const dots = root.querySelector('.hz-loading-dots');
		expect(dots?.getAttribute('role')).toBe('progressbar');
		expect(dots?.getAttribute('aria-busy')).toBe('true');
		const dotSpans = root.querySelectorAll('.hz-loading-dot');
		expect(dotSpans).toHaveLength(3);
		for (const dot of dotSpans) expect(dot.getAttribute('aria-hidden')).toBe('true');
		expect(root.querySelector('progress')).toBeNull();
	});

	it('data-indeterminate is always present for dots regardless of value; absent for a determinate spinner ring', () => {
		const warnSpy = silenceWarn();
		const dots = render(Loading, { variant: 'dots', value: 50, label: 'Loading' });
		expect(getLoading(dots.container).hasAttribute('data-indeterminate')).toBe(true);
		warnSpy.mockRestore();

		// R3: a value on the spinner is now valid — the determinate ring — so
		// data-indeterminate is absent, unlike dots.
		const spinner = render(Loading, { variant: 'spinner', value: 50, label: 'Saving' });
		expect(getLoading(spinner.container).hasAttribute('data-indeterminate')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Loading-R3 — Determinate semantics
// ---------------------------------------------------------------------------

describe('Loading-R3 — determinate semantics', () => {
	it('renders value/max on the native <progress>', () => {
		const { container } = render(Loading, { value: 62, max: 200, label: 'Loading' });
		const bar = getLoading(container).querySelector(
			'progress.hz-loading-bar'
		) as HTMLProgressElement;
		expect(bar.value).toBe(62);
		expect(bar.max).toBe(200);
	});

	it('value > max clamps to max', () => {
		const { container } = render(Loading, { value: 150, max: 100, label: 'Loading' });
		const bar = getLoading(container).querySelector(
			'progress.hz-loading-bar'
		) as HTMLProgressElement;
		expect(bar.value).toBe(100);
	});

	it('value < 0 clamps to 0', () => {
		const { container } = render(Loading, { value: -20, label: 'Loading' });
		const bar = getLoading(container).querySelector(
			'progress.hz-loading-bar'
		) as HTMLProgressElement;
		expect(bar.value).toBe(0);
	});

	it('aria-valuetext is absent at the default percentage format and max=100', () => {
		const { container } = render(Loading, { value: 62, label: 'Loading' });
		const bar = getLoading(container).querySelector('progress.hz-loading-bar') as HTMLElement;
		expect(bar.hasAttribute('aria-valuetext')).toBe(false);
	});

	it('aria-valuetext is present for a non-100 max, using the default formatter', () => {
		const { container } = render(Loading, { value: 3, max: 5, label: 'Loading' });
		const bar = getLoading(container).querySelector('progress.hz-loading-bar') as HTMLElement;
		expect(bar.getAttribute('aria-valuetext')).toBe('60%');
	});

	it('aria-valuetext is present for a custom format even at max=100, and matches the readout', () => {
		const format = (v: number, max: number) => `${v} of ${max} files`;
		const { container } = render(Loading, {
			value: 3,
			max: 5,
			label: 'Import',
			format,
			showValue: true
		});
		const bar = getLoading(container).querySelector('progress.hz-loading-bar') as HTMLElement;
		const output = getLoading(container).querySelector('.hz-loading-value');
		expect(bar.getAttribute('aria-valuetext')).toBe('3 of 5 files');
		expect(output?.textContent).toBe('3 of 5 files');
	});
});

// ---------------------------------------------------------------------------
// Loading-R3 — Determinate ring (variant="spinner" + value)
// ---------------------------------------------------------------------------

describe('Loading-R3 — determinate ring', () => {
	it('renders .hz-loading-ring with a track and a fill circle, no <progress>, no IconLoader', () => {
		const { container } = render(Loading, { variant: 'spinner', value: 40, label: 'Uploading' });
		const root = getLoading(container);
		expect(root.querySelector('progress')).toBeNull();
		expect(root.querySelector('svg.hz-icon')).toBeNull();
		const ring = root.querySelector('svg.hz-loading-ring');
		expect(ring).not.toBeNull();
		expect(ring?.querySelector('circle.hz-loading-ring-track')).not.toBeNull();
		expect(ring?.querySelector('circle.hz-loading-ring-fill')).not.toBeNull();
	});

	it('the SVG ring is aria-hidden — ARIA lives on the .hz-loading-spinner wrapper', () => {
		const { container } = render(Loading, { variant: 'spinner', value: 40, label: 'Uploading' });
		const root = getLoading(container);
		const ring = root.querySelector('svg.hz-loading-ring');
		expect(ring?.getAttribute('aria-hidden')).toBe('true');
		const wrapper = root.querySelector('.hz-loading-spinner');
		expect(wrapper?.getAttribute('role')).toBe('progressbar');
		expect(wrapper?.getAttribute('aria-label')).toBe('Uploading');
	});

	it('the wrapper carries aria-valuemin/max/now and NO aria-busy, and data-indeterminate is absent', () => {
		const { container } = render(Loading, {
			variant: 'spinner',
			value: 40,
			max: 80,
			label: 'Uploading'
		});
		const root = getLoading(container);
		const wrapper = root.querySelector('.hz-loading-spinner') as HTMLElement;
		expect(wrapper.getAttribute('aria-valuemin')).toBe('0');
		expect(wrapper.getAttribute('aria-valuemax')).toBe('80');
		expect(wrapper.getAttribute('aria-valuenow')).toBe('40');
		expect(wrapper.hasAttribute('aria-busy')).toBe(false);
		expect(root.hasAttribute('data-indeterminate')).toBe(false);
	});

	it('the fill circle stroke-dashoffset is 100 - (clamped/max)*100: 0 → 100, max → 0, over-max clamps to 0', () => {
		const zero = render(Loading, { variant: 'spinner', value: 0, max: 100, label: 'Uploading' });
		const zeroFill = getLoading(zero.container).querySelector(
			'.hz-loading-ring-fill'
		) as SVGElement;
		expect(zeroFill.style.strokeDashoffset).toBe('100');

		const full = render(Loading, { variant: 'spinner', value: 100, max: 100, label: 'Uploading' });
		const fullFill = getLoading(full.container).querySelector(
			'.hz-loading-ring-fill'
		) as SVGElement;
		expect(fullFill.style.strokeDashoffset).toBe('0');

		const overMax = render(Loading, {
			variant: 'spinner',
			value: 150,
			max: 100,
			label: 'Uploading'
		});
		const overMaxFill = getLoading(overMax.container).querySelector(
			'.hz-loading-ring-fill'
		) as SVGElement;
		expect(overMaxFill.style.strokeDashoffset).toBe('0');

		const half = render(Loading, { variant: 'spinner', value: 50, max: 100, label: 'Uploading' });
		const halfFill = getLoading(half.container).querySelector(
			'.hz-loading-ring-fill'
		) as SVGElement;
		expect(halfFill.style.strokeDashoffset).toBe('50');
	});

	it('the ring has no spin animation (static, determinate)', () => {
		const { container } = render(Loading, { variant: 'spinner', value: 40, label: 'Uploading' });
		const ring = getLoading(container).querySelector('.hz-loading-ring') as SVGElement;
		expect(getComputedStyle(ring).animationName).toBe('none');
	});

	it('aria-valuetext is present for a custom format or non-100 max, and matches the centered readout', () => {
		const format = (v: number, max: number) => `${v} of ${max} files`;
		const { container } = render(Loading, {
			variant: 'spinner',
			value: 3,
			max: 5,
			label: 'Import',
			format,
			showValue: true
		});
		const wrapper = getLoading(container).querySelector('.hz-loading-spinner') as HTMLElement;
		const readout = getLoading(container).querySelector('.hz-loading-value');
		expect(wrapper.getAttribute('aria-valuetext')).toBe('3 of 5 files');
		expect(readout?.tagName.toLowerCase()).toBe('span');
		expect(readout?.textContent).toBe('3 of 5 files');
	});

	it('aria-valuetext is absent at the default percentage format and max=100', () => {
		const { container } = render(Loading, { variant: 'spinner', value: 62, label: 'Uploading' });
		const wrapper = getLoading(container).querySelector('.hz-loading-spinner') as HTMLElement;
		expect(wrapper.hasAttribute('aria-valuetext')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Loading-R4 — Indeterminate semantics
// ---------------------------------------------------------------------------

describe('Loading-R4 — indeterminate semantics', () => {
	it('no value attribute and no aria-valuenow on the native <progress>', () => {
		const { container } = render(Loading, { label: 'Loading' });
		const bar = getLoading(container).querySelector('progress.hz-loading-bar') as HTMLElement;
		expect(bar.hasAttribute('value')).toBe(false);
		expect(bar.hasAttribute('aria-valuenow')).toBe(false);
	});

	it('NaN value is treated as indeterminate (and dev-warns)', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Loading, { value: NaN, label: 'Loading' });
		const root = getLoading(container);
		expect(root.hasAttribute('data-indeterminate')).toBe(true);
		expect(root.querySelector('progress')?.hasAttribute('value')).toBe(false);
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Loading-R5 — Spinner/dots + value edge cases
// ---------------------------------------------------------------------------

describe('Loading-R5 — spinner/dots are indeterminate-only', () => {
	it('variant="spinner" + value does NOT dev-warn — it is the valid determinate ring (R3)', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Loading, { variant: 'spinner', value: 50, label: 'Saving' });
		expect(warnSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes('spinner'))).toBe(false);
		expect(container.querySelector('progress')).toBeNull();
		expect(container.querySelector('.hz-loading-ring')).not.toBeNull();
		warnSpy.mockRestore();
	});

	it('variant="dots" + value dev-warns and stays indeterminate', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Loading, { variant: 'dots', value: 50, label: 'Loading' });
		expect(warnSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes('dots'))).toBe(true);
		expect(container.querySelector('progress')).toBeNull();
		expect(container.querySelector('.hz-loading-dots')).not.toBeNull();
		warnSpy.mockRestore();
	});

	it('variant="spinner" + showValue dev-warns (nothing to show)', () => {
		const warnSpy = silenceWarn();
		render(Loading, { variant: 'spinner', showValue: true, label: 'Saving' });
		expect(warnSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes('showValue'))).toBe(
			true
		);
		warnSpy.mockRestore();
	});

	it('the spinner glyph and the dots are aria-hidden', () => {
		const { container: spinnerContainer } = render(Loading, {
			variant: 'spinner',
			label: 'Saving'
		});
		const svg = spinnerContainer.querySelector('.hz-loading-spinner svg');
		expect(svg?.getAttribute('aria-hidden')).toBe('true');

		const { container: dotsContainer } = render(Loading, { variant: 'dots', label: 'Loading' });
		for (const dot of dotsContainer.querySelectorAll('.hz-loading-dot')) {
			expect(dot.getAttribute('aria-hidden')).toBe('true');
		}
	});
});

// ---------------------------------------------------------------------------
// Loading-R6 — Accessible name
// ---------------------------------------------------------------------------

describe('Loading-R6 — accessible name', () => {
	it('no label / no aria-label(ledby) dev-warns citing 4.1.2', () => {
		const warnSpy = silenceWarn();
		render(Loading, { value: 10 });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('4.1.2');
		warnSpy.mockRestore();
	});

	it('label lands as aria-label on the bar progressbar element', () => {
		const { container } = render(Loading, { value: 10, label: 'Uploading photos' });
		const bar = getLoading(container).querySelector('progress.hz-loading-bar');
		expect(bar?.getAttribute('aria-label')).toBe('Uploading photos');
	});

	it('label lands as aria-label on the spinner progressbar element', () => {
		const { container } = render(Loading, { variant: 'spinner', label: 'Saving' });
		const spinner = getLoading(container).querySelector('.hz-loading-spinner');
		expect(spinner?.getAttribute('aria-label')).toBe('Saving');
	});

	it('label lands as aria-label on the dots progressbar element', () => {
		const { container } = render(Loading, { variant: 'dots', label: 'Loading' });
		const dots = getLoading(container).querySelector('.hz-loading-dots');
		expect(dots?.getAttribute('aria-label')).toBe('Loading');
	});

	it('an aria-labelledby in rest suppresses the warning and lands on the bar', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Loading, {
			value: 10,
			'aria-labelledby': 'external-label'
		} as Record<string, unknown>);
		expect(warnSpy).not.toHaveBeenCalled();
		const bar = getLoading(container).querySelector('progress.hz-loading-bar');
		expect(bar?.getAttribute('aria-labelledby')).toBe('external-label');
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Loading-R7 — Value readout & format
// ---------------------------------------------------------------------------

describe('Loading-R7 — value readout and format', () => {
	it('showValue renders .hz-loading-value with the default percentage', () => {
		const { container } = render(Loading, { value: 25, showValue: true, label: 'Loading' });
		const output = getLoading(container).querySelector('.hz-loading-value');
		expect(output?.tagName.toLowerCase()).toBe('output');
		expect(output?.textContent).toBe('25%');
	});

	it('showValue is absent on an indeterminate bar (no readout)', () => {
		const { container } = render(Loading, { showValue: true, label: 'Loading' });
		expect(getLoading(container).querySelector('.hz-loading-value')).toBeNull();
	});

	it('showValue on an indeterminate spinner or on dots renders no readout', () => {
		const warnSpy = silenceWarn();
		const spinner = render(Loading, { variant: 'spinner', showValue: true, label: 'Saving' });
		expect(spinner.container.querySelector('.hz-loading-value')).toBeNull();
		const dots = render(Loading, { variant: 'dots', showValue: true, label: 'Loading' });
		expect(dots.container.querySelector('.hz-loading-value')).toBeNull();
		warnSpy.mockRestore();
	});

	it('showValue on a determinate ring (spinner + value) renders a centered .hz-loading-value span', () => {
		const { container } = render(Loading, {
			variant: 'spinner',
			value: 25,
			showValue: true,
			label: 'Uploading'
		});
		const readout = getLoading(container).querySelector('.hz-loading-value');
		expect(readout?.tagName.toLowerCase()).toBe('span');
		expect(readout?.textContent).toBe('25%');
	});
});

// ---------------------------------------------------------------------------
// Loading-R8 — Reference theme recipe pin (color, timing hooks)
// ---------------------------------------------------------------------------

/** Resolve a CSS color expression via a throwaway probe, like Banner's spec. */
function resolveColor(varExpression: string): string {
	const probe = document.createElement('div');
	probe.style.cssText = `color: ${varExpression}`;
	document.body.appendChild(probe);
	const resolved = getComputedStyle(probe).color;
	document.body.removeChild(probe);
	return resolved;
}

/** Resolve --hz-loading-fill as it actually cascades onto the root. */
function resolveFill(root: HTMLElement): string {
	const probe = document.createElement('div');
	probe.style.cssText = 'color: var(--hz-loading-fill)';
	root.appendChild(probe);
	const resolved = getComputedStyle(probe).color;
	root.removeChild(probe);
	return resolved;
}

/** Resolve a <time> custom property (in ms) as it cascades onto root. */
function resolveTimeMs(root: HTMLElement, varExpression: string): number {
	const probe = document.createElement('div');
	probe.style.cssText = `transition-duration: ${varExpression}`;
	root.appendChild(probe);
	const resolved = getComputedStyle(probe).transitionDuration;
	root.removeChild(probe);
	return resolved.endsWith('ms') ? parseFloat(resolved) : parseFloat(resolved) * 1000;
}

/** Resolve a <timing-function> custom property as it cascades onto root. */
function resolveEasing(root: HTMLElement, varExpression: string): string {
	const probe = document.createElement('div');
	probe.style.cssText = `transition-timing-function: ${varExpression}`;
	root.appendChild(probe);
	const resolved = getComputedStyle(probe).transitionTimingFunction;
	root.removeChild(probe);
	return resolved;
}

describe('Loading-R8 — recipe pin: color', () => {
	it('--hz-loading-fill resolves to the active intent token across all three variants', () => {
		for (const variant of ['bar', 'spinner', 'dots'] as const) {
			const { container } = render(Loading, { variant, intent: 'danger', label: 'Loading' });
			expect(resolveFill(getLoading(container))).toBe(resolveColor('var(--hz-intent-danger)'));
		}
	});

	it('the default intent resolves --hz-loading-fill to primary', () => {
		const { container } = render(Loading, { value: 50, label: 'Loading' });
		expect(resolveFill(getLoading(container))).toBe(resolveColor('var(--hz-intent-primary)'));
	});
});

describe('Loading-R8 — recipe pin: paired speed + ease hooks', () => {
	it('--hz-loading-speed defaults to 6x --hz-duration-base (Decision 8b, ~2.4s)', () => {
		const { container } = render(Loading, { label: 'Loading' });
		const root = getLoading(container);
		expect(resolveTimeMs(root, 'var(--hz-loading-speed)')).toBeCloseTo(2400, 0);
	});

	it('--hz-loading-ease defaults to --hz-ease-standard', () => {
		const { container } = render(Loading, { label: 'Loading' });
		const root = getLoading(container);
		expect(resolveEasing(root, 'var(--hz-loading-ease)')).toBe(
			resolveEasing(root, 'var(--hz-ease-standard)')
		);
	});

	it('a wrapper override changes both --hz-loading-speed and --hz-loading-ease', () => {
		const { container } = render(Loading, {
			label: 'Loading',
			style: '--hz-loading-speed: 800ms; --hz-loading-ease: linear'
		} as Record<string, unknown>);
		const root = getLoading(container);
		expect(resolveTimeMs(root, 'var(--hz-loading-speed)')).toBeCloseTo(800, 0);
		expect(resolveEasing(root, 'var(--hz-loading-ease)')).toBe('linear');
	});

	it("the spinner's computed animation-timing-function is linear even when --hz-loading-ease is overridden (Decision 7)", () => {
		const { container } = render(Loading, {
			variant: 'spinner',
			label: 'Saving',
			style: '--hz-loading-ease: ease-in-out'
		} as Record<string, unknown>);
		const svg = getLoading(container).querySelector('svg.hz-icon') as SVGElement;
		expect(getComputedStyle(svg).animationTimingFunction).toBe('linear');
	});

	it('the bar sweep is always linear even when --hz-loading-ease is overridden (Decision 8, seamless loop)', () => {
		// A looping translate must run at constant velocity or it hiccups at the
		// loop seam — so the bar sweep, like the spinner (Decision 7), ignores
		// the ease hook. Only the dots pick it up (asserted below).
		const barResult = render(Loading, {
			label: 'Loading',
			style: '--hz-loading-ease: ease-in-out'
		} as Record<string, unknown>);
		const bar = getLoading(barResult.container).querySelector('.hz-loading-bar') as HTMLElement;
		expect(getComputedStyle(bar).animationTimingFunction).toBe('linear');
	});

	it('the dots pick up an overridden --hz-loading-ease', () => {
		const dotsResult = render(Loading, {
			variant: 'dots',
			label: 'Loading',
			style: '--hz-loading-ease: linear'
		} as Record<string, unknown>);
		const dot = getLoading(dotsResult.container).querySelector('.hz-loading-dot') as HTMLElement;
		expect(getComputedStyle(dot).animationTimingFunction).toBe('linear');
	});

	it('the bar sweep runs at 1.6x the spinner/dots cadence (Decision 8, calmer default)', () => {
		const barResult = render(Loading, { label: 'Loading' });
		const bar = getLoading(barResult.container).querySelector('.hz-loading-bar') as HTMLElement;
		const barDuration = parseFloat(getComputedStyle(bar).animationDuration);

		const spinnerResult = render(Loading, { variant: 'spinner', label: 'Saving' });
		const svg = getLoading(spinnerResult.container).querySelector('svg.hz-icon') as SVGElement;
		const spinnerDuration = parseFloat(getComputedStyle(svg).animationDuration);

		expect(barDuration).toBeCloseTo(spinnerDuration * 1.6, 1);
	});

	it('a determinate bar has no animation (the value-shown static fill, R3)', () => {
		const { container } = render(Loading, { value: 50, label: 'Loading' });
		const bar = getLoading(container).querySelector('.hz-loading-bar') as HTMLElement;
		expect(getComputedStyle(bar).animationName).toBe('none');
	});

	it('a determinate ring has no animation (static arc, R3)', () => {
		const { container } = render(Loading, { variant: 'spinner', value: 50, label: 'Loading' });
		const ring = getLoading(container).querySelector('.hz-loading-ring') as SVGElement;
		expect(getComputedStyle(ring).animationName).toBe('none');
	});

	it('--hz-loading-ring-width defaults to --hz-loading-size / 8', () => {
		const { container } = render(Loading, { variant: 'spinner', value: 50, label: 'Loading' });
		const root = getLoading(container);
		const probe = document.createElement('div');
		probe.style.cssText = 'width: var(--hz-loading-size)';
		root.appendChild(probe);
		const sizePx = parseFloat(getComputedStyle(probe).width);
		root.removeChild(probe);

		const widthProbe = document.createElement('div');
		widthProbe.style.cssText = 'width: var(--hz-loading-ring-width)';
		root.appendChild(widthProbe);
		const widthPx = parseFloat(getComputedStyle(widthProbe).width);
		root.removeChild(widthProbe);

		expect(widthPx).toBeCloseTo(sizePx / 8, 0);
	});
});

// ---------------------------------------------------------------------------
// Loading-R8/R9 — reduced motion is the deliberate exception: SLOWS, does
// NOT halt (Decision 9). Forces prefers-reduced-motion via the real Chrome
// DevTools Protocol media emulation (cdp().send('Emulation.setEmulatedMedia'))
// rather than a CSS-text scan, so this pins the actual computed animation
// state under a genuinely forced reduced-motion context.
// ---------------------------------------------------------------------------

describe('Loading-R8/R9 — reduced motion slows, does not halt', () => {
	it('the spinner keeps animating at ~2x the duration under reduced motion (Decision 9, re-picked against the 2.4s base)', async () => {
		const { container } = render(Loading, { variant: 'spinner', label: 'Saving' });
		const svg = getLoading(container).querySelector('svg.hz-icon') as SVGElement;
		const normalDuration = parseFloat(getComputedStyle(svg).animationDuration);

		await forceReducedMotion();

		expect(getComputedStyle(svg).animationName).not.toBe('none');
		const reducedDuration = parseFloat(getComputedStyle(svg).animationDuration);
		expect(reducedDuration).toBeCloseTo(normalDuration * 2, 1);
		expect(reducedDuration).toBeGreaterThan(normalDuration * 1.5);
	});

	it('the dots keep animating at ~2x the duration under reduced motion', async () => {
		const { container } = render(Loading, { variant: 'dots', label: 'Loading' });
		const dot = getLoading(container).querySelector('.hz-loading-dot') as HTMLElement;
		const normalDuration = parseFloat(getComputedStyle(dot).animationDuration);

		await forceReducedMotion();

		expect(getComputedStyle(dot).animationName).not.toBe('none');
		const reducedDuration = parseFloat(getComputedStyle(dot).animationDuration);
		expect(reducedDuration).toBeCloseTo(normalDuration * 2, 1);
		expect(reducedDuration).toBeGreaterThan(normalDuration * 1.5);
	});

	it('the indeterminate bar swaps the sweep for the pulse keyframes under reduced motion — still animating, not frozen', async () => {
		const { container } = render(Loading, { label: 'Loading' });
		const bar = getLoading(container).querySelector('.hz-loading-bar') as HTMLElement;
		expect(getComputedStyle(bar).animationName).toBe('hz-loading-bar-sweep');

		await forceReducedMotion();

		expect(getComputedStyle(bar).animationName).toBe('hz-loading-bar-pulse');
		expect(getComputedStyle(bar).animationName).not.toBe('none');
	});

	it('the spinner stays linear under reduced motion too (Decision 7 still applies)', async () => {
		const { container } = render(Loading, { variant: 'spinner', label: 'Saving' });
		const svg = getLoading(container).querySelector('svg.hz-icon') as SVGElement;

		await forceReducedMotion();

		expect(getComputedStyle(svg).animationTimingFunction).toBe('linear');
	});

	it('the determinate ring has no animation in either context (static, unaffected by reduced motion)', async () => {
		const { container } = render(Loading, { variant: 'spinner', value: 40, label: 'Uploading' });
		const ring = getLoading(container).querySelector('.hz-loading-ring') as SVGElement;
		expect(getComputedStyle(ring).animationName).toBe('none');

		await forceReducedMotion();

		expect(getComputedStyle(ring).animationName).toBe('none');
	});

	it('the determinate bar has no animation in either context (static, unaffected by reduced motion)', async () => {
		const { container } = render(Loading, { value: 40, label: 'Uploading' });
		const bar = getLoading(container).querySelector('.hz-loading-bar') as HTMLElement;
		expect(getComputedStyle(bar).animationName).toBe('none');

		await forceReducedMotion();

		expect(getComputedStyle(bar).animationName).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// Loading-R15 — Barrel export
// ---------------------------------------------------------------------------

describe('Loading-R15 — barrel export', () => {
	it('Loading resolves from $lib and smoke-renders', async () => {
		const warnSpy = silenceWarn();
		const { Loading: L } = await import('$lib');
		expect(L).toBeDefined();
		const { container } = render(L, { value: 50, label: 'Loading' });
		expect(container.querySelector('.hz-loading')).not.toBeNull();
		warnSpy.mockRestore();
	});
});
