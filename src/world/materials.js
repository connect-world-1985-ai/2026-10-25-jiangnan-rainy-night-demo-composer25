import * as THREE from 'three';

export const palette = {
  wallWhite: 0xe8e4dc,
  wallShadow: 0xc8c4bc,
  roofDark: 0x1a1c22,
  roofTile: 0x252830,
  wood: 0x3d3028,
  woodDark: 0x2a2218,
  stone: 0x6a6560,
  stoneWet: 0x5a5550,
  lantern: 0xffa040,
  inkFog: 0x8a9aa8,
};

export function wallMaterial() {
  return new THREE.MeshStandardMaterial({
    color: palette.wallWhite,
    roughness: 0.85,
    metalness: 0.02,
  });
}

export function roofMaterial() {
  return new THREE.MeshStandardMaterial({
    color: palette.roofDark,
    roughness: 0.65,
    metalness: 0.1,
  });
}

export function woodMaterial() {
  return new THREE.MeshStandardMaterial({
    color: palette.wood,
    roughness: 0.9,
    metalness: 0,
  });
}

export function stoneMaterial() {
  return new THREE.MeshStandardMaterial({
    color: palette.stone,
    roughness: 0.75,
    metalness: 0.05,
  });
}

export function wetStoneMaterial() {
  return new THREE.MeshStandardMaterial({
    color: palette.stoneWet,
    roughness: 0.25,
    metalness: 0.15,
  });
}
