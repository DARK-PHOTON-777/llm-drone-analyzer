# LLM-DRONE-ANALYZER

LLM DRONE ANALYZER is an intelligent web application that analyzes custom drone configurations against specific performance goals using physics-backed simulations and LLM-driven insights. By running a high-performance Monte Carlo simulation, the app accounts for physical component variances, generates accurate performance distributions, and provides curated hardware recommendations to optimize your flight objectives.

**[Analyze a Drone](https://drone-llm.netlify.app/)**

## How It Works

1. **User Input:** The user defines a custom drone hardware configuration and specifies their flight performance goals in plain language.
2. **Physics Simulation:** A high-performance Rust WASM module executes a Monte Carlo simulation based on the equations of motion, factoring in hardware tolerance and component variance.
3. **Static Assessment:** The raw simulation results are aggregated into localized performance distributions (histograms) and statically assessed.
4. **LLM Inference:** The structural analysis and simulation metrics are piped into an LLM, which returns a curated, highly precise engineering response alongside the intuitive visual data.

## Tech Stack & Architecture

- **Frontend:** Vite + React, featuring responsive data visualization for performance histograms.
- **Simulation Core:** Rust compiled to WebAssembly (WASM) for efficient, near-native execution of multi-variable Monte Carlo equations of motion.
- **Backend:** Netlify Serverless Functions coordinating the static assessment and LLM inference logic.
- **Validation:** Shared data schemas ensuring strict API compliance and structured tool outputs between the frontend and serverless layers.

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js & npm](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)

### Installation

#### 1. Configure Environment Variables
Copy the template environment file and populate it with your specific API credentials:

Code output
File saved successfully: README.md

```bash
cp .env.example .env
```

Open .env and fill in your LLM provider API keys and any other required configuration variables.

#### 2. Install Dependencies & Start the Dev Server
Return to the root directory to install the frontend/backend packages and boot the integrated local environment:

```bash
npm install
npx netlify dev
```

The Netlify CLI will automatically spin up the Vite frontend and local serverless endpoints, wiring them together seamlessly.


## Project Structure

```
├── web/        # Vite + React frontend (UI & performance histograms)
├── api/        # Shared schemas, types, and utility functions
├── rust/       # Monte Carlo Simulation core (Equations of motion in Rust)
└── netlify/    # Serverless functions — LLM inference and distribution handling
```