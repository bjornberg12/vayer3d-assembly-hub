/**
 * EV charger — AC wallbox, AC pedestal or DC fast charger.
 * Model-specific parameters are stored in the object's property values (keys from CHARGER_PARAMS).
 */
import { Part } from "@/components/PartLabel";
import { layoutPins, type PinDef } from "../car-components/EVComponents";

export type ChargerKind = "ac-wall" | "ac-pedestal" | "dc-fast";

export type ChargerParam =
  | { key: string; label: string; kind: "select"; options: string[] }
  | { key: string; label: string; kind: "number"; unit?: string; min: number; max: number; step: number }
  | { key: string; label: string; kind: "toggle" };

export const CHARGER_KIND_LABEL: Record<ChargerKind, string> = {
  "ac-wall": "AC wallbox",
  "ac-pedestal": "AC pedestal",
  "dc-fast": "DC fast charger",
};

export const CHARGER_PARAMS: ChargerParam[] = [
  { key: "chargerType", label: "Charger type", kind: "select", options: Object.keys(CHARGER_KIND_LABEL) },
  { key: "connector", label: "Connector", kind: "select", options: ["Type 2", "CCS2", "CHAdeMO", "Type 2 + CCS2"] },
  { key: "outlets", label: "Outlets", kind: "number", min: 1, max: 2, step: 1 },
  { key: "outputPower", label: "Max output power", kind: "number", unit: "kW", min: 3.7, max: 350, step: 0.1 },
  { key: "outVMin", label: "Output voltage min", kind: "number", unit: "V", min: 0, max: 1000, step: 10 },
  { key: "outVMax", label: "Output voltage max", kind: "number", unit: "V", min: 0, max: 1000, step: 10 },
  { key: "outCurrent", label: "Max output current", kind: "number", unit: "A", min: 6, max: 500, step: 1 },
  { key: "inputSupply", label: "Input supply", kind: "select", options: ["230 V 1-phase", "400 V 3-phase"] },
  { key: "inputCurrent", label: "Input current", kind: "number", unit: "A", min: 6, max: 630, step: 1 },
  { key: "efficiency", label: "Efficiency", kind: "number", unit: "%", min: 80, max: 99, step: 0.5 },
  { key: "powerFactor", label: "Power factor", kind: "number", min: 0.8, max: 1, step: 0.01 },
  { key: "tethered", label: "Tethered cable", kind: "toggle" },
  { key: "cableLength", label: "Cable length", kind: "number", unit: "m", min: 0, max: 10, step: 0.5 },
  { key: "rcdType", label: "RCD type", kind: "select", options: ["Type A", "Type B", "Type A + 6 mA DC"] },
  { key: "breaker", label: "Overcurrent breaker", kind: "number", unit: "A", min: 6, max: 630, step: 1 },
  { key: "loadMgmt", label: "Load management", kind: "toggle" },
  { key: "loadLimit", label: "Load limit", kind: "number", unit: "A", min: 6, max: 630, step: 1 },
  { key: "ocpp", label: "Communication", kind: "select", options: ["OCPP 1.6", "OCPP 2.0.1", "None"] },
  { key: "payment", label: "Payment", kind: "select", options: ["RFID", "App", "Card", "RFID + App + Card"] },
  { key: "ipRating", label: "IP rating", kind: "select", options: ["IP54", "IP55", "IP65"] },
  { key: "ikRating", label: "IK rating", kind: "select", options: ["IK08", "IK10"] },
  { key: "tempMin", label: "Operating temp min", kind: "number", unit: "°C", min: -50, max: 0, step: 1 },
  { key: "tempMax", label: "Operating temp max", kind: "number", unit: "°C", min: 20, max: 60, step: 1 },
];

/** Defaults per charger kind: basic + model-specific values. */
export function chargerDefaults(kind: ChargerKind): Record<string, string | number> {
  const common = { chargerType: kind, efficiency: 94, powerFactor: 0.99, rcdType: "Type A + 6 mA DC", loadMgmt: 0, ocpp: "OCPP 1.6", payment: "RFID + App + Card", ikRating: "IK10", tempMin: -30, tempMax: 50, voltageKind: "AC", frequency: 50, material: "Steel / polycarbonate" };
  if (kind === "dc-fast")
    return { ...common, modelId: "DCFC-150", connector: "Type 2 + CCS2", outlets: 2, outputPower: 150, outVMin: 150, outVMax: 920, outCurrent: 200, inputSupply: "400 V 3-phase", inputCurrent: 250, tethered: 1, cableLength: 5, breaker: 250, loadLimit: 250, ipRating: "IP55", efficiency: 95, rcdType: "Type B", mass: 350, height: 2, width: 0.8, depth: 0.6, nominalVoltage: 400, ratedPower: 150, phases: 3 };
  if (kind === "ac-pedestal")
    return { ...common, modelId: "ACP-22", connector: "Type 2", outlets: 2, outputPower: 22, outVMin: 230, outVMax: 400, outCurrent: 32, inputSupply: "400 V 3-phase", inputCurrent: 63, tethered: 0, cableLength: 0, breaker: 63, loadLimit: 63, ipRating: "IP54", mass: 45, height: 1.4, width: 0.35, depth: 0.25, nominalVoltage: 400, ratedPower: 44, phases: 3 };
  return { ...common, modelId: "ACW-11", connector: "Type 2", outlets: 1, outputPower: 11, outVMin: 230, outVMax: 400, outCurrent: 16, inputSupply: "400 V 3-phase", inputCurrent: 16, tethered: 1, cableLength: 5, breaker: 20, loadLimit: 16, ipRating: "IP54", mass: 6, height: 0.45, width: 0.3, depth: 0.15, nominalVoltage: 400, ratedPower: 11, phases: 3 };
}

/** Power drawn from the supply in kW (output ÷ efficiency). */
export const chargerInputKw = (v: Record<string, string | number>) =>
  (Number(v.outputPower) || 0) / ((Number(v.efficiency) || 100) / 100);

const BODY = "#e5e7eb";
const DARK = "#1f2937";
const ACCENT = "#22c55e";

export function EVCharger({ kind = "ac-wall" }: { kind?: string }) {
  if (kind === "dc-fast")
    return (
      <group>
        <Part name="Charger plinth"><mesh position={[0, 0.05, 0]}><boxGeometry args={[0.9, 0.1, 0.7]} /><meshStandardMaterial color="#9ca3af" /></mesh></Part>
        <Part name="DC charger cabinet"><mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[0.8, 1.9, 0.6]} /><meshStandardMaterial color={BODY} metalness={0.3} roughness={0.5} /></mesh></Part>
        <Part name="Display"><mesh position={[0, 1.5, 0.301]}><planeGeometry args={[0.45, 0.3]} /><meshStandardMaterial color={DARK} emissive="#0ea5e9" emissiveIntensity={0.25} /></mesh></Part>
        <Part name="Status light"><mesh position={[0, 1.85, 0.301]}><planeGeometry args={[0.6, 0.05]} /><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.8} /></mesh></Part>
        {[-0.5, 0.5].map((x) => (
          <Part key={x} name="CCS2 connector holster"><mesh position={[x * 0.85, 1.1, 0]}><boxGeometry args={[0.08, 0.25, 0.15]} /><meshStandardMaterial color={DARK} /></mesh></Part>
        ))}
      </group>
    );
  if (kind === "ac-pedestal")
    return (
      <group>
        <Part name="Pedestal base"><mesh position={[0, 0.04, 0]}><boxGeometry args={[0.4, 0.08, 0.3]} /><meshStandardMaterial color="#9ca3af" /></mesh></Part>
        <Part name="AC pedestal"><mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[0.35, 1.3, 0.25]} /><meshStandardMaterial color={BODY} /></mesh></Part>
        {[-1, 1].map((s) => (
          <Part key={s} name="Type 2 socket"><mesh position={[0.176 * s, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 0.02, 16]} /><meshStandardMaterial color={DARK} /></mesh></Part>
        ))}
        <Part name="Status light"><mesh position={[0, 1.3, 0.126]}><planeGeometry args={[0.2, 0.03]} /><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.8} /></mesh></Part>
      </group>
    );
  return (
    <group>
      <Part name="Mounting post"><mesh position={[0, 0.6, -0.1]} castShadow><boxGeometry args={[0.12, 1.2, 0.08]} /><meshStandardMaterial color="#6b7280" /></mesh></Part>
      <Part name="AC wallbox"><mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[0.3, 0.45, 0.15]} /><meshStandardMaterial color={BODY} /></mesh></Part>
      <Part name="Status light"><mesh position={[0, 1.25, 0.076]}><planeGeometry args={[0.15, 0.025]} /><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.8} /></mesh></Part>
      <Part name="Type 2 connector"><mesh position={[0.18, 0.95, 0.03]}><boxGeometry args={[0.05, 0.12, 0.06]} /><meshStandardMaterial color={DARK} /></mesh></Part>
    </group>
  );
}

/** Connection pins: supply in (bottom) and vehicle outlet (front). */
export function chargerPins(kind: string): PinDef[] {
  const supply = layoutPins([["in-l1", "Supply L1", "L1"], ["in-l2", "Supply L2", "L2"], ["in-l3", "Supply L3", "L3"], ["in-n", "Supply N", "N"], ["in-pe", "Supply PE", "PE"]], 0.15, 0, 0.0)
    .map((p) => ({ ...p, local: [p.local[0], p.local[1], kind === "dc-fast" ? 0.36 : 0.18] as [number, number, number] }));
  const y = kind === "dc-fast" ? 1.2 : kind === "ac-pedestal" ? 0.95 : 1.0;
  const z = kind === "dc-fast" ? 0.36 : kind === "ac-pedestal" ? 0.18 : 0.12;
  const out = layoutPins(
    kind === "dc-fast"
      ? [["dcp", "Outlet DC+", "dc+"], ["dcn", "Outlet DC−", "dc-"], ["pe", "Outlet PE", "PE"], ["cp", "CP", "sig"], ["pp", "PP", "sig"]]
      : [["l1", "Outlet L1", "L1"], ["l2", "Outlet L2", "L2"], ["l3", "Outlet L3", "L3"], ["n", "Outlet N", "N"], ["pe", "Outlet PE", "PE"], ["cp", "CP", "sig"], ["pp", "PP", "sig"]],
    y,
  ).map((p) => ({ ...p, local: [p.local[0], p.local[1], z] as [number, number, number] }));
  return [...supply, ...out];
}
