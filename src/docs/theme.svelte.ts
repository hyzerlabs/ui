/**
 * Docs-site theme choice — shared because two shells need it: the landing
 * page's header and the docs shell's topbar/sidebar. Keeping it in a module
 * rather than the root layout means the toggle can live anywhere without
 * prop-drilling or context plumbing through a layout boundary.
 *
 * Two separate things, deliberately: whether the reader has made an EXPLICIT
 * choice, and what the system prefers. `choice === null` means "no choice
 * yet" — the attribute stays off entirely and the tokens sheet's
 * `@media (prefers-color-scheme: dark) :root:not([data-theme])` block does
 * the work, so following the system needs no JS and stays live if the reader
 * changes it mid-session. `systemDark` exists only so the button can show the
 * right icon while no choice is in force.
 */
import { prefersReducedMotion } from 'svelte/motion';

const STORAGE_KEY = 'hz-theme';

/** The shipped default theme's name — the one literal every write below reads from. */
export const DEFAULT_THEME = 'default';

export const themeState = $state({
	choice: null as typeof DEFAULT_THEME | 'dark' | null,
	systemDark: false
});

/** What the page is actually showing right now. */
export function isDark(): boolean {
	return themeState.choice ? themeState.choice === 'dark' : themeState.systemDark;
}

/**
 * Restore a stored choice and track the system preference. Returns a cleanup
 * for the media-query listener; call from an `$effect` in the root layout.
 */
export function initTheme(): () => void {
	// A stored 'light' from before the rename no longer validates, so a
	// returning reader with it in storage follows their system preference
	// again until they press the toggle.
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === DEFAULT_THEME || stored === 'dark') themeState.choice = stored;

	const query = window.matchMedia('(prefers-color-scheme: dark)');
	themeState.systemDark = query.matches;
	const onChange = (e: MediaQueryListEvent) => (themeState.systemDark = e.matches);
	query.addEventListener('change', onChange);
	return () => query.removeEventListener('change', onChange);
}

let transitionTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Flip to the opposite of what is showing, and record it as an explicit
 * choice. Writing the choice matters: the sheet's system default is
 * `:root:not([data-theme])`, so *removing* the attribute to mean the default
 * theme would hand a system-dark reader dark mode and make the default half
 * of the toggle do nothing.
 */
export function toggleTheme(): void {
	if (!prefersReducedMotion.current) {
		document.documentElement.classList.add('theme-transition');
		clearTimeout(transitionTimer);
		// Transitions run 250ms, but the flip triggers a full-page style recalc
		// that can jank the last frames — removing the class while one is still
		// in flight cancels it and the colors snap. The margin absorbs that.
		transitionTimer = setTimeout(() => {
			document.documentElement.classList.remove('theme-transition');
		}, 500);
	}
	themeState.choice = isDark() ? DEFAULT_THEME : 'dark';
	localStorage.setItem(STORAGE_KEY, themeState.choice);
}
