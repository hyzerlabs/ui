import { defineAddon, defineAddonOptions } from 'sv';
import { transforms } from './sv-utils.js';
import { CONFIG_TEMPLATE, INIT_HEADER } from '../../src/lib/cli/config-template.ts';

const UI_VERSION = '^0.3.0';

const options = defineAddonOptions()
	.add('config', {
		question: 'Scaffold hyzer.config.ts (customize tokens, themes, and icons via the hyzer CLI)?',
		type: 'boolean',
		default: true
	})
	.add('utilities', {
		question: 'Include the optional utilities sheet?',
		type: 'boolean',
		default: false
	})
	.build();

export default defineAddon({
	id: '@hyzer-labs/sv',
	shortDescription: 'headless, accessible Svelte 5 components (@hyzer-labs/ui)',
	homepage: 'https://design.hyzer.sh',
	options,

	setup: ({ isKit, unsupported }) => {
		if (!isKit) unsupported('Requires SvelteKit');
	},

	run: ({ sv, options, language, file, directory, dependencyVersion }) => {
		sv.dependency('@hyzer-labs/ui', UI_VERSION);

		// Each at-rule prepends, so add in reverse of the final order:
		// tokens.css → theme → utilities.css (matching the Getting Started docs).
		sv.file(
			file.stylesheet,
			transforms.css(({ ast, css }) => {
				if (options.utilities) {
					css.addAtRule(ast, {
						name: 'import',
						params: `'@hyzer-labs/ui/utilities.css'`,
						append: false
					});
				}
				css.addAtRule(ast, { name: 'import', params: `'@hyzer-labs/ui/theme'`, append: false });
				css.addAtRule(ast, { name: 'import', params: `'@hyzer-labs/ui/tokens.css'`, append: false });
			})
		);

		// Make sure the stylesheet is actually loaded by the root layout.
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
			// Same scaffold as `hyzer init`; leave an existing config untouched.
			sv.file('hyzer.config.ts', (content) => content || INIT_HEADER + CONFIG_TEMPLATE);
		}
	},

	nextSteps: ({ options }) => {
		const steps = [`Import components anywhere: import { Button } from '@hyzer-labs/ui'`];
		if (options.config) {
			steps.push('Uncomment options in hyzer.config.ts, then run: npx hyzer generate');
		}
		steps.push('Docs: https://design.hyzer.sh');
		return steps;
	}
});
