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

Each production build also generates a Markdown version of every rendered page from its HTML:
`/index.md`, `/results.md`, `/methodology.md`, `/reports.md`, and the matching `.md` path
for each report. The generator includes benchmark table rounds and source notes. These files are
build artifacts in `dist/`; edit the page sources rather than editing the generated Markdown.

## Theme

Tokens live in `docs/color-palette.json` (report: `docs/color-palette.md`), produced with the
`website-color-palette` skill in fresh-palette mode. Pages reference them through the CSS
variables in `src/styles/global.css`; a re-theme never touches markup or data.

## Analytics

The dashboard at `/analytics` needs the Cloudflare Worker in `cloudflare/` to collect reads and serve `/api/analytics`. GitHub Pages alone cannot count direct Markdown requests. The Worker counts successful HTML page requests as human and successful `.md` requests as agent, regardless of the visitor's actual identity. It stores hourly counts, paths, and recognized agent categories; it does not store IP addresses, cookies, query strings, or raw user-agent strings. Counts start after setup and may include repeated requests, crawler retries, or cached requests that reach the Worker. The trend API returns up to 366 days of hourly aggregates; page totals cover all stored history.

To enable it, use a Cloudflare account that owns the site zone and has a proxied DNS record pointing to the existing GitHub Pages origin. Create a D1 database with `npx wrangler d1 create whitethroated-analytics`, then add its returned database ID to `cloudflare/wrangler.toml`:

```toml
routes = [{ pattern = "whitethroated.com/*", zone_name = "whitethroated.com" }]

[[d1_databases]]
binding = "ANALYTICS_DB"
database_name = "whitethroated-analytics"
database_id = "YOUR_DATABASE_ID"
```

Initialize the remote database with `npx wrangler d1 execute whitethroated-analytics --remote --file cloudflare/analytics-schema.sql --config cloudflare/wrangler.toml`, then deploy using `npx wrangler deploy --config cloudflare/wrangler.toml`. Verify the public HTML and Markdown pages still load and `/api/analytics` returns aggregate data. Cloudflare account permissions, plan limits, and pricing apply. Until this is configured the dashboard correctly reports that data is unavailable. Run `node --test cloudflare/analytics-worker.test.mjs` to check request classification and the API response.

## Conventions

- Provenance footer on every page showing numbers (contract vocabulary: `pass` / `mixed` / `rejected`).
- Full-matrix rule: a cell ships with all its rounds or not at all.
- Gate failures stay visible beside wins.
