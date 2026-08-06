import { describe, it, expect, beforeEach } from 'vitest';
import { resolveConfig } from '../lib/config/index.js';
import { DEFAULT_THEME, themeState, toggleTheme } from './theme.svelte.js';

/**
 * specs/68 R6 — the docs site's own toggle must follow the shipped default,
 * or the light half of the toggle silently writes a dead attribute value
 * once the sheet has no `[data-theme='light']` block left. The first case
 * below is the gate: it fails the moment the schema default
 * (`resolveConfig().defaultThemeName`) and this module's own literal drift
 * apart.
 */
describe('DEFAULT_THEME', () => {
	it('equals resolveConfig().defaultThemeName', () => {
		expect(DEFAULT_THEME).toBe(resolveConfig().defaultThemeName);
	});
});

describe('toggleTheme', () => {
	beforeEach(() => {
		themeState.choice = null;
		themeState.systemDark = false;
	});

	it('flips from the default to dark', () => {
		toggleTheme();
		expect(themeState.choice).toBe('dark');
	});

	it('toggling twice returns to DEFAULT_THEME', () => {
		toggleTheme();
		toggleTheme();
		expect(themeState.choice).toBe(DEFAULT_THEME);
	});
});
