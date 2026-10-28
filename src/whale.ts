// Decorative dot-particle whale (plus a few tiny fish) at the bottom of the
// page. Points drift as noise and gather into shape as the band scrolls into
// view (and scatter again on the way back up). The pointer pushes dots aside;
// a click or tap splashes them apart. Purely decorative: the canvas is
// aria-hidden, pauses offscreen, and draws a still scene under
// prefers-reduced-motion.

import { prefersReducedMotion } from './svg';

// Humpback-style silhouette, head left, in a 400 × 150 box: rounded head,
// long belly, narrow tail stock, notched flukes.
const WHALE = {
  w: 400,
  h: 150,
  body:
    'M8 62 C14 46 40 34 80 30 C130 25 190 28 240 38 C262 42 280 46 296 52 ' +
    'C318 59 336 64 352 66 C362 58 372 44 386 36 C392 33 398 35 396 41 ' +
    'C392 52 382 62 372 70 C384 76 394 88 397 99 C398 105 392 106 386 102 ' +
    'C372 94 362 84 352 78 C330 82 300 86 268 92 C220 104 160 112 110 110 ' +
    'C70 108 34 96 16 80 C10 74 7 68 8 62 Z',
  extras: [
    // Long pectoral fin (a humpback's signature)
    'M96 100 C108 118 130 136 160 144 C166 145 168 141 164 138 C146 126 130 112 124 102 Z',
    // Small hooked dorsal fin
    'M268 44 C276 36 284 31 292 30 C290 36 290 42 294 50 Z',
  ],
  // Thin gaps carved out of the dot cloud: mouth line and throat pleats
  grooves: [
    'M10 68 C30 72 55 75 80 72',
    'M24 80 C55 92 95 99 135 100',
    'M40 90 C70 99 100 104 140 106',
  ],
  eye: { x: 86, y: 64, r: 3 },
};

// Tiny fish, head left, in a 40 × 20 box.
const FISH = {
  w: 40,
  h: 20,
  body: 'M3 10 C7 3 19 2 27 8 L37 2 L35 10 L37 18 L27 12 C19 18 7 17 3 10 Z',
  extras: [] as string[],
  grooves: [] as string[],
  eye: { x: 9, y: 9, r: 1.3 },
};

type Shape = typeof WHALE;

interface Particle {
  // -1 for the whale, otherwise the index of the fish it belongs to
  owner: number;
  // Home position in shape-box units (centered), with depth
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

interface Fish {
  // Home spot as a fraction of the band, plus swim parameters
  ax: number;
  ay: number;
  amp: number;
  speed: number;
  phase: number;
  size: number;
}

function sampleShape(shape: Shape, count: number, owner: number): Particle[] {
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return [];
  const body = new Path2D(shape.body);
  const extras = shape.extras.map((d) => new Path2D(d));
  const grooves = shape.grooves.map((d) => new Path2D(d));
  probe.lineWidth = 2.6;
  const carved = (x: number, y: number) =>
    grooves.some((g) => probe.isPointInStroke(g, x, y)) ||
    Math.hypot(x - shape.eye.x, y - shape.eye.y) < shape.eye.r;
  const inside = (x: number, y: number) =>
    (probe.isPointInPath(body, x, y) || extras.some((e) => probe.isPointInPath(e, x, y))) && !carved(x, y);

  // Vertical extent of the body per column, so points can wrap around a
  // rounded cross-section instead of sitting on a flat cut-out.
  const step = shape.w > 100 ? 2 : 0.5;
  const top = new Map<number, number>();
  const bottom = new Map<number, number>();
  for (let x = 0; x <= shape.w; x++) {
    for (let y = 0; y <= shape.h; y += step) {
      if (!probe.isPointInPath(body, x, y)) continue;
      if (!top.has(x)) top.set(x, y);
      bottom.set(x, y);
    }
  }

  const points: Particle[] = [];
  let guard = 0;
  while (points.length < count && guard++ < count * 60) {
    const x = Math.random() * shape.w;
    const y = Math.random() * shape.h;
    if (!inside(x, y)) continue;
    const col = Math.round(x);
    let z = (Math.random() - 0.5) * shape.h * 0.04; // fins are thin
    const lo = top.get(col);
    const hi = bottom.get(col);
    if (lo !== undefined && hi !== undefined && y >= lo && y <= hi) {
      const mid = (lo + hi) / 2;
      const half = Math.max(0.5, (hi - lo) / 2);
      const t = Math.min(1, Math.abs(y - mid) / half);
      // Mostly on the surface (shell), a few inside, like a point cloud scan.
      const depth = Math.sqrt(1 - t * t) * half * 0.9 * (Math.random() < 0.8 ? 1 : Math.random());
      z = (Math.random() < 0.5 ? -1 : 1) * depth;
    }
    points.push({
      owner,
      hx: x - shape.w / 2,
      hy: y - shape.h / 2,
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

// A small school, loosely grouped in the bottom-right corner.
function makeSchool(count: number): Fish[] {
  const spots = [
    [0.84, 0.8], [0.9, 0.88], [0.78, 0.9], [0.92, 0.75], [0.86, 0.95],
  ];
  return spots.slice(0, count).map(([ax, ay], i) => ({
    ax,
    ay,
    amp: 0.015 + Math.random() * 0.015,
    speed: 0.35 + Math.random() * 0.25,
    phase: i * 1.7 + Math.random(),
    size: 0.85 + Math.random() * 0.35,
  }));
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
  const school = makeSchool(narrow ? 4 : 5);
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

  // 0 when the band is just entering from below, 1 once most of it is in view.
  function scrollProgress(): number {
    const rect = band!.getBoundingClientRect();
    return clamp01((window.innerHeight - rect.top) / (rect.height * 0.85));
  }

  function draw(time: number): void {
    const t = time / 1000;
    ctx!.clearRect(0, 0, width, height);
    ctx!.fillStyle = color;

    // Whale size and placement: a little left of center to leave the
    // bottom-right corner for the fish.
    const scale = Math.min((width * (narrow ? 0.9 : 0.74)) / WHALE.w, (height * 0.86) / WHALE.h);
    const cx = width * 0.46 + (reduced ? 0 : Math.sin(t * 0.15) * width * 0.03);
    const cy = height * 0.46 + (reduced ? 0 : Math.sin(t * 0.6) * 4);
    const yaw = reduced ? -0.25 : -0.25 + Math.sin(t * 0.25) * 0.35;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const focal = 600;

    // Fish placement for this frame: drift side to side, turning at each end
    const fishScale = scale * 0.6;
    const fishPos = school.map((f) => {
      const swim = reduced ? 0 : t * f.speed + f.phase;
      return {
        x: (f.ax + Math.sin(swim) * f.amp) * width,
        y: f.ay * height + (reduced ? 0 : Math.sin(swim * 2.3) * 2),
        // Heading: cos(swim) > 0 means moving right, so mirror the left-facing fish
        turn: reduced ? 1 : -Math.cos(swim),
        tail: reduced ? 0 : t * 6 + f.phase,
        s: fishScale * f.size,
      };
    });

    // Formation: scroll-driven, dipping briefly after a splash
    let form = reduced ? 1 : scrollProgress();
    const since = t - splashAt;
    if (since < 2.4) form *= since < 0.5 ? 1 - ease(since / 0.5) : ease((since - 0.5) / 1.9);

    for (const p of particles) {
      let wx: number;
      let wy: number;
      let near: number;

      if (p.owner === -1) {
        // Swim: a travelling wave that grows toward the tail
        const along = (p.hx + WHALE.w / 2) / WHALE.w;
        const wave = reduced ? 0 : Math.sin(along * 5 - t * 2.2) * 9 * along * along;
        const y3 = p.hy + wave;
        // Rotate around the vertical axis, then perspective-project
        const rx = p.hx * cosY + p.hz * sinY;
        const rz = -p.hx * sinY + p.hz * cosY;
        const persp = focal / (focal + rz * scale * 0.6);
        wx = cx + rx * scale * persp;
        wy = cy + y3 * scale * persp;
        near = clamp01(0.5 - rz / (WHALE.h * 1.2));
      } else {
        const f = fishPos[p.owner];
        const along = (p.hx + FISH.w / 2) / FISH.w;
        const wag = Math.sin(f.tail) * 2.2 * along * along;
        // Squash x through the turn so it reads as the fish rotating around
        const turn = Math.sign(f.turn) * Math.max(0.15, Math.abs(f.turn));
        wx = f.x + p.hx * f.s * turn + p.hz * f.s * 0.3;
        wy = f.y + (p.hy + wag) * f.s;
        near = clamp01(0.5 - p.hz / FISH.h);
      }

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
      const depthMix = k * near;
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
    if (particles.length === 0) {
      particles = sampleShape(WHALE, narrow ? 1500 : 2600, -1);
      school.forEach((_, i) => particles.push(...sampleShape(FISH, 110, i)));
    }
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
