/**
 * Vite configuration.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * BASE_PATH sets the public base path: "/" (default) for the root of a domain, or a subfolder such as
 * BASE_PATH=/lunar-navigator/ npm run build (see web/README.md, D47). Data files are read under `${BASE_URL}data/`.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
