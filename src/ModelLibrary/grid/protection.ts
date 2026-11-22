/** Protection devices and time–current curves (Phase 3). Times in seconds, currents in A. */
export type CurveKind = "SI" | "VI" | "EI" | "LTI" | "DT";
const IEC: Record<Exclude<CurveKind, "DT">, [number, number]> = { SI: [0.14, 0.02], VI: [13.5, 1], EI: [80, 2], LTI: [120, 1] };

/** IEC 60255-151 inverse curve: t = TMS·k / ((I/Is)^α − 1). */
export function relayTime(kind: CurveKind, is: number, tms: number, i: number, dt = 0.5): number {
  if (i <= is) return Infinity;
  if (kind === "DT") return dt;
  const [k, a] = IEC[kind];
  return (tms * k) / ((i / is) ** a - 1);
}

export type Device =
  | { id: string; type: "relay"; curve: CurveKind; is: number; tms: number; iInst?: number; tInst?: number }
  | { id: string; type: "mcb"; char: "B" | "C" | "D"; in: number }
  | { id: string; type: "fuse"; in: number };

/** Approximate gG fuse (IEC 60269): t ≈ (k·In / I)^n, with 5 s at ~4.4·In (small fuses ~5·In). */
const fuseTime = (inA: number, i: number) => (i <= 1.25 * inA ? Infinity : Math.max(0.004, 5 * ((4.4 * inA) / i) ** 4.2));
/** MCB (IEC 60898): thermal region ≈ 1.45·In in 3600 s, magnetic instant at 5/10/20·In. */
function mcbTime(char: "B" | "C" | "D", inA: number, i: number) {
  const mag = { B: 5, C: 10, D: 20 }[char] * inA;
  if (i >= mag) return 0.01;
  if (i <= 1.13 * inA) return Infinity;
  return Math.min(3600, 40 * (inA / (i - inA)) ** 2);
}

export function tripTime(d: Device, i: number): number {
  if (d.type === "fuse") return fuseTime(d.in, i);
  if (d.type === "mcb") return mcbTime(d.char, d.in, i);
  if (d.iInst && i >= d.iInst) return d.tInst ?? 0.05;
  return relayTime(d.curve, d.is, d.tms, i);
}

/** Selectivity: downstream must trip faster than upstream by margin (s) over [iMin, iMax]. */
export function selectivity(up: Device, down: Device, iMin: number, iMax: number, margin = 0.2) {
  let worst = Infinity, at = iMin;
  for (let k = 0; k <= 40; k++) {
    const i = iMin * (iMax / iMin) ** (k / 40);
    const td = tripTime(down, i), tu = tripTime(up, i);
    if (!isFinite(td)) continue;
    const gap = tu - td;
    if (gap < worst) { worst = gap; at = i; }
  }
  return { selective: worst >= margin, worstMargin: worst, atCurrent: at };
}

/** Auto-reclose sequence for a fault: returns event log; permanent faults lock out. */
export function autoReclose(opts: { shots: number; deadTimes: number[]; permanent: boolean; clearAfterShot?: number }) {
  const log: string[] = ["Trip"];
  for (let s = 1; s <= opts.shots; s++) {
    log.push(`Dead time ${opts.deadTimes[s - 1] ?? opts.deadTimes.at(-1) ?? 1} s`, `Reclose ${s}`);
    if (!opts.permanent && (opts.clearAfterShot ?? 1) <= s) { log.push("Fault cleared — in service"); return { lockout: false, log }; }
    log.push("Trip");
  }
  log.push("Lockout");
  return { lockout: true, log };
}

/** FLISR on an open-point ring: sections 0..n-1 between source A and B; isolates faulted section, restores others. */
export function flisr(sections: number, faulted: number) {
  return {
    isolate: [faulted],
    fedFromA: Array.from({ length: faulted }, (_, k) => k),
    fedFromB: Array.from({ length: sections - faulted - 1 }, (_, k) => faulted + 1 + k),
  };
}
