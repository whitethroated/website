import { isSlashlessPage, publicPagePath } from '../src/page-paths.mjs';

// Run on the site's Cloudflare route in front of its existing static origin.
// Only hourly aggregates are stored: no IP addresses, cookies, query strings,
// or raw user-agent strings are retained.
const knownAgents = [
  ['ChatGPT-User', /ChatGPT-User/i], ['OAI-SearchBot', /OAI-SearchBot/i],
  ['GPTBot', /GPTBot/i], ['ClaudeBot', /ClaudeBot/i],
  ['Claude-User', /Claude-User/i], ['PerplexityBot', /PerplexityBot/i],
  ['Google-Extended', /Google-Extended/i], ['Googlebot', /Googlebot/i],
  ['Bingbot', /bingbot/i],
];

export function classifyRequest(request, response) {
  if (request.method !== 'GET' || response.status !== 200) return null;
  const path = new URL(request.url).pathname;
  const isMarkdown = /\.md$/i.test(path);
  const isPage = (isSlashlessPage(path) || path.endsWith('/') || /\.html?$/i.test(path)) &&
    (response.headers.get('content-type') || '').toLowerCase().includes('text/html');
  if (!isMarkdown && !isPage) return null;
  const agent = isMarkdown ? (knownAgents.find(([, pattern]) => pattern.test(request.headers.get('user-agent') || ''))?.[0] || 'Unknown') : '';
  return { path, agent };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/analytics' && request.method === 'GET') {
      try {
        const cutoff = new Date(Date.now() - 366 * 86400000).toISOString().slice(0, 13) + ':00:00Z';
        const [totals, timeline] = await env.ANALYTICS_DB.batch([
          env.ANALYTICS_DB.prepare('SELECT path, agent, SUM(reads) AS reads FROM page_reads GROUP BY path, agent'),
          env.ANALYTICS_DB.prepare("SELECT hour, CASE WHEN lower(path) LIKE '%.md' THEN 'agent' ELSE 'human' END AS kind, SUM(reads) AS reads FROM page_reads WHERE hour >= ? GROUP BY hour, kind ORDER BY hour").bind(cutoff),
        ]);
        return Response.json({ updatedAt: new Date().toISOString(), totals: totals.results, timeline: timeline.results }, { headers: { 'Cache-Control': 'public, max-age=60' } });
      } catch {
        return Response.json({ error: 'Analytics temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
    }
    let originRequest = request;
    if (request.method === 'GET' || request.method === 'HEAD') {
      const canonical = publicPagePath(url.pathname);
      if (canonical !== url.pathname) {
        url.pathname = canonical;
        return Response.redirect(url.href, 308);
      }
      if (isSlashlessPage(url.pathname)) {
        url.pathname += '/';
        originRequest = new Request(url, request);
      }
    }
    const response = await fetch(originRequest);
    const read = classifyRequest(request, response);
    if (read && env.ANALYTICS_DB) {
      const hour = new Date().toISOString().slice(0, 13) + ':00:00Z';
      try {
        ctx.waitUntil(env.ANALYTICS_DB.prepare('INSERT INTO page_reads (hour, path, agent, reads) VALUES (?, ?, ?, 1) ON CONFLICT(hour, path, agent) DO UPDATE SET reads = reads + 1').bind(hour, read.path, read.agent).run().catch(() => {}));
      } catch {
        // A tracking failure must not prevent the origin response from being served.
      }
    }
    return response;
  },
};
