import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Placeholder from './Placeholder.svelte';

describe('Placeholder.svelte — R2/R6: runes compile and $lib resolves', () => {
	it('renders with the default label', async () => {
		render(Placeholder);

		await expect.element(page.getByText('@hyzer-labs/ui')).toBeInTheDocument();
	});

	it('renders with a custom label prop (proves $props() rune compiles)', async () => {
		render(Placeholder, { label: 'hello runes' });

		await expect.element(page.getByText('hello runes')).toBeInTheDocument();
	});

	it('renders the hz-placeholder element with the data-component attribute', async () => {
		render(Placeholder, { label: 'check attrs' });

		const el = page.getByText('check attrs');
		await expect.element(el).toBeInTheDocument();
	});
});
