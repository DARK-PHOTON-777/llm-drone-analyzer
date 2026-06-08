import { Button, Fieldset, Flex, Stack, Textarea } from "@mantine/core";
import { useState } from "react";
import Markdown from "react-markdown";

interface LLMProps {
	onAnalyze: (goal: string) => void;
	isPending: boolean;
	response: string; // This will accumulate the stream tokens
}

export const LLM = ({ onAnalyze, isPending, response }: LLMProps) => {
	const [goal, setGoal] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!goal.trim() || isPending) return;
		onAnalyze(goal);
	};

	return (
		<Stack mt="md">
			<Fieldset legend="LLM Analyzer">
				<form onSubmit={handleSubmit}>
					<Flex
						direction={{ base: "column" }}
						justify="space-between"
						gap="md"
					>
						<Textarea
							flex={1}
							minRows={4}
							label="Analysis Goal"
							placeholder="e.g., Build a long haul endurance cruiser with maximized flight time, or a fast snappier FPV racer..."
							value={goal}
							onChange={(e) => setGoal(e.currentTarget.value)}
							disabled={isPending}
						/>
						<Button
							type="submit"
							c={goal.trim() ? "black" : undefined}
							loading={isPending}
							disabled={!goal.trim()}
						>
							Analyze Design
						</Button>
					</Flex>
				</form>
			</Fieldset>

			{response && (
				<Fieldset legend="Analysis Recommendations">
					<div className="prose prose-slate max-w-none md:prose-lg">
						<Markdown>{response}</Markdown>
					</div>
				</Fieldset>
			)}
		</Stack>
	);
};
