/**
 * @hyzer-labs/ui — theme attachment.
 *
 * Scopes a theme to a subtree: `{@attach theme('dark')}` on a `<section>`
 * themes that section and nothing else. Two forms —
 *
 *   {@attach theme('dark')}                        a theme named in hyzer.config.ts
 *   {@attach theme({ palette: { primary: '…' } })} an inline override
 *
 * This is a convenience, not a requirement. The named form does exactly what
 * `<section data-theme="dark">` does, written by hand; and a class scope
 * (`GenerateOptions.selector`) remains the general mechanism, the one that
 * composes with `[data-theme='dark']` for a theme × mode matrix. Nothing here
 * replaces either.
 *
 * Client-only, like every attachment: the named form is SSR-able if you write
 * the attribute into markup yourself, but an inline-object section paints
 * unthemed for one frame.
 */
import { DEV } from 'esm-env';
import type { HyzerThemeOverride } from '../config/schema.js';

/**
 * @param source A theme name — the `data-theme` value that activates a theme
 * from `hyzer.config.ts` — or an inline token override of the same shape as a
 * `themes` entry.
 */
export function theme(source: string | HyzerThemeOverride): (node: Element) => () => void {
	return (node: Element) => {
		// Attachments only ever run client-side; guard defensively anyway.
		if (typeof document === 'undefined') return () => {};

		if (typeof source === 'string') {
			// Capture/restore the prior attribute state (the lightboxGroup
			// precedent) — the element is the consumer's, not ours, and it may
			// already have carried a data-theme of its own.
			const previous = node.getAttribute('data-theme');
			node.setAttribute('data-theme', source);
			return () => {
				if (previous === null) node.removeAttribute('data-theme');
				else node.setAttribute('data-theme', previous);
			};
		}

		// Inline form. Custom properties inherit, so writing the resolved set
		// onto this element themes the whole subtree — no injected stylesheet,
		// no generated scope class, nothing to dedupe or garbage-collect.
		//
		// The resolver is import()-ed rather than imported: it carries the full
		// base token model, and consumers who only ever name a theme must not
		// pay for it in their main bundle.
		const el = node as HTMLElement;
		let applied: string[] = [];
		let disposed = false;

		import('../config/generate.js')
			.then(({ themeVars }) => {
				// A teardown that lands before the import resolves wins: apply
				// nothing, so there is nothing left behind to clean up.
				if (disposed) return;
				const vars = themeVars(source);
				applied = Object.keys(vars);
				for (const [name, value] of Object.entries(vars)) el.style.setProperty(name, value);
			})
			.catch((error) => {
				if (DEV) {
					console.warn('[hyzer-ui] theme(): could not apply the inline override.', error);
				}
			});

		return () => {
			disposed = true;
			for (const name of applied) el.style.removeProperty(name);
			applied = [];
		};
	};
}
