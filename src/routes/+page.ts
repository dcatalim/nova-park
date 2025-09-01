import { pb } from '$lib/pocketbase.svelte';
import type { PageLoad } from './$types';

export const load = (async () => {
	const today = new Date();

	const getParkStatus = async () => {
		try {
			const records = await pb.collection('park_status').getFullList({
				filter: `created ~ "${today.toISOString().split('T')[0]}"`,
				sort: '-created'
			});

			const openVotes = records.filter((record) => record.is_open).length;
			const closedVotes = records.length - openVotes;

			console.log('Fetched park status:', { openVotes, closedVotes });

			if (openVotes * 3 > closedVotes) {
				return true;
			}

			return false;
		} catch (error) {
			console.error('Error fetching park status:', error);
			return null;
		}
	};

	return {
		parkStatus: await getParkStatus()
	};
}) satisfies PageLoad;
