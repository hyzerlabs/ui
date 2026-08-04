import type { Snippet } from 'svelte';

/**
 * Navigation item — recursive. Used by Nav and Footer.
 */
export interface NavItem {
	label: string;
	href?: string;
	children?: NavChild[];
	external?: boolean;
	ariaCurrent?: 'page' | 'step' | 'true';
	/**
	 * Vertical Nav only: the section starts open, and re-opens whenever the
	 * items array is rebuilt (additive — never closes user-opened sections).
	 */
	defaultOpen?: boolean;
	/**
	 * Extra class on the rendered link (or the label trigger, for an
	 * href-less item with children) — the per-item styling hook.
	 */
	class?: string;
}

/**
 * A group label inside a `children` array — static text between link items,
 * for sidebars that group a long section without a second disclosure level.
 *
 * Non-interactive by contract: no href, no button, no focus stop. It is plain
 * text in the list, so keyboard traversal skips it and screen readers read it
 * in sequence before the links it labels. Children-only: a heading in a
 * top-level `items` array is out of contract and renders nothing.
 */
export interface NavHeading {
	heading: string;
}

/**
 * A `children` entry — either a real nav item or a group label.
 * Discriminate with `isNavHeading` from `@hyzer-labs/ui/utils` (this module
 * stays type-only, so the guard lives with the other runtime helpers).
 */
export type NavChild = NavItem | NavHeading;

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

/** Options for the `lightboxGroup` attachment. All optional. */
export interface LightboxGroupOptions {
	/**
	 * CSS selector narrowing which descendants qualify. Matched elements are
	 * still filtered to img / picture>img / video and the exclusion rules
	 * below. Default: every qualifying media descendant.
	 */
	selector?: string;
	/** Accessible name of the viewer dialog in multi-item mode. */
	dialogLabel?: string;
	closeLabel?: string;
	prevLabel?: string;
	nextLabel?: string;
}

/** A single crumb for Breadcrumbs — the linkable subset of NavItem. */
export type BreadcrumbItem = Pick<NavItem, 'label' | 'href' | 'external' | 'ariaCurrent'>;

/** Footer column grouping */
export interface FooterColumn {
	title: string;
	links: NavItem[];
}

/**
 * A single heading collected by Toc — flat, not a tree. Nesting (deeper
 * levels under the nearest preceding shallower entry) is derived from
 * `level` at render time, not carried in the type.
 */
export interface TocEntry {
	id: string;
	label: string;
	level: number;
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

/**
 * The intent vocabulary, as an open registry.
 *
 * Intents are a TOKEN-driven vocabulary: a component only stamps
 * `data-intent="<name>"`, and a theme decides what that name looks like by
 * defining `--hz-intent-<name>`. Nothing in the components is bound to these
 * six — so the type shouldn't be either. A closed union would make the
 * library's own list the ceiling, which is exactly backwards for a headless
 * system.
 *
 * Consumers extend the vocabulary by augmenting this interface, and get full
 * type-checking and autocomplete on their own intents:
 *
 * ```ts
 * // hyzer-intents.d.ts — augment the DECLARING module ('/types'), not the
 * // barrel that re-exports it: TypeScript merges an interface only into the
 * // module that declares it.
 * declare module '@hyzer-labs/ui/types' {
 *   interface IntentRegistry {
 *     phosphor: true;
 *     amber: true;
 *   }
 * }
 * export {};
 * ```
 *
 * Then `<Button intent="phosphor">` type-checks, `intent="phosfor"` doesn't,
 * and `--hz-intent-phosphor` (add it under `tokens.intent` in hyzer.config)
 * is graded by the contrast report like any built-in intent. See
 * theme/examples/terminal for a worked example.
 */
export interface IntentRegistry {
	/** The no-status default — a full member of the vocabulary (rather than
	 * unioned on per component as `'neutral' | Intent`). */
	neutral: true;
	primary: true;
	secondary: true;
	danger: true;
	warning: true;
	success: true;
	info: true;
}

/** Semantic intent variants — open via {@link IntentRegistry}. */
export type Intent = keyof IntentRegistry;

/** Visual style variants */
export type Variant = 'solid' | 'outline' | 'ghost' | 'soft';

/**
 * Corner radius scale, mirroring the --hz-radius-* tokens.
 * Shared by every `rounded` prop (Badge; Card/Image migrate in a follow-up).
 */
export type Rounded = 'none' | 'sm' | 'md' | 'lg' | 'full';

/**
 * Loading's shape vocabulary (, amended 2026-07-27 — the spinner/ring
 * split) — one variant, one shape:
 * - `bar` — a linear progress bar; indeterminate by default, a determinate
 *   native `<progress>` with a `value`.
 * - `spinner` — the spinning `IconLoader` glyph. Indeterminate-only: a
 *   `value` is ignored (dev-warn).
 * - `ring` — the sole home of circular progress. No `value` ⇒ a
 *   continuously rotating arc whose length pulses (no numeric readout);
 *   `value` present ⇒ a static determinate arc with an optional centered
 *   readout.
 * - `dots` — a three-dot ellipsis loader. Indeterminate-only, like spinner.
 */
export type LoadingVariant = 'bar' | 'spinner' | 'ring' | 'dots';

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

/** A single selectable choice — shared by Select, RadioGroup, and Combobox. */
export interface FormOption {
	value: string;
	label: string;
	disabled?: boolean;
}

/** A single <option> for Select, or an <optgroup> wrapping nested options. */
export type SelectOption = FormOption | { group: string; options: FormOption[] };

/** A tick mark on a Slider/RangeSlider track: a bare value or value + label. */
export type SliderTick = number | { value: number; label: string };

/** A single error surfaced by the Form error summary. */
export interface FormError {
	/** Field `name` to link to. Empty/unresolved ⇒ a form-level error (no link). */
	name: string;
	message: string;
}

/** Badge appearance unions (shared so Combobox chips can be typed).
 * BadgeIntent is an alias — `neutral` folded into {@link Intent}; kept for
 * import-site continuity. */
export type BadgeIntent = Intent;
export type BadgeVariant = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

/**
 * Badge styling passed through to every Combobox chip — consumers who only
 * import Combobox can still set chip appearance. Behavioral Badge props
 * (children, onDismiss, dismissLabel) are component-managed and excluded.
 */
export interface ComboboxChipProps {
	intent?: BadgeIntent;
	variant?: BadgeVariant;
	size?: BadgeSize;
	rounded?: Rounded;
	class?: string;
}

/** An actionable entry in a Dropdown action menu. */
export interface DropdownItem {
	/** Stable identity — keys the item, its DOM id, and the onselect callback. */
	id: string;
	label: string;
	disabled?: boolean;
	/** Destructive action (e.g. Delete) — surfaces a `data-danger` styling hook. */
	danger?: boolean;
	/** Optional decorative leading glyph (rendered aria-hidden — the label owns
	 *  the accessible name). */
	icon?: Snippet;
	/** Per-item action, fired on activation before the component-level onselect. */
	onselect?: () => void;
}

/** A non-interactive divider between groups of Dropdown items. */
export interface DropdownSeparator {
	separator: true;
}

/** A Dropdown menu entry — an actionable item or a separator. */
export type DropdownEntry = DropdownItem | DropdownSeparator;

/**
 * Button appearance passed through to the Dropdown trigger — consumers who only
 * import Dropdown can still set the trigger's look. Behavioral trigger props
 * (label, aria, open/keyboard handlers) are component-managed and excluded.
 * (Button's `size` stays a local literal union, so it is inlined here;
 * `intent` speaks the shared vocabulary since the 2026-07-22 fold — the
 * previous inlined copy had drifted to a stale 4-value subset.)
 */
export interface DropdownTriggerProps {
	variant?: Variant;
	intent?: Intent;
	size?: 'sm' | 'md' | 'lg';
	class?: string;
}

/**
 * A column definition for Table — the field `key` doubles as the column id
 * (sort target, stacked-mode `data-label` source) and `header` is both the
 * header cell text and the stacked-mode label.
 */
export interface TableColumn<T> {
	key: string;
	header: string;
	sortable?: boolean;
	/** Sort accessor override; default is `row[key]`. The escape hatch for mixed-type columns. */
	sortBy?: (row: T) => string | number;
	/** Logical alignment — 'start'/'end' flip under RTL. */
	align?: 'start' | 'center' | 'end';
	/** CSS width for the column's `<col>`. */
	width?: string;
}

/** Table's bindable sort state — the active column and its direction. */
export interface TableSort {
	key: string;
	direction: 'asc' | 'desc';
}

/** Why a file was rejected by FileUpload's client-side validation. */
export type FileRejectionReason = 'type' | 'size' | 'too-many';

/**
 * A single file rejected by FileUpload (accept mismatch, over maxSize, or
 * beyond the count cap — single mode's inherent 1, or `maxFiles` in multiple
 * mode). Surfaced via `onreject`; the component never silently drops a file.
 * `message` is a ready-to-display English string; the `reason` code lets
 * consumers localize or aggregate.
 */
export interface FileRejection {
	file: File;
	reason: FileRejectionReason;
	message: string;
}

// ---------------------------------------------------------------------------
// Positioning vocabulary — shared by Tooltip and Popover.
// Internal placement math lives in src/lib/positioning/ (not a public
// export); only the vocabulary is public API, via the two primitives' props.
// ---------------------------------------------------------------------------

/** One of the four physical placement sides. */
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';

/** Cross-axis alignment relative to the trigger. */
export type PopoverAlign = 'start' | 'center' | 'end';

/**
 * Preferred floating-element placement, shared by `tooltip` and `Popover`.
 * `'top'` == `'top-center'`; `-start`/`-end` add alignment. Logical, not
 * physical — `left`/`right` resolve through the trigger's `direction`, so
 * RTL flips the physical side.
 */
export type Placement = PopoverSide | `${PopoverSide}-start` | `${PopoverSide}-end`;

/**
 * `tooltip()` attachment options — `{@attach
 * tooltip({ text: '…' })}`. The string overload (`tooltip('…')`) is sugar
 * for `{ text: '…' }`.
 */
export interface TooltipOptions {
	/** The tooltip text. Required (string form or this field). Non-interactive
	 *  text only — interactive content belongs in a `Popover`. */
	text: string;
	/** Preferred placement. Default `'top'`. */
	placement?: Placement;
	/** Gap from the trigger in px. Default `8`. */
	offset?: number;
	/** Delay before showing on hover-intent (ms). Default `400`. Bypassed by
	 *  keyboard focus, which shows immediately. */
	openDelay?: number;
	/** Delay before hiding after leave — the hoverable bridge (ms). Default `150`. */
	closeDelay?: number;
	/** Extra class merged onto the created `.hz-tooltip` node. */
	class?: string;
}

/**
 * Appearance passthrough for Popover's default composed Button trigger —
 * mirrors `DropdownTriggerProps`. Ignored when the `trigger` snippet escape
 * hatch is used instead.
 */
export interface PopoverTriggerProps {
	variant?: Variant;
	intent?: Intent;
	size?: 'sm' | 'md' | 'lg';
	class?: string;
	/** Accessible name for an icon-only default trigger (no `triggerLabel`).
	 *  Logs a warning in development when neither this nor `triggerLabel` is set. */
	ariaLabel?: string;
}

/**
 * The attribute bag a Popover `trigger` snippet spreads onto its own
 * element (a link, avatar, or other custom control).
 */
export interface TriggerAttrs {
	id: string;
	'aria-expanded': 'true' | 'false';
	'aria-controls': string;
	popovertarget: string;
	onclick: (e: MouseEvent) => void;
}

/** `<Popover>` props. */
export interface PopoverProps {
	/** Two-way open state. Default `false`. */
	open?: boolean;
	/** Preferred placement. Default `'bottom-start'`. */
	placement?: Placement;
	/** Gap from the trigger in px. Default `8`. */
	offset?: number;
	/** Move focus to the first focusable element in the panel on open.
	 *  Default `false` — a disclosure never steals focus by default. */
	autoFocus?: boolean;
	/** Close on outside interaction; Escape always closes regardless.
	 *  Default `true`. */
	dismissible?: boolean;
	/** Accessible label for the panel region when it has no heading. */
	label?: string;
	onopen?: () => void;
	onclose?: () => void;
	/** Visible label for the default Button trigger. */
	triggerLabel?: string;
	/** Appearance passthrough for the default Button. */
	triggerProps?: PopoverTriggerProps;
	/** Icon snippet for the default Button trigger. */
	triggerIcon?: Snippet;
	/** Escape hatch: when provided, WINS over `triggerLabel`/`triggerProps`/
	 *  `triggerIcon` — receives a `TriggerAttrs` bag to spread onto any
	 *  element (link, avatar, icon button). */
	trigger?: Snippet<[TriggerAttrs]>;
	/** The panel content — rich/interactive content is allowed. */
	children: Snippet;
	class?: string;
	[key: string]: unknown;
}
