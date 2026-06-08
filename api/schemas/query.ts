import { z } from "zod";
import { AssessmentSchema } from "./assessment";
import { distributionSchema } from "./distribution";
import { ParameterSchema } from "./parameters";
import { createResultsSchema } from "./results";

export const QuerySchema = z.object({
	goal: z.string(),
	parameters: ParameterSchema,
	assessment: AssessmentSchema,
	distribution: createResultsSchema(distributionSchema),
});

export type Query = z.infer<typeof QuerySchema>;

export type PreQuery = z.input<typeof QuerySchema>;
