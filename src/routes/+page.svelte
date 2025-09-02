<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { pb } from '$lib/pocketbase.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount, onDestroy } from 'svelte';

	const today = new Date();
	let voted = $state(false);
	let loading = $state(false);
	let status = $state<boolean | null>(null);
	let voteCount = $state({ open: 0, closed: 0 });
	let autoRefresh = $state(false);
	let refreshInterval = $state<number | null>(null);
	let refreshLoading = $state(false);

	async function submitVote(isOpen: boolean) {
		loading = true;
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
			toast.success(`Thank you for voting and helping the community!`);

			voted = true;
		} else {
			toast.error('You have already voted today.');
		}
		loading = false;

		const result = await getParkStatus();
		if (result) {
			status = result.status;
			voteCount = result.votes;
		}
	}

	const getParkStatus = async () => {
		const today = new Date();

		try {
			const records = await pb.collection('park_status').getFullList({
				filter: `created ~ "${today.toISOString().split('T')[0]}"`,
				sort: '-created'
			});

			const openVotes = records.filter((record) => record.is_open).length;
			const closedVotes = records.length - openVotes;

			console.log('Fetched park status:', { openVotes, closedVotes });

			const isOpen = openVotes > closedVotes;

			return {
				status: isOpen,
				votes: {
					open: openVotes,
					closed: closedVotes
				}
			};
		} catch (error) {
			console.error('Error fetching park status:', error);
			return null;
		}
	};

	async function refreshStatus() {
		refreshLoading = true;
		const result = await getParkStatus();
		if (result) {
			status = result.status;
			voteCount = result.votes;
		}
		refreshLoading = false;
	}

	function toggleAutoRefresh() {
		if (autoRefresh) {
			// Stop auto-refresh
			if (refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
			}
			autoRefresh = false;
			toast.info('Auto-refresh stopped');
		} else {
			// Start auto-refresh
			autoRefresh = true;
			refreshInterval = setInterval(refreshStatus, 10000); // 10 seconds
			toast.success('Auto-refresh started (10s interval)');
		}
	}

	onMount(async () => {
		const result = await getParkStatus();
		if (result) {
			status = result.status;
			voteCount = result.votes;
		}
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});
</script>

<div class="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<!-- Header Section -->
		<div class="mb-8 text-center">
			<h1 class="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
				Nova SBE Free Park Status
			</h1>
			<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
				A community-driven platform for Nova SBE students to share real-time parking availability
				information.
			</p>
		</div>

		<!-- Main Content -->
		<div class="grid gap-6 lg:grid-cols-2 lg:gap-8">
			<!-- Status Card -->
			<Card class="w-full">
				<CardHeader class="text-center">
					<CardTitle class="flex items-center justify-center gap-2 text-2xl">
						<span>Today's Status</span>
					</CardTitle>
					<CardDescription class="text-base">
						{new Date().toLocaleDateString('en-US', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6 text-center">
					<div class="flex justify-center">
						{#if status === null}
							<Badge variant="secondary" class="px-4 py-2 text-lg">Loading...</Badge>
						{:else if status}
							<Badge
								variant="default"
								class="bg-green-100 px-4 py-2 text-lg text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
							>
								🟢 Open
							</Badge>
						{:else}
							<Badge variant="destructive" class="px-4 py-2 text-lg">🔴 Closed</Badge>
						{/if}
					</div>

					{#if voteCount.open > 0 || voteCount.closed > 0}
						<div class="space-y-2">
							<p class="text-sm font-medium text-muted-foreground">Today's Votes</p>
							<div class="flex justify-center gap-4">
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded-full bg-green-500"></div>
									<span class="text-sm">Open: {voteCount.open}</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded-full bg-red-500"></div>
									<span class="text-sm">Closed: {voteCount.closed}</span>
								</div>
							</div>
						</div>
					{:else}
						<p class="text-sm text-muted-foreground font-semibold">No votes yet. Be the first to vote!</p>
					{/if}

					<Separator />

					{#if voted}
						<div class="space-y-4">
							<div class="rounded-lg bg-muted p-4 text-center">
								<p class="text-lg font-medium">Thank you for voting!</p>
								<p class="text-sm text-muted-foreground">Your contribution helps the community.</p>
							</div>
						</div>
					{:else}
						<div class="space-y-4">
							<p class="text-base font-medium">Help update the status:</p>
							<div class="flex flex-col justify-center gap-3 sm:flex-row">
								<Button
									size="lg"
									onclick={() => submitVote(true)}
									class="flex items-center gap-2 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
									disabled={loading}
								>
									🟢 Mark as Open
								</Button>
								<Button
									size="lg"
									variant="destructive"
									onclick={() => submitVote(false)}
									class="flex items-center gap-2"
									disabled={loading}
								>
									🔴 Mark as Closed
								</Button>
							</div>
							<!-- <p class="text-xs text-muted-foreground">You can vote once every 24 hours</p> -->
						</div>
					{/if}

					<Separator />

					<div class="space-y-4">
						<p class="text-base font-medium">Actions:</p>

						<div class="flex justify-center gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								onclick={refreshStatus}
								disabled={refreshLoading || loading}
								class="flex items-center gap-2"
							>
								{#if refreshLoading}
									<div
										class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
									></div>
								{:else}
									🔄
								{/if}
								Refresh
							</Button>
							<Button
								variant={autoRefresh ? 'default' : 'outline'}
								size="sm"
								onclick={toggleAutoRefresh}
								class="flex items-center gap-2"
							>
								{#if autoRefresh}
									⏸️ Stop Auto
								{:else}
									▶️ Auto Refresh (10s)
								{/if}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Location Card -->
			<Card class="w-full">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">📍 Park Location</CardTitle>
					<CardDescription>The free parking area we're tracking</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="aspect-video w-full overflow-hidden rounded-lg border">
						<iframe
							class="h-full w-full"
							src="https://www.openstreetmap.org/export/embed.html?bbox=-9.326172173023226%2C38.680832277916885%2C-9.322631657123567%2C38.682708332524456&amp;layer=mapnik&amp;marker=38.681770311368325%2C-9.324401915073395"
							style="border: 0;"
							title="Nova SBE Free Park Location"
						></iframe>
					</div>
					<div class="text-center text-sm text-muted-foreground">
						<!-- Interactive map showing the exact location of the free parking area -->
						Typical Hours: 8:00 - 19:30
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Info Section -->
		<Card class="mt-8">
			<CardHeader>
				<CardTitle>How it works</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 sm:grid-cols-3">
					<div class="space-y-2 text-center">
						<div class="text-2xl">👁️</div>
						<h3 class="font-medium">Check Status</h3>
						<p class="text-sm text-muted-foreground">See real-time parking availability</p>
					</div>
					<div class="space-y-2 text-center">
						<div class="text-2xl">🗳️</div>
						<h3 class="font-medium">Vote</h3>
						<p class="text-sm text-muted-foreground">Update the status when you're there</p>
					</div>
					<div class="space-y-2 text-center">
						<div class="text-2xl">🤝</div>
						<h3 class="font-medium">Help Community</h3>
						<p class="text-sm text-muted-foreground">Share information with fellow students</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
