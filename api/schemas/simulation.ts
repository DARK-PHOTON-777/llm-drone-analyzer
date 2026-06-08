import { z } from "zod";
import type * as rust from "../../web/src/wasm";
import { distributionSchema } from "./distribution";
import { histogramSchema } from "./histogram";
import { createResultsSchema } from "./results";

export const simulationSchema: z.ZodType<rust.Simulation> = z.object({
	histogram: createResultsSchema(histogramSchema),
	distributions: createResultsSchema(distributionSchema),
}) as unknown as z.ZodType<rust.Simulation>;

export type Simulation = z.infer<typeof simulationSchema>;
