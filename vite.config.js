import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// every .html at the root is a page: the home page and one per game. Relative paths, so the site works under any folder
const root = import.meta.dirname;
export default defineConfig({
  base: './',
  build: { rollupOptions: { input: readdirSync(root).filter(f => f.endsWith('.html')).map(f => resolve(root, f)) } }
});
