// Site interactivity for Anika's personal site.
// Compiled to assets/main.js — see README for the build step.

// ---------------------------------------------------------------------------
// Resume data — edit this array to add, remove, or reorder resume entries.
// Nothing else in this file needs to change; the tabs and accordion below
// render straight from this list.
// ---------------------------------------------------------------------------

type Category = 'work' | 'education' | 'research' | 'skills' | 'projects' | 'leadership' | 'awards';

interface ResumeEntry {
  category: Category;
  title: string;
  subtitle?: string;
  dates?: string;
  bullets: string[];
}

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  work: { label: 'Work Experience', color: 'var(--blue)' },
  education: { label: 'Education', color: 'var(--green)' },
  research: { label: 'Research', color: 'var(--red)' },
  skills: { label: 'Skills', color: 'var(--purple)' },
  projects: { label: 'Projects', color: 'var(--pink)' },
  leadership: { label: 'Leadership & Volunteering', color: 'var(--teal)' },
  awards: { label: 'Awards & Certifications', color: 'var(--violet)' },
};

const CATEGORY_ORDER: Category[] = ['work', 'education', 'skills', 'projects', 'leadership', 'awards'];

const RESUME_ENTRIES: ResumeEntry[] = [
  // --- Work Experience ---------------------------------------------------
  {
    category: 'work',
    title: 'Systems Engineering Intern',
    subtitle: 'Lockheed Martin',
    dates: 'May 2025 to August 2026',
    bullets: [
      'Developed scripts to reduce metrics processing time by 90%, saving hours of work for Systems Engineers',
      'Developed visualizations to model requirements data using Python and Pandas',
      'Researched project management processes and presented findings to 15+ stakeholders, including Chief Engineer',
      'Assisted Systems Engineer spec authors in crafting multi-functional requirements in DOORS Next Gen',
    ],
  },
  {
        category: 'work',
        title: 'Project Intern',
        subtitle: 'Stanford Research Institute',
        dates: 'February 2026 to May 2026',
        bullets: [
            'Collaborated internationally with a team of 10 from SJSU, SRI, and Technische Hochschule Ingolstadt',
            'Developed a grammar formalizer enabling domain experts to work with AI models via OpenAI tokens',
            'Designed a Human-in-the-Loop validator to ensure grammar change outputs matched desired outcomes',
            'Containerized and version-controlled project components using Docker and GitLab',
        ],
    },
  // Copy the block above and paste it here for each job/internship.

  // --- Education -----------------------------------------------------
  {
    category: 'education',
    title: 'B.A. in Data Science',
    subtitle: 'U.C. Berkeley',
    dates: 'Expected May 2028',
    bullets: [
      'Currently taking NewSpace Decal working on a project with US Space Force to explore scientific autonomy of AI systems.',
    ],
  },
  // --- Research -----------------------------------------------------
  {
    category: 'research',
    title: 'Student Researcher',
    subtitle: 'Space Sciences Laboratory',
    dates: 'Sept 2026 to Present',
    bullets: [
      'Assisting with analysis of data from NASA Carruthers mission',
    ],
  },

  // --- Skills --------------------------------------------------------
  {
    category: 'skills',
    title: 'Technical & Tools',
    bullets: [
      'Python, Java, JavaScript, MySQL, REST APIs, HTML, CSS, Git, GitLab, Docker, Pandas, Tableau, Figma, Confluence',
    ],
  },
  {
    category: 'skills',
    title: 'Language',
    bullets: [
      'English (fluent), French (bilingual)',
    ],
  },
  // Add another entry with a different title (e.g. "Frameworks", "Lab Techniques")
  // if you want skills grouped into more than one card.

  // --- Projects --------------------------------------------------------
  {
    category: 'projects',
    title: 'FinishInFour',
    dates: 'Spring 2026',
    bullets: [
      'Led development of a database-driven course planning tool in Java, JavaScript, CSS, HTML, and JSP',
      'Translated academic policies into structured data models and logical workflows',
    ],
  },
  // Copy the block above and paste it here for each project.

  // --- Leadership & Volunteering -----------------------------------------
  {
    category: 'leadership',
    title: 'Resident Advisor',
    subtitle: 'San Jose State, Residential Housing Association',
    dates: 'August 2025 to May 2026',
    bullets: [
      'Coordinated programs for 60+ residents and served 24-hour duty shifts responding to emergencies',
    ],
  },
  // Copy the block above and paste it here for each role.

  // --- Awards & Certifications --------------------------------------------
  {
    category: 'awards',
    title: 'Rising Spartan Award',
    dates: 'May 2026',
    bullets: [
      'Selected from a team of 40 for exceptional care and dedication as a Resident Advisor',
    ],
  },
  // Copy the block above and paste it here for each award/certification.
];

// ---------------------------------------------------------------------------
// Resume: render tabs + accordion from the data above
// ---------------------------------------------------------------------------

function renderResume(): void {
  const tabList = document.getElementById('resume-tabs');
  const panel = document.getElementById('resume-panel');
  if (!tabList || !panel) return;

  // Capture panel in a non-nullable variable for closures
  const resumePanel = panel;

  const usedCategories = CATEGORY_ORDER.filter((cat) =>
    RESUME_ENTRIES.some((entry) => entry.category === cat)
  );

  tabList.innerHTML = usedCategories
    .map((cat, i) => {
      const meta = CATEGORY_META[cat];
      return `<button class="resume-tab${i === 0 ? ' is-active' : ''}" type="button"
        data-category="${cat}" style="--tab-color:${meta.color}"
        aria-pressed="${i === 0}">${meta.label}</button>`;
    })
    .join('');

  function renderPanel(category: Category): void {
    const entries = RESUME_ENTRIES.filter((entry) => entry.category === category);
    const meta = CATEGORY_META[category];

    resumePanel.style.setProperty('--tab-color', meta.color);
    resumePanel.innerHTML = entries
      .map((entry, i) => {
        const sub = [entry.subtitle, entry.dates].filter(Boolean).join(' · ');
        return `
          <div class="resume-entry">
            <button class="resume-entry-head" type="button" aria-expanded="${i === 0}">
              <span class="resume-entry-title">
                <strong>${entry.title}</strong>
                ${sub ? `<span class="resume-entry-sub">${sub}</span>` : ''}
              </span>
              <span class="resume-entry-icon" aria-hidden="true">+</span>
            </button>
            <div class="resume-entry-body" ${i === 0 ? '' : 'hidden'}>
              <ul>${entry.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
            </div>
          </div>`;
      })
      .join('');

    Array.from(resumePanel.querySelectorAll<HTMLButtonElement>('.resume-entry-head')).forEach(
      (head) => {
        head.addEventListener('click', () => {
          const body = head.nextElementSibling as HTMLElement;
          const expanded = head.getAttribute('aria-expanded') === 'true';
          head.setAttribute('aria-expanded', String(!expanded));
          body.hidden = expanded;
        });
      }
    );
  }

  renderPanel(usedCategories[0]);

  Array.from(tabList.querySelectorAll<HTMLButtonElement>('.resume-tab')).forEach((tab) => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category as Category;
      Array.from(tabList.querySelectorAll<HTMLButtonElement>('.resume-tab')).forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-pressed', String(t === tab));
      });
      renderPanel(category);
    });
  });
}

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem('theme');
  return stored === 'light' || stored === 'dark' ? stored : null;
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function initTheme(): void {
  const stored = getStoredTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored ?? (prefersDark ? 'dark' : 'light'));

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current: Theme =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
}

// ---------------------------------------------------------------------------
// Scroll-spy: highlight nav link + shift its underline to the section's color
// ---------------------------------------------------------------------------

function initScrollSpy(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav a'));
  if (sections.length === 0 || links.length === 0) return;

  const linkFor = (id: string) => links.find((link) => link.getAttribute('href') === `#${id}`);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const accent = (entry.target as HTMLElement).dataset.accent;
        links.forEach((link) => link.classList.remove('is-active'));
        const link = linkFor(entry.target.id);
        link?.classList.add('is-active');
        if (accent) document.documentElement.style.setProperty('--nav-accent', accent);
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

// ---------------------------------------------------------------------------
// Scroll reveal: fade + rise each section once, as it enters the viewport
// ---------------------------------------------------------------------------

function initScrollReveal(): void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (targets.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

// ---------------------------------------------------------------------------
// Copy email
// ---------------------------------------------------------------------------

function initCopyEmail(): void {
  const button = document.getElementById('copy-email');
  const email = button?.dataset.email;
  if (!button || !email) return;

  button.addEventListener('click', async () => {
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(email);
      button.textContent = 'Copied!';
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    setTimeout(() => {
      button.textContent = original ?? 'Copy email';
    }, 1600);
  });
}

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const inits: Array<[string, () => void]> = [
    ['theme', initTheme],
    ['scroll spy', initScrollSpy],
    ['scroll reveal', initScrollReveal],
    ['copy email', initCopyEmail],
    ['resume', renderResume],
  ];

  for (const [name, fn] of inits) {
    try {
      fn();
    } catch (err) {
      console.error(`Failed to initialize ${name}:`, err);
    }
  }
});