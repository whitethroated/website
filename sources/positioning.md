# WhiteThroated positioning brief

Source: framework `README.md`, `ARCHITECTURE.md`, `docs/performance-goal-status.md`
at `2b3493869803eaa8b3f78bc2bd26c86c5c8c1e8f`. Paraphrased for the website; do
not add claims beyond this brief.

## What it is

WhiteThroated is an experimental high-performance web framework written
entirely in Swift. It has two non-negotiable goals:

1. Express.js-level ergonomics for application developers.
2. Runtime overhead low enough to compete with the fastest practical server
   frameworks, with Actix Web as an external performance reference and raw
   SwiftNIO as the lower-bound control.

It is pre-alpha. API compatibility is intentionally secondary to establishing
a fast, measurable runtime architecture. Users should expect breaking changes
before 1.0 and pin exact releases.

## How it is built (one paragraph for the site)

Application code uses the `WhiteThroated` module (routes, middleware,
Request/Response). Execution runs on `WhiteThroatedRuntime`, an internal
module on SwiftNIO that owns the HTTP/1.1 pipeline, dispatch state machine,
and response writer. Configuration is mutable during setup and frozen once
serving begins. Four responder paths exist so cheap routes never pay for
features they don't use: prepared immutable responses, synchronous handlers,
event-loop-native futures, and opt-in async/await. The default transport is
Tier 1 HTTP/1 with a stock SwiftNIO fallback for request-streaming apps.

## Performance target (exact framing)

The target is not a requests-per-second number. The target is to minimize
framework overhead until Swift runtime, SwiftNIO, kernel, and hardware costs
dominate. The honest comparison order is: same WhiteThroated path
before/after, then equivalent raw SwiftNIO, then responder modes, then
external frameworks only after Swift-side overhead is understood.

## Current status (must stay visible on the site)

The performance goal is **not achieved**. Measured evidence shows decisive
p50 wins against several controls but material tail-latency gaps (p90/p99 and
extreme tails) that remain under investigation. VM results do not establish
bare-metal results. A green correctness suite is not proof of the performance
goal. The site must show tradeoffs and open investigations beside every win.

## Allowed claims

- "Experimental Swift web framework, pre-alpha."
- "Express-inspired routing with synchronous, future, and async handler styles."
- "Prepared responses precompute immutable content at setup."
- "Benchmarks compare against raw SwiftNIO and external controls with full methodology published."
- Any figure that carries the provenance footer defined in `content-contract.md`.

## Forbidden claims

- "Fastest Swift framework" or any superlative without a cited, reproducible comparison.
- Presenting a best-case single-metric configuration as winning every metric.
- CI smoke timings, single-sample cells, or incomparable-generator runs as results.
- Hiding a gate failure (tail regression, mixed verdict) behind a throughput win.
- Re-rankings of external frameworks from VM-only or single-round data.
