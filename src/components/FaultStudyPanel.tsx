import { useEffect, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { faultAtNode } from "@/ModelLibrary/grid/faultNetwork";
import { FAULT_TYPE_LABEL, type FaultResult, type FaultType } from "@/ModelLibrary/grid/shortCircuit";
import type { FaultNetwork } from "@/ModelLibrary/grid/faultNetwork";

const NumberField = ({ label, value, onChange, unit }: { label: string; value: number; onChange: (value: number) => void; unit?: string }) => (
  <label className="grid gap-1 text-[10px] text-muted-foreground">{label}<span className="flex items-center gap-1"><Input aria-label={label} type="number" min={0} step="any" className="h-8 font-mono text-xs" value={value} onChange={(event) => onChange(Number(event.target.value))} />{unit && <span>{unit}</span>}</span></label>
);

export function FaultStudyPanel({ network, onResult }: { network: FaultNetwork; onResult: (result: FaultResult | null) => void }) {
  const nodeIds = useMemo(() => Object.keys(network.nodes).filter((id) => !id.includes("__")), [network]);
  const [nodeId, setNodeId] = useState("");
  const [type, setType] = useState<FaultType>("3ph");
  const [range, setRange] = useState<"max" | "min">("max");
  const [faultR, setFaultR] = useState(0);
  const [clearingS, setClearingS] = useState(0.2);
  const [breakingKA, setBreakingKA] = useState(20);
  useEffect(() => {
    if (!network.nodes[nodeId]) setNodeId(nodeIds[0] ?? "");
  }, [nodeId, nodeIds, network.nodes]);
  const result = useMemo(() => nodeId ? faultAtNode(network, nodeId, type, range, faultR) : null, [network, nodeId, type, range, faultR]);
  useEffect(() => onResult(result), [result, onResult]);

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 grid gap-1 text-muted-foreground">Fault point in the connected scene
          <select aria-label="Fault point" className="h-8 rounded-md border border-input bg-background px-2" value={nodeId} onChange={(event) => setNodeId(event.target.value)}>
            {nodeIds.map((id) => <option key={id} value={id}>{network.nodes[id]?.label} · {id} · {((network.nodes[id]?.un ?? 0) / 1000).toFixed(2)} kV</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-muted-foreground">Fault type
          <select aria-label="Fault type" className="h-8 rounded-md border border-input bg-background px-2" value={type} onChange={(event) => setType(event.target.value as FaultType)}>{Object.entries(FAULT_TYPE_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
        </label>
        <label className="grid gap-1 text-muted-foreground">Study case
          <select aria-label="Study case" className="h-8 rounded-md border border-input bg-background px-2" value={range} onChange={(event) => setRange(event.target.value as "max" | "min")}><option value="max">Maximum fault current</option><option value="min">Minimum fault current</option></select>
        </label>
        <NumberField label="Fault resistance" value={faultR} onChange={setFaultR} unit="Ω" />
        <NumberField label="Protection clearing time" value={clearingS} onChange={setClearingS} unit="s" />
        <NumberField label="Breaker breaking rating" value={breakingKA} onChange={setBreakingKA} unit="kA" />
      </div>
      {!nodeIds.length && <p className="rounded-md border border-border p-3 text-muted-foreground">Add a utility infeed or AC source and connect cables or lines to calculate a fault.</p>}
      {nodeId && !result && <p className="rounded-md border border-destructive p-3 text-destructive">No closed path from a source to this point. Close the required switches or choose another fault point.</p>}
      {result && <>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border bg-muted/30 p-2"><div className="text-[10px] text-muted-foreground">Initial symmetrical Ik″</div><strong className="text-lg">{(result.ik / 1000).toFixed(3)} kA</strong></div>
          <div className="rounded-md border border-border bg-muted/30 p-2"><div className="text-[10px] text-muted-foreground">Peak making current ip</div><strong className="text-lg">{(result.ip / 1000).toFixed(3)} kA</strong></div>
          <div className="rounded-md border border-border bg-muted/30 p-2"><div className="text-[10px] text-muted-foreground">Residual 3I₀</div><strong className="text-lg">{(result.residualA / 1000).toFixed(3)} kA</strong></div>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left font-mono text-[11px]"><tbody>
            <tr className="border-b border-border"><td className="p-2">Phase currents L1 / L2 / L3</td><td className="p-2 text-right">{result.phaseA.map((current) => (current / 1000).toFixed(3)).join(" / ")} kA</td></tr>
            <tr className="border-b border-border"><td className="p-2">Sequence currents I₁ / I₂ / I₀</td><td className="p-2 text-right">{[result.sequenceA.i1, result.sequenceA.i2, result.sequenceA.i0].map((current) => (current / 1000).toFixed(3)).join(" / ")} kA</td></tr>
            <tr className="border-b border-border"><td className="p-2">Thévenin Z₁ = R + jX</td><td className="p-2 text-right">{result.z1.r.toFixed(5)} + j{result.z1.x.toFixed(5)} Ω</td></tr>
            <tr className="border-b border-border"><td className="p-2">DC time constant · κ</td><td className="p-2 text-right">{(result.dcTimeConstantS * 1000).toFixed(1)} ms · {result.kappa.toFixed(3)}</td></tr>
            <tr><td className="p-2">Adiabatic I²t at clearing time</td><td className="p-2 text-right">{(result.i2t(clearingS) / 1e6).toFixed(3)} MA²s</td></tr>
          </tbody></table>
        </div>
        <p className={result.ik <= breakingKA * 1000 ? "text-foreground" : "font-semibold text-destructive"}>Breaking check: required {(result.ib / 1000).toFixed(2)} kA ≤ rating {breakingKA.toFixed(2)} kA — {result.ik <= breakingKA * 1000 ? "OK" : "FAIL"}</p>
        <p className="text-[10px] text-muted-foreground">IEC 60909 equivalent source, c = {result.c}. Meshed positive/negative-sequence paths are solved together. Zero-sequence conductor impedance defaults to 3× positive sequence; Dyn transformers block upstream zero-sequence current. Confirm earthing and zero-sequence data before issuing construction settings.</p>
      </>}
    </div>
  );
}
