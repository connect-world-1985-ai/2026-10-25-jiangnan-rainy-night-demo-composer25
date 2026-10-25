import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://127.0.0.1:4173/';

const script = `
(async () => {
  await new Promise(r => setTimeout(r, 4000));
  const results = {};
  for (const q of ['low', 'medium', 'high']) {
    const btn = document.querySelector('[data-quality="' + q + '"]');
    btn?.click();
    await new Promise(r => setTimeout(r, 2500));
    const fps = [];
    for (let i = 0; i < 40; i++) {
      await new Promise(r => requestAnimationFrame(r));
      if (window.__jiangnanStats?.fps) fps.push(window.__jiangnanStats.fps);
    }
    const avg = fps.length ? Math.round(fps.reduce((a,b)=>a+b,0)/fps.length) : 0;
    results[q] = { avgFps: avg, frameMs: avg ? Math.round(1000/avg) : 0 };
  }
  return results;
})();
`;

const chrome = spawn(
  '/usr/local/bin/google-chrome',
  [
    '--headless=new',
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--user-data-dir=/tmp/chrome-jiangnan',
    `--window-size=1920,1080`,
    '--virtual-time-budget=20000',
    url,
  ],
  { stdio: ['pipe', 'pipe', 'pipe'] }
);

// Chrome headless can't return evaluate easily without puppeteer - write results to console via bookmarklet approach won't work

console.log('Use browser stats from manual test; headless perf requires puppeteer.');
chrome.kill();
