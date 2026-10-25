import * as THREE from 'three';
import { isWalkable, resolveCollision } from '../world/town.js';

const MOVE_SPEED = 4.2;
const LOOK_SENS = 0.0022;
const EYE_HEIGHT = 1.65;

export class FpsController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.enabled = false;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
    this.velocity = new THREE.Vector3();
    this.spawn = new THREE.Vector3(-12, EYE_HEIGHT, -8);

    this._onKeyDown = (e) => {
      this.keys[e.code] = true;
    };
    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
    };
    this._onMouseMove = (e) => {
      if (!this.enabled) return;
      this.yaw -= e.movementX * LOOK_SENS;
      this.pitch -= e.movementY * LOOK_SENS;
      this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    };
    this._onClick = () => {
      if (!this.enabled) return;
      this.dom.requestPointerLock();
    };
    this._onLockChange = () => {
      const locked = document.pointerLockElement === this.dom;
      if (!locked && this.enabled) {
        // keep fps mode but release look
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onLockChange);
    this.dom.addEventListener('click', this._onClick);
  }

  enable() {
    this.enabled = true;
    this.camera.position.copy(this.spawn);
    this.yaw = Math.PI / 2;
    this.pitch = 0;
  }

  disable() {
    this.enabled = false;
    if (document.pointerLockElement === this.dom) {
      document.exitPointerLock();
    }
  }

  update(dt) {
    if (!this.enabled) return;

    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const move = new THREE.Vector3();

    if (this.keys['KeyW'] || this.keys['ArrowUp']) move.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) move.sub(forward);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) move.sub(right);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(MOVE_SPEED * dt);
    }

    let nx = this.camera.position.x + move.x;
    let nz = this.camera.position.z + move.z;
    const resolved = resolveCollision(nx, nz);
    nx = resolved.x;
    nz = resolved.z;

    if (isWalkable(nx, nz)) {
      this.camera.position.x = nx;
      this.camera.position.z = nz;
    }

    this.camera.position.y = EYE_HEIGHT;

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onLockChange);
    this.dom.removeEventListener('click', this._onClick);
  }
}
