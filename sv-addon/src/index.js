import { defineAddon, defineAddonOptions } from 'sv';
import { transforms } from './sv-utils.js';
import { CONFIG_TEMPLATE, INIT_HEADER } from '../../src/lib/cli/config-template.js';

const UI_VERSION = '^0.5.0';

const options = defineAddonOptions()
	.add('config', {
		question: 'Scaffold hyzer.config.ts (customize tokens, themes, and icons with the hyzer CLI)?',
		type: 'boolean',
		default: true
	})
	.add('utilities', {
		question: 'Include the optional utilities sheet?',
		type: 'boolean',
		default: false
	})
	// Tailwind projects normally keep Preflight instead, because the two resets
	// do the same job (see /docs/theming/tailwind). This is a static option, not
	// setup's addOption, because you cannot pass dynamic options to the CLI
	// non-interactively.
	.add('reset', {
		question: "Include the library's optional CSS reset? (skip if you keep Tailwind Preflight)",
		type: 'boolean',
		default: true
	})
	.build();

/**
 * Edits the app stylesheet. The hyzer imports go at the top, in docs order
 * (reset → tokens → theme → utilities). With Tailwind present they stay above
 * `@import 'tailwindcss'`, and one master `@layer` declaration pins the whole
 * cascade order, as described in /docs/theming/tailwind.
 * Exported so unit tests can call it.
 */
export function stylesheetEdit(options) {
	return transforms.css(({ ast, css }) => {
		const hasTailwindImport = ast.children.some(
			(n) => n.type === 'Atrule' && n.name === 'import' && n.prelude.includes('tailwindcss')
		);

		// Each at-rule prepends, so add in reverse of the final order.
		if (options.utilities) {
			css.addAtRule(ast, {
				name: 'import',
				params: `'@hyzer-labs/ui/utilities.css'`,
				append: false
			});
		}
		css.addAtRule(ast, { name: 'import', params: `'@hyzer-labs/ui/theme'`, append: false });
		css.addAtRule(ast, { name: 'import', params: `'@hyzer-labs/ui/tokens.css'`, append: false });
		if (options.reset) {
			css.addAtRule(ast, { name: 'import', params: `'@hyzer-labs/ui/reset.css'`, append: false });
		}
		if (hasTailwindImport) {
			css.addAtRule(ast, {
				name: 'layer',
				params: 'hz-reset, hz-theme, theme, base, components, utilities',
				append: false
			});
		}
	});
}

export default defineAddon({
	id: '@hyzer-labs/sv',
	shortDescription: 'headless, accessible Svelte 5 components (@hyzer-labs/ui)',
	homepage: 'https://design.hyzer.sh',
	options,

	setup: ({ isKit, unsupported, runsAfter }) => {
		if (!isKit) unsupported('Requires SvelteKit');
		// When installed alongside the tailwindcss addon, run after it, so its
		// `@import 'tailwindcss'` is in the stylesheet before we edit it.
		runsAfter('tailwindcss');
	},

	run: ({ sv, options, language, file, directory, dependencyVersion }) => {
		sv.dependency('@hyzer-labs/ui', UI_VERSION);

		sv.file(file.stylesheet, stylesheetEdit(options));

		// Make sure the root layout loads the stylesheet.
		const layoutSvelte = `${directory.kitRoutes}/+layout.svelte`;
		const stylesheetRelative = file.getRelative({ from: layoutSvelte, to: file.stylesheet });
		sv.file(
			layoutSvelte,
			transforms.svelteScript({ language }, ({ ast, svelte, js }) => {
				js.imports.addEmpty(ast.instance.content, { from: stylesheetRelative });
				if (ast.fragment.nodes.length === 0) {
					const svelteVersion = dependencyVersion('svelte');
					if (!svelteVersion) throw new Error('Failed to determine svelte version');
					svelte.addSlot(ast, { svelteVersion });
				}
			})
		);

		if (options.config) {
			// Same scaffold as `hyzer init`; leaves an existing config untouched.
			sv.file('hyzer.config.ts', (content) => content || INIT_HEADER + CONFIG_TEMPLATE);
			// Validate the config wherever the project's check script runs (CI).
			sv.file(
				file.package,
				transforms.json(({ data }) => {
					data.scripts ??= {};
					const check = data.scripts.check;
					if (!check) data.scripts.check = 'hyzer generate --check';
					else if (!check.includes('hyzer generate')) {
						data.scripts.check = `${check} && hyzer generate --check`;
					}
				})
			);
		}
	},

	nextSteps: ({ options }) => {
		const steps = [`Import components anywhere: import { Button } from '@hyzer-labs/ui'`];
		if (options.config) {
			steps.push('Uncomment the options you need in hyzer.config.ts, then run: npx hyzer generate');
		}
		steps.push('Docs: https://design.hyzer.sh');
		return steps;
	}
});
