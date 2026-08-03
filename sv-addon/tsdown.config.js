import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.js', 'src/sv-utils.js'],
	format: 'esm',
	// Pin the tsconfig to this package's own jsconfig. Left to discovery,
	// tsdown walks up to the repo root's tsconfig.json, which extends the
	// generated .svelte-kit/tsconfig.json that only exists after the main
	// package's own build (absent in the addon's isolated CI job).
	tsconfig: 'jsconfig.json'
});
