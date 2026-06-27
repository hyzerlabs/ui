<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FormError } from '$lib/types';
	import { cx, uid } from '$lib/utils';

	interface Props {
		errors?: FormError[];
		onSubmit?: (e: SubmitEvent) => void;
		summaryTitle?: string;
		summaryHeadingLevel?: 2 | 3 | 4 | 5 | 6;
		focusTarget?: 'summary' | 'firstField';
		novalidate?: boolean;
		ariaLabel?: string;
		children: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		errors = [],
		onSubmit,
		summaryTitle = 'There is a problem',
		summaryHeadingLevel = 2,
		focusTarget = 'summary',
		novalidate = false,
		ariaLabel,
		children,
		class: className,
		...rest
	}: Props = $props();

	// Form-R3: stable IDs per instance.
	const _uid = uid('hz');
	const summaryId = `hz-form-summary-${_uid}`;

	// Form-R1: bind:this on the form element for form.elements access (Form-R4/R7).
	let formEl: HTMLFormElement | null = $state(null);

	// Form-R2/R5: internal flag — set true on every submit, consumed by the focus
	// effect (reset to false after focus moves so corrections re-trigger on next submit).
	let submitAttempted = $state(false);

	// Form-R3: summary div ref (tabindex="-1" so it is programmatically focusable).
	let summaryEl: HTMLDivElement | null = $state(null);

	// ---------------------------------------------------------------------------
	// Form-R4: resolve a field element from form.elements[name].
	// Returns the first radio for RadioNodeList; null when unresolvable.
	// ---------------------------------------------------------------------------
	function resolveElement(name: string): HTMLElement | null {
		if (!formEl || !name) return null;
		const el = formEl.elements.namedItem(name);
		if (!el) return null;
		// RadioNodeList — target the first radio.
		if (el instanceof RadioNodeList) {
			for (const node of el) {
				if (node instanceof HTMLElement) return node;
			}
			return null;
		}
		if (el instanceof HTMLElement) return el;
		return null;
	}

	// ---------------------------------------------------------------------------
	// Form-R4: sort resolved errors by DOM position; form-level errors last.
	// ---------------------------------------------------------------------------
	interface ResolvedError {
		message: string;
		el: HTMLElement | null; // null = form-level / unresolvable
	}

	const resolvedErrors = $derived.by((): ResolvedError[] => {
		if (!formEl || errors.length === 0) return [];

		const linked: ResolvedError[] = [];
		const formLevel: ResolvedError[] = [];

		for (const err of errors) {
			const el = resolveElement(err.name);
			if (el) {
				linked.push({ message: err.message, el });
			} else {
				formLevel.push({ message: err.message, el: null });
			}
		}

		// Sort linked errors by their DOM order.
		linked.sort((a, b) => {
			if (!a.el || !b.el) return 0;
			const pos = a.el.compareDocumentPosition(b.el);
			if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
			if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
			return 0;
		});

		return [...linked, ...formLevel];
	});

	// ---------------------------------------------------------------------------
	// Form-R2: submit handler.
	// ---------------------------------------------------------------------------
	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitAttempted = true;
		onSubmit?.(e);
	}

	// ---------------------------------------------------------------------------
	// Form-R6: jump-to-field handler for summary links / buttons.
	// ---------------------------------------------------------------------------
	function handleItemActivation(e: MouseEvent | KeyboardEvent, el: HTMLElement) {
		e.preventDefault();
		el.focus();

		const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: motionOk ? 'smooth' : 'auto' });
	}

	// ---------------------------------------------------------------------------
	// Form-R5: move focus exactly once per submit attempt, when errors are present.
	// Gated on submitAttempted; reset immediately so the next submit re-triggers.
	// ---------------------------------------------------------------------------
	$effect(() => {
		if (!submitAttempted) return;
		if (errors.length === 0) {
			// No errors — consume the flag without moving focus.
			submitAttempted = false;
			return;
		}

		// Consume the flag before the async DOM settle.
		submitAttempted = false;

		// Defer one microtask so the summary has been painted before we focus it.
		queueMicrotask(() => {
			if (focusTarget === 'firstField') {
				// Find the first resolved (linked) error and focus its control.
				const first = resolvedErrors.find((r) => r.el !== null);
				if (first?.el && document.contains(first.el)) {
					first.el.focus();
					return;
				}
			}
			// Default: focus the summary container (guard: still mounted).
			if (summaryEl && document.contains(summaryEl)) {
				summaryEl.focus();
			}
		});
	});
</script>

<!--
	Form-R1: <form class="hz-form"> with rest-first spread (managed attrs win).
	Form-R8: cx('hz-form', className).
	Form-R3: data-state="error" when summary is shown.
-->
<form
	{...rest}
	bind:this={formEl}
	class={cx('hz-form', className)}
	data-state={errors.length > 0 ? 'error' : undefined}
	aria-label={ariaLabel}
	novalidate={novalidate || undefined}
	onsubmit={handleSubmit}
>
	<!--
		Form-R3: summary is the FIRST child of the form, rendered only when
		errors.length > 0. role="alert" announces changes; tabindex="-1" allows
		programmatic focus (Form-R5).
	-->
	{#if errors.length > 0}
		<div
			bind:this={summaryEl}
			class="hz-form-error-summary"
			role="alert"
			tabindex="-1"
			aria-labelledby={summaryId}
		>
			<!--
				Form-R3: dynamic heading level via svelte:element.
				Form-R3: heading id referenced by aria-labelledby.
			-->
			<svelte:element this={'h' + summaryHeadingLevel} id={summaryId} class="hz-form-summary-title">
				{summaryTitle}
			</svelte:element>

			<!--
				Form-R4: one <li> per resolved error, sorted by DOM position with
				form-level errors last. Each item is:
				  - <a href="#id"> when control has an id
				  - <button type="button"> when control has no id
				  - plain text when no control resolves (form-level)
			-->
			<ul class="hz-form-error-list">
				{#each resolvedErrors as resolved, i (i)}
					<li class="hz-form-error-summary-item">
						{#if resolved.el && resolved.el.id}
							<!-- Linked error: anchor targeting control by id. -->
							<a href="#{resolved.el.id}" onclick={(e) => handleItemActivation(e, resolved.el!)}>
								{resolved.message}
							</a>
						{:else if resolved.el}
							<!-- Resolved but no id: button that focuses the control. -->
							<button type="button" onclick={(e) => handleItemActivation(e, resolved.el!)}>
								{resolved.message}
							</button>
						{:else}
							<!-- Form-level error: plain text, not interactive. -->
							{resolved.message}
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Form children (fields, submit button, etc.). -->
	{@render children()}
</form>

<style>
	/* Form-R3: summary is a full-width block at the top. */
	.hz-form-error-summary {
		display: block;
		width: 100%;
	}

	/* Structural list reset — no visual list markers. */
	.hz-form-error-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.hz-form-summary-title {
		margin: 0;
	}

	.hz-form-error-summary-item {
		display: block;
	}
</style>
