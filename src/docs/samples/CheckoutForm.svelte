<script lang="ts">
	/**
	 * A checkout page composed entirely from the library.
	 *
	 * It imports only public exports and exercises the whole Form workflow —
	 * submit-time validation builds a plain field-name → message record,
	 * `toFormErrors` reshapes it, and Form renders the linked error summary
	 * and moves focus to it. Inline field errors come from the same array, so
	 * the summary and the fields can never disagree. The order summary
	 * derives its totals from the same bound state the form controls edit.
	 */
	import {
		Form,
		TextInput,
		Textarea,
		Select,
		RadioGroup,
		Checkbox,
		Toggle,
		Button,
		Alert,
		Card,
		Divider,
		Stack,
		Cluster,
		Split,
		Grid,
		toFormErrors
	} from '$lib';
	import type { FormError, FormOption } from '$lib/types';

	const cart = [
		{ name: 'Voyager — Champion, 173 g', price: 19.99 },
		{ name: 'Drift — Base, 177 g', price: 15.99 },
		{ name: 'Keystone — Base, 174 g', price: 12.99 }
	];

	const regions: FormOption[] = [
		{ value: 'MA', label: 'Massachusetts' },
		{ value: 'MN', label: 'Minnesota' },
		{ value: 'OR', label: 'Oregon' },
		{ value: 'MI', label: 'Michigan' },
		{ value: 'KY', label: 'Kentucky' }
	];

	const shippingOptions: FormOption[] = [
		{ value: 'standard', label: 'Standard (3–5 days) — free' },
		{ value: 'express', label: 'Express (1–2 days) — $8.99' }
	];

	let fullName = $state('');
	let email = $state('');
	let address = $state('');
	let city = $state('');
	let region = $state('');
	let zip = $state('');
	let shipping = $state('standard');
	let notes = $state('');
	let giftWrap = $state(false);
	let updates = $state(true);
	let terms = $state(false);

	let errors = $state<FormError[]>([]);
	let placed = $state(false);

	const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
	const shippingCost = $derived(shipping === 'express' ? 8.99 : 0);
	const giftWrapCost = $derived(giftWrap ? 2 : 0);
	const total = $derived(subtotal + shippingCost + giftWrapCost);

	// One record, keyed by field `name` — toFormErrors turns it into the
	// FormError[] the summary links from. The same array feeds the inline
	// `error` prop on each field.
	function validate(): FormError[] {
		const problems: Record<string, string> = {};
		if (!fullName.trim()) problems['full-name'] = 'Enter your full name.';
		if (!email.trim()) problems.email = 'Enter an email address.';
		else if (!/^\S+@\S+\.\S+$/.test(email))
			problems.email = 'Enter an email address like player@example.com.';
		if (!address.trim()) problems.address = 'Enter a street address.';
		if (!city.trim()) problems.city = 'Enter a city.';
		if (!region) problems.region = 'Select a state.';
		if (!/^\d{5}$/.test(zip.trim())) problems.zip = 'Enter a 5-digit ZIP code.';
		if (!terms) problems.terms = 'Accept the return policy to place the order.';
		return toFormErrors(problems);
	}

	function handleSubmit() {
		errors = validate();
		placed = errors.length === 0;
	}

	const fieldError = (name: string) => errors.find((e) => e.name === name)?.message;
</script>

<Stack gap="lg" padding="lg">
	<Stack gap="xs">
		<h2>Checkout</h2>
		<p class="muted">Orders ship the next business day from Leicester, MA.</p>
	</Stack>

	{#if placed}
		<Alert
			intent="success"
			title="Order placed"
			headingLevel={3}
			onDismiss={() => (placed = false)}
		>
			{cart.length} discs on the way — ${total.toFixed(2)} charged. A confirmation is headed to
			{email}.
		</Alert>
	{/if}

	<Split fraction="2/3" gap="lg" stackBelow="md">
		<Form {errors} onSubmit={handleSubmit} novalidate summaryHeadingLevel={3} ariaLabel="Checkout">
			<Stack gap="lg">
				<Stack gap="sm">
					<h3>Contact</h3>
					<TextInput
						name="full-name"
						label="Full name"
						autocomplete="name"
						required
						bind:value={fullName}
						error={fieldError('full-name')}
					/>
					<TextInput
						name="email"
						label="Email"
						type="email"
						autocomplete="email"
						description="Receipt and shipping updates go here."
						required
						bind:value={email}
						error={fieldError('email')}
					/>
				</Stack>

				<Stack gap="sm">
					<h3>Shipping address</h3>
					<TextInput
						name="address"
						label="Street address"
						autocomplete="street-address"
						required
						bind:value={address}
						error={fieldError('address')}
					/>
					<Grid columns={{ sm: 1, md: 3 }} gap="sm">
						<TextInput
							name="city"
							label="City"
							autocomplete="address-level2"
							required
							bind:value={city}
							error={fieldError('city')}
						/>
						<Select
							name="region"
							label="State"
							options={regions}
							placeholder="Select…"
							required
							bind:value={region}
							error={fieldError('region')}
						/>
						<TextInput
							name="zip"
							label="ZIP code"
							inputmode="numeric"
							autocomplete="postal-code"
							maxlength={5}
							required
							bind:value={zip}
							error={fieldError('zip')}
						/>
					</Grid>
				</Stack>

				<Stack gap="sm">
					<h3>Delivery</h3>
					<RadioGroup
						name="shipping"
						label="Shipping method"
						options={shippingOptions}
						bind:value={shipping}
					/>
					<Textarea
						name="notes"
						label="Delivery notes"
						description="Optional — gate codes, safe drop spots."
						rows={3}
						bind:value={notes}
					/>
					<Toggle name="gift-wrap" label="Gift wrap ($2.00)" bind:checked={giftWrap} />
				</Stack>

				<Stack gap="sm">
					<Checkbox
						name="updates"
						label="Email me about restocks and new releases"
						bind:checked={updates}
					/>
					<Checkbox
						name="terms"
						label="I accept the return policy"
						required
						bind:checked={terms}
						error={fieldError('terms')}
					/>
				</Stack>

				<Cluster gap="sm">
					<Button type="submit" intent="primary" size="lg">Place order</Button>
					<Button variant="ghost" size="lg">Back to cart</Button>
				</Cluster>
			</Stack>
		</Form>

		<Card class="hz-card--outlined" padding="md" rounded="md">
			<Stack gap="sm">
				<h3>Order summary</h3>
				{#each cart as item (item.name)}
					<Cluster justify="between" gap="sm">
						<span class="muted">{item.name}</span>
						<span>${item.price.toFixed(2)}</span>
					</Cluster>
				{/each}
				<Divider spacing="none" />
				<Cluster justify="between" gap="sm">
					<span class="muted">Shipping</span>
					<span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
				</Cluster>
				{#if giftWrap}
					<Cluster justify="between" gap="sm">
						<span class="muted">Gift wrap</span>
						<span>${giftWrapCost.toFixed(2)}</span>
					</Cluster>
				{/if}
				<Divider spacing="none" />
				<Cluster justify="between" gap="sm">
					<strong>Total</strong>
					<strong>${total.toFixed(2)}</strong>
				</Cluster>
				<p class="muted small">Free standard shipping on orders over $35 — applied.</p>
			</Stack>
		</Card>
	</Split>
</Stack>

<style>
	h2 {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h3 {
		margin: 0;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0;
	}

	.muted {
		color: var(--hz-color-text-muted, #6b7280);
	}

	.small {
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
