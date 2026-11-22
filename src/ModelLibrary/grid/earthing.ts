/** Earthing screening: electrodes, earth potential rise and touch voltage (IEC/EN 50522 style). */
export type NeutralEarthing = "solid" | "resistance" | "petersen" | "isolated";

/** Single vertical rod: R = ρ/(2πL)·(ln(8L/d) − 1). */
export const rodResistance = (rho: number, lengthM: number, diamM = 0.016) => (rho / (2 * Math.PI * lengthM)) * (Math.log((8 * lengthM) / diamM) - 1);
/** n rods in parallel with spacing utilisation factor η (0..1). */
export const rodsParallel = (rRod: number, n: number, eta = 0.8) => rRod / (n * eta);
/** Ring/mesh electrode (Sverak): R = ρ[1/L + 1/√(20A)(1 + 1/(1 + h√(20/A)))]. */
export const meshResistance = (rho: number, areaM2: number, totalLengthM: number, depthM = 0.6) =>
  rho * (1 / totalLengthM + (1 / Math.sqrt(20 * areaM2)) * (1 + 1 / (1 + depthM * Math.sqrt(20 / areaM2))));

/** Earth-fault current into ground for MV neutral treatments (A). c0 = phase-earth capacitance (F) of the galvanic network. */
export function earthFaultCurrent(kind: NeutralEarthing, unV: number, opts: { c0F?: number; rnOhm?: number; solidA?: number; detuning?: number; residualPct?: number } = {}) {
  const uPh = unV / Math.sqrt(3); const ic = 3 * 2 * Math.PI * 50 * (opts.c0F ?? 0) * uPh;
  if (kind === "isolated") return ic;
  if (kind === "petersen") { const det = opts.detuning ?? 0.05; const ir = (opts.residualPct ?? 5) / 100 * ic; return Math.hypot(ir, det * ic); }
  if (kind === "resistance") { const ir = uPh / (opts.rnOhm ?? 1e9); return Math.hypot(ir, ic); }
  return opts.solidA ?? 0;
}

/** Permissible touch voltage U_TP versus fault duration (IEC/EN 50522 Figure 4, log interpolation). */
const UTP: [number, number][] = [[0.05, 716], [0.1, 654], [0.2, 537], [0.5, 220], [1, 117], [2, 96], [5, 86], [10, 85]];
export function permissibleTouchVoltage(tS: number) {
  if (tS <= UTP[0]![0]) return UTP[0]![1];
  for (let i = 1; i < UTP.length; i++) {
    const [t0, u0] = UTP[i - 1]!, [t1, u1] = UTP[i]!;
    if (tS <= t1) { const f = (Math.log(tS) - Math.log(t0)) / (Math.log(t1) - Math.log(t0)); return u0 + f * (u1 - u0); }
  }
  return UTP[UTP.length - 1]![1];
}

/** EPR check: pass when EPR ≤ 2·U_TP (EN 50522 simplified criterion) or touch estimate ≤ U_TP. */
export function earthingCheck(rEarth: number, iEarthA: number, faultTimeS: number, touchFactor = 0.3, reduction = 1) {
  const epr = rEarth * iEarthA * reduction; const utp = permissibleTouchVoltage(faultTimeS);
  const uTouch = epr * touchFactor;
  return { epr, utp, uTouch, pass: epr <= 2 * utp || uTouch <= utp };
}
