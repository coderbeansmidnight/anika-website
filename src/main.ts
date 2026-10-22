// Entry point: wires up the page's interactive pieces.

import './styles/main.css';
import './styles/viz.css';
import { initCommandPalette } from './commandPalette';
import { initCorrelation } from './correlation';
import { initSkills } from './skills';
import { initTheme } from './theme';
import { initTimeline } from './timeline';

// ---------------------------------------------------------------------------
// Header: border once the page scrolls; nav highlight for the current section
// ---------------------------------------------------------------------------

function initHeader(): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav a'));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  document.querySelectorAll('main section[id]').forEach((s) => observer.observe(s));
}

// ---------------------------------------------------------------------------
// Scroll reveal: fade + rise each section once as it enters the viewport
// ---------------------------------------------------------------------------

function initReveal(): void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('main > .section, #resume > .section'));
  // Skip on deep links (#skills etc.): the browser jumps there after this runs,
  // and the target shouldn't fade in from blank.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08 }
  );
  for (const el of targets) {
    // Anything already on screen at load stays visible (no flash).
    if (el.getBoundingClientRect().top < window.innerHeight) continue;
    el.classList.add('reveal');
    observer.observe(el);
  }
}

// ---------------------------------------------------------------------------
// Copy email
// ---------------------------------------------------------------------------

function initCopyEmail(): void {
  const button = document.getElementById('copy-email');
  const status = document.querySelector<HTMLElement>('.copy-status');
  const email = button?.dataset.email;
  if (!button || !email) return;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      if (status) status.textContent = 'Copied to clipboard';
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    window.setTimeout(() => {
      if (status) status.textContent = '';
    }, 2000);
  });
}

const inits: Array<[string, () => void]> = [
  ['theme', initTheme],
  ['header', initHeader],
  ['reveal', initReveal],
  ['copy email', initCopyEmail],
  ['timeline', initTimeline],
  ['skills', initSkills],
  ['correlation', initCorrelation],
  ['command palette', initCommandPalette],
];

for (const [name, fn] of inits) {
  try {
    fn();
  } catch (err) {
    console.error(`Failed to initialize ${name}:`, err);
  }
}
