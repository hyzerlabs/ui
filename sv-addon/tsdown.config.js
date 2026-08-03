import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.js', 'src/sv-utils.js'],
	format: 'esm',
	// Plain JS: stop tsdown discovering the repo root's tsconfig, which
	// extends the generated .svelte-kit/tsconfig.json that only exists after
	// the main package's own build (absent in the addon's isolated CI job).
	tsconfig: false
});
