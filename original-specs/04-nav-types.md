# Navigation Types (Shared)

These types are shared across Nav and Footer. Defined once in `@hyzer/ui/types`.

---

## Types

```ts
/** Navigation item — recursive. Used by Nav and Footer. */
export interface NavItem {
	/** Display text */
	label: string;
	/** URL destination. Optional when item has children (becomes trigger-only). */
	href?: string;
	/** Nested items — if present, Nav renders a dropdown */
	children?: NavItem[];
	/** Opens in new tab with security attrs + SR announcement */
	external?: boolean;
	/** Marks current page/step for active state */
	ariaCurrent?: 'page' | 'step' | 'true';
}

/** Footer column grouping */
export interface FooterColumn {
	/** Column heading */
	title: string;
	/** Links in this column — same NavItem type as nav links */
	links: NavItem[];
}
```

## One Type, Multiple Shapes

The same `NavItem` type drives simple navs, nested navs, and footer links. The component decides what to render based on what's present in the data:

```svelte
<script>
	import type { NavItem, FooterColumn } from '@hyzer/ui/types';

	// Simple nav — flat links, no children
	const simpleNav: NavItem[] = [
		{ label: 'Home', href: '/', ariaCurrent: 'page' },
		{ label: 'About', href: '/about' },
		{ label: 'Blog', href: '/blog' },
		{ label: 'GitHub', href: 'https://github.com/hyzer-sh', external: true }
	];

	// Complex nav — mix of flat links and dropdowns
	const complexNav: NavItem[] = [
		{ label: 'Home', href: '/' },
		{
			label: 'Services',
			children: [
				{ label: 'Design Systems', href: '/services/design-systems' },
				{ label: 'Accessibility Audits', href: '/services/a11y' },
				{ label: 'Frontend Development', href: '/services/frontend' }
			]
		},
		{ label: 'Work', href: '/work' },
		{
			label: 'About',
			children: [
				{ label: 'Team', href: '/about/team' },
				{ label: 'Process', href: '/about/process' },
				{ label: 'Careers', href: '/about/careers' }
			]
		},
		{ label: 'Contact', href: '/contact' }
	];

	// Footer — same type, Footer just ignores children
	const footerCols: FooterColumn[] = [
		{
			title: 'Company',
			links: [
				{ label: 'About', href: '/about' },
				{ label: 'Blog', href: '/blog' }
			]
		},
		{
			title: 'Connect',
			links: [
				{ label: 'GitHub', href: 'https://github.com/hyzer-sh', external: true },
				{ label: 'LinkedIn', href: 'https://linkedin.com/company/hyzer', external: true }
			]
		}
	];
</script>

<!-- Same component, different data -->
<Nav items={simpleNav} />
<Nav items={complexNav} />
```

## Recursion Depth

The type is recursive — `NavItem.children` contains `NavItem[]`, which could each have their own `children`. The Nav component renders one level of dropdowns in practice (top-level items + one tier of children). Deeper nesting is structurally possible in the type but the component flattens or ignores items beyond the second level. If mega-menu or deeper nesting becomes needed in the future, the type already supports it without a breaking change.

## Why `href` Is Optional

A `NavItem` with `children` but no `href` is a dropdown trigger that doesn't navigate anywhere itself — clicking it opens the submenu. A `NavItem` with both `children` and `href` is a navigable link that also has a submenu (the link itself goes somewhere, and the chevron/arrow opens children). The component handles both cases.
