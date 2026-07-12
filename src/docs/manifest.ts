/**
 * Docs nav manifest — single source of truth.
 *
 * Expressed as NavItem[] so the data model is identical to what the Nav and
 * Footer components consume. `href` is required on every entry (all manifest
 * pages have URLs). No docs-specific fields; add a page by adding an entry
 * here and creating the corresponding +page.svelte.
 */
import type { NavItem } from '$lib/types';

/**
 * NavItem with `href` required — every manifest entry has a URL.
 * `children` is narrowed to the same type so the tree is fully typed.
 */
export interface ManifestItem extends NavItem {
	href: string;
	children?: ManifestItem[];
}

/** Complete information architecture. Top-level entries are sections. */
export const manifest: ManifestItem[] = [
	{
		label: 'Foundation',
		href: '/foundation',
		children: [
			{ label: 'Colors', href: '/foundation/colors' },
			{ label: 'Typography', href: '/foundation/typography' },
			{ label: 'Spacing & Sizing', href: '/foundation/spacing' },
			{ label: 'Radius & Elevation', href: '/foundation/radius-elevation' },
			{ label: 'Motion', href: '/foundation/motion' },
			{ label: 'Icons', href: '/foundation/icons' }
		]
	},
	{
		label: 'Layout',
		href: '/layout',
		children: [
			{ label: 'Container', href: '/layout/container' },
			{ label: 'Stack', href: '/layout/stack' },
			{ label: 'Cluster', href: '/layout/cluster' },
			{ label: 'Grid', href: '/layout/grid' },
			{ label: 'Split', href: '/layout/split' }
		]
	},
	{
		label: 'Navigation',
		href: '/navigation',
		children: [
			{ label: 'Nav', href: '/navigation/nav' },
			{ label: 'Footer', href: '/navigation/footer' }
		]
	},
	{
		label: 'Forms',
		href: '/forms',
		children: [
			{ label: 'Form', href: '/forms/form' },
			{ label: 'TextInput', href: '/forms/text-input' },
			{ label: 'Textarea', href: '/forms/textarea' },
			{ label: 'Select', href: '/forms/select' },
			{ label: 'Checkbox', href: '/forms/checkbox' },
			{ label: 'RadioGroup', href: '/forms/radio-group' },
			{ label: 'Toggle', href: '/forms/toggle' }
		]
	},
	{
		label: 'Media',
		href: '/media',
		children: [
			{ label: 'Image', href: '/media/image' },
			{ label: 'Video', href: '/media/video' }
		]
	},
	{
		label: 'Components',
		href: '/components',
		children: [
			{ label: 'Button', href: '/components/button' },
			{ label: 'Link', href: '/components/link' },
			{ label: 'Card', href: '/components/card' },
			{ label: 'Hero', href: '/components/hero' },
			{ label: 'Modal', href: '/components/modal' },
			{ label: 'Accordion', href: '/components/accordion' },
			{ label: 'Tabs', href: '/components/tabs' }
		]
	}
];

/** Flat list of every manifest route (sections + leaf pages). */
export const allRoutes: string[] = [
	'/',
	...manifest.flatMap((s) => [s.href, ...(s.children ?? []).map((p) => p.href)])
];
