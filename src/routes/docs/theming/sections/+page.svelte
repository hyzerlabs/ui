<script lang="ts">
	import { Alert, Badge, Button, CodeBlock, Stack, theme } from '$lib';
	import Example from '../../../../docs/Example.svelte';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// The inline form's override object, kept in one place so the demo and the
	// code sample below it can never disagree. Radius and weight are here too,
	// not just color: a theme is a token override, so the square corners and
	// bolder labels below come out of the same object as the hues.
	const inlineTheme = {
		palette: { primary: '#b45309', gray: '#78716c' },
		color: { surface: '#fffbeb', text: '#1c1917' },
		radius: { md: '0', full: '0' },
		typography: { fontWeight: { medium: '700' } }
	};

	const namedCode = [
		"import { theme } from '@hyzer-labs/ui';",
		'',
		"<section {@attach theme('dark')}>",
		'\t<!-- everything in here is dark, whatever the page around it is -->',
		'</section>'
	].join('\n');

	const attributeCode = [
		'<!-- identical result, no import: this is all the attachment writes -->',
		'<section data-theme="dark">…</section>'
	].join('\n');

	const inlineCode = [
		"import { theme } from '@hyzer-labs/ui';",
		'',
		'const warm = {',
		"\tpalette: { primary: '#b45309', gray: '#78716c' },",
		"\tcolor: { surface: '#fffbeb', text: '#1c1917' },",
		"\tradius: { md: '0', full: '0' },     // square corners, not just new colors",
		"\ttypography: { fontWeight: { medium: '700' } }",
		'};',
		'',
		'<section {@attach theme(warm)}>…</section>'
	].join('\n');

	const configCode = [
		'// hyzer.config.ts',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		'\tthemes: {',
		"\t\tdark: { palette: { primary: '#60a5fa' } },  // the built-in, yours to extend",
		'\t\tocean: { palette: { primary: \'#0ea5e9\' } }, // data-theme="ocean"',
		"\t\t'ocean-dark': { color: { surface: '#0b1120' } }",
		'\t}',
		'});'
	].join('\n');

	const classCode = [
		'// A class scope is the other mechanism, and the more expressive one:',
		'// it COMPOSES with dark mode, which a themes entry cannot.',
		"generateCss(resolveConfig(oceanConfig), { selector: '.theme-ocean' });",
		'',
		'<div class="theme-ocean">        <!-- ocean, in whichever mode is active -->',
		'\t<section data-theme="dark">…</section>',
		'</div>'
	].join('\n');
</script>

<svelte:head>
	<title>Section Themes — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro />

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="named-heading"
	>
		<h2 id="named-heading">Name a theme</h2>
		<p>
			<code>theme('dark')</code> puts <code>data-theme="dark"</code> on the element. Each band below carries
			a different theme, on the same page, at the same time.
		</p>

		<Example code={namedCode}>
			<Stack gap="near">
				<div class="demo-band" {@attach theme('light')}>
					<Badge intent="primary">light</Badge>
					<p>The default theme, restored explicitly, even inside a dark page.</p>
					<Button intent="primary">Primary</Button>
				</div>

				<div class="demo-band" {@attach theme('dark')}>
					<Badge intent="primary">dark</Badge>
					<p>Surfaces, text, borders and every intent follow the attribute.</p>
					<Button intent="primary">Primary</Button>
				</div>

				<div class="demo-band" {@attach theme(inlineTheme)}>
					<Badge intent="primary">inline</Badge>
					<p>
						An override object, resolved at runtime, with no config entry needed. The square corners
						and bolder label come from that object too: a theme can carry type and radii, not only
						color.
					</p>
					<Button intent="primary">Primary</Button>
				</div>
			</Stack>
		</Example>

		<Alert intent="info" title="It really is just an attribute">
			{#snippet icon()}<IconInfo />{/snippet}
			The attachment is a convenience. It writes one attribute and restores whatever was there when it
			unmounts. Writing the attribute yourself is just as valid, and it works without JavaScript.
		</Alert>

		<CodeBlock code={attributeCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="config-heading"
	>
		<h2 id="config-heading">Define your themes</h2>
		<p>
			Named themes come from the <code>themes</code> map in your config. Each entry becomes one
			<code>[data-theme="…"]</code> block in the generated sheet, and a themed section with color of its
			own is graded for contrast the same way the built-in dark theme is — a theme with no color has nothing
			to grade.
		</p>
		<p>
			A theme entry takes any group <code>tokens</code> takes: type, spacing, radii, motion, not only
			color. The inline override object in the section above is the same shape. A theme is a token override,
			named or inline.
		</p>
		<CodeBlock code={configCode} />
		<p>
			<code>dark</code> is an entry like any other. It merges over what the library already authors
			rather than replacing it. <code>light</code> is a reserved name. The default theme is the
			<code>:root</code> block you author through <code>tokens</code>, and
			<code>[data-theme='light']</code> re-asserts that default for a reader whose system prefers dark.
		</p>
		<p>
			One attribute holds one value, so themes are <strong>mutually exclusive</strong>. There is no
			“ocean, but dark” unless you define it. The <code>'ocean-dark'</code> entry above is that definition.
		</p>
		<p>
			Density is the one group that needs the whole page. On <code>&lt;html&gt;</code> a theme
			retunes it completely. On a section it only half applies: the near and away distances are
			computed on
			<code>body</code>, above where the section sits, so the section's own spacing keeps the page's
			density. Any <code>data-density-shift</code> region inside the section does pick up the new
			value, which is why the result looks inconsistent rather than ignored. Put a theme that
			changes density on <code>&lt;html&gt;</code>.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="inline-heading"
	>
		<h2 id="inline-heading">Theme a section without a config entry</h2>
		<p>
			Pass an override object instead of a name. The library resolves it in the browser, then writes
			it to the element as inline custom properties. Reach for this when the theme comes from data:
			a per-tenant accent, or a color the user picked. A build-time entry is not an option there.
		</p>
		<CodeBlock code={inlineCode} />
		<Alert intent="warning" title="Two trade-offs worth knowing">
			{#snippet icon()}<IconTriangleAlert />{/snippet}
			The resolver loads on demand, so an inline section paints unthemed for one frame. That is invisible
			below the fold and noticeable at the top of a page. An inline object is not contrast-graded either.
			The generator checks named themes against WCAG AA when it writes the sheet, and an inline object
			never passes through that step.
		</Alert>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="class-heading"
	>
		<h2 id="class-heading">When to use a class instead</h2>
		<p>
			Scoping a generated sheet under a class is the other way to do this. For one case it is the
			better way. A class composes with <code>data-theme</code>, so a themed region still has a
			light and a dark form. A <code>themes</code> entry cannot, because it occupies the same attribute
			dark does. An entry that sets type, spacing and radii as well as color gives up more to that limit
			than a color-only one does.
		</p>
		<CodeBlock code={classCode} />
		<p>
			Reach for a <code>themes</code> entry when a section should look one specific way. Reach for a
			class when a whole region needs its own palette <em>and</em> still has to answer to the page's light/dark
			state.
		</p>
	</Stack>
</Stack>

<style>
	/* Each band paints its own surface so the theme boundary is visible —
	 * without this they would all sit on the page background and the point
	 * would be invisible. */
	.demo-band {
		background: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #111827);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.demo-band p {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
