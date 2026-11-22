import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  activeRelayGroup,
  defaultRelayGroup,
  fastestTrip,
  RELAY_CURVE_LABEL,
  type Direction,
  type OvercurrentStage,
  type RelayCurve,
  type RelayGroup,
  type RelayMeasurement,
  type RelaySettings,
} from "@/ModelLibrary/grid/relay";

type Section = "phase" | "earth" | "46" | "voltage" | "47" | "81" | "49" | "50bf" | "79" | "common";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "phase", label: "I> / I>> · Phase OC" },
  { id: "earth", label: "I0> / I0>> · Earth fault" },
  { id: "46", label: "I2> · Negative sequence" },
  { id: "voltage", label: "U< / U> · Voltage" },
  { id: "47", label: "U2> · Phase sequence" },
  { id: "81", label: "f / df/dt · Frequency" },
  { id: "49", label: "θ> · Thermal" },
  { id: "50bf", label: "CBFP · Breaker failure" },
  { id: "79", label: "Auto-reclose" },
  { id: "common", label: "CT/VT · Breaker" },
];

const Num = ({ label, value, onChange, unit = "", step = "any", min = 0 }: { label: string; value: number; onChange: (value: number) => void; unit?: string; step?: string; min?: number }) => (
  <label className="grid gap-1 text-[10px] text-muted-foreground">
    {label}
    <span className="flex items-center gap-1">
      <Input aria-label={label} type="number" min={min} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-8 min-w-0 font-mono text-xs" />
      {unit && <span className="w-8 text-[10px]">{unit}</span>}
    </span>
  </label>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <label className="flex items-center gap-2 text-xs text-foreground">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>
);

function StageEditor({ title, stage, onChange }: { title: string; stage: OvercurrentStage; onChange: (stage: OvercurrentStage) => void }) {
  return (
    <fieldset className="space-y-2 rounded-md border border-border p-2">
      <legend className="px-1 text-xs font-semibold">{title}</legend>
      <Toggle label="Function enabled" checked={stage.enabled} onChange={(enabled) => onChange({ ...stage, enabled })} />
      <div className="grid grid-cols-2 gap-2">
        <Num label={`${title} pickup`} value={stage.pickupA} onChange={(pickupA) => onChange({ ...stage, pickupA })} unit="A" />
        <Num label={`${title} time dial`} value={stage.timeDial} onChange={(timeDial) => onChange({ ...stage, timeDial })} step="0.01" />
        <Num label={`${title} added delay`} value={stage.delayS} onChange={(delayS) => onChange({ ...stage, delayS })} unit="s" step="0.01" />
        <Num label={`${title} reset time`} value={stage.resetS} onChange={(resetS) => onChange({ ...stage, resetS })} unit="s" step="0.01" />
      </div>
      <label className="grid gap-1 text-[10px] text-muted-foreground">Curve
        <select aria-label={`${title} curve`} className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={stage.curve} onChange={(event) => onChange({ ...stage, curve: event.target.value as RelayCurve })}>
          {Object.entries(RELAY_CURVE_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-[10px] text-muted-foreground">Directional control
          <select aria-label={`${title} direction`} className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={stage.direction} onChange={(event) => onChange({ ...stage, direction: event.target.value as Direction })}>
            <option value="non-directional">Non-directional</option><option value="forward">Forward</option><option value="reverse">Reverse</option>
          </select>
        </label>
        <Num label={`${title} torque angle`} value={stage.torqueAngleDeg} onChange={(torqueAngleDeg) => onChange({ ...stage, torqueAngleDeg })} unit="°" min={-180} />
      </div>
    </fieldset>
  );
}

export function RelayEditor({ value, onChange, measurement }: { value: RelaySettings; onChange: (value: RelaySettings) => void; measurement?: RelayMeasurement }) {
  const [section, setSection] = useState<Section>("phase");
  const [copyTarget, setCopyTarget] = useState(1);
  const group = activeRelayGroup(value);
  const updateGroup = (patch: Partial<RelayGroup>) => {
    const groups = value.groups.map((item, index) => index === value.activeGroup ? { ...item, ...patch } : item) as RelaySettings["groups"];
    onChange({ ...value, groups });
  };
  const updateStage = (key: "phase51" | "phase50" | "phase50Hi" | "earth51N" | "earth50N", stage: OvercurrentStage) => updateGroup({ [key]: stage });
  const copyGroup = () => {
    const source = JSON.parse(JSON.stringify(group)) as RelayGroup;
    source.name = `${group.name} copy`;
    const groups = value.groups.map((item, index) => index === copyTarget ? source : item) as RelaySettings["groups"];
    onChange({ ...value, groups, activeGroup: copyTarget });
  };
  const trip = measurement ? fastestTrip(value, measurement) : null;

  return (
    <div className="space-y-3 text-xs">
      <div className="rounded-md border border-border bg-muted/30 p-2">
        <div className="grid grid-cols-[1fr_1.4fr] gap-2">
          <label className="grid gap-1 text-muted-foreground">Active setting group
            <select aria-label="Active setting group" className="h-8 rounded-md border border-input bg-background px-2" value={value.activeGroup} onChange={(event) => onChange({ ...value, activeGroup: Number(event.target.value) })}>
              {value.groups.map((item, index) => <option key={index} value={index}>Group {index + 1} · {item.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-muted-foreground">Group name
            <Input aria-label="Group name" value={group.name} onChange={(event) => updateGroup({ name: event.target.value })} className="h-8" />
          </label>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <label className="grid flex-1 gap-1 text-[10px] text-muted-foreground">Copy active group to
            <select aria-label="Copy group destination" className="h-8 rounded-md border border-input bg-background px-2" value={copyTarget} onChange={(event) => setCopyTarget(Number(event.target.value))}>
              {value.groups.map((item, index) => <option key={index} value={index}>Group {index + 1} · {item.name}</option>)}
            </select>
          </label>
          <Button type="button" size="sm" variant="outline" onClick={copyGroup}>Copy</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => {
            const fresh = defaultRelayGroup(group.name);
            fresh.under27.pickupV = value.nominalVoltageV * 0.8;
            fresh.over59.pickupV = value.nominalVoltageV * 1.1;
            updateGroup(fresh);
          }}>Reset group</Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Group {value.activeGroup + 1} controls live trips and this study. All four groups are saved independently.</p>
      </div>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Protection functions">
        {SECTIONS.map((item) => <Button key={item.id} type="button" size="sm" variant={section === item.id ? "default" : "outline"} onClick={() => setSection(item.id)}>{item.label}</Button>)}
      </div>

      {section === "phase" && <div className="space-y-2">
        <StageEditor title="I>" stage={group.phase51} onChange={(stage) => updateStage("phase51", stage)} />
        <StageEditor title="I>>" stage={group.phase50} onChange={(stage) => updateStage("phase50", stage)} />
        <StageEditor title="I>>>" stage={group.phase50Hi} onChange={(stage) => updateStage("phase50Hi", stage)} />
      </div>}
      {section === "earth" && <div className="space-y-2">
        <StageEditor title="I0>" stage={group.earth51N} onChange={(stage) => updateStage("earth51N", stage)} />
        <StageEditor title="I0>>" stage={group.earth50N} onChange={(stage) => updateStage("earth50N", stage)} />
      </div>}
      {section === "46" && <div className="space-y-2 rounded-md border border-border p-2">
        <Toggle label="I2> negative-sequence overcurrent enabled" checked={group.negative46.enabled} onChange={(enabled) => updateGroup({ negative46: { ...group.negative46, enabled } })} />
        <div className="grid grid-cols-2 gap-2">
          <Num label="I2> pickup" value={group.negative46.pickupA} onChange={(pickupA) => updateGroup({ negative46: { ...group.negative46, pickupA } })} unit="A" />
          <Num label="I2> time dial" value={group.negative46.timeDial} onChange={(timeDial) => updateGroup({ negative46: { ...group.negative46, timeDial } })} step="0.01" />
          <Num label="I2> delay" value={group.negative46.delayS} onChange={(delayS) => updateGroup({ negative46: { ...group.negative46, delayS } })} unit="s" />
        </div>
        <label className="grid gap-1 text-muted-foreground">Curve<select aria-label="I2> curve" className="h-8 rounded-md border border-input bg-background px-2" value={group.negative46.curve} onChange={(event) => updateGroup({ negative46: { ...group.negative46, curve: event.target.value as RelayCurve } })}>{Object.entries(RELAY_CURVE_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>}
      {section === "voltage" && <div className="grid gap-3 md:grid-cols-2">
        {(["under27", "over59"] as const).map((key) => <div key={key} className="space-y-2 rounded-md border border-border p-2">
          <Toggle label={`${key === "under27" ? "U< undervoltage" : "U> overvoltage"} enabled`} checked={group[key].enabled} onChange={(enabled) => updateGroup({ [key]: { ...group[key], enabled } })} />
          <Num label={`${key === "under27" ? "U<" : "U>"} pickup`} value={group[key].pickupV} onChange={(pickupV) => updateGroup({ [key]: { ...group[key], pickupV } })} unit="V" />
          <Num label={`${key === "under27" ? "U<" : "U>"} delay`} value={group[key].delayS} onChange={(delayS) => updateGroup({ [key]: { ...group[key], delayS } })} unit="s" />
          <Num label={`${key === "under27" ? "U<" : "U>"} reset hysteresis`} value={group[key].hysteresisPct} onChange={(hysteresisPct) => updateGroup({ [key]: { ...group[key], hysteresisPct } })} unit="%" />
        </div>)}
      </div>}
      {section === "47" && <div className="space-y-2 rounded-md border border-border p-2">
        <Toggle label="U2> phase sequence / voltage unbalance enabled" checked={group.sequence47.enabled} onChange={(enabled) => updateGroup({ sequence47: { ...group.sequence47, enabled } })} />
        <div className="grid grid-cols-2 gap-2"><Num label="U2> negative-sequence voltage" value={group.sequence47.negativeSequencePct} onChange={(negativeSequencePct) => updateGroup({ sequence47: { ...group.sequence47, negativeSequencePct } })} unit="%" /><Num label="U2> delay" value={group.sequence47.delayS} onChange={(delayS) => updateGroup({ sequence47: { ...group.sequence47, delayS } })} unit="s" /></div>
        <Toggle label="Trip on wrong phase rotation" checked={group.sequence47.blockWrongRotation} onChange={(blockWrongRotation) => updateGroup({ sequence47: { ...group.sequence47, blockWrongRotation } })} />
      </div>}
      {section === "81" && <div className="space-y-2 rounded-md border border-border p-2">
        <Toggle label="Frequency protection enabled" checked={group.frequency81.enabled} onChange={(enabled) => updateGroup({ frequency81: { ...group.frequency81, enabled } })} />
        <div className="grid grid-cols-2 gap-2"><Num label="f< underfrequency" value={group.frequency81.underHz} onChange={(underHz) => updateGroup({ frequency81: { ...group.frequency81, underHz } })} unit="Hz" /><Num label="f> overfrequency" value={group.frequency81.overHz} onChange={(overHz) => updateGroup({ frequency81: { ...group.frequency81, overHz } })} unit="Hz" /><Num label="f<> operating delay" value={group.frequency81.delayS} onChange={(delayS) => updateGroup({ frequency81: { ...group.frequency81, delayS } })} unit="s" /><Num label="df/dt pickup" value={group.frequency81.rocofHzS} onChange={(rocofHzS) => updateGroup({ frequency81: { ...group.frequency81, rocofHzS } })} unit="Hz/s" /><Num label="df/dt delay" value={group.frequency81.rocofDelayS} onChange={(rocofDelayS) => updateGroup({ frequency81: { ...group.frequency81, rocofDelayS } })} unit="s" /></div>
      </div>}
      {section === "49" && <div className="space-y-2 rounded-md border border-border p-2">
        <Toggle label="θ> thermal overload enabled" checked={group.thermal49.enabled} onChange={(enabled) => updateGroup({ thermal49: { ...group.thermal49, enabled } })} />
        <div className="grid grid-cols-2 gap-2"><Num label="θ> thermal pickup" value={group.thermal49.pickupA} onChange={(pickupA) => updateGroup({ thermal49: { ...group.thermal49, pickupA } })} unit="A" /><Num label="θ> thermal time constant" value={group.thermal49.timeConstantS} onChange={(timeConstantS) => updateGroup({ thermal49: { ...group.thermal49, timeConstantS } })} unit="s" /><Num label="θ> thermal alarm" value={group.thermal49.alarmPct} onChange={(alarmPct) => updateGroup({ thermal49: { ...group.thermal49, alarmPct } })} unit="%" /></div>
      </div>}
      {section === "50bf" && <div className="space-y-2 rounded-md border border-border p-2">
        <Toggle label="CBFP breaker failure enabled" checked={group.breakerFailure50BF.enabled} onChange={(enabled) => updateGroup({ breakerFailure50BF: { ...group.breakerFailure50BF, enabled } })} />
        <div className="grid grid-cols-2 gap-2"><Num label="CBFP residual current pickup" value={group.breakerFailure50BF.pickupA} onChange={(pickupA) => updateGroup({ breakerFailure50BF: { ...group.breakerFailure50BF, pickupA } })} unit="A" /><Num label="CBFP delay" value={group.breakerFailure50BF.delayS} onChange={(delayS) => updateGroup({ breakerFailure50BF: { ...group.breakerFailure50BF, delayS } })} unit="s" /></div>
        <Toggle label="Retrip upstream breaker" checked={group.breakerFailure50BF.retrip} onChange={(retrip) => updateGroup({ breakerFailure50BF: { ...group.breakerFailure50BF, retrip } })} />
      </div>}
      {section === "79" && <div className="space-y-2 rounded-md border border-border p-2">
        <Toggle label="Automatic reclosing enabled" checked={group.reclose79.enabled} onChange={(enabled) => updateGroup({ reclose79: { ...group.reclose79, enabled } })} />
        <div className="grid grid-cols-2 gap-2"><Num label="Auto-reclose shots" value={group.reclose79.shots} onChange={(shots) => updateGroup({ reclose79: { ...group.reclose79, shots: Math.min(4, Math.max(0, Math.round(shots))) } })} step="1" /><Num label="Auto-reclose reclaim time" value={group.reclose79.reclaimTimeS} onChange={(reclaimTimeS) => updateGroup({ reclose79: { ...group.reclose79, reclaimTimeS } })} unit="s" /></div>
        {[0, 1, 2, 3].slice(0, Math.max(1, group.reclose79.shots)).map((index) => <Num key={index} label={`Dead time shot ${index + 1}`} value={group.reclose79.deadTimesS[index] ?? group.reclose79.deadTimesS.at(-1) ?? 1} onChange={(dead) => { const deadTimesS = [...group.reclose79.deadTimesS]; deadTimesS[index] = dead; updateGroup({ reclose79: { ...group.reclose79, deadTimesS } }); }} unit="s" />)}
        <Toggle label="Lock out after permanent fault" checked={group.reclose79.lockoutOnPermanent} onChange={(lockoutOnPermanent) => updateGroup({ reclose79: { ...group.reclose79, lockoutOnPermanent } })} />
        <Toggle label="Reset shot counter after reclaim" checked={group.reclose79.resetAttemptsOnReclaim} onChange={(resetAttemptsOnReclaim) => updateGroup({ reclose79: { ...group.reclose79, resetAttemptsOnReclaim } })} />
      </div>}
      {section === "common" && <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-2">
        <Num label="CT primary" value={value.ctPrimaryA} onChange={(ctPrimaryA) => onChange({ ...value, ctPrimaryA })} unit="A" /><Num label="CT secondary" value={value.ctSecondaryA} onChange={(ctSecondaryA) => onChange({ ...value, ctSecondaryA })} unit="A" /><Num label="VT primary" value={value.vtPrimaryV} onChange={(vtPrimaryV) => onChange({ ...value, vtPrimaryV })} unit="V" /><Num label="VT secondary" value={value.vtSecondaryV} onChange={(vtSecondaryV) => onChange({ ...value, vtSecondaryV })} unit="V" /><Num label="Nominal system voltage" value={value.nominalVoltageV} onChange={(nominalVoltageV) => onChange({ ...value, nominalVoltageV })} unit="V" /><Num label="Nominal frequency" value={value.nominalFrequencyHz} onChange={(nominalFrequencyHz) => onChange({ ...value, nominalFrequencyHz })} unit="Hz" /><Num label="Breaker opening time" value={value.breakerOpenTimeS} onChange={(breakerOpenTimeS) => onChange({ ...value, breakerOpenTimeS })} unit="s" step="0.01" /><Num label="Trip pulse duration" value={value.tripPulseS} onChange={(tripPulseS) => onChange({ ...value, tripPulseS })} unit="s" step="0.01" /><Num label="Minimum relay operating time" value={value.minimumTripTimeS} onChange={(minimumTripTimeS) => onChange({ ...value, minimumTripTimeS })} unit="s" step="0.01" />
      </div>}
      {measurement && <div className="rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px]">
        {trip ? <><strong>{trip.iec} trips in {trip.totalTimeS.toFixed(3)} s</strong><div>{trip.name} · measured {trip.measured.toFixed(2)} {trip.unit} · pickup {trip.pickup.toFixed(2)} {trip.unit}</div></> : "No protection function started for the applied measurement."}
      </div>}
    </div>
  );
}
