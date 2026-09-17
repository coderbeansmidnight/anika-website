# Personal site

A single-page site: `index.html` + `assets/style.css`, with interactivity
written in TypeScript (`src/main.ts`) and compiled to plain JavaScript
(`assets/main.js`) — that's what GitHub Pages actually serves, since it can
only host static files.

The TypeScript adds: a light/dark theme toggle (remembers your choice), a
project filter by tech area, a nav bar that highlights the section you're
scrolled to, a click-to-copy email button, and one entrance animation on the
hero on load.

## 0. Install and build

```bash
npm install
npm run build     # compiles src/main.ts -> assets/main.js
```

Use `npm run watch` while editing `src/main.ts` to recompile automatically.
You don't strictly need to run this locally, though — the GitHub Actions
workflow below rebuilds it on every push, so committing `src/main.ts` is
enough even if you forget to build first.

## 1. Customize the content

Open `index.html` and replace:

- **Name** — in the `<title>`, the header wordmark, and the hero heading.
- **Hero headline & subhead** — the one-liner that describes what you do.
- **Links** — GitHub, email, LinkedIn (three places: hero, contact section, and
  the `href`s throughout).
- **About** — the two or three paragraphs in the `#about` section.
- **Projects** — each `<li class="project">` block. Three to five strong
  projects beats a long list of every repo you've made.
- **Resume** — drop your real PDF at `assets/resume.pdf` for the download
  link. But the main resume content on the page is now data-driven: open
  `src/main.ts` and edit the `RESUME_ENTRIES` array near the top. Each entry
  looks like:

  ```ts
  {
    category: 'work', // 'work' | 'education' | 'skills' | 'projects' | 'leadership' | 'awards'
    title: 'Software Engineer Intern',
    subtitle: 'Company Name',   // optional
    dates: 'Summer 2025',       // optional
    bullets: ['What you did.', 'What changed because of it.'],
  }
  ```

  Add as many entries as you want in any category — the tabs and accordion
  render straight from this list, so there's no HTML to touch. Remember to
  run `npm run build` after editing (or let the GitHub Action do it on push).

Colors and type live at the top of `assets/style.css` under `:root` (and
`:root[data-theme="dark"]` for the dark palette) if you want to adjust them.

The site uses `color-mix()`, a modern CSS function supported in all current
browsers (Chrome/Edge 111+, Safari 16.2+, Firefox 113+) — worth knowing if
you ever check it in a very old browser and a color looks slightly off.

## 2. Preview it locally

Just open `index.html` in a browser, or in VS Code use the "Live Server"
extension for auto-reload while you edit.

## 3. Put it on GitHub Pages

1. Create a new **public** repo on GitHub. If you want the site at
   `https://yourusername.github.io` (no extra path), name the repo exactly
   `yourusername.github.io`. Any other repo name works too — it'll just be
   served at `https://yourusername.github.io/repo-name/`.

2. From this folder, initialize git and push:

   ```bash
   cd personal-site
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/yourusername/yourusername.github.io.git
   git push -u origin main
   ```

3. On GitHub: go to the repo's **Settings → Pages**. Under "Build and
   deployment", set **Source** to **"GitHub Actions"** (not "Deploy from a
   branch" — the included workflow at `.github/workflows/deploy.yml` handles
   the build itself, since it needs to compile the TypeScript first).

4. Push to `main` (or re-run the workflow from the **Actions** tab). It will
   install dependencies, run `npm run build`, and publish the result —
   usually live within a minute or two at the URL shown on the Pages
   settings screen.

5. Any time you want to update the site, edit locally, then:

   ```bash
   git add .
   git commit -m "Update content"
   git push
   ```

   GitHub Pages redeploys automatically on every push to `main`.

## Notes

- This is a fully static site — there's no backend, so the "contact" section
  uses a plain `mailto:` link rather than a contact form. If you specifically
  want a working contact *form* (not just a mailto link), a free service like
  [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) lets
  you POST a form from a static site without writing any server code — sign
  up, and swap the mailto link for a `<form action="https://formspree.io/f/YOUR_ID" method="POST">`.
- Custom domain: if you own a domain, add a `CNAME` file with just the domain
  name in it, and point your DNS at GitHub's Pages IPs (documented in GitHub's
  Pages settings once you enter the domain there).
