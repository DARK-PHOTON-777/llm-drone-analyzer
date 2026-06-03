import { z } from "zod";

export const WarningSchema = z.object({
	message: z.string(),
	details: z.string(),
});

export const ViolationSchema = z.object({
	message: z.string(),
	details: z.string(),
});

export const AssessmentSchema = z.object({
	warnings: z.array(WarningSchema),
	violations: z.array(ViolationSchema),
});

export type Warning = z.infer<typeof WarningSchema>;
export type Violation = z.infer<typeof ViolationSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
