/**
 * Radial balanced load flow (backward/forward sweep, per-phase equivalent).
 * Nodes form a tree rooted at the slack (source) node. Loads are constant P/Q.
 */
import { conductorOf, rAt } from "./conductors";

export type LFNode = { id: string; parent?: string; p?: number; q?: number }; // W, var (3-phase)
export type LFBranch = { to: string; conductor: string; lengthM: number; tempC?: number };
export type LFResult = {
  converged: boolean;
  iterations: number;
  nodes: Record<string, { u: number; dropPct: number }>; // line-line V
  branches: Record<string, { i: number; loadingPct: number; lossW: number }>;
  totalLossW: number;
};

type C = { re: number; im: number };
const c = (re: number, im = 0): C => ({ re, im });
const add = (a: C, b: C) => c(a.re + b.re, a.im + b.im);
const sub = (a: C, b: C) => c(a.re - b.re, a.im - b.im);
const mul = (a: C, b: C) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const conj = (a: C) => c(a.re, -a.im);
const div = (a: C, b: C) => { const d = b.re * b.re + b.im * b.im; return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const abs = (a: C) => Math.hypot(a.re, a.im);

export function radialLoadFlow(un: number, nodes: LFNode[], branches: LFBranch[], tol = 1e-6, maxIt = 50): LFResult {
  const root = nodes.find((n) => !n.parent);
  if (!root) throw new Error("No slack node");
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const br = new Map(branches.map((b) => [b.to, b]));
  const children = new Map<string, string[]>();
  for (const n of nodes) if (n.parent) children.set(n.parent, [...(children.get(n.parent) ?? []), n.id]);
  const order: string[] = [];
  const walk = (id: string) => { order.push(id); for (const k of children.get(id) ?? []) walk(k); };
  walk(root.id);
  const z = new Map<string, C>();
  for (const id of order) {
    if (id === root.id) continue;
    const b = br.get(id); const cd = b && conductorOf(b.conductor);
    if (!b || !cd) throw new Error(`Branch to ${id} missing or unknown conductor`);
    z.set(id, c((rAt(cd, b.tempC ?? 20) * b.lengthM) / 1000, (cd.x * b.lengthM) / 1000));
  }
  const uPh = un / Math.sqrt(3);
  const v = new Map(order.map((id) => [id, c(uPh)]));
  const iBr = new Map<string, C>();
  let it = 0, converged = false;
  while (it++ < maxIt) {
    // backward: branch current = own load current + children
    for (const id of [...order].reverse()) {
      const n = byId.get(id)!;
      const s = c((n.p ?? 0) / 3, (n.q ?? 0) / 3);
      let i = conj(div(s, v.get(id)!));
      for (const k of children.get(id) ?? []) i = add(i, iBr.get(k)!);
      iBr.set(id, i);
    }
    let dmax = 0;
    for (const id of order) {
      if (id === root.id) continue;
      const nv = sub(v.get(byId.get(id)!.parent!)!, mul(z.get(id)!, iBr.get(id)!));
      dmax = Math.max(dmax, abs(sub(nv, v.get(id)!)));
      v.set(id, nv);
    }
    if (dmax < tol) { converged = true; break; }
  }
  const res: LFResult = { converged, iterations: it, nodes: {}, branches: {}, totalLossW: 0 };
  for (const id of order) {
    const u = abs(v.get(id)!) * Math.sqrt(3);
    res.nodes[id] = { u, dropPct: ((un - u) / un) * 100 };
    if (id === root.id) continue;
    const i = abs(iBr.get(id)!);
    const cd = conductorOf(br.get(id)!.conductor)!;
    const lossW = 3 * i * i * z.get(id)!.re;
    res.branches[id] = { i, loadingPct: (i / cd.iz) * 100, lossW };
    res.totalLossW += lossW;
  }
  return res;
}

/** Velander coincidence: peak kW for n households with annual energy each (kWh). */
export const velanderPeakKW = (n: number, kWhEach: number, k1 = 0.00029, k2 = 0.04) => {
  const w = n * kWhEach;
  return k1 * w + k2 * Math.sqrt(w);
};
