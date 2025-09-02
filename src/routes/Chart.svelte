<script lang="ts">
	import { LineChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import { scaleUtc } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';

	let { votes } = $props();

	console.log(votes);

	// Process votes data to show votes throughout the day by time
	const processVotesData = (voteRecords: any[]) => {
		if (!voteRecords || voteRecords.length === 0) {
			return [];
		}

		// Filter votes for today only
		const today = new Date().toISOString().split('T')[0];
		const todayVotes = voteRecords.filter((vote) => {
			const voteDate = new Date(vote.created).toISOString().split('T')[0];
			return voteDate === today;
		});

		// Create hourly buckets (0-23 hours)
		const hourlyData: Array<{
			time: Date;
			hour: number;
			open: number;
			closed: number;
			total: number;
		}> = [];

		for (let hour = 0; hour < 24; hour++) {
			const hourStart = new Date();
			hourStart.setHours(hour, 0, 0, 0);

			hourlyData.push({
				time: hourStart,
				hour: hour,
				open: 0,
				closed: 0,
				total: 0
			});
		}

		// Count votes by hour
		todayVotes.forEach((vote) => {
			const voteTime = new Date(vote.created);
			const hour = voteTime.getHours();

			if (vote.is_open) {
				hourlyData[hour].open++;
			} else {
				hourlyData[hour].closed++;
			}
			hourlyData[hour].total++;
		});

		return hourlyData;
	};

	const chartData = $derived(processVotesData(votes));

	$effect(() => {
		console.log('Processed chart data:', chartData);
	});

	const chartConfig = {
		open: { label: 'Open Votes', color: 'hsl(142, 76%, 36%)' },
		closed: { label: 'Closed Votes', color: 'hsl(0, 84%, 60%)' }
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig}>
	<LineChart
		data={chartData}
		x="time"
		xScale={scaleUtc()}
		axis="x"
		series={[
			{
				key: 'closed',
				label: 'Closed Votes',
				color: chartConfig.closed.color
			},
			{
				key: 'open',
				label: 'Open Votes',
				color: chartConfig.open.color
			}
		]}
		props={{
			spline: { curve: curveNatural, motion: 'tween', strokeWidth: 2 },
			xAxis: {
				format: (v: Date) => v.getHours().toString().padStart(2, '0') + ':00'
			},
			highlight: { points: { r: 4 } }
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip hideLabel />
		{/snippet}
	</LineChart>
</Chart.Container>
