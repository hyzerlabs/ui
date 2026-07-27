/**
 * `prismjs/components/*` ship no type declarations of their own — each is a
 * side-effect-only script that registers a grammar onto the shared `Prism`
 * global. This ambient wildcard module only satisfies the type-checker for
 * PrismCodeBlock.svelte's dynamic imports (CodeBlock-R17); it does not
 * describe any real exported shape.
 */
declare module 'prismjs/components/*.js';
