import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

export function createCanalWater(scene, quality, canalWidth = 14, canalLength = 80) {
  const waterGroup = new THREE.Group();

  const floorGeo = new THREE.PlaneGeometry(canalLength, canalWidth);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a2838,
    metalness: 0.15,
    roughness: 0.08,
    transparent: true,
    opacity: 0.92,
    envMapIntensity: 0.6,
  });
  const water = new THREE.Mesh(floorGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.15;
  water.position.z = 0;
  waterGroup.add(water);

  const reflector = new Reflector(new THREE.PlaneGeometry(canalLength * 0.95, canalWidth * 0.9), {
    clipBias: 0.003,
    textureWidth: quality.reflectorResolution,
    textureHeight: quality.reflectorResolution,
    color: 0x8899aa,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = -0.12;
  reflector.material.transparent = true;
  reflector.material.opacity = 0.35;
  waterGroup.add(reflector);

  const rippleCanvas = document.createElement('canvas');
  rippleCanvas.width = 256;
  rippleCanvas.height = 256;
  const rctx = rippleCanvas.getContext('2d');
  const rippleTex = new THREE.CanvasTexture(rippleCanvas);
  rippleTex.wrapS = rippleTex.wrapT = THREE.RepeatWrapping;
  rippleTex.repeat.set(4, 2);

  const rippleMat = new THREE.MeshBasicMaterial({
    map: rippleTex,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rippleMesh = new THREE.Mesh(floorGeo.clone(), rippleMat);
  rippleMesh.rotation.x = -Math.PI / 2;
  rippleMesh.position.y = -0.1;
  waterGroup.add(rippleMesh);

  scene.add(waterGroup);

  let phase = 0;
  function updateRipples(dt) {
    phase += dt;
    rctx.fillStyle = 'rgba(0,0,0,0.08)';
    rctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3; i++) {
      const x = ((phase * 40 + i * 80) % 256);
      const y = 128 + Math.sin(phase * 2 + i) * 30;
      const g = rctx.createRadialGradient(x, y, 0, x, y, 12 + i * 4);
      g.addColorStop(0, 'rgba(200,220,240,0.15)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      rctx.fillStyle = g;
      rctx.fillRect(x - 20, y - 20, 40, 40);
    }
    rippleTex.needsUpdate = true;
    rippleMesh.material.opacity = 0.08 + Math.sin(phase) * 0.03;
  }

  function setReflectorResolution(res) {
    reflector.getRenderTarget().setSize(res, res);
  }

  return { waterGroup, updateRipples, setReflectorResolution, reflector };
}
