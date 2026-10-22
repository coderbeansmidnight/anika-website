// "Guess the correlation": draws a random scatterplot with a hidden Pearson r,
// the visitor guesses with a slider, then the real value and fit line appear.
// Everything is generated client-side; nothing is stored or sent anywhere.

import { onWidthChange, svg, text } from './svg';

const N = 60;

interface Round {
  xs: number[];
  ys: number[];
  r: number;
  revealed: boolean;
}

// Standard normal via Box–Muller.
function gaussian(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

function newRound(): Round {
  // Target r uniform in [-0.95, 0.95]; the sample r is what we score against.
  const target = Math.random() * 1.9 - 0.95;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < N; i++) {
    const x = gaussian();
    xs.push(x);
    ys.push(target * x + Math.sqrt(1 - target * target) * gaussian());
  }
  return { xs, ys, r: pearson(xs, ys), revealed: false };
}

const fmt = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);

export function initCorrelation(): void {
  const chart = document.getElementById('corr-chart');
  const slider = document.getElementById('corr-guess') as HTMLInputElement | null;
  const guessOut = document.getElementById('corr-guess-value');
  const checkBtn = document.getElementById('corr-check') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('corr-next') as HTMLButtonElement | null;
  const result = document.getElementById('corr-result');
  const scoreEl = document.getElementById('corr-score');
  if (!chart || !slider || !guessOut || !checkBtn || !nextBtn || !result || !scoreEl) return;

  let round = newRound();
  const errors: number[] = [];
  let width = 0;

  function render(w: number): void {
    width = w;
    chart!.replaceChildren();
    const size = Math.min(w, 420);
    const pad = 14;
    const all = [...round.xs, ...round.ys].map(Math.abs);
    const extent = Math.max(2.5, ...all) * 1.05;
    const sx = (v: number) => pad + ((v + extent) / (2 * extent)) * (size - 2 * pad);
    const sy = (v: number) => size - pad - ((v + extent) / (2 * extent)) * (size - 2 * pad);

    const root = svg('svg', {
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      class: 'corr-svg',
      role: 'img',
      'aria-label': round.revealed
        ? `Scatter plot of ${N} points. Correlation r = ${round.r.toFixed(2)}.`
        : `Scatter plot of ${N} points. The correlation is hidden until you guess.`,
    }, chart!);

    svg('rect', { x: 0.5, y: 0.5, width: size - 1, height: size - 1, rx: 12, class: 'corr-frame' }, root);
    const clip = svg('clipPath', { id: 'corr-clip' }, svg('defs', {}, root));
    svg('rect', { x: 1, y: 1, width: size - 2, height: size - 2, rx: 12 }, clip);
    svg('line', { x1: sx(0), x2: sx(0), y1: pad, y2: size - pad, class: 'corr-axis' }, root);
    svg('line', { x1: pad, x2: size - pad, y1: sy(0), y2: sy(0), class: 'corr-axis' }, root);

    round.xs.forEach((x, i) => {
      svg('circle', { cx: sx(x), cy: sy(round.ys[i]), r: 4.5, class: 'corr-dot' }, root);
    });

    if (round.revealed) {
      // Least-squares fit line, clipped to the frame.
      const n = round.xs.length;
      const mx = round.xs.reduce((a, b) => a + b, 0) / n;
      const my = round.ys.reduce((a, b) => a + b, 0) / n;
      let sxy = 0;
      let sxx = 0;
      for (let i = 0; i < n; i++) {
        sxy += (round.xs[i] - mx) * (round.ys[i] - my);
        sxx += (round.xs[i] - mx) ** 2;
      }
      const slope = sxy / sxx;
      const lo = -extent;
      const hi = extent;
      svg('line', {
        x1: sx(lo), y1: sy(my + slope * (lo - mx)),
        x2: sx(hi), y2: sy(my + slope * (hi - mx)),
        class: 'corr-fit',
        'clip-path': 'url(#corr-clip)',
      }, root);
      text(root, `r = ${round.r.toFixed(2)}`, { x: size - pad - 4, y: pad + 18, class: 'corr-label', 'text-anchor': 'end' });
    }
  }

  function updateGuess(): void {
    guessOut!.textContent = fmt(Number(slider!.value));
  }

  function check(): void {
    if (round.revealed) return;
    round.revealed = true;
    const guess = Number(slider!.value);
    const err = Math.abs(guess - round.r);
    errors.push(err);
    const verdict =
      err < 0.05 ? 'Spot on. Are you secretly a regression?' :
      err < 0.1 ? 'Very close!' :
      err < 0.2 ? 'Not bad.' :
      'Tricky one.';
    result!.textContent = `Actual r = ${fmt(round.r)}. You guessed ${fmt(guess)} (off by ${err.toFixed(2)}). ${verdict}`;
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    scoreEl!.textContent = `${errors.length} ${errors.length === 1 ? 'round' : 'rounds'} · mean error ${mean.toFixed(2)}`;
    checkBtn!.disabled = true;
    nextBtn!.hidden = false;
    nextBtn!.focus();
    render(width);
  }

  function next(): void {
    round = newRound();
    result!.textContent = '';
    checkBtn!.disabled = false;
    nextBtn!.hidden = true;
    slider!.value = '0';
    updateGuess();
    slider!.focus();
    render(width);
  }

  slider.addEventListener('input', updateGuess);
  checkBtn.addEventListener('click', check);
  nextBtn.addEventListener('click', next);
  updateGuess();
  onWidthChange(chart, render);
}
