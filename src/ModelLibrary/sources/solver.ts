/**
 * First-step circuit solver: for every voltage source, find the lowest-resistance
 * wire loop between its terminals (DC+→DC−, each phase→N) and compute I = V / R_loop.
 * Components without internal paths are treated as open circuits.
 */
export type SolverWire = { id: string; a: string; b: string; r: number };
export type SolverSource = { id: string; kind: string; voltage: number; internalR: number };
export type LoopResult = { from: string; to: string; voltage: number; resistance: number; current: number; wires: string[] };

function shortestPath(wires: SolverWire[], start: string, goal: string): { r: number; wires: string[] } | null {
  const adj = new Map<string, { to: string; w: SolverWire }[]>();
  for (const w of wires) {
    if (!adj.has(w.a)) adj.set(w.a, []);
    if (!adj.has(w.b)) adj.set(w.b, []);
    adj.get(w.a)!.push({ to: w.b, w });
    adj.get(w.b)!.push({ to: w.a, w });
  }
  const dist = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, { node: string; wire: string }>();
  const open = new Set([start]);
  const done = new Set<string>();
  while (open.size) {
    let cur = "", best = Infinity;
    for (const n of open) { const d = dist.get(n)!; if (d < best) { best = d; cur = n; } }
    open.delete(cur);
    if (cur === goal) break;
    done.add(cur);
    for (const { to, w } of adj.get(cur) ?? []) {
      if (done.has(to)) continue;
      const nd = best + w.r;
      if (nd < (dist.get(to) ?? Infinity)) { dist.set(to, nd); prev.set(to, { node: cur, wire: w.id }); open.add(to); }
    }
  }
  if (!dist.has(goal)) return null;
  const path: string[] = [];
  let n = goal;
  while (n !== start) { const p = prev.get(n)!; path.push(p.wire); n = p.node; }
  return { r: dist.get(goal)!, wires: path };
}

export function solveCircuits(sources: SolverSource[], wires: SolverWire[]) {
  const wireCurrent: Record<string, number> = {};
  const loops: Record<string, LoopResult[]> = {};
  for (const s of sources) {
    const pairs: [string, string, number][] =
      s.kind === "DC"
        ? [["dcp", "dcn", s.voltage]]
        : (["l1", "l2", "l3"] as const).map((p) => [p, "n", s.voltage / Math.sqrt(3)]);
    loops[s.id] = [];
    for (const [a, b, v] of pairs) {
      const path = shortestPath(wires, `${s.id}#${a}`, `${s.id}#${b}`);
      if (!path) continue;
      const r = path.r + (s.kind === "DC" ? s.internalR : 0);
      const i = r > 0 ? v / r : Infinity;
      loops[s.id].push({ from: a, to: b, voltage: v, resistance: r, current: i, wires: path.wires });
      for (const wid of path.wires) wireCurrent[wid] = (wireCurrent[wid] ?? 0) + i;
    }
  }
  return { wireCurrent, loops };
}
