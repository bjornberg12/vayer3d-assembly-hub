import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instrumentDefaults, type InstrumentKind, type InstrumentValues, type instrumentReading } from "./instruments";
export type InstrumentHostOption = { id: string; label: string; conductors: number };
export function InstrumentEditor({ kind, values, hosts, references, reading, terminalV, terminalI, setValues, remove }: {
  kind: InstrumentKind; values: InstrumentValues; hosts: InstrumentHostOption[]; references: { id: string; label: string }[];
  reading: ReturnType<typeof instrumentReading>; terminalV: number; terminalI: number;
  setValues: (patch: Record<string, string | number>) => void; remove: () => void;
}) {
  const v = { ...instrumentDefaults(kind), ...values };
  const host = hosts.find((h) => h.id === v.host);
  const input = "w-full min-w-0 rounded border border-input bg-background px-2 py-1 text-foreground";
  return <section className="space-y-3 text-xs text-foreground">
    <h3 className="border-b border-border pb-1 font-semibold">Measurement &amp; transmitter</h3>
    <label className="block space-y-1"><span>Mounted conductor</span>
      <Select value={host?.id ?? "none"} onValueChange={(id) => setValues({ host: id === "none" ? "" : id, conductor: 0 })}>
        <SelectTrigger aria-label="Mounted conductor"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unattached</SelectItem>{hosts.map((h) => <SelectItem key={h.id} value={h.id}>{h.label}</SelectItem>)}</SelectContent>
      </Select>
    </label>
    {host && <>
      {host.conductors > 1 && <label className="block space-y-1"><span>Cable core</span><Select value={String(v.conductor)} onValueChange={(value) => setValues({ conductor: Number(value) })}><SelectTrigger aria-label="Cable core"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: host.conductors }, (_, k) => <SelectItem key={k} value={String(k)}>{["L1", "L2", "L3", "N"][k]}</SelectItem>)}</SelectContent></Select></label>}
      <label className="block">Position along conductor · {(Number(v.fraction) * 100).toFixed(0)}%<input aria-label="Position along conductor" className="w-full" type="range" min={0} max={1} step={0.01} value={Number(v.fraction)} onChange={(e) => setValues({ fraction: Number(e.target.value) })} /></label>
    </>}
    {kind === "vt" && <label className="block space-y-1"><span>Voltage reference</span><Select value={String(v.reference || "pin")} onValueChange={(id) => setValues({ reference: id === "pin" ? "" : id })}><SelectTrigger aria-label="Voltage reference"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pin">Wired P2 reference pin</SelectItem>{references.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent></Select></label>}
    {[{ key: "primaryRange", label: kind === "ct" ? "Primary rated current (A)" : "Primary rated voltage (V)", min: 0.001 }, { key: "secondaryRating", label: kind === "ct" ? "Ratio secondary (A)" : "Ratio secondary (V)", min: 0.001 }, { key: "complianceV", label: "Loop compliance (V)", min: 1 }, { key: "outputR", label: "Voltage output resistance (Ω)", min: 0.001 }].map((p) => <label key={p.key} className="grid grid-cols-[1fr_85px] items-center gap-2"><span>{p.label}</span><input aria-label={p.label} className={input} type="number" min={p.min} step="any" value={Number(v[p.key as keyof typeof v])} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= p.min) setValues({ [p.key]: n }); }} /></label>)}
    <Select value={String(v.outputMode)} onValueChange={(outputMode) => setValues({ outputMode })}><SelectTrigger aria-label="Analog output mode"><SelectValue /></SelectTrigger><SelectContent>{["4-20mA", "0-10V", "0-5V"].map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent></Select>
    <div className="space-y-1 border-y border-border py-2 font-mono" data-instrument-reading>
      <div>{reading.state}</div><div>Primary: {reading.primary === null ? "—" : reading.primary.toFixed(3)} {kind === "ct" ? "A RMS" : "V RMS"}</div>
      <div>Ratio secondary: {reading.secondary.toFixed(3)} {kind === "ct" ? "A" : "V"}</div>
      <div>Analog setpoint: {(reading.mode === "4-20mA" ? reading.output * 1000 : reading.output).toFixed(3)} {reading.mode === "4-20mA" ? "mA" : "V"}</div>
      <div>Terminals: {terminalV.toFixed(3)} V · {(terminalI * 1000).toFixed(3)} mA</div>
      {reading.mode === "4-20mA" && terminalV >= Number(v.complianceV) * 0.999 && <div>Loop compliance limit / open loop</div>}
    </div>
    <Button variant="destructive" size="sm" onClick={remove}>Delete instrument</Button>
  </section>;
}