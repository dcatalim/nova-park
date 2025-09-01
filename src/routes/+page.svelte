<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { pb } from '$lib/pocketbase.svelte';
	import { toast } from 'svelte-sonner';

	const today = new Date();
	let voted = $state(false);

	let { data } = $props();

	async function submitVote(isOpen: boolean) {
		const data = {
			is_open: isOpen,
			today: today.toISOString().split('T')[0]
		};

		if (!voted) {
			try {
				const record = await pb.collection('park_status').create(data);
			} catch (error) {
				toast.error('Failed to submit your vote. Please try again later.');
				console.error('Error submitting vote:', error);
				return;
			}
			toast.success(
				`Thank you for voting! The park is now marked as ${isOpen ? 'Open' : 'Closed'}.`
			);

			voted = true;
		} else {
			toast.error('You have already voted today.');
		}
	}
</script>

<div class="flex h-screen w-full flex-col items-center justify-center gap-8">
	<h1 class="text-4xl font-semibold">Welcome to Nova SBE Free Park Status</h1>

	<div class="text-center">
		<p class="text-muted-foreground">
			This website is designed for students to share whether the free park is open or not.
		</p>
		<p>To update the status of the park, just vote below:</p>
		<!-- (You can only vote once every 24 hours) -->
	</div>

	<div class="text-center my-5">
		<p class="text-4xl font-semibold {data.parkStatus ? 'text-green-500' : 'text-red-500'}">
			{today.toLocaleDateString()}
		</p>

		<p class="text-lg">
			Current Status: <span
				class={data.parkStatus === null ? '' : data.parkStatus ? 'text-green-500' : 'text-red-500'}
				>{data.parkStatus === null ? 'Loading...' : data.parkStatus ? 'Open' : 'Closed'}</span
			>
		</p>
	</div>

	{#if voted}
		<p class="text-s">Thank you for voting!</p>
	{:else}
		<div class="flex gap-4 my-5">
			<Button size="lg" class='bg-green-600 hover:bg-green-700' onclick={() => submitVote(true)}>Open</Button>
			<Button size="lg" variant="destructive" onclick={() => submitVote(false)}>Closed</Button>
		</div>
	{/if}
	<div class="flex flex-col items-center justify-center gap-2 text-center">
		<p class="text-muted-foreground">Just to clarify, we are talking about this park:</p>
		<iframe
			width="425"
			height="350"
			class="rounded-lg"
			src="https://www.openstreetmap.org/export/embed.html?bbox=-9.326172173023226%2C38.680832277916885%2C-9.322631657123567%2C38.682708332524456&amp;layer=mapnik&amp;marker=38.681770311368325%2C-9.324401915073395"
			style="border: 1px solid black"
		></iframe>
	</div>
</div>
