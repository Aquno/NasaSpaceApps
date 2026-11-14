/**
 * What: Real screenshots of the built site (opening: first screen, "How it works" and the end of
 *   the page; mission panel) at 1920x1080 and 1366x768, in English and Portuguese, saved to
 *   web/docs/screenshots/. Drives a headless Chrome through the DevTools protocol (Node's built-in
 *   WebSocket and fetch; no extra dependency).
 * Roadmap stage: 5 — Interface / 7 — Delivery (see docs/ROTEIRO.md).
 * Inputs: a running server (npm run build && npx vite preview --port 4173), optional base URL as
 *   the first argument; CHROME env var for the browser path.
 * Outputs: PNG files <page>-<width>x<height>-<lang>.png (pages listed in SHOTS; env ONLY=a,b
 *   captures a subset).
 *
 * Usage: npm run screenshots -- [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const OUT = resolve(import.meta.dirname, '../docs/screenshots');
const SIZES: [number, number][] = [
  [1920, 1080],
  [1366, 768],
];
const LANGS = ['en', 'pt-BR'];
/** Time for data, three.js and the entrance motion to settle (ms). */
const SETTLE_MS = 7000;
const SCROLL_SETTLE_MS = 1800;

/** Pages to capture: route (hash) and optional script run before the capture. */
const SHOTS: { name: string; route: string; js?: string }[] = [
  { name: 'opening-top', route: '/' },
  { name: 'opening-how', route: '/', js: `document.getElementById('how').scrollIntoView()` },
  { name: 'opening-end', route: '/', js: 'window.scrollTo(0, document.body.scrollHeight)' },
  { name: 'mission', route: '/mission' },
  {
    name: 'small-move',
    route: '/mission',
    js: `(() => { const d = document.getElementById('small-move'); d.open = true; d.scrollIntoView(); })()`,
  },
  {
    name: 'nasa-check',
    route: '/mission',
    js: `(() => { const d = document.getElementById('nasa-check'); d.open = true; d.scrollIntoView(); })()`,
  },
  { name: 'site-detail', route: '/site/shackleton-rim' },
  {
    name: 'site-detail-more',
    route: '/site/shackleton-rim',
    js: `(() => { const d = document.querySelector('.section-details'); d.open = true; window.scrollTo(0, document.body.scrollHeight); })()`,
  },
  { name: 'roadmap', route: '/roadmap' },
];
/** Optional comma-separated subset of shot names (env ONLY). */
const ONLY = process.env.ONLY?.split(',');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pageSocketUrl(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    try {
      const list = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as {
        type: string;
        webSocketDebuggerUrl: string;
      }[];
      const page = list.find((p) => p.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome not ready yet.
    }
    await sleep(200);
  }
  throw new Error('Chrome DevTools endpoint did not start');
}

function connect(url: string) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map<number, (v: unknown) => void>();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data)) as { id?: number; result?: unknown; error?: unknown };
    if (msg.id !== undefined && pending.has(msg.id)) {
      if (msg.error) console.error(msg.error);
      pending.get(msg.id)?.(msg.result);
      pending.delete(msg.id);
    }
  });
  const ready = new Promise((r) => ws.addEventListener('open', r));
  const send = async <T>(method: string, params: object = {}): Promise<T> => {
    await ready;
    const n = ++id;
    ws.send(JSON.stringify({ id: n, method, params }));
    return new Promise((r) => pending.set(n, r as (v: unknown) => void));
  };
  return { send, close: () => ws.close() };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'lsn-shots-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    'about:blank',
  ]);
  try {
    const cdp = connect(await pageSocketUrl());
    await cdp.send('Page.enable');
    const shot = async (name: string) => {
      const { data } = await cdp.send<{ data: string }>('Page.captureScreenshot', {
        format: 'png',
      });
      const file = join(OUT, `${name}.png`);
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(file);
    };
    const scroll = async (js: string) => {
      await cdp.send('Runtime.evaluate', { expression: js });
      await sleep(SCROLL_SETTLE_MS);
    };
    for (const [width, height] of SIZES) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      for (const lang of LANGS) {
        const tag = `${width}x${height}-${lang}`;
        for (const shotDef of SHOTS) {
          if (ONLY && !ONLY.includes(shotDef.name)) continue;
          // A different query string forces a fresh page load for every shot.
          await cdp.send('Page.navigate', {
            url: `${BASE}?lang=${lang}&shot=${shotDef.name}#${shotDef.route}`,
          });
          await sleep(SETTLE_MS);
          if (shotDef.js) await scroll(shotDef.js);
          await shot(`${shotDef.name}-${tag}`);
        }
      }
    }
    cdp.close();
  } finally {
    chrome.kill();
  }
}

await main();
