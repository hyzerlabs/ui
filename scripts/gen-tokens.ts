/**
 * Regenerate src/lib/tokens/tokens.css from the token engine (specs/29 R6).
 * Run via `pnpm gen:tokens`. The drift test (src/lib/config/config.spec.ts)
 * fails CI when the committed file and the engine output diverge.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig, generateCss } from '../src/lib/config/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'src/lib/tokens/tokens.css');

writeFileSync(target, generateCss(resolveConfig()));
console.log(`wrote ${target}`);
