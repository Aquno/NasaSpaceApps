import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSiteData, parseSites, parseTerrain } from './validate';

// The real exported files (data/app) must pass the validator.
const APP = resolve(import.meta.dirname, '../../../data/app');
const read = (p: string): unknown => JSON.parse(readFileSync(resolve(APP, p), 'utf-8'));

describe('real data/app files', () => {
  it('sites.json is valid', () => {
    const r = parseSites(read('sites.json'));
    expect(r.ok ? [] : r.errors).toEqual([]);
  });
  for (const f of readdirSync(resolve(APP, 'sites'))) {
    it(`sites/${f} is valid with 8760 records and 360 horizon values`, () => {
      const id = f.replace('.json', '');
      const r = parseSiteData(read(`sites/${f}`), `sites/${f}`, id);
      expect(r.ok ? [] : r.errors).toEqual([]);
      if (r.ok) {
        expect(r.value.meta.count).toBe(8760);
        expect(r.value.horizon.length).toBe(360);
        expect(r.value.meta.sample).toBe(false);
      }
    });
  }
});

describe('terrain', () => {
  it('terrain.json + terrain.bin are valid', () => {
    const bin = readFileSync(resolve(APP, 'terrain.bin'));
    const buf = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
    const r = parseTerrain(read('terrain.json'), buf);
    expect(r.ok ? [] : r.errors).toEqual([]);
    if (r.ok) expect(r.value.heights.length).toBe(512 * 512);
  });
  it('wrong binary size is reported', () => {
    const r = parseTerrain(read('terrain.json'), new ArrayBuffer(10));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain('terrain.bin: 10 bytes');
  });
});

describe('errors name file and field', () => {
  const good = read('sites/haworth.json') as Record<string, unknown>;
  it('short horizon', () => {
    const bad = { ...good, horizon: (good['horizon'] as number[]).slice(1) };
    const r = parseSiteData(bad, 'sites/haworth.json');
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.errors.join()).toContain("sites/haworth.json: field 'horizon' has 359 values");
  });
  it('missing meta field', () => {
    const meta = { ...(good['meta'] as Record<string, unknown>) };
    delete meta['sample'];
    const r = parseSiteData({ ...good, meta }, 'x.json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toContain("x.json: meta: field 'sample' must be a boolean");
  });
  it('bad site entry', () => {
    const sites = read('sites.json') as Record<string, unknown>[];
    const r = parseSites([{ ...sites[0], lat: 'x' }]);
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.errors.join()).toContain("sites.json[0]: field 'lat' must be a finite number");
  });
});
