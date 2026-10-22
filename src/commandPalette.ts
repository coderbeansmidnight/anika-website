// Command palette: Cmd/Ctrl+K (or the header button) opens a searchable list
// of sections, roles, and actions. Built on <dialog> for focus trapping and
// Esc-to-close; the input + listbox follow the ARIA combobox pattern.

import { LEADERSHIP, PROFILE, ROLES } from './data/resume';
import { focusRole, prefersReducedMotion } from './svg';
import { toggleTheme } from './theme';

interface Command {
  label: string;
  hint: string;
  keywords?: string;
  run: () => void;
}

function goTo(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  history.replaceState(null, '', `#${id}`);
}

function buildCommands(resumeUrl: string): Command[] {
  const sections: Array<[string, string]> = [
    ['top', 'Home'],
    ['about', 'About'],
    ['experience', 'Experience'],
    ['skills', 'Skills'],
    ['education', 'Education'],
    ['leadership', 'Leadership & awards'],
    ['playground', 'Guess the correlation'],
    ['contact', 'Contact'],
  ];
  return [
    ...sections.map(([id, label]) => ({ label, hint: 'Section', run: () => goTo(id) })),
    ...[...ROLES, ...LEADERSHIP].map((role) => ({
      label: role.title,
      hint: role.short,
      keywords: role.org,
      run: () => focusRole(role.id),
    })),
    {
      label: 'Copy email address',
      hint: 'Action',
      keywords: 'contact mail',
      run: () => {
        navigator.clipboard?.writeText(PROFILE.email).catch(() => undefined);
      },
    },
    { label: 'Send an email', hint: 'Action', keywords: 'contact mail', run: () => (window.location.href = `mailto:${PROFILE.email}`) },
    { label: 'Open resume PDF', hint: 'Action', keywords: 'cv download', run: () => window.open(resumeUrl, '_blank', 'noopener') },
    { label: 'Open LinkedIn', hint: 'Link', run: () => window.open(PROFILE.linkedin, '_blank', 'noopener') },
    { label: 'Open GitHub', hint: 'Link', keywords: 'code', run: () => window.open(PROFILE.github, '_blank', 'noopener') },
    { label: 'Toggle light / dark mode', hint: 'Action', keywords: 'theme', run: toggleTheme },
  ];
}

// Every query character must appear in order; earlier and tighter matches rank higher.
function score(query: string, command: Command): number {
  const haystack = `${command.label} ${command.hint} ${command.keywords ?? ''}`.toLowerCase();
  if (!query) return 1;
  const direct = haystack.indexOf(query);
  if (direct !== -1) return 1000 - direct;
  let pos = -1;
  let gaps = 0;
  for (const ch of query) {
    const next = haystack.indexOf(ch, pos + 1);
    if (next === -1) return 0;
    gaps += next - pos - 1;
    pos = next;
  }
  return 500 - gaps;
}

export function initCommandPalette(): void {
  const dialog = document.getElementById('cmdk') as HTMLDialogElement | null;
  const input = document.getElementById('cmdk-input') as HTMLInputElement | null;
  const list = document.getElementById('cmdk-list');
  const status = document.getElementById('cmdk-status');
  const openers = document.querySelectorAll<HTMLElement>('[data-cmdk-open]');
  const resumeLink = document.querySelector<HTMLAnchorElement>('a[href$="resume.pdf"]');
  if (!dialog || !input || !list || typeof dialog.showModal !== 'function') return;

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  document.querySelectorAll('.kbd-mod').forEach((el) => (el.textContent = isMac ? '⌘' : 'Ctrl'));
  openers.forEach((el) => el.removeAttribute('hidden'));

  const commands = buildCommands(resumeLink?.href ?? 'assets/resume.pdf');
  let results: Command[] = commands;
  let active = 0;

  function renderList(): void {
    const query = input!.value.trim().toLowerCase();
    results = commands
      .map((c) => ({ c, s: score(query, c) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.c);
    if (!query) results = commands;
    active = 0;

    list!.replaceChildren();
    results.forEach((command, i) => {
      const li = document.createElement('li');
      li.id = `cmdk-opt-${i}`;
      li.setAttribute('role', 'option');
      li.className = 'cmdk-item';
      const label = document.createElement('span');
      label.textContent = command.label;
      const hint = document.createElement('span');
      hint.className = 'cmdk-hint';
      hint.textContent = command.hint;
      li.append(label, hint);
      li.addEventListener('pointermove', () => setActive(i));
      li.addEventListener('click', () => run(i));
      list!.appendChild(li);
    });
    if (status) status.textContent = results.length ? `${results.length} results` : 'No results';
    setActive(0);
  }

  function setActive(i: number): void {
    if (results.length === 0) {
      input!.removeAttribute('aria-activedescendant');
      return;
    }
    active = (i + results.length) % results.length;
    list!.querySelectorAll('.cmdk-item').forEach((el, j) => el.setAttribute('aria-selected', String(j === active)));
    const current = document.getElementById(`cmdk-opt-${active}`);
    input!.setAttribute('aria-activedescendant', `cmdk-opt-${active}`);
    current?.scrollIntoView({ block: 'nearest' });
  }

  function run(i: number): void {
    const command = results[i];
    if (!command) return;
    dialog!.close();
    // Let the dialog close (and focus return) before scrolling or moving focus.
    window.requestAnimationFrame(() => command.run());
  }

  function open(): void {
    if (dialog!.open) return;
    input!.value = '';
    renderList();
    dialog!.showModal();
    input!.focus();
  }

  input.addEventListener('input', renderList);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(active + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(active - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(active);
    }
  });

  // Click on the backdrop (outside the panel) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  openers.forEach((el) => el.addEventListener('click', open));

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    }
  });
}
