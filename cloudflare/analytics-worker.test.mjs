import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { classifyRequest } from './analytics-worker.mjs';

const html = () => new Response('page', { headers: { 'content-type': 'text/html; charset=utf-8' } });
const markdown = () => new Response('page', { headers: { 'content-type': 'text/plain' } });
const request = (path, options) => new Request(`https://whitethroated.com${path}`, options);

test('classifies successful HTML and Markdown reads by path', () => {
  assert.deepEqual(classifyRequest(request('/results/', { headers: { 'user-agent': 'GPTBot' } }), html()), { path: '/results/', agent: '' });
  assert.deepEqual(classifyRequest(request('/results.md?ignored=1', { headers: { 'user-agent': 'GPTBot' } }), markdown()), { path: '/results.md', agent: 'GPTBot' });
  assert.deepEqual(classifyRequest(request('/results.md'), markdown()), { path: '/results.md', agent: 'Unknown' });
  assert.equal(classifyRequest(request('/results.md', { method: 'HEAD' }), markdown()), null);
  assert.equal(classifyRequest(request('/results.md'), new Response('', { status: 404 })), null);
  assert.equal(classifyRequest(request('/image.png'), markdown()), null);
});

test('serves aggregates without recording an API request', async () => {
  let cutoff;
  const env = { ANALYTICS_DB: {
    prepare() { return { bind(value) { cutoff = value; return this; } }; },
    async batch() { return [{ results: [{ path: '/results.md', agent: 'GPTBot', reads: 3 }] }, { results: [{ hour: '2026-11-18T12:00:00Z', kind: 'agent', reads: 3 }] }]; },
  } };
  const response = await worker.fetch(request('/api/analytics'), env, { waitUntil() { throw new Error('API request was counted'); } });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.totals[0].reads, 3);
  assert.equal(body.timeline[0].kind, 'agent');
  assert.match(cutoff, /^\d{4}-\d\d-\d\dT\d\d:00:00Z$/);
});

test('returns unavailable when its database cannot be queried', async () => {
  const env = { ANALYTICS_DB: { prepare() { return { bind() { return this; } }; }, async batch() { throw new Error('unavailable'); } } };
  const response = await worker.fetch(request('/api/analytics'), env, { waitUntil() {} });
  assert.equal(response.status, 503);
});

test('serves slashless pages from the directory origin and redirects legacy links', async (t) => {
  const origin = t.mock.method(globalThis, 'fetch', async () => html());
  for (const path of ['/analytics', '/reports']) {
    const legacy = await worker.fetch(request(path + '/?view=all'), {}, {});
    assert.equal(legacy.status, 308);
    assert.equal(legacy.headers.get('location'), request(path + '?view=all').url);

    const page = request(path + '?view=all');
    const response = await worker.fetch(page, {}, {});
    assert.equal(response.status, 200);
    assert.equal(origin.mock.calls.at(-1).arguments[0].url, request(path + '/?view=all').url);
    assert.deepEqual(classifyRequest(page, response), { path, agent: '' });
  }
});
