# [sv](https://svelte.dev/docs/cli/overview) community add-on: [@hyzer-labs/sv](https://github.com/hyzerlabs/ui/tree/main/sv-addon)

Adds [@hyzer-labs/ui](https://design.hyzer.sh) to a SvelteKit project: headless,
accessible Svelte 5 components.

> [!IMPORTANT]
> Svelte maintainers have not reviewed community add-ons for malicious code! Use at your discretion.

## Usage

```shell
npx sv add @hyzer-labs
```

## What you get

- `@hyzer-labs/ui` added to your dependencies
- The token and theme stylesheets imported in your app stylesheet, and that
  stylesheet wired into the root layout
- Optionally, a starter `hyzer.config.ts`. It lists every config option,
  commented out, ready for theming with the `hyzer` CLI.

## Options

### `config`

Scaffold `hyzer.config.ts`. Default: `yes`.

### `utilities`

Also import the optional utilities sheet. Default: `no`.

### `reset`

Import the library's optional CSS reset. Default: `yes`. Answer no if you keep
another reset, such as Tailwind Preflight. The two do the same job.

```shell
npx sv add @hyzer-labs="config:yes+utilities:no+reset:no"
```

## Tailwind

Run this add-on with the `tailwindcss` add-on, or after it. When Tailwind is
already in your stylesheet, this add-on keeps its own imports above
`@import 'tailwindcss'` and pins the full cascade order with a single `@layer`
declaration, as described in
[Using with Tailwind](https://design.hyzer.sh/docs/theming/tailwind). Add
Tailwind afterwards and you will not get that ordering.

## Docs

- [Getting Started](https://design.hyzer.sh/docs)
- [Config & CLI](https://design.hyzer.sh/docs/foundation/config)
