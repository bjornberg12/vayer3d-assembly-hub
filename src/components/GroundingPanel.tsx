import { useMemo } from "react";
import { DraggablePanel } from "./DraggablePanel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  groundingCheck,
  type GroundingSettings,
  type GroundingSource,
  type GroundingTarget,
} from "@/lib/grounding";
import type { SolverWire } from "@/ModelLibrary/sources/solver";

interface Props {
  settings: GroundingSettings;
  onChange: (settings: GroundingSettings) => void;
  sources: GroundingSource[];
  targets: GroundingTarget[];
  wires: SolverWire[];
  onClose: () => void;
}
const fields = {
  sourceR: ["Supply R (Ω / phase)", 0],
  sourceX: ["Supply X (Ω / phase)", 0],
  faultR: ["Fault resistance (Ω / fault)", 0],
  electrodeA: ["RA, local earth + PE (Ω)", 0.001],
  electrodeB: ["RB, supply earth (Ω)", 0.001],
  insulationR: ["Whole-system insulation Req (Ω)", 1],
  capacitanceUF: ["Total earth capacitance CΣ (µF)", 0],
  frequency: ["Frequency (Hz)", 1],
  touchLimit: ["Selected voltage limit (V AC)", 1],
  tripCurrent: ["Ia at required time (A)", 0.001],
  rcdMA: ["RCD IΔn (mA)", 0.001],
  clearingTime: ["Assumed clearing time (s)", 0.001],
  maxClearingTime: ["Required clearing time (s)", 0.001],
} as const;

export function GroundingPanel({ settings: s, onChange, sources, targets, wires, onClose }: Props) {
  const result = useMemo(
    () =>
      groundingCheck(
        s,
        sources.find((x) => x.id === s.sourceId),
        targets.find((x) => x.id === s.faultPin),
        wires,
        targets.find((x) => x.id === s.secondFaultPin),
      ),
    [s, sources, targets, wires],
  );
  const change = (patch: Partial<GroundingSettings>) => onChange({ ...s, ...patch });
  const numeric = (key: keyof typeof fields) => {
    const [label, min] = fields[key];
    return (
      <label key={key} className="grid min-w-0 gap-1 text-xs text-muted-foreground">
        {label}
        <Input
          aria-label={label}
          type="number"
          min={min}
          step="any"
          value={s[key]}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            if (Number.isFinite(n) && n >= min) change({ [key]: n });
          }}
          className="h-8 bg-background text-foreground"
        />
      </label>
    );
  };
  const labelNode = (node: string) => targets.find((t) => t.id === node)?.label ?? node;
  return (
    <DraggablePanel
      title="Grounding & earth faults"
      initialX={16}
      initialY={90}
      width={420}
      onClose={onClose}
    >
      <div className="space-y-4 bg-card p-4 text-foreground">
        <div className="flex gap-1" role="group" aria-label="Grounding system">
          {(["TN", "TT", "IT"] as const).map((system) => (
            <Button
              key={system}
              size="sm"
              variant={s.system === system ? "default" : "outline"}
              aria-pressed={s.system === system}
              onClick={() => change({ system, secondFaultPin: "" })}
            >
              {system}
            </Button>
          ))}
        </div>
        <label className="grid gap-1 text-xs">
          Supply
          <select
            aria-label="Grounding supply"
            value={s.sourceId}
            onChange={(e) => change({ sourceId: e.target.value })}
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
          >
            <option value="">Select supply</option>
            {sources.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label} · {x.voltageLL.toFixed(0)} V
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Phase-to-chassis fault
          <select
            aria-label="Earth fault location"
            value={s.faultPin}
            onChange={(e) => change({ faultPin: e.target.value })}
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
          >
            <option value="">Select phase terminal</option>
            {targets.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        {s.system === "IT" && (
          <label className="grid gap-1 text-xs">
            Second fault
            <select
              aria-label="IT second fault"
              value={s.secondFaultPin}
              onChange={(e) => change({ secondFaultPin: e.target.value })}
              className="w-full rounded-md border border-input bg-background p-2 text-sm"
            >
              <option value="">First fault only</option>
              {targets
                .filter((t) => t.id !== s.faultPin)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
            </select>
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          {numeric("sourceR")}
          {numeric("sourceX")}
          {numeric("faultR")}
          {numeric("touchLimit")}
          {s.system !== "TN" && numeric("electrodeA")}
          {s.system === "TT" && numeric("electrodeB")}
          {s.system === "IT" && (
            <>
              {numeric("insulationR")}
              {numeric("capacitanceUF")}
              {numeric("frequency")}
            </>
          )}
        </div>
        {s.system === "TT" && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.rcdEnabled}
              onChange={(e) => change({ rcdEnabled: e.target.checked })}
            />
            RCD protection selected
          </label>
        )}
        {(s.system !== "IT" || s.secondFaultPin) && (
          <div className="grid grid-cols-2 gap-3">
            {s.system === "TT" ? numeric("rcdMA") : numeric("tripCurrent")}
            {numeric("clearingTime")}
            {numeric("maxClearingTime")}
          </div>
        )}
        <section
          aria-label="Earth fault results"
          className="space-y-2 border-t border-border pt-3 text-sm"
          aria-live="polite"
        >
          {!result.available ? (
            <p className="text-muted-foreground">{result.reason}</p>
          ) : (
            <>
              <h3 className="font-semibold">
                {result.firstIT
                  ? "IT first fault"
                  : result.secondFault
                    ? "IT second fault"
                    : `${s.system} earth fault`}
              </h3>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                <dt>Fault current</dt>
                <dd className="font-mono" data-testid="earth-fault-current">
                  {result.current.toFixed(3)} A
                </dd>
                <dt>Loop |Z|</dt>
                <dd className="font-mono">{result.loopZ.toFixed(4)} Ω</dd>
                <dt>Prospective voltage rise</dt>
                <dd className="font-mono" data-testid="touch-voltage">
                  {result.touch.toFixed(2)} V
                </dd>
              </dl>
              <p className={result.touchOK ? "text-foreground" : "text-destructive"}>
                Voltage screen: {result.touchOK ? "within" : "exceeds"} selected {s.touchLimit} V
                limit.
              </p>
              {result.firstIT ? (
                <p>
                  Insulation monitoring, alarm and fault location required; continued operation is
                  not assessed.
                </p>
              ) : (
                <>
                  <p className={result.protectionOK ? "text-foreground" : "text-destructive"}>
                    Protection screen:{" "}
                    {result.protectionOK
                      ? "selected numerical criteria met"
                      : "selected criteria not met"}
                    .
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pickup: {result.pickup ? "reached" : "not reached"} · Assumed clearing time:{" "}
                    {result.timeOK ? "within limit" : "too long"}
                  </p>
                </>
              )}
              {result.electrodeCriterion !== null && (
                <p className="text-xs">
                  RA × IΔn = {((s.electrodeA * s.rcdMA) / 1000).toFixed(2)} V:{" "}
                  {result.electrodeCriterion ? "criterion met" : "criterion not met"}. This is not
                  the actual fault voltage.
                </p>
              )}
              <p className="text-xs">{result.pathText}</p>
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Conducting routes</summary>
                <p className="mt-2 break-words">
                  Phase: {result.phaseNodes.map(labelNode).join(" → ")}
                </p>
                {result.returnNodes.length > 0 && (
                  <p className="mt-2 break-words">
                    Return: {result.returnNodes.map(labelNode).join(" → ")}
                  </p>
                )}
                <p className="mt-2 break-words">
                  Branches: {[...result.phaseWires, ...result.returnWires].join(", ")}
                </p>
                <p className="mt-2">
                  Representative routes shown; parallel resistance paths are included.
                </p>
              </details>
            </>
          )}
        </section>
        <section className="space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>
            Preliminary LV AC study, not a safety certification. Prospective voltage rise is not
            actual human contact voltage. Check local rules, measured earth/loop impedances and
            device curves.
          </p>
          <p>
            Supply R/X are user-entered equivalents at the selected supply; cable/wire resistance
            and closed breaker paths come from the scene. Conductor reactance, temperature
            corrections, soil gradients, bonding geometry and protection timing are not simulated.
            Faults do not trip the live scene.
          </p>
          <p>
            {s.system === "TN"
              ? "TN assumes one N–PE bond at the selected supply and explicit separate PE return wiring (TN-S equivalent). TN-C/PEN faults are not assessed."
              : s.system === "TT"
                ? "TT assumes separate local/supply electrodes, with RA attached to the selected chassis. Parallel metallic earth returns are outside this model."
                : "IT assumes an isolated supply, balanced whole-system earth admittance and RA at the chassis. CΣ includes all conductors; Req is the parallel insulation equivalent. Second-fault checks cover different phases with shared PE only; reported voltage is between faulted enclosures."}
          </p>
          <a
            className="underline"
            href="https://www.electrical-installation.org/enwiki/Protection_against_electric_shock"
            target="_blank"
            rel="noreferrer"
          >
            Calculation reference (online)
          </a>
        </section>
      </div>
    </DraggablePanel>
  );
}
