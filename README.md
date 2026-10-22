# Personal site

Hi! I'm Anika. It's nice to meet you!

Feel free to look around my website and reach out about anything :)

Live at https://coderbeansmidnight.github.io/anika-website/

## Editing content

All resume content lives in **`src/data/resume.ts`**: roles, education, skills,
awards, and the about text. The page, timeline, and skills chart are generated
from it, so that's the only file to touch for content changes.

To replace the downloadable PDF, swap `public/assets/resume.pdf` (keep the filename).

## Running locally

Needs Node 20.19+ (or 22).

```bash
npm install        # once
npm run dev        # live preview at http://localhost:5173/anika-website/
npm run build      # type-check + production build into dist/
npm run preview    # serve the built dist/ locally
```

## Deploying

Push or merge to `main`. The GitHub Actions workflow in
`.github/workflows/deploy.yml` runs `npm ci && npm run build` and publishes
`dist/` to GitHub Pages. `dist/` and `node_modules/` aren't committed.

## Layout

```
index.html            page skeleton; <!--@section--> placeholders get filled from resume.ts
src/data/resume.ts    ← content
src/render.ts         turns resume.ts into HTML at build time
src/main.ts           client-side entry (interactivity)
src/styles/           CSS (colors and fonts are tokens at the top of main.css)
public/assets/        files copied as-is (resume.pdf, favicon)
```
