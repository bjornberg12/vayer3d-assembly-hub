import type { PinDef } from "../car-components/EVComponents";
export type InstrumentKind = "ct" | "vt";
export type InstrumentValues = Record<string, string | number | undefined>;
export function instrumentDefaults(kind: InstrumentKind) {
  return { modelId: kind === "ct" ? "CT-RMS-400" : "VT-RMS-10000", mass: 2, material: "Insulating resin / copper", height: 0.3, width: 0.32, depth: 0.18, phases: 1, frequency: 50,
    primaryRange: kind === "ct" ? 400 : 10000, secondaryRating: kind === "ct" ? 5 : 100,
    outputMode: "4-20mA", complianceV: 24, outputR: 10, host: "", fraction: 0.5, conductor: 0, reference: "" };
}
export function instrumentPins(kind: InstrumentKind): PinDef[] {
  const out: PinDef[] = [
    { id: "outp", label: "Analog +", role: "sig", local: [-0.07, 0.3, 0.11] },
    { id: "outn", label: "Analog − / COM", role: "dc-", local: [0.07, 0.3, 0.11] },
  ];
  return kind === "ct" ? out : [...out,
    { id: "p1", label: "P1 voltage tap", role: "L1", local: [-0.11, 0.24, -0.06] },
    { id: "p2", label: "P2 reference", role: "N", local: [0.11, 0.24, -0.06] }];
}
export function instrumentReading(kind: InstrumentKind, v: InstrumentValues, primary: number | null, ac: boolean) {
  const range = Math.max(Number(v.primaryRange ?? (kind === "ct" ? 400 : 10000)), 0.001);
  const ratio = primary === null ? 0 : Math.max(primary, 0) / range;
  const mode = String(v.outputMode ?? "4-20mA");
  const fraction = Math.min(ratio, 1);
  // Conventional magnetic CTs/VTs do not measure DC. These models include an RMS transmitter.
  const valid = primary !== null && ac;
  const output = valid ? mode === "4-20mA" ? 0.004 + 0.016 * fraction : (mode === "0-5V" ? 5 : 10) * fraction : 0;
  return { primary, secondary: valid ? ratio * Number(v.secondaryRating ?? (kind === "ct" ? 5 : 100)) : 0,
    output, mode, valid, overrange: ratio > 1, state: primary === null ? "No primary connection" : !ac ? "AC instrument — DC unsupported" : ratio > 1 ? "Overrange — output limited" : "Measuring" };
}