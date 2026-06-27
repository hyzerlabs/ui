import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Component } from 'svelte';

// ---------------------------------------------------------------------------
// Representatives for shared-interface tests
// ---------------------------------------------------------------------------

import IconChevronDown from './IconChevronDown.svelte'; // representative UI icon
import IconGithub from './IconGithub.svelte'; // representative brand icon

// ---------------------------------------------------------------------------
// All 21 components for set-completeness tests
// ---------------------------------------------------------------------------

import IconChevronRight from './IconChevronRight.svelte';
import IconChevronUp from './IconChevronUp.svelte';
import IconChevronLeft from './IconChevronLeft.svelte';
import IconX from './IconX.svelte';
import IconMenu from './IconMenu.svelte';
import IconExternalLink from './IconExternalLink.svelte';
import IconCheck from './IconCheck.svelte';
import IconMinus from './IconMinus.svelte';
import IconPlus from './IconPlus.svelte';
import IconSearch from './IconSearch.svelte';
import IconLoader from './IconLoader.svelte';
import IconArrowLeft from './IconArrowLeft.svelte';
import IconArrowRight from './IconArrowRight.svelte';
import IconLinkedin from './IconLinkedin.svelte';
import IconTwitterX from './IconTwitterX.svelte';
import IconFacebook from './IconFacebook.svelte';
import IconInstagram from './IconInstagram.svelte';
import IconYoutube from './IconYoutube.svelte';
import IconRss from './IconRss.svelte';

// ---------------------------------------------------------------------------
// R2 — Decorative vs informative a11y
// ---------------------------------------------------------------------------

describe('R2 — decorative vs informative a11y (UI icon)', () => {
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

describe('R2 — decorative vs informative a11y (brand icon)', () => {
	it('omitting ariaLabel renders aria-hidden="true", no role', () => {
		const { container } = render(IconGithub);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('aria-hidden')).toBe('true');
		expect(svg!.hasAttribute('role')).toBe(false);
		expect(svg!.hasAttribute('aria-label')).toBe(false);
	});

	it('ariaLabel="GitHub" renders role="img", aria-label="GitHub", no aria-hidden', () => {
		const { container } = render(IconGithub, { ariaLabel: 'GitHub' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('role')).toBe('img');
		expect(svg!.getAttribute('aria-label')).toBe('GitHub');
		expect(svg!.hasAttribute('aria-hidden')).toBe(false);
	});

	it('ariaLabel="" is treated as decorative', () => {
		const { container } = render(IconGithub, { ariaLabel: '' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('aria-hidden')).toBe('true');
		expect(svg!.hasAttribute('role')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R3 — Sizing
// ---------------------------------------------------------------------------

describe('R3 — sizing', () => {
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

	it('brand icon: default size width="24" and height="24"', () => {
		const { container } = render(IconGithub);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('width')).toBe('24');
		expect(svg!.getAttribute('height')).toBe('24');
	});

	it('brand icon: size={32} sets width="32" and height="32"', () => {
		const { container } = render(IconGithub, { size: 32 });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('width')).toBe('32');
		expect(svg!.getAttribute('height')).toBe('32');
	});
});

// ---------------------------------------------------------------------------
// R4 — Color inheritance
// ---------------------------------------------------------------------------

describe('R4 — color inheritance', () => {
	it('UI icon has stroke="currentColor" and fill="none"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke')).toBe('currentColor');
		expect(svg!.getAttribute('fill')).toBe('none');
	});

	it('brand icon has fill="currentColor" and no stroke attribute', () => {
		const { container } = render(IconGithub);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('fill')).toBe('currentColor');
		expect(svg!.hasAttribute('stroke')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R5 — Class hook
// ---------------------------------------------------------------------------

describe('R5 — class hook', () => {
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

	it('brand icon default class is exactly "hz-icon"', () => {
		const { container } = render(IconGithub);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('class')).toBe('hz-icon');
	});

	it('brand icon class="custom" results in "hz-icon custom"', () => {
		const { container } = render(IconGithub, { class: 'custom' });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('class')).toBe('hz-icon custom');
	});
});

// ---------------------------------------------------------------------------
// R6 — UI icon stroke weight / brand icon no stroke-width
// ---------------------------------------------------------------------------

describe('R6 — stroke weight', () => {
	it('UI icon default stroke-width is "2"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke-width')).toBe('2');
	});

	it('strokeWidth={1.5} sets stroke-width="1.5" on a UI icon', () => {
		const { container } = render(IconChevronDown, { strokeWidth: 1.5 });
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke-width')).toBe('1.5');
	});

	it('UI icon has stroke-linecap="round" and stroke-linejoin="round"', () => {
		const { container } = render(IconChevronDown);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('stroke-linecap')).toBe('round');
		expect(svg!.getAttribute('stroke-linejoin')).toBe('round');
	});

	it('brand icon renders no stroke-width attribute by default', () => {
		const { container } = render(IconGithub);
		const svg = container.querySelector('svg');
		expect(svg!.hasAttribute('stroke-width')).toBe(false);
	});

	it('strokeWidth prop on a brand icon has no visual effect (no stroke-width rendered)', () => {
		const { container } = render(IconGithub, { strokeWidth: 1 });
		const svg = container.querySelector('svg');
		expect(svg!.hasAttribute('stroke-width')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R7 / R8 — Set completeness: all 21 components render svg.hz-icon
// ---------------------------------------------------------------------------

describe('R7/R8 — set completeness', () => {
	const allIcons: Array<[string, Component]> = [
		// UI icons (R7)
		['IconChevronDown', IconChevronDown as Component],
		['IconChevronRight', IconChevronRight as Component],
		['IconChevronUp', IconChevronUp as Component],
		['IconChevronLeft', IconChevronLeft as Component],
		['IconX', IconX as Component],
		['IconMenu', IconMenu as Component],
		['IconExternalLink', IconExternalLink as Component],
		['IconCheck', IconCheck as Component],
		['IconMinus', IconMinus as Component],
		['IconPlus', IconPlus as Component],
		['IconSearch', IconSearch as Component],
		['IconLoader', IconLoader as Component],
		['IconArrowLeft', IconArrowLeft as Component],
		['IconArrowRight', IconArrowRight as Component],
		// Brand icons (R8)
		['IconGithub', IconGithub as Component],
		['IconLinkedin', IconLinkedin as Component],
		['IconTwitterX', IconTwitterX as Component],
		['IconFacebook', IconFacebook as Component],
		['IconInstagram', IconInstagram as Component],
		['IconYoutube', IconYoutube as Component],
		['IconRss', IconRss as Component]
	];

	for (const [name, Icon] of allIcons) {
		it(`${name} renders an <svg class="hz-icon"> without throwing`, () => {
			const { container } = render(Icon);
			const svg = container.querySelector('svg.hz-icon');
			expect(svg, `${name} should render svg.hz-icon`).not.toBeNull();
		});
	}
});

// ---------------------------------------------------------------------------
// R12 — Rest forwarding and attribute precedence
// ---------------------------------------------------------------------------

describe('R12 — rest forwarding and precedence', () => {
	it('rest fill="red" overrides default fill="none" on a UI icon', () => {
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

	it('rest fill="blue" overrides default fill on a brand icon', () => {
		const { container } = render(IconGithub, { fill: 'blue' } as Record<string, unknown>);
		const svg = container.querySelector('svg');
		expect(svg!.getAttribute('fill')).toBe('blue');
	});
});
