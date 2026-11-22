/** Design rule checks (Phase 4 basics): voltage drop, loading, breaking capacity, thermal withstand. */
import type { LFResult } from "./loadflow";
import { conductorOf, maxFaultTime } from "./conductors";

export type Severity = "ok" | "warn" | "fail";
export type Finding = { element: string; rule: string; severity: Severity; message: string };

export const LIMITS = { dropWarnPct: 5, dropFailPct: 10, loadWarnPct: 80, loadFailPct: 100 };

export function checkLoadFlow(r: LFResult): Finding[] {
  const out: Finding[] = [];
  for (const [id, n] of Object.entries(r.nodes)) {
    const sev: Severity = n.dropPct > LIMITS.dropFailPct ? "fail" : n.dropPct > LIMITS.dropWarnPct ? "warn" : "ok";
    if (sev !== "ok") out.push({ element: id, rule: "voltage-drop", severity: sev, message: `Voltage drop ${n.dropPct.toFixed(1)} %` });
  }
  for (const [id, b] of Object.entries(r.branches)) {
    const sev: Severity = b.loadingPct > LIMITS.loadFailPct ? "fail" : b.loadingPct > LIMITS.loadWarnPct ? "warn" : "ok";
    if (sev !== "ok") out.push({ element: id, rule: "loading", severity: sev, message: `Loading ${b.loadingPct.toFixed(0)} %` });
  }
  return out;
}

export const checkBreaking = (element: string, ratedKA: number, ikMaxA: number): Finding | null =>
  ratedKA * 1000 >= ikMaxA ? null : { element, rule: "breaking-capacity", severity: "fail", message: `Ik ${(ikMaxA / 1000).toFixed(1)} kA > rated ${ratedKA} kA` };

export function checkThermal(element: string, conductor: string, ikA: number, clearS: number): Finding | null {
  const cd = conductorOf(conductor);
  if (!cd) return null;
  const tMax = maxFaultTime(cd, ikA);
  return clearS <= tMax ? null : { element, rule: "thermal-withstand", severity: "fail", message: `Clearing ${clearS} s > withstand ${tMax.toFixed(2)} s` };
}
