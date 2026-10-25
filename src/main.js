import { JiangnanApp } from './app.js';

const canvas = document.getElementById('canvas');
const loader = document.getElementById('loader');
const progressBar = document.getElementById('loader-progress');
const helpText = document.getElementById('help-text');

const app = new JiangnanApp(canvas);

async function boot() {
  await app.init((p) => {
    progressBar.style.width = `${p * 100}%`;
  });
  loader.classList.add('hidden');
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  app.update();
  if (typeof window !== 'undefined') {
    window.__jiangnanStats = { ...app.stats };
  }
}

function setActiveButtons(selector, activeEl) {
  document.querySelectorAll(selector).forEach((b) => {
    b.classList.toggle('active', b === activeEl);
  });
}

document.querySelectorAll('.cam-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const i = parseInt(btn.dataset.camera, 10);
    app.setCameraPreset(i);
    setActiveButtons('.cam-btn', btn);
  });
});

document.getElementById('mode-cinematic')?.addEventListener('click', (e) => {
  app.setMode('cinematic');
  setActiveButtons('.mode-btn', e.target);
  helpText.textContent = '数字键 1–4 切换镜头 · 映画模式自动运镜';
});

document.getElementById('mode-fps')?.addEventListener('click', (e) => {
  app.setMode('fps');
  setActiveButtons('.mode-btn', e.target);
  helpText.textContent = 'WASD 移动 · 鼠标环顾 · Esc 退出指针锁定';
  app.audio.start();
});

document.getElementById('mode-orbit')?.addEventListener('click', (e) => {
  app.setMode('orbit');
  setActiveButtons('.mode-btn', e.target);
  helpText.textContent = '拖拽旋转 · 滚轮缩放 · 右键平移';
});

document.querySelectorAll('.quality-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    app.setQuality(btn.dataset.quality);
    setActiveButtons('.quality-btn', btn);
  });
});

document.getElementById('rain-slider')?.addEventListener('input', (e) => {
  app.setRainIntensity(parseFloat(e.target.value));
});

document.getElementById('fog-slider')?.addEventListener('input', (e) => {
  app.setFogIntensity(parseFloat(e.target.value));
});

document.getElementById('mute-btn')?.addEventListener('click', (e) => {
  app.audio.start();
  const muted = app.audio.toggle();
  e.target.textContent = muted ? '🔇' : '🔊';
});

window.addEventListener('keydown', (e) => {
  if (e.code >= 'Digit1' && e.code <= 'Digit4') {
    const i = parseInt(e.code.replace('Digit', ''), 10) - 1;
    app.setCameraPreset(i);
    if (app.mode !== 'cinematic') {
      app.setMode('cinematic');
      setActiveButtons('.mode-btn', document.getElementById('mode-cinematic'));
    }
    document.querySelectorAll('.cam-btn').forEach((b) => {
      b.classList.toggle('active', parseInt(b.dataset.camera, 10) === i);
    });
  }
});

document.body.addEventListener(
  'click',
  () => app.audio.start(),
  { once: true }
);

boot().catch(console.error);

if (typeof window !== 'undefined') {
  window.__jiangnanApp = app;
}

export { app };
