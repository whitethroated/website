# WhiteThroated website handoff pack

This pack is the new website session's only source of WhiteThroated knowledge.
It was exported from the framework repository at commit
`2b3493869803eaa8b3f78bc2bd26c86c5c8c1e8f` on 2026-11-18.

Standing instruction for the website session: read every file in this pack
before building. Do not invent benchmark numbers, methodology details, or
framework claims beyond what this pack contains. If something you need is
missing, stop and ask the user instead of guessing.

## Contents

| File | Purpose |
|---|---|
| `positioning.md` | What WhiteThroated is, who it is for, honest status, allowed vs forbidden claims |
| `methodology.md` | How benchmarks are run and judged, distilled from `BENCHMARKS.md` |
| `content-contract.md` | Page set, provenance footer schema, publishing rules, theme-token requirement |
| `pilot/benchmark-tier1-default-2026-10-18.md` | Pilot report, copied verbatim from framework `docs/` |
| `pilot/tier1-default-2026-10-18.json` | Pilot measurement data (432 samples), copied verbatim from framework `docs/benchmark-data/` |
| `pilot/export-manifest.json` | Curated pilot manifest: the input the Swift exporter validates |
| `pilot/site-data.json` | Exporter output for the pilot (reference example) |
| `pilot/charts/` | Exporter-generated SVG chart fragments for the pilot |

## Checklist (all must hold before site work starts)

- [ ] `positioning.md` states what WhiteThroated is and what the site may claim.
- [ ] `methodology.md` states the control hierarchy, contract routes, concurrency gates, and evidence rules.
- [ ] `content-contract.md` states the page set and provenance schema.
- [ ] Pilot report + data + manifest are present and mutually consistent.
- [ ] The manifest's `generatedFromCommit` matches the source SHA above.

## Refresh rule

This pack pins one framework commit. When the site needs newer results, the
framework session re-exports the pack (new SHA, new data, new manifest) and the
website session consumes the new pack. Never mix files from two packs.
