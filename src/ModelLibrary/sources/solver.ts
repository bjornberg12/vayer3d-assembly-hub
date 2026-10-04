/**
 * Circuit solver — complex modified nodal analysis (MNA).
 * Nodes are pin end ids ("owner#pin"); branches are wires and component loads
 * (resistive equivalents R = V²/P) plus near-zero internal busbars.
 * DC sources are ideal sources with series internal resistance; AC sources are
 * three phasors (V_LL/√3 at 0°, −120°, +120°) referenced to N. One solve covers DC and AC.
 */
export type SolverWire = { id: string; a: string; b: string; r: number };
export type SolverSource = { id: string; kind: string; voltage: number; internalR: number };
export type SolverLoad = { owner: string; a: string; b: string; r: number; ratedV: number };
export type LoopResult = { from: string; to: string; voltage: number; resistance: number; current: number; wires: string[] };
export type SolverTransformer = { id: string; ratio: number; rSec: number; vector: "Dyn11" | "YNyn0"; ratedVA: number };
export type TransformerStatus = { primaryV: number; secondaryV: number; currents: number[]; loadVA: number; loadPct: number };
export type PartStatus = { state: "on" | "low" | "over" | "off"; voltage: number; current: number; powerW: number; ratedV: number };

type C = [number, number];
const add = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]];
const sub = (a: C, b: C): C => [a[0] - b[0], a[1] - b[1]];
const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const div = (a: C, b: C): C => { const d = b[0] * b[0] + b[1] * b[1] || 1e-300; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const abs = (a: C) => Math.hypot(a[0], a[1]);
const polar = (m: number, deg: number): C => [m * Math.cos((deg * Math.PI) / 180), m * Math.sin((deg * Math.PI) / 180)];

function solveLinear(A: C[][], b: C[]): C[] | null {
  const n = b.length;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (abs(A[r][c]) > abs(A[p][c])) p = r;
    if (abs(A[p][c]) < 1e-18) return null;
    [A[c], A[p]] = [A[p], A[c]];
    [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < n; r++) {
      const f = div(A[r][c], A[c][c]);
      if (f[0] === 0 && f[1] === 0) continue;
      for (let k = c; k < n; k++) A[r][k] = sub(A[r][k], mul(f, A[c][k]));
      b[r] = sub(b[r], mul(f, b[c]));
    }
  }
  const x: C[] = Array(n).fill([0, 0]);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s = sub(s, mul(A[r][k], x[k]));
    x[r] = div(s, A[r][r]);
  }
  return x;
}

function mna(sources: SolverSource[], wires: SolverWire[], loads: SolverLoad[], tfs: SolverTransformer[] = []) {
  const idx = new Map<string, number>();
  const node = (id: string) => { if (!idx.has(id)) idx.set(id, idx.size); return idx.get(id)!; };
  const branches: { a: number; b: number; g: number }[] = [];
  for (const w of wires) branches.push({ a: node(w.a), b: node(w.b), g: 1 / Math.max(w.r, 1e-6) });
  for (const l of loads) branches.push({ a: node(l.a), b: node(l.b), g: 1 / Math.max(l.r, 1e-6) });
  const vs: { p: number; n: number; v: C; src: string; from: string; to: string; mag: number }[] = [];
  for (const s of sources) {
    if (s.kind === "DC") {
      const inner = node(`${s.id}#__int`);
      branches.push({ a: inner, b: node(`${s.id}#dcp`), g: 1 / Math.max(s.internalR, 1e-6) });
      vs.push({ p: inner, n: node(`${s.id}#dcn`), v: [s.voltage, 0], src: s.id, from: "dcp", to: "dcn", mag: s.voltage });
    } else {
      const vph = s.voltage / Math.sqrt(3);
      for (const [ph, ang] of [["l1", 0], ["l2", -120], ["l3", 120]] as const)
        vs.push({ p: node(`${s.id}#${ph}`), n: node(`${s.id}#n`), v: polar(vph, ang), src: s.id, from: ph, to: "n", mag: vph });
    }
  }
  // Ideal transformer windings (one coupled pair per phase) + LV series impedance.
  const tw: { p: number; q: number; s: number; t: number; n: number }[] = [];
  const tfSec: { tf: string; inner: number; pin: number; g: number }[] = [];
  for (const t of tfs) {
    for (let k = 0; k < 3; k++) {
      const h = `${t.id}#h${k + 1}`, h2 = t.vector === "Dyn11" ? `${t.id}#h${((k + 1) % 3) + 1}` : `${t.id}#hn`;
      const inner = node(`${t.id}#__x${k + 1}`), pin = node(`${t.id}#x${k + 1}`);
      const g = 1 / Math.max(t.rSec, 1e-6);
      branches.push({ a: inner, b: pin, g });
      tfSec.push({ tf: t.id, inner, pin, g });
      tw.push({ p: node(h), q: node(h2), s: inner, t: node(`${t.id}#xn`), n: t.ratio });
    }
  }
  const N = idx.size, M = vs.length, size = N + M + tw.length;
  if (M === 0) return null;
  const A: C[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => [0, 0] as C));
  const b: C[] = Array.from({ length: size }, () => [0, 0] as C);
  for (let i = 0; i < N; i++) A[i][i] = [1e-9, 0]; // tiny leak keeps floating parts solvable
  for (const br of branches) {
    A[br.a][br.a] = add(A[br.a][br.a], [br.g, 0]);
    A[br.b][br.b] = add(A[br.b][br.b], [br.g, 0]);
    A[br.a][br.b] = sub(A[br.a][br.b], [br.g, 0]);
    A[br.b][br.a] = sub(A[br.b][br.a], [br.g, 0]);
  }
  vs.forEach((s, k) => {
    const r = N + k;
    A[s.p][r] = add(A[s.p][r], [1, 0]); A[s.n][r] = sub(A[s.n][r], [1, 0]);
    A[r][s.p] = add(A[r][s.p], [1, 0]); A[r][s.n] = sub(A[r][s.n], [1, 0]);
    b[r] = s.v;
  });
  tw.forEach((w, k) => {
    const r = N + M + k;
    A[w.p][r] = add(A[w.p][r], [1, 0]); A[w.q][r] = sub(A[w.q][r], [1, 0]);
    A[w.s][r] = sub(A[w.s][r], [w.n, 0]); A[w.t][r] = add(A[w.t][r], [w.n, 0]);
    A[r][w.p] = add(A[r][w.p], [1, 0]); A[r][w.q] = sub(A[r][w.q], [1, 0]);
    A[r][w.s] = sub(A[r][w.s], [w.n, 0]); A[r][w.t] = add(A[r][w.t], [w.n, 0]);
  });
  const x = solveLinear(A, b);
  if (!x) return null;
  return {
    tfSec: tfSec.map((t) => ({ tf: t.tf, i: abs(mul(sub(x[t.inner], x[t.pin]), [t.g, 0])) })), V: (id: string): C => (idx.has(id) ? x[idx.get(id)!] : [0, 0]), vs: vs.map((s, k) => ({ ...s, i: abs(x[N + k]) })) };
}

/** DC and AC are solved separately (superposition) so each wire knows which kind it carries. */
export function solveCircuits(sources: SolverSource[], wires: SolverWire[], loads: SolverLoad[] = [], tfs: SolverTransformer[] = []) {
  const dc = mna(sources.filter((s) => s.kind === "DC"), wires, loads);
  const ac = mna(sources.filter((s) => s.kind !== "DC"), wires, loads, tfs);
  const transformerStatus: Record<string, TransformerStatus> = {};
  for (const t of tfs) {
    const V = (pin: string) => ac?.V(`${t.id}#${pin}`) ?? ([0, 0] as C);
    const currents = (ac?.tfSec ?? []).filter((s) => s.tf === t.id).map((s) => s.i);
    const vph = [1, 2, 3].map((k) => abs(sub(V(`x${k}`), V("xn"))));
    const loadVA = currents.reduce((acc, i, k) => acc + i * vph[k], 0);
    transformerStatus[t.id] = {
      primaryV: abs(sub(V("h1"), V("h2"))), secondaryV: abs(sub(V("x1"), V("x2"))),
      currents, loadVA, loadPct: (loadVA / Math.max(t.ratedVA, 1)) * 100,
    };
  }
  const wireCurrent: Record<string, number> = {};
  const wireFlow: Record<string, { dir: number; ac: boolean; phaseDeg: number }> = {};
  for (const w of wires) {
    const r: C = [Math.max(w.r, 1e-6), 0];
    const idc = dc ? div(sub(dc.V(w.a), dc.V(w.b)), r) : ([0, 0] as C);
    const iac = ac ? div(sub(ac.V(w.a), ac.V(w.b)), r) : ([0, 0] as C);
    const mdc = abs(idc), mac = abs(iac);
    if (mdc + mac < 1e-6) continue;
    wireCurrent[w.id] = mdc + mac;
    wireFlow[w.id] = mac > mdc
      ? { dir: 1, ac: true, phaseDeg: (Math.atan2(iac[1], iac[0]) * 180) / Math.PI }
      : { dir: idc[0] >= 0 ? 1 : -1, ac: false, phaseDeg: 0 };
  }
  const loops: Record<string, LoopResult[]> = {};
  for (const s of sources) loops[s.id] = [];
  for (const s of [...(dc?.vs ?? []), ...(ac?.vs ?? [])])
    if (s.i > 1e-6) loops[s.src].push({ from: s.from, to: s.to, voltage: s.mag, resistance: s.mag / s.i, current: s.i, wires: [] });
  const partStatus: Record<string, PartStatus> = {};
  for (const l of loads) {
    const dv = abs(sub(dc?.V(l.a) ?? [0, 0], dc?.V(l.b) ?? [0, 0])) + abs(sub(ac?.V(l.a) ?? [0, 0], ac?.V(l.b) ?? [0, 0]));
    const cur = dv / Math.max(l.r, 1e-6);
    const st = partStatus[l.owner] ?? { state: "off", voltage: 0, current: 0, powerW: 0, ratedV: l.ratedV };
    st.powerW += dv * cur;
    if (dv / l.ratedV > st.voltage / st.ratedV) { st.voltage = dv; st.ratedV = l.ratedV; }
    st.current = Math.max(st.current, cur);
    partStatus[l.owner] = st;
  }
  for (const st of Object.values(partStatus)) {
    const ratio = st.voltage / Math.max(st.ratedV, 1e-6);
    st.state = ratio < 0.05 ? "off" : ratio < 0.85 ? "low" : ratio > 1.15 ? "over" : "on";
  }
  return { wireCurrent, loops, wireFlow, partStatus, transformerStatus };
}
