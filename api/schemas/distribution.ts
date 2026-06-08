import { z } from "zod";
import type * as rust from "../../web/src/wasm/rust";

export const distributionSchema: z.ZodType<rust.Distribution> = z.object({
	mean: z.number(),
	std: z.number(),
	p5: z.number(),
	p95: z.number(),
});

export type Distribution = z.infer<typeof distributionSchema>;
