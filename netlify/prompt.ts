import type { Query } from "../api/schemas/query";

export const createPrompt = (
	query: Query,
): { user: string; system: string } => {
	const { goal, parameters, distribution, assessment } = query;

	const system = `You are an expert aerospace engineer, drone designer, and multicopter optimization system.
Your job is to analyze a drone's structural, propulsion, and electrical parameters alongside its simulation performance results and physics assessments. 

Evaluate how well the current configuration matches the user's explicit goal (e.g., long haul endurance, fast FPV racing, heavy lift photography). 

Provide a structured, deeply technical breakdown including:
1. An evaluation of the current build relative to the goal.
2. A list of actionable parametric changes (e.g., swapping motors, changing battery cells, resizing props) to better achieve the goal.
3. The engineering rationale behind why those changes will improve performance based on physics (e.g., Kv values vs. torque, disc loading, thrust-to-weight ratio).

If the configuration is already near optimal for the goal, explain explicitly why the current selections represent a Pareto-optimal design for their constraints.

Respond in markdown. DO NOT USE TABLES OR EQUATIONS`;

	const user = `### USER OPTIMIZATION GOAL
"${goal}"

### CURRENT DRONE CONFIGURATION (Parsed & Transformed Units)
- **Structural**: 
  - Type: ${parameters.structural.type}
  - Frame Size: ${parameters.structural.frame_size.toFixed(3)} m (max prop clearance)
  - Number of Motors: ${parameters.structural.num_motors}
  - Mass (AUW): ${parameters.structural.mass.nominal.toFixed(3)} kg (variance: ${parameters.structural.mass.variance})

- **Propulsion**:
  - Motor Size: Diameter ${parameters.structural.frame_size.toFixed(3)} m, Height: ${parameters.propulsion.motor.size.height.toFixed(3)} m
  - Motor Kv: ${(parameters.propulsion.motor.kv.nominal * (60 / (2 * Math.PI))).toFixed(2)} RPM (variance: ${parameters.propulsion.motor.kv.variance})
  - Motor Limits: Idle Current ${parameters.propulsion.motor.idle_current.toFixed(3)} A, Max Current ${parameters.propulsion.motor.max_current.toFixed(3)} A
  - Propeller: ${parameters.propulsion.prop.blades}-blade, ${(parameters.propulsion.prop.diameter.nominal / 0.0254).toFixed(2)}" in Diameter, ${(parameters.propulsion.prop.pitch.nominal / 0.0254).toFixed(2)}" in Pitch, Material: ${parameters.propulsion.prop.material}

- **Electrical**:
  - Battery Voltage: ${parameters.electrical.battery.voltage} V
  - Battery Capacity: ${(parameters.electrical.battery.capacity / 3600).toFixed(2)} Ah
  - C-Rating: ${parameters.electrical.battery.c_rating} C
  - Internal Resistance: ${parameters.electrical.battery.internal_resistance.nominal} Ω
  - ESC Limit: ${parameters.electrical.esc.current_limit} A, PWM Frequency: ${parameters.electrical.esc.pwm_frequency} Hz

### SYSTEM SIMULATION DISTRIBUTIONS (Mean, StdDev, 5th%, 95th%)
- **Step Response**:
  - Rise Time: Mean=${distribution.step.rise_time} min, P5=${distribution.step.rise_time.p5}, P95=${distribution.step.rise_time.p95}
  - Overshoot: Mean=${distribution.step.overshoot.mean} %, P5=${distribution.step.overshoot.p5}, P95=${distribution.step.overshoot.p95}
- **Efficiency & Flight**:
  - Flight Time: Mean=${distribution.efficiency.flight_time.mean} min, P5=${distribution.efficiency.flight_time.p5}, P95=${distribution.efficiency.flight_time.p95}
  - Hover Throttle: Mean=${distribution.efficiency.hover_throttle.mean} %, P5=${distribution.efficiency.hover_throttle.p5}, P95=${distribution.efficiency.hover_throttle.p95}
  - Specific Thrust: Mean=${distribution.efficiency.specific_thrust.mean} g/W, P5=${distribution.efficiency.specific_thrust.p5}, P95=${distribution.efficiency.specific_thrust.p95}
- **Performance**:
  - Max Acceleration: Mean=${distribution.performance.max_accel.mean} m/s², P5=${distribution.performance.max_accel.p5}, P95=${distribution.performance.max_accel.p95}
  - Max Current Draw: Mean=${distribution.performance.max_current.mean} A, P5=${distribution.performance.max_current.p5}, P95=${distribution.performance.max_current.p95}
  - Thrust-to-Weight Ratio: Mean=${distribution.performance.twr.mean}, P5=${distribution.performance.twr.p5}, P95=${distribution.performance.twr.p95}

### CURRENT HEALTH VIOLATIONS & WARNINGS
${assessment.violations.length === 0 ? "- No critical physics/current violations." : assessment.violations.map((v) => `- VIOLATION: ${v.message} (${v.details})`).join("\n")}
${assessment.warnings.length === 0 ? "- No operational warnings." : assessment.warnings.map((w) => `- WARNING: ${w.message} (${w.details})`).join("\n")}

Please provide your technical recommendations, suggestions for component modifications, and an engineering summary below.`;

	return {
		user,
		system,
	};
};
