use crate::variance::Variance;
use serde::{Deserialize, Serialize};
use tsify::Tsify;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Battery {
	pub voltage: f64,                  // V
	pub capacity: u32,                 // A*s
	pub c_rating: f64,                 // unitless
	pub internal_resistance: Variance, // Ω
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Esc {
	pub current_limit: f64, // A
	pub pwm_frequency: f64, // Hz
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Electrical {
	pub battery: Battery,
	pub esc: Esc,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Material {
	#[serde(rename = "Polycarbonate")]
	Polycarbonate,
	#[serde(rename = "Carbon Fiber")]
	CarbonFiber,
	#[serde(rename = "Glass Fiber Nylon")]
	GlassFiberNylon,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotorSize {
	pub diameter: f64, // m
	pub height: f64,   // m
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Motor {
	pub size: MotorSize,   // m
	pub kv: Variance,      // rad / (s*V)
	pub idle_current: f64, // A
	pub max_current: f64,  // A
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prop {
	pub blades: u32,        // unitless
	pub diameter: Variance, // m
	pub pitch: Variance,    // m
	pub material: Material,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Propulsion {
	pub motor: Motor,
	pub prop: Prop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Structural {
	pub mass: Variance,  // kg
	pub num_motors: u32, // unitless
	pub frame_size: f64, // m
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify)]
pub struct Parameters {
	pub electrical: Electrical,
	pub propulsion: Propulsion,
	pub structural: Structural,
}
