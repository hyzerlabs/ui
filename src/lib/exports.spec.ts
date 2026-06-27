import { describe, it, expect } from 'vitest';

/**
 * Verifies every subpath export resolves and exposes its public API.
 */
describe('subpath exports', () => {
	it('$lib (.) — exports Button, Link, layout primitives, Nav, Footer, Image, Video, Card, Hero, Modal, Accordion, and Tabs', async () => {
		const mod = await import('$lib');
		expect(mod.Button).toBeDefined();
		expect(mod.Link).toBeDefined();
		expect(mod.Container).toBeDefined();
		expect(mod.Stack).toBeDefined();
		expect(mod.Cluster).toBeDefined();
		expect(mod.Grid).toBeDefined();
		expect(mod.Split).toBeDefined();
		expect(mod.Nav).toBeDefined();
		expect(mod.Footer).toBeDefined();
		expect(mod.Image).toBeDefined();
		expect(mod.Video).toBeDefined();
		expect(mod.Card).toBeDefined();
		expect(mod.Hero).toBeDefined();
		expect(mod.Modal).toBeDefined();
		expect(mod.Accordion).toBeDefined();
		expect(mod.Tabs).toBeDefined();
	});

	it('$lib/tokens — exports tokens object', async () => {
		const mod = await import('$lib/tokens');
		expect(mod.tokens).toBeDefined();
		expect(mod.tokens.prefix).toBe('--hz');
	});

	it('$lib/icons — exports all 21 icon components (R10)', async () => {
		const mod = await import('$lib/icons');
		// UI icons (R7)
		expect(mod.IconChevronDown).toBeDefined();
		expect(mod.IconChevronRight).toBeDefined();
		expect(mod.IconChevronUp).toBeDefined();
		expect(mod.IconChevronLeft).toBeDefined();
		expect(mod.IconX).toBeDefined();
		expect(mod.IconMenu).toBeDefined();
		expect(mod.IconExternalLink).toBeDefined();
		expect(mod.IconCheck).toBeDefined();
		expect(mod.IconMinus).toBeDefined();
		expect(mod.IconPlus).toBeDefined();
		expect(mod.IconSearch).toBeDefined();
		expect(mod.IconLoader).toBeDefined();
		expect(mod.IconArrowLeft).toBeDefined();
		expect(mod.IconArrowRight).toBeDefined();
		// Brand icons (R8)
		expect(mod.IconGithub).toBeDefined();
		expect(mod.IconLinkedin).toBeDefined();
		expect(mod.IconTwitterX).toBeDefined();
		expect(mod.IconFacebook).toBeDefined();
		expect(mod.IconInstagram).toBeDefined();
		expect(mod.IconYoutube).toBeDefined();
		expect(mod.IconRss).toBeDefined();
	});

	it('$lib/utils — exports cx and uid functions', async () => {
		const mod = await import('$lib/utils');
		expect(typeof mod.cx).toBe('function');
		expect(typeof mod.uid).toBe('function');
	});

	it('$lib/types — module is importable (type-only exports have no runtime value)', async () => {
		const mod = await import('$lib/types');
		expect(mod).toBeDefined();
	});
});

/**
 * Sanity-checks on package.json metadata.
 */
describe('package.json metadata', () => {
	it('package name is @hyzer-labs/ui', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		expect(pkg.default.name).toBe('@hyzer-labs/ui');
	});

	it('exports map contains all required subpath keys', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		const exports = pkg.default.exports as Record<string, unknown>;
		expect(exports['.']).toBeDefined();
		expect(exports['./tokens']).toBeDefined();
		expect(exports['./tokens.css']).toBeDefined();
		expect(exports['./icons']).toBeDefined();
		expect(exports['./utils']).toBeDefined();
		expect(exports['./types']).toBeDefined();
		expect(exports['./theme']).toBeDefined();
		expect(exports['./theme/*.css']).toBeDefined();
	});
});
