<script lang="ts">
	import { Combobox, Tabs, Stack, Alert } from '$lib';
	import type { FormOption, ComboboxChipProps } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { comboboxDoc } from '../../../../docs/data/combobox.js';
	import { COURSES, courseSlug } from '../../../../docs/data/courses.js';
	import Example from '../../../../docs/Example.svelte';

	const putters: FormOption[] = [
		{ value: 'aviar', label: 'Aviar' },
		{ value: 'luna', label: 'Luna' },
		{ value: 'judge', label: 'Judge' },
		{ value: 'zone', label: 'Zone (out of stock)', disabled: true },
		{ value: 'punisher', label: 'Punisher' }
	];

	// Pre-selects a disabled option's value too — its chip still renders and
	// stays dismissible even though its <li> is inert (Combobox-R5/R11).
	let bag = $state<string[]>(['aviar', 'zone']);

	const basicCode = [
		'const putters: FormOption[] = [',
		"\t{ value: 'aviar', label: 'Aviar' },",
		"\t{ value: 'luna', label: 'Luna' },",
		"\t{ value: 'judge', label: 'Judge' },",
		"\t{ value: 'zone', label: 'Zone (out of stock)', disabled: true },",
		"\t{ value: 'punisher', label: 'Punisher' }",
		'];',
		'',
		'<Combobox name="putters" label="Putters" options={putters} bind:value={bag} />'
	].join('\n');

	const discs: FormOption[] = [
		{ value: 'destroyer', label: 'Destroyer' },
		{ value: 'wraith', label: 'Wraith' },
		{ value: 'buzzz', label: 'Buzzz' },
		{ value: 'roc3', label: 'Roc3' }
	];

	// Custom filter: match on the start of the label instead of "contains".
	function startsWithFilter(query: string, option: FormOption): boolean {
		return option.label.toLowerCase().startsWith(query.toLowerCase());
	}

	const filterCode = [
		'function startsWithFilter(query: string, option: FormOption): boolean {',
		'\treturn option.label.toLowerCase().startsWith(query.toLowerCase());',
		'}',
		'',
		'<Combobox name="discs" label="Discs" options={discs} filter={startsWithFilter} />'
	].join('\n');

	const divisions: FormOption[] = [
		{ value: 'mpo', label: 'MPO' },
		{ value: 'fpo', label: 'FPO' },
		{ value: 'ma1', label: 'MA1' },
		{ value: 'ma2', label: 'MA2' }
	];

	const chipStyle: ComboboxChipProps = { intent: 'primary', variant: 'solid', rounded: 'md' };

	const chipsCode = [
		'<Combobox',
		'\tname="divisions"',
		'\tlabel="Divisions"',
		'\toptions={divisions}',
		"\tchipProps={{ intent: 'primary', variant: 'solid', rounded: 'md' }}",
		'/>'
	].join('\n');

	const tees: FormOption[] = [
		{ value: 'short', label: 'Short tees' },
		{ value: 'long', label: 'Long tees' }
	];

	// Demo: a real, curated dataset (src/docs/data/courses.ts) — actual disc
	// golf courses, not generated filler. Combobox has no windowing
	// (specs/23-virtualizer.md's Out of Scope defers that integration), so
	// this is the honest ceiling: a static dataset filtered client-side. A
	// few dozen real courses is comfortably inside that ceiling — see the
	// Virtualized combobox pattern for what tens of thousands of rows needs.
	const manyCourses: FormOption[] = COURSES.map((course) => ({
		value: courseSlug(course),
		label: `${course.name} — ${course.location}`
	}));

	let manyValue = $state<string[]>([]);

	const largeCode = [
		"import { COURSES, courseSlug } from './courses';",
		'',
		'const manyCourses: FormOption[] = COURSES.map((course) => ({',
		'\tvalue: courseSlug(course),',
		'\tlabel: `${course.name} — ${course.location}`',
		'}));',
		'',
		'<Combobox name="courses" label="Course" options={manyCourses} />'
	].join('\n');

	const statesCode = [
		'<Combobox',
		'\tname="tees"',
		'\tlabel="Tee position"',
		'\toptions={tees}',
		'\tdescription="Pick every tee your card is playing today."',
		'/>',
		'',
		'<Combobox name="division-error" label="Divisions" options={divisions} error="Pick at least one division." />',
		'<Combobox name="division-required" label="Divisions" options={divisions} required />',
		'<Combobox name="tees-disabled" label="Tee position" options={tees} disabled />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'filter', label: 'Custom filter' },
		{ id: 'large', label: 'Large list (filtering)' },
		{ id: 'chips', label: 'Styled chips' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="Combobox" {...comboboxDoc}>
	<Alert intent="info" title="Select vs Combobox">
		Reach for <code>Combobox</code> when there are many options — where filtering or virtualization
		helps — or when you need search / type-to-filter. For a small, static option set, prefer the
		simpler native <a href="/docs/components/select">Select</a>, including its own native
		<code>multiple</code>.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Combobox demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Type to filter, or open with the toggle/<kbd>ArrowDown</kbd>. Clicking (or pressing
						<kbd>Enter</kbd> on) an option toggles its membership — the popup stays open so you can
						keep picking, and each pick becomes a dismissible chip. <kbd>Backspace</kbd> on an empty
						query removes the last chip. A disabled option (<code>Zone</code>) stays visible but
						can't be toggled — its chip is pre-selected here to show that an existing selection
						stays removable even when the option itself is inert.
					</p>
					<Example code={basicCode}>
						<div class="demo-col">
							<Combobox name="putters-demo" label="Putters" options={putters} bind:value={bag} />
						</div>
					</Example>
				{:else if item.id === 'filter'}
					<p class="tab-note">
						<strong>The default filter matches a substring anywhere in the label</strong> —
						case-insensitive, not anchored to the start (typing a fragment from the middle or end of
						a label still matches it; see the Large list tab). Passing your own <code>filter</code> prop
						overrides that default wholesale. This demo deliberately swaps in a narrower one — start-of-label
						only — to show what overriding looks like; it is not what Combobox does by default.
					</p>
					<Example code={filterCode}>
						<div class="demo-col">
							<Combobox name="discs-demo" label="Discs" options={discs} filter={startsWithFilter} />
						</div>
					</Example>
				{:else if item.id === 'large'}
					<p class="tab-note">
						{manyCourses.length} real disc golf courses, filtered by the same substring-anywhere default
						as every other tab — try typing a fragment from the <em>middle</em> of a course or city
						name (e.g. <code>ridge</code> or <code>ville</code>) and it still matches, because the
						match isn't anchored to the start of the label.
					</p>
					<Alert intent="warning" title="Combobox doesn't window its listbox">
						Filtering is a plain in-memory scan, and every matching option gets a real
						<code>&lt;li&gt;</code>. A list this size is comfortable even on the unfiltered open,
						but opening tens of thousands of options would mount that many nodes and visibly lag.
						Past that scale, reach for the
						<a href="/docs/patterns/virtualized-combobox">Virtualized combobox</a> pattern, which
						windows the listbox with <a href="/docs/components/virtualizer">Virtualizer</a>.
					</Alert>
					<Example code={largeCode}>
						<div class="demo-col">
							<Combobox
								name="courses-demo"
								label="Course"
								options={manyCourses}
								bind:value={manyValue}
								placeholder="Search real courses..."
							/>
						</div>
					</Example>
				{:else if item.id === 'chips'}
					<p class="tab-note">
						<code>chipProps</code> restyles every chip without importing <code>Badge</code> yourself
						— <code>intent</code>/<code>variant</code>/<code>size</code>/<code>rounded</code>/<code
							>class</code
						>
						pass straight through to the underlying <code>Badge</code>. It applies uniformly to
						every chip (no per-option styling).
					</p>
					<Example code={chipsCode}>
						<div class="demo-col">
							<Combobox
								name="divisions-demo"
								label="Divisions"
								options={divisions}
								chipProps={chipStyle}
							/>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the field — both
						chain into <code>aria-describedby</code>, even though they're visually hidden while the
						popup is open (the popup overlays that region). Error and disabled are also field
						states: the wrapper's <code>data-state</code> reflects them, with error winning (the
						input and toggle still get native <code>disabled</code>, and chips lose their dismiss
						buttons).
					</p>
					<Example code={statesCode}>
						<div class="demo-col">
							<Stack gap="md">
								<Combobox
									name="tees-demo"
									label="Tee position"
									options={tees}
									description="Pick every tee your card is playing today."
								/>
								<Combobox
									name="division-error-demo"
									label="Divisions"
									options={divisions}
									error="Pick at least one division."
								/>
								<Combobox name="required-demo" label="Divisions" options={divisions} required />
								<Combobox name="disabled-demo" label="Tee position" options={tees} disabled />
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
