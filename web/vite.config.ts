/**
 * Vite configuration.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * BASE_PATH sets the public base for GitHub Pages (e.g. BASE_PATH=/NasaSpaceApps/ npm run build);
 * the default "/" serves from the root. Data files are read under `${BASE_URL}data/`.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
