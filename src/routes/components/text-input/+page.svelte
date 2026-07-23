<script lang="ts">
	import { TextInput, Tabs, Stack } from '$lib';
	import IconSearch from '$lib/icons/generated/search.svelte';
	import DocPage from '../../../docs/DocPage.svelte';
	import { textInputDoc } from '../../../docs/data/text-input.js';
	import Example from '../../../docs/Example.svelte';

	let playerName = $state('');

	const basicCode = [
		"let playerName = $state('');",
		'',
		'<TextInput name="player" label="Player name" bind:value={playerName} />'
	].join('\n');

	const inputTypes = [
		{
			id: 'email',
			code: '<TextInput name="email" label="Email" type="email" autocomplete="email" />'
		},
		{
			id: 'password',
			code: '<TextInput name="password" label="Password" type="password" autocomplete="current-password" />'
		},
		{
			id: 'search',
			code: '<TextInput name="q" label="Search courses" type="search" />'
		},
		{
			id: 'tel',
			code: '<TextInput name="phone" label="Phone" type="tel" autocomplete="tel" />'
		},
		{
			id: 'url',
			code: '<TextInput name="site" label="Club website" type="url" placeholder="https://" />'
		},
		{
			id: 'number',
			code: '<TextInput name="rating" label="PDGA rating" type="number" inputmode="numeric" />'
		},
		{
			id: 'date',
			code: '<TextInput name="round-date" label="Round date" type="date" />'
		},
		{
			id: 'time',
			code: '<TextInput name="tee-time" label="Tee time" type="time" />'
		},
		{
			id: 'datetime-local',
			code: '<TextInput name="start" label="Tournament start" type="datetime-local" />'
		}
	] as const;

	const prefixSuffixCode = [
		'<TextInput name="q" label="Search courses" type="search" hideLabel placeholder="Search courses…">',
		'\t{#snippet prefix()}<IconSearch />{/snippet}',
		'</TextInput>',
		'',
		'<TextInput name="distance" label="Longest throw" type="number" inputmode="numeric">',
		'\t{#snippet suffix()}ft{/snippet}',
		'</TextInput>'
	].join('\n');

	const statesCode = [
		'<TextInput',
		'\tname="pdga"',
		'\tlabel="PDGA number"',
		'\tdescription="Leave blank if you\'re not a member yet."',
		'/>',
		'',
		'<TextInput name="email" label="Email" type="email" error="Enter a valid email address." />',
		'<TextInput name="player" label="Player name" required />',
		'<TextInput name="division" label="Division" disabled value="MA2" />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'types', label: 'Input types' },
		{ id: 'prefix-suffix', label: 'Prefix & suffix' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="TextInput" {...textInputDoc}>
	<Tabs items={demoTabs} ariaLabel="TextInput demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<div class="demo-col">
							<TextInput name="player" label="Player name" bind:value={playerName} />
						</div>
					</Example>
				{:else if item.id === 'types'}
					<p class="tab-note">
						One component for every single-line type. Pair <code>type</code> with
						<code>autocomplete</code> and <code>inputmode</code> where it helps — autofill and the right
						virtual keyboard are most of the mobile form experience.
					</p>
					<Tabs
						items={inputTypes.map((t) => ({ id: t.id, label: t.id }))}
						ariaLabel="Input type"
						defaultTab="email"
					>
						{#snippet panel(tItem)}
							{@const t = inputTypes.find((x) => x.id === tItem.id)!}
							<div class="inner-tab">
								<Example code={t.code}>
									<div class="demo-col">
										{#if t.id === 'email'}
											<TextInput
												name="email-demo"
												label="Email"
												type="email"
												autocomplete="email"
											/>
										{:else if t.id === 'password'}
											<TextInput
												name="password-demo"
												label="Password"
												type="password"
												autocomplete="current-password"
											/>
										{:else if t.id === 'search'}
											<TextInput name="search-demo" label="Search courses" type="search" />
										{:else if t.id === 'tel'}
											<TextInput name="tel-demo" label="Phone" type="tel" autocomplete="tel" />
										{:else if t.id === 'url'}
											<TextInput
												name="url-demo"
												label="Club website"
												type="url"
												placeholder="https://"
											/>
										{:else if t.id === 'number'}
											<TextInput
												name="number-demo"
												label="PDGA rating"
												type="number"
												inputmode="numeric"
											/>
										{:else if t.id === 'date'}
											<TextInput name="date-demo" label="Round date" type="date" />
										{:else if t.id === 'time'}
											<TextInput name="time-demo" label="Tee time" type="time" />
										{:else}
											<TextInput
												name="datetime-demo"
												label="Tournament start"
												type="datetime-local"
											/>
										{/if}
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'prefix-suffix'}
					<p class="tab-note">
						The slots are decorative (<code>aria-hidden</code>) — an icon for a search box, a unit
						for a measurement. The search demo also uses <code>hideLabel</code>: the label stays for
						screen readers while the icon and placeholder carry the visual weight.
					</p>
					<Example code={prefixSuffixCode}>
						<div class="demo-col">
							<Stack gap="md">
								<TextInput
									name="search-prefix-demo"
									label="Search courses"
									type="search"
									hideLabel
									placeholder="Search courses…"
								>
									{#snippet prefix()}<IconSearch />{/snippet}
								</TextInput>
								<TextInput
									name="distance-demo"
									label="Longest throw"
									type="number"
									inputmode="numeric"
								>
									{#snippet suffix()}ft{/snippet}
								</TextInput>
							</Stack>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the field — both
						chain into <code>aria-describedby</code>. Error and disabled are also field states: the
						wrapper's <code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<div class="demo-col">
							<Stack gap="md">
								<TextInput
									name="pdga-demo"
									label="PDGA number"
									description="Leave blank if you're not a member yet."
								/>
								<TextInput
									name="email-error-demo"
									label="Email"
									type="email"
									error="Enter a valid email address."
								/>
								<TextInput name="required-demo" label="Player name" required />
								<TextInput name="disabled-demo" label="Division" disabled value="MA2" />
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
