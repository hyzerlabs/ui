/**
 * The conventions a coding agent needs to write correct code against this
 * library — the single source for BOTH the /docs/agents page and the
 * AGENTS.md file served at /agents.md.
 *
 * Bodies are written in markdown so one string serves both readers: the file
 * gets `backticks` verbatim, and the page renders the same spans as <code>.
 * Two hand-maintained copies of these rules would drift, and the drift would
 * land in generated code rather than in prose anyone proofreads.
 */

export interface AgentRule {
	/** Imperative heading — agents follow these literally, so keep them so. */
	title: string;
	/** Markdown prose. Inline code uses backticks. */
	body: string;
	/** Optional worked example, rendered as a fenced block in the file. */
	code?: { lang: string; source: string };
}

export const importSurface = [
	"import { Button, Modal, Combobox } from '@hyzer-labs/ui';   // components",
	"import { defineConfig } from '@hyzer-labs/ui/config';        // token engine",
	"import { reveal, fade } from '@hyzer-labs/ui/motion';        // motion",
	"import { intersect } from '@hyzer-labs/ui/observers';        // observers",
	"import IconSearch from '@hyzer-labs/ui/icons/search';        // one glyph at a time",
	"import { contrastRatio } from '@hyzer-labs/ui/utils';        // utilities",
	"import type { Intent } from '@hyzer-labs/ui/types';          // types",
	'',
	"import '@hyzer-labs/ui/tokens.css';    // required",
	"import '@hyzer-labs/ui/theme';         // optional reference theme",
	"import '@hyzer-labs/ui/reset.css';     // optional structural reset"
].join('\n');

export const agentRules: AgentRule[] = [
	{
		title: 'Prefer the library components over hand-rolling your own',
		body: 'If a component exists, compose it. Hand-rolled markup re-solves problems the library already solved, and it will not pick up theme changes, token overrides or accessibility fixes. Extend what is here instead: snippets when you need different structure, the `class` prop and the documented hooks when you need a different look.'
	},
	{
		title: 'Meet WCAG AA, and use the accessibility already here',
		body: 'AA is the floor, not the goal. Components ship the ARIA roles, keyboard handling and focus management of their WAI-ARIA pattern, so use them rather than rebuilding the pattern. Bad ARIA is worse than no ARIA: adding `role`, `tabindex` or key handlers on top of a component usually breaks behavior that already worked. If a component looks like it is missing an accessible name, look for a label prop first.'
	},
	{
		title: 'Generate tokens; never hand-edit them',
		body: 'The token sheet is build output. Change `hyzer.config.ts` and run `hyzer generate`. A hand edit is overwritten on the next run, and it skips the contrast grading that would have caught an inaccessible pairing.'
	},
	{
		title: 'Resolve through roles and intents, never the palette',
		body: 'In component CSS, use `--hz-color-*` for structural roles such as surface, text and border, and `--hz-intent-*` for meaning such as danger or success. `--hz-palette-*` is the raw hue layer those resolve through. Read it directly and you skip the layer a consumer themes: someone who repoints `--hz-color-border`, or remaps `--hz-intent-danger` to a different hue, sees no effect on your component.'
	},
	{
		title: 'Apply named themes with data-theme',
		body: 'Define each theme under `themes` in the config, then apply one with a `data-theme` attribute or the `theme` attachment. It works on `<html>` or on any element, which is how a single section carries its own theme. Dark is one named theme, not a special mode.',
		code: {
			lang: 'ts',
			source: [
				'export default defineConfig({',
				'\tthemes: {',
				"\t\tdark: { palette: { primary: '#60a5fa' } },",
				"\t\tocean: { palette: { primary: '#0ea5e9' } }",
				'\t}',
				'});'
			].join('\n')
		}
	},
	{
		title: 'Restyle through the class prop',
		body: 'Every component accepts `class` and merges it onto its root, so a single instance can be restyled without a wrapper element and without `!important`.',
		code: {
			lang: 'svelte',
			source: [
				'<!-- Yes -->',
				'<Button class="checkout-cta">Place order</Button>',
				'',
				'<!-- Not this: a wrapper element just to reach the component -->',
				'<div class="checkout-cta"><Button>Place order</Button></div>'
			].join('\n')
		}
	}
];

const SITE = 'https://design.hyzer.sh';

/**
 * The AGENTS.md file, rendered from the rules above. Served at /agents.md and
 * shown verbatim on the Agents page, so what a reader copies is byte-identical
 * to what the route returns.
 */
export function renderAgentsMd(): string {
	const parts: string[] = [
		'# @hyzer-labs/ui — conventions for coding agents',
		'',
		'The conventions that keep generated code correct against @hyzer-labs/ui, a',
		'headless Svelte 5 component library.',
		'',
		`Full documentation: ${SITE}/docs`,
		`Machine-readable index of every page: ${SITE}/llms.txt`,
		`Every component's props and styling hooks in one file: ${SITE}/llms-full.txt`,
		`The same reference as JSON, for keyed lookup: ${SITE}/llms-full.json`,
		'',
		'## Imports',
		'',
		'Components come from the package root. Everything else lives behind a named',
		'subpath, so there is never a guess about whether something is a component, a',
		'utility, or a type.',
		'',
		'```ts',
		importSurface,
		'```',
		'',
		'## House rules',
		''
	];

	for (const rule of agentRules) {
		parts.push(`### ${rule.title}`, '', rule.body, '');
		if (rule.code) {
			parts.push('```' + rule.code.lang, rule.code.source, '```', '');
		}
	}

	return parts.join('\n');
}
