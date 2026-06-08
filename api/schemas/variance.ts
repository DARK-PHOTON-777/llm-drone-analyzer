import { z } from "zod";

export const VarianceSchema = z.object({
	nominal: z.number().positive(),
	variance: z.number().min(0).max(100),
});

export type Variance = z.infer<typeof VarianceSchema>;
