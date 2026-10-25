import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const url = process.argv[2] || 'http://127.0.0.1:4173/';
const out = join(root, 'docs/screenshot.png');

await mkdir(join(root, 'docs'), { recursive: true });

await new Promise((resolve, reject) => {
  const chrome = spawn(
    '/usr/local/bin/google-chrome',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      `--window-size=1920,1080`,
      `--screenshot=${out}`,
      url,
    ],
    { stdio: 'inherit' }
  );
  chrome.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`chrome ${code}`))));
});

console.log('Screenshot saved to', out);
