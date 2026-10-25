import * as THREE from 'three';
import {
  wallMaterial,
  roofMaterial,
  woodMaterial,
  stoneMaterial,
  wetStoneMaterial,
  palette,
} from './materials.js';

/** Axis-aligned collision boxes for FPS: { minX, maxX, minZ, maxZ } */
export const collisionBoxes = [];

function addCollision(minX, maxX, minZ, maxZ) {
  collisionBoxes.push({ minX, maxX, minZ, maxZ });
}

function createRoof(width, depth, overhang = 0.4) {
  const group = new THREE.Group();
  const w = width + overhang * 2;
  const d = depth + overhang * 2;
  const slope = 0.35;
  const geo = new THREE.BoxGeometry(w, 0.15, d);
  const mesh = new THREE.Mesh(geo, roofMaterial());
  mesh.position.y = 2.8;
  mesh.rotation.x = slope * 0.15;
  group.add(mesh);
  const geo2 = geo.clone();
  const mesh2 = new THREE.Mesh(geo2, roofMaterial());
  mesh2.position.y = 2.85;
  mesh2.rotation.x = -slope * 0.15;
  mesh2.scale.z = 0.92;
  group.add(mesh2);
  return group;
}

function createMaTouWall(side = 1) {
  const g = new THREE.Group();
  const steps = 3;
  for (let i = 0; i < steps; i++) {
    const h = 1.2 + i * 0.5;
    const geo = new THREE.BoxGeometry(0.35, h, 1.8 - i * 0.2);
    const m = new THREE.Mesh(geo, wallMaterial());
    m.position.set(side * (1.8 + i * 0.15), h / 2 + 2.5, 0);
    g.add(m);
  }
  return g;
}

function createLatticeWindow() {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.1, 0.08),
    woodMaterial()
  );
  const bars = new THREE.Group();
  for (let i = -2; i <= 2; i++) {
    const v = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1, 0.04),
      woodMaterial()
    );
    v.position.x = i * 0.18;
    bars.add(v);
  }
  for (let j = -2; j <= 2; j++) {
    const h = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.04, 0.04),
      woodMaterial()
    );
    h.position.y = j * 0.22;
    bars.add(h);
  }
  frame.add(bars);
  return frame;
}

function createHouse(x, z, w, d, rotY = 0, withBanner = false) {
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  house.rotation.y = rotY;

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, d), wallMaterial());
  body.position.y = 1.3;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  const roof = createRoof(w, d);
  house.add(roof);
  house.add(createMaTouWall(1));
  house.add(createMaTouWall(-1));

  const win = createLatticeWindow();
  win.position.set(0, 1.5, d / 2 + 0.05);
  house.add(win);

  if (withBanner) {
    const banner = createTeahouseBanner();
    banner.position.set(0.6, 2.2, d / 2 + 0.2);
    house.add(banner);
  }

  const margin = 0.3;
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  const corners = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([lx, lz]) => ({
    x: x + lx * cos - lz * sin,
    z: z + lx * sin + lz * cos,
  }));
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minZ = Math.min(minZ, c.z);
    maxZ = Math.max(maxZ, c.z);
  }
  addCollision(minX - margin, maxX + margin, minZ - margin, maxZ + margin);

  return house;
}

function createTeahouseBanner() {
  const g = new THREE.Group();
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0x4a1818,
      roughness: 0.9,
      side: THREE.DoubleSide,
    })
  );
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2a1010';
  ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = '#e8d8b0';
  ctx.font = 'bold 72px "Ma Shan Zheng", serif';
  ctx.textAlign = 'center';
  ctx.fillText('茶', 64, 100);
  ctx.font = '48px "Ma Shan Zheng", serif';
  ctx.fillText('館', 64, 180);
  const tex = new THREE.CanvasTexture(canvas);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.9),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  sign.position.z = 0.02;
  g.add(cloth);
  g.add(sign);
  return g;
}

function createLantern(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.35, 8),
    new THREE.MeshStandardMaterial({
      color: 0x8b2020,
      emissive: palette.lantern,
      emissiveIntensity: 0.8,
      roughness: 0.6,
    })
  );
  const light = new THREE.PointLight(0xffa858, 1.2, 12, 2);
  light.castShadow = false;
  g.add(body);
  g.add(light);
  g.userData.lanternLight = light;
  return g;
}

function createWillow(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.25, 3.5, 6),
    woodMaterial()
  );
  trunk.position.y = 1.75;
  g.add(trunk);
  const strands = 12;
  for (let i = 0; i < strands; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.5, 0),
      new THREE.Vector3((Math.random() - 0.5) * 1.5, 2, (Math.random() - 0.5) * 1.5),
      new THREE.Vector3((Math.random() - 0.5) * 2, 0.5, (Math.random() - 0.5) * 2),
    ]);
    const tube = new THREE.TubeGeometry(curve, 8, 0.02, 4, false);
    const leaf = new THREE.Mesh(
      tube,
      new THREE.MeshStandardMaterial({
        color: 0x2a4030,
        roughness: 0.95,
        transparent: true,
        opacity: 0.85,
      })
    );
    g.add(leaf);
  }
  return g;
}

function createUmbrella(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.02, z);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.25, 12, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1a2838,
      roughness: 0.8,
      side: THREE.DoubleSide,
    })
  );
  cone.rotation.x = Math.PI;
  cone.position.y = 1.1;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6),
    woodMaterial()
  );
  pole.position.y = 0.55;
  g.add(pole);
  g.add(cone);
  return g;
}

function createWupanBoat(x, z, rot = 0) {
  const boat = new THREE.Group();
  boat.position.set(x, -0.05, z);
  boat.rotation.y = rot;
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.35, 1.1),
    woodMaterial()
  );
  hull.position.y = 0.15;
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.08, 1.3),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
    })
  );
  canopy.position.set(0, 0.55, 0);
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.04, 6, 12, Math.PI),
    woodMaterial()
  );
  arch.rotation.y = Math.PI / 2;
  arch.position.set(0, 0.75, 0);
  boat.add(hull);
  boat.add(canopy);
  boat.add(arch);
  boat.userData.boat = true;
  return boat;
}

function createStoneBridge() {
  const bridge = new THREE.Group();
  const archGeo = new THREE.TorusGeometry(5, 0.9, 8, 24, Math.PI);
  const arch = new THREE.Mesh(archGeo, stoneMaterial());
  arch.rotation.x = Math.PI / 2;
  arch.rotation.z = Math.PI;
  arch.position.set(0, 2.2, 0);
  bridge.add(arch);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.35, 12),
    wetStoneMaterial()
  );
  deck.position.set(0, 0.55, 0);
  deck.receiveShadow = true;
  bridge.add(deck);

  for (let side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 12),
      stoneMaterial()
    );
    rail.position.set(side * 1.8, 1, 0);
    bridge.add(rail);
  }

  addCollision(-2.5, 2.5, -6, 6);
  return bridge;
}

function createFlagstones() {
  const g = new THREE.Group();
  const mat = wetStoneMaterial();
  const canalHalf = 7.5;
  for (let row = 0; row < 8; row++) {
    for (let side of [-1, 1]) {
      for (let col = 0; col < 14; col++) {
        const w = 1.8 + Math.random() * 0.4;
        const d = 1.2 + Math.random() * 0.3;
        const tile = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), mat);
        tile.position.set(
          side * (canalHalf + 2.5 + col * 2.1 + (Math.random() - 0.5) * 0.3),
          0.04,
          -55 + row * 14 + col * 0.1 + (Math.random() - 0.5) * 0.5
        );
        tile.receiveShadow = true;
        g.add(tile);
      }
    }
  }
  return g;
}

export function buildTown(scene, quality) {
  collisionBoxes.length = 0;
  const root = new THREE.Group();
  scene.add(root);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    wetStoneMaterial()
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  root.add(createFlagstones());

  const bridge = createStoneBridge();
  bridge.position.set(0, 0, -8);
  root.add(bridge);

  const houseData = [
    [-12, -18, 5, 4, 0.1, false],
    [-11, -32, 4.5, 3.8, -0.05, false],
    [-13, 8, 5.5, 4, 0.15, true],
    [-12, 22, 4, 3.5, 0, false],
    [12, -20, 5, 4.2, -0.12, false],
    [11, -5, 4.8, 4, 0.08, false],
    [13, 12, 5.2, 4, -0.1, false],
    [12, 28, 4.5, 3.6, 0.05, false],
    [-14, -45, 4, 3.5, 0.2, false],
    [14, -38, 5, 4, -0.15, false],
  ];

  const lanterns = [];
  for (const [x, z, w, d, r, banner] of houseData) {
    root.add(createHouse(x, z, w, d, r, banner));
    if (lanterns.length < quality.lanternCount) {
      const lx = x + (x > 0 ? -1 : 1) * (w / 2 + 0.3);
      const lan = createLantern(lx, 2.4, z + d / 2);
      root.add(lan);
      lanterns.push(lan);
    }
  }

  const willowPositions = [
    [-9, -12],
    [9, -15],
    [-8, 18],
    [10, 5],
    [-10, 35],
  ];
  for (const [x, z] of willowPositions) {
    root.add(createWillow(x, z));
  }

  root.add(createUmbrella(-10, -10));
  root.add(createUmbrella(11, 15));

  const boat1 = createWupanBoat(-4, 5, 0.3);
  const boat2 = createWupanBoat(5, -25, -0.2);
  root.add(boat1);
  root.add(boat2);

  const canalBounds = { minX: -7, maxX: 7 };

  return {
    root,
    lanterns,
    boats: [boat1, boat2],
    canalBounds,
  };
}

/** Walkable: stone paths; canal blocked except stone bridge span */
export function isWalkable(x, z) {
  const onBridge = Math.abs(z + 8) < 6 && Math.abs(x) < 2.2;
  if (Math.abs(x) < 7.2 && Math.abs(z) < 50 && !onBridge) return false;
  if (Math.abs(x) > 38 || Math.abs(z) > 55) return false;
  for (const box of collisionBoxes) {
    if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
      return false;
    }
  }
  return true;
}

export function resolveCollision(px, pz, radius = 0.35) {
  let x = px;
  let z = pz;
  for (const box of collisionBoxes) {
    const closestX = Math.max(box.minX, Math.min(x, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
    const dx = x - closestX;
    const dz = z - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const push = (radius - dist) / dist;
      x += dx * push;
      z += dz * push;
    }
  }
  const onBridge = Math.abs(z + 8) < 6 && Math.abs(x) < 2.2;
  if (Math.abs(x) < 7.2 && !onBridge) {
    x = x > 0 ? 7.2 + radius : -7.2 - radius;
  }
  return { x, z };
}
