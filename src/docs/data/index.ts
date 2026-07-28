/**
 * Doc data registry — keyed by component name, specs/40 R1.
 *
 * Mirrors hooks.ts: one module per component under src/docs/data/, each
 * exporting a typed `ComponentDoc`, assembled here into a single lookup.
 * Route pages import their own module directly and spread it into
 * `DocPage`; this registry exists for `data.spec.ts`'s two-way coverage
 * pin (mirroring `hooks.spec.ts`) and for the planned `llms.txt`/markdown
 * endpoints and MCP server (specs/40 goal) — one source that cannot drift
 * from the pages, the same way hooks.ts cannot drift from the theme.
 */
import type { ComponentDoc } from './types.js';

import { accordionDoc } from './accordion.js';
import { alertDoc } from './alert.js';
import { badgeDoc } from './badge.js';
import { bannerDoc } from './banner.js';
import { blockquoteDoc } from './blockquote.js';
import { buttonDoc } from './button.js';
import { codeBlockDoc } from './code-block.js';
import { linkDoc } from './link.js';
import { cardDoc } from './card.js';
import { dividerDoc } from './divider.js';
import { dropdownDoc } from './dropdown.js';
import { carouselDoc } from './carousel.js';
import { heroDoc } from './hero.js';
import { modalDoc } from './modal.js';
import { tabsDoc } from './tabs.js';
import { tableDoc } from './table.js';
import { loadingDoc } from './loading.js';
import { skeletonDoc } from './skeleton.js';

import { containerDoc } from './container.js';
import { stackDoc } from './stack.js';
import { clusterDoc } from './cluster.js';
import { gridDoc } from './grid.js';
import { splitDoc } from './split.js';
import { virtualizerDoc } from './virtualizer.js';

import { headerDoc } from './header.js';
import { navDoc } from './nav.js';
import { breadcrumbsDoc } from './breadcrumbs.js';
import { paginationDoc } from './pagination.js';
import { footerDoc } from './footer.js';
import { tocDoc } from './toc.js';

import { imageDoc } from './image.js';
import { lightboxDoc } from './lightbox.js';
import { videoDoc } from './video.js';

import { formDoc } from './form.js';
import { textInputDoc } from './text-input.js';
import { textareaDoc } from './textarea.js';
import { selectDoc } from './select.js';
import { comboboxDoc } from './combobox.js';
import { fileUploadDoc } from './file-upload.js';
import { checkboxDoc } from './checkbox.js';
import { radioGroupDoc } from './radio-group.js';
import { sliderDoc } from './slider.js';
import { rangeSliderDoc } from './range-slider.js';
import { colorInputDoc } from './color-input.js';
import { toggleDoc } from './toggle.js';

export type { ComponentDoc } from './types.js';

/**
 * Keyed by component name — matches the manifest's page labels, same
 * convention as hooks.ts.
 */
export const componentDocs: Record<string, ComponentDoc> = {
	// ---------------------------------------------------------------- Common
	Accordion: accordionDoc,
	Alert: alertDoc,
	Badge: badgeDoc,
	Banner: bannerDoc,
	Blockquote: blockquoteDoc,
	Button: buttonDoc,
	CodeBlock: codeBlockDoc,
	Link: linkDoc,
	Card: cardDoc,
	Divider: dividerDoc,
	Dropdown: dropdownDoc,
	Carousel: carouselDoc,
	Hero: heroDoc,
	Modal: modalDoc,
	Tabs: tabsDoc,
	Table: tableDoc,
	Loading: loadingDoc,
	Skeleton: skeletonDoc,

	// ---------------------------------------------------------------- Layout
	Container: containerDoc,
	Stack: stackDoc,
	Cluster: clusterDoc,
	Grid: gridDoc,
	Split: splitDoc,
	Virtualizer: virtualizerDoc,

	// ------------------------------------------------------------ Navigation
	Header: headerDoc,
	Nav: navDoc,
	Breadcrumbs: breadcrumbsDoc,
	Pagination: paginationDoc,
	Footer: footerDoc,
	Toc: tocDoc,

	// ----------------------------------------------------------------- Media
	Image: imageDoc,
	Lightbox: lightboxDoc,
	Video: videoDoc,

	// ----------------------------------------------------------------- Forms
	Form: formDoc,
	TextInput: textInputDoc,
	Textarea: textareaDoc,
	Select: selectDoc,
	Combobox: comboboxDoc,
	FileUpload: fileUploadDoc,
	Checkbox: checkboxDoc,
	RadioGroup: radioGroupDoc,
	Slider: sliderDoc,
	RangeSlider: rangeSliderDoc,
	ColorInput: colorInputDoc,
	Toggle: toggleDoc
};
