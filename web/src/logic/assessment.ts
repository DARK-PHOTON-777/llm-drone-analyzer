import type {
	Assessment,
	Violation,
	Warning,
} from "../../../api/schemas/assessment";
import type { Parameters } from "../../../api/schemas/parameters";

export const runAssessment = (params: Parameters): Assessment => {
	const voltage = params.electrical.battery.voltage;
	const capacityAs = params.electrical.battery.capacity;
	const cRating = params.electrical.battery.c_rating;

	const escCurrentLimit = params.electrical.esc.current_limit;

	const motorKv = params.propulsion.motor.kv.nominal; // rad / (s * V)
	const motorMaxCurrent = params.propulsion.motor.max_current;
	const motorIdleCurrent = params.propulsion.motor.idle_current;

	const propDiameter = params.propulsion.prop.diameter.nominal;
	const propPitch = params.propulsion.prop.pitch.nominal;

	const numMotors = params.structural.num_motors;
	const frameSize = params.structural.frame_size;

	const MACH_1 = 343.0;

	const warnings: Warning[] = [];
	const violations: Violation[] = [];

	//Electrical
	//ESC
	if (motorMaxCurrent > escCurrentLimit) {
		violations.push({
			message: "Motor max current exceeds ESC limit.",
			details: `The motor demands up to ${motorMaxCurrent}A, but the ESC is limited to ${escCurrentLimit}A. This will likely burn out the ESC at full throttle.`,
		});
	} else if (motorMaxCurrent > escCurrentLimit * 0.8) {
		warnings.push({
			message: "ESC current headroom is low (< 20%).",
			details: `Motor max current (${motorMaxCurrent}A) is close to the ESC limit (${escCurrentLimit}A). Thermal throttling or failure could occur under sustained full-throttle loads.`,
		});
	}

	// Battery
	const capacityAh = capacityAs / 3600;
	const maxBatteryCurrent = capacityAh * cRating;
	const totalMaxCurrentDraw = motorMaxCurrent * numMotors;

	if (totalMaxCurrentDraw > maxBatteryCurrent) {
		violations.push({
			message: "Total powertrain current draw exceeds battery C-rating.",
			details: `Total system peak draw is ${totalMaxCurrentDraw.toFixed(1)}A, but the battery safe limit is ${maxBatteryCurrent.toFixed(1)}A. This risk causing severe voltage sag, battery swelling, or fire.`,
		});
	}

	if (motorIdleCurrent >= motorMaxCurrent) {
		violations.push({
			message: "Invalid motor current configuration.",
			details: `Motor idle current (${motorIdleCurrent}A) cannot be greater than or equal to max current (${motorMaxCurrent}A).`,
		});
	}

	// Propulsion
	// Motor
	const maxMotorSpeed = motorKv * voltage; // rad/s

	if (maxMotorSpeed >= 50000 * ((2 * Math.PI) / 60)) {
		warnings.push({
			message: "Motor RPM speed exceeds 50,000 RPM",
			details: `Calculate Motor RPM no load speed is ${(maxMotorSpeed * (60 / (2 * Math.PI))).toFixed(0)} RPM. This will require specialy motors with expensive bearings.`,
		});
	}
	// Prop
	const tipSpeed = (maxMotorSpeed * propDiameter) / 2; // m/s

	if (tipSpeed >= MACH_1) {
		violations.push({
			message: "Propeller tip speed exceeds Mach 1!",
			details: `Calculated tip speed is ${tipSpeed.toFixed(1)} m/s, which exceeds the speed of sound (${MACH_1} m/s). This will cause extreme shockwaves, structural failure, and loss of thrust.`,
		});
	} else if (tipSpeed >= MACH_1 * 0.8) {
		warnings.push({
			message: "Propeller tip speed is transonic (> Mach 0.8).",
			details: `Calculated tip speed is ${tipSpeed.toFixed(1)} m/s. Operating near Mach 0.8 causes severe drag divergence, massive efficiency drops, and extreme noise levels.`,
		});
	}

	const pitchToDiameterRatio = propPitch / propDiameter;
	if (pitchToDiameterRatio > 0.9) {
		warnings.push({
			message: "High propeller pitch-to-diameter ratio (Over-square).",
			details: `Ratio is ${pitchToDiameterRatio.toFixed(2)}. Highly pitched props suffer from blade stall at low forward speeds (like hovering), reducing static efficiency and handling.`,
		});
	} else if (pitchToDiameterRatio < 0.3) {
		warnings.push({
			message: "Low propeller pitch-to-diameter ratio.",
			details: `Ratio is ${pitchToDiameterRatio.toFixed(2)}. Very low pitch props require highly elevated RPMs to generate thrust, causing high friction and profile drag losses.`,
		});
	}
	// Structural
	if (propDiameter >= frameSize) {
		violations.push({
			message: "Propellers physically intersect!",
			details: `Propeller diameter (${propDiameter.toFixed(3)}m) is greater than or equal to the max frame propeller size of (${frameSize.toFixed(3)}m).`,
		});
	}

	return {
		warnings,
		violations,
	};
};
