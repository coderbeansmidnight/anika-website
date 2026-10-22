// Skills network: skills (left, grouped by category) linked to the roles
// where a resume bullet shows them in use (right). Hover, focus, or tap a
// node to trace its links; the readout quotes the bullet as evidence.
// The list inside <details id="skills-list"> is the text alternative.

import { LEADERSHIP, ROLES, SKILLS, SKILL_GROUPS, type Role, type Skill, type SkillGroup } from './data/resume';
import { SITE_LABEL, evidenceFor } from './render';
import { focusRole, onWidthChange, svg, text } from './svg';

interface RoleNode {
  id: string;
  label: string;
  kind: Role['kind'] | 'site';
}

const ROLE_LOOKUP = new Map([...ROLES, ...LEADERSHIP].map((r) => [r.id, r]));

// Only roles that at least one skill links to, in resume order, then the site.
const ROLE_NODES: RoleNode[] = [
  ...[...ROLES, ...LEADERSHIP]
    .filter((r) => SKILLS.some((s) => s.usedIn.includes(r.id)))
    .map((r) => ({ id: r.id, label: r.short, kind: r.kind })),
  ...(SKILLS.some((s) => s.usedIn.includes('site')) ? [{ id: 'site', label: SITE_LABEL, kind: 'site' as const }] : []),
];

type Selection = { type: 'skill'; name: string } | { type: 'role'; id: string } | null;

export function initSkills(): void {
  const container = document.getElementById('skills-chart');
  const readout = document.getElementById('skills-readout');
  const filters = document.getElementById('skills-filters');
  const list = document.getElementById('skills-list') as HTMLDetailsElement | null;
  if (!container || !readout || !filters) return;

  // The chart is up, so the text list can start collapsed.
  if (list) list.open = false;

  const defaultReadout = readout.innerHTML;
  let activeGroup: SkillGroup | 'all' = 'all';
  let pinned: Selection = null;
  let width = 0;

  // --- Filters --------------------------------------------------------------

  const groups: Array<SkillGroup | 'all'> = ['all', ...(Object.keys(SKILL_GROUPS) as SkillGroup[])];
  for (const group of groups) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-btn';
    button.dataset.group = group;
    button.setAttribute('aria-pressed', String(group === 'all'));
    button.textContent = group === 'all' ? 'All' : SKILL_GROUPS[group];
    button.addEventListener('click', () => {
      activeGroup = group;
      pinned = null;
      filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      showReadout(null);
      render(width);
    });
    filters.appendChild(button);
  }

  // --- Readout --------------------------------------------------------------

  function showReadout(sel: Selection): void {
    readout!.classList.toggle('has-selection', sel !== null);
    if (!sel) {
      readout!.innerHTML = defaultReadout;
      return;
    }
    readout!.replaceChildren();
    const title = document.createElement('p');
    title.className = 'readout-title';
    const meta = document.createElement('p');
    meta.className = 'readout-meta';

    if (sel.type === 'skill') {
      const skill = SKILLS.find((s) => s.name === sel.name)!;
      title.textContent = skill.name;
      meta.textContent = SKILL_GROUPS[skill.group];
      readout!.append(title, meta);
      const evidence = evidenceFor(skill);
      if (evidence.length === 0) {
        const p = document.createElement('p');
        p.className = 'readout-body';
        p.textContent = 'Listed in the skills section of my resume.';
        readout!.append(p);
      }
      for (const item of evidence) {
        const p = document.createElement('p');
        p.className = 'readout-body';
        const where = document.createElement('strong');
        where.textContent = item.label;
        p.append(where);
        if (item.quote) {
          const q = document.createElement('q');
          q.textContent = item.quote;
          p.append(document.createElement('br'), q);
        }
        readout!.append(p);
      }
    } else {
      const node = ROLE_NODES.find((r) => r.id === sel.id)!;
      const role = ROLE_LOOKUP.get(sel.id);
      title.textContent = role ? role.title : node.label;
      meta.textContent = role ? role.org : 'Personal project';
      const p = document.createElement('p');
      p.className = 'readout-body';
      p.textContent = `Skills: ${SKILLS.filter((s) => s.usedIn.includes(sel.id)).map((s) => s.name).join(', ')}`;
      readout!.append(title, meta, p);
      if (role) {
        const jump = document.createElement('button');
        jump.type = 'button';
        jump.className = 'readout-link';
        jump.textContent = 'See role ↑';
        jump.addEventListener('click', () => focusRole(role.id));
        readout!.append(jump);
      }
    }
  }

  // --- Chart ----------------------------------------------------------------

  function render(w: number): void {
    width = w;
    container!.replaceChildren();
    const narrow = w < 560;
    const fontClass = narrow ? 'is-narrow' : '';
    const headH = 30;
    const rowH = narrow ? 24 : 26;
    const visibleGroups = (Object.keys(SKILL_GROUPS) as SkillGroup[]).filter(
      (g) => activeGroup === 'all' || g === activeGroup
    );

    // Measure label widths so the node columns sit just past the longest label.
    const probe = svg('svg', { class: `skills-svg sk-probe ${fontClass}`, width: 0, height: 0 }, container!);
    const measure = (label: string, cls: string) => text(probe, label, { class: cls }).getComputedTextLength();
    const leftW = Math.max(...SKILLS.map((s) => measure(s.name, 'sk-label'))) + 6;
    const rightW = Math.max(...ROLE_NODES.map((r) => measure(r.label, 'sk-role-label'))) + 6;
    probe.remove();

    const skillX = leftW + 10;
    const roleX = w - rightW - 12;
    // Too narrow for links between two label columns: draw a skills × roles dot matrix instead.
    const matrix = roleX - skillX < 140;
    const colW = Math.min(36, (w - skillX - 24) / ROLE_NODES.length);
    const colX = (i: number) => skillX + 24 + colW * (i + 0.5);
    const top = matrix ? Math.ceil(rightW * 0.72) + 18 : 0;

    // Lay out the left column: group headings, then skill rows.
    type Row = { kind: 'head'; group: SkillGroup; y: number } | { kind: 'skill'; skill: Skill; y: number };
    const rows: Row[] = [];
    let y = top + 8;
    for (const group of visibleGroups) {
      rows.push({ kind: 'head', group, y: y + headH / 2 + 4 });
      y += headH;
      for (const skill of SKILLS.filter((s) => s.group === group)) {
        rows.push({ kind: 'skill', skill, y: y + rowH / 2 });
        y += rowH;
      }
      y += 6;
    }
    const height = Math.max(y, ROLE_NODES.length * 44 + 16);

    const root = svg('svg', {
      width: w,
      height,
      viewBox: `0 0 ${w} ${height}`,
      class: `skills-svg ${fontClass}${matrix ? ' is-matrix' : ''}`,
      role: 'group',
      'aria-label': 'Skills linked to the roles where I used them. Select a skill or role to see the evidence.',
    }, container!);

    const linkLayer = svg('g', { class: 'sk-links' }, root);
    const nodeLayer = svg('g', {}, root);

    const roleYs = new Map<string, number>();
    // Right column: role nodes in a compact, vertically centered stack.
    const gap = Math.min(64, (height - 40) / Math.max(1, ROLE_NODES.length - 1));
    const stackTop = (height - gap * (ROLE_NODES.length - 1)) / 2;
    ROLE_NODES.forEach((node, i) => roleYs.set(node.id, stackTop + gap * i));

    const links: Array<{ path: SVGElement; skill: string; role: string }> = [];
    const skillNodes = new Map<string, SVGGElement>();
    const roleNodes = new Map<string, SVGGElement>();

    function makeInteractive(g: SVGGElement, sel: Exclude<Selection, null>, label: string): void {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', label);
      const same = (a: Selection) =>
        a !== null && a.type === sel.type && (a.type === 'skill' ? a.name === (sel as { name: string }).name : a.id === (sel as { id: string }).id);
      g.addEventListener('pointerenter', () => highlight(sel));
      g.addEventListener('focus', () => highlight(sel));
      g.addEventListener('pointerleave', () => highlight(pinned));
      g.addEventListener('blur', () => highlight(pinned));
      const toggle = () => {
        pinned = same(pinned) ? null : sel;
        highlight(pinned ?? sel);
      };
      g.addEventListener('click', toggle);
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    }

    for (const row of rows) {
      if (row.kind === 'head') {
        text(nodeLayer, SKILL_GROUPS[row.group].toUpperCase(), {
          x: skillX + 5,
          y: row.y,
          class: 'sk-head',
          'text-anchor': 'end',
        });
        continue;
      }
      const { skill } = row;
      const used = skill.usedIn.length > 0;
      const g = svg('g', { class: `sk-node${used ? '' : ' is-unlinked'}` }, nodeLayer);
      svg('rect', { x: 0, y: row.y - rowH / 2, width: matrix ? w : skillX + 12, height: rowH, class: 'sk-hit' }, g);
      text(g, skill.name, { x: skillX - 12, y: row.y, class: 'sk-label', 'text-anchor': 'end', 'dominant-baseline': 'central' });
      svg('circle', { cx: skillX, cy: row.y, r: 5, class: 'sk-dot' }, g);
      const where = evidenceFor(skill).map((e) => e.label);
      makeInteractive(g, { type: 'skill', name: skill.name },
        `${skill.name}. ${where.length ? `Used in ${where.join(', ')}` : 'Listed on resume'}.`);
      skillNodes.set(skill.name, g);

      if (matrix) {
        ROLE_NODES.forEach((node, i) => {
          const linked = skill.usedIn.includes(node.id);
          const cell = svg('circle', {
            cx: colX(i),
            cy: row.y,
            r: linked ? 5.5 : 1.5,
            class: linked ? 'sk-cell' : 'sk-cell-empty',
            'data-kind': node.kind,
          }, g);
          if (linked) links.push({ path: cell, skill: skill.name, role: node.id });
        });
        continue;
      }

      for (const roleId of skill.usedIn) {
        const ry = roleYs.get(roleId)!;
        const mid = (skillX + roleX) / 2;
        const path = svg('path', {
          d: `M${skillX + 6},${row.y} C${mid},${row.y} ${mid},${ry} ${roleX - 7},${ry}`,
          class: 'sk-link',
        }, linkLayer);
        links.push({ path, skill: skill.name, role: roleId });
      }
    }

    ROLE_NODES.forEach((node, i) => {
      const g = svg('g', { class: 'sk-role', 'data-kind': node.kind }, nodeLayer);
      if (matrix) {
        // Column header: angled label above a colored dot.
        const cx = colX(i);
        svg('rect', { x: cx - colW / 2, y: 0, width: colW, height: top, class: 'sk-hit' }, g);
        svg('circle', { cx, cy: top - 6, r: 4.5, class: 'sk-role-dot' }, g);
        text(g, node.label, {
          x: cx,
          y: top - 16,
          class: 'sk-role-label',
          transform: `rotate(-50 ${cx} ${top - 16})`,
        });
      } else {
        const ry = roleYs.get(node.id)!;
        svg('rect', { x: roleX - 14, y: ry - 16, width: w - roleX + 14, height: 32, class: 'sk-hit' }, g);
        svg('circle', { cx: roleX, cy: ry, r: 6.5, class: 'sk-role-dot' }, g);
        text(g, node.label, { x: roleX + 13, y: ry, class: 'sk-role-label', 'dominant-baseline': 'central' });
      }
      const count = SKILLS.filter((s) => s.usedIn.includes(node.id)).length;
      makeInteractive(g, { type: 'role', id: node.id }, `${node.label}. ${count} linked skills.`);
      roleNodes.set(node.id, g);
    });

    function highlight(sel: Selection): void {
      root.classList.toggle('has-focus', sel !== null);
      const litSkills = new Set<string>();
      const litRoles = new Set<string>();
      for (const link of links) {
        const on =
          sel !== null &&
          ((sel.type === 'skill' && link.skill === sel.name) || (sel.type === 'role' && link.role === sel.id));
        link.path.classList.toggle('is-lit', on);
        if (on) {
          litSkills.add(link.skill);
          litRoles.add(link.role);
        }
      }
      if (sel?.type === 'skill') litSkills.add(sel.name);
      if (sel?.type === 'role') litRoles.add(sel.id);
      skillNodes.forEach((g, name) => g.classList.toggle('is-lit', litSkills.has(name)));
      roleNodes.forEach((g, id) => g.classList.toggle('is-lit', litRoles.has(id)));
      showReadout(sel);
    }

    highlight(pinned);
  }

  onWidthChange(container, render);
  // Label widths are measured, so lay out again once the web fonts arrive.
  document.fonts?.ready.then(() => {
    if (width) render(width);
  });
}
