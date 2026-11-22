import { useMemo, useState } from "react";
import { DraggablePanel } from "./DraggablePanel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { studyLinks, suggestConductor, type StudyLink } from "@/ModelLibrary/grid/sceneStudy";
import { bom, bomCSV, cableScheduleCSV } from "@/ModelLibrary/grid/reports";
import { sag, clearanceCheck, CONDUCTOR_MASS } from "@/ModelLibrary/grid/lineMechanics";
import { FaultStudyPanel } from "./FaultStudyPanel";
import { ProtectionStudy, type RelayTarget } from "./ProtectionStudy";
import type { FaultNetwork } from "@/ModelLibrary/grid/faultNetwork";
import type { FaultResult } from "@/ModelLibrary/grid/shortCircuit";
import { AdvancedProtection, EarthingStudy, PowerFlowStudy, type ElectrodeInfo } from "./StudiesExtra";
import type { RelaySettings } from "@/ModelLibrary/grid/relay";

type Tab = "feeders" | "power flow" | "faults" | "relays" | "protection+" | "earthing" | "lines" | "export";
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

export function StudiesPanel({ links, objects, network, relays, onRelayChange, onClose, electrodes = [] }: {
  electrodes?: ElectrodeInfo[];
  links: StudyLink[];
  objects: string[];
  network: FaultNetwork;
  relays: RelayTarget[];
  onRelayChange: (id: string, settings: RelaySettings) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("feeders");
  const [opts, setOpts] = useState({ cosPhi: 0.95, ikA: 10000, clearS: 0.4, tempC: 70 });
  const [loads, setLoads] = useState<Record<string, number>>({});
  const [fault, setFault] = useState<FaultResult | null>(null);
  const withLoads = links.map((l) => ({ ...l, loadKW: loads[l.id] ?? l.loadKW }));
  const rows = useMemo(() => studyLinks(withLoads, opts), [JSON.stringify(withLoads), opts]);
  const fails = rows.filter((r) => r.status.startsWith("FAIL")).length;
  const warns = rows.filter((r) => r.status.startsWith("WARN")).length;
  const [mech, setMech] = useState({ span: 60, tension: 5000, height: 10, ice: 0, wind: 0, conductor: "ac-70", road: false });
  const sg = sag(mech.span, CONDUCTOR_MASS[mech.conductor] ?? 0.3, mech.tension, mech.ice, mech.wind);
  const cl = clearanceCheck(mech.height, sg, mech.conductor.startsWith("amka") ? 400 : 20000, mech.road);

  return (
    <DraggablePanel title="Grid design studies" initialX={16} initialY={70} width={620} onClose={onClose}>
      <div className="space-y-3 bg-card p-4 text-foreground">
        <div className="flex flex-wrap gap-1" role="tablist">
          {(["feeders", "power flow", "faults", "relays", "protection+", "earthing", "lines", "export"] as Tab[]).map((t) => (
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
                      <span className={r.status.startsWith("FAIL") ? "text-destructive" : "text-foreground"}>{r.status.split(":")[0]}</span></div>
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
        {tab === "power flow" && <PowerFlowStudy links={withLoads} />}
        {tab === "protection+" && <AdvancedProtection />}
        {tab === "earthing" && <EarthingStudy electrodes={electrodes} />}
        {tab === "faults" && <FaultStudyPanel network={network} onResult={setFault} />}
        {tab === "relays" && <ProtectionStudy relays={relays} onChange={onRelayChange} fault={fault} />}
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
            <p>Sag f = w·L²/(8H) = <b>{sg.toFixed(2)} m</b> · lowest point {cl.lowest.toFixed(2)} m · required {cl.need} m — <span className={cl.ok ? "text-foreground" : "text-destructive"}>{cl.ok ? "OK" : "Clearance too small"}</span></p>
          </div>
        )}
        {tab === "export" && (
          <div className="space-y-2 text-xs">
            <Button size="sm" className="w-full" onClick={() => download("cable-schedule.csv", cableScheduleCSV(rows))}>Download cable schedule (CSV)</Button>
            <Button size="sm" variant="outline" className="w-full" onClick={() => download("bill-of-materials.csv", bomCSV(bom(rows, objects)))}>Download bill of materials (CSV)</Button>
            <p className="text-muted-foreground">Design aid based on IEC 60909/60255/60364 simplifications and typical catalogue data. Protection settings and construction designs require verification and sign-off by a qualified engineer.</p>
          </div>
        )}
      </div>
    </DraggablePanel>
  );
}
