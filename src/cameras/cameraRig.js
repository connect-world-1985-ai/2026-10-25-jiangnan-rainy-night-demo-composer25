import * as THREE from 'three';

const PRESETS = [
  {
    name: '石桥',
    position: new THREE.Vector3(6, 3.5, -4),
    target: new THREE.Vector3(0, 1.5, -20),
    fov: 50,
  },
  {
    name: '舟行',
    position: new THREE.Vector3(-3, 1.8, 12),
    target: new THREE.Vector3(2, 1, -30),
    fov: 48,
    path: (t) => ({
      position: new THREE.Vector3(
        -4 + Math.sin(t * 0.15) * 2,
        1.6 + Math.sin(t * 0.3) * 0.1,
        15 - t * 0.8
      ),
      target: new THREE.Vector3(0, 1, 15 - t * 0.8 - 15),
    }),
  },
  {
    name: '巷陌',
    position: new THREE.Vector3(-14, 1.65, -5),
    target: new THREE.Vector3(-14, 1.6, -35),
    fov: 55,
  },
  {
    name: '俯瞰',
    position: new THREE.Vector3(0, 22, 35),
    target: new THREE.Vector3(0, 0, -5),
    fov: 45,
  },
];

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.presets = PRESETS;
    this.activeIndex = 0;
    this.transition = null;
    this.cinematicTime = 0;
    this.fromPos = new THREE.Vector3();
    this.fromTarget = new THREE.Vector3();
    this.toPos = new THREE.Vector3();
    this.toTarget = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.duration = 1.8;
    this.applyPreset(0, true);
  }

  applyPreset(index, instant = false) {
    index = ((index % this.presets.length) + this.presets.length) % this.presets.length;
    this.activeIndex = index;
    const p = this.presets[index];
    this.toPos.copy(p.position);
    this.toTarget.copy(p.target);
    if (instant) {
      this.camera.position.copy(p.position);
      this.lookTarget.copy(p.target);
      this.camera.lookAt(this.lookTarget);
      this.camera.fov = p.fov;
      this.camera.updateProjectionMatrix();
      this.transition = null;
      return;
    }
    this.fromPos.copy(this.camera.position);
    this.fromTarget.copy(this.lookTarget);
    this.transition = 0;
    this.cinematicTime = 0;
  }

  update(dt, mode) {
    if (mode !== 'cinematic') return;

    const preset = this.presets[this.activeIndex];
    this.cinematicTime += dt;

    if (preset.path) {
      const { position, target } = preset.path(this.cinematicTime);
      this.camera.position.copy(position);
      this.lookTarget.copy(target);
      this.camera.lookAt(this.lookTarget);
      return;
    }

    if (this.transition !== null) {
      this.transition += dt / this.duration;
      const t = Math.min(1, this.transition);
      const ease = t * t * (3 - 2 * t);
      this.camera.position.lerpVectors(this.fromPos, this.toPos, ease);
      this.lookTarget.lerpVectors(this.fromTarget, this.toTarget, ease);
      this.camera.lookAt(this.lookTarget);
      const fov = THREE.MathUtils.lerp(
        this.camera.fov,
        preset.fov,
        ease * 0.1
      );
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
      if (t >= 1) this.transition = null;
    } else {
      const sway = Math.sin(this.cinematicTime * 0.4) * 0.08;
      this.camera.position.x = this.toPos.x + sway;
      this.camera.position.y =
        this.toPos.y + Math.sin(this.cinematicTime * 0.25) * 0.05;
      this.lookTarget.copy(this.toTarget);
      this.camera.lookAt(this.lookTarget);
    }
  }

  getPresetCount() {
    return this.presets.length;
  }
}
