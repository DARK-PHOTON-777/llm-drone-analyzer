use serde::Serialize;
use tsify::Tsify;

#[derive(Debug, Serialize, Clone, Tsify)]
pub struct Distribution {
	pub mean: f64,
	pub std: f64,
	pub p5: f64,
	pub p95: f64,
}

impl Distribution {
	pub fn from_samples(data: &mut [f64]) -> Self {
		let N = data.len();
		// 1. Calculate Mean
		let sum: f64 = data.iter().sum();
		let mean = sum / (N as f64);

		// 2. Calculate Standard Deviation
		let variance_sum: f64 = data.iter().map(|&x| (x - mean).powi(2)).sum();
		let std = (variance_sum / (N as f64)).sqrt();

		// 3. Sort array on stack to pull exact percentiles without breaking allocations
		data.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

		// Exact indices for P5 and P95 profiles
		let index_p5 = ((N as f64) * 0.05).round() as usize;
		let index_p95 = ((N as f64) * 0.95).round() as usize;

		let p5 = data.get(index_p5.min(N - 1)).copied().unwrap_or(0.0);
		let p95 = data.get(index_p95.min(N - 1)).copied().unwrap_or(0.0);

		Self { mean, std, p5, p95 }
	}
}
