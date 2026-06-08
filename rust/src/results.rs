use crate::distribution::Distribution;
use crate::histogram::Histogram;
use serde::Serialize;
use tsify::Tsify;

#[derive(Debug, Serialize, Clone, Tsify)]
pub struct Step<T> {
	pub rise_time: T, // s
}

#[derive(Debug, Serialize, Clone, Tsify)]
pub struct Efficient<T> {
	pub flight_time: T,     // s
	pub hover_throttle: T,  // %
	pub specific_thrust: T, // kg/W
}

#[derive(Debug, Serialize, Clone, Tsify)]
pub struct Performance<T> {
	pub max_accel: T,   // m/s^2
	pub max_current: T, // A
	pub twr: T,         // Unitless
}

#[derive(Debug, Serialize, Clone, Tsify)]
pub struct Results<T> {
	pub step: Step<T>,
	pub efficiency: Efficient<T>,
	pub performance: Performance<T>,
}

impl From<&mut Step<Vec<f64>>> for Step<Distribution> {
	fn from(sub_struct: &mut Step<Vec<f64>>) -> Self {
		Step {
			rise_time: Distribution::from_samples(&mut sub_struct.rise_time),
		}
	}
}

impl From<&mut Efficient<Vec<f64>>> for Efficient<Distribution> {
	fn from(sub_struct: &mut Efficient<Vec<f64>>) -> Self {
		Efficient {
			flight_time: Distribution::from_samples(&mut sub_struct.flight_time),
			hover_throttle: Distribution::from_samples(&mut sub_struct.hover_throttle),
			specific_thrust: Distribution::from_samples(&mut sub_struct.specific_thrust),
		}
	}
}

impl From<&mut Performance<Vec<f64>>> for Performance<Distribution> {
	fn from(sub_struct: &mut Performance<Vec<f64>>) -> Self {
		Performance {
			max_accel: Distribution::from_samples(&mut sub_struct.max_accel),
			max_current: Distribution::from_samples(&mut sub_struct.max_current),
			twr: Distribution::from_samples(&mut sub_struct.twr),
		}
	}
}

impl<T> From<&mut Results<T>> for Results<Distribution>
where
	// This bound says: "As long as the inner pieces can turn into Distribution versions"
	for<'a> &'a mut Step<T>: Into<Step<Distribution>>,
	for<'a> &'a mut Efficient<T>: Into<Efficient<Distribution>>,
	for<'a> &'a mut Performance<T>: Into<Performance<Distribution>>,
{
	fn from(results: &mut Results<T>) -> Self {
		Results {
			// .into() automatically triggers the implementations we wrote in Step 1
			step: (&mut results.step).into(),
			efficiency: (&mut results.efficiency).into(),
			performance: (&mut results.performance).into(),
		}
	}
}

impl From<&Step<Vec<f64>>> for Step<Histogram> {
	fn from(sub: &Step<Vec<f64>>) -> Self {
		let _b = 12; // Target 12 functional distribution subdivisions 
		Step {
			rise_time: Histogram::from_sorted_samples(&sub.rise_time),
		}
	}
}

impl From<&Efficient<Vec<f64>>> for Efficient<Histogram> {
	fn from(sub: &Efficient<Vec<f64>>) -> Self {
		let _b = 12;
		Efficient {
			flight_time: Histogram::from_sorted_samples(&sub.flight_time),
			hover_throttle: Histogram::from_sorted_samples(&sub.hover_throttle),
			specific_thrust: Histogram::from_sorted_samples(&sub.specific_thrust),
		}
	}
}

impl From<&Performance<Vec<f64>>> for Performance<Histogram> {
	fn from(sub: &Performance<Vec<f64>>) -> Self {
		let _b = 12;
		Performance {
			max_accel: Histogram::from_sorted_samples(&sub.max_accel),
			max_current: Histogram::from_sorted_samples(&sub.max_current),
			twr: Histogram::from_sorted_samples(&sub.twr),
		}
	}
}

impl From<&Results<Vec<f64>>> for Results<Histogram> {
	fn from(results: &Results<Vec<f64>>) -> Self {
		Results {
			step: (&results.step).into(),
			efficiency: (&results.efficiency).into(),
			performance: (&results.performance).into(),
		}
	}
}

pub trait WithCapacity {
	fn with_capacity(capacity: usize) -> Self;
}

// 2. Implement it for the base case (Vec<T>)
impl<T> WithCapacity for Vec<T> {
	fn with_capacity(capacity: usize) -> Self {
		Vec::with_capacity(capacity)
	}
}

impl<T: WithCapacity> WithCapacity for Step<T> {
	fn with_capacity(capacity: usize) -> Self {
		Self {
			rise_time: T::with_capacity(capacity),
		}
	}
}

impl<T: WithCapacity> WithCapacity for Efficient<T> {
	fn with_capacity(capacity: usize) -> Self {
		Self {
			flight_time: T::with_capacity(capacity),
			hover_throttle: T::with_capacity(capacity),
			specific_thrust: T::with_capacity(capacity),
		}
	}
}

impl<T: WithCapacity> WithCapacity for Performance<T> {
	fn with_capacity(capacity: usize) -> Self {
		Self {
			max_accel: T::with_capacity(capacity),
			max_current: T::with_capacity(capacity),
			twr: T::with_capacity(capacity),
		}
	}
}

impl<T: WithCapacity> WithCapacity for Results<T> {
	fn with_capacity(capacity: usize) -> Self {
		Self {
			step: Step::with_capacity(capacity),
			efficiency: Efficient::with_capacity(capacity),
			performance: Performance::with_capacity(capacity),
		}
	}
}
