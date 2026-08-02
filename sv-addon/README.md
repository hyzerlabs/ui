# [sv](https://svelte.dev/docs/cli/overview) community add-on: [@hyzer-labs/sv](https://github.com/hyzerlabs/ui/tree/main/sv-addon)

Adds [@hyzer-labs/ui](https://design.hyzer.sh) — headless, accessible Svelte 5
components — to a SvelteKit project.

> [!IMPORTANT]
> Svelte maintainers have not reviewed community add-ons for malicious code! Use at your discretion.

## Usage

```shell
npx sv add @hyzer-labs
```

## What you get

- `@hyzer-labs/ui` added to your dependencies
- The token and theme stylesheets imported in your app stylesheet, wired into
  the root layout
- Optionally, a starter `hyzer.config.ts` — every config option in one file,
  commented out — for theming through the `hyzer` CLI

## Options

### `config`

Scaffold `hyzer.config.ts`. Default: `yes`.

### `utilities`

Also import the optional utilities sheet. Default: `no`.

```shell
npx sv add @hyzer-labs="config:yes+utilities:no"
```

## Docs

- [Getting Started](https://design.hyzer.sh/docs)
- [Config & CLI](https://design.hyzer.sh/docs/foundation/config)
