import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testMatch: '**/*.e2e.{ts,js}',
	// Agent worktrees under .claude/ carry their own node_modules, including a
	// second Playwright — matching their specs loads the library twice and the
	// run dies before any test executes.
	testIgnore: '**/.claude/**'
});
