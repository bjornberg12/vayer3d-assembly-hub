/** IEC 60909 equivalent-voltage-source short-circuit calculations. */
export type Z = { r: number; x: number };
export const zAdd = (...zs: Z[]): Z =>
  zs.reduce((a, b) => ({ r: a.r + b.r, x: a.x + b.x }), { r: 0, x: 0 });
export const zAbs = (z: Z) => Math.hypot(z.r, z.x);
export const zMul = (z: Z, n: number): Z => ({ r: z.r * n, x: z.x * n });

/** External grid: short-circuit power Sk" (VA) and X/R at nominal voltage Un (V). */
export function gridImpedance(skVA: number, xr: number, un: number, c = 1.1): Z {
  const zq = (c * un * un) / Math.max(skVA, 1);
  const r = zq / Math.sqrt(1 + xr * xr);
  return { r, x: r * xr };
}

/** Transformer referred to LV side: rated Sr (VA), uk %, ukr % (copper losses), LV Un (V). */
export function transformerImpedance(sr: number, ukPct: number, urPct: number, un: number): Z {
  const z = ((ukPct / 100) * un * un) / Math.max(sr, 1);
  const r = ((urPct / 100) * un * un) / Math.max(sr, 1);
  return { r, x: Math.sqrt(Math.max(z * z - r * r, 0)) };
}

/** Cable/line: per-km r, x (Ω/km) and length (m). */
export const lineImpedance = (rKm: number, xKm: number, lengthM: number): Z => ({
  r: (rKm * lengthM) / 1000,
  x: (xKm * lengthM) / 1000,
});

/** Initial symmetrical 3-phase short-circuit current Ik" and peak current ip. */
export function shortCircuit3ph(un: number, z: Z, c = 1.1) {
  const ik = (c * un) / (Math.sqrt(3) * Math.max(zAbs(z), 1e-12));
  const rx = z.x > 0 ? z.r / z.x : 10;
  const kappa = 1.02 + 0.98 * Math.exp(-3 * rx);
  return { ik, ip: kappa * Math.SQRT2 * ik, kappa };
}

/** IEC 60909 voltage factors for maximum and minimum fault-current studies. */
export const voltageFactor = (un: number, range: "max" | "min") =>
  un <= 1000 ? (range === "max" ? 1.05 : 0.95) : range === "max" ? 1.1 : 1;

export type FaultType = "3ph" | "ll" | "lg" | "llg";
export const FAULT_TYPE_LABEL: Record<FaultType, string> = {
  "3ph": "Three-phase (3φ)",
  ll: "Line-to-line (L-L)",
  lg: "Single-phase to earth (L-E)",
  llg: "Double line-to-earth (L-L-E)",
};

export type FaultInput = {
  un: number;
  z1: Z;
  z2?: Z;
  z0?: Z;
  type: FaultType;
  c?: number;
  faultR?: number;
  frequency?: number;
};

export type FaultResult = {
  type: FaultType;
  un: number;
  c: number;
  ik: number;
  ip: number;
  kappa: number;
  ib: number;
  dcTimeConstantS: number;
  phaseA: [number, number, number];
  sequenceA: { i0: number; i1: number; i2: number };
  residualA: number;
  groundA: number;
  i2t: (clearingS: number) => number;
  z1: Z;
  z2: Z;
  z0: Z;
};

const add = (a: Z, b: Z): Z => ({ r: a.r + b.r, x: a.x + b.x });
const mul = (a: Z, b: Z): Z => ({ r: a.r * b.r - a.x * b.x, x: a.r * b.x + a.x * b.r });
const scale = (a: Z, n: number): Z => ({ r: a.r * n, x: a.x * n });
const div = (a: Z, b: Z): Z => {
  const d = Math.max(b.r * b.r + b.x * b.x, 1e-24);
  return { r: (a.r * b.r + a.x * b.x) / d, x: (a.x * b.r - a.r * b.x) / d };
};
const parallel = (a: Z, b: Z) => div(mul(a, b), add(a, b));
const A = { r: -0.5, x: Math.sqrt(3) / 2 };
const A2 = { r: -0.5, x: -Math.sqrt(3) / 2 };
const phaseSequence = (i0: Z, i1: Z, i2: Z): [Z, Z, Z] => [
  add(add(i0, i1), i2),
  add(add(i0, mul(A2, i1)), mul(A, i2)),
  add(add(i0, mul(A, i1)), mul(A2, i2)),
];

/**
 * Symmetrical-components fault calculation. Currents are primary RMS amperes.
 * z1/z2/z0 are per-phase Thévenin impedances at the fault point. The conservative
 * breaking current equals initial symmetrical current (no motor/generator decrement).
 */
export function calculateFault(input: FaultInput): FaultResult {
  const z1 = input.z1;
  const z2 = input.z2 ?? z1;
  const z0 = input.z0 ?? z1;
  const c = input.c ?? 1.1;
  const rf = Math.max(input.faultR ?? 0, 0);
  const e = { r: (c * input.un) / Math.sqrt(3), x: 0 };
  let i0: Z = { r: 0, x: 0 };
  let i1: Z = { r: 0, x: 0 };
  let i2: Z = { r: 0, x: 0 };

  if (input.type === "3ph") {
    i1 = div(e, add(z1, { r: rf, x: 0 }));
  } else if (input.type === "ll") {
    i1 = div(e, add(add(z1, z2), { r: rf, x: 0 }));
    i2 = scale(i1, -1);
  } else if (input.type === "lg") {
    i1 = div(e, add(add(add(z1, z2), z0), { r: 3 * rf, x: 0 }));
    i0 = i1;
    i2 = i1;
  } else {
    const zf0 = add(z0, { r: 3 * rf, x: 0 });
    i1 = div(e, add(z1, parallel(z2, zf0)));
    i2 = scale(div(mul(i1, zf0), add(z2, zf0)), -1);
    i0 = scale(div(mul(i1, z2), add(z2, zf0)), -1);
  }

  const phases = phaseSequence(i0, i1, i2);
  const phaseA = phases.map(zAbs) as [number, number, number];
  const ik = Math.max(...phaseA);
  const rx = z1.x > 0 ? z1.r / z1.x : 10;
  const kappa = 1.02 + 0.98 * Math.exp(-3 * rx);
  const frequency = Math.max(input.frequency ?? 50, 1);
  return {
    type: input.type,
    un: input.un,
    c,
    ik,
    ip: kappa * Math.SQRT2 * ik,
    kappa,
    ib: ik,
    dcTimeConstantS: z1.x / (2 * Math.PI * frequency * Math.max(z1.r, 1e-12)),
    phaseA,
    sequenceA: { i0: zAbs(i0), i1: zAbs(i1), i2: zAbs(i2) },
    residualA: zAbs(add(add(phases[0], phases[1]), phases[2])),
    groundA: 3 * zAbs(i0),
    i2t: (clearingS: number) => ik * ik * Math.max(clearingS, 0),
    z1,
    z2,
    z0,
  };
}

/** Percentage voltage drop for a 3-phase feeder at current I and power factor cosφ. */
export function voltageDropPct(un: number, i: number, z: Z, cosPhi = 0.9) {
  const sin = Math.sqrt(1 - cosPhi * cosPhi);
  return ((Math.sqrt(3) * i * (z.r * cosPhi + z.x * sin)) / un) * 100;
}

/** Breaking capacity check: device rating (A) must be ≥ fault current. */
export const breakingCapacityOk = (icuA: number, ikA: number) => icuA >= ikA;
