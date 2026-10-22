import { defineConfig, type Plugin } from 'vite';
import { sections, tokens, escapeHtml } from './src/render.ts';

// Fills index.html from src/data/resume.ts at build time:
//   <!--@experience-->  → the HTML from sections.experience()
//   {{email}}           → the escaped value from tokens.email
function resumeContent(): Plugin {
  return {
    name: 'resume-content',
    transformIndexHtml(html) {
      return html
        .replace(/<!--@(\w+)-->/g, (match, key: string) => (sections[key] ? sections[key]() : match))
        .replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
          key in tokens ? escapeHtml(tokens[key]) : match
        );
    },
  };
}

// The site is served from https://coderbeansmidnight.github.io/anika-website/,
// so every built asset URL needs that prefix.
export default defineConfig({
  base: '/anika-website/',
  plugins: [resumeContent()],
  build: {
    target: 'es2020',
  },
});
