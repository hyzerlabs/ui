<script lang="ts">
	import { Alert, Badge, Button, CodeBlock, Stack, theme } from '$lib';
	import { resolveConfig, generateCss } from '$lib/config';
	import oceanConfig from '$lib/theme/examples/ocean.config';
	import Example from '../../../../docs/Example.svelte';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// Terminal ships class-rooted: every rule in it is under
	// .hz-theme-terminal, so importing the real sheet here themes the demo
	// band and nothing else. The docs app's own theme is untouched. Ocean
	// cannot do that — it is a :root sheet by design — so it gets regenerated
	// under a class below instead. Same pair, same trick, as the Example
	// themes page.
	import '$lib/theme/examples/terminal/terminal.css';

	const scopedOceanCss = generateCss(resolveConfig(oceanConfig), {
		mode: 'overrides',
		selector: '.theme-ocean'
	});

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
		'# A class scope composes with dark mode, which a themes entry cannot:',
		'hyzer generate --mode overrides --selector .theme-ocean',
		'',
		'<div class="theme-ocean">        <!-- ocean, in whichever mode is active -->',
		'\t<section data-theme="dark">…</section>',
		'</div>'
	].join('\n');
</script>

<svelte:head>
	<title>Section Themes — @hyzer-labs/ui</title>
	<!-- Engine-generated CSS from our own committed config — no user input. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>${scopedOceanCss}</style>`}
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
				<div class="demo-band" {@attach theme('default')}>
					<Badge intent="primary">default</Badge>
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
		<p>
			Weighing this against a class scope or a plain token override? See
			<a href="/docs/theming/overview#where-heading">Where to override what</a> on Theming Overview.
		</p>
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
			<code>dark</code> comes free. You need no <code>themes.dark</code> entry to have it: the
			library authors a complete dark theme, seeded from its contrast-tuned hues, and the
			<code>prefers-color-scheme</code> block above follows it. Add a <code>dark</code> entry only when
			you want to change dark. What you set there merges over what the library already authors rather
			than replacing it.
		</p>
		<p>
			You cannot rename <code>dark</code>, because the name is not this library's. It is the
			platform's: it matches <code>prefers-color-scheme: dark</code> and
			<code>color-scheme: dark</code>, and the reference theme's own rules use the same word.
		</p>
		<p>
			Your default block has no platform name, so you choose one. <code>defaultThemeName</code> sets
			it, and it is <code>'default'</code> until you change it. That name is reserved as a
			<code>themes</code> key: the default theme is the <code>:root</code> block you author through
			<code>tokens</code>, not a <code>themes</code> entry. <code>[data-theme='default']</code>
			re-asserts it for a reader whose system prefers dark.
		</p>
		<p>
			Want a hook to look different in dark mode? Point it at a token, then override that token
			under
			<code>dark</code>. See
			<a href="/docs/theming/components#hook-props-heading">Component hooks</a> for the pattern.
		</p>
		<p>
			Supporting only one theme? Put <code>data-theme="default"</code> or
			<code>data-theme="dark"</code> on <code>&lt;html&gt;</code> and leave it there. A named
			attribute at the root permanently outranks the <code>prefers-color-scheme</code> block, so the page
			stays on that theme whatever the reader's system prefers. No script needed. This only suppresses
			the system default at runtime; the dark CSS still ships either way.
		</p>
		<p>
			One attribute holds one value, so themes are <strong>mutually exclusive</strong>. There is no
			“ocean, but dark” unless you define it. The <code>'ocean-dark'</code> entry above is that definition.
		</p>
		<p>
			Density is the one group that needs the whole page. On a section a theme only half applies.
			The near and away distances are computed on <code>body</code>, above where the section sits,
			so the section's own spacing keeps the page's density. A <code>data-density-shift</code>
			region inside the section does pick up the theme's value, so the result looks inconsistent rather
			than ignored. Put a theme that changes density on <code>&lt;html&gt;</code>, where it retunes
			everything.
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
		<Alert intent="info" title="Most projects never need this">
			{#snippet icon()}<IconInfo />{/snippet}
			A named theme is the simpler tool, and it covers almost every case. Reach past it only when a region
			has to keep its own palette <em>and</em> still follow the page between light and dark. An
			entry in
			<code>themes</code> cannot do both.
		</Alert>
		<p>
			The other way is to generate the sheet under a class of your own instead of
			<code>:root</code>.
			<a href="/docs/foundation/config#scope-heading">Scope the sheet to a class</a>
			covers how. A class and <code>data-theme</code> are separate hooks, so a class-scoped region keeps
			its own palette in whichever mode the page is in.
		</p>
		<p>
			Both bands below carry only a class. Neither sets <code>data-theme</code>, so both follow the
			page. Flip this site's light/dark toggle and watch each band change into its own dark form.
		</p>

		<Example code={classCode}>
			<Stack gap="near">
				<div class="demo-band theme-ocean">
					<Badge intent="primary">ocean</Badge>
					<p>Teal on slate. Tokens only, and the reference theme does the rest.</p>
					<Button intent="primary">Primary</Button>
				</div>

				<div class="demo-band hz-theme-terminal">
					<Badge intent="primary">terminal</Badge>
					<p>Phosphor on black, in its own mono. No reference theme underneath it.</p>
					<Button intent="primary">Primary</Button>
				</div>
			</Stack>
		</Example>

		<p>
			Each of those sheets names a <code>dark</code> theme of its own. That is what gives it a
			second form to switch into. Put the same theme in <code>themes</code> instead and the attribute
			is spent on the name. The region then looks the way you defined it, in both modes.
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
