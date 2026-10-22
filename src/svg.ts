// Small helpers shared by the hand-built SVG charts.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  parent?.appendChild(node);
  return node;
}

export function text(parent: Element, content: string, attrs: Record<string, string | number> = {}): SVGTextElement {
  const node = svg('text', attrs, parent);
  node.textContent = content;
  return node;
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Re-render a chart whenever its container's width changes.
export function onWidthChange(container: HTMLElement, render: (width: number) => void): void {
  let last = -1;
  const observer = new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    if (width === last || width === 0) return;
    last = width;
    render(width);
  });
  observer.observe(container);
}

// Scroll a role card into view and flash its highlight.
export function focusRole(id: string): void {
  const card = document.getElementById(`role-${id}`);
  if (!card) return;
  card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  card.focus({ preventScroll: true });
  card.classList.remove('is-highlighted');
  void card.offsetWidth; // restart the CSS animation
  card.classList.add('is-highlighted');
  window.setTimeout(() => card.classList.remove('is-highlighted'), 2200);
}
