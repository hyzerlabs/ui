<script lang="ts">
	/**
	 * A long-form editorial article composed entirely from the library.
	 *
	 * It imports only public exports. This is the prose-heavy end of the
	 * pattern set: a Hero opens it, an author/date byline sits under the title,
	 * and the body runs through a Blockquote pull-quote and a breakout image
	 * before closing. The breakout image is the width-sensitive demo. It lives
	 * in the same narrow prose column as the rest of the body copy, but escapes
	 * it with `<Container breakout>` to span the full content area, the same
	 * convention the Container and Table docs pages use to show off-column
	 * bleed. The breakout is centered explicitly (`--hz-breakout-shift` reset
	 * to its natural centering formula) rather than inheriting whatever shift
	 * value an ambient layout sets. The prose column here is itself centered
	 * (`Container max="md"`, default `center`), so a shift of `0` would grow
	 * the image only rightward instead of bleeding evenly past both edges of
	 * the column.
	 */
	import { Hero, Container, Stack, Cluster, Divider, Blockquote, Image } from '$lib';

	// Generated editorial art, so this file needs no asset files to run. Swap
	// in your own photography by pointing ARTICLE_MEDIA at your image source,
	// whatever it is: imported files, a static path, or a CDN URL. The one
	// render call site below reads ARTICLE_MEDIA[key] and never a raw URL, so
	// that swap is a change to this one constant.
	function courseArt(label: string, bg: string, fg: string): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E` +
			`%3Crect width='1200' height='600' fill='%23${bg}'/%3E` +
			`%3Cpath d='M0 420 Q300 340 600 400 T1200 380 V600 H0 Z' fill='%23${fg}'/%3E` +
			`%3Ccircle cx='980' cy='150' r='70' fill='%23${fg}' fill-opacity='0.6'/%3E` +
			`%3Ctext x='50%25' y='94%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='22' font-family='system-ui'%3E` +
			encodeURIComponent(label) +
			`%3C/text%3E%3C/svg%3E`
		);
	}

	const ARTICLE_MEDIA: Record<string, string> = {
		dogleg: courseArt('A wooded dogleg, hole 7', '14532d', '4ade80')
	};
</script>

<!-- headingLevel=2: the route's own h1 is the page title, so the sample's
     top heading sits a level below it rather than competing for the
     document's h1. -->
<Hero
	headingLevel={2}
	eyebrow="Course design"
	title="How Designers Build a Hole That Argues for One Line"
	subtitle="Behind every flag and basket is a designer betting you'll choose the risky line, then building the hole so that bet pays off."
/>

<Container max="md" padding="lg">
	<Stack gap="lg" as="article">
		<div class="byline">
			<Cluster gap="sm" justify="between" align="center">
				<Cluster gap="sm" align="center">
					<span>By Casey Renner</span>
					<span aria-hidden="true">·</span>
					<span class="muted">Course design editor</span>
				</Cluster>
				<time class="muted" datetime="2026-06-12">June 12, 2026 · 8 min read</time>
			</Cluster>
		</div>

		<Divider spacing="none" />

		<div class="prose">
			<h3>Start with the land, not the layout</h3>
			<p>
				Every good hole starts the same way: a designer walks the property before they draw
				anything. The trees, the elevation change, the creek that floods every spring are not
				obstacles to route around. They are the raw material. A flat, featureless field makes for a
				boring hole no matter how cleverly the basket is placed. A stand of oaks with a ten-foot
				drop from tee to green gives a designer something to argue with.
			</p>
			<p>
				At Maple Hill, the back nine's elevation did most of the design work before a single tree
				was cleared. The routing team spent two full days just walking the ridgeline, flagging
				sightlines, before they placed a single tee pad. That patience shows up in the finished
				holes. Nothing on the back nine feels imposed on the land, because none of it was.
			</p>

			<h3>Risk has to be optional</h3>
			<p>
				The most common mistake in course design is a hole with only one playable line. If every
				player from beginner to pro throws the identical flex shot around the identical tree, the
				hole is testing execution of a single shot rather than decision-making. The best doglegs
				give you a safe route to the green in three comfortable shots and a riskier route that turns
				it into a two. They also make both routes visible from the tee, so the choice is a real one
				and not a surprise you discover mid-flight.
			</p>
			<p>
				That is the part course design shares with poker more than architecture: you are building a
				decision with a real cost on both sides of it, not a puzzle with one solution.
			</p>

			<!-- intent="success": the green accent line echoes the breakout
			     photo's fairway green further down the page. -->
			<Blockquote intent="success" cite="Dana Kessler, lead designer, Fairwood Design Collective">
				<p>
					You're not building a hole so a pro can birdie it. You're building a hole that makes an
					average player stand on the tee, look at the gap in the trees, and choose the line they'll
					be talking about at the bar that night, win or lose.
				</p>
			</Blockquote>

			<p>
				That tension is deliberate. A hole that only rewards the safe line teaches players nothing
				about their own game. A hole that only rewards the risky line just punishes anyone who is
				not already elite. The sweet spot sits between the two, and it moves depending on who is
				standing on the tee.
			</p>
		</div>

		<!--
			Breakout image: the width-sensitive demo convention. The Container
			above is capped at max="md". This nested Container escapes that
			column and spans the nearest ancestor with container-type:
			inline-size (the docs shell's main content area), so the image
			reads as a deliberate full-bleed break in the column rather than
			just another inline img.

			--hz-breakout-shift is reset to Container's own default centering
			formula here, rather than left to inherit whatever an ambient layout
			sets, because the prose column above is itself centered. A
			start-aligned shift of 0 would only grow the image rightward,
			reading as offset rather than centered on the column. The formula is
			the same one Container's breakout falls back to on its own. Setting
			it explicitly just makes the centering immune to ambient overrides
			(the docs shell sets one for its own start-aligned column).
		-->
		<Container breakout padding="none" style="--hz-breakout-shift: calc(50% - 50cqw);">
			<figure>
				<Image
					src={ARTICLE_MEDIA.dogleg}
					alt="A wooded dogleg fairway bending right around a stand of trees, with a small clearing visible near the green"
					aspectRatio="21/9"
					fit="cover"
					rounded="md"
				/>
				<figcaption class="muted">
					A wooded dogleg at Maple Hill: the kind of hole where the tee shot is the whole decision.
				</figcaption>
			</figure>
		</Container>

		<div class="prose">
			<h3>The green complex is the real test</h3>
			<p>
				Tee shots get the highlight reels, but designers will tell you the green complex is where a
				hole earns its reputation. A pin tucked behind a mando tree, a green that slopes away from
				every reasonable angle of approach, a basket set just far enough into the woods that a
				hyzer-heavy upshot clips a branch it should not: these are the details that separate a hole
				players remember from one they forget by the parking lot.
			</p>
			<p>
				Good green complexes also protect against power creep. As plastics get more overstable and
				players get stronger, a green that was a fair upshot five years ago can become trivial.
				Designers who build in multiple approach angles, not just multiple tee lines, give a hole
				room to stay interesting as the meta shifts around it.
			</p>

			<h3>Building for a hundred years of play</h3>
			<p>
				The courses that last are not built for this season's field. They are built so a beginner
				and a touring pro can play the same eighteen holes and both walk away with a story. That
				means resisting the urge to toughen a layout just to keep pace with how far discs fly now. A
				well-routed course ages the way a well-routed golf course does: the land does the work, and
				the design just makes sure nobody misses it.
			</p>
		</div>
	</Stack>
</Container>

<style>
	/* The prose column reads like a printed feature: headings and body copy in
	 * the theme's serif stack (--hz-font-family-serif), byline and captions in
	 * the sans default so the metadata does not compete with the reading
	 * experience. These are literal divs (not a class passed into a $lib
	 * component), so the selectors need no :global escape. */
	.prose {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Direct-child combinator (not a descendant selector) so these rules stop
	 * at .prose's own headings and paragraphs. The Blockquote pull-quote nests
	 * a <p> inside the same .prose div, because Blockquote's <blockquote>
	 * wraps whatever the `children` snippet renders. A descendant `.prose p`
	 * was reaching into that quote and shrinking the theme's xl quote size
	 * down to base. */
	.prose > h3 {
		margin: 0;
		font-family: var(--hz-font-family-serif, serif);
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.prose > p {
		margin: 0;
		font-family: var(--hz-font-family-serif, serif);
		font-size: var(--hz-font-size-base, 1rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.byline {
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	figure {
		margin: 0;
	}

	figcaption {
		margin-top: 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		text-align: center;
	}

	.muted {
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
