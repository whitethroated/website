# WhiteThroated website content contract

## Page set (v1)

1. **Landing** — what WhiteThroated is, who it is for, honest status, quick-start
   snippet, link to results and methodology.
2. **Results** — benchmark matrices with full cells and per-cell provenance.
   Pilot content: the Tier 1 default-transport validation.
3. **Methodology** — how to run and judge benchmarks, from `methodology.md`,
   plus how to reproduce the pilot matrix.
4. **Report archive** — one entry per published report with verdict, gate
   status, errata links, and pointers to raw data.

## Provenance footer (required on every page showing numbers)

Each results page and each figure carries: framework commit SHA, Swift and
SwiftNIO versions, OS and CPU, load-generator identity and version notes,
measurement date, gate status, and a link to the archived raw data. The
footer vocabulary for gate status is fixed: `pass`, `mixed`, `rejected`.

## Publishing rules

- Full-matrix rule: a route/concurrency cell ships with all its rounds or not
  at all. No cherry-picked cells.
- Gate failures stay visible beside wins. A `mixed` or `rejected` verdict is
  never hidden behind a throughput figure.
- Best-case single-metric configurations are never presented as winning every
  metric; worker/topology tradeoffs and absolute tails stay visible.
- Every figure traces to an archived source (report table/section or pooled
  summary file). Transcribed figures must match their cited source exactly;
  the Swift exporter enforces this mechanically where the source is a
  `BenchmarkSummary` file.

## Data flow

The framework repo produces `site-data.json` plus SVG chart fragments via the
`whitethroated-site-export` tool from a curated `export-manifest.json`. The
website consumes those artifacts as data: it never hand-edits a number into a
page. Refreshing results means a new manifest, a new export, and a new pack.

## Theme tokens

Theme colors are defined with the `website-color-palette` skill in
fresh-palette mode and stored as `docs/color-palette.json` tokens plus a
`docs/color-palette.md` report in the site repo. Every text/background pair
carries a WCAG grade; sub-AA pairs are fixed or explicitly justified. Pages
reference the tokens through CSS variables so a re-theme never touches page
markup or data.
