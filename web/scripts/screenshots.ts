/**
 * What: Real screenshots of the built site (opening: first screen, "How it works" and the end of
 *   the page; mission panel) at 1920x1080 and 1366x768, in English and Portuguese, saved to
 *   web/docs/screenshots/. Drives a headless Chrome through the DevTools protocol (Node's built-in
 *   WebSocket and fetch; no extra dependency).
 * Roadmap stage: 5 — Interface / 7 — Delivery (see docs/ROTEIRO.md).
 * Inputs: a running server (npm run build && npx vite preview --port 4173), optional base URL as
 *   the first argument; CHROME env var for the browser path.
 * Outputs: PNG files <page>-<width>x<height>-<lang>.png.
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
        await cdp.send('Page.navigate', { url: `${BASE}?lang=${lang}#/` });
        await sleep(SETTLE_MS);
        await shot(`opening-top-${tag}`);
        await scroll(`document.getElementById('how').scrollIntoView()`);
        await shot(`opening-how-${tag}`);
        await scroll(`window.scrollTo(0, document.body.scrollHeight)`);
        await shot(`opening-end-${tag}`);
        await cdp.send('Page.navigate', { url: `${BASE}?lang=${lang}#/mission` });
        await sleep(SETTLE_MS);
        await scroll('window.scrollTo(0, 0)');
        await shot(`mission-${tag}`);
      }
    }
    cdp.close();
  } finally {
    chrome.kill();
  }
}

await main();
