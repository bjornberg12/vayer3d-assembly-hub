import { useMemo, useState } from "react";
import { DraggablePanel } from "./DraggablePanel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { studyLinks, suggestConductor, type StudyLink } from "@/ModelLibrary/grid/sceneStudy";
import { bom, bomCSV, cableScheduleCSV } from "@/ModelLibrary/grid/reports";
import { tripTime, selectivity, autoReclose, flisr, type Device, type CurveKind } from "@/ModelLibrary/grid/protection";
import { sag, clearanceCheck, CONDUCTOR_MASS } from "@/ModelLibrary/grid/lineMechanics";

type Tab = "feeders" | "protection" | "lines" | "export";
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};
const Num = ({ label, value, onChange, step = "any" }: { label: string; value: number; onChange: (v: number) => void; step?: string }) => (
  <label className="grid gap-1 text-xs text-muted-foreground">
    {label}
    <Input aria-label={label} type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8" />
  </label>
);

export function StudiesPanel({ links, objects, onClose }: { links: StudyLink[]; objects: string[]; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("feeders");
  const [opts, setOpts] = useState({ cosPhi: 0.95, ikA: 10000, clearS: 0.4, tempC: 70 });
  const [loads, setLoads] = useState<Record<string, number>>({});
  const withLoads = links.map((l) => ({ ...l, loadKW: loads[l.id] ?? l.loadKW }));
  const rows = useMemo(() => studyLinks(withLoads, opts), [JSON.stringify(withLoads), opts]);
  const fails = rows.filter((r) => r.status.startsWith("FAIL")).length;
  const warns = rows.filter((r) => r.status.startsWith("WARN")).length;

  // Protection
  const [up, setUp] = useState<{ curve: CurveKind; is: number; tms: number }>({ curve: "SI", is: 200, tms: 0.2 });
  const [down, setDown] = useState<{ kind: "fuse" | "mcb"; in: number }>({ kind: "fuse", in: 63 });
  const upDev: Device = { id: "up", type: "relay", ...up };
  const downDev: Device = down.kind === "fuse" ? { id: "dn", type: "fuse", in: down.in } : { id: "dn", type: "mcb", char: "C", in: down.in };
  const sel = selectivity(upDev, downDev, down.in * 2, opts.ikA);
  const [permanent, setPermanent] = useState(true);
  const ar = autoReclose({ shots: 2, deadTimes: [0.5, 15], permanent });
  const [ring, setRing] = useState({ n: 5, f: 2 });
  const fl = flisr(ring.n, Math.min(ring.f, ring.n - 1));

  // Lines
  const [mech, setMech] = useState({ span: 60, tension: 5000, height: 10, ice: 0, wind: 0, conductor: "ac-70", road: false });
  const sg = sag(mech.span, CONDUCTOR_MASS[mech.conductor] ?? 0.3, mech.tension, mech.ice, mech.wind);
  const cl = clearanceCheck(mech.height, sg, mech.conductor.startsWith("amka") ? 400 : 20000, mech.road);

  const curvePath = (d: Device) => {
    const pts: string[] = [];
    for (let k = 0; k <= 60; k++) {
      const i = 10 * 10 ** (k / 15); // 10 A .. 100 kA
      const t = tripTime(d, i);
      if (!isFinite(t)) continue;
      const x = (Math.log10(i) - 1) * 70, y = 160 - (Math.log10(Math.min(Math.max(t, 0.01), 1000)) + 2) * 32;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  return (
    <DraggablePanel title="Grid design studies" initialX={16} initialY={90} width={520} onClose={onClose}>
      <div className="space-y-3 bg-card p-4 text-foreground">
        <div className="flex gap-1" role="tablist">
          {(["feeders", "protection", "lines", "export"] as Tab[]).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className="capitalize">{t}</Button>
          ))}
        </div>
        {tab === "feeders" && (
          <>
            <div className="grid grid-cols-4 gap-2">
              <Num label="cos φ" value={opts.cosPhi} onChange={(v) => setOpts({ ...opts, cosPhi: Math.min(1, Math.max(0.5, v)) })} />
              <Num label="Ik max (A)" value={opts.ikA} onChange={(v) => setOpts({ ...opts, ikA: v })} />
              <Num label="Clearing (s)" value={opts.clearS} onChange={(v) => setOpts({ ...opts, clearS: v })} />
              <Num label="Conductor °C" value={opts.tempC} onChange={(v) => setOpts({ ...opts, tempC: v })} />
            </div>
            <p className="text-xs">{rows.length} connections · <span className="text-destructive">{fails} fail</span> · {warns} warning</p>
            {rows.length === 0 && <p className="text-xs text-muted-foreground">Draw cables or aerial lines in the Wiring menu to study them.</p>}
            <div className="max-h-72 space-y-2 overflow-auto">
              {rows.map((r) => {
                const link = withLoads.find((l) => l.id === r.id)!;
                const sug = !r.status.startsWith("OK") ? suggestConductor(link.sceneType, link, opts) : null;
                return (
                  <div key={r.id} className="rounded-md border border-border p-2 text-xs">
                    <div className="flex justify-between font-semibold"><span>{r.conductor} · {r.lengthM.toFixed(0)} m</span>
                      <span className={r.status.startsWith("FAIL") ? "text-destructive" : r.status.startsWith("WARN") ? "text-accent-foreground" : "text-emerald-600"}>{r.status.split(":")[0]}</span></div>
                    <div className="mt-1 grid grid-cols-[1fr_auto] items-end gap-2">
                      <div className="text-muted-foreground">I {r.currentA.toFixed(0)} A · ΔU {r.dropPct.toFixed(2)} % · load {r.loadingPct.toFixed(0)} % · withstand {r.withstandS.toFixed(2)} s
                        {r.status.includes(":") && <div>{r.status.split(": ")[1]}</div>}
                        {sug && <div className="text-foreground">Suggestion: use size {sug}</div>}</div>
                      <Num label="Load kW" value={link.loadKW} onChange={(v) => setLoads({ ...loads, [r.id]: v })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {tab === "protection" && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <label className="grid gap-1 text-muted-foreground">Upstream relay curve
                <select className="h-8 rounded-md border border-input bg-background px-2" value={up.curve} onChange={(e) => setUp({ ...up, curve: e.target.value as CurveKind })}>
                  {["SI", "VI", "EI", "LTI", "DT"].map((c) => <option key={c}>{c}</option>)}</select></label>
              <Num label="Pickup Is (A)" value={up.is} onChange={(v) => setUp({ ...up, is: v })} />
              <Num label="TMS" value={up.tms} onChange={(v) => setUp({ ...up, tms: v })} />
              <label className="grid gap-1 text-muted-foreground">Downstream device
                <select className="h-8 rounded-md border border-input bg-background px-2" value={down.kind} onChange={(e) => setDown({ ...down, kind: e.target.value as "fuse" | "mcb" })}>
                  <option value="fuse">gG fuse</option><option value="mcb">MCB C</option></select></label>
              <Num label="Rating In (A)" value={down.in} onChange={(v) => setDown({ ...down, in: v })} />
            </div>
            <svg viewBox="0 0 280 170" className="w-full rounded-md border border-border bg-background" aria-label="Time–current curves">
              <polyline points={curvePath(upDev)} fill="none" stroke="var(--primary)" strokeWidth="2" />
              <polyline points={curvePath(downDev)} fill="none" stroke="var(--destructive)" strokeWidth="2" />
              <text x="4" y="12" fontSize="8" fill="currentColor">t (0.01–1000 s, log) vs I (10 A–100 kA, log)</text>
            </svg>
            <p className={sel.selective ? "text-emerald-600" : "text-destructive"}>
              {sel.selective ? "Selective" : "Not selective"} — worst margin {isFinite(sel.worstMargin) ? sel.worstMargin.toFixed(2) : "∞"} s at {sel.atCurrent.toFixed(0)} A (required 0.2 s)</p>
            <div className="rounded-md border border-border p-2">
              <div className="font-semibold">Auto-reclose (0.5 s + 15 s)</div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />Permanent fault</label>
              <p className="text-muted-foreground">{ar.log.join(" → ")}</p>
            </div>
            <div className="rounded-md border border-border p-2">
              <div className="font-semibold">FLISR on open ring</div>
              <div className="grid grid-cols-2 gap-2"><Num label="Sections" step="1" value={ring.n} onChange={(v) => setRing({ ...ring, n: Math.max(2, v) })} />
                <Num label="Faulted section" step="1" value={ring.f} onChange={(v) => setRing({ ...ring, f: Math.max(0, v) })} /></div>
              <p className="text-muted-foreground">Isolate {fl.isolate.join(",")} · fed from A: {fl.fedFromA.join(",") || "–"} · fed from B: {fl.fedFromB.join(",") || "–"}</p>
            </div>
          </div>
        )}
        {tab === "lines" && (
          <div className="space-y-2 text-xs">
            <label className="grid gap-1 text-muted-foreground">Conductor
              <select className="h-8 rounded-md border border-input bg-background px-2" value={mech.conductor} onChange={(e) => setMech({ ...mech, conductor: e.target.value })}>
                {Object.keys(CONDUCTOR_MASS).map((c) => <option key={c}>{c}</option>)}</select></label>
            <div className="grid grid-cols-3 gap-2">
              <Num label="Span (m)" value={mech.span} onChange={(v) => setMech({ ...mech, span: v })} />
              <Num label="Tension H (N)" value={mech.tension} onChange={(v) => setMech({ ...mech, tension: v })} />
              <Num label="Attach height (m)" value={mech.height} onChange={(v) => setMech({ ...mech, height: v })} />
              <Num label="Ice (kg/m)" value={mech.ice} onChange={(v) => setMech({ ...mech, ice: v })} />
              <Num label="Wind (N/m)" value={mech.wind} onChange={(v) => setMech({ ...mech, wind: v })} />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={mech.road} onChange={(e) => setMech({ ...mech, road: e.target.checked })} />Road crossing</label>
            <p>Sag f = w·L²/(8H) = <b>{sg.toFixed(2)} m</b> · lowest point {cl.lowest.toFixed(2)} m · required {cl.need} m —{" "}
              <span className={cl.ok ? "text-emerald-600" : "text-destructive"}>{cl.ok ? "OK" : "Clearance too small"}</span></p>
          </div>
        )}
        {tab === "export" && (
          <div className="space-y-2 text-xs">
            <Button size="sm" className="w-full" onClick={() => download("cable-schedule.csv", cableScheduleCSV(rows))}>Download cable schedule (CSV)</Button>
            <Button size="sm" variant="outline" className="w-full" onClick={() => download("bill-of-materials.csv", bomCSV(bom(rows, objects)))}>Download bill of materials (CSV)</Button>
            <p className="text-muted-foreground">Design aid based on IEC 60909/60255/60364 simplifications and typical catalogue data. A qualified engineer must verify and sign off before construction.</p>
          </div>
        )}
      </div>
    </DraggablePanel>
  );
}
