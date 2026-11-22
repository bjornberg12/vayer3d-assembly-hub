/** Directional, distance and differential protection plus automatic overcurrent coordination (IEC terminology). */
export type Phasor = { mag: number; angleDeg: number };
const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

/** Directional overcurrent / directional earth fault: forward when the current lies within ±sector of (polarising voltage angle + characteristic angle). */
export function directionalDecision(vPol: Phasor, i: Phasor, characteristicAngleDeg: number, sectorDeg = 88) {
  const dev = wrap(i.angleDeg - (vPol.angleDeg - characteristicAngleDeg));
  return { deviationDeg: dev, direction: Math.abs(dev) <= sectorDeg ? ("forward" as const) : ("reverse" as const) };
}

export type DistanceSettings = { lineR: number; lineX: number; z1Pct: number; z2Pct: number; z3Pct: number; t2: number; t3: number };
export const defaultDistance = (lineR: number, lineX: number): DistanceSettings => ({ lineR, lineX, z1Pct: 80, z2Pct: 120, z3Pct: 200, t2: 0.3, t3: 0.8 });

/** Mho characteristic: circle through the origin with diameter = reach along the line angle. */
export function inMho(r: number, x: number, reach: number, angleRad: number) {
  const cr = (reach / 2) * Math.cos(angleRad), cx = (reach / 2) * Math.sin(angleRad);
  return Math.hypot(r - cr, x - cx) <= reach / 2 + 1e-12;
}

/** Distance protection: returns the zone and operate time for a measured fault impedance. */
export function distanceZone(s: DistanceSettings, zr: number, zx: number) {
  const zl = Math.hypot(s.lineR, s.lineX), ang = Math.atan2(s.lineX, s.lineR);
  const zones: [string, number, number][] = [["Zone 1", s.z1Pct, 0], ["Zone 2", s.z2Pct, s.t2], ["Zone 3", s.z3Pct, s.t3]];
  for (const [name, pct, t] of zones) if (inMho(zr, zx, (zl * pct) / 100, ang)) return { zone: name, timeS: t };
  return { zone: "No trip", timeS: Infinity };
}

export type DiffSettings = { is1: number; k1: number; is2: number; k2: number }; // per unit of rated current
export const defaultDiff: DiffSettings = { is1: 0.2, k1: 0.3, is2: 2, k2: 0.8 };

/** Biased (dual-slope) differential: currents entering the zone are positive. */
export function differentialTrip(s: DiffSettings, i1: Phasor, i2: Phasor) {
  const re = i1.mag * Math.cos(rad(i1.angleDeg)) + i2.mag * Math.cos(rad(i2.angleDeg));
  const im = i1.mag * Math.sin(rad(i1.angleDeg)) + i2.mag * Math.sin(rad(i2.angleDeg));
  const idiff = Math.hypot(re, im), ibias = (i1.mag + i2.mag) / 2;
  const threshold = ibias <= s.is2 ? Math.max(s.is1, s.k1 * ibias) : Math.max(s.is1, s.k1 * s.is2 + s.k2 * (ibias - s.is2));
  return { idiff, ibias, threshold, trip: idiff > threshold };
}

/** IEC standard inverse time. */
export const iecSI = (tms: number, i: number, is: number) => (i <= is ? Infinity : (tms * 0.14) / ((i / is) ** 0.02 - 1));

/** Upstream setting suggestion: pickup ≥ 1.2·max load (rounded to 5 A); TMS grading margin above the downstream time at max through-fault. */
export function suggestUpstream(maxLoadA: number, maxFaultA: number, downstreamTimeS: number, marginS = 0.3) {
  const pickupA = Math.ceil((1.2 * maxLoadA) / 5) * 5;
  const target = downstreamTimeS + marginS;
  const tms = Math.max(0.05, Math.ceil((target / iecSI(1, maxFaultA, pickupA)) * 100) / 100);
  return { pickupA, tms, timeS: iecSI(tms, maxFaultA, pickupA) };
}
