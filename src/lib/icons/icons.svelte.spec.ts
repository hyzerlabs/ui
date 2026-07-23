import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Component } from 'svelte';
import { CORE_ICONS } from './core.js';

// ---------------------------------------------------------------------------
// specs/36 R2 — generated component contract, checked against a sample of
// generated icons (a representative UI icon, the full committed core set,
// and two Lucide names whose kebab → PascalCase mapping is awkward) rather
// than an exhaustive 1,748-icon sweep.
// ---------------------------------------------------------------------------

import IconChevronDown from './generated/chevron-down.svelte'; // representative icon
import IconAxis3d from './generated/axis-3d.svelte'; // awkward pascalize case
import IconAArrowDown from './generated/a-arrow-down.svelte'; // awkward pascalize case
import IconArrowLeft from './generated/arrow-left.svelte';
import IconArrowRight from './generated/arrow-right.svelte';
import IconCheck from './generated/check.svelte';
import IconChevronLeft from './generated/chevron-left.svelte';
import IconChevronRight from './generated/chevron-right.svelte';
import IconChevronUp from './generated/chevron-up.svelte';
import IconExternalLink from './generated/external-link.svelte';
import IconLoader from './generated/loader.svelte';
import IconMenu from './generated/menu.svelte';
import IconMinus from './generated/minus.svelte';
import IconPlus from './generated/plus.svelte';
import IconSearch from './generated/search.svelte';
import IconX from './generated/x.svelte';

// ---------------------------------------------------------------------------
// R2 — Decorative vs informative a11y
// ---------------------------------------------------------------------------

describe('R2 — decorative vs informative a11y', () => {
	it('omitting ariaLabel renders aria-hidden="true", no role, no aria-label', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg).not.toBeNull();
		expect(svg!.getAttribute('aria-hidden')).toBe('true');
		expect(svg!.hasAttribute('role')).toBe(false);
		expect(svg!.hasAttribute('aria-label')).toBe(false);
	});

	it('ariaLabel="Test" renders role="img", aria-label="Test", no aria-hidden', () => {
		const { container } = render(IconChevronDown, { ariaLabel: 'Test' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('role')).toBe('img');
		expect(svg!.getAttribute('aria-label')).toBe('Test');
		expect(svg!.hasAttribute('aria-hidden')).toBe(false);
	});

	it('ariaLabel="" is treated as decorative — aria-hidden="true", no role', () => {
		const { container } = render(IconChevronDown, { ariaLabel: '' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('aria-hidden')).toBe('true');
		expect(svg!.hasAttribute('role')).toBe(false);
		expect(svg!.hasAttribute('aria-label')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R2 — Sizing
// ---------------------------------------------------------------------------

describe('R2 — sizing', () => {
	it('default size: width="24" and height="24"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('width')).toBe('24');
		expect(svg!.getAttribute('height')).toBe('24');
	});

	it('size={16}: width="16" and height="16"', () => {
		const { container } = render(IconChevronDown, { size: 16 });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('width')).toBe('16');
		expect(svg!.getAttribute('height')).toBe('16');
	});

	it('viewBox is always "0 0 24 24" regardless of size', () => {
		const { container } = render(IconChevronDown, { size: 16 });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('viewBox')).toBe('0 0 24 24');
	});
});

// ---------------------------------------------------------------------------
// R2 — Color inheritance
// ---------------------------------------------------------------------------

describe('R2 — color inheritance', () => {
	it('stroke="currentColor" and fill="none"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke')).toBe('currentColor');
		expect(svg!.getAttribute('fill')).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// Amendment 2026-07-22 (specs/36, audit R9) — intent coloring
// ---------------------------------------------------------------------------

describe('intent coloring (amendment 2026-07-22)', () => {
	it('no intent: no data-intent, no style', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.hasAttribute('data-intent')).toBe(false);
		expect(svg!.hasAttribute('style')).toBe(false);
	});

	it('intent="danger" stamps data-intent and color: var(--hz-intent-danger)', () => {
		const { container } = render(IconChevronDown, { intent: 'danger' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('data-intent')).toBe('danger');
		expect(svg!.getAttribute('style')).toContain('color: var(--hz-intent-danger)');
	});

	it('consumer style comes after the intent color and can override it', () => {
		const { container } = render(IconChevronDown, {
			intent: 'danger',
			style: 'color: rgb(1, 2, 3);'
		});
		const svg = container.querySelector('svg');
		const style = svg!.getAttribute('style')!;
		expect(style.indexOf('--hz-intent-danger')).toBeLessThan(style.indexOf('rgb(1, 2, 3)'));
		expect(getComputedStyle(svg!).color).toBe('rgb(1, 2, 3)');
	});
});

// ---------------------------------------------------------------------------
// R2 — Class hook
// ---------------------------------------------------------------------------

describe('R2 — class hook', () => {
	it('default class attribute is exactly "hz-icon"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('class')).toBe('hz-icon');
	});

	it('class="foo bar" results in class="hz-icon foo bar"', () => {
		const { container } = render(IconChevronDown, { class: 'foo bar' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('class')).toBe('hz-icon foo bar');
	});
});

// ---------------------------------------------------------------------------
// R2 — Stroke weight
// ---------------------------------------------------------------------------

describe('R2 — stroke weight', () => {
	it('default stroke-width is "2"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke-width')).toBe('2');
	});

	it('strokeWidth={1.5} sets stroke-width="1.5"', () => {
		const { container } = render(IconChevronDown, { strokeWidth: 1.5 });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke-width')).toBe('1.5');
	});

	it('stroke-linecap="round" and stroke-linejoin="round"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke-linecap')).toBe('round');
		expect(svg!.getAttribute('stroke-linejoin')).toBe('round');
	});
});

// ---------------------------------------------------------------------------
// R1/R4 — Awkward pascalize cases render fine as real components
// ---------------------------------------------------------------------------

describe('R1 — awkward-name generated components render', () => {
	it('IconAxis3d (axis-3d, numeral-leading segment) renders svg.hz-icon', () => {
		const { container } = render(IconAxis3d);
		expect(container.querySelector('svg.hz-icon')).not.toBeNull();
	});

	it('IconAArrowDown (a-arrow-down, single-letter segment) renders svg.hz-icon', () => {
		const { container } = render(IconAArrowDown);
		expect(container.querySelector('svg.hz-icon')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R4 — Core set completeness: every CORE_ICONS entry renders svg.hz-icon
// ---------------------------------------------------------------------------

describe('R4 — core set completeness', () => {
	const coreComponents: Record<string, Component> = {
		'arrow-left': IconArrowLeft as Component,
		'arrow-right': IconArrowRight as Component,
		check: IconCheck as Component,
		'chevron-down': IconChevronDown as Component,
		'chevron-left': IconChevronLeft as Component,
		'chevron-right': IconChevronRight as Component,
		'chevron-up': IconChevronUp as Component,
		'external-link': IconExternalLink as Component,
		loader: IconLoader as Component,
		menu: IconMenu as Component,
		minus: IconMinus as Component,
		plus: IconPlus as Component,
		search: IconSearch as Component,
		x: IconX as Component
	};

	it('every CORE_ICONS entry has a corresponding rendering component in this test', () => {
		for (const name of CORE_ICONS) {
			expect(coreComponents[name], `no test component wired for core icon "${name}"`).toBeDefined();
		}
		expect(Object.keys(coreComponents).sort()).toEqual([...CORE_ICONS].sort());
	});

	for (const [name, Icon] of Object.entries(coreComponents)) {
		it(`${name} renders an <svg class="hz-icon"> without throwing`, () => {
			const { container } = render(Icon);
			const svg = container.querySelector('svg.hz-icon');
			expect(svg, `${name} should render svg.hz-icon`).not.toBeNull();
		});
	}
});

// ---------------------------------------------------------------------------
// R2 — Rest forwarding and attribute precedence
// ---------------------------------------------------------------------------

describe('R2 — rest forwarding and precedence', () => {
	it('rest fill="red" overrides default fill="none"', () => {
		const { container } = render(IconChevronDown, { fill: 'red' } as Record<string, unknown>);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('fill')).toBe('red');
	});

	it('rest data-testid="my-icon" is forwarded to the <svg>', () => {
		const { container } = render(IconChevronDown, {
			'data-testid': 'my-icon'
		} as Record<string, unknown>);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('data-testid')).toBe('my-icon');
	});

	it('consumer class prop is composed with hz-icon — hz-icon base always present', () => {
		const { container } = render(IconChevronDown, { class: 'z' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('class')).toBe('hz-icon z');
		expect(svg!.getAttribute('class')).toContain('hz-icon');
	});

	it('rest aria-hidden="false" does not override managed aria-hidden="true"', () => {
		const { container } = render(IconChevronDown, {
			'aria-hidden': 'false'
		} as Record<string, unknown>);
		const svg = container.querySelector('svg');
		// No ariaLabel → decorative; managed aria-hidden="true" wins
		expect(svg!.getAttribute('aria-hidden')).toBe('true');
	});

	it('rest width is ignored — managed width from size prop wins', () => {
		const { container } = render(IconChevronDown, { width: 99 } as Record<string, unknown>);
		const svg = container.querySelector('svg');
		// default size=24; managed width wins over rest
		expect(svg!.getAttribute('width')).toBe('24');
	});
});
