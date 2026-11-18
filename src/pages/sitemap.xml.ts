import type { APIRoute } from 'astro';

import { publicPagePath } from '../page-paths.mjs';

const pages = Object.keys(import.meta.glob('./**/*.{astro,md}'));

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('The site URL must be configured to generate the sitemap.');

  const urls = pages.map((page) => {
    const path = page.replace(/^\./, '').replace(/\.(astro|md)$/, '').replace(/\/index$/, '/');
    return new URL(publicPagePath(path.endsWith('/') ? path : `${path}/`), site).href;
  }).sort();

  const entries = urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
