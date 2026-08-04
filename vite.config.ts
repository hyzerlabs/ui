import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	/* Pre-bundle esm-env up front: without this, vite discovers it mid-test-run
	   ("new dependencies optimized: esm-env") and reloads live tests, which
	   vitest itself warns causes failures and flaky behavior. CI hits this
	   because its dependency scan aborts (docs pages self-import package
	   subpaths that resolve only once dist/ exists) and pre-bundling is
	   skipped entirely. */
	optimizeDeps: {
		include: ['esm-env']
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: '404.html' })
		})
	],
	test: {
		expect: { requireAssertions: true },
		// The browser fires this when an observation cycle re-triggers within
		// itself — Header's measured-mode tests do exactly that (measure, then
		// hide the bar nav). It is benign and self-settling, but the browser
		// logs it as a window error, which vitest-browser would surface as
		// unhandled noise on every full-suite run.
		onUnhandledError(error) {
			if (String(error.message).includes('ResizeObserver loop')) return false;
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					// A few server tests import the whole `$lib` barrel, which cold-
					// compiles every component through the SvelteKit SSR transform
					// (~0.6s alone). Run together with the browser project, Playwright
					// saturates the CPU and starves that transform past the 5s default,
					// so those imports flake. 20s wasn't enough headroom on CI's actual
					// (lower-core) runner — the icon barrel alone cold-compiles ~1750
					// generated components. A genuine hang still fails, just later.
					testTimeout: 45000,
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
