<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FormError } from '$lib/types';
	import { cx } from '$lib/utils';
	import Alert from './Alert.svelte';

	interface Props {
		errors?: FormError[];
		onSubmit?: (e: SubmitEvent) => void;
		summaryTitle?: string | ((count: number) => string);
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
		summaryTitle,
		summaryHeadingLevel = 2,
		focusTarget = 'summary',
		novalidate = false,
		ariaLabel,
		children,
		class: className,
		...rest
	}: Props = $props();

	// ---------------------------------------------------------------------------
	// Plain-language default: count-aware, singular vs. plural, numeral count.
	// The summary lists one item per entry in `errors` (form-level
	// entries count too), so `errors.length` is the total it enumerates.
	// ---------------------------------------------------------------------------
	function defaultSummaryTitle(count: number): string {
		return count === 1 ? 'There is a problem' : `There are ${count} problems`;
	}

	const resolvedSummaryTitle = $derived(
		typeof summaryTitle === 'function'
			? summaryTitle(errors.length)
			: (summaryTitle ?? defaultSummaryTitle(errors.length))
	);

	// bind:this on the form element for form.elements access.
	let formEl: HTMLFormElement | null = $state(null);

	// internal flag — set true on every submit, consumed by the focus
	// effect on the first `errors` reassignment after the submit (sync from
	// onSubmit or async from an action response). `errorsAtSubmit` snapshots the
	// pre-submit reference so async errors are awaited, not the stale array.
	let submitAttempted = $state(false);
	let errorsAtSubmit: FormError[] | null = null;

	// The summary is an Alert (no element ref exposed) —
	// focus resolves it by class inside this form.
	function summaryEl(): HTMLElement | null {
		return formEl?.querySelector<HTMLElement>('.hz-form-error-summary') ?? null;
	}

	// ---------------------------------------------------------------------------
	// resolve a field element from form.elements[name].
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
	// sort resolved errors by DOM position; form-level errors last.
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
	// submit handler.
	// ---------------------------------------------------------------------------
	function handleSubmit(e: SubmitEvent) {
		// client mode (onSubmit provided) intercepts the submit; native
		// mode lets it proceed — full-page POST or use:enhance.
		if (onSubmit) e.preventDefault();
		submitAttempted = true;
		errorsAtSubmit = errors;
		onSubmit?.(e);
	}

	// ---------------------------------------------------------------------------
	// jump-to-field handler for summary links / buttons.
	// ---------------------------------------------------------------------------
	function handleItemActivation(e: MouseEvent | KeyboardEvent, el: HTMLElement) {
		e.preventDefault();
		el.focus();

		const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: motionOk ? 'smooth' : 'auto' });
	}

	// ---------------------------------------------------------------------------
	// move focus exactly once per submit attempt, when errors are present.
	// The flag is consumed by the first `errors` REASSIGNMENT after the submit —
	// until then (async validation still in flight) it stays pending.
	// ---------------------------------------------------------------------------
	$effect(() => {
		if (!submitAttempted) return;
		// Still the pre-submit array AND nothing showing — async errors in
		// flight, keep waiting. (A visible stale summary re-focuses immediately.)
		if (errors === errorsAtSubmit && errors.length === 0) return;

		// Consume the flag; empty errors (validation passed) move no focus.
		submitAttempted = false;
		if (errors.length === 0) return;

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
			// Default: focus the summary Alert (guard: still mounted).
			const summary = summaryEl();
			if (summary && document.contains(summary)) {
				summary.focus();
			}
		});
	});

	// ---------------------------------------------------------------------------
	// a native `reset` (use:enhance's default success path) consumes the
	// flag without moving focus. addEventListener — not a managed onreset — so a
	// consumer `onreset` passed via ...rest is not clobbered.
	// ---------------------------------------------------------------------------
	$effect(() => {
		const el = formEl;
		if (!el) return;
		const consume = () => {
			submitAttempted = false;
		};
		el.addEventListener('reset', consume);
		return () => el.removeEventListener('reset', consume);
	});
</script>

<!--
	<form class="hz-form"> with rest-first spread (managed attrs win).
	cx('hz-form', className).
	data-state="error" when summary is shown.
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
		The summary IS a danger Alert — first child of the
		form, rendered only when errors.length > 0. role="alert" (announces) and
		tabindex="-1" (programmatic focus) ride Alert's rest; the Alert
		labels itself from its title.
	-->
	{#if errors.length > 0}
		<Alert
			intent="danger"
			class="hz-form-error-summary"
			role="alert"
			tabindex={-1}
			title={resolvedSummaryTitle}
			headingLevel={summaryHeadingLevel}
		>
			<!--
				one <li> per resolved error, sorted by DOM position with
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
		</Alert>
	{/if}

	<!-- Form children (fields, submit button, etc.). -->
	{@render children()}
</form>

<style>
	/* Structural list reset — no visual list markers. The summary box itself
	 * is the Alert's concern. */
	.hz-form-error-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.hz-form-error-summary-item {
		display: block;
	}
</style>
