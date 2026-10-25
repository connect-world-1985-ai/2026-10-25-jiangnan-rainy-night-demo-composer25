import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import { QUALITY_PRESETS, detectDefaultQuality } from './config/quality.js';
import { RainSystem } from './effects/rain.js';
import { createCanalWater } from './effects/water.js';
import { buildTown } from './world/town.js';
import { CameraRig } from './cameras/cameraRig.js';
import { FpsController } from './controls/fpsController.js';
import { AmbientSound } from './audio/ambient.js';

export class JiangnanApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.mode = 'cinematic';
    this.qualityName = detectDefaultQuality();
    this.quality = { ...QUALITY_PRESETS[this.qualityName] };
    this.clock = new THREE.Clock();
    this.stats = { fps: 0, frameMs: 0 };
    this._fpsAccum = 0;
    this._fpsFrames = 0;
    this.fogIntensity = 0.55;
    this.audio = new AmbientSound();
  }

  async init(onProgress) {
    onProgress?.(0.1);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this._updateFog();

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      180
    );

    onProgress?.(0.25);
    this._setupLights();
    this.town = buildTown(this.scene, this.quality);
    this.water = createCanalWater(this.scene, this.quality);
    this.rain = new RainSystem(this.scene, this.quality);
    this.rain.setIntensity(0.65);

    onProgress?.(0.5);
    this.cameraRig = new CameraRig(this.camera);
    this.fps = new FpsController(this.camera, this.canvas);
    this.orbit = new OrbitControls(this.camera, this.canvas);
    this.orbit.enabled = false;
    this.orbit.target.set(0, 1, -10);
    this.orbit.maxPolarAngle = Math.PI / 2.1;
    this.orbit.minDistance = 3;
    this.orbit.maxDistance = 45;
    this.orbit.enableDamping = true;

    this._setupPost();
    onProgress?.(0.85);
    window.addEventListener('resize', () => this._onResize());
    onProgress?.(1);
  }

  _setupLights() {
    const hemi = new THREE.HemisphereLight(0x6a7a90, 0x1a1820, 0.35);
    this.scene.add(hemi);

    const moon = new THREE.DirectionalLight(0x8899b8, 0.25);
    moon.position.set(-20, 40, 15);
    moon.castShadow = this.quality.shadows;
    if (this.quality.shadows) {
      moon.shadow.mapSize.set(
        this.quality.shadowMapSize,
        this.quality.shadowMapSize
      );
      moon.shadow.camera.near = 1;
      moon.shadow.camera.far = 80;
      moon.shadow.camera.left = -30;
      moon.shadow.camera.right = 30;
      moon.shadow.camera.top = 30;
      moon.shadow.camera.bottom = -30;
    }
    this.scene.add(moon);
    this.moon = moon;
  }

  _setupPost() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    const effects = [];
    if (this.quality.bloom) {
      this.bloom = new BloomEffect({
        intensity: 0.85,
        luminanceThreshold: 0.55,
        luminanceSmoothing: 0.4,
        mipmapBlur: true,
      });
      effects.push(this.bloom);
    }
    effects.push(
      new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
    );
    effects.push(
      new VignetteEffect({ darkness: 0.55, offset: 0.35 })
    );
    this.effectPass = new EffectPass(this.camera, ...effects);
    this.composer.addPass(this.effectPass);
  }

  _updateFog() {
    const density =
      this.quality.fogDensity * (0.4 + this.fogIntensity * 1.2);
    this.scene.fog = new THREE.FogExp2(0x5a6678, density);
    this.scene.background = new THREE.Color(0x3a4555);
  }

  setMode(mode) {
    this.mode = mode;
    this.fps.disable();
    this.orbit.enabled = false;
    const hint = document.getElementById('fps-hint');
    if (mode === 'cinematic') {
      hint?.classList.add('hidden');
      this.cameraRig.applyPreset(this.cameraRig.activeIndex, false);
    } else if (mode === 'fps') {
      hint?.classList.remove('hidden');
      this.fps.enable();
      this.audio.start();
    } else if (mode === 'orbit') {
      hint?.classList.add('hidden');
      this.orbit.enabled = true;
      this.orbit.target.set(0, 1, -8);
    }
  }

  setQuality(name) {
    this.qualityName = name;
    this.quality = { ...QUALITY_PRESETS[name] };
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.moon.castShadow = this.quality.shadows;
    if (this.quality.shadows) {
      this.moon.shadow.mapSize.set(
        this.quality.shadowMapSize,
        this.quality.shadowMapSize
      );
    }
    this.rain.setQuality(this.quality);
    this.water.setReflectorResolution(this.quality.reflectorResolution);
    this._rebuildPost();
    this._updateFog();
    this._onResize();
  }

  _rebuildPost() {
    this.composer.removeAllPasses();
    this.composer.addPass(this.renderPass);
    const effects = [];
    if (this.quality.bloom) {
      if (!this.bloom) {
        this.bloom = new BloomEffect({
          intensity: 0.85,
          luminanceThreshold: 0.55,
          luminanceSmoothing: 0.4,
          mipmapBlur: true,
        });
      }
      effects.push(this.bloom);
    }
    effects.push(
      new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
    );
    effects.push(
      new VignetteEffect({ darkness: 0.55, offset: 0.35 })
    );
    this.effectPass = new EffectPass(this.camera, ...effects);
    this.composer.addPass(this.effectPass);
  }

  setRainIntensity(v) {
    this.rain.setIntensity(v);
  }

  setFogIntensity(v) {
    this.fogIntensity = v;
    this._updateFog();
  }

  setCameraPreset(i) {
    if (this.mode === 'cinematic') {
      this.cameraRig.applyPreset(i);
    }
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = this.quality.postScale;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w * scale, h * scale);
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);

    const t = performance.now();
    this._fpsFrames++;
    this._fpsAccum += dt;
    if (this._fpsAccum >= 0.5) {
      this.stats.fps = Math.round(this._fpsFrames / this._fpsAccum);
      this.stats.frameMs = (this._fpsAccum / this._fpsFrames) * 1000;
      this._fpsFrames = 0;
      this._fpsAccum = 0;
    }

    for (const boat of this.town.boats) {
      boat.position.z += Math.sin(performance.now() * 0.0003 + boat.id) * 0.0002;
      boat.rotation.z = Math.sin(performance.now() * 0.0005) * 0.02;
    }

    for (const lan of this.town.lanterns) {
      const light = lan.userData.lanternLight;
      if (light) {
        light.intensity = 1 + Math.sin(performance.now() * 0.003 + lan.id) * 0.15;
      }
    }

    this.water.updateRipples(dt);
    this.rain.update(dt, this.camera);

    if (this.mode === 'cinematic') {
      this.cameraRig.update(dt, 'cinematic');
    } else if (this.mode === 'fps') {
      this.fps.update(dt);
    } else if (this.mode === 'orbit') {
      this.orbit.update();
    }

    this.composer.render();
    return performance.now() - t;
  }

  dispose() {
    this.fps.dispose();
    this.orbit.dispose();
    this.renderer.dispose();
  }
}
