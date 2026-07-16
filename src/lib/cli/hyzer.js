#!/usr/bin/env node
// @hyzer-labs/ui — `hyzer` bin entry (specs/29 R9).
// Hand-authored .js so svelte-package copies it verbatim and the shebang
// survives packaging; all real logic lives in main.ts → dist/cli/main.js.
import('./main.js').then(async ({ run }) => {
	process.exitCode = await run(process.argv.slice(2));
});
