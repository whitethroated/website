# WhiteThroated benchmark methodology brief

Source: framework `BENCHMARKS.md` at `2b3493869803eaa8b3f78bc2bd26c86c5c8c1e8f`.
Distilled for the website methodology page. Fine detail lives in the pilot
report and in the framework's `BENCHMARKS.md`.

## Control hierarchy (always in this order)

1. Same WhiteThroated path before vs after a change.
2. Equivalent raw SwiftNIO control (transport lower bound, no framework routing).
3. Equivalent WhiteThroated responder modes (prepared / sync / future / async).
4. External frameworks (Actix Web reference, Express/Hono controls) only after
   Swift-side overhead is understood. External controls live outside the Swift
   repository, which stays Swift-only.

## External contract routes

Every cross-framework comparison uses the same three routes with identical
semantics: `GET /` returns an empty 2xx response; `GET /user/:id` returns the
route parameter as the body; `POST /user` returns an empty 2xx response.
Never compare WhiteThroated's prepared diagnostic route against another
framework's dynamic route.

## Concurrency gates

Run the matrix at 64, 256, and 512 concurrent connections. All three levels
are independent acceptance gates: a change is not a win if peak throughput
rises while another level's tail latency regresses materially.

## Throughput vs latency runs

Collect separate throughput-only samples (primary RPS result) and
latency-enabled samples (paired distribution: min, average, p50, p75, p90,
p99, p99.999, max). The Swift benchmark client opens all connections before
the timer starts, keeps one request in flight per connection, and excludes
connection setup from measurement. Timestamp collection is part of the client
workload, so compared servers must use the same latency setting.

## What every published result records

Requests/second; min/avg/p50/p75/p90/p99/p99.999/max latency; CPU and resident
memory; Swift and SwiftNIO versions; external versions when applicable; OS and
CPU model; exact commands; commit SHA; warm-up, rounds, and ordering. Raw
samples are archived with the record.

## Evidence gates (non-negotiable)

- CI smoke numbers are not performance evidence and are never published.
- `COMPLETE.txt` means a campaign executed; it does not mean gates passed.
- Never mix runs across load-generator versions. Two published errata required
  full rebaselining: the client event-loop distribution fix and the TCP
  socket-option correction. Historical labels affected by them must carry the
  erratum, not silent reinterpretation.
- In-process ns/op diagnostics explain costs; they never substitute for
  network measurements.
- Sub-10% claims need the strengthened protocol: quiet-host preflight,
  rotated/alternating order, and enough rounds to beat run-to-run variance.
  Within-noise results are reported as neutral, never as wins.
