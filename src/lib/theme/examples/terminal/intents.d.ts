/**
 * Terminal — intent registry augmentation.
 *
 * This is the whole "grow the system" story, and it is four lines.
 *
 * The library's intents are a token vocabulary, not a fixed enum: a component
 * only stamps `data-intent="<name>"` and the theme defines
 * `--hz-intent-<name>`. So the TYPE is open too — `Intent` is
 * `keyof IntentRegistry`, and augmenting that interface adds your intents to
 * every component's `intent` prop with full type-checking and autocomplete.
 *
 * `phosphor` and `amber` are defined in terminal.config.ts (which is what
 * emits --hz-intent-phosphor / --hz-intent-amber and gets them graded by the
 * contrast report) and styled in ./components/button.css.
 *
 * NOTE ON THE MODULE SPECIFIER — augment the module that DECLARES
 * IntentRegistry, not one that re-exports it: TypeScript merges an interface
 * only into its declaring module. In a consumer project that is
 * '@hyzer-labs/ui/types'; in this repo it is the '$lib/types' alias that
 * resolves to the same file.
 */
declare module '$lib/types' {
	interface IntentRegistry {
		/** Classic green CRT phosphor — Terminal's house accent. */
		phosphor: true;
		/** The amber tube: the other monitor everyone remembers. */
		amber: true;
	}
}

export {};
