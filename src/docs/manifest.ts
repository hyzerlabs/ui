/**
 * Docs nav manifest — single source of truth.
 *
 * Expressed in NavItem terms so the tree feeds the dogfooded sidebar Nav
 * directly. Sections are label-only toggles (no cover pages — no href);
 * every leaf page has a URL. Add a page by adding an entry here and creating
 * the corresponding +page.svelte.
 */
import type { NavItem } from '$lib/types';

/** A leaf docs page — always has a URL. */
export interface ManifestPage extends NavItem {
	href: string;
	children?: never;
}

/** A presentational band of pages inside a section — a label, no route. */
export interface ManifestGroup {
	label: string;
	pages: ManifestPage[];
}

/** A section whose pages are one flat list (Foundation, Theming, Pages). */
export interface ManifestFlatSection {
	label: string;
	children: ManifestPage[];
}

/** A section whose pages are banded under group labels (Components). */
export interface ManifestGroupedSection {
	label: string;
	groups: ManifestGroup[];
}

/**
 * A sidebar section — a label-only toggle wrapping its pages, either flat or
 * grouped. Group labels are presentational: no route, no href, no disclosure
 * state of their own.
 */
export type ManifestSection = ManifestFlatSection | ManifestGroupedSection;

/** Top level is a mix: standalone pages (no toggle) and sections. */
export type ManifestEntry = ManifestPage | ManifestSection;

/** Discriminates sections (NavItem's optional children defeats `in` checks). */
export function isSection(entry: ManifestEntry): entry is ManifestSection {
	return (
		Array.isArray((entry as ManifestFlatSection).children) ||
		Array.isArray((entry as ManifestGroupedSection).groups)
	);
}

/** Discriminates the grouped shape from the flat one. */
export function isGrouped(section: ManifestSection): section is ManifestGroupedSection {
	return Array.isArray((section as ManifestGroupedSection).groups);
}

/** Every page in a section, flattened — the shape-agnostic accessor. */
export function sectionPages(section: ManifestSection): ManifestPage[] {
	return isGrouped(section) ? section.groups.flatMap((g) => g.pages) : section.children;
}

/** Complete information architecture. */
export const manifest: ManifestEntry[] = [
	{ label: 'Introduction', href: '/' },
	{ label: 'Getting Started', href: '/getting-started' },
	{
		label: 'Foundation',
		children: [
			{ label: 'Colors & Intent', href: '/foundation/colors' },
			{ label: 'Typography', href: '/foundation/typography' },
			{ label: 'Contrast & Accessibility', href: '/foundation/contrast' },
			{ label: 'Spacing & Sizing', href: '/foundation/spacing' },
			{ label: 'Borders & Elevation', href: '/foundation/borders-elevation' },
			{ label: 'Motion', href: '/foundation/motion' },
			{ label: 'Observers', href: '/foundation/observers' },
			{ label: 'Positioning', href: '/foundation/positioning' },
			{ label: 'Icons', href: '/foundation/icons' },
			{ label: 'CSS Reset', href: '/foundation/reset' },
			{ label: 'Utilities', href: '/foundation/utilities' }
		]
	},
	{
		label: 'Components',
		groups: [
			{
				label: 'Common',
				pages: [
					{ label: 'Alert', href: '/components/alert' },
					{ label: 'Badge', href: '/components/badge' },
					{ label: 'Banner', href: '/components/banner' },
					{ label: 'Blockquote', href: '/components/blockquote' },
					{ label: 'Button', href: '/components/button' },
					{ label: 'CodeBlock', href: '/components/code-block' },
					{ label: 'Link', href: '/components/link' },
					{ label: 'Card', href: '/components/card' },
					{ label: 'Divider', href: '/components/divider' },
					{ label: 'Dropdown', href: '/components/dropdown' },
					{ label: 'Carousel', href: '/components/carousel' },
					{ label: 'Hero', href: '/components/hero' },
					{ label: 'Modal', href: '/components/modal' },
					{ label: 'Tooltip', href: '/components/tooltip' },
					{ label: 'Popover', href: '/components/popover' },
					{ label: 'Accordion', href: '/components/accordion' },
					{ label: 'Tabs', href: '/components/tabs' },
					{ label: 'Table', href: '/components/table' },
					{ label: 'Loading', href: '/components/loading' },
					{ label: 'Skeleton', href: '/components/skeleton' }
				]
			},
			{
				label: 'Layout',
				pages: [
					{ label: 'Container', href: '/components/container' },
					{ label: 'Stack', href: '/components/stack' },
					{ label: 'Cluster', href: '/components/cluster' },
					{ label: 'Grid', href: '/components/grid' },
					{ label: 'Split', href: '/components/split' },
					{ label: 'Virtualizer', href: '/components/virtualizer' }
				]
			},
			{
				label: 'Navigation',
				pages: [
					{ label: 'Nav', href: '/components/nav' },
					{ label: 'Header', href: '/components/header' },
					{ label: 'Footer', href: '/components/footer' },
					{ label: 'Breadcrumbs', href: '/components/breadcrumbs' },
					{ label: 'Pagination', href: '/components/pagination' },
					{ label: 'Toc', href: '/components/toc' }
				]
			},
			{
				label: 'Media',
				pages: [
					{ label: 'Image', href: '/components/image' },
					{ label: 'Lightbox', href: '/components/lightbox' },
					{ label: 'Video', href: '/components/video' }
				]
			},
			{
				label: 'Forms',
				pages: [
					{ label: 'Form', href: '/components/form' },
					{ label: 'TextInput', href: '/components/text-input' },
					{ label: 'Textarea', href: '/components/textarea' },
					{ label: 'Checkbox', href: '/components/checkbox' },
					{ label: 'RadioGroup', href: '/components/radio-group' },
					{ label: 'Toggle', href: '/components/toggle' },
					{ label: 'Select', href: '/components/select' },
					{ label: 'Combobox', href: '/components/combobox' },
					{ label: 'FileUpload', href: '/components/file-upload' },
					{ label: 'Slider', href: '/components/slider' },
					{ label: 'RangeSlider', href: '/components/range-slider' },
					{ label: 'ColorInput', href: '/components/color-input' }
				]
			}
		]
	},
	{
		label: 'Theming',
		children: [
			{ label: 'Overview', href: '/theming/overview' },
			{ label: 'Tokens & Overrides', href: '/theming/tokens' },
			{ label: 'Styling Components', href: '/theming/components' },
			{ label: 'Using with Tailwind', href: '/theming/tailwind' },
			{ label: 'Example Themes', href: '/theming/examples' }
		]
	},
	{
		label: 'Patterns',
		children: [
			{ label: 'Homepage', href: '/patterns/homepage' },
			{ label: 'Article', href: '/patterns/article' },
			{ label: 'Recipe', href: '/patterns/recipe' },
			{ label: 'Docs shell', href: '/patterns/docs-shell' },
			{ label: 'Command palette', href: '/patterns/command-palette' },
			{ label: 'Product listing', href: '/patterns/product-listing' },
			{ label: 'Product detail', href: '/patterns/product-detail' },
			{ label: 'Checkout form', href: '/patterns/checkout-form' },
			{ label: 'Contact form', href: '/patterns/contact-form' },
			{ label: 'Virtualized table', href: '/patterns/virtualized-table' },
			{ label: 'Virtualized combobox', href: '/patterns/virtualized-combobox' }
		]
	}
];

/** Flat list of every routable page (sections have no routes of their own). */
export const allRoutes: string[] = manifest.flatMap((entry) =>
	isSection(entry) ? sectionPages(entry).map((p) => p.href) : [entry.href]
);
