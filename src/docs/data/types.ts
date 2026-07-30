/**
 * Shared shape for the per-component doc modules.
 *
 * One component page's DocPage inputs, minus `name`: the registry in
 * index.ts supplies that as the object key, the same convention hooks.ts
 * uses for ComponentHooks. Keeping this in its own module (rather than
 * index.ts) lets every data/<slug>.ts import it without importing the
 * registry that imports them.
 */
import type { PropRow } from '../PropsTable.svelte';
import type { TypeTable, A11yLink } from '../DocPage.svelte';

export interface ComponentDoc {
	importLine: string;
	props?: PropRow[];
	/** Supporting item/option types rendered as sub-tables in the Props section. */
	types?: TypeTable[];
	/**
	 * Backtick-wrapped segments render as inline <code>, e.g. "sets `aria-busy`",
	 * and a blank line starts a new paragraph. That is the whole vocabulary:
	 * anything else, `**bold**` included, reaches the page as literal
	 * punctuation. Use a short sentence instead of emphasis.
	 */
	a11yNote?: string;
	/** APG pattern / MDN reference links rendered after the a11y note. */
	a11yLinks?: A11yLink[];
}
