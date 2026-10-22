// Career timeline: a Gantt-style chart of every role (experience + leadership),
// showing how they overlap. Hover/focus a bar for details; click to jump to
// the full role card below. The role cards are the text alternative.

import { LEADERSHIP, ROLES, type Role } from './data/resume';
import { formatMonth } from './render';
import { focusRole, onWidthChange, svg, text } from './svg';

const ALL_ROLES: Role[] = [...ROLES, ...LEADERSHIP].sort((a, b) => b.start.localeCompare(a.start));

const KIND_LABEL: Record<Role['kind'], string> = {
  research: 'Research',
  industry: 'Industry',
  teaching: 'Teaching',
  leadership: 'Leadership',
};

// Months since year 0, so date math is plain subtraction.
const monthIndex = (ym: string): number => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
};

const now = new Date();
const NOW = now.getFullYear() * 12 + now.getMonth() + now.getDate() / 31;
const endIndex = (role: Role): number => (role.end ? monthIndex(role.end) + 1 : NOW);

const fromIndex = (i: number): string => {
  const y = Math.floor(i / 12);
  return `${y}-${String((i % 12) + 1).padStart(2, '0')}`;
};

const rangeLabel = (role: Role): string =>
  `${formatMonth(role.start)} – ${role.end ? formatMonth(role.end) : 'Present'}`;

// Busiest stretch: the most roles held in the same month, and when.
export function peakOverlap(): { count: number; from: string; to: string } {
  const first = Math.min(...ALL_ROLES.map((r) => monthIndex(r.start)));
  const last = Math.floor(NOW);
  let best = { count: 0, from: first, to: first };
  let runStart = -1;
  for (let m = first; m <= last; m++) {
    const count = ALL_ROLES.filter((r) => monthIndex(r.start) <= m && m < endIndex(r)).length;
    if (count > best.count) {
      best = { count, from: m, to: m };
      runStart = m;
    } else if (count === best.count && runStart !== -1 && best.to === m - 1) {
      best.to = m;
    }
  }
  return { count: best.count, from: formatMonth(fromIndex(best.from)), to: formatMonth(fromIndex(best.to)) };
}

export function initTimeline(): void {
  const container = document.getElementById('timeline-chart');
  const readout = document.getElementById('timeline-readout');
  const stat = document.getElementById('timeline-stat');
  if (!container || !readout) return;

  if (stat) {
    const peak = peakOverlap();
    stat.textContent = `Up to ${peak.count} roles at once, ${peak.from}${peak.to !== peak.from ? ` – ${peak.to}` : ''}`;
  }

  const defaultReadout = readout.innerHTML;
  let pinned: string | null = null;

  function showRole(role: Role | null): void {
    if (!role) {
      readout!.innerHTML = defaultReadout;
      return;
    }
    readout!.replaceChildren();
    const title = document.createElement('p');
    title.className = 'readout-title';
    title.textContent = role.title;
    const meta = document.createElement('p');
    meta.className = 'readout-meta';
    meta.textContent = [role.org, rangeLabel(role)].filter(Boolean).join(' · ');
    const first = document.createElement('p');
    first.className = 'readout-body';
    first.textContent = role.bullets[0];
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.className = 'readout-link';
    jump.textContent = role.bullets.length > 1 ? `All ${role.bullets.length} details ↓` : 'Details ↓';
    jump.addEventListener('click', () => focusRole(role.id));
    readout!.append(title, meta, first, jump);
  }

  function render(width: number): void {
    container!.replaceChildren();
    const narrow = width < 560;
    // Phones: each label sits above its bar so bars get the full width.
    const labelW = narrow ? 0 : 196;
    const padR = narrow ? 8 : 18;
    const top = 30;
    const rowH = narrow ? 46 : 38;
    const barH = narrow ? 14 : 18;
    const barY = (y: number) => (narrow ? y + 24 : y + (rowH - barH) / 2);
    const height = top + ALL_ROLES.length * rowH + 30;

    const start = Math.min(...ALL_ROLES.map((r) => monthIndex(r.start))) - 1;
    const end = NOW + 1;
    const x = (i: number) => labelW + ((i - start) / (end - start)) * (width - labelW - padR);

    const root = svg('svg', {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: 'group',
      'aria-label': 'Career timeline. Each bar is a role; activate one to read its details.',
      class: 'timeline-svg',
    }, container!);

    // Year gridlines + labels
    const axisY = top + ALL_ROLES.length * rowH + 6;
    for (let m = Math.ceil(start / 12) * 12; m < end; m += 12) {
      const gx = x(m);
      svg('line', { x1: gx, x2: gx, y1: top - 6, y2: axisY, class: 'tl-grid' }, root);
      text(root, String(m / 12), { x: gx, y: axisY + 16, class: 'tl-axis', 'text-anchor': 'middle' });
    }

    // "Now" marker
    const nowX = x(NOW);
    svg('line', { x1: nowX, x2: nowX, y1: top - 10, y2: axisY, class: 'tl-now' }, root);
    text(root, 'Now', { x: nowX, y: top - 14, class: 'tl-now-label', 'text-anchor': 'middle' });

    ALL_ROLES.forEach((role, i) => {
      const y = top + i * rowH;
      const x0 = x(monthIndex(role.start));
      const x1 = x(endIndex(role));

      const link = svg('a', {
        href: `#role-${role.id}`,
        class: 'tl-row',
        'data-kind': role.kind,
        'data-role': role.id,
        'aria-label': `${role.title}${role.org ? `, ${role.org}` : ''}. ${KIND_LABEL[role.kind]}, ${rangeLabel(role)}.`,
      }, root);

      // Full-row hit target, bigger than the bar itself
      svg('rect', { x: 0, y, width, height: rowH, class: 'tl-hit' }, link);
      text(link, role.short, { x: 0, y: narrow ? y + 12 : y + rowH / 2, class: 'tl-label', 'dominant-baseline': 'central' });
      svg('rect', {
        x: x0,
        y: barY(y),
        width: Math.max(4, x1 - x0 - 2),
        height: barH,
        rx: 4,
        class: 'tl-bar',
      }, link);
      if (!role.end) {
        svg('circle', { cx: x1 - 2, cy: barY(y) + barH / 2, r: 4, class: 'tl-pulse' }, link);
      }

      const activate = () => showRole(role);
      link.addEventListener('pointerenter', activate);
      link.addEventListener('focus', activate);
      link.addEventListener('pointerleave', () => showRole(pinned ? ALL_ROLES.find((r) => r.id === pinned)! : null));
      link.addEventListener('click', (event) => {
        event.preventDefault();
        pinned = role.id;
        showRole(role);
        // Touch: first tap shows details; the readout's button jumps to the card.
        if ((event as PointerEvent).pointerType !== 'touch') focusRole(role.id);
      });
    });
  }

  onWidthChange(container, render);
}
