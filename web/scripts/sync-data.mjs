/**
 * What: Copy data/app (written by the pipeline, stage 4) to web/public/data, which the site serves.
 * Roadmap stage: 5 — Interface (docs/DECISOES.md D10).
 * Inputs: ../data/app/sites.json and ../data/app/sites/*.json.
 * Outputs: public/data/ (replaced on every run; git-ignored; never edit the copy).
 * NASA data source: none directly (copies files produced from JPL Horizons and PGDA products).
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../data/app');
const target = resolve(here, '../public/data');

if (!existsSync(resolve(source, 'sites.json'))) {
  console.error(`sync-data: ${source}/sites.json not found. Run the pipeline (stage 4) first.`);
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
cpSync(source, target, {
  recursive: true,
  filter: (path) => !path.endsWith('.md'),
});
console.log(`sync-data: copied ${source} -> ${target}`);
