import * as THREE from 'three';

export class RainSystem {
  constructor(scene, quality) {
    this.scene = scene;
    this.quality = quality;
    this.intensity = 0.65;
    this.group = new THREE.Group();
    scene.add(this.group);

    this._initStreaks();
    if (quality.rainSplash) this._initSplashes();
  }

  _initStreaks() {
    const count = this.quality.rainCount;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const spread = 55;
    const height = 28;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
      velocities[i] = 12 + Math.random() * 18;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.velocities = velocities;
    this.spread = spread;
    this.height = height;

    const mat = new THREE.PointsMaterial({
      color: 0xa8b8c8,
      size: 0.06,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
  }

  _initSplashes() {
    const n = Math.floor(this.quality.rainCount * 0.08);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const life = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = 0.02;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      life[i] = Math.random();
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.splashLife = life;
    this.splashGeo = geo;
    const mat = new THREE.PointsMaterial({
      color: 0xc0d0e0,
      size: 0.12,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.splashes = new THREE.Points(geo, mat);
    this.group.add(this.splashes);
  }

  setQuality(quality) {
    this.quality = quality;
    this.group.remove(this.points);
    this.points.geometry.dispose();
    this.points.material.dispose();
    if (this.splashes) {
      this.group.remove(this.splashes);
      this.splashes.geometry.dispose();
      this.splashes.material.dispose();
      this.splashes = null;
    }
    this._initStreaks();
    if (quality.rainSplash) this._initSplashes();
  }

  setIntensity(v) {
    this.intensity = v;
    const op = 0.15 + v * 0.55;
    this.points.material.opacity = op;
    if (this.splashes) this.splashes.material.opacity = 0.1 + v * 0.35;
  }

  update(dt, camera) {
    const pos = this.points.geometry.attributes.position.array;
    const count = pos.length / 3;
    const wind = 1.2;
    const factor = 0.35 + this.intensity * 1.2;

    const cx = camera.position.x;
    const cz = camera.position.z;

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= this.velocities[i] * dt * factor;
      pos[i * 3] += wind * dt;
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = this.height * (0.5 + Math.random() * 0.5);
        pos[i * 3] = cx + (Math.random() - 0.5) * this.spread;
        pos[i * 3 + 2] = cz + (Math.random() - 0.5) * this.spread;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;

    if (this.splashes) {
      const sp = this.splashGeo.attributes.position.array;
      const n = sp.length / 3;
      for (let i = 0; i < n; i++) {
        this.splashLife[i] -= dt * (2 + this.intensity * 3);
        if (this.splashLife[i] <= 0) {
          this.splashLife[i] = 1;
          sp[i * 3] = cx + (Math.random() - 0.5) * 35;
          sp[i * 3 + 2] = cz + (Math.random() - 0.5) * 35;
        }
        sp[i * 3 + 1] = 0.02 + (1 - this.splashLife[i]) * 0.15;
      }
      this.splashGeo.attributes.position.needsUpdate = true;
    }
  }
}
