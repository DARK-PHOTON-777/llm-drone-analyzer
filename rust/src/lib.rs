use serde::Serialize;
use tsify::{Ts, Tsify};
use wasm_bindgen::prelude::*;

pub mod distribution;
pub mod histogram;
pub mod integrator;
pub mod parameters;
pub mod results;
pub mod variance;

use crate::distribution::Distribution;
use crate::histogram::Histogram;
use crate::integrator::RK4;
use crate::parameters::{Material, Parameters};
use crate::results::Results;

const G: f64 = 9.81;
const RHO: f64 = 1.225;

#[derive(Debug, Serialize, Clone, Tsify)]
pub struct Simulation {
	pub histograms: Results<Histogram>,
	pub distributions: Results<Distribution>,
}

#[wasm_bindgen]
pub fn run(js_params: JsValue, iterations: usize) -> Result<Ts<Simulation>, JsError> {
	console_error_panic_hook::set_once();

	let params: Parameters = serde_wasm_bindgen::from_value(js_params)?;

	let mut samples = run_monte_carlo(&params, iterations);

	let distributions: Results<Distribution> = (&mut samples).into();

	let histograms: Results<Histogram> = (&samples).into();

	let output = Simulation {
		histograms,
		distributions,
	};

	Ok(output.into_ts()?)
}

pub fn run_monte_carlo(params: &Parameters, iterations: usize) -> Results<Vec<f64>> {
	use crate::results::WithCapacity;

	(0..iterations).fold(
		Results::<Vec<f64>>::with_capacity(iterations),
		|accumulator, _| iteration(accumulator, params),
	)
}

fn iteration(mut accumulator: Results<Vec<f64>>, params: &Parameters) -> Results<Vec<f64>> {
	// Integrator
	let integrator = RK4;

	// Structural Parameters
	let mass = params.structural.mass.sample(); // kg
	let n_motors = params.structural.num_motors as f64;

	// Motor Parameters
	let kv = params.propulsion.motor.kv.sample(); // rad/(s*V)
	let kt = 1.0 / kv; // N*m/A

	let diameter_motor = params.propulsion.motor.size.diameter; // m
	let height_motor = params.propulsion.motor.size.height; // m
	let rho_motor = 2700.0; // kg/m^3
	let mass_motor =
		rho_motor * (std::f64::consts::PI * diameter_motor.powi(2) * height_motor) / 4.0; // kg
	let j_motor = 0.5 * mass_motor * (diameter_motor / 2.0).powi(2); //kg*m^2

	let resistance_motor = 0.1; // Ω

	// Propeller Parameters
	let diameter_prop = params.propulsion.prop.diameter.sample(); // m
	let pitch_prop = params.propulsion.prop.pitch.sample(); // m

	let blades_factor = match params.propulsion.prop.blades {
		2 => 1.0,
		3 => 1.22,
		4 => 1.41,
		_ => 1.0,
	};

	let coefficient_thrust = 0.11 * blades_factor * (pitch_prop / diameter_prop);
	let coefficient_torque = coefficient_thrust / (2.0 * std::f64::consts::PI);

	let rho_prop = match params.propulsion.prop.material {
		Material::Polycarbonate => 1200.0,
		Material::CarbonFiber => 1500.0,
		Material::GlassFiberNylon => 1400.0,
	}; // kg/m^3

	let mass_prop = 0.005 * diameter_prop.powi(3) * rho_prop; // kg
	let j_prop = (1.0 / 12.0) * mass_prop * diameter_prop.powi(2); // kg*m^2
	let j_total = j_prop + j_motor; // kg*m^2

	// Battery / ESC Electrical Parameters
	let resistance_batt = params.electrical.battery.internal_resistance.sample(); // Ω
	let voltage_batt = params.electrical.battery.voltage; // V

	let r_total = resistance_batt + resistance_motor; // Ω

	//Simulation Step Response
	let omega_steady_state = {
		let mut low = 0.0;
		let mut high = voltage_batt * kv;
		let mut omega = high;

		// Binary search for torque equilibrium
		for _ in 0..30 {
			let mid = (low + high) / 2.0;
			let current_motor = ((voltage_batt - mid / kv) / r_total).max(0.0);
			let torque_motor = (current_motor - params.propulsion.motor.idle_current) * kt;
			let torque_prop = coefficient_torque
				* RHO * (mid / (2.0 * std::f64::consts::PI)).powi(2)
				* diameter_prop.powi(5);

			if torque_motor > torque_prop {
				low = mid;
			} else {
				high = mid;
			}
			omega = mid;
		}
		omega
	};

	let (rise_time, overshoot) = {
		let thrust_steady_state = coefficient_thrust
			* RHO * (omega_steady_state / (2.0 * std::f64::consts::PI))
			.powi(2) * diameter_prop.powi(4); // N
		let target_thrust = 0.9 * thrust_steady_state; // N
		let target_omega = (target_thrust / (coefficient_thrust * RHO * diameter_prop.powi(4)))
			.sqrt() * 2.0
			* std::f64::consts::PI; // rad/s

		let mut omega = 0.0; // rad/s
		let mut time = 0.0; // s
		let delta_time = 0.001; // s
		let mut r_time = 2.0; // s (Fallback worst-case ceiling bound)
		let mut max_omega = 0.0; // rad/s
		let mut found = false;

		for _ in 0..2000 {
			// Max 2-second transient evaluation horizon
			let d_omega_dt = |w: f64| {
				let current_motor = ((voltage_batt - w / kv) / r_total).max(0.0); // A
				let torque_motor = (current_motor - params.propulsion.motor.idle_current) * kt; // N*m
				let t_prop = coefficient_torque
					* RHO * (w / (2.0 * std::f64::consts::PI)).powi(2)
					* diameter_prop.powi(5); // N*m
				(torque_motor - t_prop) / j_total // rad/s^2
			};
			use crate::integrator::Integrator;

			omega = integrator.step(omega, delta_time, d_omega_dt); // rad/s

			time += delta_time; // s

			if omega > max_omega {
				max_omega = omega;
			}
			if !found && omega >= target_omega {
				r_time = time; // s
				found = true;
			}
		}
		let os = (((max_omega - omega_steady_state) / omega_steady_state) * 100.0).max(0.0); // %
		(r_time, os)
	}; // s, %

	accumulator.step.rise_time.push(rise_time);
	accumulator.step.overshoot.push(overshoot);

	//Simulation Endurance
	let (flight_time, hover_throttle, specific_thrust) = {
		let thrust_hover_needed = (mass * G) / n_motors; // N
		let omega_hover =
			(thrust_hover_needed / (coefficient_thrust * RHO * diameter_prop.powi(4))).sqrt()
				* 2.0 * std::f64::consts::PI; // rad/s
		let total_capacity = params.electrical.battery.capacity as f64; // A*s

		let torque_hover = coefficient_torque
			* RHO * (omega_hover / (2.0 * std::f64::consts::PI)).powi(2)
			* diameter_prop.powi(5); // N*m
		let current_hover = (torque_hover / kt) + params.propulsion.motor.idle_current; // A
		let current_total_hover = current_hover * n_motors; // A

		if omega_hover.is_nan()
			|| current_total_hover > params.electrical.battery.c_rating * (total_capacity / 3600.0)
		{
			(0.0, 100.0, 0.0)
		} else {
			let mut current_capacity = total_capacity; // A*s
			let mut elapsed_time = 0.0; // s
			let loop_delta_time = 1.0; // s
			let mut throttle_sum = 0.0;
			let mut ticks = 0.0;
			let temp_ambient = 25.0;
			let mut temp_battery = temp_ambient; // C

			while current_capacity > (total_capacity * 0.15) {
				// Stop at 15% remaining safety capacity
				let soc = current_capacity / total_capacity;
				let cell_count = (voltage_batt / 3.7).round();
				let v_oc = cell_count * (3.5 + 0.7 * soc); // V
				let v_loaded = v_oc - (current_total_hover * resistance_batt); // V

				let v_motor_req = (omega_hover / kv) + (current_hover * resistance_motor); // V
				let current_throttle = (v_motor_req / v_loaded).min(1.0).max(0.0);

				throttle_sum += current_throttle;
				ticks += 1.0;
				current_capacity -= current_total_hover * loop_delta_time; // A*s

				// Battery internal heating update calculations
				let power_heat = current_total_hover.powi(2) * resistance_batt; // W

				let thermal_capacitance = (0.5 * mass) * 950.0; // J/K (950 J/(kg*K))

				let thermal_conductance = 0.2; // W/K

				let cooling_power = thermal_conductance * (temp_battery - temp_ambient);

				temp_battery +=
					(power_heat - cooling_power) * loop_delta_time / thermal_capacitance; // C 

				elapsed_time += loop_delta_time; // s

				if v_loaded < (cell_count * 3.2) || current_throttle >= 1.0 {
					break;
				}
			}

			let avg_throttle = if ticks > 0.0 {
				(throttle_sum / ticks) * 100.0
			} else {
				100.0
			}; // %
			let power_avg =
				current_total_hover * (voltage_batt - (current_total_hover * resistance_batt)); // W

			let spec_thrust = if power_avg > 0.0 {
				mass / power_avg
			} else {
				0.0
			}; // g/W

			(elapsed_time / 60.0, avg_throttle, spec_thrust * 1000.0)
		} // min, unitless, g/W
	};

	accumulator.efficiency.flight_time.push(flight_time);
	accumulator.efficiency.hover_throttle.push(hover_throttle);
	accumulator.efficiency.specific_thrust.push(specific_thrust);

	//Simulation Performance
	let (max_accel, max_current_system, twr) = {
		let max_current_motor = ((voltage_batt - omega_steady_state / kv) / r_total).max(0.0); // A
		let current_system = max_current_motor * n_motors; // A

		let thrust_per_motor_max = coefficient_thrust
			* RHO * (omega_steady_state / (2.0 * std::f64::consts::PI))
			.powi(2) * diameter_prop.powi(4); // N
		let max_thrust_total = thrust_per_motor_max * n_motors; // N

		let ratio = max_thrust_total / (mass * G); // Ratio

		let acceleration = if max_thrust_total > (mass * G) {
			(max_thrust_total - (mass * G)) / mass // m/s^2
		} else {
			0.0 // m/s^2
		};

		(acceleration, current_system, ratio)
	}; // m/s^2, A, unitless

	accumulator.performance.max_accel.push(max_accel);
	accumulator.performance.max_current.push(max_current_system);
	accumulator.performance.twr.push(twr);

	accumulator
}
