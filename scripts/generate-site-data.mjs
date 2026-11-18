#!/usr/bin/env node
/**
 * Generate every number the site shows from the data pack (sources/).
 *
 * Inputs:  sources/pilot/export-manifest.json, site-data.json,
 *          tier1-default-2026-10-18.json, charts/*.svg, benchmark-*.md
 * Outputs: src/data/*, public/data/*, public/reports/*.md,
 *          src/pages/reports/tier1-default-2026-10-18.md
 *
 * The site never hand-edits a figure: cell medians are computed from the raw
 * per-round samples (median of 4, rounded half-to-even, matching the report
 * tables exactly) and cross-checked against the exporter's site-data figures.
 * Refreshing results means a new pack, then `npm run data`.
 *
 * Usage: node scripts/generate-site-data.mjs [--check]
 *   --check regenerates in memory and fails if any output differs.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readBytes = (p) => readFileSync(join(ROOT, p));
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

const outputs = new Map(); // relpath -> string|Buffer
const emit = (p, content) => outputs.set(p, content);

// Round half-to-even (banker's): matches the report tables, e.g. 206680.5 -> 206680.
function roundEven(x) {
  const f = Math.floor(x);
  const d = x - f;
  if (d !== 0.5) return Math.round(x);
  return f % 2 === 0 ? f : f + 1;
}
function median4(vals) {
  if (vals.length !== 4) throw new Error(`expected 4 rounds, got ${vals.length}`);
  const s = [...vals].sort((a, b) => a - b);
  return (s[1] + s[2]) / 2;
}

// ---- Load + validate the pack ----
const manifest = JSON.parse(read('sources/pilot/export-manifest.json'));
const siteData = JSON.parse(read('sources/pilot/site-data.json'));
const rawBytes = readBytes('sources/pilot/tier1-default-2026-10-18.json');
const raw = JSON.parse(rawBytes.toString('utf8'));

if (manifest.generatedFromCommit !== siteData.generatedFromCommit) {
  throw new Error('manifest/site-data generatedFromCommit mismatch');
}
for (const f of manifest.reports.flatMap((r) => r.dataFiles)) {
  const bytes = readBytes(`sources/pilot/${f.path}`);
  if (sha256(bytes) !== f.sha256) throw new Error(`sha256 mismatch: ${f.path}`);
}

const SERVERS = {
  'before-stock': 'Old stock',
  'before-tier1': 'Old Tier 1',
  'after-default': 'Current default',
  'after-stock': 'Current forced stock',
  raw: 'Raw NIO',
};
const ROUTES = {
  root: 'GET /',
  'user-get': 'GET /user/42',
  'user-post': 'POST /user',
  'stream-known': 'Known length',
  'stream-chunked': 'Chunked',
};
const MAIN_COLS = ['before-stock', 'before-tier1', 'after-default', 'raw'];
const STREAM_COLS = ['before-stock', 'after-stock', 'after-default'];

function roundsFor(server, route, conns, latency, key) {
  const rows = raw.samples
    .filter((s) => s.server === server && s.route === route
      && s.connections === conns && s.latency === latency)
    .sort((a, b) => a.round - b.round);
  if (rows.length !== 4) throw new Error(`expected 4 rounds for ${server}/${route}/c${conns}/${latency}`);
  return rows.map((r) => ({ round: r.round, value: r.metrics[key] }));
}
function cell(server, route, conns, latency, key) {
  const rounds = roundsFor(server, route, conns, latency, key);
  return { median: roundEven(median4(rounds.map((r) => r.value))), rounds };
}

// ---- Mechanical anchor: recompute the exporter's 12 figures ----
const FIG_SERVER = { 'old-stock': 'before-stock', 'old-tier1': 'before-tier1', 'current-default': 'after-default', 'raw-nio': 'raw' };
const FIG_ROUTE = { 'GET /': 'root' };
for (const rep of siteData.reports) {
  for (const fig of rep.figures) {
    const srv = FIG_SERVER[fig.server];
    const route = FIG_ROUTE[fig.route];
    const rps = cell(srv, route, fig.connections, false, 'requests_per_second').median;
    const p99 = cell(srv, route, fig.connections, true, 'latency_p99_us').median;
    if (rps !== fig.requestsPerSecond || p99 !== fig.p99Microseconds) {
      throw new Error(`figure mismatch: ${fig.label} (computed ${rps}/${p99})`);
    }
  }
}

// ---- Full matrix: every route x connection x server cell, all 4 rounds ----
const CONNS = [64, 256, 512];
const RPS_SRC = 'Pilot report, Network experiment throughput table (medians of 4 runs); per-round values from tier1-default-2026-10-18.json';
const P99_SRC = 'Pilot report, Network experiment p99 table (medians of 4 runs); per-round values from tier1-default-2026-10-18.json';
const STREAM_SRC = 'Pilot report, Network experiment stream table (medians of 4 runs); per-round values from tier1-default-2026-10-18.json';

const main = [];
for (const route of ['root', 'user-get', 'user-post']) {
  for (const conns of CONNS) {
    for (const server of MAIN_COLS) {
      main.push({
        route, connections: conns, server,
        rps: { ...cell(server, route, conns, false, 'requests_per_second'), source: RPS_SRC },
        p99: { ...cell(server, route, conns, true, 'latency_p99_us'), source: P99_SRC, unit: 'microseconds' },
      });
    }
  }
}
const streams = [];
for (const route of ['stream-known', 'stream-chunked']) {
  for (const conns of CONNS) {
    for (const server of STREAM_COLS) {
      streams.push({
        route, connections: conns, server,
        rps: { ...cell(server, route, conns, false, 'requests_per_second'), source: STREAM_SRC },
        p99: { ...cell(server, route, conns, true, 'latency_p99_us'), source: STREAM_SRC, unit: 'microseconds' },
      });
    }
  }
}

// ---- Resource examples + RSS maxima (report §Network experiment) ----
const cpuExamples = [
  { label: 'GET /, 256', route: 'root', connections: 256, servers: MAIN_COLS },
  { label: 'GET /user/42, 512', route: 'user-get', connections: 512, servers: MAIN_COLS },
  { label: 'Known-length c512 streams', route: 'stream-known', connections: 512, servers: ['before-stock', 'after-stock', 'after-default'] },
].map(({ label, route, connections, servers }) => ({
  label,
  secondsPer250k: servers.map((server) => {
    // Fractional-tick median, matching the report (e.g. 239.5 ticks -> 2.395 s).
    const ticks = median4(roundsFor(server, route, connections, false, 'server_cpu_ticks').map((r) => r.value));
    return { server, seconds: (ticks / 100).toFixed(3) };
  }),
}));
const rssMax = Object.keys(SERVERS).map((server) => ({
  server,
  peakRssKib: Math.max(...raw.samples.filter((s) => s.server === server).map((s) => s.metrics.server_peak_rss_kib)),
}));

const report = siteData.reports[0];
emit('src/data/matrix.json', JSON.stringify({
  generatedFromCommit: siteData.generatedFromCommit,
  reportId: report.id,
  servers: SERVERS,
  routes: ROUTES,
  mainColumns: MAIN_COLS,
  streamColumns: STREAM_COLS,
  connections: CONNS,
  main,
  streams,
  cpuExamples,
  rssMax,
  environment: raw.environment,
  notes: raw.notes,
}, null, 2) + '\n');

// ---- Pass-through artifacts (byte-identical copies) ----
emit('src/data/site-data.json', read('sources/pilot/site-data.json'));
emit('src/data/charts/tier1-default-2026-10-18.svg', read('sources/pilot/charts/tier1-default-2026-10-18.svg'));
emit('public/data/tier1-default-2026-10-18.json', rawBytes);
emit('public/reports/benchmark-tier1-default-2026-10-18.md', readBytes('sources/pilot/benchmark-tier1-default-2026-10-18.md'));

// ---- Full-report page: verbatim body + frontmatter, two link fixes ----
// 1. benchmark-data/... -> /data/... (site archive location)
// 2. The socket-options companion report is not in the site data pack, so its
//    link becomes plain text with an explicit note instead of a dead link.
const reportBody = read('sources/pilot/benchmark-tier1-default-2026-10-18.md')
  .replaceAll('(benchmark-data/tier1-default-2026-10-18.json)', '(/data/tier1-default-2026-10-18.json)')
  .replaceAll(
    '[the correction and validation](benchmark-socket-options-2026-10-18.md)',
    'the correction and validation (companion report, not included in this site\u2019s data pack)',
  );
emit('src/pages/reports/tier1-default-2026-10-18.md',
  `---\nlayout: ../../layouts/Site.astro\ntitle: '${report.title} (${report.provenance.measured})'\n---\n\n` +
  `> This page renders the pilot report verbatim from the data pack, with two mechanical link fixes noted in \`scripts/generate-site-data.mjs\`. [Download the verbatim file](/reports/benchmark-tier1-default-2026-10-18.md).\n\n` +
  reportBody);

// ---- Write or check ----
let failed = false;
for (const [rel, content] of outputs) {
  const abs = join(ROOT, rel);
  if (CHECK) {
    const current = existsSync(abs)
      ? readFileSync(abs, Buffer.isBuffer(content) ? null : 'utf8') : null;
    const same = Buffer.isBuffer(content)
      ? (current && Buffer.compare(current, content) === 0)
      : current === content;
    if (!same) { console.error(`OUTDATED: ${rel} (run npm run data)`); failed = true; }
  } else {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}
if (CHECK) {
  if (failed) process.exit(1);
  console.log(`OK: ${outputs.size} generated files are current.`);
} else {
  console.log(`Wrote ${outputs.size} generated files from pack ${siteData.generatedFromCommit.slice(0, 9)}.`);
}
