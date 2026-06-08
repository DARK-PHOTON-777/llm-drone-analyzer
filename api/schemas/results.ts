import { z } from "zod";
import type * as rust from "../../web/src/wasm/rust";

export const createStepSchema = <T extends z.ZodTypeAny>(
	inner: T,
): z.ZodType<rust.Step<z.infer<T>>> => {
	return z.object({
		rise_time: inner,
	}) as unknown as z.ZodType<rust.Step<z.infer<T>>>;
};

export const createEfficientSchema = <T extends z.ZodTypeAny>(
	inner: T,
): z.ZodType<rust.Efficient<z.infer<T>>> => {
	return z.object({
		flight_time: inner,
		hover_throttle: inner,
		specific_thrust: inner,
	}) as unknown as z.ZodType<rust.Efficient<z.infer<T>>>;
};

export const createPerformanceSchema = <T extends z.ZodTypeAny>(
	inner: T,
): z.ZodType<rust.Performance<z.infer<T>>> => {
	return z.object({
		max_accel: inner,
		max_current: inner,
		twr: inner,
	}) as unknown as z.ZodType<rust.Performance<z.infer<T>>>;
};

export const createResultsSchema = <T extends z.ZodTypeAny>(
	inner: T,
): z.ZodType<rust.Results<z.infer<T>>> => {
	return z.object({
		step: createStepSchema(inner),
		efficiency: createEfficientSchema(inner),
		performance: createPerformanceSchema(inner),
	}) as unknown as z.ZodType<rust.Results<z.infer<T>>>;
};
