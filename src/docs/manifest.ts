/**
 * Docs nav manifest — single source of truth.
 *
 * Expressed in NavItem terms so the tree feeds the dogfooded sidebar Nav
 * directly. Sections are label-only toggles (no cover pages — no href);
 * every leaf page has a URL. Add a page by adding an entry here and creating
 * the corresponding +page.svelte.
 */
import type { NavItem } from '$lib/types';

/**
 * A leaf docs page — always has a URL, always has a one-line description.
 *
 * The description is REQUIRED because it is metadata, not decoration: it
 * feeds `llms.txt` and the page's own lead line. A page nobody can describe
 * in a sentence usually has a focus problem, so the type refuses to let one
 * ship without an answer.
 */
export interface ManifestPage extends NavItem {
	href: string;
	description: string;
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
	{
		label: 'Getting Started',
		href: '/docs',
		description:
			'Adopt the library in three tiers, each one optional and a superset of the last. The library makes the accessibility and behavior choices, and you decide how things look.'
	},
	{
		label: 'Philosophy',
		href: '/docs/philosophy',
		description:
			'The commitments that underpin this library: accessibility first, headless structure you can override through snippets and documented hooks, theming that is opt-in one tier at a time, no bloat, and plain language for you and your agents.'
	},
	{
		label: 'Agents',
		href: '/docs/agents',
		description:
			'How to wire this library up to a coding agent: where llms.txt lives, the import surface, and the house rules that keep generated code correct.'
	},
	{
		label: 'Foundation',
		children: [
			{
				label: 'Colors & Intent',
				href: '/docs/foundation/colors',
				description:
					'Color works in two layers: the palette (--hz-palette-*) authors hues per mode, and the semantic layer (--hz-color-*, --hz-intent-*) says what a color does and what it means. Dark mode overrides land mostly on the palette, and the semantic layer follows automatically.'
			},
			{
				label: 'Typography',
				href: '/docs/foundation/typography',
				description:
					'Type tokens: three font families, a six-step type scale, four weights, and three line heights.'
			},
			{
				label: 'Contrast & Accessibility',
				href: '/docs/foundation/contrast',
				description:
					'WCAG contrast ratios for every graded token pairing, computed live per mode from the token metadata. The library ships the same functions, so you can run the identical check against a theme of your own.'
			},
			{
				label: 'Spacing & Sizing',
				href: '/docs/foundation/spacing',
				description:
					'Three sizing systems, each answering a different question: a fixed spacing scale for explicit distances, density spacing that tightens as content nests, and breakpoint width tokens.'
			},
			{
				label: 'Borders & Elevation',
				href: '/docs/foundation/borders-elevation',
				description: 'Tokens for border radius, border width, box shadows, and the z-index scale.'
			},
			{
				label: 'Motion',
				href: '/docs/foundation/motion',
				description:
					'Duration and easing tokens, plus the @hyzer-labs/ui/motion module: token-bridged transitions, easing evaluators, a scroll-reveal attachment, and a view-transition helper. All of it respects reduced-motion settings by default.'
			},
			{
				label: 'Observers',
				href: '/docs/foundation/observers',
				description:
					'@hyzer-labs/ui/observers wraps IntersectionObserver, ResizeObserver, and MutationObserver as Svelte attachments named intersect, resize, and mutate, each starting when the element mounts and disconnecting when it is removed. The module also exports announce, which sends a message to a visually hidden live region when a callback has loaded more content or spotted a change.'
			},
			{
				label: 'Positioning',
				href: '/docs/foundation/positioning',
				description:
					'Tooltip, Popover, and the Dropdown menu all place a floating element next to its trigger through one engine. It prefers CSS anchor positioning where the browser supports it and measures the element itself where it does not, flipping at the viewport edge, escaping clipping ancestors, and reporting back exactly what it rendered.'
			},
			{
				label: 'CSS Reset',
				href: '/docs/foundation/reset',
				description:
					"An optional adaptation of Josh Comeau's custom CSS reset, covering box sizing, margins, media elements, and text wrapping. It says nothing about color or typefaces, so it works the same with the reference theme or fully headless."
			},
			{
				label: 'Utilities',
				href: '/docs/foundation/utilities',
				description:
					'Three families of utility class, from least to most opt-in: the always-on .sr-only, component conventions the theme already ships, and a generated sheet of token-derived helpers you import separately. It also covers the JavaScript helpers the package exports.'
			}
		]
	},
	{
		label: 'Components',
		groups: [
			{
				label: 'Common',
				pages: [
					{
						label: 'Alert',
						href: '/docs/components/alert',
						description:
							'An inline feedback banner on the shared intent scale, with an optional heading and dismiss button. Announcement semantics are opt-in, and the Form error summary is built from one.'
					},
					{
						label: 'Badge',
						href: '/docs/components/badge',
						description:
							'A small inline status chip with intent coloring, soft, solid, and outline variants, the shared rounded scale, and an optional dismiss button. It is the building block for selected-option chips.'
					},
					{
						label: 'Banner',
						href: '/docs/components/banner',
						description:
							'A full-width, solid-intent announcement bar with an optional dismiss button and top or bottom pinning. Made for page-level messages: maintenance notices, promos, and outage warnings.'
					},
					{
						label: 'Blockquote',
						href: '/docs/components/blockquote',
						description:
							'A semantic quote: a figure wrapping a blockquote, with an optional visible attribution and an optional machine-readable source URL.'
					},
					{
						label: 'Button',
						href: '/docs/components/button',
						description:
							'A button with solid, outline, ghost, and soft variants, plus intent colors, sizes, a loading state, and icon slots.'
					},
					{
						label: 'CodeBlock',
						href: '/docs/components/code-block',
						description:
							'A headless, read-only code viewer with a copy button, an opt-in title and language header, decorative line numbers, and a Show-more collapse for long listings. It ships no syntax highlighter, so bring your own through the language class hook (client autoloaders) or the children escape hatch (build-time highlighters like Shiki).'
					},
					{
						label: 'Icons',
						href: '/docs/components/icons',
						description:
							'The full Lucide icon set (ISC) ships as generated per-icon Svelte components, loaded one glyph at a time. Each icon is decorative by default and labeled when you pass ariaLabel.'
					},
					{
						label: 'Link',
						href: '/docs/components/link',
						description:
							'An accessible anchor component with variant styles, external link support, and icon slots. Links inherit the surrounding text size.'
					},
					{
						label: 'Card',
						href: '/docs/components/card',
						description:
							'A content container with optional media, actions, horizontal layout, and clickable-overlay support.'
					},
					{
						label: 'Divider',
						href: '/docs/components/divider',
						description:
							'A thematic separator: a native hr when bare, and a labeled role=separator element when it wraps a centered text label.'
					},
					{
						label: 'Dropdown',
						href: '/docs/components/dropdown',
						description:
							'A generic action menu built on the WAI-ARIA APG menu button pattern, with real roving-tabindex keyboard focus.'
					},
					{
						label: 'Carousel',
						href: '/docs/components/carousel',
						description:
							'An accessible, manually rotated carousel: a draggable slide track, labeled slides, previous and next controls, arrow-key steering, and a live region announcing changes. It does not auto-rotate, by design.'
					},
					{
						label: 'Hero',
						href: '/docs/components/hero',
						description:
							'A section component for page heroes supporting center, split, and overlay layouts. Text slots accept plain strings or snippets; in the overlay layout, media becomes the full-bleed background.'
					},
					{
						label: 'Modal',
						href: '/docs/components/modal',
						description:
							'An accessible dialog built on the native <dialog> element with focus trap, Esc-to-close, scroll lock, and configurable sizes.'
					},
					{
						label: 'Tooltip',
						href: '/docs/components/tooltip',
						description:
							'An accessible hover and focus description for an element you already have, such as an icon button, a link, or an abbreviation. It holds non-interactive text only; for a click-triggered panel with rich content, use Popover.'
					},
					{
						label: 'Popover',
						href: '/docs/components/popover',
						description:
							'A click-triggered disclosure panel for rich or interactive content, such as a filter form, a settings menu, or extra detail. It is non-modal, with no focus trap and no backdrop: reach for Modal when you need a focus-trapped dialog, or Dropdown when you need a menu of actions.'
					},
					{
						label: 'Accordion',
						href: '/docs/components/accordion',
						description:
							'A disclosure component using native <details>/<summary> elements, supporting single and multiple open modes with keyboard navigation. Item titles accept plain strings or snippets.'
					},
					{
						label: 'Tabs',
						href: '/docs/components/tabs',
						description:
							'An accessible tab interface with roving tabindex, arrow-key navigation, and horizontal or vertical orientation. Tab labels accept plain strings or snippets.'
					},
					{
						label: 'Table',
						href: '/docs/components/table',
						description:
							'A data table with client sorting, row selection, a sticky header, built-in empty and loading states, and an opt-in stacked mode for narrow widths. Real <table> semantics throughout.'
					},
					{
						label: 'Loading',
						href: '/docs/components/loading',
						description:
							'An accessible loading indicator in four variants: spinner, ring, dots, and bar. All four are indeterminate on their own; pass a value and bar becomes a linear progress bar while ring becomes a circular arc with a centered readout, and spinner and dots stay indeterminate.'
					},
					{
						label: 'Skeleton',
						href: '/docs/components/skeleton',
						description:
							'A decorative placeholder for content that has not loaded yet. Its shape variants (text lines, circle, rectangle, and fill-the-box) combine into any card-like placeholder, with free width, height, and radius overrides and a shimmer animation that goes still under reduced motion.'
					}
				]
			},
			{
				label: 'Layout',
				pages: [
					{
						label: 'Container',
						href: '/docs/components/container',
						description:
							'Centers content horizontally with a configurable max-width and padding. Container decides how wide a region is, so pair it with Stack, Cluster, Grid, or Split to arrange the content inside.'
					},
					{
						label: 'Stack',
						href: '/docs/components/stack',
						description:
							'Lays children out in a vertical column with consistent spacing between items. Stack arranges content; pair it with a Container when the column also needs a max-width or page gutters.'
					},
					{
						label: 'Cluster',
						href: '/docs/components/cluster',
						description: 'Lays children out in a horizontal row that wraps to new lines as needed.'
					},
					{
						label: 'Grid',
						href: '/docs/components/grid',
						description:
							'Responsive CSS grid that adapts its column count to its own width via container queries.'
					},
					{
						label: 'Split',
						href: '/docs/components/split',
						description:
							'Two-column layout with configurable proportions that stacks to a single column when its own width gets narrow.'
					},
					{
						label: 'Virtualizer',
						href: '/docs/components/virtualizer',
						description:
							'A headless windowing primitive that renders only the visible slice of a huge items array. Row heights can be uniform, known-variable, or measured at runtime.'
					}
				]
			},
			{
				label: 'Navigation',
				pages: [
					{
						label: 'Nav',
						href: '/docs/components/nav',
						description:
							'A horizontal row of links with dropdown menus, or a vertical sidebar column with nested, multi-open disclosure sections. It stays a semantically correct navigation landmark in any context: standalone, in a sidebar, or composed by Header into a full top bar.'
					},
					{
						label: 'Header',
						href: '/docs/components/header',
						description:
							'A site header bar with branding, navigation, actions, and a responsive hamburger and drawer built in. It composes Nav horizontally in the bar and vertically in the drawer, so one item set drives both.'
					},
					{
						label: 'Footer',
						href: '/docs/components/footer',
						description:
							'Site footer with auto-fitting multi-column link groups, optional logo, social links, and a bottom bar.'
					},
					{
						label: 'Breadcrumbs',
						href: '/docs/components/breadcrumbs',
						description:
							'A wrapping breadcrumb trail of navigation links with chevron separators and automatic current-page semantics.'
					},
					{
						label: 'Pagination',
						href: '/docs/components/pagination',
						description:
							'A navigation landmark of page controls: previous and next, boundary and sibling windows with ellipsis truncation, and button or real-link modes.'
					},
					{
						label: 'Toc',
						href: '/docs/components/toc',
						description:
							"A table-of-contents rail with automatic heading collection, nested levels, scroll-spy, smooth scroll, and an optional mobile collapse. It is the docs site's own 'On this page' rail, generalized behind props."
					}
				]
			},
			{
				label: 'Media',
				pages: [
					{
						label: 'Image',
						href: '/docs/components/image',
						description:
							'Responsive image with aspect-ratio, object-fit, rounded corners, color and blur placeholder states, and a picture mode for art direction.'
					},
					{
						label: 'Lightbox',
						href: '/docs/components/lightbox',
						description:
							'A click-to-enlarge media viewer: a thumbnail strip whose items open in an accessible, focus-trapped dialog. Multiple images and videos page through an embedded Carousel.'
					},
					{
						label: 'Video',
						href: '/docs/components/video',
						description:
							'Video player supporting YouTube, Vimeo embeds, and native HTML5 video. Detects provider from URL and builds the correct embed.'
					}
				]
			},
			{
				label: 'Forms',
				pages: [
					{
						label: 'Form',
						href: '/docs/components/form',
						description:
							"A form wrapper that renders an accessible error summary and moves focus on failed submits, while staying out of the way of native submission and SvelteKit's use:enhance."
					},
					{
						label: 'TextInput',
						href: '/docs/components/text-input',
						description:
							'A labeled single-line input covering the common HTML input types, with description, inline error, and decorative prefix and suffix slots.'
					},
					{
						label: 'Textarea',
						href: '/docs/components/textarea',
						description:
							'A labeled multi-line text area with configurable resize behavior, including an auto-grow mode, plus description and inline error.'
					},
					{
						label: 'Checkbox',
						href: '/docs/components/checkbox',
						description:
							'A labeled checkbox with description, inline error, and an indeterminate state for select-all patterns.'
					},
					{
						label: 'RadioGroup',
						href: '/docs/components/radio-group',
						description:
							'A group of radio buttons in a fieldset with a legend, vertical or horizontal layout, and standard field accessibility.'
					},
					{
						label: 'Toggle',
						href: '/docs/components/toggle',
						description:
							'A switch for binary on and off settings. It is a native checkbox exposed with the switch role, so it submits a form value like any other field.'
					},
					{
						label: 'Select',
						href: '/docs/components/select',
						description:
							'A labeled native select with flat options, option groups, a placeholder option, and standard field accessibility.'
					},
					{
						label: 'Combobox',
						href: '/docs/components/combobox',
						description:
							'A multi-select, filterable text input that follows the WAI-ARIA APG combobox (list-autocomplete) pattern, with each pick rendered as a dismissible chip.'
					},
					{
						label: 'FileUpload',
						href: '/docs/components/file-upload',
						description:
							'A file selection field backed by a real native input, single or multiple, with accept, maxSize, and maxFiles validation, a removable file list, and an optional drag-and-drop dropzone. It selects files rather than uploading them: the named input carries the chosen files into a plain form submission or into your own upload code.'
					},
					{
						label: 'Slider',
						href: '/docs/components/slider',
						description:
							'A labeled range slider paired with a synced number field for fine-tuned keyboard entry. Typed values commit on change, snapped to the step and clamped to the range.'
					},
					{
						label: 'RangeSlider',
						href: '/docs/components/range-slider',
						description:
							'A dual-thumb slider that selects a min to max interval on one track, with paired number fields for exact entry. The thumbs can meet but never cross.'
					},
					{
						label: 'ColorInput',
						href: '/docs/components/color-input',
						description:
							'A labeled native color picker paired with a synced hex field for exact keyboard entry. Typed values commit on change, validated and normalized.'
					}
				]
			}
		]
	},
	{
		label: 'Theming',
		children: [
			{
				label: 'Overview',
				href: '/docs/theming/overview',
				description:
					'The components are headless: they ship structure, behavior, and accessibility, and every visual decision stays yours to keep, override, or replace. Styling arrives in opt-in tiers, each importable on its own.'
			},
			{
				label: 'Tokens & Overrides',
				href: '/docs/theming/tokens',
				description:
					'Theme tokens come in two layers: the palette (--hz-palette-*) authors single-value hues per mode, and the semantic roles (--hz-color-*) and intents (--hz-intent-*) are var() indirection that chains through it. Override one hue and the change cascades everywhere it is used.'
			},
			{
				label: 'Styling Components',
				href: '/docs/theming/components',
				description:
					'Components expose a stable styling contract: an hz-* root class, a data-* attribute per variant and state, and a class prop merged after the root class. The reference theme styles exactly these hooks from @layer hz-theme, wrapped in :where() so everything stays at single-class specificity, which means your unlayered CSS wins by default.'
			},
			{
				label: 'Using with Tailwind',
				href: '/docs/theming/tailwind',
				description:
					'The library and Tailwind coexist cleanly: settle on one reset, order the cascade layers so Tailwind utilities win when you want them to, and pass utility classes to components through their class prop. None of it is Tailwind-specific plumbing; it is the same layer model the rest of the theme uses.'
			},
			{
				label: 'Section Themes',
				href: '/docs/theming/sections',
				description:
					'A theme does not have to own the whole page. Any element can carry one and everything inside it follows, so a single long page can change character section by section.'
			},
			{
				label: 'Example Themes',
				href: '/docs/theming/examples',
				description:
					'Three example themes, sorted by how much of the reference theme each one keeps: Ocean keeps all of it and only redefines --hz-* tokens, Docs keeps all of it and layers one class-hook override on top with no palette of its own, and Terminal keeps none of it. Ocean and Terminal are generated from a hyzer.config.ts beside them and, like the base tokens, meet WCAG AA on every graded pairing, in both modes.'
			}
		]
	},
	{
		label: 'Patterns',
		children: [
			{
				label: 'Homepage',
				href: '/docs/patterns/homepage',
				description:
					'A marketing-style landing page assembled entirely from library components, with no bespoke layout code and no custom CSS beyond a few type sizes.'
			},
			{
				label: 'Article',
				href: '/docs/patterns/article',
				description:
					'A long-form editorial page: a Hero opener, a byline, and a body that runs through a Blockquote pull-quote and a breakout image.'
			},
			{
				label: 'Recipe',
				href: '/docs/patterns/recipe',
				description:
					"A recipe page where the main dish photo opens as a Hero's split media, ahead of the ingredients and method."
			},
			{
				label: 'Docs shell',
				href: '/docs/patterns/docs-shell',
				description:
					'A documentation layout: a sidebar of collapsible nav sections, a reading column, and an "On this page" rail that follows the column\'s headings.'
			},
			{
				label: 'Command palette',
				href: '/docs/patterns/command-palette',
				description: 'A ⌘K quick-search overlay assembled from library components.'
			},
			{
				label: 'Product listing',
				href: '/docs/patterns/product-listing',
				description: 'A filterable shop page where the form controls drive the visible results.'
			},
			{
				label: 'Product detail',
				href: '/docs/patterns/product-detail',
				description: 'A single product page with a buy panel that updates as you pick options.'
			},
			{
				label: 'Checkout form',
				href: '/docs/patterns/checkout-form',
				description: 'The full Form workflow on a realistic checkout page.'
			},
			{
				label: 'Contact form',
				href: '/docs/patterns/contact-form',
				description:
					'The minimal end of the Form spectrum: four fields, one Select, and no order summary.'
			},
			{
				label: 'Virtualized table',
				href: '/docs/patterns/virtualized-table',
				description: 'A 6,000-row dataset windowed by Virtualizer, dressed as an ARIA table.'
			},
			{
				label: 'Virtualized combobox',
				href: '/docs/patterns/virtualized-combobox',
				description:
					'A multi-select text input plus a role="listbox" popup, windowed by Virtualizer, over tens of thousands of rows.'
			}
		]
	}
];

/** Flat list of every routable page (sections have no routes of their own). */
export const allRoutes: string[] = manifest.flatMap((entry) =>
	isSection(entry) ? sectionPages(entry).map((p) => p.href) : [entry.href]
);
