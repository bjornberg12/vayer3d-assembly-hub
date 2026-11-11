/** IEC 60909 equivalent-voltage-source short-circuit calculation (radial path). */
export type Z = { r: number; x: number };
export const zAdd = (...zs: Z[]): Z => zs.reduce((a, b) => ({ r: a.r + b.r, x: a.x + b.x }), { r: 0, x: 0 });
export const zAbs = (z: Z) => Math.hypot(z.r, z.x);

/** External grid: short-circuit power Sk" (VA) and X/R at nominal voltage Un (V). */
export function gridImpedance(skVA: number, xr: number, un: number, c = 1.1): Z {
  const zq = (c * un * un) / skVA;
  const r = zq / Math.sqrt(1 + xr * xr);
  return { r, x: r * xr };
}

/** Transformer referred to LV side: rated Sr (VA), uk %, ukr % (copper losses), LV Un (V). */
export function transformerImpedance(sr: number, ukPct: number, urPct: number, un: number): Z {
  const z = ((ukPct / 100) * un * un) / sr;
  const r = ((urPct / 100) * un * un) / sr;
  return { r, x: Math.sqrt(Math.max(z * z - r * r, 0)) };
}

/** Cable/line: per-km r, x (Ω/km) and length (m). */
export const lineImpedance = (rKm: number, xKm: number, lengthM: number): Z => ({
  r: (rKm * lengthM) / 1000,
  x: (xKm * lengthM) / 1000,
});

/** Initial symmetrical 3-phase short-circuit current Ik" and peak current ip. */
export function shortCircuit3ph(un: number, z: Z, c = 1.1) {
  const ik = (c * un) / (Math.sqrt(3) * zAbs(z));
  const rx = z.x > 0 ? z.r / z.x : 10;
  const kappa = 1.02 + 0.98 * Math.exp(-3 * rx);
  return { ik, ip: kappa * Math.SQRT2 * ik, kappa };
}

/** Percentage voltage drop for a 3-phase feeder at current I and power factor cosφ. */
export function voltageDropPct(un: number, i: number, z: Z, cosPhi = 0.9) {
  const sin = Math.sqrt(1 - cosPhi * cosPhi);
  return ((Math.sqrt(3) * i * (z.r * cosPhi + z.x * sin)) / un) * 100;
}

/** Breaking capacity check: device rating (A) must be ≥ fault current. */
export const breakingCapacityOk = (icuA: number, ikA: number) => icuA >= ikA;
