import { useMemo, useState } from "react";
import { Input } from "./ui/input";
import type { StudyLink } from "@/ModelLibrary/grid/sceneStudy";
import { SCENE_CONDUCTOR, conductorOf } from "@/ModelLibrary/grid/conductors";
import { meshedPowerFlow } from "@/ModelLibrary/grid/powerflow";
import { earthFaultCurrent, earthingCheck, type NeutralEarthing } from "@/ModelLibrary/grid/earthing";
import { electrodeResistance } from "@/ModelLibrary/distribution/EarthElectrode";
import { defaultDiff, defaultDistance, differentialTrip, directionalDecision, distanceZone, suggestUpstream } from "@/ModelLibrary/grid/protectionAdvanced";

const Num = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <label className="grid gap-1 text-xs text-muted-foreground">{label}
    <Input aria-label={label} type="number" step="any" value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8" />
  </label>
);
const SEL = "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground";

export function PowerFlowStudy({ links }: { links: StudyLink[] }) {
  const valid = links.filter((l) => conductorOf(SCENE_CONDUCTOR[l.sceneType] ?? ""));
  const busIds = [...new Set(valid.flatMap((l) => [l.from, l.to]))];
  const [slack, setSlack] = useState("");
  const [gen, setGen] = useState<Record<string, number>>({});
  const [cosPhi, setCos] = useState(0.95);
  const sb = busIds.includes(slack) ? slack : busIds[0] ?? "";
  const result = useMemo(() => {
    if (!sb) return null;
    const un = valid.find((l) => l.from === sb || l.to === sb)?.un ?? conductorOf(SCENE_CONDUCTOR[valid[0]!.sceneType]!)!.un;
    const same = valid.filter((l) => (l.un ?? conductorOf(SCENE_CONDUCTOR[l.sceneType]!)!.un) === un);
    const tan = Math.tan(Math.acos(cosPhi));
    const load: Record<string, number> = {};
    same.forEach((l) => { load[l.to] = (load[l.to] ?? 0) + l.loadKW * 1000; });
    const ids = [...new Set(same.flatMap((l) => [l.from, l.to]))];
    try {
      return { un, r: meshedPowerFlow(un, ids.map((id) => ({ id, slack: id === sb, p: load[id] ?? 0, q: (load[id] ?? 0) * tan, genP: (gen[id] ?? 0) * 1000 })),
        same.map((l) => ({ id: l.id, from: l.from, to: l.to, conductor: SCENE_CONDUCTOR[l.sceneType]!, lengthM: Math.max(l.lengthM, 0.1) }))) };
    } catch (e) { return { un, err: (e as Error).message }; }
  }, [JSON.stringify(valid), sb, JSON.stringify(gen), cosPhi]);
  if (!busIds.length) return <p className="text-xs text-muted-foreground">Draw cables or lines between objects to run a meshed power flow.</p>;
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-muted-foreground">Supply (slack) node
          <select className={SEL} value={sb} onChange={(e) => setSlack(e.target.value)}>{busIds.map((b) => <option key={b}>{b}</option>)}</select></label>
        <Num label="cos φ" value={cosPhi} onChange={(v) => setCos(Math.min(1, Math.max(0.5, v)))} />
      </div>
      {result && "err" in result && <p className="text-destructive">{result.err}</p>}
      {result && "r" in result && result.r && (
        <>
          <p>{result.r.converged ? "Converged" : "Not converged"} in {result.r.iterations} iterations · losses {(result.r.totalLossW / 1000).toFixed(2)} kW · supply {(result.r.slackPW / 1000).toFixed(1)} kW
            {result.r.reverseFlow && <b className="text-destructive"> · reverse power flow</b>}</p>
          <div className="max-h-64 space-y-1 overflow-auto">
            {Object.entries(result.r.buses).map(([id, b]) => (
              <div key={id} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-md border border-border p-2">
                <div><b>{id}</b> · U {b.u.toFixed(1)} V · {b.angleDeg.toFixed(2)}° · ΔU <span className={Math.abs(b.dropPct) > 5 ? "text-destructive" : ""}>{b.dropPct.toFixed(2)} %</span></div>
                {id !== sb && <Num label="Generation kW" value={gen[id] ?? 0} onChange={(v) => setGen({ ...gen, [id]: v })} />}
              </div>
            ))}
            {Object.entries(result.r.branches).map(([id, b]) => (
              <div key={id} className="text-muted-foreground">{id}: I {b.i.toFixed(1)} A · loading <span className={b.loadingPct > 100 ? "text-destructive" : ""}>{b.loadingPct.toFixed(0)} %</span> · loss {(b.lossW / 1000).toFixed(2)} kW</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export type ElectrodeInfo = { id: string; name: string; values: Record<string, string | number> };

export function EarthingStudy({ electrodes }: { electrodes: ElectrodeInfo[] }) {
  const [kind, setKind] = useState<NeutralEarthing>("resistance");
  const [o, setO] = useState({ un: 20000, c0uF: 5, rn: 40, solidA: 2000, detuning: 5, timeS: 0.5, reduction: 1, touch: 0.3 });
  const iE = earthFaultCurrent(kind, o.un, { c0F: o.c0uF * 1e-6, rnOhm: o.rn, solidA: o.solidA, detuning: o.detuning / 100 });
  return (
    <div className="space-y-2 text-xs">
      <label className="grid gap-1 text-muted-foreground">Neutral earthing
        <select className={SEL} value={kind} onChange={(e) => setKind(e.target.value as NeutralEarthing)}>
          <option value="solid">Solidly earthed</option><option value="resistance">Resistance earthed</option>
          <option value="petersen">Compensated (arc-suppression coil)</option><option value="isolated">Isolated</option></select></label>
      <div className="grid grid-cols-4 gap-2">
        <Num label="Un (V)" value={o.un} onChange={(v) => setO({ ...o, un: v })} />
        <Num label="C0 per phase (µF)" value={o.c0uF} onChange={(v) => setO({ ...o, c0uF: v })} />
        {kind === "resistance" && <Num label="RN (Ω)" value={o.rn} onChange={(v) => setO({ ...o, rn: v })} />}
        {kind === "solid" && <Num label="Earth fault (A)" value={o.solidA} onChange={(v) => setO({ ...o, solidA: v })} />}
        {kind === "petersen" && <Num label="Detuning (%)" value={o.detuning} onChange={(v) => setO({ ...o, detuning: v })} />}
        <Num label="Fault time (s)" value={o.timeS} onChange={(v) => setO({ ...o, timeS: v })} />
        <Num label="Reduction factor r" value={o.reduction} onChange={(v) => setO({ ...o, reduction: v })} />
        <Num label="Touch factor" value={o.touch} onChange={(v) => setO({ ...o, touch: v })} />
      </div>
      <p>Earth fault current IE = <b>{iE.toFixed(1)} A</b></p>
      {electrodes.length === 0 && <p className="text-muted-foreground">Add an Earth electrode (Add → Distribution) to check its earth potential rise.</p>}
      {electrodes.map((e) => {
        const r = electrodeResistance(e.values); const c = earthingCheck(r, iE, o.timeS, o.touch, o.reduction);
        return (
          <div key={e.id} className="rounded-md border border-border p-2">
            <b>{e.name}</b> · RE {Number.isFinite(r) ? r.toFixed(2) : "∞"} Ω · EPR {c.epr.toFixed(0)} V · UT ≈ {c.uTouch.toFixed(0)} V · UTP {c.utp.toFixed(0)} V —{" "}
            <span className={c.pass ? "" : "text-destructive"}>{c.pass ? "OK" : "Measures required (EPR > 2·UTP and UT > UTP)"}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AdvancedProtection() {
  const [dir, setDir] = useState({ vAng: 0, iAng: -45, rca: 45 });
  const [dz, setDz] = useState({ lr: 1.2, lx: 3.6, fr: 0.6, fx: 1.8 });
  const [df, setDf] = useState({ i1: 1, a1: 0, i2: 1, a2: 180 });
  const [co, setCo] = useState({ load: 200, fault: 4000, down: 0.2 });
  const d = directionalDecision({ mag: 1, angleDeg: dir.vAng }, { mag: 1, angleDeg: dir.iAng }, dir.rca);
  const z = distanceZone(defaultDistance(dz.lr, dz.lx), dz.fr, dz.fx);
  const f = differentialTrip(defaultDiff, { mag: df.i1, angleDeg: df.a1 }, { mag: df.i2, angleDeg: df.a2 });
  const s = suggestUpstream(co.load, co.fault, co.down);
  const Box = ({ t, children }: { t: string; children: React.ReactNode }) => <div className="space-y-2 rounded-md border border-border p-2"><b>{t}</b>{children}</div>;
  return (
    <div className="max-h-[28rem] space-y-2 overflow-auto text-xs">
      <Box t="Directional overcurrent / directional earth fault">
        <div className="grid grid-cols-3 gap-2">
          <Num label="Polarising U angle (°)" value={dir.vAng} onChange={(v) => setDir({ ...dir, vAng: v })} />
          <Num label="Current angle (°)" value={dir.iAng} onChange={(v) => setDir({ ...dir, iAng: v })} />
          <Num label="Characteristic angle (°)" value={dir.rca} onChange={(v) => setDir({ ...dir, rca: v })} />
        </div>
        <p>Deviation {d.deviationDeg.toFixed(1)}° → <b>{d.direction === "forward" ? "Forward (operate)" : "Reverse (block)"}</b></p>
      </Box>
      <Box t="Distance protection (mho, Zone 1 80 %, Zone 2 120 % / 0.3 s, Zone 3 200 % / 0.8 s)">
        <div className="grid grid-cols-4 gap-2">
          <Num label="Line R (Ω)" value={dz.lr} onChange={(v) => setDz({ ...dz, lr: v })} />
          <Num label="Line X (Ω)" value={dz.lx} onChange={(v) => setDz({ ...dz, lx: v })} />
          <Num label="Fault R (Ω)" value={dz.fr} onChange={(v) => setDz({ ...dz, fr: v })} />
          <Num label="Fault X (Ω)" value={dz.fx} onChange={(v) => setDz({ ...dz, fx: v })} />
        </div>
        <p>Result: <b>{z.zone}</b>{Number.isFinite(z.timeS) && ` · ${z.timeS.toFixed(2)} s`}</p>
      </Box>
      <Box t="Line / transformer differential (biased, Is1 0.2 pu, k1 30 %, Is2 2 pu, k2 80 %)">
        <div className="grid grid-cols-4 gap-2">
          <Num label="I end A (pu)" value={df.i1} onChange={(v) => setDf({ ...df, i1: v })} />
          <Num label="Angle A (°)" value={df.a1} onChange={(v) => setDf({ ...df, a1: v })} />
          <Num label="I end B (pu)" value={df.i2} onChange={(v) => setDf({ ...df, i2: v })} />
          <Num label="Angle B (°)" value={df.a2} onChange={(v) => setDf({ ...df, a2: v })} />
        </div>
        <p>Idiff {f.idiff.toFixed(2)} pu · Ibias {f.ibias.toFixed(2)} pu · threshold {f.threshold.toFixed(2)} pu → <b className={f.trip ? "text-destructive" : ""}>{f.trip ? "Trip" : "Stable"}</b></p>
      </Box>
      <Box t="Automatic coordination (IEC standard inverse upstream setting)">
        <div className="grid grid-cols-3 gap-2">
          <Num label="Max load (A)" value={co.load} onChange={(v) => setCo({ ...co, load: v })} />
          <Num label="Max through fault (A)" value={co.fault} onChange={(v) => setCo({ ...co, fault: v })} />
          <Num label="Downstream time (s)" value={co.down} onChange={(v) => setCo({ ...co, down: v })} />
        </div>
        <p>Suggested pickup <b>{s.pickupA} A</b> · TMS <b>{s.tms.toFixed(2)}</b> · operate {s.timeS.toFixed(3)} s (grading margin 0.3 s)</p>
      </Box>
    </div>
  );
}
