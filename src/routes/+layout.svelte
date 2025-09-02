<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<script
		defer
		src="https://analytics.dcatalim.com/script.js"
		data-website-id="6d764493-8168-4d30-bce3-a170916f131f"
	></script>
</svelte:head>

<Toaster />

<ModeWatcher />

{@render children?.()}
