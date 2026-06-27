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

/** Props shared by every form field. */
export interface FieldBase {
	name: string;
	label: string;
	description?: string;
	error?: string;
	required?: boolean;
	disabled?: boolean;
	hideLabel?: boolean;
}

/** A single <option> for Select, or an <optgroup> wrapping nested options. */
export type SelectOption =
	| { value: string; label: string; disabled?: boolean }
	| { group: string; options: { value: string; label: string; disabled?: boolean }[] };

/** A single radio choice in a RadioGroup. */
export interface RadioOption {
	value: string;
	label: string;
	disabled?: boolean;
}

/** A single error surfaced by the Form error summary. */
export interface FormError {
	/** Field `name` to link to. Empty/unresolved ⇒ a form-level error (no link). */
	name: string;
	message: string;
}
