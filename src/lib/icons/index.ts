/**
 * @hyzer-labs/ui icon components.
 *
 * Re-exports the full generated Lucide barrel — `src/lib/icons/generated/`
 * is produced by `pnpm gen:icons` (wired into `prepare` and as a pre-step of
 * `package`) and gitignored, never committed. Tree-shaking keeps a consuming
 * app's bundle to only the icons it imports.
 *
 * Two other tiers exist beyond this zero-config barrel:
 *  - Deep imports — `@hyzer-labs/ui/icons/<kebab-name>` — skip the barrel
 *    entirely for dev-server graph hygiene (see `./generated/<name>.svelte`
 *    locally; `./core.js` documents the always-shipped core set).
 *  - Config — a consumer's `hyzer.config.ts` `icons: [...]` + `hyzer
 *    generate` emits a curated project-local barrel.
 */
export type { IconProps } from './types.js';
export * from './generated/index.js';
