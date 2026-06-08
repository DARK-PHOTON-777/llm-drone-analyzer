use rand::prelude::*;
use rand_distr::{Distribution, Normal};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variance {
	pub nominal: f64,
	pub variance: f64, // e.g., 5.0 for 5%
}

impl Variance {
	pub fn sample(&self) -> f64 {
		let mut rng = SmallRng::from_entropy();

		let absolute_variance = self.nominal * (self.variance / 100.0);

		let std_dev = absolute_variance.sqrt();

		let normal_dist = Normal::new(self.nominal, std_dev).unwrap();

		normal_dist.sample(&mut rng)
	}
}
