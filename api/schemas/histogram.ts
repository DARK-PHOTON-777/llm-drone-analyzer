import { z } from "zod";
import type * as rust from "../../web/src/wasm/rust";

export const binSchema: z.ZodType<rust.Bin> = z.object({
	min: z.number(),
	max: z.number(),
	count: z.number(),
});

export type Bin = z.infer<typeof binSchema>;

export const histogramSchema: z.ZodType<rust.Histogram> = z.object({
	bins: z.array(binSchema),
});

export type Histogram = z.infer<typeof histogramSchema>;
