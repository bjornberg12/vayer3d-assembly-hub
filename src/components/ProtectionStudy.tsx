import { useEffect, useMemo, useState } from "react";
import { RelayEditor } from "./RelayEditor";
import { Input } from "./ui/input";
import {
  activeRelayGroup,
  defaultMeasurement,
  evaluateRelay,
  fastestTrip,
  recloseSequence,
  relayCurveTime,
  type RelayGroup,
  type RelayMeasurement,
  type RelaySettings,
} from "@/ModelLibrary/grid/relay";
import type { FaultResult } from "@/ModelLibrary/grid/shortCircuit";

export type RelayTarget = { id: string; label: string; settings: RelaySettings; liveCurrentA: number };

function stageTripTime(group: RelayGroup, current: number) {
  return Math.min(...[group.phase51, group.phase50, group.phase50Hi].filter((stage) => stage.enabled).map((stage) => relayCurveTime(stage.curve, stage.pickupA, stage.timeDial, current, stage.delayS)));
}

export function ProtectionStudy({ relays, onChange, fault }: { relays: RelayTarget[]; onChange: (id: string, settings: RelaySettings) => void; fault: FaultResult | null }) {
  const [selectedId, setSelectedId] = useState("");
  const [manualA, setManualA] = useState(1000);
  const [residualA, setResidualA] = useState(0);
  const [permanent, setPermanent] = useState(true);
  const [clearAfterShot, setClearAfterShot] = useState(1);
  const [coordination, setCoordination] = useState({ up: "", down: "", minA: 100, maxA: 10000, marginS: 0.2 });
  useEffect(() => { if (!relays.some((relay) => relay.id === selectedId)) setSelectedId(relays[0]?.id ?? ""); }, [relays, selectedId]);
  const selected = relays.find((relay) => relay.id === selectedId);
  const measurement: RelayMeasurement = useMemo(() => {
    if (!selected) return defaultMeasurement();
    if (fault) return { ...defaultMeasurement(selected.settings.nominalVoltageV), phaseA: fault.phaseA, residualA: fault.residualA, negativeSequenceA: Math.sqrt(3) * fault.sequenceA.i2, frequencyHz: selected.settings.nominalFrequencyHz };
    return { ...defaultMeasurement(selected.settings.nominalVoltageV), phaseA: [manualA, manualA, manualA], residualA, frequencyHz: selected.settings.nominalFrequencyHz };
  }, [selected, fault, manualA, residualA]);
  const operations = useMemo(() => selected ? evaluateRelay(selected.settings, measurement) : [], [selected, measurement]);
  const trip = selected ? fastestTrip(selected.settings, measurement) : null;
  const sequence = useMemo(() => selected ? recloseSequence(selected.settings, permanent, clearAfterShot) : null, [selected, permanent, clearAfterShot]);
  const up = relays.find((relay) => relay.id === coordination.up);
  const down = relays.find((relay) => relay.id === coordination.down);
  const coordinationResult = useMemo(() => {
    if (!up || !down) return null;
    let worst = Infinity;
    let at = coordination.minA;
    for (let k = 0; k <= 60; k++) {
      const current = coordination.minA * (coordination.maxA / coordination.minA) ** (k / 60);
      const downTime = stageTripTime(activeRelayGroup(down.settings), current);
      if (!Number.isFinite(downTime)) continue;
      const gap = stageTripTime(activeRelayGroup(up.settings), current) - downTime;
      if (gap < worst) { worst = gap; at = current; }
    }
    return { selective: worst >= coordination.marginS, worst, at };
  }, [up, down, coordination]);

  if (!relays.length) return <p className="rounded-md border border-border p-4 text-xs text-muted-foreground">Add an MV auto-recloser or a switchgear circuit breaker to configure protection. Every protected feeder then appears here with four setting groups.</p>;
  return (
    <div className="space-y-4 text-xs">
      <label className="grid gap-1 text-muted-foreground">Protected equipment
        <select aria-label="Protected equipment" className="h-9 rounded-md border border-input bg-background px-2" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{relays.map((relay) => <option key={relay.id} value={relay.id}>{relay.label} · live {relay.liveCurrentA.toFixed(1)} A</option>)}</select>
      </label>
      {selected && <>
        <div className="rounded-md border border-border p-3">
          <div className="mb-2 font-semibold">Fault injection and operating time</div>
          {!fault && <div className="mb-2 grid grid-cols-2 gap-2"><label className="grid gap-1 text-muted-foreground">Phase current<Input aria-label="Manual phase test current" type="number" value={manualA} onChange={(event) => setManualA(Number(event.target.value))} className="h-8" /></label><label className="grid gap-1 text-muted-foreground">Residual current<Input aria-label="Manual residual test current" type="number" value={residualA} onChange={(event) => setResidualA(Number(event.target.value))} className="h-8" /></label></div>}
          <p className="mb-2 text-[10px] text-muted-foreground">{fault ? `Using the selected ${fault.type} fault: Ik ${(fault.ik / 1000).toFixed(3)} kA and 3I₀ ${(fault.residualA / 1000).toFixed(3)} kA.` : "No valid fault point selected; enter manual secondary-injection equivalents in primary amperes."}</p>
          <div className="font-mono text-[11px]">{trip ? <strong>{trip.iec} {trip.name}: relay {trip.timeS.toFixed(3)} s + breaker, total {trip.totalTimeS.toFixed(3)} s</strong> : "No trip for the applied measurement."}</div>
          {operations.filter((operation) => Number.isFinite(operation.timeS)).map((operation) => <div key={operation.ansi} className="mt-1 text-muted-foreground">{operation.iec}: {operation.timeS.toFixed(3)} s · {operation.measured.toFixed(1)} {operation.unit}</div>)}
        </div>
        <RelayEditor value={selected.settings} measurement={measurement} onChange={(settings) => onChange(selected.id, settings)} />
        <div className="rounded-md border border-border p-3">
          <div className="font-semibold">Auto-reclose sequence test</div>
          <div className="my-2 flex flex-wrap gap-4"><label className="flex items-center gap-2"><input type="checkbox" checked={permanent} onChange={(event) => setPermanent(event.target.checked)} />Permanent fault</label><label className="flex items-center gap-2">Transient clears after shot <Input aria-label="Transient clears after shot" type="number" min={1} max={4} value={clearAfterShot} onChange={(event) => setClearAfterShot(Number(event.target.value))} className="h-8 w-20" /></label></div>
          <ol className="space-y-1 font-mono text-[11px]">{sequence?.events.map((event, index) => <li key={`${event.timeS}-${index}`} className="flex justify-between gap-3 border-b border-border py-1"><span>{event.event}</span><span>t = {event.timeS.toFixed(3)} s</span></li>)}</ol>
          <p className="mt-2 font-semibold">{sequence?.lockout ? "Final state: LOCKOUT" : "Final state: CLOSED after successful reclaim"}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <div className="font-semibold">{"I> / I>> grading and selectivity"}</div>
          <div className="my-2 grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-muted-foreground">Upstream relay<select aria-label="Upstream relay" className="h-8 rounded-md border border-input bg-background px-2" value={coordination.up} onChange={(event) => setCoordination({ ...coordination, up: event.target.value })}><option value="">Choose</option>{relays.map((relay) => <option key={relay.id} value={relay.id}>{relay.label}</option>)}</select></label>
            <label className="grid gap-1 text-muted-foreground">Downstream relay<select aria-label="Downstream relay" className="h-8 rounded-md border border-input bg-background px-2" value={coordination.down} onChange={(event) => setCoordination({ ...coordination, down: event.target.value })}><option value="">Choose</option>{relays.map((relay) => <option key={relay.id} value={relay.id}>{relay.label}</option>)}</select></label>
            <label className="grid gap-1 text-muted-foreground">Minimum current A<Input aria-label="Coordination minimum current" type="number" value={coordination.minA} onChange={(event) => setCoordination({ ...coordination, minA: Math.max(1, Number(event.target.value)) })} className="h-8" /></label>
            <label className="grid gap-1 text-muted-foreground">Maximum current A<Input aria-label="Coordination maximum current" type="number" value={coordination.maxA} onChange={(event) => setCoordination({ ...coordination, maxA: Math.max(coordination.minA * 1.01, Number(event.target.value)) })} className="h-8" /></label>
            <label className="grid gap-1 text-muted-foreground">Required grading margin s<Input aria-label="Required grading margin" type="number" step="0.05" value={coordination.marginS} onChange={(event) => setCoordination({ ...coordination, marginS: Number(event.target.value) })} className="h-8" /></label>
          </div>
          {coordinationResult && <p className={coordinationResult.selective ? "text-foreground" : "font-semibold text-destructive"}>{coordinationResult.selective ? "SELECTIVE" : "NOT SELECTIVE"} · worst margin {Number.isFinite(coordinationResult.worst) ? coordinationResult.worst.toFixed(3) : "∞"} s at {coordinationResult.at.toFixed(0)} A</p>}
        </div>
        <p className="text-[10px] text-muted-foreground">This is a generic numerical distribution relay, not a vendor-specific relay firmware replica. CT/VT errors, communication-based schemes, breaker failure of upstream devices, dynamic frequency transients and thermal memory require project-specific verification before commissioning.</p>
      </>}
    </div>
  );
}
