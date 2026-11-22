/**
 * Engineering conductor data (Phase 1). Values are typical manufacturer data
 * (IEC 60228 / HD 603 / HD 620, Prysmian/Reka catalogues) — editable per project.
 * r20: DC resistance at 20 °C (Ω/km); x: reactance at 50 Hz (Ω/km);
 * iz: base ampacity (A) for the reference installation; tMax: max operating °C;
 * k: short-circuit factor for I²t = k²S² (A·√s/mm²).
 */
export type Conductor = {
  id: string;
  label: string;
  kind: "lv-cable" | "mv-cable" | "lv-abc" | "mv-bare" | "mv-covered";
  material: "Al" | "Cu";
  mm2: number;
  r20: number;
  x: number;
  iz: number;
  install: "ground" | "air";
  tMax: number;
  k: number;
  un: number; // rated system voltage V
};

const ALPHA = { Al: 0.00403, Cu: 0.00393 } as const;

export const CONDUCTORS: Conductor[] = [
  { id: "axmk-4x16", label: "AXMK 4×16", kind: "lv-cable", material: "Al", mm2: 16, r20: 1.91, x: 0.08, iz: 91, install: "ground", tMax: 90, k: 94, un: 400 },
  { id: "axmk-4x35", label: "AXMK 4×35", kind: "lv-cable", material: "Al", mm2: 35, r20: 0.868, x: 0.08, iz: 135, install: "ground", tMax: 90, k: 94, un: 400 },
  { id: "axmk-4x70", label: "AXMK 4×70", kind: "lv-cable", material: "Al", mm2: 70, r20: 0.443, x: 0.075, iz: 200, install: "ground", tMax: 90, k: 94, un: 400 },
  { id: "axmk-4x95", label: "AXMK 4×95", kind: "lv-cable", material: "Al", mm2: 95, r20: 0.32, x: 0.075, iz: 240, install: "ground", tMax: 90, k: 94, un: 400 },
  { id: "axmk-4x120", label: "AXMK 4×120", kind: "lv-cable", material: "Al", mm2: 120, r20: 0.253, x: 0.075, iz: 275, install: "ground", tMax: 90, k: 94, un: 400 },
  { id: "axmk-4x185", label: "AXMK 4×185", kind: "lv-cable", material: "Al", mm2: 185, r20: 0.164, x: 0.074, iz: 345, install: "ground", tMax: 90, k: 94, un: 400 },
  { id: "axmk-4x240", label: "AXMK 4×240", kind: "lv-cable", material: "Al", mm2: 240, r20: 0.125, x: 0.073, iz: 400, install: "ground", tMax: 90, k: 94, un: 400 },
  { id: "nayy-4x150", label: "NAYY 4×150", kind: "lv-cable", material: "Al", mm2: 150, r20: 0.206, x: 0.08, iz: 275, install: "ground", tMax: 70, k: 76, un: 400 },
  { id: "amka-3x25", label: "AMKA 3×25+54.6", kind: "lv-abc", material: "Al", mm2: 25, r20: 1.2, x: 0.1, iz: 100, install: "air", tMax: 80, k: 94, un: 400 },
  { id: "amka-3x50", label: "AMKA 3×50+54.6", kind: "lv-abc", material: "Al", mm2: 50, r20: 0.641, x: 0.1, iz: 140, install: "air", tMax: 80, k: 94, un: 400 },
  { id: "amka-3x70", label: "AMKA 3×70+95", kind: "lv-abc", material: "Al", mm2: 70, r20: 0.443, x: 0.1, iz: 170, install: "air", tMax: 80, k: 94, un: 400 },
  { id: "amka-3x120", label: "AMKA 3×120+95", kind: "lv-abc", material: "Al", mm2: 120, r20: 0.253, x: 0.1, iz: 245, install: "air", tMax: 80, k: 94, un: 400 },
  { id: "ahxamk-95", label: "AHXAMK-W 3×1×95", kind: "mv-cable", material: "Al", mm2: 95, r20: 0.32, x: 0.12, iz: 230, install: "ground", tMax: 90, k: 94, un: 20000 },
  { id: "ahxamk-150", label: "AHXAMK-W 3×1×150", kind: "mv-cable", material: "Al", mm2: 150, r20: 0.206, x: 0.11, iz: 290, install: "ground", tMax: 90, k: 94, un: 20000 },
  { id: "ahxamk-240", label: "AHXAMK-W 3×1×240", kind: "mv-cable", material: "Al", mm2: 240, r20: 0.125, x: 0.105, iz: 375, install: "ground", tMax: 90, k: 94, un: 20000 },
  { id: "ac-35", label: "AC-35 (ACSR 35/6.2)", kind: "mv-bare", material: "Al", mm2: 35, r20: 0.773, x: 0.37, iz: 175, install: "air", tMax: 70, k: 93, un: 20000 },
  { id: "ac-50", label: "AC-50 (ACSR 50/8)", kind: "mv-bare", material: "Al", mm2: 50, r20: 0.595, x: 0.36, iz: 210, install: "air", tMax: 70, k: 93, un: 20000 },
  { id: "ac-70", label: "AC-70 (ACSR 70/11)", kind: "mv-bare", material: "Al", mm2: 70, r20: 0.428, x: 0.35, iz: 265, install: "air", tMax: 70, k: 93, un: 20000 },
  { id: "sax-70", label: "SAX-W 70 (covered)", kind: "mv-covered", material: "Al", mm2: 70, r20: 0.443, x: 0.3, iz: 277, install: "air", tMax: 90, k: 94, un: 20000 },
  { id: "sax-150", label: "SAX-W 150 (covered)", kind: "mv-covered", material: "Al", mm2: 150, r20: 0.206, x: 0.28, iz: 430, install: "air", tMax: 90, k: 94, un: 20000 },
];

export const conductorOf = (id: string) => CONDUCTORS.find((c) => c.id === id);

/** Resistance corrected to conductor temperature t (°C). */
export const rAt = (c: Conductor, t: number) => c.r20 * (1 + ALPHA[c.material] * (t - 20));

/** Simplified IEC 60364-5-52 / IEC 60502 derating for buried cables (ground temp 15 °C, ρ 1.0 K·m/W ref.). */
export function derating(opts: { groundTemp?: number; soilRho?: number; grouped?: number; tMax?: number }) {
  const tMax = opts.tMax ?? 90;
  const fT = Math.sqrt((tMax - (opts.groundTemp ?? 15)) / (tMax - 15));
  const fRho = Math.sqrt(1 / Math.max(0.5, opts.soilRho ?? 1));
  const n = opts.grouped ?? 1;
  const fG = n <= 1 ? 1 : n === 2 ? 0.85 : n === 3 ? 0.75 : n <= 5 ? 0.68 : 0.6;
  return fT * fRho * fG;
}

/** Thermal short-circuit withstand: max fault duration (s) for current ik (A). */
export const maxFaultTime = (c: Conductor, ik: number) => ((c.k * c.mm2) / ik) ** 2;

/** Standard distribution transformers (IEC 60076 / EN 50588-1 Tier 2 typical). */
export const TRANSFORMERS = [
  { kva: 100, uk: 4, p0: 145, pk: 1250 },
  { kva: 160, uk: 4, p0: 210, pk: 1750 },
  { kva: 250, uk: 4, p0: 300, pk: 2350 },
  { kva: 400, uk: 4, p0: 387, pk: 3250 },
  { kva: 630, uk: 4, p0: 540, pk: 4800 },
  { kva: 800, uk: 6, p0: 585, pk: 6000 },
  { kva: 1000, uk: 6, p0: 693, pk: 7600 },
  { kva: 1600, uk: 6, p0: 1080, pk: 12000 },
] as const;

/** Maps scene cable sizes / aerial line types to catalogue conductors. */
export const SCENE_CONDUCTOR: Record<string, string> = {
  "70": "axmk-4x70", "95": "axmk-4x95", "120": "axmk-4x120", "240": "axmk-4x240",
  mv95: "ahxamk-95", mv150: "ahxamk-150", mv240: "ahxamk-240",
  "amka-25": "amka-3x25", "amka-50": "amka-3x50", "amka-70": "amka-3x70", "amka-120": "amka-3x120",
  "ac-35": "ac-35", "ac-50": "ac-50", "ac-70": "ac-70",
};
