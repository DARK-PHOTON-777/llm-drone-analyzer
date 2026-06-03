pub trait Integrator {
	fn step(&self, x: f64, dt: f64, f: impl Fn(f64) -> f64) -> f64;
}

pub struct RK4;
pub struct Euler;

impl Integrator for RK4 {
	fn step(&self, x: f64, dt: f64, f: impl Fn(f64) -> f64) -> f64 {
		let k1 = f(x);
		let k2 = f(x + 0.5 * dt * k1);
		let k3 = f(x + 0.5 * dt * k2);
		let k4 = f(x + dt * k3);
		x + dt * (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0
	}
}

impl Integrator for Euler {
	fn step(&self, x: f64, dt: f64, f: impl Fn(f64) -> f64) -> f64 {
		x + dt * f(x)
	}
}
