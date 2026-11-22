/** Overhead line mechanics (Phase 5): parabolic sag and ground clearance. */
export const CONDUCTOR_MASS: Record<string, number> = { // kg/m
  "ac-35": 0.149, "ac-50": 0.195, "ac-70": 0.275, "amka-3x25": 0.48, "amka-3x50": 0.72, "amka-3x70": 0.95, "amka-3x120": 1.3, "sax-70": 0.36, "sax-150": 0.63,
};
/** Sag f = w·L² / (8·H); w includes ice load (kg/m) and wind, H horizontal tension (N). */
export function sag(spanM: number, massKgM: number, tensionN: number, iceKgM = 0, windNm = 0) {
  const wv = (massKgM + iceKgM) * 9.81;
  const w = Math.hypot(wv, windNm);
  return (w * spanM * spanM) / (8 * tensionN);
}
/** Minimum clearance to ground (m) — EN 50341 / EN 50423 typical: LV ABC 5.5, MV 6, roads +1. */
export const minClearance = (un: number, road = false) => (un < 1000 ? 5.5 : 6) + (road ? 1 : 0);
export function clearanceCheck(attachHeightM: number, sagM: number, un: number, road = false) {
  const lowest = attachHeightM - sagM;
  const need = minClearance(un, road);
  return { lowest, need, ok: lowest >= need };
}
