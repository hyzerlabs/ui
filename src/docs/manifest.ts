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

/** A sidebar section — a label-only toggle wrapping its pages. */
export interface ManifestSection {
	label: string;
	children: ManifestPage[];
}

/** Top level is a mix: standalone pages (no toggle) and sections. */
export type ManifestEntry = ManifestPage | ManifestSection;

/** Discriminates sections (NavItem's optional children defeats `in` checks). */
export function isSection(entry: ManifestEntry): entry is ManifestSection {
	return Array.isArray((entry as ManifestSection).children);
}

/** Complete information architecture. */
export const manifest: ManifestEntry[] = [
	{ label: 'Introduction', href: '/' },
	{
		label: 'Foundation',
		children: [
			{ label: 'Colors & Intent', href: '/foundation/colors' },
			{ label: 'Typography', href: '/foundation/typography' },
			{ label: 'Spacing & Sizing', href: '/foundation/spacing' },
			{ label: 'Radius & Elevation', href: '/foundation/radius-elevation' },
			{ label: 'Motion', href: '/foundation/motion' },
			{ label: 'Icons', href: '/foundation/icons' },
			{ label: 'CSS Reset', href: '/foundation/reset' }
		]
	},
	{
		label: 'Layout',
		children: [
			{ label: 'Container', href: '/layout/container' },
			{ label: 'Stack', href: '/layout/stack' },
			{ label: 'Cluster', href: '/layout/cluster' },
			{ label: 'Grid', href: '/layout/grid' },
			{ label: 'Split', href: '/layout/split' },
			{ label: 'Virtualizer', href: '/layout/virtualizer' }
		]
	},
	{
		label: 'Navigation',
		children: [
			{ label: 'Nav', href: '/navigation/nav' },
			{ label: 'Breadcrumbs', href: '/navigation/breadcrumbs' },
			{ label: 'Pagination', href: '/navigation/pagination' },
			{ label: 'Footer', href: '/navigation/footer' }
		]
	},
	{
		label: 'Forms',
		children: [
			{ label: 'Form', href: '/forms/form' },
			{ label: 'TextInput', href: '/forms/text-input' },
			{ label: 'Textarea', href: '/forms/textarea' },
			{ label: 'Select', href: '/forms/select' },
			{ label: 'Combobox', href: '/forms/combobox' },
			{ label: 'FileUpload', href: '/forms/file-upload' },
			{ label: 'Checkbox', href: '/forms/checkbox' },
			{ label: 'RadioGroup', href: '/forms/radio-group' },
			{ label: 'Slider', href: '/forms/slider' },
			{ label: 'RangeSlider', href: '/forms/range-slider' },
			{ label: 'ColorInput', href: '/forms/color-input' },
			{ label: 'Toggle', href: '/forms/toggle' }
		]
	},
	{
		label: 'Media',
		children: [
			{ label: 'Image', href: '/media/image' },
			{ label: 'Lightbox', href: '/media/lightbox' },
			{ label: 'Video', href: '/media/video' }
		]
	},
	{
		label: 'Components',
		children: [
			{ label: 'Alert', href: '/components/alert' },
			{ label: 'Badge', href: '/components/badge' },
			{ label: 'Button', href: '/components/button' },
			{ label: 'Link', href: '/components/link' },
			{ label: 'Card', href: '/components/card' },
			{ label: 'Carousel', href: '/components/carousel' },
			{ label: 'Hero', href: '/components/hero' },
			{ label: 'Modal', href: '/components/modal' },
			{ label: 'Accordion', href: '/components/accordion' },
			{ label: 'Tabs', href: '/components/tabs' }
		]
	}
];

/** Flat list of every routable page (sections have no routes of their own). */
export const allRoutes: string[] = manifest.flatMap((entry) =>
	isSection(entry) ? entry.children.map((p) => p.href) : [entry.href]
);
