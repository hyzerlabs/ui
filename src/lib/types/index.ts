/**
 * Navigation item — recursive. Used by Nav and Footer.
 * @see original-specs/00-architecture.md
 */
export interface NavItem {
	label: string;
	href?: string;
	children?: NavItem[];
	external?: boolean;
	ariaCurrent?: 'page' | 'step' | 'true';
}

/** Footer column grouping */
export interface FooterColumn {
	title: string;
	links: NavItem[];
}

/** Component size variants */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Semantic intent variants */
export type Intent = 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info';

/** Visual style variants */
export type Variant = 'solid' | 'outline' | 'ghost' | 'link';
