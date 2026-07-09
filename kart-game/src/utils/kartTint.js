import { Color } from "three";

const SKIP = /tire|wheel|glass|window|black|dark/i;

export function tintMaterial(mat, hex, strength = 0.55) {
  if (!mat || !mat.color || !hex) return mat;
  const tinted = mat.clone();
  tinted.color = mat.color.clone();
  tinted.color.lerp(new Color(hex), strength);
  if (tinted.emissive) {
    tinted.emissive = mat.emissive.clone();
    tinted.emissive.lerp(new Color(hex), strength * 0.35);
  }
  return tinted;
}

export function applyKartTint(root, hex, { materialNames = [], strength = 0.55 } = {}) {
  if (!root || !hex) return;
  root.traverse((child) => {
    if (!child.isMesh) return;
    const meshName = (child.name || "").toLowerCase();
    if (SKIP.test(meshName)) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const next = mats.map((mat) => {
      if (!mat) return mat;
      const matName = (mat.name || "").toLowerCase();
      if (SKIP.test(matName)) return mat;
      if (materialNames.length && !materialNames.some((n) => matName.includes(n.toLowerCase()))) {
        if (!matName.includes("body") && !matName.includes("palette") && !matName.includes("material")) {
          return mat;
        }
      }
      return tintMaterial(mat, hex, strength);
    });
    child.material = Array.isArray(child.material) ? next : next[0];
  });
}
