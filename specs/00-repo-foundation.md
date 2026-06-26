# Phase 0 — Repo Foundation & Scaffolding

## Goal

Stand up a single SvelteKit-library repository that publishes the headless `@hyzer-labs/ui` package from `src/lib/` and serves the dogfooding docs site from `src/routes/`, with build, test, lint, release, and CI tooling wired up — but no components yet.

## Requirements

1. **Project type.** Repo is a SvelteKit project configured in library mode: `@sveltejs/package` (`svelte-package`) builds the distributable from `src/lib/`; the SvelteKit app under `src/routes/` is the docs site. A single `package.json` drives both. Generate the base with `npx sv create` selecting the library project type rather than hand-rolling config.

2. **Svelte 5 + runes.** Svelte 5 is installed and runes mode is the default. A trivial placeholder component in `src/lib/` uses a rune (e.g. `$props()`) to prove the toolchain compiles runes.

3. **TypeScript.** `tsconfig.json` extends `./.svelte-kit/tsconfig.json` with `strict: true` and `moduleResolution: "bundler"`. `svelte-check` runs clean. All library source is `.ts`/`.svelte` with typed props.

4. **Package metadata.** `package.json` declares:
   - `"name": "@hyzer-labs/ui"` (registered scope; the architecture doc's `@hyzer/ui` examples will be reconciled to this name in the docs spec)
   - `"version": "0.0.0"`, `"type": "module"`
   - `"sideEffects"` listing only the `.css` files
   - `"files": ["dist"]`
   - `"publishConfig": { "access": "public" }`
   - `"license": "MIT"`
   - `"engines": { "node": ">=22" }`
   - repository, `"homepage": "https://design.hyzer.sh"`, and bugs URLs.

5. **Subpath exports.** The `"exports"` map exposes every entry point named in `original-specs/00-architecture.md`, each pointing into `dist/` with `types` + `svelte`/`default` conditions:
   - `.` → components barrel
   - `./tokens` (JS) and `./tokens.css` (CSS)
   - `./icons`
   - `./utils`
   - `./types`
   - `./theme` and `./theme/*.css` (wildcard subpath for per-component theme files)

   Every declared export resolves to a real placeholder file in `dist/` so `svelte-package`, `publint`, and `attw` pass. Subpath `types` conditions must resolve under `moduleResolution: "bundler"`.

6. **Source layout.** `src/lib/` is organized into the seams `original-specs/17-build-order.md` assumes, each with an `index.ts` barrel and one compiling placeholder export:

   ```
   src/lib/
     components/   → re-exported from src/lib/index.ts (the "." entry)
     tokens/       → tokens.ts (+ tokens.css)
     icons/
     utils/
     types/        → NavItem, FooterColumn, Size, Intent, Variant (from architecture doc)
     theme/        → theme.css (+ per-component css placeholders)
     index.ts
   ```

   `src/lib/index.ts` is the `.` barrel. No real components — only compiling placeholders that the Sprint 1 specs will replace. The shared `NavItem` and `FooterColumn` interfaces from `original-specs/00-architecture.md` are defined in `src/lib/types/`.

7. **Docs site shell.** `src/routes/` renders a working SvelteKit app: a root `+layout.svelte`, a landing `+page.svelte`, and a `/components` placeholder route. The landing page imports the placeholder from `$lib` to prove the package resolves internally via the `$lib` alias. No real docs content yet.

8. **Deployment adapter.** The docs site uses `@sveltejs/adapter-static`, configured to produce a fully static build suitable for hosting on **Cloudflare Pages** (prerender all routes; SPA fallback only if a route requires it).

9. **Build scripts.** `package.json` scripts exist and succeed on a clean checkout: `dev` (docs), `build` (docs site static build), `package` (`svelte-package` → `dist/`), `prepublishOnly` (runs `package` + `publint`), `check` (`svelte-check`), `test`, `test:unit`, `test:e2e`, `lint`, `format`.

10. **Library build output.** Running `package` produces `dist/` containing compiled `.svelte`, `.js`, `.d.ts`, and copied `.css` for every export entry. `publint` and `@arethetypeswrong/cli` (`attw`) report no errors against the built package.

11. **Lint + format.** ESLint (flat config, with `eslint-plugin-svelte`) and Prettier (with `prettier-plugin-svelte`) are configured and pass on the scaffold. Config files committed.

12. **Testing harness.** Vitest + `@testing-library/svelte` + `jsdom` are configured for unit tests with one passing smoke test against the placeholder component. Playwright is configured for e2e with one passing smoke test that loads the docs landing page.

13. **Versioning/release.** Changesets is initialized (`.changeset/` with config) for version management and changelog generation. No release is performed in this phase.

14. **Repo hygiene.** Present and committed: `.gitignore` (covering `node_modules`, `.svelte-kit`, `dist`, `build`, test artifacts, `.changeset` excepted), `.npmrc` if needed for pnpm, `LICENSE` (MIT), `README.md` (install + usage stub), `.nvmrc` pinning **Node 22 LTS**, and `.editorconfig`. The repo uses **pnpm** as its package manager (declared via `packageManager` field).

15. **CI.** A GitHub Actions workflow runs, on push/PR, using pnpm: install → `check` → `lint` → `test:unit` → `package` → `publint` → `attw`. `publint` and `attw` are hard gates (non-zero exit fails the build).

## Responsive Behavior

Scaffolding only ships the docs shell. The root `+layout.svelte` must render without horizontal scroll at mobile (<640px), tablet (640–1024px), and desktop (>1024px) — a single centered content column with a max-width is sufficient. Full responsive docs navigation is deferred to the docs-site spec (16).

## Accessibility

Docs shell baseline only:

- Valid document outline — one `<h1>` on the landing page.
- `lang` attribute on `<html>`.
- Visible `:focus-visible` ring not removed by reset CSS. No reset may set `outline: none` without a focus-visible replacement.
- A skip-to-content link in the root layout, focusable as the first tab stop.

Component-level a11y is owned by each component spec.

## Edge Cases & Error States

- **Fresh clone, no install:** scripts fail with a clear error, not a partial state. README documents "run `pnpm install` first."
- **`package` before `dev`:** `svelte-package` must not depend on a docs-site build; the two pipelines are independent.
- **Subpath import of a missing condition:** every declared export resolves to a real file — no export points at a nonexistent path (verified by `publint`).
- **Empty/stale `dist/`:** `prepublishOnly` regenerates `dist/`, so a stale or missing `dist` cannot be published.
- **Type resolution across consumer setups:** `attw` confirms subpath types resolve under both `bundler` and `node16` module resolution.
- **CSS side effects:** only the `.css` entries appear in `sideEffects`, preserving JS tree-shaking for consumers.

## Existing Code to Reuse

Greenfield — only `original-specs/` exists. The Builder MUST:

- Generate the base with the official SvelteKit scaffolder (`npx sv create`) selecting the **library** project type, TypeScript, ESLint, Prettier, Vitest, and Playwright, rather than hand-rolling config.
- Treat `original-specs/00-architecture.md` as the source of truth for the export map, the `data-*` / `--hz-*` conventions, and the `NavItem` / `FooterColumn` shared types (definitions go into `src/lib/types/`).
- Follow the seams in `original-specs/17-build-order.md` for the `src/lib/` folder layout.

## Test Plan

Frameworks: **Vitest** (unit) and **Playwright** (e2e), as configured by the SvelteKit scaffolder.

**Unit (Vitest + Testing Library):**

- R2/R6: placeholder component renders and exposes its prop → asserts runes compile and `$lib` resolves.
- R5: importing from each subpath (`@hyzer-labs/ui`, `/utils`, `/icons`, `/tokens`, `/types`) returns the expected placeholder export.

**Integration (build-level assertions, run in CI):**

- R10: after `package`, assert `dist/` contains `index.js`, `index.d.ts`, and the per-entry `.css` files; assert `publint` exit code 0 and `attw` exit code 0.
- R4/R5: assert `package.json` `exports` keys exactly match the architecture list and `name` is `@hyzer-labs/ui`.

**e2e (Playwright):**

- R7: docs landing page loads, `<h1>` is visible, skip link is focusable as the first tab stop.
- Responsive (R-Responsive): page has no horizontal overflow at 375px, 768px, and 1280px viewports.

## Out of Scope

- Any real component, token value, icon, utility, or theme style (owned by Sprint 1–4 specs).
- Docs-site content, token tools, or per-component pages (spec 16).
- The reference theme's actual styles (only empty placeholder CSS files exist).
- Publishing to npm or deploying the docs site to Cloudflare (tooling is wired; no release or deploy runs in this phase).
- Choosing brand colors, fonts, or visual design.
