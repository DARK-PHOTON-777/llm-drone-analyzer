import {
	Alert,
	Box,
	Fieldset,
	SimpleGrid,
	Stack,
	type StackProps,
	Text,
	Title,
} from "@mantine/core";
import type { ChartData, ChartOptions } from "chart.js";
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	LinearScale,
	Tooltip,
} from "chart.js";
import { memo, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import type { Histogram } from "../../../api/schemas/histogram";
import type { Simulation } from "../../../api/schemas/simulation";
import type { ResultsData } from "../App";

ChartJS.register(BarElement, LinearScale, CategoryScale, Tooltip);

const OPTIONS: ChartOptions<"bar"> = {
	animation: false,
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: { display: false },
	},
	scales: {
		x: {
			ticks: { maxTicksLimit: 6, font: { size: 16 } },
			grid: { display: false },
		},
		y: {
			ticks: { font: { size: 16 } },
			grid: { color: "rgba(255,255,255,0.05)" },
		},
	},
};

const THEME = {
	step: { color: "rgba(77,171,247,0.8)", fill: "rgba(77,171,247,0.15)" },
	efficiency: {
		color: "rgba(105,219,124,0.8)",
		fill: "rgba(105,219,124,0.15)",
	},
	performance: {
		color: "rgba(255,135,135,0.8)",
		fill: "rgba(255,135,135,0.15)",
	},
};

const ChartBox = <
	S extends keyof Simulation["histograms"],
	F extends keyof Simulation["histograms"][S],
>({
	section,
	field,
	label,
	simulation,
}: {
	section: S;
	field: F;
	label: string;
	simulation: Simulation | null;
}) => {
	const histogram = simulation?.histograms[section]?.[field] as Histogram;

	const chartData = useMemo((): ChartData<"bar"> => {
		if (!histogram || histogram.bins.length === 0) {
			return { labels: [], datasets: [{ data: [] }] };
		}

		return {
			labels: histogram.bins.map(
				(b) => `${((b.min + b.max) / 2).toPrecision(3)}`,
			),
			datasets: [
				{
					data: histogram.bins.map((b) => b.count),
					backgroundColor: THEME[section].fill,
					borderColor: THEME[section].color,
					borderWidth: 1,
					barPercentage: 1.0,
					categoryPercentage: 1.0,
				},
			],
		};
	}, [histogram, section]);

	return (
		<Box h={220} w="100%" pb="lg">
			<Text size="lg" mb={4}>
				{label}
			</Text>
			<Bar
				key={`${section}-${String(field)}`}
				data={chartData}
				options={{ ...OPTIONS, maintainAspectRatio: false }}
			/>
		</Box>
	);
};

export const Results = memo(
	({
		data: { simulation, assessment },
		...props
	}: { data: ResultsData } & StackProps) => {
		return (
			<Stack {...props}>
				<Title order={3}>Simulation Results</Title>

				<Stack>
					<Fieldset legend="Step Response">
						<SimpleGrid cols={{ base: 1 }} spacing="xl">
							<ChartBox
								section="step"
								field="rise_time"
								label="Rise Time (s)"
								simulation={simulation}
							/>
						</SimpleGrid>
					</Fieldset>

					<Fieldset legend="Performance">
						<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
							<ChartBox
								section="performance"
								field="max_accel"
								label="Max Accel (m/s²)"
								simulation={simulation}
							/>
							<ChartBox
								section="performance"
								field="max_current"
								label="Max Current (A)"
								simulation={simulation}
							/>
							<ChartBox
								section="performance"
								field="twr"
								label="TWR"
								simulation={simulation}
							/>
						</SimpleGrid>
					</Fieldset>

					<Fieldset legend="Efficiency">
						<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
							<ChartBox
								section="efficiency"
								field="flight_time"
								label="Flight Time (min)"
								simulation={simulation}
							/>
							<ChartBox
								section="efficiency"
								field="hover_throttle"
								label="Hover Throttle (%)"
								simulation={simulation}
							/>
							<ChartBox
								section="efficiency"
								field="specific_thrust"
								label="Specific Thrust (g/W)"
								simulation={simulation}
							/>
						</SimpleGrid>
					</Fieldset>
				</Stack>

				<Fieldset legend="Assessment">
					{!assessment ? (
						<Text>Run simulation to see assessment.</Text>
					) : !assessment.violations.length &&
						!assessment.warnings.length ? (
						<Text size="sm" c="green" fw={600}>
							✓ No warnings or violations
						</Text>
					) : (
						<Stack gap="xs">
							{assessment.violations.map((v) => (
								<Alert
									key={`v-${v.message}`}
									color="red"
									title={`✕ ${v.message}`}
									variant="light"
								>
									<Text size="xs">{v.details}</Text>
								</Alert>
							))}
							{assessment.warnings.map((w) => (
								<Alert
									key={`w-${w.message}`}
									color="yellow"
									title={`⚠ ${w.message}`}
									variant="light"
								>
									<Text size="xs">{w.details}</Text>
								</Alert>
							))}
						</Stack>
					)}
				</Fieldset>
			</Stack>
		);
	},
);
