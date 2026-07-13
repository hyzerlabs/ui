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
	/**
	 * Vertical Nav only: the section starts open, and re-opens whenever the
	 * items array is rebuilt (additive — never closes user-opened sections).
	 */
	defaultOpen?: boolean;
}

/**
 * A <source> candidate for Image's picture mode — art direction via `media`,
 * format negotiation via `type`. Order matters: the browser takes the first
 * matching source.
 */
export interface ImageSource {
	srcset: string;
	type?: string;
	media?: string;
	sizes?: string;
}

/** An image entry for Lightbox. */
export interface LightboxImageItem {
	type?: 'image';
	src: string;
	alt: string;
	/** Thumbnail for the trigger strip; defaults to src. */
	thumbSrc?: string;
	caption?: string;
}

/** A video entry for Lightbox — plays via the Video component. */
export interface LightboxVideoItem {
	type: 'video';
	src: string;
	/** Accessible name (becomes the Video title). */
	label: string;
	poster?: string;
	/** Thumbnail for the trigger strip; defaults to poster. */
	thumbSrc?: string;
	caption?: string;
}

export type LightboxItem = LightboxImageItem | LightboxVideoItem;

/** A single crumb for Breadcrumbs — the linkable subset of NavItem. */
export type BreadcrumbItem = Pick<NavItem, 'label' | 'href' | 'external' | 'ariaCurrent'>;

/** Footer column grouping */
export interface FooterColumn {
	title: string;
	links: NavItem[];
}

/** Component size variants */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Padding scale shared by every layout primitive (Container, Stack, Cluster,
 * Grid, Split). Applied on both axes; near/away are the density distances
 * from the tokens.css density block and tighten inside data-density-shift
 * regions.
 */
export type LayoutPadding = 'none' | 'sm' | 'md' | 'lg' | 'near' | 'away';

/**
 * Cross-axis alignment shared by Stack, Cluster, and Grid (align-items).
 * All five values are valid in both flex and grid contexts.
 */
export type LayoutAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

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
