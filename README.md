# WhiteThroated showcase website

Astro static site. Content contract: `sources/content-contract.md`. The `sources/` pack is the
only source of WhiteThroated knowledge — never invent numbers, claims, or methodology beyond it.

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install pinned dependencies (commit `package-lock.json`) |
| `npm run data` | Regenerate site data from `sources/` (run after any pack refresh) |
| `npm run check:data` | Verify generated data is current and matches raw samples |
| `npm run dev` | Local dev server |
| `npm run build` | Static build to `dist/` |
| `npm run preview` | Serve `dist/` locally on port 4321 |

## Data flow

`scripts/generate-site-data.mjs` reads `sources/pilot/` and writes `src/data/*`,
`public/data/*`, `public/reports/*.md`, and the rendered report page. Cell medians are computed
from the raw per-round samples and cross-checked against the exporter's `site-data.json`
figures; `scripts/verify-matrix.py` additionally checks all 108 report cells. Pages never
hand-edit a number. Refreshing results means a new pack (new SHA, new data, new manifest),
then `npm run data` — never mix files from two packs.

## Theme

Tokens live in `docs/color-palette.json` (report: `docs/color-palette.md`), produced with the
`website-color-palette` skill in fresh-palette mode. Pages reference them through the CSS
variables in `src/styles/global.css`; a re-theme never touches markup or data.

## Conventions

- Provenance footer on every page showing numbers (contract vocabulary: `pass` / `mixed` / `rejected`).
- Full-matrix rule: a cell ships with all its rounds or not at all.
- Gate failures stay visible beside wins.
