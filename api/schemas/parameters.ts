import { z } from "zod";
import { VarianceSchema } from "./variance";

export const CellsSchema = z.enum(["3S", "4S", "6S", "8S", "12S"], {
	message: "Required",
});

export const PWMSchema = z.enum(["24", "48", "96"], {
	message: "Required",
});

export const ElectricalSchema = z
	.object({
		battery: z.object({
			cells: CellsSchema,
			capacity: z.number().int().positive(), // mA*h
			c_rating: z.number().positive(), // unitless
			internal_resistance: VarianceSchema, // mΩ
		}),
		esc: z.object({
			current_limit: z.number().positive(), // amps
			pwm_frequency: PWMSchema,
		}),
	})
	.transform((val) => ({
		battery: {
			voltage: parseInt(val.battery.cells.replace("S", ""), 10) * 4.2, // "Cells" -> V
			capacity: (val.battery.capacity / 1000) * 3600, // mA*h -> A*s
			c_rating: val.battery.c_rating,
			internal_resistance: {
				nominal: val.battery.internal_resistance.nominal / 1000, // mΩ -> Ω
				variance: val.battery.internal_resistance.variance,
			},
		},
		esc: {
			current_limit: val.esc.current_limit,
			pwm_frequency: parseInt(val.esc.pwm_frequency, 10) * 1000, //"kHz" -> Hz
		},
	}));

export const BladesSchema = z.enum(["2", "3", "4"], {
	message: "Required",
});

export const MaterialSchema = z.enum(
	["Polycarbonate", "Carbon Fiber", "Glass Fiber Nylon"],
	{
		message: "Required",
	},
);

export const PropulsionSchema = z
	.object({
		motor: z.object({
			size: z.string().min(4).max(4),
			kv: VarianceSchema, // RPM / V
			idle_current: z.number().positive(), // A
			max_current: z.number().positive(), // A
		}),
		prop: z.object({
			blades: BladesSchema,
			diameter: VarianceSchema, // in
			pitch: VarianceSchema, // in
			material: MaterialSchema,
		}),
	})
	.transform((val) => ({
		motor: {
			size: {
				diameter: parseInt(val.motor.size.slice(0, 2), 10) / 1000, // mm -> m
				height: parseInt(val.motor.size.slice(2), 10) / 1000, // mm -> m
			},
			kv: {
				nominal: val.motor.kv.nominal * ((2 * Math.PI) / 60),
				variance: val.motor.kv.variance,
			},
			idle_current: val.motor.idle_current,
			max_current: val.motor.max_current,
		},
		prop: {
			blades: parseInt(val.prop.blades, 10),
			diameter: {
				nominal: val.prop.diameter.nominal * 0.0254, // in -> m,
				variance: val.prop.diameter.variance,
			},
			pitch: {
				nominal: val.prop.pitch.nominal * 0.0254, // in -> m,
				variance: val.prop.pitch.variance,
			},
			material: val.prop.material,
		},
	}));

export const NumMotorsSchema = z.enum(["4", "6", "8"], {
	message: "Required",
});

export const FrameSizeSchema = z.enum(["3", "5", "7", "10"], {
	message: "Required",
}); // in

export const DroneTypeSchema = z.enum(["Photography", "Racing", "Heavy Lift"], {
	message: "Required",
});

export const StructuralSchema = z
	.object({
		mass: VarianceSchema, // g AUW
		num_motors: NumMotorsSchema,
		frame_size: FrameSizeSchema, // mm, maximum blade diameter
		type: DroneTypeSchema,
	})
	.transform((val) => ({
		mass: {
			nominal: val.mass.nominal / 1000,
			variance: val.mass.variance,
		}, // kg
		num_motors: parseInt(val.num_motors, 10),
		frame_size: parseInt(val.frame_size, 10) * 0.0254 * 1.25, // "in" -> m
		type: val.type,
	}));

export const ParameterSchema = z.object({
	electrical: ElectricalSchema,
	propulsion: PropulsionSchema,
	structural: StructuralSchema,
});

export type Form = z.input<typeof ParameterSchema>;
export type Parameters = z.output<typeof ParameterSchema>;

export const DEFAULT_FORM_VALUES: Form = {
	electrical: {
		battery: {
			cells: "6S",
			capacity: 1400,
			c_rating: 150,
			internal_resistance: { nominal: 5, variance: 5 },
		},
		esc: {
			current_limit: 60,
			pwm_frequency: "48",
		},
	},
	propulsion: {
		motor: {
			size: "2207",
			kv: { nominal: 1950, variance: 2.5 },
			idle_current: 1.2,
			max_current: 40,
		},
		prop: {
			diameter: { nominal: 5, variance: 0.1 },
			pitch: { nominal: 4, variance: 0.1 },
			blades: "3",
			material: "Polycarbonate",
		},
	},
	structural: {
		mass: { nominal: 600, variance: 2.5 },
		num_motors: "4",
		frame_size: "5",
		type: "Racing",
	},
};
