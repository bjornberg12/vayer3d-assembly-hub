/**
 * Meshed balanced power flow (per-phase equivalent), current-injection method:
 * repeatedly solves Y·V = I(V) with constant-power PQ loads/generators.
 * Works for rings and meshed networks; generators (PV, storage) are negative loads.
 */
import { conductorOf, rAt } from "./conductors";

type C = { re: number; im: number };
const c = (re: number, im = 0): C => ({ re, im });
const add = (a: C, b: C) => c(a.re + b.re, a.im + b.im);
const sub = (a: C, b: C) => c(a.re - b.re, a.im - b.im);
const mul = (a: C, b: C) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a: C, b: C) => { const d = b.re * b.re + b.im * b.im; return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const conj = (a: C) => c(a.re, -a.im);
const abs = (a: C) => Math.hypot(a.re, a.im);

export type PFBus = { id: string; slack?: boolean; p?: number; q?: number; genP?: number; genQ?: number }; // W/var 3-phase
export type PFBranch = { id: string; from: string; to: string; conductor: string; lengthM: number; tempC?: number; parallel?: number };
export type PFResult = {
  converged: boolean; iterations: number;
  buses: Record<string, { u: number; angleDeg: number; dropPct: number }>;
  branches: Record<string, { i: number; loadingPct: number; lossW: number; pFromW: number }>;
  totalLossW: number; slackPW: number; reverseFlow: boolean;
};

function solve(A: C[][], b: C[]): C[] {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]!]);
  for (let k = 0; k < n; k++) {
    let p = k; for (let i = k + 1; i < n; i++) if (abs(M[i]![k]!) > abs(M[p]![k]!)) p = i;
    [M[k], M[p]] = [M[p]!, M[k]!];
    const piv = M[k]![k]!; if (abs(piv) < 1e-15) throw new Error("Network is not connected to the slack bus");
    for (let i = k + 1; i < n; i++) { const f = div(M[i]![k]!, piv); for (let j = k; j <= n; j++) M[i]![j] = sub(M[i]![j]!, mul(f, M[k]![j]!)); }
  }
  const x: C[] = Array(n).fill(c(0));
  for (let i = n - 1; i >= 0; i--) { let s = M[i]![n]!; for (let j = i + 1; j < n; j++) s = sub(s, mul(M[i]![j]!, x[j]!)); x[i] = div(s, M[i]![i]!); }
  return x;
}

export function meshedPowerFlow(un: number, buses: PFBus[], branches: PFBranch[], tol = 1e-6, maxIt = 60): PFResult {
  const slack = buses.find((b) => b.slack); if (!slack) throw new Error("No slack bus");
  const pq = buses.filter((b) => !b.slack); const idx = new Map(pq.map((b, i) => [b.id, i]));
  const n = pq.length; const uPh = un / Math.sqrt(3);
  const Y: C[][] = Array.from({ length: n }, () => Array(n).fill(c(0)));
  const ys = Array(n).fill(c(0)) as C[]; // admittance to slack
  const zOf = new Map<string, C>();
  for (const br of branches) {
    const cd = conductorOf(br.conductor); if (!cd) throw new Error(`Unknown conductor ${br.conductor}`);
    const k = br.parallel ?? 1;
    const z = c((rAt(cd, br.tempC ?? 20) * br.lengthM) / 1000 / k, (cd.x * br.lengthM) / 1000 / k);
    zOf.set(br.id, z); const y = div(c(1), z);
    const a = idx.get(br.from), b = idx.get(br.to);
    if (a !== undefined) Y[a]![a] = add(Y[a]![a]!, y);
    if (b !== undefined) Y[b]![b] = add(Y[b]![b]!, y);
    if (a !== undefined && b !== undefined) { Y[a]![b] = sub(Y[a]![b]!, y); Y[b]![a] = sub(Y[b]![a]!, y); }
    else if (a !== undefined) ys[a] = add(ys[a]!, y); else if (b !== undefined) ys[b] = add(ys[b]!, y);
  }
  let v: C[] = pq.map(() => c(uPh)); let it = 0, converged = false;
  while (it++ < maxIt) {
    const rhs = pq.map((bus, i) => {
      const s = c(((bus.p ?? 0) - (bus.genP ?? 0)) / 3, ((bus.q ?? 0) - (bus.genQ ?? 0)) / 3);
      return sub(mul(ys[i]!, c(uPh)), conj(div(s, v[i]!)));
    });
    const nv = n ? solve(Y, rhs) : [];
    const d = Math.max(0, ...nv.map((x, i) => abs(sub(x, v[i]!))));
    v = nv; if (d < tol * uPh) { converged = true; break; }
  }
  const V = (id: string) => (id === slack.id ? c(uPh) : v[idx.get(id)!]!);
  const res: PFResult = { converged, iterations: it, buses: {}, branches: {}, totalLossW: 0, slackPW: 0, reverseFlow: false };
  for (const b of buses) { const x = V(b.id); const u = abs(x) * Math.sqrt(3); res.buses[b.id] = { u, angleDeg: (Math.atan2(x.im, x.re) * 180) / Math.PI, dropPct: ((un - u) / un) * 100 }; }
  for (const br of branches) {
    const z = zOf.get(br.id)!; const i = div(sub(V(br.from), V(br.to)), z); const ia = abs(i);
    const cd = conductorOf(br.conductor)!; const lossW = 3 * ia * ia * z.re;
    const pFromW = 3 * mul(V(br.from), conj(i)).re;
    res.branches[br.id] = { i: ia, loadingPct: (ia / (cd.iz * (br.parallel ?? 1))) * 100, lossW, pFromW };
    res.totalLossW += lossW;
    if (br.from === slack.id) res.slackPW += pFromW; else if (br.to === slack.id) res.slackPW -= 3 * mul(V(br.to), conj(i)).re;
  }
  res.reverseFlow = res.slackPW < 0;
  return res;
}
