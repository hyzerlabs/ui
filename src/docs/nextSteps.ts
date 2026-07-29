/**
 * The onward links Getting Started ends with. Shared so the error page can
 * offer the same set (plus Getting Started itself) without drifting from it.
 */
export interface NextStep {
	label: string;
	href: string;
	blurb: string;
}

export const nextSteps: NextStep[] = [
	{
		label: 'Components',
		href: '/docs/components/button',
		blurb: 'Every component, with its props, theme hooks and accessibility notes.'
	},
	{
		label: 'Theming',
		href: '/docs/theming/overview',
		blurb: 'The layer model, and how far you can push it without forking the library.'
	},
	{
		label: 'Patterns',
		href: '/docs/patterns/homepage',
		blurb: 'Example patterns to help you get started.'
	},
	{
		label: 'Philosophy',
		href: '/docs/philosophy',
		blurb: 'What every component commits to, and why.'
	},
	{
		label: 'Agents',
		href: '/docs/agents',
		blurb: 'Point a coding agent at this library and keep its output correct.'
	}
];

export const gettingStartedStep: NextStep = {
	label: 'Getting Started',
	href: '/docs',
	blurb: 'Install the package, import a component, and theme it in three steps.'
};
