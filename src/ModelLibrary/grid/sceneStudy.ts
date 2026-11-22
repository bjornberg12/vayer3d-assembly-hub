/** Turns scene cables/lines into per-feeder study rows (load flow + rule checks). */
import { conductorOf, SCENE_CONDUCTOR, maxFaultTime } from "./conductors";
import { radialLoadFlow } from "./loadflow";
import { checkLoadFlow } from "./checks";
import type { ScheduleRow } from "./reports";

export type StudyLink = { id: string; from: string; to: string; sceneType: string; lengthM: number; loadKW: number; un?: number };
export type StudyRow = ScheduleRow & { thermalOk: boolean; withstandS: number; un: number };

export function studyLinks(links: StudyLink[], opts: { cosPhi: number; ikA: number; clearS: number; tempC: number }): StudyRow[] {
  const tan = Math.tan(Math.acos(opts.cosPhi));
  return links.map((l) => {
    const cid = SCENE_CONDUCTOR[l.sceneType];
    const cd = cid ? conductorOf(cid) : undefined;
    if (!cd) return { ...l, conductor: l.sceneType, currentA: 0, dropPct: 0, loadingPct: 0, status: "No engineering data", thermalOk: true, withstandS: 0, un: l.un ?? 400 };
    const un = l.un ?? cd.un;
    const p = l.loadKW * 1000;
    const r = radialLoadFlow(un, [{ id: "s" }, { id: "e", parent: "s", p, q: p * tan }], [{ to: "e", conductor: cd.id, lengthM: Math.max(l.lengthM, 0.1), tempC: opts.tempC }]);
    const f = checkLoadFlow(r);
    const withstandS = maxFaultTime(cd, opts.ikA);
    const thermalOk = opts.clearS <= withstandS;
    const fails = f.filter((x) => x.severity === "fail").length + (thermalOk ? 0 : 1);
    const status = fails ? `FAIL: ${[...f.filter((x) => x.severity === "fail").map((x) => x.message), ...(thermalOk ? [] : ["thermal withstand"])].join("; ")}` : f.length ? `WARN: ${f.map((x) => x.message).join("; ")}` : "OK";
    return { ...l, conductor: cd.label, currentA: r.branches["e"]!.i, dropPct: r.nodes["e"]!.dropPct, loadingPct: r.branches["e"]!.loadingPct, status, thermalOk, withstandS, un };
  });
}

/** Auto-sizing: smallest catalogue conductor of the same kind with no warnings (loading ≤ 80 %, drop ≤ 5 %, withstand). */
export function suggestConductor(sceneType: string, link: StudyLink, opts: { cosPhi: number; ikA: number; clearS: number; tempC: number }) {
  const cd = conductorOf(SCENE_CONDUCTOR[sceneType] ?? "");
  if (!cd) return null;
  const options = Object.entries(SCENE_CONDUCTOR).filter(([, c]) => conductorOf(c)?.kind === cd.kind).sort((a, b) => conductorOf(a[1])!.mm2 - conductorOf(b[1])!.mm2);
  for (const [st] of options) {
    const r = studyLinks([{ ...link, sceneType: st }], opts)[0]!;
    if (r.status === "OK") return st;
  }
  return null;
}
