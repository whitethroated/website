---
name: agent-readable-pages
description: Ensure new or changed WhiteThroated website pages are readable and discoverable by AI agents, with matching Markdown content and verified links. Use when adding or modifying site pages or their Markdown generation and discovery.
---

# Agent-readable pages

For every new or changed public page in this repository:

1. Keep meaningful content, headings, links, data, and provenance in the generated HTML without requiring JavaScript to read them. Use the shared `Site.astro` layout, or provide equivalent canonical and `rel="alternate" type="text/markdown"` links.
2. Preserve the production Markdown build (`npm run build` invokes `scripts/generate-page-markdown.py`). A page at `/path/` must produce `/path.md`; the home page uses `/index.md`. Extend the generator if the page uses content or components it cannot faithfully convert. Include important details hidden in disclosures, tables, code, source links, and caveats; do not invent benchmark claims or omit per-round data.
3. Ensure the page appears in the generated sitemap and its HTML and Markdown URLs are discoverable in `public/llms.txt`. Keep existing entries accurate when routes or content change. Follow the configured site URL rather than inventing a domain.
4. Run `npm run build`, then inspect the generated HTML and Markdown in `dist/`: verify the alternate link and sitemap URL resolve to the correct files, meaningful page content and important details survive conversion, links point to the correct destinations, and `llms.txt` references valid outputs. For benchmark or source-data changes, also run `npm run check:data`.

For pages that cannot be generated as static HTML, implement and verify an equivalent readable Markdown endpoint and discovery links; do not claim coverage solely from a successful build. Preserve the project's content contract in `sources/content-contract.md`.
