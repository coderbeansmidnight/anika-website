// Build-time HTML for the content sections. vite.config.ts swaps each
// `<!--@name-->` placeholder in index.html for the matching function's output,
// so all resume content is in the static page (fast, crawlable, works without JS).

import {
  AWARDS,
  COURSEWORK,
  EDUCATION,
  LEADERSHIP,
  PROFILE,
  ROLES,
  SKILLS,
  SKILL_GROUPS,
  SPOKEN_LANGUAGES,
  type Role,
  type SkillGroup,
} from './data/resume.ts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatMonth(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

function dateRange(role: Role): string {
  const end = role.end
    ? `<time datetime="${role.end}">${formatMonth(role.end)}</time>`
    : 'Present';
  return `<time datetime="${role.start}">${formatMonth(role.start)}</time> – ${end}`;
}

const KIND_LABEL: Record<Role['kind'], string> = {
  research: 'Research',
  industry: 'Industry',
  teaching: 'Teaching',
  leadership: 'Leadership',
};

function roleCard(role: Role): string {
  return `
    <article class="role" id="role-${role.id}" data-kind="${role.kind}" tabindex="-1">
      <div class="role-meta">
        <p class="role-dates">${dateRange(role)}</p>
        <p class="chip" data-kind="${role.kind}">${KIND_LABEL[role.kind]}${role.end ? '' : ' · now'}</p>
      </div>
      <div class="role-body">
        <h3 class="role-title">${escapeHtml(role.title)}</h3>
        ${role.org ? `<p class="role-org">${escapeHtml(role.org)}</p>` : ''}
        <ul class="role-bullets">
          ${role.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
      </div>
    </article>`;
}

export const sections: Record<string, () => string> = {
  tagline: () => escapeHtml(PROFILE.tagline),

  about: () => PROFILE.about.map((p) => `<p>${escapeHtml(p)}</p>`).join(''),

  glance: () => {
    const current = ROLES.filter((r) => r.end === null);
    const past = ROLES.filter((r) => r.end !== null && r.kind === 'industry');
    const school = EDUCATION[0];
    return `
      <dl class="glance-list">
        <div><dt>Now</dt>${current
          .map((r) => `<dd><a href="#role-${r.id}">${escapeHtml(r.title)}</a><span>${escapeHtml(r.org)}</span></dd>`)
          .join('')}</div>
        <div><dt>Before</dt>${past
          .map((r) => `<dd><a href="#role-${r.id}">${escapeHtml(r.title)}</a><span>${escapeHtml(r.org)}</span></dd>`)
          .join('')}</div>
        <div><dt>Studying</dt><dd><a href="#education">${escapeHtml(school.degree)}</a><span>${escapeHtml(school.school)} · ${escapeHtml(school.date)}</span></dd></div>
      </dl>`;
  },

  experience: () => ROLES.map(roleCard).join(''),

  leadership: () => LEADERSHIP.map(roleCard).join(''),

  skills: () =>
    (Object.keys(SKILL_GROUPS) as SkillGroup[])
      .map(
        (group) => `
        <div class="skill-group" data-group="${group}">
          <h3>${SKILL_GROUPS[group]}</h3>
          <ul>
            ${SKILLS.filter((s) => s.group === group)
              .map((s) => `<li class="skill-chip" data-group="${group}">${escapeHtml(s.name)}</li>`)
              .join('')}
          </ul>
        </div>`
      )
      .join('') +
    `<p class="skills-extra"><strong>Languages:</strong> ${escapeHtml(SPOKEN_LANGUAGES)}</p>`,

  education: () =>
    EDUCATION.map(
      (e) => `
      <div class="school">
        <h3>${escapeHtml(e.school)}</h3>
        <p class="school-degree">${escapeHtml(e.degree)}${e.detail ? ` · ${escapeHtml(e.detail)}` : ''}</p>
        <p class="school-date">${escapeHtml(e.date)}</p>
      </div>`
    ).join('') +
    `<div class="coursework"><h3>Relevant coursework</h3><ul>${COURSEWORK.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>`,

  awards: () => AWARDS.map((a) => `<li>${escapeHtml(a)}</li>`).join(''),

};

// `{{key}}` tokens (usable inside attributes) for the contact links.
export const tokens: Record<string, string> = {
  name: PROFILE.name,
  email: PROFILE.email,
  github: PROFILE.github,
  linkedin: PROFILE.linkedin,
};
