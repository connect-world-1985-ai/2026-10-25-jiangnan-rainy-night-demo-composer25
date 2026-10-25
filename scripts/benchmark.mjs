import puppeteer from 'puppeteer-core';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const url = process.argv[2] || 'http://127.0.0.1:4173/';

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-gl=angle'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForSelector('#loader.hidden', { timeout: 30000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 3000));

const fpsSamples = await page.evaluate(async () => {
  const { app } = await import('/src/main.js').catch(() => ({}));
  const samples = [];
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    if (window.__jiangnanApp) {
      samples.push(window.__jiangnanApp.stats.fps);
    }
  }
  return samples;
});

// Expose app on window from main - need to fix main.js
const stats = await page.evaluate(() => {
  return window.__jiangnanStats || { fps: 0, frameMs: 0 };
});

await mkdir(join(root, 'docs'), { recursive: true });
await page.screenshot({ path: join(root, 'docs/screenshot.png'), type: 'png' });

console.log(JSON.stringify({ stats, fpsSamples, url }, null, 2));
await browser.close();
