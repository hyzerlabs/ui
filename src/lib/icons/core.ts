/**
 * @hyzer-labs/ui — core icon set (specs/36 R4).
 *
 * The core icons are ordinary generated Lucide icons — same pipeline, same
 * files, nothing hand-drawn. What's committed here is only the *name list*:
 * a contract declaring which generated icons every `hyzer generate` trimmed
 * barrel must include, no matter what a consumer's `icons` config says (even
 * `icons: []`). The gitignored generated manifest can't hold this contract —
 * it doesn't exist until `pnpm gen:icons` runs — so this list is committed
 * source, kept in sync with reality by `src/lib/icons/core.spec.ts`, which
 * enforces both directions: every icon imported internally by
 * `src/lib/components/**` (and `src/lib/attachments/**`) is in this list,
 * and every entry here is a valid generated manifest name.
 *
 * Kebab-case Lucide names — the four chevrons, the load-bearing glyphs this
 * library's own components render internally.
 */
export const CORE_ICONS = [
	'arrow-left',
	'arrow-right',
	'check',
	'chevron-down',
	'chevron-left',
	'chevron-right',
	'chevron-up',
	'external-link',
	'loader',
	'menu',
	'minus',
	'plus',
	'search',
	'x'
] as const;

export type CoreIconName = (typeof CORE_ICONS)[number];
