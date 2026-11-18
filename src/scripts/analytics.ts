import { publicPagePath } from '../page-paths.mjs';

type Total = { path: string; agent: string; reads: number };
type Row = { hour: string; kind: 'human' | 'agent'; reads: number };
type Dataset = { updatedAt: string; totals: Total[]; timeline: Row[] };

const root = document.querySelector<HTMLElement>('#analytics');
if (root) {
  const element = (id: string) => document.getElementById(id)!;
  const format = (n: number) => n.toLocaleString();
  const agent = (path: string) => path.toLowerCase().endsWith('.md');
  const normalized = (path: string) => path.toLowerCase() === '/index.md' ? '/' : agent(path) ? `${path.slice(0, -3)}/` : path;
  const label = (path: string) => ({ '/': 'Homepage', '/results': 'Results', '/methodology': 'Methodology', '/reports': 'Reports', '/analytics': 'Analytics' }[path] || path);
  const make = (tag: string, className: string, content: string) => {
    const el = document.createElement(tag); el.className = className; el.textContent = content; return el;
  };
  const scrollPanels = root.querySelectorAll<HTMLElement>('.analytics-scroll');
  function updateScrollFade(panel: HTMLElement) {
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = panel;
    const edges = [
      scrollTop > 1 && 'top',
      scrollHeight - clientHeight - scrollTop > 1 && 'bottom',
      scrollLeft > 1 && 'left',
      scrollWidth - clientWidth - scrollLeft > 1 && 'right',
    ].filter(Boolean);
    if (edges.length) panel.dataset.overflow = edges.join(' ');
    else delete panel.dataset.overflow;
  }
  const scrollObserver = new ResizeObserver(() => scrollPanels.forEach(updateScrollFade));
  for (const panel of scrollPanels) {
    scrollObserver.observe(panel);
    panel.addEventListener('scroll', () => updateScrollFade(panel), { passive: true });
  }

  let data: Dataset | null = null;
  let period = '30d';

  function rangeStart(now: Date, selection: string): number {
    if (selection === 'year') return Date.UTC(now.getUTCFullYear(), 0, 1);
    const days = selection === '24h' ? 1 : Number.parseInt(selection, 10);
    const interval = selection === '24h' ? 3600000 : 86400000;
    const buckets = selection === '24h' ? 24 : days;
    return Math.floor(now.getTime() / interval) * interval - (buckets - 1) * interval;
  }

  const svg = root.querySelector<SVGSVGElement>('#reading-chart')!;
  const chartMessage = element('chart-message');
  const plotStart = 38;
  const plotWidth = 852;
  let selectedTime: number | undefined;
  let scrubTrend: ((position: number | string) => void) | undefined;

  svg.addEventListener('pointerdown', (event) => {
    if (!scrubTrend || !event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return;
    svg.setPointerCapture(event.pointerId);
    scrubTrend(event.clientX);
  });
  svg.addEventListener('pointermove', (event) => {
    if (svg.hasPointerCapture(event.pointerId)) scrubTrend?.(event.clientX);
  });
  svg.addEventListener('click', (event) => {
    if (event.detail) scrubTrend?.(event.clientX);
  });
  svg.addEventListener('keydown', (event) => {
    if (!scrubTrend || !['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    scrubTrend(event.key);
  });

  function drawTrend() {
    if (!data) return;
    svg.replaceChildren();
    const now = new Date();
    const hourly = period === '24h';
    const interval = hourly ? 3600000 : 86400000;
    const start = Math.floor(rangeStart(now, period) / interval) * interval;
    const end = Math.floor(now.getTime() / interval) * interval;
    const points: { time: number; human: number; agent: number }[] = [];
    for (let time = start; time <= end; time += interval) points.push({ time, human: 0, agent: 0 });
    for (const row of data.timeline) {
      const index = Math.floor((Date.parse(row.hour) - start) / interval);
      if (index >= 0 && index < points.length) points[index][row.kind] += row.reads;
    }
    const max = Math.max(1, ...points.flatMap((p) => [p.human, p.agent]));
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i <= 4; i++) {
      const y = 12 + i * 53;
      const line = document.createElementNS(ns, 'line'); line.setAttribute('x1', '38'); line.setAttribute('x2', '890'); line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('stroke', 'var(--wt-border)'); svg.append(line);
      const text = document.createElementNS(ns, 'text'); text.setAttribute('x', '30'); text.setAttribute('y', String(y + 4)); text.setAttribute('text-anchor', 'end'); text.setAttribute('fill', 'var(--wt-text-secondary)'); text.setAttribute('font-size', '11'); text.textContent = String(Math.round(max * (1 - i / 4))); svg.append(text);
    }
    for (const kind of ['human', 'agent'] as const) {
      const line = document.createElementNS(ns, 'polyline');
      line.setAttribute('points', points.map((p, i) => `${plotStart + i * plotWidth / Math.max(1, points.length - 1)},${224 - p[kind] / max * 212}`).join(' '));
      line.setAttribute('fill', 'none'); line.setAttribute('stroke', kind === 'human' ? 'var(--human)' : 'var(--agent)'); line.setAttribute('stroke-width', '3'); line.setAttribute('vector-effect', 'non-scaling-stroke'); svg.append(line);
    }
    for (const [i, point] of [[0, points[0]], [points.length - 1, points[points.length - 1]]] as const) {
      const text = document.createElementNS(ns, 'text'); text.setAttribute('x', String(plotStart + i * plotWidth / Math.max(1, points.length - 1))); text.setAttribute('y', '250'); text.setAttribute('text-anchor', i === 0 ? 'start' : 'end'); text.setAttribute('fill', 'var(--wt-text-secondary)'); text.setAttribute('font-size', '11'); text.textContent = new Date(point.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }); svg.append(text);
    }
    const summary = `${points.length} ${hourly ? 'hourly' : 'daily'} intervals · UTC`;
    const marker = document.createElementNS(ns, 'line');
    marker.setAttribute('y1', '12');
    marker.setAttribute('y2', '224');
    marker.setAttribute('stroke', 'var(--wt-text-secondary)');
    marker.setAttribute('stroke-dasharray', '4 4');
    marker.setAttribute('visibility', 'hidden');
    svg.append(marker);

    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric', hour: hourly ? 'numeric' : undefined, timeZone: 'UTC',
    });
    let selected = points.findIndex((point) => point.time === selectedTime);
    const select = (index: number) => {
      selected = index;
      if (index < 0) {
        selectedTime = undefined;
        marker.setAttribute('visibility', 'hidden');
        chartMessage.textContent = summary;
        return;
      }
      const point = points[index];
      selectedTime = point.time;
      const x = String(plotStart + index * plotWidth / Math.max(1, points.length - 1));
      marker.setAttribute('x1', x);
      marker.setAttribute('x2', x);
      marker.setAttribute('visibility', 'visible');
      chartMessage.textContent = `${formatter.format(point.time)} UTC · Human ${format(point.human)} · Agent ${format(point.agent)}`;
    };
    scrubTrend = (position) => {
      let index: number;
      if (typeof position === 'number') {
        const bounds = svg.getBoundingClientRect();
        const x = (position - bounds.left) / bounds.width * svg.viewBox.baseVal.width;
        index = Math.round((x - plotStart) / plotWidth * (points.length - 1));
      } else {
        if (position === 'Escape') return select(-1);
        if (position === 'Home') index = 0;
        else if (position === 'End' || selected === -1) index = points.length - 1;
        else index = selected + (position === 'ArrowLeft' ? -1 : 1);
      }
      select(Math.max(0, Math.min(points.length - 1, index)));
    };
    svg.setAttribute('tabindex', '0');
    select(selected);
  }

  function render() {
    if (!data) return;
    let humans = 0, agents = 0;
    const pages = new Map<string, { human: number; agent: number }>();
    const bots = new Map<string, number>();
    for (const row of data.totals) {
      const kind = agent(row.path) ? 'agent' : 'human';
      if (kind === 'agent') { agents += row.reads; if (row.agent && row.agent !== 'Unknown') bots.set(row.agent, (bots.get(row.agent) || 0) + row.reads); } else humans += row.reads;
      const path = publicPagePath(normalized(row.path)); const item = pages.get(path) || { human: 0, agent: 0 }; item[kind] += row.reads; pages.set(path, item);
    }
    const total = humans + agents;
    element('all-reads').textContent = format(total); element('human-reads').textContent = format(humans); element('agent-reads').textContent = format(agents);
    element('human-share').style.width = `${total ? humans / total * 100 : 0}%`; element('agent-share').style.width = `${total ? agents / total * 100 : 0}%`;
    element('human-legend').textContent = `${format(humans)} · ${total ? Math.round(humans / total * 100) : 0}%`;
    element('agent-legend').textContent = `${format(agents)} · ${total ? Math.round(agents / total * 100) : 0}%`;
    element('analytics-status').textContent = `Updated ${new Date(data.updatedAt).toLocaleString()}`;
    const pageRows = element('page-rows'); pageRows.replaceChildren();
    for (const [path, value] of [...pages].sort((a, b) => b[1].human + b[1].agent - a[1].human - a[1].agent)) {
      const reads = value.human + value.agent; const row = make('div', 'analytics-page-row', '');
      const top = make('div', 'analytics-row-top', ''); top.append(make('span', '', `${label(path)}  ${path}`), make('span', '', `${format(reads)} · ${total ? (reads / total * 100).toFixed(1) : 0}%`));
      const bar = make('div', 'analytics-bar', ''); const h = make('span', 'analytics-bar-human', ''); const a = make('span', 'analytics-bar-agent', ''); h.style.width = `${total ? value.human / total * 100 : 0}%`; a.style.width = `${total ? value.agent / total * 100 : 0}%`; bar.append(h, a);
      row.append(top, bar, make('div', 'analytics-row-sub', `${format(value.human)} human · ${format(value.agent)} agent`)); pageRows.append(row);
    }
    if (!pages.size) pageRows.append(make('p', 'analytics-muted', 'No page reads recorded yet.'));
    const botRows = element('bot-rows'); botRows.replaceChildren();
    for (const [name, count] of [...bots].sort((a, b) => b[1] - a[1])) { const row = make('div', 'analytics-bot-row analytics-row-top', ''); row.append(make('span', '', name), make('span', '', format(count))); botRows.append(row); }
    if (!bots.size) botRows.append(make('p', 'analytics-muted', 'No named agent reads recorded yet.'));
    const weeks = new Map<number, { human: number; agent: number }>(); const cutoff = Date.now() - 30 * 86400000;
    for (const row of data.timeline) {
      const time = Date.parse(row.hour); if (time < cutoff || time > Date.now()) continue;
      const d = new Date(time); const day = (d.getUTCDay() + 6) % 7; const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
      const item = weeks.get(monday) || { human: 0, agent: 0 }; item[row.kind] += row.reads; weeks.set(monday, item);
    }
    const body = element('weekly-rows'); body.replaceChildren();
    const date = (time: number) => new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    for (const [time, value] of [...weeks].sort((a, b) => b[0] - a[0])) { const tr = document.createElement('tr'); for (const v of [`${date(Math.max(time, cutoff))} – ${date(Math.min(time + 6 * 86400000, Date.now()))}`, format(value.human + value.agent), format(value.human), format(value.agent)]) tr.append(make('td', '', v)); body.append(tr); }
    if (!weeks.size) { const tr = document.createElement('tr'); const td = make('td', '', 'No reads recorded in the last 30 days.'); td.setAttribute('colspan', '4'); tr.append(td); body.append(tr); }
    drawTrend();
  }
  root.querySelectorAll<HTMLButtonElement>('[data-period]').forEach((button) => button.addEventListener('click', () => { period = button.dataset.period!; selectedTime = undefined; root.querySelectorAll('[data-period]').forEach((b) => b.setAttribute('aria-pressed', String(b === button))); drawTrend(); }));
  async function refresh() {
    try {
      const response = await fetch('/api/analytics', { cache: 'no-store' });
      if (!response.ok) throw new Error('unavailable');
      const result = await response.json();
      if (!Array.isArray(result.totals) || !Array.isArray(result.timeline) || !Number.isFinite(Date.parse(result.updatedAt))) throw new Error('invalid data');
      data = result; render();
    } catch {
      element('analytics-status').textContent = data ? 'Analytics data could not be refreshed; showing the last successful update.' : 'Analytics data is not available yet.';
    } finally {
      delete root!.dataset.loading;
      root!.setAttribute('aria-busy', 'false');
      scrollPanels.forEach(updateScrollFade);
    }
  }
  root.setAttribute('aria-busy', 'true');
  element('analytics-status').textContent = 'Loading analytics…';
  refresh(); setInterval(refresh, 60000);
}
