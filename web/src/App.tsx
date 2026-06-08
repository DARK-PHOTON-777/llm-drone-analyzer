import { Anchor, AppShell, Divider, Flex, Text, Title } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FaGithub } from "react-icons/fa";
import type { Assessment } from "../../api/schemas/assessment";
import type { Form as FormData } from "../../api/schemas/parameters";
import { ParameterSchema } from "../../api/schemas/parameters";
import type { PreQuery } from "../../api/schemas/query";
import type { Simulation } from "../../api/schemas/simulation";
import { Form } from "./components/Form";
import { LLM } from "./components/LLM";
import { Results } from "./components/Results";
import { runAssessment } from "./logic/assessment";
import init, { run } from "./wasm";

const useWASM = () => {
	const { data: runSimulation, isLoading } = useQuery({
		queryKey: ["wasm"],
		queryFn: async () => {
			await init();
			return run;
		},
		staleTime: Infinity,
		gcTime: Infinity,
	});
	return { runSimulation, isLoading };
};

export interface ResultsData {
	simulation: Simulation | null;
	assessment: Assessment | null;
}

export const App = () => {
	const formRef = useRef<HTMLFormElement>(null);
	const [results, setResults] = useState<ResultsData>({
		simulation: null,
		assessment: null,
	});
	const queryResolver = useRef<
		((value: Omit<PreQuery, "goal">) => void) | null
	>(null);

	const [response, setAnalysisResponse] = useState<string>("");

	const { runSimulation, isLoading } = useWASM();

	const simulate = async (form: FormData) => {
		if (!runSimulation) throw new Error("WASM not loaded");
		const parsed = ParameterSchema.safeParse(form);
		if (parsed.error) throw new Error("Parameter Schema Error");

		const parameters = parsed.data;
		const simulation = await runSimulation(parameters, 1500);
		const assessment = runAssessment(parameters);

		return { simulation, assessment };
	};

	const simulationMutation = useMutation({
		mutationFn: async (formData: FormData) => {
			const results = await simulate(formData);
			setResults(results);

			if (queryResolver.current) {
				queryResolver.current({
					assessment: results.assessment,
					distribution: results.simulation.distributions,
					parameters: formData,
				});
				queryResolver.current = null;
			}

			return { results: results, parameters: formData };
		},
		onError: () => {
			queryResolver.current = null;
		},
	});

	const analyzeMutation = useMutation({
		mutationFn: async (query: PreQuery) => {
			setAnalysisResponse("");

			const res = await fetch("/api/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(query),
			});

			if (!res.ok)
				throw new Error(`LLM Query execution failure: ${res.status}`);
			if (!res.body)
				throw new Error("No readable response body provided.");

			const reader = res.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });

				setAnalysisResponse((prev) => prev + chunk);
			}
		},
	});

	const handleAnalyze = async (goal: string) => {
		const wait = new Promise<Omit<PreQuery, "goal">>((resolve, reject) => {
			queryResolver.current = resolve;

			if (formRef.current) {
				formRef.current.requestSubmit();
			} else {
				reject(new Error("Form layout component node not found."));
			}
		});

		let data: Omit<PreQuery, "goal">;

		try {
			data = await wait;
		} catch (error) {
			return console.error(error);
		}

		analyzeMutation.mutate({
			...data,
			goal,
		});
	};

	return (
		<AppShell fw={"bold"}>
			<AppShell.Main p="sm">
				<Flex
					direction={{ base: "column", sm: "row" }}
					justify="space-between"
					align="center"
					mb="md"
					gap="md"
				>
					<Title order={1} ta={{ base: "center", sm: "left" }}>
						LLM Drone Analyzer
					</Title>
					<Flex align="center" gap="md">
						<Anchor
							href="https://github.com/DARK-PHOTON-777/llm-drone-analyzer"
							target="_blank"
							rel="noopener noreferrer"
							c="inherit"
						>
							<FaGithub size={32} />
						</Anchor>
						<Anchor
							href="https://reno-warner.github.io/portfolio/"
							target="_blank"
							rel="noopener noreferrer"
							c="inherit"
						>
							Engineered by RENO
						</Anchor>
					</Flex>
				</Flex>
				<Divider />
				<Text m="sm">
					This web application analyzes custom drone configurations
					against a user's performance goals by running Monte Carlo
					simulations. By factoring in physical component variances,
					it generates performance distributions displayed as
					intuitive histograms. Users receive clear, physics-backed
					hardware recommendations to optimize their build for
					specific flight objectives.
				</Text>
				<Divider mb="md" />
				<Flex gap="md" direction={{ base: "column", lg: "row" }}>
					<Form
						flex={2}
						ref={formRef}
						onFormSubmit={(data) => simulationMutation.mutate(data)}
						isLoading={isLoading}
						isPending={simulationMutation.isPending}
					/>
					<Results flex={3} data={results} />
				</Flex>

				<LLM
					isPending={
						analyzeMutation.isPending ||
						simulationMutation.isPending
					}
					response={response}
					onAnalyze={handleAnalyze}
				/>
			</AppShell.Main>
		</AppShell>
	);
};

export default App;
