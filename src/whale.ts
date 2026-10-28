// Decorative dot-particle whale at the bottom of the page. Points drift as
// noise and gather into a swimming whale as the band scrolls into view (and
// scatter again on the way back up). The pointer pushes dots aside; a click
// or tap splashes them apart. Purely decorative: the canvas is aria-hidden,
// pauses offscreen, and draws one still whale under prefers-reduced-motion.

import { prefersReducedMotion } from './svg';

// Whale silhouette, head left, in a 400 × 150 box.
const BODY =
  'M10 72 C10 50 40 38 90 36 C150 33 210 38 260 50 C290 57 315 64 335 70 ' +
  'L370 45 C380 40 395 42 398 48 C385 56 375 66 368 76 ' +
  'C378 86 392 96 396 104 C388 108 372 104 360 92 ' +
  'C330 84 300 88 260 94 C210 104 150 110 95 106 C50 103 15 90 10 72 Z';
const FIN = 'M120 100 C130 120 150 135 175 140 C168 128 158 112 150 102 Z';
const DORSAL = 'M240 46 C248 36 256 32 262 32 C262 40 262 46 266 52 Z';
const BOX_W = 400;
const BOX_H = 150;

interface Particle {
  // Home position on the whale (box units, centered), with depth
  hx: number;
  hy: number;
  hz: number;
  // Scatter position (0..1 of the band) and drift phase
  sx: number;
  sy: number;
  phase: number;
  delay: number;
  // Current pointer push, in pixels
  px: number;
  py: number;
}

function sampleWhale(count: number): Particle[] {
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return [];
  const body = new Path2D(BODY);
  const fin = new Path2D(FIN);
  const dorsal = new Path2D(DORSAL);
  const inside = (x: number, y: number) =>
    probe.isPointInPath(body, x, y) || probe.isPointInPath(fin, x, y) || probe.isPointInPath(dorsal, x, y);

  // Vertical extent of the body per column, so points can wrap around a
  // rounded cross-section instead of sitting on a flat cut-out.
  const top: number[] = [];
  const bottom: number[] = [];
  for (let x = 0; x <= BOX_W; x++) {
    let lo = -1;
    let hi = -1;
    for (let y = 0; y <= BOX_H; y += 2) {
      if (probe.isPointInPath(body, x, y)) {
        if (lo === -1) lo = y;
        hi = y;
      }
    }
    top.push(lo);
    bottom.push(hi);
  }

  const points: Particle[] = [];
  let guard = 0;
  while (points.length < count && guard++ < count * 40) {
    const x = Math.random() * BOX_W;
    const y = Math.random() * BOX_H;
    if (!inside(x, y)) continue;
    const col = Math.round(x);
    let z = (Math.random() - 0.5) * 6; // fins are thin
    if (top[col] !== -1 && y >= top[col] && y <= bottom[col]) {
      const mid = (top[col] + bottom[col]) / 2;
      const half = Math.max(1, (bottom[col] - top[col]) / 2);
      const t = Math.min(1, Math.abs(y - mid) / half);
      // Mostly on the surface (shell), a few inside, like a point cloud scan.
      const depth = Math.sqrt(1 - t * t) * half * 0.9 * (Math.random() < 0.8 ? 1 : Math.random());
      z = (Math.random() < 0.5 ? -1 : 1) * depth;
    }
    points.push({
      hx: x - BOX_W / 2,
      hy: y - BOX_H / 2,
      hz: z,
      sx: Math.random(),
      sy: Math.random(),
      phase: Math.random() * Math.PI * 2,
      delay: Math.random(),
      px: 0,
      py: 0,
    });
  }
  return points;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => t * t * (3 - 2 * t);

export function initWhale(): void {
  const canvas = document.getElementById('whale') as HTMLCanvasElement | null;
  const band = canvas?.parentElement;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !band || !ctx) return;

  const reduced = prefersReducedMotion();
  const narrow = window.innerWidth < 640;
  // Sampled lazily, the first time the band nears the viewport.
  let particles: Particle[] = [];

  let width = 0;
  let height = 0;
  let color = '';
  let visible = false;
  let raf = 0;
  let splashAt = -Infinity;
  const pointer = { x: -9999, y: -9999 };

  function readColor(): void {
    color = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1C1B19';
  }

  function resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = band!.clientWidth;
    height = band!.clientHeight;
    canvas!.width = Math.round(width * dpr);
    canvas!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 0 when the band is just entering from below, 1 once it's well in view.
  function scrollProgress(): number {
    const rect = band!.getBoundingClientRect();
    const vh = window.innerHeight;
    return clamp01((vh - rect.top) / (rect.height * 0.9 + vh * 0.25));
  }

  function draw(time: number): void {
    const t = time / 1000;
    ctx!.clearRect(0, 0, width, height);
    ctx!.fillStyle = color;

    // Whale size and placement within the band
    const scale = Math.min((width * (width < 640 ? 0.86 : 0.62)) / BOX_W, (height * 0.78) / BOX_H);
    const cx = width / 2 + (reduced ? 0 : Math.sin(t * 0.15) * width * 0.04);
    const cy = height / 2 + (reduced ? 0 : Math.sin(t * 0.6) * 4);
    const yaw = reduced ? -0.25 : -0.25 + Math.sin(t * 0.25) * 0.35;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const focal = 600;

    // Formation: scroll-driven, dipping briefly after a splash
    let form = reduced ? 1 : scrollProgress();
    const since = t - splashAt;
    if (since < 2.4) form *= since < 0.5 ? 1 - ease(since / 0.5) : ease((since - 0.5) / 1.9);

    for (const p of particles) {
      // Swim: a travelling wave that grows toward the tail
      const along = (p.hx + BOX_W / 2) / BOX_W;
      const wave = reduced ? 0 : Math.sin(along * 5 - t * 2.2) * 9 * along * along;
      const x3 = p.hx;
      const y3 = p.hy + wave;
      const z3 = p.hz;

      // Rotate around the vertical axis, then perspective-project
      const rx = x3 * cosY + z3 * sinY;
      const rz = -x3 * sinY + z3 * cosY;
      const persp = focal / (focal + rz * scale * 0.6);
      const wx = cx + rx * scale * persp;
      const wy = cy + y3 * scale * persp;

      // Scatter: drifting noise across the whole band
      const sx = p.sx * width + Math.sin(t * 0.3 + p.phase) * 18;
      const sy = p.sy * height + Math.cos(t * 0.25 + p.phase * 1.3) * 12;

      const k = ease(clamp01(form * 1.6 - p.delay * 0.6));
      let x = sx + (wx - sx) * k;
      let y = sy + (wy - sy) * k;

      // Pointer pushes nearby dots aside, then they relax back
      if (!reduced) {
        const dx = x + p.px - pointer.x;
        const dy = y + p.py - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 3600) {
          const d = Math.sqrt(d2) || 1;
          const push = (1 - d / 60) * 3;
          p.px += (dx / d) * push;
          p.py += (dy / d) * push;
        }
        p.px *= 0.92;
        p.py *= 0.92;
        x += p.px;
        y += p.py;
      }

      // Nearer points are larger and stronger, like the reference point cloud
      const depthMix = k * clamp01(0.5 - rz / (BOX_H * 1.2));
      ctx!.globalAlpha = 0.18 + 0.5 * depthMix + 0.12 * (1 - k);
      const size = 1 + 0.9 * depthMix;
      ctx!.fillRect(x, y, size, size);
    }
    ctx!.globalAlpha = 1;
  }

  function loop(time: number): void {
    draw(time);
    raf = visible ? requestAnimationFrame(loop) : 0;
  }

  function start(): void {
    if (!visible) return;
    if (particles.length === 0) particles = sampleWhale(narrow ? 1100 : 2000);
    if (reduced) {
      draw(0);
      return;
    }
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
  }

  readColor();
  resize();

  new ResizeObserver(() => {
    resize();
    if (reduced && particles.length) draw(0);
  }).observe(band);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }, { rootMargin: '200px 0px' }).observe(band);

  document.addEventListener('visibilitychange', start);
  document.addEventListener('themechange', () => {
    readColor();
    if (reduced && particles.length) draw(0);
  });

  if (!reduced) {
    band.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    });
    band.addEventListener('pointerleave', () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });
    band.addEventListener('click', () => {
      splashAt = performance.now() / 1000;
    });
  }
}
