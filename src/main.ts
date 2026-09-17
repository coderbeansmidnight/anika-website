// Site interactivity: theme toggle, project filtering, scroll-aware nav,
// copy-to-clipboard email, and a single orchestrated hero entrance.
// Compiled to assets/main.js — see README for the build step.

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
    toggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  }
}

function initTheme(): void {
  const stored = getStoredTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  const toggle = document.getElementById('theme-toggle');
  toggle?.addEventListener('click', () => {
    const current: Theme =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
}

function initProjectFilter(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-btn'));
  const projects = Array.from(document.querySelectorAll<HTMLElement>('.project'));
  if (buttons.length === 0 || projects.length === 0) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter ?? 'all';

      buttons.forEach((b) => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      projects.forEach((project) => {
        const tags = (project.dataset.tags ?? '').split(',');
        project.hidden = !(filter === 'all' || tags.includes(filter));
      });
    });
  });
}

function initScrollSpy(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav a'));
  if (sections.length === 0 || links.length === 0) return;

  const linkFor = (id: string): HTMLAnchorElement | undefined =>
    links.find((link) => link.getAttribute('href') === `#${id}`);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove('is-active'));
        linkFor(entry.target.id)?.classList.add('is-active');
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

function initCopyEmail(): void {
  const button = document.getElementById('copy-email');
  const email = button?.dataset.email;
  if (!button || !email) return;

  button.addEventListener('click', async () => {
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(email);
      button.textContent = 'Copied';
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    setTimeout(() => {
      button.textContent = original ?? 'Copy email';
    }, 1600);
  });
}

function initHeroEntrance(): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  hero.classList.add('hero-enter');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => hero.classList.add('hero-enter-active'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initProjectFilter();
  initScrollSpy();
  initCopyEmail();
  initHeroEntrance();
});
