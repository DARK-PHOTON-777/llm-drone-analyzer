use serde::Serialize;
use tsify::Tsify;

#[derive(Debug, Serialize, Clone, Tsify)]
pub struct Bin {
	pub min: f64,
	pub max: f64,
	pub count: usize,
}

#[derive(Debug, Serialize, Clone, Tsify)]

pub struct Histogram {
	pub bins: Vec<Bin>,
}

const BIN_COUNT: usize = 50;

impl Histogram {
	pub fn from_sorted_samples(samples: &[f64]) -> Self {
		if samples.is_empty() {
			return Histogram { bins: Vec::new() };
		}

		let min_val = *samples.first().unwrap_or(&0.0);
		let max_val = *samples.last().unwrap_or(&0.0);
		let range = max_val - min_val;

		if range == 0.0 {
			return Histogram {
				bins: vec![Bin {
					min: min_val,
					max: max_val,
					count: samples.len(),
				}],
			};
		}

		let bin_width = range / (BIN_COUNT as f64);

		let mut bins: Vec<Bin> = (0..BIN_COUNT)
			.map(|i| Bin {
				min: min_val + (i as f64) * bin_width,
				max: min_val + ((i + 1) as f64) * bin_width,
				count: 0,
			})
			.collect();

		bins.iter_mut().fold(0, |mut idx, bin| {
			while idx < samples.len()
				&& samples
					.get(idx)
					.map(|sample| *sample <= bin.max)
					.unwrap_or(false)
			{
				bin.count += 1;
				idx += 1;
			}
			idx // Pass the running index to the next bin item
		});

		Self { bins }
	}
}
